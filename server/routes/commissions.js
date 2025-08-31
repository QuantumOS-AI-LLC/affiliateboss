// Commissions API Routes
const express = require('express');
const dbManager = require('../../lib/database');
const { authenticateApiKey } = require('./auth');

const router = express.Router();

router.get('/', authenticateApiKey, (req, res) => {
    try {
        const commissions = dbManager.query(`
            SELECT c.*, p.name as product_name, al.name as link_name
            FROM commissions c
            LEFT JOIN products p ON c.product_id = p.id
            LEFT JOIN affiliate_links al ON c.link_id = al.id
            WHERE c.user_id = ?
            ORDER BY c.created_at DESC
            LIMIT 50
        `, [req.user.id]);

        const stats = dbManager.queryOne(`
            SELECT 
                COUNT(*) as total_commissions,
                SUM(commission_amount) as total_earnings,
                SUM(CASE WHEN status = 'pending' THEN commission_amount ELSE 0 END) as pending_earnings,
                SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END) as paid_earnings
            FROM commissions 
            WHERE user_id = ?
        `, [req.user.id]);

        res.json({ success: true, commissions, stats });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get commissions' });
    }
});

module.exports = router;