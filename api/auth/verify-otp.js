// Verify OTP and login
const { handleCORS, generateApiKey } = require('../_utils.js')

module.exports = function handler(req, res) {
  if (handleCORS(req, res)) return

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { phone, code } = req.body || {}
  
  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone number and OTP code are required' })
  }
  
  // For demo purposes, accept any 6-digit code
  if (code.length !== 6 || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: 'Invalid OTP code format' })
  }
  
  // Generate demo API key for the user
  const apiKey = 'api_key_john_123456789' // Fixed demo API key
  
  return res.status(200).json({ 
    success: true, 
    token: apiKey,
    user: {
      id: 1,
      phone: phone,
      username: 'john_demo',
      api_key: apiKey
    }
  })
}