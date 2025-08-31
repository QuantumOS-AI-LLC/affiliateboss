// Admin Payout Management API - Vercel Serverless
// Handles commission payouts, payment processing, and financial operations

const Database = require('../../lib/database');

export default async function handler(req, res) {
    // Enable CORS for all origins
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { method, query, body } = req;
    const db = Database.getInstance();

    try {
        switch (method) {
            case 'GET':
                if (query.action === 'pending') {
                    return await getPendingPayouts(req, res, db);
                } else if (query.action === 'history') {
                    return await getPayoutHistory(req, res, db);
                } else if (query.action === 'summary') {
                    return await getPayoutSummary(req, res, db);
                } else {
                    return await getAllPayouts(req, res, db);
                }
                
            case 'POST':
                if (query.action === 'process') {
                    return await processPayouts(req, res, db);
                } else if (query.action === 'bulk') {
                    return await processBulkPayouts(req, res, db);
                } else {
                    return await createPayout(req, res, db);
                }
                
            case 'PUT':
                return await updatePayoutStatus(req, res, db);
                
            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'OPTIONS']);
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Admin Payouts API Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
}

// Get all pending payouts for processing
async function getPendingPayouts(req, res, db) {
    const { limit = 50, offset = 0, threshold = 25 } = req.query;

    const payouts = db.prepare(`
        SELECT 
            a.id as affiliate_id,
            a.first_name,
            a.last_name,
            a.email,
            a.phone,
            a.tier,
            SUM(c.amount) as total_pending,
            COUNT(c.id) as commission_count,
            MIN(c.created_at) as oldest_commission,
            MAX(c.created_at) as newest_commission,
            pi.payment_method,
            pi.paypal_email,
            pi.bank_name,
            pi.account_number,
            pi.routing_number
        FROM affiliates a
        LEFT JOIN commissions c ON a.id = c.affiliate_id AND c.status = 'approved'
        LEFT JOIN payment_info pi ON a.id = pi.affiliate_id
        WHERE c.amount IS NOT NULL
        GROUP BY a.id
        HAVING total_pending >= ?
        ORDER BY total_pending DESC
        LIMIT ? OFFSET ?
    `).all(threshold, limit, offset);

    // Get additional statistics
    const stats = db.prepare(`
        SELECT 
            COUNT(DISTINCT a.id) as affiliates_ready,
            SUM(c.amount) as total_amount,
            AVG(c.amount) as avg_commission
        FROM affiliates a
        LEFT JOIN commissions c ON a.id = c.affiliate_id AND c.status = 'approved'
        WHERE c.amount IS NOT NULL
        GROUP BY a.id
        HAVING SUM(c.amount) >= ?
    `).get(threshold);

    return res.json({
        success: true,
        data: {
            payouts,
            stats: stats || {
                affiliates_ready: 0,
                total_amount: 0,
                avg_commission: 0
            },
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                threshold: parseFloat(threshold)
            }
        }
    });
}

// Process individual payout
async function processPayouts(req, res, db) {
    const { affiliate_ids, payment_method = 'paypal', notes = '' } = req.body;

    if (!affiliate_ids || !Array.isArray(affiliate_ids) || affiliate_ids.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Affiliate IDs array is required'
        });
    }

    const transaction = db.transaction((affiliateIds) => {
        const results = [];
        
        for (const affiliateId of affiliateIds) {
            // Get approved commissions for this affiliate
            const commissions = db.prepare(`
                SELECT * FROM commissions 
                WHERE affiliate_id = ? AND status = 'approved'
            `).all(affiliateId);

            if (commissions.length === 0) continue;

            const totalAmount = commissions.reduce((sum, c) => sum + c.amount, 0);

            // Create payout record
            const payoutId = db.prepare(`
                INSERT INTO payouts (
                    affiliate_id, amount, payment_method, status, notes, created_at
                ) VALUES (?, ?, ?, 'processing', ?, datetime('now'))
            `).run(affiliateId, totalAmount, payment_method, notes).lastInsertRowid;

            // Update commissions to paid status
            const commissionIds = commissions.map(c => c.id);
            const placeholders = commissionIds.map(() => '?').join(',');
            db.prepare(`
                UPDATE commissions 
                SET status = 'paid', payout_id = ? 
                WHERE id IN (${placeholders})
            `).run(payoutId, ...commissionIds);

            // Record in payout_items
            for (const commission of commissions) {
                db.prepare(`
                    INSERT INTO payout_items (
                        payout_id, commission_id, amount, created_at
                    ) VALUES (?, ?, ?, datetime('now'))
                `).run(payoutId, commission.id, commission.amount);
            }

            results.push({
                affiliate_id: affiliateId,
                payout_id: payoutId,
                amount: totalAmount,
                commission_count: commissions.length
            });
        }

        return results;
    });

    const results = transaction(affiliate_ids);

    return res.json({
        success: true,
        data: {
            processed_payouts: results,
            total_amount: results.reduce((sum, r) => sum + r.amount, 0),
            total_affiliates: results.length
        }
    });
}

