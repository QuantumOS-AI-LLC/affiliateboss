// Commissions API for Vercel
// Commission tracking and management for affiliates
// Bangladesh dev style - comprehensive earning management

const { getDatabase, authenticateUser, createErrorResponse, createSuccessResponse } = require('../lib/database');

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

    const { 
      status = 'all', 
      page = 1, 
      limit = 20, 
      start_date = null, 
      end_date = null,
      sort_by = 'sale_date',
      sort_order = 'DESC'
    } = req.query;

    const db = getDatabase();

    // Build where clause
    let whereClause = 'c.user_id = ?';
    let params = [user.id];

    if (status !== 'all') {
      whereClause += ' AND c.status = ?';
      params.push(status);
    }

    if (start_date) {
      whereClause += ' AND c.sale_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND c.sale_date <= ?';
      params.push(end_date);
    }

    const offset = (page - 1) * limit;

    // Get commissions with related data
    const commissions = db.prepare(`
      SELECT 
        c.*,
        al.name as link_name,
        al.short_code,
        al.category as link_category,
        p.name as product_name,
        p.category as product_category,
        p.price as product_price,
        p.image_url as product_image
      FROM commissions c
      LEFT JOIN affiliate_links al ON c.link_id = al.id
      LEFT JOIN products p ON c.product_id = p.id
      WHERE ${whereClause}
      ORDER BY ${sort_by === 'amount' ? 'c.commission_amount' : sort_by === 'rate' ? 'c.commission_rate' : 'c.sale_date'} ${sort_order}
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    // Get total count
    const totalCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM commissions c
      WHERE ${whereClause}
    `).get(...params).count;

    // Get summary statistics
    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total_commissions,
        COALESCE(SUM(c.commission_amount), 0) as total_earnings,
        COALESCE(SUM(c.sale_amount), 0) as total_sales_generated,
        COALESCE(AVG(c.commission_rate), 0) as avg_commission_rate,
        COUNT(CASE WHEN c.status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN c.status = 'confirmed' THEN 1 END) as confirmed_count,
        COUNT(CASE WHEN c.status = 'paid' THEN 1 END) as paid_count,
        COALESCE(SUM(CASE WHEN c.status = 'pending' THEN c.commission_amount END), 0) as pending_amount,
        COALESCE(SUM(CASE WHEN c.status = 'confirmed' THEN c.commission_amount END), 0) as confirmed_amount,
        COALESCE(SUM(CASE WHEN c.status = 'paid' THEN c.commission_amount END), 0) as paid_amount
      FROM commissions c
      WHERE c.user_id = ?
    `).get(user.id);

    // Get monthly breakdown
    const monthlyBreakdown = db.prepare(`
      SELECT 
        strftime('%Y-%m', c.sale_date) as month,
        COUNT(*) as commission_count,
        COALESCE(SUM(c.commission_amount), 0) as total_amount,
        COALESCE(SUM(c.sale_amount), 0) as total_sales,
        COALESCE(AVG(c.commission_rate), 0) as avg_rate
      FROM commissions c
      WHERE c.user_id = ? AND c.sale_date >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', c.sale_date)
      ORDER BY month DESC
      LIMIT 12
    `).all(user.id);

    // Get top performing products
    const topProducts = db.prepare(`
      SELECT 
        p.id,
        p.name,
        p.category,
        p.price,
        COUNT(c.id) as commission_count,
        COALESCE(SUM(c.commission_amount), 0) as total_earnings,
        COALESCE(SUM(c.sale_amount), 0) as total_sales,
        COALESCE(AVG(c.commission_rate), 0) as avg_commission_rate
      FROM commissions c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
      GROUP BY p.id
      ORDER BY total_earnings DESC
      LIMIT 10
    `).all(user.id);

    // Get commission by tier
    const tierBreakdown = db.prepare(`
      SELECT 
        c.user_tier as tier,
        COUNT(*) as commission_count,
        COALESCE(SUM(c.commission_amount), 0) as total_amount,
        COALESCE(AVG(c.tier_multiplier), 0) as avg_multiplier
      FROM commissions c
      WHERE c.user_id = ?
      GROUP BY c.user_tier
      ORDER BY total_amount DESC
    `).all(user.id);

    // Calculate tier progression info
    const tierMultipliers = {
      'bronze': 1.0,
      'silver': 1.1,
      'gold': 1.2,
      'premium': 1.3,
      'platinum': 1.4,
      'diamond': 1.5
    };

    const currentMultiplier = tierMultipliers[user.tier] || 1.0;
    const nextTierKeys = Object.keys(tierMultipliers);
    const currentIndex = nextTierKeys.indexOf(user.tier);
    const nextTier = currentIndex < nextTierKeys.length - 1 ? nextTierKeys[currentIndex + 1] : null;
    const nextMultiplier = nextTier ? tierMultipliers[nextTier] : currentMultiplier;

    // Format response data
    const responseData = {
      commissions: commissions.map(commission => ({
        ...commission,
        commission_amount: parseFloat(commission.commission_amount).toFixed(2),
        sale_amount: parseFloat(commission.sale_amount).toFixed(2),
        commission_rate: parseFloat(commission.commission_rate).toFixed(2),
        tier_multiplier: parseFloat(commission.tier_multiplier || 1.0).toFixed(2),
        product_price: commission.product_price ? parseFloat(commission.product_price).toFixed(2) : null
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      summary: {
        ...summary,
        total_earnings: parseFloat(summary.total_earnings).toFixed(2),
        total_sales_generated: parseFloat(summary.total_sales_generated).toFixed(2),
        avg_commission_rate: parseFloat(summary.avg_commission_rate).toFixed(2),
        pending_amount: parseFloat(summary.pending_amount).toFixed(2),
        confirmed_amount: parseFloat(summary.confirmed_amount).toFixed(2),
        paid_amount: parseFloat(summary.paid_amount).toFixed(2)
      },
      monthly_breakdown: monthlyBreakdown.map(month => ({
        ...month,
        total_amount: parseFloat(month.total_amount).toFixed(2),
        total_sales: parseFloat(month.total_sales).toFixed(2),
        avg_rate: parseFloat(month.avg_rate).toFixed(2)
      })),
      top_products: topProducts.map(product => ({
        ...product,
        price: parseFloat(product.price).toFixed(2),
        total_earnings: parseFloat(product.total_earnings).toFixed(2),
        total_sales: parseFloat(product.total_sales).toFixed(2),
        avg_commission_rate: parseFloat(product.avg_commission_rate).toFixed(2)
      })),
      tier_analysis: {
        current_tier: user.tier,
        current_multiplier: currentMultiplier,
        next_tier: nextTier,
        next_multiplier: nextMultiplier,
        potential_boost: nextTier ? `${((nextMultiplier - currentMultiplier) * 100).toFixed(0)}%` : null,
        tier_breakdown: tierBreakdown.map(tier => ({
          ...tier,
          total_amount: parseFloat(tier.total_amount).toFixed(2),
          avg_multiplier: parseFloat(tier.avg_multiplier).toFixed(2)
        }))
      },
      filters: {
        available_statuses: ['pending', 'confirmed', 'paid', 'cancelled', 'refunded'],
        date_ranges: [
          { label: 'Last 7 days', value: '7d' },
          { label: 'Last 30 days', value: '30d' },
          { label: 'Last 3 months', value: '90d' },
          { label: 'Last year', value: '1y' }
        ]
      }
    };

    return res.status(200).json(createSuccessResponse(responseData, 'Commissions retrieved successfully'));

  } catch (error) {
    console.error('Commissions API error:', error);
    return res.status(500).json(createErrorResponse('Failed to get commissions', 500, error.message));
  }
};