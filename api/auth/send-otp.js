const { handleCors, generateApiKey } = require('../utils/helpers');

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    
    const { phone, type = 'login' } = req.body || {};
    
    if (!phone) {
        return res.status(400).json({
            error: 'Phone number is required',
            details: 'Please provide a valid phone number'
        });
    }

    // Basic phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
        return res.status(400).json({
            error: 'Invalid phone number format',
            details: 'Please provide a valid international phone number'
        });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // In real app:
    // 1. Check rate limits (max 3 OTP per hour per phone)
    // 2. Store OTP in database with expiration
    // 3. Send SMS using Twilio, AWS SNS, or similar service
    // 4. Log attempt for security monitoring

    // Demo mode - log the OTP for testing
    console.log(`SMS OTP for ${phone}: ${otpCode} (expires at ${expiresAt.toISOString()})`);

    // Mock SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return res.json({
        success: true,
        message: `OTP sent to ${phone}`,
        data: {
            phone: phone,
            type: type,
            expires_at: expiresAt.toISOString(),
            attempts_remaining: 3,
            // In demo mode, return OTP for testing
            demo_otp: otpCode,
            demo_note: 'In production, this would be sent via SMS'
        }
    });
};