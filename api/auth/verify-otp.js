const { handleCors, generateApiKey } = require('../utils/helpers');

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { phone, code } = req.body || {};
    
    if (!phone || !code) {
        return res.status(400).json({ error: 'Phone and OTP code required' });
    }
    
    // Basic validation
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
        return res.status(400).json({ error: 'Invalid OTP format' });
    }
    
    // For demo, accept any 6-digit code
    // In real app, we'd verify against stored OTP
    
    // Return demo API key for testing
    const demoApiKey = 'api_key_john_123456789';
    
    res.status(200).json({ 
        success: true, 
        token: demoApiKey,
        user: {
            id: 1,
            phone: phone,
            username: 'john_demo',
            api_key: demoApiKey
        }
    });
};