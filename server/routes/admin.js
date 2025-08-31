// Admin API Routes for Merchant Management
// Bangladesh dev style - comprehensive affiliate program management

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const dbManager = require('../../lib/database');

const router = express.Router();

// Admin authentication middleware (simplified for demo)
function authenticateAdmin(req, res, next) {
    const adminKey = req.headers['x-admin-key'] || req.query.admin_key;
    
    // In production, this would validate admin credentials
    if (!adminKey || adminKey !== 'admin_key_demo_store_123') {
        return res.status(401).json({ error: 'Admin authentication required' });
    }
    
    // Mock admin user
    req.admin = {
        id: 1,
        store_name: 'Demo Fashion Store',
        plan: 'shopify_plus'
    };
    
    next();
}

// Get admin dashboard overview
router.get('/overview', authenticateAdmin, (req, res) => {
    try {
        // Get affiliate counts by status
        const affiliateStats = dbManager.queryOne(`
            SELECT 
                COUNT(*) as total_affiliates,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_affiliates,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_affiliates,
                COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_affiliates
            FROM users 
            WHERE id > 1
        `);

        // Get sales from affiliates this month
        const salesStats = dbManager.queryOne(`
            SELECT 
                SUM(c.sale_amount) as total_affiliate_sales,
                SUM(c.commission_amount) as total_commissions_paid,
                COUNT(c.id) as total_orders,
                AVG(c.commission_rate) as avg_commission_rate
            FROM commissions c
            WHERE c.sale_date >= datetime('now', 'start of month')
        `);

        // Get tier distribution
        const tierStats = dbManager.query(`
            SELECT 
                tier,
                COUNT(*) as count,
                AVG(total_earnings) as avg_earnings
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
        `);

        // Get recent activity
        const recentActivity = dbManager.query(`
            SELECT 
                u.username,
                u.email,
                c.commission_amount,
                c.sale_amount,
                c.sale_date,
                'commission' as activity_type
            FROM commissions c
            JOIN users u ON c.user_id = u.id
            WHERE c.created_at >= datetime('now', '-7 days')
            ORDER BY c.created_at DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            overview: {
                affiliate_stats: affiliateStats || { total_affiliates: 0, active_affiliates: 0, pending_affiliates: 0, suspended_affiliates: 0 },
                sales_stats: salesStats || { total_affiliate_sales: 0, total_commissions_paid: 0, total_orders: 0, avg_commission_rate: 0 },
                tier_distribution: tierStats,
                recent_activity: recentActivity
            }
        });
    } catch (error) {
        console.error('Admin overview error:', error);
        res.status(500).json({ error: 'Failed to get admin overview' });
    }
});

// Get all affiliates with filtering
router.get('/affiliates', authenticateAdmin, (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            status, 
            tier, 
            search,
            sort_by = 'created_at',
            sort_order = 'DESC'
        } = req.query;

        let whereClause = 'WHERE u.id > 1'; // Exclude admin user
        let params = [];

        // Add filters
        if (status) {
            whereClause += ' AND u.status = ?';
            params.push(status);
        }
        
        if (tier) {
            whereClause += ' AND u.tier = ?';
            params.push(tier);
        }
        
        if (search) {
            whereClause += ' AND (u.username LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        const offset = (page - 1) * limit;

        const affiliates = dbManager.query(`
            SELECT 
                u.*,
                COUNT(al.id) as total_links,
                COUNT(c.id) as total_commissions,
                SUM(CASE WHEN c.status = 'confirmed' THEN c.commission_amount ELSE 0 END) as confirmed_earnings,
                SUM(CASE WHEN c.status = 'pending' THEN c.commission_amount ELSE 0 END) as pending_earnings
            FROM users u
            LEFT JOIN affiliate_links al ON u.id = al.user_id
            LEFT JOIN commissions c ON u.id = c.user_id
            ${whereClause}
            GROUP BY u.id
            ORDER BY u.${sort_by} ${sort_order}
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        // Get total count
        const totalResult = dbManager.queryOne(`
            SELECT COUNT(*) as total 
            FROM users u 
            ${whereClause}
        `, params);

        res.json({
            success: true,
            affiliates: affiliates,
            pagination: {
                current_page: parseInt(page),
                per_page: parseInt(limit),
                total: totalResult.total,
                total_pages: Math.ceil(totalResult.total / limit)
            }
        });
    } catch (error) {
        console.error('Get affiliates error:', error);
        res.status(500).json({ error: 'Failed to get affiliates' });
    }
});

// Get single affiliate details
router.get('/affiliates/:id', authenticateAdmin, (req, res) => {
    try {
        const affiliateId = req.params.id;
        
        const affiliate = dbManager.queryOne(`
            SELECT 
                u.*,
                us.timezone,
                us.language,
                us.currency,
                us.monthly_earnings_goal,
                us.minimum_payout,
                us.auto_payout_enabled
            FROM users u
            LEFT JOIN user_settings us ON u.id = us.user_id
            WHERE u.id = ? AND u.id > 1
        `, [affiliateId]);

        if (!affiliate) {
            return res.status(404).json({ error: 'Affiliate not found' });
        }

        // Get affiliate performance data
        const performance = dbManager.queryOne(`
            SELECT 
                COUNT(al.id) as total_links,
                COUNT(c.id) as total_commissions,
                SUM(CASE WHEN c.status = 'confirmed' THEN c.commission_amount ELSE 0 END) as confirmed_earnings,
                SUM(CASE WHEN c.status = 'pending' THEN c.commission_amount ELSE 0 END) as pending_earnings,
                SUM(CASE WHEN c.status = 'paid' THEN c.commission_amount ELSE 0 END) as paid_earnings,
                SUM(ct.conversion_value) as total_sales_generated
            FROM users u
            LEFT JOIN affiliate_links al ON u.id = al.user_id
            LEFT JOIN commissions c ON u.id = c.user_id
            LEFT JOIN click_tracking ct ON u.id = ct.user_id AND ct.converted = 1
            WHERE u.id = ?
            GROUP BY u.id
        `, [affiliateId]);

        // Get recent activity
        const recentActivity = dbManager.query(`
            SELECT 
                'commission' as type,
                c.commission_amount as amount,
                c.sale_date as date,
                c.status,
                p.name as product_name
            FROM commissions c
            LEFT JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
            UNION ALL
            SELECT 
                'click' as type,
                ct.conversion_value as amount,
                ct.clicked_at as date,
                CASE WHEN ct.converted = 1 THEN 'converted' ELSE 'click' END as status,
                al.name as product_name
            FROM click_tracking ct
            LEFT JOIN affiliate_links al ON ct.link_id = al.id
            WHERE ct.user_id = ?
            ORDER BY date DESC
            LIMIT 20
        `, [affiliateId, affiliateId]);

        res.json({
            success: true,
            affiliate: {
                ...affiliate,
                performance: performance || {},
                recent_activity: recentActivity
            }
        });
    } catch (error) {
        console.error('Get affiliate details error:', error);
        res.status(500).json({ error: 'Failed to get affiliate details' });
    }
});

// Update affiliate status/tier
router.put('/affiliates/:id', authenticateAdmin, (req, res) => {
    try {
        const affiliateId = req.params.id;
        const { status, tier, notes } = req.body;

        // Check if affiliate exists
        const existing = dbManager.queryOne(
            'SELECT id, username, email FROM users WHERE id = ? AND id > 1',
            [affiliateId]
        );

        if (!existing) {
            return res.status(404).json({ error: 'Affiliate not found' });
        }

        // Update affiliate
        const updateFields = [];
        const updateValues = [];

        if (status) {
            updateFields.push('status = ?');
            updateValues.push(status);
        }
        
        if (tier) {
            updateFields.push('tier = ?');
            updateValues.push(tier);
        }

        if (updateFields.length > 0) {
            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            updateValues.push(affiliateId);

            dbManager.run(`
                UPDATE users SET ${updateFields.join(', ')}
                WHERE id = ?
            `, updateValues);
        }

        // Get updated affiliate
        const updatedAffiliate = dbManager.queryOne(
            'SELECT * FROM users WHERE id = ?',
            [affiliateId]
        );

        // Send SMS notification to affiliate
        console.log(`📱 SMS to ${existing.username}: Your affiliate account status has been updated.`);

        res.json({
            success: true,
            message: 'Affiliate updated successfully',
            affiliate: updatedAffiliate
        });
    } catch (error) {
        console.error('Update affiliate error:', error);
        res.status(500).json({ error: 'Failed to update affiliate' });
    }
});

// Send invitation to potential affiliate
router.post('/invite', authenticateAdmin, (req, res) => {
    try {
        const { email, name, tier = 'bronze', message } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email address required' });
        }

        // Check if user already exists
        const existing = dbManager.queryOne('SELECT id FROM users WHERE email = ?', [email]);
        if (existing) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }

        // Generate invitation token
        const invitationToken = uuidv4();
        
        // Store invitation (in production, you'd have an invitations table)
        // For demo, we'll simulate sending the invitation
        
        const invitationData = {
            email,
            name,
            tier,
            message,
            token: invitationToken,
            invited_by: req.admin.id,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        };

        // Simulate email sending
        console.log(`📧 Invitation sent to ${email}:`);
        console.log(`Subject: Invitation to join ${req.admin.store_name} Affiliate Program`);
        console.log(`Message: ${message || 'You have been invited to join our affiliate program!'}`);
        console.log(`Link: ${req.protocol}://${req.get('host')}/apply?token=${invitationToken}`);

        res.status(201).json({
            success: true,
            message: 'Invitation sent successfully',
            invitation: {
                email,
                name,
                tier,
                expires_at: invitationData.expires_at,
                invitation_link: `${req.protocol}://${req.get('host')}/apply?token=${invitationToken}`
            }
        });
    } catch (error) {
        console.error('Send invitation error:', error);
        res.status(500).json({ error: 'Failed to send invitation' });
    }
});

