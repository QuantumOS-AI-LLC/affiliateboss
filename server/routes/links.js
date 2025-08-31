// Affiliate Links API Routes
// Bangladesh dev style - comprehensive link management with analytics

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dbManager = require('../../lib/database');
const { authenticateApiKey } = require('./auth');

const router = express.Router();

// Get all links for user with filtering and pagination
router.get('/', authenticateApiKey, (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            status, 
            category, 
            search,
            sort_by = 'created_at',
            sort_order = 'DESC'
        } = req.query;

        let whereClause = 'WHERE al.user_id = ?';
        let params = [req.user.id];

        // Add filters
        if (status) {
            whereClause += ' AND al.status = ?';
            params.push(status);
        }
        
        if (category) {
            whereClause += ' AND al.category = ?';
            params.push(category);
        }
        
        if (search) {
            whereClause += ' AND (al.name LIKE ? OR al.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        const offset = (page - 1) * limit;

        const links = dbManager.query(`
            SELECT 
                al.*,
                p.name as product_name,
                p.commission_rate,
                COUNT(ct.id) as total_clicks_count,
                COUNT(CASE WHEN ct.converted = 1 THEN 1 END) as conversions_count,
                SUM(CASE WHEN ct.converted = 1 THEN ct.conversion_value ELSE 0 END) as total_revenue
            FROM affiliate_links al
            LEFT JOIN products p ON al.original_url LIKE '%' || p.id || '%'
            LEFT JOIN click_tracking ct ON al.id = ct.link_id
            ${whereClause}
            GROUP BY al.id
            ORDER BY ${sort_by} ${sort_order}
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        // Get total count
        const totalResult = dbManager.queryOne(`
            SELECT COUNT(*) as total 
            FROM affiliate_links al 
            ${whereClause}
        `, params);

        res.json({
            success: true,
            links: links,
            pagination: {
                current_page: parseInt(page),
                per_page: parseInt(limit),
                total: totalResult.total,
                total_pages: Math.ceil(totalResult.total / limit)
            }
        });
    } catch (error) {
        console.error('Get links error:', error);
        res.status(500).json({ error: 'Failed to get links' });
    }
});

// Get single link details with analytics
router.get('/:id', authenticateApiKey, (req, res) => {
    try {
        const linkId = req.params.id;
        
        const link = dbManager.queryOne(`
            SELECT 
                al.*,
                p.name as product_name,
                p.commission_rate
            FROM affiliate_links al
            LEFT JOIN products p ON al.original_url LIKE '%' || p.id || '%'
            WHERE al.id = ? AND al.user_id = ?
        `, [linkId, req.user.id]);

        if (!link) {
            return res.status(404).json({ error: 'Link not found' });
        }

        // Get performance data
        const performance = dbManager.queryOne(`
            SELECT 
                COUNT(*) as total_clicks,
                COUNT(DISTINCT ip_address) as unique_clicks,
                COUNT(CASE WHEN converted = 1 THEN 1 END) as conversions,
                SUM(CASE WHEN converted = 1 THEN conversion_value ELSE 0 END) as total_revenue,
                CASE 
                    WHEN COUNT(*) > 0 THEN 
                        ROUND((COUNT(CASE WHEN converted = 1 THEN 1 END) * 100.0) / COUNT(*), 2)
                    ELSE 0 
                END as conversion_rate
            FROM click_tracking 
            WHERE link_id = ?
        `, [linkId]);

        // Get recent clicks
        const recentClicks = dbManager.query(`
            SELECT 
                clicked_at,
                country,
                device_type,
                browser,
                converted,
                conversion_value
            FROM click_tracking 
            WHERE link_id = ? 
            ORDER BY clicked_at DESC 
            LIMIT 50
        `, [linkId]);

        res.json({
            success: true,
            link: {
                ...link,
                performance: performance,
                recent_clicks: recentClicks
            }
        });
    } catch (error) {
        console.error('Get link details error:', error);
        res.status(500).json({ error: 'Failed to get link details' });
    }
});

// Create new affiliate link
router.post('/', authenticateApiKey, (req, res) => {
    try {
        const {
            name,
            description,
            original_url,
            category = 'general',
            utm_source,
            utm_medium,
            utm_campaign,
            product_id
        } = req.body;

        if (!name || !original_url) {
            return res.status(400).json({ error: 'Name and original URL required' });
        }

        // Generate short code and URL
        const shortCode = uuidv4().substring(0, 8);
        const shortUrl = `https://aff.boss/${shortCode}`;

        const result = dbManager.run(`
            INSERT INTO affiliate_links (
                user_id, name, description, original_url, short_code, short_url,
                category, utm_source, utm_medium, utm_campaign
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            req.user.id, name, description, original_url, shortCode, shortUrl,
            category, utm_source, utm_medium, utm_campaign
        ]);

        // Get the created link
        const newLink = dbManager.queryOne(
            'SELECT * FROM affiliate_links WHERE id = ?', 
            [result.lastInsertRowid]
        );

        // Send SMS notification (demo simulation)
        console.log(`📱 SMS: New affiliate link "${name}" created successfully!`);

        res.status(201).json({
            success: true,
            message: 'Affiliate link created successfully',
            link: newLink,
            sms_sent: true
        });
    } catch (error) {
        console.error('Create link error:', error);
        res.status(500).json({ error: 'Failed to create link' });
    }
});

// Update affiliate link
router.put('/:id', authenticateApiKey, (req, res) => {
    try {
        const linkId = req.params.id;
        const {
            name,
            description,
            status,
            category,
            utm_source,
            utm_medium,
            utm_campaign
        } = req.body;

        // Check if link exists and belongs to user
        const existing = dbManager.queryOne(
            'SELECT id FROM affiliate_links WHERE id = ? AND user_id = ?',
            [linkId, req.user.id]
        );

        if (!existing) {
            return res.status(404).json({ error: 'Link not found' });
        }

        // Update link
        dbManager.run(`
            UPDATE affiliate_links SET
                name = COALESCE(?, name),
                description = COALESCE(?, description),
                status = COALESCE(?, status),
                category = COALESCE(?, category),
                utm_source = COALESCE(?, utm_source),
                utm_medium = COALESCE(?, utm_medium),
                utm_campaign = COALESCE(?, utm_campaign),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [name, description, status, category, utm_source, utm_medium, utm_campaign, linkId]);

        // Get updated link
        const updatedLink = dbManager.queryOne(
            'SELECT * FROM affiliate_links WHERE id = ?',
            [linkId]
        );

        res.json({
            success: true,
            message: 'Link updated successfully',
            link: updatedLink
        });
    } catch (error) {
        console.error('Update link error:', error);
        res.status(500).json({ error: 'Failed to update link' });
    }
});

