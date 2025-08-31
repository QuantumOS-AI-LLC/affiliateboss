const { handleCors, hashPassword, generateApiKey } = require('../utils/helpers');

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    
    const { 
        first_name, 
        last_name, 
        email, 
        phone, 
        username,
        referral_code = null 
    } = req.body || {};
    
    // Validation
    const errors = [];
    
    if (!first_name || first_name.trim().length < 2) {
        errors.push('First name must be at least 2 characters');
    }
    
    if (!last_name || last_name.trim().length < 2) {
        errors.push('Last name must be at least 2 characters');
    }
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Valid email address is required');
    }
    
    if (!phone || !/^\+?[1-9]\d{1,14}$/.test(phone)) {
        errors.push('Valid phone number is required');
    }
    
    if (!username || username.trim().length < 3) {
        errors.push('Username must be at least 3 characters');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        errors.push('Username can only contain letters, numbers, hyphens, and underscores');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors
        });
    }

    // In real app:
    // 1. Check if email/username/phone already exists
    // 2. Hash any password if provided
    // 3. Generate secure user ID
    // 4. Store user in database
    // 5. Send verification SMS/email
    // 6. Process referral code if provided

    // Mock duplicate check
    const existingUsers = ['john_demo', 'admin', 'test'];
    if (existingUsers.includes(username.toLowerCase())) {
        return res.status(409).json({
            error: 'Username already taken',
            details: 'Please choose a different username'
        });
    }

    // Create new user account
    const newUser = {
        id: Math.floor(Math.random() * 100000) + 10000,
        username: username.trim(),
        email: email.toLowerCase().trim(),
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        phone: phone,
        
        // Account status
        status: 'pending_verification',
        email_verified: false,
        phone_verified: false,
        
        // Affiliate settings
        tier: 'bronze',
        api_key: generateApiKey(),
        referral_code: referral_code,
        
        // Timestamps
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        
        // Initial settings
        timezone: 'America/New_York',
        language: 'en',
        currency: 'USD'
    };

    // Process referral if provided
    let referralBonus = null;
    if (referral_code) {
        // In real app, validate referral code and give bonus
        referralBonus = {
            referrer_bonus: 50.00,
            referee_bonus: 25.00,
            message: 'Referral bonus will be applied after phone verification'
        };
    }

    return res.status(201).json({
        success: true,
        message: 'Account created successfully! Please verify your phone number to get started.',
        data: {
            user_id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            phone: newUser.phone,
            status: newUser.status,
            tier: newUser.tier,
            created_at: newUser.created_at,
            referral_bonus: referralBonus
        },
        next_steps: [
            'Verify your phone number with OTP',
            'Complete your profile setup',
            'Create your first affiliate link',
            'Start earning commissions!'
        ]
    });
};