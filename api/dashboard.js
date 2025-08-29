export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== 'demo_key_123') {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Return demo dashboard KPIs
  const dashboardData = {
    total_clicks: 15847,
    unique_clicks: 12456,
    conversions: 387,
    conversion_rate: 2.44,
    total_commission: 2847.92,
    pending_commission: 892.45,
    paid_commission: 1955.47,
    active_links: 24,
    top_performing_link: {
      id: 1,
      name: "MacBook Pro M3 Max",
      clicks: 2847,
      conversions: 45,
      commission: 1529.40
    },
    recent_activity: [
      {
        type: 'conversion',
        product: 'MacBook Pro M3 Max',
        amount: 339.92,
        date: '2024-01-28T14:30:00Z'
      },
      {
        type: 'click',
        product: 'iPhone 15 Pro Max',
        date: '2024-01-28T13:15:00Z'
      }
    ]
  };

  return res.status(200).json({
    success: true,
    data: dashboardData
  });
}