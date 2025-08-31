// Change Password API
// Bangladesh dev style - secure password management

const { initDatabase } = require('../../lib/database');
const bcrypt = require('bcrypt');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const db = await initDatabase();
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validate required fields
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'All password fields are required'
            });
        }

        // Validate new password confirmation
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'New passwords do not match'
            });
        }

        // Validate new password strength
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'New password must be at least 8 characters long'
            });
        }

        // Get API key from headers
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).json({ success: false, error: 'API key required' });
        }

        // Get affiliate data with password
        const affiliate = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM affiliates WHERE api_key = ?', [apiKey], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!affiliate) {
            return res.status(401).json({ success: false, error: 'Invalid API key' });
        }

        // Verify current password
        const currentPasswordValid = await bcrypt.compare(currentPassword, affiliate.password_hash);
        if (!currentPasswordValid) {
            return res.status(400).json({
                success: false,
                error: 'Current password is incorrect'
            });
        }

        // Hash new password
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update password in database
        await new Promise((resolve, reject) => {
            db.run(`
                UPDATE affiliates 
                SET password_hash = ?,
                    password_changed_at = datetime('now'),
                    updated_at = datetime('now')
                WHERE id = ?
            `, [newPasswordHash, affiliate.id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Log password change for security
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO affiliate_activity_log 
                (affiliate_id, action, details, ip_address, created_at)
                VALUES (?, 'password_changed', 'Password successfully changed', ?, datetime('now'))
            `, [
                affiliate.id,
                req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Optionally invalidate all existing sessions/API keys for security
        // This would require generating a new API key and returning it
        
        res.json({
            success: true,
            message: 'Password changed successfully',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to change password'
        });
    }
};