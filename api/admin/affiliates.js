// Admin Affiliates Management API for Vercel
// Complete affiliate management for merchants
// Bangladesh dev style - comprehensive and practical

const { getDatabase, authenticateAdmin, createErrorResponse, createSuccessResponse } = require('../../lib/database');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Admin-Key,Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    // GET - Get all affiliates with filtering and pagination
    if (req.method === 'GET') {
      const { 
        status = 'all', 
        tier = 'all', 
        search = '', 
        page = 1, 
        limit = 20,
        sort_by = 'total_earnings',
        sort_order = 'DESC'
      } = req.query;

      let whereClause = 'u.id > 1'; // Exclude admin user
      let params = [];

      if (status !== 'all') {
        whereClause += ' AND u.status = ?';
        params.push(status);
      }

      if (tier !== 'all') {
        whereClause += ' AND u.tier = ?';
        params.push(tier);
      }

      if (search) {
        whereClause += ' AND (u.username LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      const offset = (page - 1) * limit;

      // Get affiliates with detailed stats
      const affiliates = db.prepare(`
        SELECT 
          u.*,
          COUNT(DISTINCT al.id) as total_links,
          COALESCE(SUM(al.total_clicks), 0) as total_clicks,
          COALESCE(SUM(al.total_conversions), 0) as total_conversions,
          COALESCE(SUM(c.commission_amount), 0) as total_commissions,
          COUNT(DISTINCT c.id) as total_orders,
          MAX(c.sale_date) as last_sale_date,
          MAX(u.last_login) as last_activity
        FROM users u
        LEFT JOIN affiliate_links al ON u.id = al.user_id
        LEFT JOIN commissions c ON u.id = c.user_id AND c.status IN ('confirmed', 'paid')
        WHERE ${whereClause}
        GROUP BY u.id
        ORDER BY ${sort_by === 'name' ? 'u.first_name' : sort_by === 'email' ? 'u.email' : sort_by === 'tier' ? 'u.tier' : sort_by === 'status' ? 'u.status' : 'u.total_earnings'} ${sort_order}
        LIMIT ? OFFSET ?
      `).all(...params, limit, offset);

      // Get total count for pagination
      const totalCount = db.prepare(`
        SELECT COUNT(DISTINCT u.id) as count
        FROM users u
        WHERE ${whereClause}
      `).get(...params).count;

      // Get summary statistics
      const summary = db.prepare(`
        SELECT 
          COUNT(DISTINCT u.id) as total_affiliates,
          COUNT(DISTINCT CASE WHEN u.status = 'active' THEN u.id END) as active_count,
          COUNT(DISTINCT CASE WHEN u.status = 'pending' THEN u.id END) as pending_count,
          COUNT(DISTINCT CASE WHEN u.status = 'suspended' THEN u.id END) as suspended_count,
          COALESCE(SUM(u.total_earnings), 0) as total_earnings_all,
          COALESCE(AVG(u.total_earnings), 0) as avg_earnings
        FROM users u
        WHERE u.id > 1
      `).get();

      // Format affiliates data
      const formattedAffiliates = affiliates.map(affiliate => ({
        ...affiliate,
        total_earnings: parseFloat(affiliate.total_earnings || 0).toFixed(2),
        total_commissions: parseFloat(affiliate.total_commissions || 0).toFixed(2),
        conversion_rate: affiliate.total_clicks > 0 
          ? ((affiliate.total_conversions / affiliate.total_clicks) * 100).toFixed(2)
          : '0.00',
        performance_score: calculatePerformanceScore(affiliate),
        tier_progress: calculateTierProgress(affiliate)
      }));

      const responseData = {
        affiliates: formattedAffiliates,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        summary: {
          ...summary,
          total_earnings_all: parseFloat(summary.total_earnings_all || 0).toFixed(2),
          avg_earnings: parseFloat(summary.avg_earnings || 0).toFixed(2)
        },
        filters: {
          statuses: ['active', 'pending', 'suspended', 'inactive'],
          tiers: ['bronze', 'silver', 'gold', 'premium', 'platinum', 'diamond']
        }
      };

      return res.status(200).json(createSuccessResponse(responseData, 'Affiliates retrieved successfully'));
    }

    // PUT - Update affiliate status/tier
    if (req.method === 'PUT') {
      const { id } = req.query;
      const { status, tier, notes } = req.body;

      if (!id) {
        return res.status(400).json(createErrorResponse('Affiliate ID required', 400));
      }

      // Check if affiliate exists
      const affiliate = db.prepare('SELECT * FROM users WHERE id = ? AND id > 1').get(id);
      if (!affiliate) {
        return res.status(404).json(createErrorResponse('Affiliate not found', 404));
      }

      // Prepare update data
      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (status !== undefined) {
        updateData.status = status;
      }

      if (tier !== undefined) {
        updateData.tier = tier;
      }

      // Update affiliate
      const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(updateData), id];

      db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`).run(...values);

      // Log admin action (in production, you'd want a proper audit log)
      console.log(`Admin action: Updated affiliate ${affiliate.username} - Status: ${status}, Tier: ${tier}`);

      // Get updated affiliate data
      const updatedAffiliate = db.prepare(`
        SELECT 
          u.*,
          COUNT(DISTINCT al.id) as total_links,
          COALESCE(SUM(al.total_clicks), 0) as total_clicks,
          COALESCE(SUM(al.total_conversions), 0) as total_conversions
        FROM users u
        LEFT JOIN affiliate_links al ON u.id = al.user_id
        WHERE u.id = ?
        GROUP BY u.id
      `).get(id);

      const responseData = {
        ...updatedAffiliate,
        total_earnings: parseFloat(updatedAffiliate.total_earnings || 0).toFixed(2)
      };

      return res.status(200).json(createSuccessResponse(responseData, 'Affiliate updated successfully'));
    }

    // DELETE - Suspend/deactivate affiliate (soft delete)
    if (req.method === 'DELETE') {
      const { id } = req.query;
      const { reason = 'Admin action' } = req.body;

      if (!id) {
        return res.status(400).json(createErrorResponse('Affiliate ID required', 400));
      }

      // Check if affiliate exists
      const affiliate = db.prepare('SELECT * FROM users WHERE id = ? AND id > 1').get(id);
      if (!affiliate) {
        return res.status(404).json(createErrorResponse('Affiliate not found', 404));
      }

      // Soft delete by changing status to suspended
      db.prepare(`
        UPDATE users 
        SET status = 'suspended', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(id);

      // Deactivate all affiliate links
      db.prepare(`
        UPDATE affiliate_links 
        SET status = 'inactive', updated_at = CURRENT_TIMESTAMP 
        WHERE user_id = ?
      `).run(id);

      // Log admin action
      console.log(`Admin action: Suspended affiliate ${affiliate.username} - Reason: ${reason}`);

      return res.status(200).json(createSuccessResponse(
        { id, status: 'suspended', reason }, 
        'Affiliate suspended successfully'
      ));
    }

    return res.status(405).json(createErrorResponse('Method not allowed', 405));

  } catch (error) {
    console.error('Admin affiliates error:', error);
    return res.status(500).json(createErrorResponse('Internal server error', 500, error.message));
  }
};

