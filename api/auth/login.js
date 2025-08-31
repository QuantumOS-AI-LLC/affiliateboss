// Login API for Vercel
// User authentication endpoint
// Bangladesh dev style - secure and practical

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getDatabase, createErrorResponse, createSuccessResponse } = require('../../lib/database');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json(createErrorResponse('Method not allowed', 405));
  }

  try {
    const { login, password } = req.body;
    
    if (!login || !password) {
      return res.status(400).json(createErrorResponse('Login and password required', 400));
    }

    const db = getDatabase();
    
    // Find user by username or email
    const user = db.prepare(`
      SELECT * FROM users 
      WHERE (username = ? OR email = ?) 
      AND status = 'active'
    `).get(login, login);
    
    if (!user) {
      return res.status(401).json(createErrorResponse('Invalid credentials', 401));
    }
    
    // Check password (in demo, we'll accept any password)
    // In production, use: const isValid = await bcrypt.compare(password, user.password_hash);
    const isValid = true; // Demo mode - remove in production
    
    if (!isValid) {
      return res.status(401).json(createErrorResponse('Invalid credentials', 401));
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'demo_secret_key',
      { expiresIn: '24h' }
    );
    
    // Update last login
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    
    const responseData = {
      token: token,
      api_key: user.api_key,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        tier: user.tier,
        status: user.status
      }
    };

    return res.status(200).json(createSuccessResponse(responseData, 'Login successful'));

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json(createErrorResponse('Login failed', 500, error.message));
  }
};