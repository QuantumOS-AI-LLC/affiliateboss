// User signup
import { handleCORS, generateApiKey, hashPassword } from '../_utils.js'

export default async function handler(req, res) {
  if (handleCORS(req, res)) return

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { first_name, last_name, email, phone, username } = req.body || {}
  
  if (!first_name || !last_name || !email || !phone || !username) {
    return res.status(400).json({ error: 'All fields are required' })
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' })
  }
  
  // Validate phone format
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number format' })
  }
  
  try {
    // For demo purposes, simulate successful registration
    // In production, store in database and send verification SMS
    
    const apiKey = generateApiKey()
    
    // Simulate database insertion
    const newUser = {
      id: Math.floor(Math.random() * 1000) + 100,
      first_name,
      last_name,
      email,
      phone,
      username,
      api_key: apiKey,
      status: 'pending_verification',
      created_at: new Date().toISOString()
    }
    
    // Send OTP for verification (simulated)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    console.log(`Verification SMS for ${phone}: ${otpCode}`)
    
    return res.status(200).json({ 
      success: true, 
      message: 'Account created successfully. Please verify your phone number.',
      user_id: newUser.id,
      // For demo purposes, return the OTP code (remove in production)
      debug_otp: otpCode
    })
    
  } catch (error) {
    console.error('Signup error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}