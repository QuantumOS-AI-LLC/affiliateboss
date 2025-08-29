export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, type = 'verification' } = req.body || {};
  
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }
  
  // Generate fake OTP for demo
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  console.log(`SMS OTP for ${phone}: ${otpCode}`);
  
  return res.status(200).json({ 
    success: true, 
    message: 'OTP sent successfully',
    debug_otp: otpCode // For demo purposes only
  });
}