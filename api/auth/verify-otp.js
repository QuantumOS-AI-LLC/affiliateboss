const { handleCors, generateApiKey } = require('../utils/helpers');

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    
    const { phone, code, type = 'login' } = req.body || {};
    
    if (!phone || !code) {
        return res.status(400).json({
            error: 'Phone number and OTP code are required'
        });
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(code)) {
        return res.status(400).json({
            error: 'Invalid OTP format',
            details: 'OTP must be 6 digits'
        });
    }

    // In real app:
    // 1. Lookup stored OTP from database
    // 2. Check if OTP is expired
    // 3. Verify OTP matches
    // 4. Check attempt limits
    // 5. Create or update user session

    // Demo mode - accept any 6-digit code for phone +1-555-0123 (demo user)
    const isDemoUser = phone === '+1-555-0123' || phone === '+15550123' || phone === '15550123';
    const isValidOTP = isDemoUser || code === '123456'; // Accept 123456 for any phone in demo

    if (!isValidOTP) {
        return res.status(400).json({
            error: 'Invalid OTP code',
            details: 'Please check the code and try again',
            attempts_remaining: 2
        });
    }

    // Generate session token (in real app, this would be JWT or similar)
    const authToken = generateApiKey();
    
    // Mock user data for demo
    const userData = {
        id: 1,
        username: 'john_demo',
        email: 'john.demo@affiliateboss.com',
        first_name: 'John',
        last_name: 'Demo',
        phone: phone,
        status: 'active',
        tier: 'premium',
        api_key: 'api_key_john_123456789',
        created_at: '2024-01-15T10:30:00Z',
        verified: true
    };

    return res.json({
        success: true,
        message: 'OTP verified successfully',
        data: {
            user: userData,
            token: authToken,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            session_id: `sess_${Date.now()}`,
            login_type: type
        },
        demo_note: 'In production, this would create a secure session'
    });
};