// Analytics Dashboard API for Vercel
// Comprehensive affiliate performance analytics
// Bangladesh dev style - data-driven insights

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

    const { period = '30d', timezone = 'UTC' } = req.query;
    const db = getDatabase();

    // Calculate date range based on period
    let dateFilter = '';
    switch (period) {
      case '7d':
        dateFilter = "datetime('now', '-7 days')";
        break;
      case '30d':
        dateFilter = "datetime('now', '-30 days')";
        break;
      case '90d':
        dateFilter = "datetime('now', '-90 days')";
        break;
      case '1y':
        dateFilter = "datetime('now', '-1 year')";
        break;
      default:
        dateFilter = "datetime('now', '-30 days')";
    }

    // Get overall performance stats
    const overallStats = db.prepare(`
      SELECT 
        COUNT(DISTINCT al.id) as total_links,
        COALESCE(SUM(al.total_clicks), 0) as total_clicks,
        COALESCE(SUM(al.total_conversions), 0) as total_conversions,
        COALESCE(SUM(al.total_earnings), 0) as total_earnings,
        COALESCE(AVG(CASE WHEN al.total_clicks > 0 THEN (al.total_conversions * 1.0 / al.total_clicks * 100) END), 0) as avg_conversion_rate
      FROM affiliate_links al
      WHERE al.user_id = ?
    `).get(user.id) || { total_links: 0, total_clicks: 0, total_conversions: 0, total_earnings: 0, avg_conversion_rate: 0 };

    // Get period-specific stats
    const periodStats = db.prepare(`
      SELECT 
        COUNT(DISTINCT ct.link_id) as active_links,
        COUNT(ct.id) as period_clicks,
        COUNT(CASE WHEN ct.converted = 1 THEN 1 END) as period_conversions,
        COALESCE(SUM(ct.conversion_value), 0) as period_earnings
      FROM click_tracking ct
      JOIN affiliate_links al ON ct.link_id = al.id
      WHERE al.user_id = ? AND ct.clicked_at >= ${dateFilter}
    `).get(user.id) || { active_links: 0, period_clicks: 0, period_conversions: 0, period_earnings: 0 };

    // Get daily performance trends
    const dailyTrends = db.prepare(`
      SELECT 
        DATE(ct.clicked_at) as date,
        COUNT(ct.id) as clicks,
        COUNT(CASE WHEN ct.converted = 1 THEN 1 END) as conversions,
        COALESCE(SUM(ct.conversion_value), 0) as earnings
      FROM click_tracking ct
      JOIN affiliate_links al ON ct.link_id = al.id
      WHERE al.user_id = ? AND ct.clicked_at >= ${dateFilter}
      GROUP BY DATE(ct.clicked_at)
      ORDER BY date DESC
      LIMIT 30
    `).all(user.id) || [];

    // Get top performing links
    const topLinks = db.prepare(`
      SELECT 
        al.id,
        al.name,
        al.short_code,
        al.short_url,
        al.category,
        al.total_clicks,
        al.total_conversions,
        al.total_earnings,
        CASE WHEN al.total_clicks > 0 THEN (al.total_conversions * 1.0 / al.total_clicks * 100) ELSE 0 END as conversion_rate,
        COUNT(ct.id) as recent_clicks
      FROM affiliate_links al
      LEFT JOIN click_tracking ct ON al.id = ct.link_id AND ct.clicked_at >= ${dateFilter}
      WHERE al.user_id = ?
      GROUP BY al.id
      ORDER BY al.total_earnings DESC, al.total_clicks DESC
      LIMIT 10
    `).all(user.id) || [];

    // Get geographic performance
    const geoStats = db.prepare(`
      SELECT 
        COALESCE(ct.country, 'Unknown') as country,
        COUNT(ct.id) as clicks,
        COUNT(CASE WHEN ct.converted = 1 THEN 1 END) as conversions,
        COALESCE(SUM(ct.conversion_value), 0) as earnings
      FROM click_tracking ct
      JOIN affiliate_links al ON ct.link_id = al.id
      WHERE al.user_id = ? AND ct.clicked_at >= ${dateFilter}
      GROUP BY ct.country
      ORDER BY clicks DESC
      LIMIT 10
    `).all(user.id) || [];

    // Get device/browser stats
    const deviceStats = db.prepare(`
      SELECT 
        COALESCE(ct.device_type, 'Unknown') as device_type,
        COUNT(ct.id) as clicks,
        COUNT(CASE WHEN ct.converted = 1 THEN 1 END) as conversions,
        CASE WHEN COUNT(ct.id) > 0 THEN (COUNT(CASE WHEN ct.converted = 1 THEN 1 END) * 1.0 / COUNT(ct.id) * 100) ELSE 0 END as conversion_rate
      FROM click_tracking ct
      JOIN affiliate_links al ON ct.link_id = al.id
      WHERE al.user_id = ? AND ct.clicked_at >= ${dateFilter}
      GROUP BY ct.device_type
      ORDER BY clicks DESC
    `).all(user.id) || [];

    // Get category performance
    const categoryStats = db.prepare(`
      SELECT 
        al.category,
        COUNT(DISTINCT al.id) as links_count,
        COALESCE(SUM(al.total_clicks), 0) as total_clicks,
        COALESCE(SUM(al.total_conversions), 0) as total_conversions,
        COALESCE(SUM(al.total_earnings), 0) as total_earnings,
        CASE WHEN SUM(al.total_clicks) > 0 THEN (SUM(al.total_conversions) * 1.0 / SUM(al.total_clicks) * 100) ELSE 0 END as conversion_rate
      FROM affiliate_links al
      WHERE al.user_id = ?
      GROUP BY al.category
      ORDER BY total_earnings DESC
    `).all(user.id) || [];

    // Get recent commissions
    const recentCommissions = db.prepare(`
      SELECT 
        c.id,
        c.commission_amount,
        c.sale_amount,
        c.commission_rate,
        c.sale_date,
        c.status,
        c.user_tier,
        al.name as link_name,
        al.short_code
      FROM commissions c
      LEFT JOIN affiliate_links al ON c.link_id = al.id
      WHERE c.user_id = ? AND c.sale_date >= ${dateFilter}
      ORDER BY c.sale_date DESC
      LIMIT 20
    `).all(user.id) || [];

    // Calculate growth metrics (compare with previous period)
    const previousPeriodStats = db.prepare(`
      SELECT 
        COUNT(ct.id) as prev_clicks,
        COUNT(CASE WHEN ct.converted = 1 THEN 1 END) as prev_conversions,
        COALESCE(SUM(ct.conversion_value), 0) as prev_earnings
      FROM click_tracking ct
      JOIN affiliate_links al ON ct.link_id = al.id
      WHERE al.user_id = ? 
      AND ct.clicked_at >= datetime(${dateFilter}, '-' || CASE 
        WHEN ? = '7d' THEN '7 days'
        WHEN ? = '30d' THEN '30 days'
        WHEN ? = '90d' THEN '90 days'
        WHEN ? = '1y' THEN '1 year'
        ELSE '30 days'
      END)
      AND ct.clicked_at < ${dateFilter}
    `).get(user.id, period, period, period, period) || { prev_clicks: 0, prev_conversions: 0, prev_earnings: 0 };

    // Calculate growth percentages
    const clicksGrowth = previousPeriodStats.prev_clicks > 0 
      ? ((periodStats.period_clicks - previousPeriodStats.prev_clicks) / previousPeriodStats.prev_clicks * 100).toFixed(1)
      : periodStats.period_clicks > 0 ? '100.0' : '0.0';

    const conversionsGrowth = previousPeriodStats.prev_conversions > 0
      ? ((periodStats.period_conversions - previousPeriodStats.prev_conversions) / previousPeriodStats.prev_conversions * 100).toFixed(1)
      : periodStats.period_conversions > 0 ? '100.0' : '0.0';

    const earningsGrowth = previousPeriodStats.prev_earnings > 0
      ? ((periodStats.period_earnings - previousPeriodStats.prev_earnings) / previousPeriodStats.prev_earnings * 100).toFixed(1)
      : periodStats.period_earnings > 0 ? '100.0' : '0.0';

    const responseData = {
      summary: {
        period: period,
        overall_stats: {
          total_links: overallStats.total_links,
          total_clicks: overallStats.total_clicks,
          total_conversions: overallStats.total_conversions,
          total_earnings: parseFloat(overallStats.total_earnings).toFixed(2),
          avg_conversion_rate: parseFloat(overallStats.avg_conversion_rate).toFixed(2)
        },
        period_stats: {
          active_links: periodStats.active_links,
          period_clicks: periodStats.period_clicks,
          period_conversions: periodStats.period_conversions,
          period_earnings: parseFloat(periodStats.period_earnings).toFixed(2),
          period_conversion_rate: periodStats.period_clicks > 0 
            ? ((periodStats.period_conversions / periodStats.period_clicks) * 100).toFixed(2) 
            : '0.00'
        },
        growth: {
          clicks_growth: clicksGrowth,
          conversions_growth: conversionsGrowth,
          earnings_growth: earningsGrowth
        }
      },
      trends: {
        daily_performance: dailyTrends.reverse().map(day => ({
          date: day.date,
          clicks: day.clicks,
          conversions: day.conversions,
          earnings: parseFloat(day.earnings).toFixed(2),
          conversion_rate: day.clicks > 0 ? ((day.conversions / day.clicks) * 100).toFixed(2) : '0.00'
        }))
      },
      top_performers: {
        links: topLinks.map(link => ({
          ...link,
          total_earnings: parseFloat(link.total_earnings).toFixed(2),
          conversion_rate: parseFloat(link.conversion_rate).toFixed(2)
        }))
      },
      demographics: {
        geographic: geoStats.map(geo => ({
          country: geo.country,
          clicks: geo.clicks,
          conversions: geo.conversions,
          earnings: parseFloat(geo.earnings).toFixed(2),
          conversion_rate: geo.clicks > 0 ? ((geo.conversions / geo.clicks) * 100).toFixed(2) : '0.00'
        })),
        devices: deviceStats.map(device => ({
          ...device,
          conversion_rate: parseFloat(device.conversion_rate).toFixed(2)
        }))
      },
      categories: categoryStats.map(cat => ({
        ...cat,
        total_earnings: parseFloat(cat.total_earnings).toFixed(2),
        conversion_rate: parseFloat(cat.conversion_rate).toFixed(2)
      })),
      recent_activity: {
        commissions: recentCommissions.map(comm => ({
          ...comm,
          commission_amount: parseFloat(comm.commission_amount).toFixed(2),
          sale_amount: parseFloat(comm.sale_amount).toFixed(2),
          commission_rate: parseFloat(comm.commission_rate).toFixed(2)
        }))
      },
      user_progress: {
        current_tier: user.tier,
        total_lifetime_earnings: parseFloat(user.total_earnings || 0).toFixed(2),
        tier_progress: calculateTierProgress(user)
      }
    };

    return res.status(200).json(createSuccessResponse(responseData, 'Analytics dashboard retrieved successfully'));

  } catch (error) {
    console.error('Analytics dashboard error:', error);
    return res.status(500).json(createErrorResponse('Failed to get analytics', 500, error.message));
  }
};

