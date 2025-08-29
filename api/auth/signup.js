export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { first_name, last_name, email, phone, username } = req.body || {};
  
  if (!first_name || !last_name || !email || !phone || !username) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  // Validate phone format
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number format' });
  }
  
  // Generate fake OTP for demo
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`Verification SMS for ${phone}: ${otpCode}`);
  
  return res.status(200).json({ 
    success: true, 
    message: 'Account created successfully. Please verify your phone number.',
    user_id: Math.floor(Math.random() * 1000) + 100,
    debug_otp: otpCode // For demo purposes only
  });
}