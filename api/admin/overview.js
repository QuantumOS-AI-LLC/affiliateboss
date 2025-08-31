// Admin Overview API for Vercel
// Dashboard statistics for merchant admin panel
// Bangladesh dev style - comprehensive analytics

const { getDatabase, authenticateAdmin, createErrorResponse, createSuccessResponse } = require('../../lib/database');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Admin-Key,Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json(createErrorResponse('Method not allowed', 405));
  }

  try {
    // Get admin key from headers or query
    const adminKey = req.headers['x-admin-key'] || req.query.admin_key;
    
    if (!adminKey) {
      return res.status(401).json(createErrorResponse('Admin key required', 401));
    }

    // Authenticate admin
    const admin = authenticateAdmin(adminKey);
    if (!admin) {
      return res.status(401).json(createErrorResponse('Invalid admin key', 401));
    }

    const db = getDatabase();

    // Get affiliate counts by status
    const affiliateStats = db.prepare(`
      SELECT 
        COUNT(*) as total_affiliates,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_affiliates,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_affiliates,
        COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_affiliates,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_affiliates
      FROM users 
      WHERE id > 1
    `).get() || { total_affiliates: 0, active_affiliates: 0, pending_affiliates: 0, suspended_affiliates: 0, inactive_affiliates: 0 };

    // Get sales from affiliates this month
    const salesStats = db.prepare(`
      SELECT 
        COALESCE(SUM(c.sale_amount), 0) as total_affiliate_sales,
        COALESCE(SUM(c.commission_amount), 0) as total_commissions_paid,
        COUNT(c.id) as total_orders,
        COALESCE(AVG(c.commission_rate), 0) as avg_commission_rate
      FROM commissions c
      WHERE c.sale_date >= date('now', 'start of month')
      AND c.status IN ('confirmed', 'paid')
    `).get() || { total_affiliate_sales: 0, total_commissions_paid: 0, total_orders: 0, avg_commission_rate: 0 };

    // Get tier distribution
    const tierStats = db.prepare(`
      SELECT 
        tier,
        COUNT(*) as count,
        COALESCE(AVG(total_earnings), 0) as avg_earnings,
        COALESCE(SUM(total_earnings), 0) as total_earnings
      FROM users 
      WHERE id > 1 
      GROUP BY tier
      ORDER BY 
        CASE tier 
          WHEN 'bronze' THEN 1
          WHEN 'silver' THEN 2
          WHEN 'gold' THEN 3
          WHEN 'premium' THEN 4
          WHEN 'platinum' THEN 5
          WHEN 'diamond' THEN 6
          ELSE 7
        END
    `).all() || [];

    // Get recent activity
    const recentActivity = db.prepare(`
      SELECT 
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        c.commission_amount,
        c.sale_amount,
        c.sale_date,
        c.status,
        'commission' as activity_type
      FROM commissions c
      JOIN users u ON c.user_id = u.id
      WHERE c.created_at >= datetime('now', '-7 days')
      ORDER BY c.created_at DESC
      LIMIT 15
    `).all() || [];

    // Get top performing affiliates
    const topAffiliates = db.prepare(`
      SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.email,
        u.tier,
        u.total_earnings,
        COUNT(al.id) as total_links,
        SUM(al.total_clicks) as total_clicks,
        SUM(al.total_conversions) as total_conversions
      FROM users u
      LEFT JOIN affiliate_links al ON u.id = al.user_id
      WHERE u.id > 1 AND u.status = 'active'
      GROUP BY u.id
      ORDER BY u.total_earnings DESC
      LIMIT 10
    `).all() || [];

    // Get commission trends (last 30 days)
    const commissionTrends = db.prepare(`
      SELECT 
        DATE(c.sale_date) as date,
        COUNT(*) as orders,
        SUM(c.sale_amount) as sales,
        SUM(c.commission_amount) as commissions
      FROM commissions c
      WHERE c.sale_date >= date('now', '-30 days')
      AND c.status IN ('confirmed', 'paid')
      GROUP BY DATE(c.sale_date)
      ORDER BY date DESC
      LIMIT 30
    `).all() || [];

    // Get pending applications count
    const pendingApplications = db.prepare(`
      SELECT COUNT(*) as count
      FROM affiliate_applications 
      WHERE status = 'pending'
    `).get()?.count || 0;

    // Calculate growth metrics
    const lastMonthStats = db.prepare(`
      SELECT 
        COALESCE(SUM(c.sale_amount), 0) as last_month_sales,
        COALESCE(SUM(c.commission_amount), 0) as last_month_commissions,
        COUNT(c.id) as last_month_orders
      FROM commissions c
      WHERE c.sale_date >= date('now', 'start of month', '-1 month')
      AND c.sale_date < date('now', 'start of month')
      AND c.status IN ('confirmed', 'paid')
    `).get() || { last_month_sales: 0, last_month_commissions: 0, last_month_orders: 0 };

    // Calculate growth percentages
    const salesGrowth = lastMonthStats.last_month_sales > 0 
      ? ((salesStats.total_affiliate_sales - lastMonthStats.last_month_sales) / lastMonthStats.last_month_sales * 100).toFixed(1)
      : salesStats.total_affiliate_sales > 0 ? '100.0' : '0.0';

    const commissionGrowth = lastMonthStats.last_month_commissions > 0
      ? ((salesStats.total_commissions_paid - lastMonthStats.last_month_commissions) / lastMonthStats.last_month_commissions * 100).toFixed(1)
      : salesStats.total_commissions_paid > 0 ? '100.0' : '0.0';

    const responseData = {
      affiliate_stats: {
        ...affiliateStats,
        growth_rate: '15.2' // Mock growth rate - calculate from historical data in production
      },
      sales_stats: {
        ...salesStats,
        total_affiliate_sales: parseFloat(salesStats.total_affiliate_sales || 0).toFixed(2),
        total_commissions_paid: parseFloat(salesStats.total_commissions_paid || 0).toFixed(2),
        avg_commission_rate: parseFloat(salesStats.avg_commission_rate || 0).toFixed(2),
        sales_growth: salesGrowth,
        commission_growth: commissionGrowth
      },
      tier_distribution: tierStats.map(tier => ({
        ...tier,
        avg_earnings: parseFloat(tier.avg_earnings || 0).toFixed(2),
        total_earnings: parseFloat(tier.total_earnings || 0).toFixed(2)
      })),
      recent_activity: recentActivity.map(activity => ({
        ...activity,
        commission_amount: parseFloat(activity.commission_amount || 0).toFixed(2),
        sale_amount: parseFloat(activity.sale_amount || 0).toFixed(2)
      })),
      top_affiliates: topAffiliates.map(affiliate => ({
        ...affiliate,
        total_earnings: parseFloat(affiliate.total_earnings || 0).toFixed(2),
        conversion_rate: affiliate.total_clicks > 0 
          ? ((affiliate.total_conversions / affiliate.total_clicks) * 100).toFixed(2)
          : '0.00'
      })),
      commission_trends: commissionTrends.map(trend => ({
        ...trend,
        sales: parseFloat(trend.sales || 0).toFixed(2),
        commissions: parseFloat(trend.commissions || 0).toFixed(2)
      })),
      pending_applications,
      store_info: {
        name: 'Demo Fashion Store',
        plan: 'Shopify Plus',
        currency: 'USD',
        total_products: 1250,
        active_affiliates: affiliateStats.active_affiliates
      }
    };

    return res.status(200).json(createSuccessResponse(responseData, 'Admin overview retrieved successfully'));

  } catch (error) {
    console.error('Admin overview error:', error);
    return res.status(500).json(createErrorResponse('Failed to get admin overview', 500, error.message));
  }
};