// Process bulk payouts with advanced options
async function processBulkPayouts(req, res, db) {
    const { 
        minimum_amount = 25, 
        payment_method = 'paypal', 
        tier_filter = null,
        exclude_affiliates = [],
        notes = 'Bulk payout processing'
    } = req.body;

    // Get eligible affiliates
    let whereClause = 'WHERE c.amount IS NOT NULL';
    let params = [minimum_amount];
    
    if (tier_filter) {
        whereClause += ' AND a.tier = ?';
        params.push(tier_filter);
    }
    
    if (exclude_affiliates.length > 0) {
        const placeholders = exclude_affiliates.map(() => '?').join(',');
        whereClause += ` AND a.id NOT IN (${placeholders})`;
        params.push(...exclude_affiliates);
    }

    const eligibleAffiliates = db.prepare(`
        SELECT 
            a.id as affiliate_id,
            SUM(c.amount) as total_pending
        FROM affiliates a
        LEFT JOIN commissions c ON a.id = c.affiliate_id AND c.status = 'approved'
        ${whereClause}
        GROUP BY a.id
        HAVING total_pending >= ?
        ORDER BY total_pending DESC
    `).all(...params);

    if (eligibleAffiliates.length === 0) {
        return res.json({
            success: true,
            data: {
                message: 'No eligible affiliates found for bulk payout',
                processed_payouts: [],
                total_amount: 0,
                total_affiliates: 0
            }
        });
    }

    // Process bulk payouts
    const affiliateIds = eligibleAffiliates.map(a => a.affiliate_id);
    const bulkRequest = { affiliate_ids: affiliateIds, payment_method, notes };
    
    // Reuse the individual processing logic
    req.body = bulkRequest;
    return await processPayouts(req, res, db);
}

