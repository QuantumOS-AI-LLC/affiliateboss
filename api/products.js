// Products API for Vercel
// Product catalog and affiliate link generation
// Bangladesh dev style - comprehensive product management

const { getDatabase, authenticateUser, createErrorResponse, createSuccessResponse, generateShortCode } = require('../lib/database');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-API-Key,Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    const db = getDatabase();

    // GET - Get products with filtering and pagination
    if (req.method === 'GET') {
      const { 
        category = 'all', 
        search = '', 
        page = 1, 
        limit = 20,
        sort_by = 'created_at',
        sort_order = 'DESC',
        min_price = 0,
        max_price = 999999,
        vendor = 'all'
      } = req.query;

      let whereClause = 'p.status = "active"';
      let params = [];

      if (category !== 'all') {
        whereClause += ' AND p.category = ?';
        params.push(category);
      }

      if (vendor !== 'all') {
        whereClause += ' AND p.vendor = ?';
        params.push(vendor);
      }

      if (search) {
        whereClause += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      whereClause += ' AND p.price BETWEEN ? AND ?';
      params.push(parseFloat(min_price), parseFloat(max_price));

      const offset = (page - 1) * limit;

      // Get products with affiliate link info if exists
      const products = db.prepare(`
        SELECT 
          p.*,
          al.id as existing_link_id,
          al.short_code,
          al.short_url,
          al.total_clicks,
          al.total_conversions,
          al.total_earnings as link_earnings,
          CASE 
            WHEN p.commission_type = 'percentage' THEN (p.price * p.commission_rate / 100)
            ELSE p.commission_rate
          END as estimated_commission
        FROM products p
        LEFT JOIN affiliate_links al ON p.id = al.user_id AND al.user_id = ?
        WHERE ${whereClause}
        ORDER BY ${sort_by === 'name' ? 'p.name' : sort_by === 'price' ? 'p.price' : sort_by === 'commission' ? 'estimated_commission' : 'p.created_at'} ${sort_order}
        LIMIT ? OFFSET ?
      `).all(user.id, ...params, limit, offset);

      // Get total count
      const totalCount = db.prepare(`
        SELECT COUNT(*) as count 
        FROM products p
        WHERE ${whereClause}
      `).get(...params).count;

      // Get categories and vendors for filters
      const categories = db.prepare(`
        SELECT DISTINCT category 
        FROM products 
        WHERE status = 'active'
        ORDER BY category
      `).all();

      const vendors = db.prepare(`
        SELECT DISTINCT vendor 
        FROM products 
        WHERE status = 'active'
        ORDER BY vendor
      `).all();

      // Calculate user's tier multiplier
      const tierMultipliers = {
        'bronze': 1.0,
        'silver': 1.1,
        'gold': 1.2,
        'premium': 1.3,
        'platinum': 1.4,
        'diamond': 1.5
      };

      const tierMultiplier = tierMultipliers[user.tier] || 1.0;

      // Format products with enhanced commission calculations
      const formattedProducts = products.map(product => {
        const baseCommission = product.commission_type === 'percentage' 
          ? (product.price * product.commission_rate / 100)
          : product.commission_rate;
          
        const finalCommission = (baseCommission * tierMultiplier).toFixed(2);

        return {
          ...product,
          price: parseFloat(product.price).toFixed(2),
          commission_rate: parseFloat(product.commission_rate).toFixed(2),
          estimated_commission: parseFloat(baseCommission).toFixed(2),
          tier_commission: finalCommission,
          tier_multiplier: tierMultiplier,
          has_affiliate_link: !!product.existing_link_id,
          tags: product.tags ? JSON.parse(product.tags) : [],
          link_earnings: parseFloat(product.link_earnings || 0).toFixed(2)
        };
      });

      const responseData = {
        products: formattedProducts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        filters: {
          categories: categories.map(c => c.category),
          vendors: vendors.map(v => v.vendor)
        },
        user_info: {
          tier: user.tier,
          tier_multiplier: tierMultiplier,
          commission_boost: `${((tierMultiplier - 1) * 100).toFixed(0)}%`
        }
      };

      return res.status(200).json(createSuccessResponse(responseData, 'Products retrieved successfully'));
    }

    // POST - Create affiliate link for specific product
    if (req.method === 'POST') {
      const { product_id, name, description, category = 'Product Links' } = req.body;

      if (!product_id) {
        return res.status(400).json(createErrorResponse('Product ID required', 400));
      }

      // Check if product exists
      const product = db.prepare('SELECT * FROM products WHERE id = ? AND status = "active"').get(product_id);
      if (!product) {
        return res.status(404).json(createErrorResponse('Product not found', 404));
      }

      // Check if user already has a link for this product
      const existingLink = db.prepare('SELECT * FROM affiliate_links WHERE user_id = ? AND original_url LIKE ?').get(
        user.id, 
        `%product=${product.id}%`
      );

      if (existingLink) {
        return res.status(409).json(createErrorResponse('Affiliate link already exists for this product', 409, {
          existing_link: {
            id: existingLink.id,
            short_code: existingLink.short_code,
            short_url: existingLink.short_url
          }
        }));
      }

      // Generate unique short code
      let shortCode;
      let attempts = 0;
      do {
        shortCode = generateShortCode();
        attempts++;
        if (attempts > 10) {
          throw new Error('Could not generate unique short code');
        }
      } while (db.prepare('SELECT id FROM affiliate_links WHERE short_code = ?').get(shortCode));

      // Create product-specific affiliate URL with tracking
      const productUrl = `https://store.com/products/${product.sku || product.id}?aff=${user.id}&product=${product.id}&ref=${shortCode}`;
      const shortUrl = `https://aff.ly/${shortCode}`;

      // Use provided name or generate default
      const linkName = name || `${product.name} - Affiliate Link`;
      const linkDescription = description || `Affiliate link for ${product.name}. ${product.description}`;

      // Insert new affiliate link
      const result = db.prepare(`
        INSERT INTO affiliate_links (
          user_id, name, description, original_url, short_code, short_url,
          category, utm_source, utm_medium, utm_campaign
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        user.id, 
        linkName, 
        linkDescription, 
        productUrl, 
        shortCode, 
        shortUrl,
        category,
        'affiliate-boss',
        'affiliate-link',
        `product-${product.id}`
      );

      // Calculate commission info
      const tierMultipliers = {
        'bronze': 1.0,
        'silver': 1.1,
        'gold': 1.2,
        'premium': 1.3,
        'platinum': 1.4,
        'diamond': 1.5
      };

      const tierMultiplier = tierMultipliers[user.tier] || 1.0;
      const baseCommission = product.commission_type === 'percentage' 
        ? (product.price * product.commission_rate / 100)
        : product.commission_rate;
      const finalCommission = (baseCommission * tierMultiplier).toFixed(2);

      const responseData = {
        link: {
          id: result.lastInsertRowid,
          name: linkName,
          description: linkDescription,
          short_code: shortCode,
          short_url: shortUrl,
          original_url: productUrl,
          category: category,
          created_at: new Date().toISOString()
        },
        product: {
          id: product.id,
          name: product.name,
          price: parseFloat(product.price).toFixed(2),
          commission_rate: parseFloat(product.commission_rate).toFixed(2),
          estimated_commission: parseFloat(baseCommission).toFixed(2),
          tier_commission: finalCommission,
          tier_multiplier: tierMultiplier
        },
        commission_info: {
          base_rate: `${product.commission_rate}%`,
          tier_multiplier: `${tierMultiplier}x`,
          estimated_per_sale: finalCommission,
          commission_type: product.commission_type
        }
      };

      return res.status(201).json(createSuccessResponse(responseData, 'Affiliate link created successfully'));
    }

    return res.status(405).json(createErrorResponse('Method not allowed', 405));

  } catch (error) {
    console.error('Products API error:', error);
    return res.status(500).json(createErrorResponse('Internal server error', 500, error.message));
  }
};