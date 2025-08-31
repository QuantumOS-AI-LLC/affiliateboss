// Link Tracking API - Vercel Serverless
const Database = require('../../lib/database');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
    
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { method, query } = req;
    const db = Database.getInstance();

    try {
        if (method === 'GET' && query.action === 'stats') {
            const { affiliate_id, period = '30' } = query;
            
            const stats = db.prepare(`
                SELECT 
                    COUNT(*) as total_clicks,
                    COUNT(DISTINCT ip_address) as unique_visitors,
                    COUNT(DISTINCT DATE(created_at)) as active_days
                FROM affiliate_links 
                WHERE affiliate_id = ? AND created_at >= date('now', '-${period} days')
            `).get(affiliate_id);

            const conversions = db.prepare(`
                SELECT COUNT(*) as conversions, SUM(amount) as revenue
                FROM commissions 
                WHERE affiliate_id = ? AND created_at >= date('now', '-${period} days')
            `).get(affiliate_id);

            return res.json({
                success: true,
                data: { ...stats, ...conversions }
            });
        }

        if (method === 'POST' && query.action === 'track') {
            const { affiliate_id, product_id, ip_address, user_agent } = req.body;
            
            db.prepare(`
                INSERT INTO affiliate_links (affiliate_id, product_id, ip_address, user_agent, created_at)
                VALUES (?, ?, ?, ?, datetime('now'))
            `).run(affiliate_id, product_id, ip_address, user_agent);

            return res.json({ success: true });
        }

        return res.status(400).json({ error: 'Invalid request' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}