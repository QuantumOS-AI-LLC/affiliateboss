// Products API Routes
// Bangladesh dev style - comprehensive product management

const express = require('express');
const dbManager = require('../../lib/database');
const { authenticateApiKey } = require('./auth');

const router = express.Router();

// Get all products with filtering and search
router.get('/', (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            category, 
            vendor,
            search,
            sort_by = 'total_sales',
            sort_order = 'DESC',
            min_commission = 0,
            max_price
        } = req.query;

        let whereClause = 'WHERE p.status = "active"';
        let params = [];

        // Add filters
        if (category) {
            whereClause += ' AND p.category = ?';
            params.push(category);
        }
        
        if (vendor) {
            whereClause += ' AND p.vendor = ?';
            params.push(vendor);
        }
        
        if (search) {
            whereClause += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        if (min_commission > 0) {
            whereClause += ' AND p.commission_rate >= ?';
            params.push(min_commission);
        }
        
        if (max_price) {
            whereClause += ' AND p.price <= ?';
            params.push(max_price);
        }

        const offset = (page - 1) * limit;

        const products = dbManager.query(`
            SELECT 
                p.*,
                COUNT(al.id) as affiliate_links_count,
                AVG(c.commission_amount) as avg_commission_earned
            FROM products p
            LEFT JOIN affiliate_links al ON p.id = al.id
            LEFT JOIN commissions c ON p.id = c.product_id
            ${whereClause}
            GROUP BY p.id
            ORDER BY ${sort_by} ${sort_order}
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        // Get total count
        const totalResult = dbManager.queryOne(`
            SELECT COUNT(*) as total 
            FROM products p 
            ${whereClause}
        `, params);

        // Get categories for filtering
        const categories = dbManager.query(`
            SELECT category, COUNT(*) as count 
            FROM products 
            WHERE status = 'active' 
            GROUP BY category 
            ORDER BY count DESC
        `);

        res.json({
            success: true,
            products: products,
            categories: categories,
            pagination: {
                current_page: parseInt(page),
                per_page: parseInt(limit),
                total: totalResult.total,
                total_pages: Math.ceil(totalResult.total / limit)
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to get products' });
    }
});

// Get single product details
router.get('/:id', (req, res) => {
    try {
        const productId = req.params.id;
        
        const product = dbManager.queryOne(`
            SELECT 
                p.*,
                ss.name as shopify_store_name,
                COUNT(al.id) as affiliate_links_count,
                COUNT(c.id) as total_commissions,
                SUM(c.commission_amount) as total_commissions_paid,
                AVG(c.commission_amount) as avg_commission
            FROM products p
            LEFT JOIN shopify_stores ss ON p.shopify_store_id = ss.id
            LEFT JOIN affiliate_links al ON p.id = al.id
            LEFT JOIN commissions c ON p.id = c.product_id
            WHERE p.id = ?
            GROUP BY p.id
        `, [productId]);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Get recent commissions for this product
        const recentCommissions = dbManager.query(`
            SELECT 
                c.*,
                u.username,
                al.name as link_name
            FROM commissions c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN affiliate_links al ON c.link_id = al.id
            WHERE c.product_id = ?
            ORDER BY c.created_at DESC
            LIMIT 10
        `, [productId]);

        // Get performance trends (last 30 days)
        const performanceTrend = dbManager.query(`
            SELECT 
                DATE(c.sale_date) as date,
                COUNT(*) as sales_count,
                SUM(c.sale_amount) as total_sales,
                SUM(c.commission_amount) as total_commissions
            FROM commissions c
            WHERE c.product_id = ?
            AND c.sale_date >= datetime('now', '-30 days')
            GROUP BY DATE(c.sale_date)
            ORDER BY date DESC
        `, [productId]);

        res.json({
            success: true,
            product: {
                ...product,
                recent_commissions: recentCommissions,
                performance_trend: performanceTrend
            }
        });
    } catch (error) {
        console.error('Get product details error:', error);
        res.status(500).json({ error: 'Failed to get product details' });
    }
});

// Create affiliate link for product (authenticated)
router.post('/:id/create-link', authenticateApiKey, (req, res) => {
    try {
        const productId = req.params.id;
        const { name, description, utm_campaign } = req.body;

        // Check if product exists
        const product = dbManager.queryOne('SELECT * FROM products WHERE id = ?', [productId]);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Generate affiliate link URL based on product
        let originalUrl = `https://demo-store.myshopify.com/products/${product.sku}`;
        
        // Add UTM parameters
        const utmParams = new URLSearchParams({
            utm_source: 'affiliate',
            utm_medium: 'link',
            utm_campaign: utm_campaign || `product_${productId}`,
            utm_content: req.user.id,
            ref: req.user.api_key
        });
        
        originalUrl += `?${utmParams.toString()}`;

        // Generate short code
        const shortCode = Math.random().toString(36).substring(7);
        const shortUrl = `https://aff.boss/${shortCode}`;

        // Create the affiliate link
        const result = dbManager.run(`
            INSERT INTO affiliate_links (
                user_id, name, description, original_url, short_code, short_url,
                category, utm_source, utm_medium, utm_campaign
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            req.user.id,
            name || `${product.name} Affiliate Link`,
            description || `Earn ${product.commission_rate}% commission promoting ${product.name}`,
            originalUrl,
            shortCode,
            shortUrl,
            product.category,
            'affiliate',
            'link',
            utm_campaign || `product_${productId}`
        ]);

        const newLink = dbManager.queryOne(
            'SELECT * FROM affiliate_links WHERE id = ?',
            [result.lastInsertRowid]
        );

        res.status(201).json({
            success: true,
            message: 'Affiliate link created successfully',
            link: newLink,
            product: product
        });
    } catch (error) {
        console.error('Create product link error:', error);
        res.status(500).json({ error: 'Failed to create affiliate link' });
    }
});

// Get top performing products
router.get('/top/performers', (req, res) => {
    try {
        const { limit = 10, metric = 'sales' } = req.query;
        
        let orderBy = '';
        switch(metric) {
            case 'sales':
                orderBy = 'total_sales DESC';
                break;
            case 'commissions':
                orderBy = 'total_commissions_paid DESC';
                break;
            case 'clicks':
                orderBy = 'total_clicks DESC';
                break;
            default:
                orderBy = 'total_sales DESC';
        }

        const products = dbManager.query(`
            SELECT 
                p.*,
                COUNT(c.id) as total_commissions,
                SUM(c.commission_amount) as total_commissions_paid,
                COUNT(DISTINCT al.id) as affiliate_links_count,
                SUM(al.total_clicks) as total_clicks
            FROM products p
            LEFT JOIN commissions c ON p.id = c.product_id
            LEFT JOIN affiliate_links al ON p.id = al.id
            WHERE p.status = 'active'
            GROUP BY p.id
            HAVING total_commissions > 0
            ORDER BY ${orderBy}
            LIMIT ?
        `, [limit]);

        res.json({
            success: true,
            products: products,
            metric: metric
        });
    } catch (error) {
        console.error('Get top products error:', error);
        res.status(500).json({ error: 'Failed to get top products' });
    }
});

// Get trending products (based on recent activity)
router.get('/trending/recent', (req, res) => {
    try {
        const { days = 7, limit = 10 } = req.query;

        const products = dbManager.query(`
            SELECT 
                p.*,
                COUNT(c.id) as recent_sales,
                SUM(c.commission_amount) as recent_commissions,
                COUNT(DISTINCT c.user_id) as unique_affiliates
            FROM products p
            JOIN commissions c ON p.id = c.product_id
            WHERE c.sale_date >= datetime('now', '-${days} days')
            AND p.status = 'active'
            GROUP BY p.id
            ORDER BY recent_sales DESC, recent_commissions DESC
            LIMIT ?
        `, [limit]);

        res.json({
            success: true,
            products: products,
            period_days: days
        });
    } catch (error) {
        console.error('Get trending products error:', error);
        res.status(500).json({ error: 'Failed to get trending products' });
    }
});

// Search products with AI-powered recommendations
router.post('/search', (req, res) => {
    try {
        const { query, user_preferences, target_audience } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Search query required' });
        }

        // Basic search (would integrate with AI in production)
        const products = dbManager.query(`
            SELECT 
                p.*,
                COUNT(c.id) as commission_count,
                AVG(c.commission_amount) as avg_commission,
                (
                    CASE 
                        WHEN p.name LIKE ? THEN 100
                        WHEN p.description LIKE ? THEN 50
                        WHEN p.category LIKE ? THEN 30
                        ELSE 10
                    END
                ) as relevance_score
            FROM products p
            LEFT JOIN commissions c ON p.id = c.product_id
            WHERE p.status = 'active'
            AND (
                p.name LIKE ? OR 
                p.description LIKE ? OR 
                p.category LIKE ? OR
                p.vendor LIKE ?
            )
            GROUP BY p.id
            ORDER BY relevance_score DESC, commission_count DESC
            LIMIT 20
        `, [
            `%${query}%`, `%${query}%`, `%${query}%`,  // For relevance scoring
            `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`  // For WHERE clause
        ]);

        // AI recommendations (simulated)
        const aiRecommendations = [
            "High conversion rate in target demographic",
            "Trending in social media",
            "Seasonal demand increasing",
            "Premium commission tier available"
        ];

        res.json({
            success: true,
            products: products,
            query: query,
            ai_insights: aiRecommendations,
            total_results: products.length
        });
    } catch (error) {
        console.error('Product search error:', error);
        res.status(500).json({ error: 'Product search failed' });
    }
});

// AI-powered product description generator
router.post('/:id/ai-description', authenticateApiKey, (req, res) => {
    try {
        const productId = req.params.id;
        const { tone = 'professional', target_audience = 'general', length = 'medium' } = req.body;

        // Get product details
        const product = dbManager.queryOne('SELECT * FROM products WHERE id = ?', [productId]);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Simulate AI description generation (would use actual AI API in production)
        setTimeout(() => {
            const descriptions = {
                professional: `Experience the premium quality of ${product.name}. This ${product.category.toLowerCase()} product from ${product.vendor} delivers exceptional value at $${product.price}. With a ${product.commission_rate}% commission rate, it's an excellent choice for affiliate marketers targeting quality-conscious consumers.`,
                
                casual: `🔥 Check out the amazing ${product.name}! This awesome ${product.category.toLowerCase()} from ${product.vendor} is flying off the shelves at just $${product.price}. Plus, you'll earn ${product.commission_rate}% commission on every sale! 💰`,
                
                persuasive: `Don't miss out on the incredible ${product.name}! Limited stock available from ${product.vendor} at the unbeatable price of $${product.price}. Act fast and secure your ${product.commission_rate}% commission on this high-converting product that customers can't resist!`
            };

            const selectedDescription = descriptions[tone] || descriptions.professional;

            res.json({
                success: true,
                ai_description: selectedDescription,
                product_name: product.name,
                parameters: { tone, target_audience, length },
                suggestions: [
                    "Add urgency with limited-time offers",
                    "Include social proof and reviews",
                    "Highlight unique selling propositions",
                    "Use emotional triggers for your audience"
                ]
            });
        }, 1000);
        
    } catch (error) {
        console.error('AI description error:', error);
        res.status(500).json({ error: 'AI description generation failed' });
    }
});

