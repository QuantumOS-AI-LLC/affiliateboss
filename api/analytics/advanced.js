// Advanced Analytics API - Comprehensive Performance Insights
// Bangladesh dev style - detailed analytics and reporting

const { initDatabase } = require('../../lib/database');

// Helper function to generate date range
function getDateRange(days) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
    };
}

// Helper function to generate demo analytics data
function generateDemoAnalytics(timeframe) {
    const days = parseInt(timeframe) || 30;
    const data = [];
    
    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Generate realistic demo data with trends
        const baseRevenue = 1000 + Math.sin(i / 7) * 200; // Weekly cycle
        const randomFactor = 0.8 + Math.random() * 0.4;   // ±20% variation
        
        data.push({
            date: date.toISOString().split('T')[0],
            revenue: Math.round(baseRevenue * randomFactor * 100) / 100,
            clicks: Math.floor(300 + Math.sin(i / 5) * 50 + Math.random() * 100),
            conversions: Math.floor(12 + Math.random() * 8),
            commission: Math.round(baseRevenue * randomFactor * 0.12 * 100) / 100,
            affiliateCount: 127 + Math.floor(Math.random() * 10),
            newAffiliates: Math.floor(Math.random() * 3),
            topProducts: [
                { name: 'iPhone 15 Pro Max', revenue: Math.round(baseRevenue * 0.4 * randomFactor * 100) / 100 },
                { name: 'Nike Air Jordan 1', revenue: Math.round(baseRevenue * 0.25 * randomFactor * 100) / 100 },
                { name: 'MacBook Pro M3', revenue: Math.round(baseRevenue * 0.35 * randomFactor * 100) / 100 }
            ]
        });
    }
    
    return data;
}

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const db = await initDatabase();
        const { timeframe = '30', metrics = 'all' } = req.query;

        // Get API key from headers
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).json({ success: false, error: 'API key required' });
        }

        // Verify affiliate exists
        const affiliate = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM affiliates WHERE api_key = ?', [apiKey], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!affiliate) {
            return res.status(401).json({ success: false, error: 'Invalid API key' });
        }

        const dateRange = getDateRange(parseInt(timeframe));
        
        // Get real analytics data (with demo fallback)
        try {
            // Revenue Trend Data
            const revenueData = await new Promise((resolve, reject) => {
                db.all(`
                    SELECT 
                        DATE(c.created_at) as date,
                        SUM(c.commission_amount) as revenue,
                        COUNT(*) as conversions
                    FROM commissions c
                    WHERE c.affiliate_id = ?
                    AND DATE(c.created_at) BETWEEN ? AND ?
                    GROUP BY DATE(c.created_at)
                    ORDER BY date
                `, [affiliate.id, dateRange.start, dateRange.end], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            // Click Analytics
            const clickData = await new Promise((resolve, reject) => {
                db.all(`
                    SELECT 
                        DATE(lc.created_at) as date,
                        COUNT(*) as clicks,
                        COUNT(DISTINCT lc.ip_address) as unique_visitors
                    FROM link_clicks lc
                    JOIN affiliate_links al ON lc.link_id = al.id
                    WHERE al.affiliate_id = ?
                    AND DATE(lc.created_at) BETWEEN ? AND ?
                    GROUP BY DATE(lc.created_at)
                    ORDER BY date
                `, [affiliate.id, dateRange.start, dateRange.end], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            // Top Performing Products
            const topProducts = await new Promise((resolve, reject) => {
                db.all(`
                    SELECT 
                        p.name,
                        SUM(c.commission_amount) as total_commission,
                        COUNT(*) as total_sales,
                        AVG(c.sale_amount) as avg_order_value
                    FROM commissions c
                    JOIN products p ON c.product_id = p.id
                    WHERE c.affiliate_id = ?
                    AND DATE(c.created_at) BETWEEN ? AND ?
                    GROUP BY p.id, p.name
                    ORDER BY total_commission DESC
                    LIMIT 10
                `, [affiliate.id, dateRange.start, dateRange.end], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            // Geographic Performance
            const geoData = await new Promise((resolve, reject) => {
                db.all(`
                    SELECT 
                        lc.country,
                        COUNT(*) as clicks,
                        COUNT(DISTINCT lc.ip_address) as unique_visitors,
                        SUM(CASE WHEN c.id IS NOT NULL THEN c.commission_amount ELSE 0 END) as revenue
                    FROM link_clicks lc
                    JOIN affiliate_links al ON lc.link_id = al.id
                    LEFT JOIN commissions c ON c.link_id = al.id AND DATE(c.created_at) = DATE(lc.created_at)
                    WHERE al.affiliate_id = ?
                    AND DATE(lc.created_at) BETWEEN ? AND ?
                    GROUP BY lc.country
                    ORDER BY revenue DESC
                    LIMIT 15
                `, [affiliate.id, dateRange.start, dateRange.end], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            // Conversion Funnel
            const funnelData = await new Promise((resolve, reject) => {
                db.get(`
                    SELECT 
                        COUNT(DISTINCT lc.id) as total_clicks,
                        COUNT(DISTINCT lc.session_id) as sessions,
                        COUNT(DISTINCT c.id) as conversions,
                        SUM(c.commission_amount) as total_revenue
                    FROM link_clicks lc
                    JOIN affiliate_links al ON lc.link_id = al.id
                    LEFT JOIN commissions c ON c.link_id = al.id
                    WHERE al.affiliate_id = ?
                    AND DATE(lc.created_at) BETWEEN ? AND ?
                `, [affiliate.id, dateRange.start, dateRange.end], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            // Device & Browser Analytics
            const deviceData = await new Promise((resolve, reject) => {
                db.all(`
                    SELECT 
                        lc.device_type,
                        lc.browser,
                        COUNT(*) as clicks,
                        COUNT(DISTINCT lc.ip_address) as unique_visitors
                    FROM link_clicks lc
                    JOIN affiliate_links al ON lc.link_id = al.id
                    WHERE al.affiliate_id = ?
                    AND DATE(lc.created_at) BETWEEN ? AND ?
                    GROUP BY lc.device_type, lc.browser
                    ORDER BY clicks DESC
                `, [affiliate.id, dateRange.start, dateRange.end], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            // Calculate key metrics
            const totalRevenue = revenueData.reduce((sum, day) => sum + (day.revenue || 0), 0);
            const totalClicks = clickData.reduce((sum, day) => sum + (day.clicks || 0), 0);
            const totalConversions = revenueData.reduce((sum, day) => sum + (day.conversions || 0), 0);
            const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100) : 0;
            const avgOrderValue = totalConversions > 0 ? (totalRevenue / totalConversions) : 0;

            // If we have real data, use it; otherwise use demo data
            if (revenueData.length > 0 || clickData.length > 0) {
                res.json({
                    success: true,
                    timeframe: parseInt(timeframe),
                    dateRange,
                    summary: {
                        totalRevenue: Math.round(totalRevenue * 100) / 100,
                        totalClicks,
                        totalConversions,
                        conversionRate: Math.round(conversionRate * 100) / 100,
                        avgOrderValue: Math.round(avgOrderValue * 100) / 100
                    },
                    charts: {
                        revenue: revenueData.map(d => ({
                            date: d.date,
                            value: Math.round((d.revenue || 0) * 100) / 100
                        })),
                        clicks: clickData.map(d => ({
                            date: d.date,
                            value: d.clicks || 0
                        })),
                        conversions: revenueData.map(d => ({
                            date: d.date,
                            value: d.conversions || 0
                        }))
                    },
                    topProducts: topProducts.map(p => ({
                        name: p.name,
                        revenue: Math.round(p.total_commission * 100) / 100,
                        sales: p.total_sales,
                        avgOrderValue: Math.round(p.avg_order_value * 100) / 100
                    })),
                    geography: geoData.map(g => ({
                        country: g.country || 'Unknown',
                        clicks: g.clicks,
                        visitors: g.unique_visitors,
                        revenue: Math.round((g.revenue || 0) * 100) / 100
                    })),
                    devices: deviceData.map(d => ({
                        type: d.device_type || 'Unknown',
                        browser: d.browser || 'Unknown',
                        clicks: d.clicks,
                        visitors: d.unique_visitors
                    })),
                    funnel: {
                        clicks: funnelData?.total_clicks || 0,
                        sessions: funnelData?.sessions || 0,
                        conversions: funnelData?.conversions || 0,
                        revenue: Math.round((funnelData?.total_revenue || 0) * 100) / 100
                    }
                });
            } else {
                throw new Error('No data found, using demo');
            }

        } catch (error) {
            console.log('Using demo analytics data:', error.message);
            
            // Use demo data when no real data exists
            const demoData = generateDemoAnalytics(timeframe);
            
            res.json({
                success: true,
                timeframe: parseInt(timeframe),
                dateRange,
                demo: true,
                summary: {
                    totalRevenue: demoData.reduce((sum, day) => sum + day.revenue, 0),
                    totalClicks: demoData.reduce((sum, day) => sum + day.clicks, 0),
                    totalConversions: demoData.reduce((sum, day) => sum + day.conversions, 0),
                    conversionRate: 4.2,
                    avgOrderValue: 156.78
                },
                charts: {
                    revenue: demoData.map(d => ({ date: d.date, value: d.revenue })),
                    clicks: demoData.map(d => ({ date: d.date, value: d.clicks })),
                    conversions: demoData.map(d => ({ date: d.date, value: d.conversions }))
                },
                topProducts: [
                    { name: 'iPhone 15 Pro Max', revenue: 4247.50, sales: 89, avgOrderValue: 1199.99 },
                    { name: 'MacBook Pro M3', revenue: 3567.89, sales: 34, avgOrderValue: 1999.99 },
                    { name: 'Nike Air Jordan 1', revenue: 890.45, sales: 67, avgOrderValue: 170.00 }
                ],
                geography: [
                    { country: 'United States', clicks: 1247, visitors: 892, revenue: 2847.50 },
                    { country: 'Canada', clicks: 456, visitors: 334, revenue: 1234.67 },
                    { country: 'United Kingdom', clicks: 298, visitors: 223, revenue: 789.45 }
                ],
                devices: [
                    { type: 'Mobile', browser: 'Chrome', clicks: 1456, visitors: 1023 },
                    { type: 'Desktop', browser: 'Chrome', clicks: 892, visitors: 634 },
                    { type: 'Mobile', browser: 'Safari', clicks: 567, visitors: 421 }
                ],
                funnel: {
                    clicks: 2847,
                    sessions: 1923,
                    conversions: 89,
                    revenue: 12847.50
                }
            });
        }

    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load analytics data'
        });
    }
};