// Delete affiliate link
router.delete('/:id', authenticateApiKey, (req, res) => {
    try {
        const linkId = req.params.id;

        // Check if link exists and belongs to user
        const existing = dbManager.queryOne(
            'SELECT id FROM affiliate_links WHERE id = ? AND user_id = ?',
            [linkId, req.user.id]
        );

        if (!existing) {
            return res.status(404).json({ error: 'Link not found' });
        }

        // Delete link (this will cascade to click_tracking due to foreign key)
        dbManager.run('DELETE FROM affiliate_links WHERE id = ?', [linkId]);

        res.json({
            success: true,
            message: 'Link deleted successfully'
        });
    } catch (error) {
        console.error('Delete link error:', error);
        res.status(500).json({ error: 'Failed to delete link' });
    }
});

// Bulk operations
router.post('/bulk', authenticateApiKey, (req, res) => {
    try {
        const { action, link_ids } = req.body;

        if (!action || !Array.isArray(link_ids) || link_ids.length === 0) {
            return res.status(400).json({ error: 'Action and link IDs required' });
        }

        const placeholders = link_ids.map(() => '?').join(',');
        
        switch (action) {
            case 'activate':
                dbManager.run(`
                    UPDATE affiliate_links 
                    SET status = 'active', updated_at = CURRENT_TIMESTAMP 
                    WHERE id IN (${placeholders}) AND user_id = ?
                `, [...link_ids, req.user.id]);
                break;
                
            case 'pause':
                dbManager.run(`
                    UPDATE affiliate_links 
                    SET status = 'paused', updated_at = CURRENT_TIMESTAMP 
                    WHERE id IN (${placeholders}) AND user_id = ?
                `, [...link_ids, req.user.id]);
                break;
                
            case 'delete':
                dbManager.run(`
                    DELETE FROM affiliate_links 
                    WHERE id IN (${placeholders}) AND user_id = ?
                `, [...link_ids, req.user.id]);
                break;
                
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }

        res.json({
            success: true,
            message: `Bulk ${action} completed`,
            affected_links: link_ids.length
        });
    } catch (error) {
        console.error('Bulk operation error:', error);
        res.status(500).json({ error: 'Bulk operation failed' });
    }
});

