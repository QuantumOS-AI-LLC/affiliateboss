// Analytics API Routes
const express = require('express');
const dbManager = require('../../lib/database');
const { authenticateApiKey } = require('./auth');

const router = express.Router();

router.get('/dashboard', authenticateApiKey, (req, res) => {
    try {
        const stats = dbManager.getUserStats(req.user.id);
        const recentActivity = dbManager.getRecentActivity(req.user.id);
        const performanceData = dbManager.getPerformanceData(req.user.id, 30);

        res.json({
            success: true,
            dashboard: {
                user_stats: stats,
                recent_activity: recentActivity,
                performance_trend: performanceData
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get analytics' });
    }
});

router.get('/traffic-sources', authenticateApiKey, (req, res) => {
    try {
        const sources = [
            { source: 'Social Media', clicks: 15420, conversions: 892 },
            { source: 'Email Marketing', clicks: 12350, conversions: 745 },
            { source: 'Direct Traffic', clicks: 9870, conversions: 523 },
            { source: 'Search Engines', clicks: 7640, conversions: 398 },
            { source: 'Paid Ads', clicks: 5230, conversions: 287 }
        ];
        
        res.json({ success: true, traffic_sources: sources });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get traffic sources' });
    }
});

module.exports = router;