// Process affiliate application
router.post('/applications', (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            phone,
            marketing_channel,
            experience_level,
            marketing_urls,
            audience_size,
            audience_demographics,
            niches,
            marketing_plan,
            expected_sales,
            country,
            tax_id,
            invitation_token
        } = req.body;

        // Validate required fields
        if (!first_name || !last_name || !email || !marketing_plan) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if user already exists
        const existing = dbManager.queryOne('SELECT id FROM users WHERE email = ?', [email]);
        if (existing) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }

        // Generate username and API key
        const username = `${first_name.toLowerCase()}_${last_name.toLowerCase()}_${Date.now()}`;
        const apiKey = `api_key_${username}_${Math.random().toString(36).substring(7)}`;

        // Create new affiliate user (status: pending for review)
        const result = dbManager.run(`
            INSERT INTO users (
                username, email, phone, first_name, last_name, 
                api_key, status, tier, email_verified, phone_verified
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 'bronze', 0, 0)
        `, [username, email, phone, first_name, last_name, apiKey]);

        const userId = result.lastInsertRowid;

        // Create user settings
        dbManager.run(`
            INSERT INTO user_settings (user_id) VALUES (?)
        `, [userId]);

        // Store application details (in production, you'd have an applications table)
        // For demo, we'll store in a JSON format or separate table

        // Send confirmation email (simulated)
        console.log(`📧 Application confirmation sent to ${email}:`);
        console.log(`Subject: Affiliate Application Received - ${first_name} ${last_name}`);
        console.log(`Application ID: APP-${userId}`);

        // Send SMS to admin (simulated)
        console.log(`📱 Admin SMS: New affiliate application from ${first_name} ${last_name} (${marketing_channel})`);

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            application: {
                id: `APP-${userId}`,
                user_id: userId,
                status: 'pending',
                submitted_at: new Date().toISOString(),
                expected_review_time: '24-48 hours'
            }
        });
    } catch (error) {
        console.error('Process application error:', error);
        res.status(500).json({ error: 'Failed to process application' });
    }
});

