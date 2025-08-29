export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, code } = req.body || {};
  
  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone number and OTP code are required' });
  }
  
  // For demo, accept any 6-digit code
  if (code.length !== 6 || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: 'Invalid OTP code format' });
  }
  
  const apiKey = 'demo_key_123';
  
  return res.status(200).json({ 
    success: true, 
    token: apiKey,
    user: {
      id: 1,
      phone: phone,
      username: 'demo_user',
      api_key: apiKey
    }
  });
}