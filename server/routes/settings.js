// Settings API Routes
const express = require('express');
const dbManager = require('../../lib/database');
const { authenticateApiKey } = require('./auth');

const router = express.Router();

router.get('/', authenticateApiKey, (req, res) => {
    try {
        const settings = dbManager.queryOne(`
            SELECT * FROM user_settings WHERE user_id = ?
        `, [req.user.id]);

        res.json({ success: true, settings });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get settings' });
    }
});

router.put('/', authenticateApiKey, (req, res) => {
    try {
        const { timezone, language, currency, marketing_emails, auto_payout_enabled } = req.body;
        
        dbManager.run(`
            UPDATE user_settings SET
                timezone = COALESCE(?, timezone),
                language = COALESCE(?, language),
                currency = COALESCE(?, currency),
                marketing_emails = COALESCE(?, marketing_emails),
                auto_payout_enabled = COALESCE(?, auto_payout_enabled),
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `, [timezone, language, currency, marketing_emails, auto_payout_enabled, req.user.id]);

        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// SMS notification settings
router.post('/sms/test', authenticateApiKey, (req, res) => {
    try {
        const { phone } = req.body;
        
        // Simulate sending test SMS
        console.log(`📱 Test SMS sent to ${phone}: "Affiliate Boss SMS notifications are working!"`)
        
        res.json({ 
            success: true, 
            message: 'Test SMS sent successfully',
            demo_mode: true 
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send test SMS' });
    }
});

module.exports = router;