// Helper function to calculate tier progression
function calculateTierProgress(user) {
  const tiers = {
    'bronze': { min: 0, max: 500 },
    'silver': { min: 500, max: 1500 },
    'gold': { min: 1500, max: 5000 },
    'premium': { min: 5000, max: 15000 },
    'platinum': { min: 15000, max: 50000 },
    'diamond': { min: 50000, max: Infinity }
  };

  const currentTier = user.tier;
  const earnings = parseFloat(user.total_earnings || 0);
  
  if (!tiers[currentTier]) return { progress: 100, next_tier: null, required_earnings: 0 };
  
  const tierInfo = tiers[currentTier];
  
  if (tierInfo.max === Infinity) {
    return { progress: 100, next_tier: null, required_earnings: 0 };
  }
  
  const progress = ((earnings - tierInfo.min) / (tierInfo.max - tierInfo.min)) * 100;
  const nextTierKeys = Object.keys(tiers);
  const currentIndex = nextTierKeys.indexOf(currentTier);
  const nextTier = currentIndex < nextTierKeys.length - 1 ? nextTierKeys[currentIndex + 1] : null;
  const requiredEarnings = Math.max(0, tierInfo.max - earnings);
  
  return {
    progress: Math.min(100, Math.max(0, progress)).toFixed(1),
    next_tier: nextTier,
    required_earnings: requiredEarnings.toFixed(2)
  };
}