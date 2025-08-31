const { handleCors } = require('../utils/helpers');

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { phone, type = 'verification' } = req.body || {};
    
    if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
    }
    
    // Generate a random 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In a real app, we'd send SMS here via Twilio or similar
    console.log(`SMS OTP for ${phone}: ${otpCode}`);
    
    // For demo, we just return success
    // In production, we'd store the OTP in database/cache with expiration
    
    res.status(200).json({ 
        success: true, 
        message: 'OTP sent successfully',
        // Debug info for demo (remove in production)
        debug_otp: otpCode
    });
};