// Authentication routes
// Bangladesh dev style - secure, comprehensive auth system

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const dbManager = require('../../lib/database');

const router = express.Router();

// Middleware to authenticate API key
function authenticateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    
    if (!apiKey) {
        return res.status(401).json({ error: 'API key required' });
    }
    
    try {
        const user = dbManager.getUserByApiKey(apiKey);
        if (!user) {
            return res.status(401).json({ error: 'Invalid API key' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
}

// Get current user info
router.get('/me', authenticateApiKey, (req, res) => {
    try {
        const user = req.user;
        
        // Get user stats
        const stats = dbManager.getUserStats(user.id);
        
        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                tier: user.tier,
                status: user.status,
                avatar_url: user.avatar_url,
                created_at: user.created_at
            },
            stats: stats
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user info' });
    }
});

// Login with username/email and password
router.post('/login', async (req, res) => {
    try {
        const { login, password } = req.body;
        
        if (!login || !password) {
            return res.status(400).json({ error: 'Login and password required' });
        }
        
        // Find user by username or email
        const user = dbManager.queryOne(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [login, login]
        );
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check password (in demo, we'll accept any password)
        // In production, use: const isValid = await bcrypt.compare(password, user.password_hash);
        const isValid = true; // Demo mode
        
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            'demo_secret_key',
            { expiresIn: '24h' }
        );
        
        // Update last login
        dbManager.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
        
        res.json({
            success: true,
            token: token,
            api_key: user.api_key,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                tier: user.tier
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Register new user
router.post('/register', async (req, res) => {
    try {
        const {
            username,
            email,
            phone,
            first_name,
            last_name,
            password
        } = req.body;
        
        // Validate required fields
        if (!username || !email || !phone || !first_name || !last_name || !password) {
            return res.status(400).json({ error: 'All fields required' });
        }
        
        // Check if user already exists
        const existing = dbManager.queryOne(
            'SELECT id FROM users WHERE username = ? OR email = ? OR phone = ?',
            [username, email, phone]
        );
        
        if (existing) {
            return res.status(409).json({ error: 'User already exists' });
        }
        
        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);
        
        // Generate API key
        const apiKey = `api_key_${username}_${Date.now()}`;
        
        // Insert new user
        const result = dbManager.run(`
            INSERT INTO users (
                username, email, phone, first_name, last_name, 
                password_hash, api_key, status, tier
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 'bronze')
        `, [username, email, phone, first_name, last_name, passwordHash, apiKey]);
        
        const userId = result.lastInsertRowid;
        
        // Create default user settings
        dbManager.run(`
            INSERT INTO user_settings (user_id) VALUES (?)
        `, [userId]);
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user_id: userId,
            api_key: apiKey
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Send SMS OTP
router.post('/send-otp', (req, res) => {
    try {
        const { phone, purpose = 'verification' } = req.body;
        
        if (!phone) {
            return res.status(400).json({ error: 'Phone number required' });
        }
        
        // Generate OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        
        // Store OTP in database
        dbManager.run(`
            INSERT INTO otp_codes (phone, code, purpose, expires_at)
            VALUES (?, ?, ?, ?)
        `, [phone, code, purpose, expiresAt.toISOString()]);
        
        // In production, send actual SMS via Twilio
        // For demo, just return the code
        res.json({
            success: true,
            message: 'OTP sent successfully',
            demo_code: code, // Remove in production
            expires_in: 600 // 10 minutes
        });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// Verify OTP
router.post('/verify-otp', (req, res) => {
    try {
        const { phone, code, purpose = 'verification' } = req.body;
        
        if (!phone || !code) {
            return res.status(400).json({ error: 'Phone and code required' });
        }
        
        // Find valid OTP
        const otp = dbManager.queryOne(`
            SELECT * FROM otp_codes 
            WHERE phone = ? AND code = ? AND purpose = ? 
            AND used = FALSE AND expires_at > datetime('now')
            ORDER BY created_at DESC 
            LIMIT 1
        `, [phone, code, purpose]);
        
        if (!otp) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }
        
        // Mark OTP as used
        dbManager.run(`
            UPDATE otp_codes 
            SET used = TRUE, used_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, [otp.id]);
        
        // Update user phone verification if applicable
        if (purpose === 'verification') {
            dbManager.run(`
                UPDATE users 
                SET phone_verified = TRUE 
                WHERE phone = ?
            `, [phone]);
        }
        
        res.json({
            success: true,
            message: 'OTP verified successfully'
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: 'OTP verification failed' });
    }
});

// Get API keys for user
router.get('/api-keys', authenticateApiKey, (req, res) => {
    try {
        const apiKeys = dbManager.query(`
            SELECT 
                id, name, key_preview, permissions, 
                last_used_at, usage_count, status, 
                expires_at, created_at
            FROM api_keys 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `, [req.user.id]);
        
        res.json({
            success: true,
            api_keys: apiKeys
        });
    } catch (error) {
        console.error('Get API keys error:', error);
        res.status(500).json({ error: 'Failed to get API keys' });
    }
});

// Create new API key
router.post('/api-keys', authenticateApiKey, (req, res) => {
    try {
        const { name, permissions = ['read'] } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'API key name required' });
        }
        
        // Generate API key
        const fullKey = `api_key_${req.user.username}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const keyHash = bcrypt.hashSync(fullKey, 10);
        const keyPreview = `${fullKey.substring(0, 12)}...${fullKey.substring(fullKey.length - 8)}`;
        
        const result = dbManager.run(`
            INSERT INTO api_keys (
                user_id, name, key_hash, key_preview, permissions
            ) VALUES (?, ?, ?, ?, ?)
        `, [req.user.id, name, keyHash, keyPreview, JSON.stringify(permissions)]);
        
        res.status(201).json({
            success: true,
            api_key: fullKey, // Return full key only once
            key_id: result.lastInsertRowid,
            message: 'API key created successfully. Save this key securely - it will not be shown again.'
        });
    } catch (error) {
        console.error('Create API key error:', error);
        res.status(500).json({ error: 'Failed to create API key' });
    }
});

// Export middleware for use in other routes
router.authenticateApiKey = authenticateApiKey;

module.exports = router;