// Helper function to calculate performance score
function calculatePerformanceScore(affiliate) {
  const earnings = parseFloat(affiliate.total_earnings || 0);
  const clicks = parseInt(affiliate.total_clicks || 0);
  const conversions = parseInt(affiliate.total_conversions || 0);
  
  let score = 0;
  
  // Earnings component (40% of score)
  if (earnings > 10000) score += 40;
  else if (earnings > 5000) score += 30;
  else if (earnings > 1000) score += 20;
  else if (earnings > 100) score += 10;
  
  // Conversion rate component (30% of score)
  const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
  if (conversionRate > 5) score += 30;
  else if (conversionRate > 3) score += 25;
  else if (conversionRate > 1) score += 15;
  else if (conversionRate > 0.5) score += 10;
  
  // Activity component (30% of score)
  if (clicks > 10000) score += 30;
  else if (clicks > 5000) score += 25;
  else if (clicks > 1000) score += 15;
  else if (clicks > 100) score += 10;
  
  return Math.min(100, score);
}

// Helper function to calculate tier progress
function calculateTierProgress(affiliate) {
  const tiers = {
    'bronze': { min: 0, max: 500 },
    'silver': { min: 500, max: 1500 },
    'gold': { min: 1500, max: 5000 },
    'premium': { min: 5000, max: 15000 },
    'platinum': { min: 15000, max: 50000 },
    'diamond': { min: 50000, max: Infinity }
  };
  
  const currentTier = affiliate.tier;
  const earnings = parseFloat(affiliate.total_earnings || 0);
  
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
    progress: Math.min(100, Math.max(0, progress)),
    next_tier: nextTier,
    required_earnings: requiredEarnings.toFixed(2)
  };
}