// Product performance analytics
router.get('/:id/analytics', (req, res) => {
    try {
        const productId = req.params.id;
        const { days = 30 } = req.query;

        const analytics = dbManager.queryOne(`
            SELECT 
                COUNT(c.id) as total_sales,
                SUM(c.sale_amount) as total_revenue,
                SUM(c.commission_amount) as total_commissions,
                AVG(c.commission_amount) as avg_commission,
                COUNT(DISTINCT c.user_id) as unique_affiliates,
                COUNT(DISTINCT al.id) as affiliate_links_created
            FROM commissions c
            LEFT JOIN affiliate_links al ON c.product_id = al.id
            WHERE c.product_id = ?
            AND c.sale_date >= datetime('now', '-${days} days')
        `, [productId]);

        // Daily performance trend
        const dailyTrend = dbManager.query(`
            SELECT 
                DATE(c.sale_date) as date,
                COUNT(*) as sales,
                SUM(c.sale_amount) as revenue,
                SUM(c.commission_amount) as commissions
            FROM commissions c
            WHERE c.product_id = ?
            AND c.sale_date >= datetime('now', '-${days} days')
            GROUP BY DATE(c.sale_date)
            ORDER BY date ASC
        `, [productId]);

        res.json({
            success: true,
            analytics: {
                ...analytics,
                daily_trend: dailyTrend,
                period_days: days
            }
        });
    } catch (error) {
        console.error('Product analytics error:', error);
        res.status(500).json({ error: 'Failed to get product analytics' });
    }
});

module.exports = router;