// Authentication API for Vercel
// Get current user info endpoint
// Bangladesh dev style - practical and efficient

const { getDatabase, authenticateUser, createErrorResponse, createSuccessResponse } = require('../../lib/database');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-API-Key,Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json(createErrorResponse('Method not allowed', 405));
  }

  try {
    // Get API key from headers or query
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    
    if (!apiKey) {
      return res.status(401).json(createErrorResponse('API key required', 401));
    }

    // Authenticate user
    const user = authenticateUser(apiKey);
    if (!user) {
      return res.status(401).json(createErrorResponse('Invalid API key', 401));
    }

    // Get user stats
    const db = getDatabase();
    
    // Get link statistics
    const linkStats = db.prepare(`
      SELECT 
        COUNT(*) as total_links,
        SUM(total_clicks) as total_clicks,
        SUM(total_conversions) as total_conversions,
        SUM(total_earnings) as total_earnings
      FROM affiliate_links 
      WHERE user_id = ?
    `).get(user.id);

    // Get commission statistics
    const commissionStats = db.prepare(`
      SELECT 
        COUNT(*) as total_commissions,
        SUM(commission_amount) as total_commission_amount,
        AVG(commission_rate) as avg_commission_rate
      FROM commissions 
      WHERE user_id = ? AND status = 'confirmed'
    `).get(user.id);

    // Get recent activity
    const recentActivity = db.prepare(`
      SELECT 
        'commission' as type,
        commission_amount as amount,
        sale_date as date,
        'Commission earned' as description
      FROM commissions 
      WHERE user_id = ? 
      ORDER BY sale_date DESC 
      LIMIT 10
    `).all(user.id);

    const responseData = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        tier: user.tier,
        status: user.status,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        total_earnings: user.total_earnings || 0
      },
      stats: {
        links: linkStats || { total_links: 0, total_clicks: 0, total_conversions: 0, total_earnings: 0 },
        commissions: commissionStats || { total_commissions: 0, total_commission_amount: 0, avg_commission_rate: 0 },
        recent_activity: recentActivity || []
      }
    };

    return res.status(200).json(createSuccessResponse(responseData, 'User info retrieved successfully'));

  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json(createErrorResponse('Failed to get user info', 500, error.message));
  }
};