// Get payout history with filters
async function getPayoutHistory(req, res, db) {
    const { 
        limit = 50, 
        offset = 0, 
        start_date = null, 
        end_date = null,
        status = null,
        payment_method = null
    } = req.query;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (start_date) {
        whereClause += ' AND p.created_at >= ?';
        params.push(start_date);
    }
    
    if (end_date) {
        whereClause += ' AND p.created_at <= ?';
        params.push(end_date);
    }
    
    if (status) {
        whereClause += ' AND p.status = ?';
        params.push(status);
    }
    
    if (payment_method) {
        whereClause += ' AND p.payment_method = ?';
        params.push(payment_method);
    }

    const payouts = db.prepare(`
        SELECT 
            p.*,
            a.first_name,
            a.last_name,
            a.email,
            a.tier,
            COUNT(pi.id) as item_count
        FROM payouts p
        JOIN affiliates a ON p.affiliate_id = a.id
        LEFT JOIN payout_items pi ON p.id = pi.payout_id
        ${whereClause}
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    // Get summary statistics
    const summary = db.prepare(`
        SELECT 
            COUNT(*) as total_payouts,
            SUM(amount) as total_amount,
            AVG(amount) as avg_amount,
            status
        FROM payouts p
        ${whereClause}
        GROUP BY status
    `).all(...params);

    return res.json({
        success: true,
        data: {
            payouts,
            summary,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        }
    });
}

// Get payout summary statistics
async function getPayoutSummary(req, res, db) {
    const { period = '30' } = req.query;
    
    const summary = db.prepare(`
        SELECT 
            COUNT(*) as total_payouts,
            SUM(amount) as total_amount,
            AVG(amount) as avg_payout,
            status,
            payment_method
        FROM payouts 
        WHERE created_at >= date('now', '-${period} days')
        GROUP BY status, payment_method
        ORDER BY status, payment_method
    `).all();

    // Monthly trend data
    const monthlyTrend = db.prepare(`
        SELECT 
            strftime('%Y-%m', created_at) as month,
            COUNT(*) as payout_count,
            SUM(amount) as total_amount
        FROM payouts 
        WHERE created_at >= date('now', '-12 months')
        GROUP BY strftime('%Y-%m', created_at)
        ORDER BY month
    `).all();

    // Top affiliates by payouts
    const topAffiliates = db.prepare(`
        SELECT 
            a.first_name,
            a.last_name,
            a.email,
            a.tier,
            COUNT(p.id) as payout_count,
            SUM(p.amount) as total_received
        FROM affiliates a
        JOIN payouts p ON a.id = p.affiliate_id
        WHERE p.created_at >= date('now', '-${period} days')
        GROUP BY a.id
        ORDER BY total_received DESC
        LIMIT 10
    `).all();

    return res.json({
        success: true,
        data: {
            summary,
            monthly_trend: monthlyTrend,
            top_affiliates: topAffiliates,
            period: parseInt(period)
        }
    });
}

// Get all payouts with basic info
async function getAllPayouts(req, res, db) {
    const { limit = 50, offset = 0 } = req.query;
    
    const payouts = db.prepare(`
        SELECT 
            p.id,
            p.amount,
            p.status,
            p.payment_method,
            p.created_at,
            a.first_name,
            a.last_name,
            a.email
        FROM payouts p
        JOIN affiliates a ON p.affiliate_id = a.id
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
    `).all(limit, offset);

    return res.json({
        success: true,
        data: payouts
    });
}

// Update payout status
async function updatePayoutStatus(req, res, db) {
    const { payout_id, status, notes = '' } = req.body;
    
    if (!payout_id || !status) {
        return res.status(400).json({
            success: false,
            error: 'Payout ID and status are required'
        });
    }

    const validStatuses = ['processing', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid status. Must be: ' + validStatuses.join(', ')
        });
    }

    const result = db.prepare(`
        UPDATE payouts 
        SET status = ?, notes = ?, updated_at = datetime('now')
        WHERE id = ?
    `).run(status, notes, payout_id);

    if (result.changes === 0) {
        return res.status(404).json({
            success: false,
            error: 'Payout not found'
        });
    }

    // If payout failed, revert commissions back to approved status
    if (status === 'failed' || status === 'cancelled') {
        db.prepare(`
            UPDATE commissions 
            SET status = 'approved', payout_id = NULL
            WHERE payout_id = ?
        `).run(payout_id);
    }

    return res.json({
        success: true,
        message: 'Payout status updated successfully'
    });
}

// Create manual payout
async function createPayout(req, res, db) {
    const { 
        affiliate_id, 
        amount, 
        payment_method = 'paypal', 
        notes = '',
        commission_ids = []
    } = req.body;
    
    if (!affiliate_id || !amount) {
        return res.status(400).json({
            success: false,
            error: 'Affiliate ID and amount are required'
        });
    }

    const transaction = db.transaction(() => {
        // Create payout record
        const payoutId = db.prepare(`
            INSERT INTO payouts (
                affiliate_id, amount, payment_method, status, notes, created_at
            ) VALUES (?, ?, ?, 'processing', ?, datetime('now'))
        `).run(affiliate_id, amount, payment_method, notes).lastInsertRowid;

        // If specific commissions provided, mark them as paid
        if (commission_ids.length > 0) {
            const placeholders = commission_ids.map(() => '?').join(',');
            db.prepare(`
                UPDATE commissions 
                SET status = 'paid', payout_id = ?
                WHERE id IN (${placeholders}) AND affiliate_id = ?
            `).run(payoutId, ...commission_ids, affiliate_id);

            // Record payout items
            for (const commissionId of commission_ids) {
                const commission = db.prepare(`
                    SELECT amount FROM commissions WHERE id = ?
                `).get(commissionId);

                if (commission) {
                    db.prepare(`
                        INSERT INTO payout_items (
                            payout_id, commission_id, amount, created_at
                        ) VALUES (?, ?, ?, datetime('now'))
                    `).run(payoutId, commissionId, commission.amount);
                }
            }
        }

        return payoutId;
    });

    const payoutId = transaction();

    return res.json({
        success: true,
        data: {
            payout_id: payoutId,
            message: 'Payout created successfully'
        }
    });
}