// Click tracking endpoint (for redirects)
router.get('/:shortCode/click', (req, res) => {
    try {
        const { shortCode } = req.params;
        const {
            ip = req.ip,
            user_agent = req.get('User-Agent'),
            referer = req.get('Referer')
        } = req.query;

        // Find link by short code
        const link = dbManager.queryOne(
            'SELECT * FROM affiliate_links WHERE short_code = ? AND status = "active"',
            [shortCode]
        );

        if (!link) {
            return res.status(404).json({ error: 'Link not found or inactive' });
        }

        // Record click
        dbManager.run(`
            INSERT INTO click_tracking (
                link_id, user_id, ip_address, user_agent, referer, 
                country, device_type, browser
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            link.id,
            link.user_id,
            ip,
            user_agent,
            referer,
            'Demo Country', // Would use GeoIP in production
            'Desktop', // Would parse user agent
            'Chrome' // Would parse user agent
        ]);

        // Update link click count
        dbManager.run(
            'UPDATE affiliate_links SET total_clicks = total_clicks + 1, last_click_at = CURRENT_TIMESTAMP WHERE id = ?',
            [link.id]
        );

        // Redirect to original URL
        res.redirect(link.original_url);
    } catch (error) {
        console.error('Click tracking error:', error);
        res.status(500).json({ error: 'Click tracking failed' });
    }
});

// Link analytics
router.get('/:id/analytics', authenticateApiKey, (req, res) => {
    try {
        const linkId = req.params.id;
        const { days = 30 } = req.query;

        // Check if link belongs to user
        const link = dbManager.queryOne(
            'SELECT id FROM affiliate_links WHERE id = ? AND user_id = ?',
            [linkId, req.user.id]
        );

        if (!link) {
            return res.status(404).json({ error: 'Link not found' });
        }

        // Get daily performance data
        const dailyData = dbManager.query(`
            SELECT 
                DATE(clicked_at) as date,
                COUNT(*) as clicks,
                COUNT(DISTINCT ip_address) as unique_clicks,
                COUNT(CASE WHEN converted = 1 THEN 1 END) as conversions,
                SUM(CASE WHEN converted = 1 THEN conversion_value ELSE 0 END) as revenue
            FROM click_tracking 
            WHERE link_id = ? 
            AND clicked_at >= datetime('now', '-${days} days')
            GROUP BY DATE(clicked_at)
            ORDER BY date DESC
        `, [linkId]);

        // Get geographic data
        const geoData = dbManager.query(`
            SELECT 
                country,
                COUNT(*) as clicks,
                COUNT(CASE WHEN converted = 1 THEN 1 END) as conversions
            FROM click_tracking 
            WHERE link_id = ? 
            AND clicked_at >= datetime('now', '-${days} days')
            GROUP BY country
            ORDER BY clicks DESC
            LIMIT 10
        `, [linkId]);

        // Get device data
        const deviceData = dbManager.query(`
            SELECT 
                device_type,
                COUNT(*) as clicks,
                COUNT(CASE WHEN converted = 1 THEN 1 END) as conversions
            FROM click_tracking 
            WHERE link_id = ? 
            AND clicked_at >= datetime('now', '-${days} days')
            GROUP BY device_type
            ORDER BY clicks DESC
        `, [linkId]);

        res.json({
            success: true,
            analytics: {
                daily_performance: dailyData,
                geographic_breakdown: geoData,
                device_breakdown: deviceData,
                period_days: days
            }
        });
    } catch (error) {
        console.error('Link analytics error:', error);
        res.status(500).json({ error: 'Failed to get analytics' });
    }
});

module.exports = router;