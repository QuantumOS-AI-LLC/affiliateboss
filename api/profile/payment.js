// Profile Payment Information API
// Bangladesh dev style - comprehensive payment management

const { initDatabase } = require('../../lib/database');

module.exports = async (req, res) => {
    if (req.method !== 'PUT') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const db = await initDatabase();
        const apiKey = req.headers['x-api-key'];

        if (!apiKey) {
            return res.status(401).json({ success: false, error: 'API key required' });
        }

        // Get affiliate data
        const affiliate = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM affiliates WHERE api_key = ?', [apiKey], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!affiliate) {
            return res.status(401).json({ success: false, error: 'Invalid API key' });
        }

        const { method, minPayout, details } = req.body;

        // Validate payment method
        const validMethods = ['paypal', 'bank', 'stripe', 'crypto'];
        if (method && !validMethods.includes(method)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid payment method'
            });
        }

        // Validate minimum payout amount
        if (minPayout && (minPayout < 10 || minPayout > 10000)) {
            return res.status(400).json({
                success: false,
                error: 'Minimum payout must be between $10 and $10,000'
            });
        }

        // Update payment information
        await new Promise((resolve, reject) => {
            db.run(`
                UPDATE affiliates 
                SET payment_method = ?,
                    min_payout_amount = ?,
                    payment_details = ?,
                    updated_at = datetime('now')
                WHERE id = ?
            `, [
                method || affiliate.payment_method,
                minPayout || affiliate.min_payout_amount,
                details || affiliate.payment_details,
                affiliate.id
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Log payment method change for security
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO affiliate_activity_log 
                (affiliate_id, action, details, ip_address, created_at)
                VALUES (?, 'payment_method_updated', ?, ?, datetime('now'))
            `, [
                affiliate.id,
                `Payment method updated to ${method || affiliate.payment_method}`,
                req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        res.json({
            success: true,
            message: 'Payment information updated successfully',
            data: {
                method: method || affiliate.payment_method,
                minPayout: minPayout || affiliate.min_payout_amount,
                updatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Payment update error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update payment information' 
        });
    }
};