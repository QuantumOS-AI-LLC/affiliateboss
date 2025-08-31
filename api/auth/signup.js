const { handleCors, generateApiKey } = require('../utils/helpers');

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { first_name, last_name, email, phone, username } = req.body || {};
    
    // Check required fields
    if (!first_name || !last_name || !email || !phone || !username) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Basic email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Basic phone validation
    const phonePattern = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phonePattern.test(phone)) {
        return res.status(400).json({ error: 'Invalid phone number' });
    }
    
    try {
        // In real app, we'd check if user exists and save to database
        const newApiKey = generateApiKey();
        
        const newUser = {
            id: Math.floor(Math.random() * 1000) + 100,
            first_name,
            last_name,
            email,
            phone,
            username,
            api_key: newApiKey,
            status: 'pending_verification',
            created_at: new Date().toISOString()
        };
        
        // Send verification OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`Verification OTP for ${phone}: ${otpCode}`);
        
        res.status(200).json({ 
            success: true, 
            message: 'Account created! Please verify your phone number.',
            user_id: newUser.id,
            // Debug info for demo
            debug_otp: otpCode
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};