// Send message to affiliate(s)
router.post('/messages', authenticateAdmin, (req, res) => {
    try {
        const { 
            recipient_type, // 'single', 'tier', 'status', 'all'
            recipients, // array of user IDs or criteria
            subject,
            message,
            message_type = 'announcement' // 'announcement', 'newsletter', 'promotion', 'training'
        } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ error: 'Subject and message required' });
        }

        let targetUsers = [];

        switch (recipient_type) {
            case 'single':
                if (!recipients || recipients.length === 0) {
                    return res.status(400).json({ error: 'Recipients required for single message' });
                }
                targetUsers = dbManager.query(
                    `SELECT id, username, email FROM users WHERE id IN (${recipients.map(() => '?').join(',')}) AND id > 1`,
                    recipients
                );
                break;

            case 'tier':
                const tier = recipients[0];
                targetUsers = dbManager.query(
                    'SELECT id, username, email FROM users WHERE tier = ? AND id > 1',
                    [tier]
                );
                break;

            case 'status':
                const status = recipients[0];
                targetUsers = dbManager.query(
                    'SELECT id, username, email FROM users WHERE status = ? AND id > 1',
                    [status]
                );
                break;

            case 'all':
                targetUsers = dbManager.query(
                    'SELECT id, username, email FROM users WHERE id > 1'
                );
                break;

            default:
                return res.status(400).json({ error: 'Invalid recipient type' });
        }

        if (targetUsers.length === 0) {
            return res.status(400).json({ error: 'No users found matching criteria' });
        }

        // Simulate sending messages
        targetUsers.forEach(user => {
            console.log(`📧 Message sent to ${user.email}:`);
            console.log(`Subject: ${subject}`);
            console.log(`Type: ${message_type.toUpperCase()}`);
            console.log(`Message: ${message.substring(0, 100)}...`);
        });

        // Send summary SMS to admin
        console.log(`📱 Admin SMS: Message "${subject}" sent to ${targetUsers.length} affiliates`);

        res.json({
            success: true,
            message: `Message sent to ${targetUsers.length} affiliate(s)`,
            sent_count: targetUsers.length,
            message_id: `MSG-${Date.now()}`
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Get commission analytics
router.get('/analytics/commissions', authenticateAdmin, (req, res) => {
    try {
        const { days = 30 } = req.query;

        // Daily commission data
        const dailyCommissions = dbManager.query(`
            SELECT 
                DATE(c.sale_date) as date,
                COUNT(c.id) as commission_count,
                SUM(c.sale_amount) as total_sales,
                SUM(c.commission_amount) as total_commissions,
                COUNT(DISTINCT c.user_id) as unique_affiliates
            FROM commissions c
            WHERE c.sale_date >= datetime('now', '-${days} days')
            GROUP BY DATE(c.sale_date)
            ORDER BY date ASC
        `);

        // Tier performance
        const tierPerformance = dbManager.query(`
            SELECT 
                u.tier,
                COUNT(c.id) as commission_count,
                SUM(c.commission_amount) as total_commissions,
                AVG(c.commission_amount) as avg_commission,
                COUNT(DISTINCT u.id) as affiliate_count
            FROM commissions c
            JOIN users u ON c.user_id = u.id
            WHERE c.sale_date >= datetime('now', '-${days} days')
            GROUP BY u.tier
            ORDER BY total_commissions DESC
        `);

        // Top performers
        const topPerformers = dbManager.query(`
            SELECT 
                u.username,
                u.email,
                u.tier,
                COUNT(c.id) as commission_count,
                SUM(c.commission_amount) as total_commissions,
                SUM(c.sale_amount) as total_sales
            FROM commissions c
            JOIN users u ON c.user_id = u.id
            WHERE c.sale_date >= datetime('now', '-${days} days')
            GROUP BY u.id
            ORDER BY total_commissions DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            analytics: {
                period_days: days,
                daily_commissions: dailyCommissions,
                tier_performance: tierPerformance,
                top_performers: topPerformers
            }
        });
    } catch (error) {
        console.error('Commission analytics error:', error);
        res.status(500).json({ error: 'Failed to get commission analytics' });
    }
});

module.exports = router;