export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== 'demo_key_123') {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  if (req.method === 'GET') {
    // Return demo links
    const demoLinks = [
      {
        id: 1,
        name: "MacBook Pro M3 Max Link",
        original_url: "https://apple.com/macbook-pro",
        short_url: `${req.headers.host}/go/mbp001`,
        short_code: "mbp001",
        clicks: 2847,
        conversions: 45,
        earnings: 1529.40,
        created_at: "2024-01-15T10:30:00Z",
        status: "active"
      },
      {
        id: 2,
        name: "Tesla Model S Plaid",
        original_url: "https://tesla.com/models",
        short_url: `${req.headers.host}/go/tesla02`,
        short_code: "tesla02",
        clicks: 1056,
        conversions: 9,
        earnings: 1079.88,
        created_at: "2024-01-16T14:22:00Z",
        status: "active"
      }
    ];

    return res.status(200).json({
      success: true,
      data: demoLinks,
      total: demoLinks.length
    });
  }

  if (req.method === 'POST') {
    const { original_url, name, description = '' } = req.body || {};
    
    if (!original_url || !name) {
      return res.status(400).json({ error: 'Original URL and name are required' });
    }
    
    // Validate URL format
    try {
      new URL(original_url);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }
    
    // Generate short code
    const shortCode = Math.random().toString(36).substring(2, 8);
    const shortUrl = `${req.headers.host}/go/${shortCode}`;
    
    const newLink = {
      id: Math.floor(Math.random() * 1000) + 100,
      name: name,
      original_url: original_url,
      short_url: shortUrl,
      short_code: shortCode,
      description: description,
      clicks: 0,
      conversions: 0,
      earnings: 0,
      created_at: new Date().toISOString(),
      status: 'active'
    };
    
    return res.status(200).json({
      success: true,
      data: newLink,
      message: 'Link created successfully'
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}