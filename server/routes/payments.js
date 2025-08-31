// Payments API Routes
const express = require('express');
const dbManager = require('../../lib/database');
const { authenticateApiKey } = require('./auth');

const router = express.Router();

router.get('/methods', authenticateApiKey, (req, res) => {
    try {
        const methods = dbManager.query(`
            SELECT id, type, provider, name, is_default, status, created_at
            FROM payment_methods 
            WHERE user_id = ? 
            ORDER BY is_default DESC, created_at DESC
        `, [req.user.id]);

        res.json({ success: true, payment_methods: methods });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get payment methods' });
    }
});

router.post('/methods', authenticateApiKey, (req, res) => {
    try {
        const { type, provider, name, details } = req.body;
        
        const result = dbManager.run(`
            INSERT INTO payment_methods (user_id, type, provider, name, details)
            VALUES (?, ?, ?, ?, ?)
        `, [req.user.id, type, provider, name, JSON.stringify(details)]);

        res.status(201).json({
            success: true,
            message: 'Payment method added successfully',
            method_id: result.lastInsertRowid
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add payment method' });
    }
});

router.get('/payouts', authenticateApiKey, (req, res) => {
    try {
        const payouts = dbManager.query(`
            SELECT p.*, pm.name as payment_method_name
            FROM payouts p
            JOIN payment_methods pm ON p.payment_method_id = pm.id
            WHERE p.user_id = ?
            ORDER BY p.requested_date DESC
        `, [req.user.id]);

        res.json({ success: true, payouts });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get payouts' });
    }
});

module.exports = router;