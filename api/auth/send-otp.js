// Send OTP code via SMS
const { handleCORS } = require('../_utils.js')

module.exports = function handler(req, res) {
  if (handleCORS(req, res)) return

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { phone, type = 'verification' } = req.body || {}
  
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' })
  }
  
  // For demo purposes, simulate successful OTP sending
  // In production, integrate with SMS service like Twilio
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
  
  console.log(`SMS OTP for ${phone}: ${otpCode}`) // In production, this would be sent via SMS
  
  // Store OTP in memory/database (for demo, we'll accept any 6-digit code)
  
  return res.status(200).json({ 
    success: true, 
    message: 'OTP sent successfully',
    // For demo purposes, return the OTP code (remove in production)
    debug_otp: otpCode
  })
}