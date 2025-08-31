// Admin Performance Monitoring API - Vercel Serverless
// Advanced performance analytics and monitoring for admin dashboard

const Database = require('../../lib/database');

export default async function handler(req, res) {
    // Enable CORS for all origins
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { method, query } = req;
    const db = Database.getInstance();

    try {
        switch (method) {
            case 'GET':
                if (query.action === 'overview') {
                    return await getPerformanceOverview(req, res, db);
                } else if (query.action === 'trends') {
                    return await getPerformanceTrends(req, res, db);
                } else if (query.action === 'affiliates') {
                    return await getAffiliatePerformance(req, res, db);
                } else if (query.action === 'products') {
                    return await getProductPerformance(req, res, db);
                } else if (query.action === 'conversion-funnel') {
                    return await getConversionFunnel(req, res, db);
                } else if (query.action === 'real-time') {
                    return await getRealTimeMetrics(req, res, db);
                } else {
                    return await getFullPerformanceReport(req, res, db);
                }
                
            default:
                res.setHeader('Allow', ['GET', 'OPTIONS']);
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Admin Performance API Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
}

// Get comprehensive performance overview
async function getPerformanceOverview(req, res, db) {
    const { period = '30' } = req.query;
    
    // Key performance indicators
    const kpis = db.prepare(`
        SELECT 
            COUNT(DISTINCT a.id) as total_affiliates,
            COUNT(DISTINCT CASE WHEN a.status = 'active' THEN a.id END) as active_affiliates,
            COUNT(DISTINCT c.id) as total_commissions,
            SUM(c.amount) as total_commission_amount,
            COUNT(DISTINCT l.id) as total_clicks,
            ROUND(
                CAST(COUNT(DISTINCT c.id) AS FLOAT) / 
                NULLIF(COUNT(DISTINCT l.id), 0) * 100, 2
            ) as conversion_rate,
            AVG(c.amount) as avg_commission,
            COUNT(DISTINCT p.id) as total_payouts,
            SUM(p.amount) as total_payouts_amount
        FROM affiliates a
        LEFT JOIN commissions c ON a.id = c.affiliate_id 
            AND c.created_at >= date('now', '-${period} days')
        LEFT JOIN affiliate_links l ON a.id = l.affiliate_id 
            AND l.created_at >= date('now', '-${period} days')
        LEFT JOIN payouts p ON a.id = p.affiliate_id 
            AND p.created_at >= date('now', '-${period} days')
    `).get();

    // Growth metrics (comparing to previous period)
    const previousPeriod = db.prepare(`
        SELECT 
            COUNT(DISTINCT c.id) as prev_commissions,
            SUM(c.amount) as prev_commission_amount,
            COUNT(DISTINCT l.id) as prev_clicks
        FROM affiliates a
        LEFT JOIN commissions c ON a.id = c.affiliate_id 
            AND c.created_at >= date('now', '-${period * 2} days')
            AND c.created_at < date('now', '-${period} days')
        LEFT JOIN affiliate_links l ON a.id = l.affiliate_id 
            AND l.created_at >= date('now', '-${period * 2} days')
            AND l.created_at < date('now', '-${period} days')
    `).get();

    // Calculate growth percentages
    const growthMetrics = {
        commissions_growth: calculateGrowth(kpis.total_commissions, previousPeriod.prev_commissions),
        revenue_growth: calculateGrowth(kpis.total_commission_amount || 0, previousPeriod.prev_commission_amount || 0),
        clicks_growth: calculateGrowth(kpis.total_clicks, previousPeriod.prev_clicks)
    };

    // Top performing metrics
    const topMetrics = {
        // Top affiliates by revenue
        top_affiliates: db.prepare(`
            SELECT 
                a.first_name,
                a.last_name,
                a.email,
                a.tier,
                COUNT(c.id) as commission_count,
                SUM(c.amount) as total_earnings,
                AVG(c.amount) as avg_commission
            FROM affiliates a
            JOIN commissions c ON a.id = c.affiliate_id
            WHERE c.created_at >= date('now', '-${period} days')
            GROUP BY a.id
            ORDER BY total_earnings DESC
            LIMIT 5
        `).all(),

        // Top products by sales
        top_products: db.prepare(`
            SELECT 
                sp.name,
                sp.category,
                COUNT(c.id) as sales_count,
                SUM(c.amount) as total_commissions,
                AVG(c.amount) as avg_commission,
                sp.commission_rate
            FROM shopify_products sp
            JOIN commissions c ON sp.id = c.product_id
            WHERE c.created_at >= date('now', '-${period} days')
            GROUP BY sp.id
            ORDER BY total_commissions DESC
            LIMIT 5
        `).all(),

        // Recent high-value transactions
        high_value_transactions: db.prepare(`
            SELECT 
                c.amount,
                c.sale_amount,
                c.created_at,
                a.first_name,
                a.last_name,
                sp.name as product_name
            FROM commissions c
            JOIN affiliates a ON c.affiliate_id = a.id
            LEFT JOIN shopify_products sp ON c.product_id = sp.id
            WHERE c.created_at >= date('now', '-${period} days')
            ORDER BY c.amount DESC
            LIMIT 10
        `).all()
    };

    return res.json({
        success: true,
        data: {
            kpis,
            growth_metrics: growthMetrics,
            top_metrics: topMetrics,
            period: parseInt(period),
            generated_at: new Date().toISOString()
        }
    });
}

// Get performance trends over time
async function getPerformanceTrends(req, res, db) {
    const { period = '30', granularity = 'daily' } = req.query;
    
    let dateFormat, dateRange;
    switch (granularity) {
        case 'hourly':
            dateFormat = '%Y-%m-%d %H:00:00';
            dateRange = '2 days';
            break;
        case 'weekly':
            dateFormat = '%Y-W%W';
            dateRange = '12 weeks';
            break;
        case 'monthly':
            dateFormat = '%Y-%m';
            dateRange = '12 months';
            break;
        default: // daily
            dateFormat = '%Y-%m-%d';
            dateRange = `${period} days`;
    }

    // Revenue trends
    const revenueTrends = db.prepare(`
        SELECT 
            strftime('${dateFormat}', c.created_at) as date_period,
            COUNT(c.id) as commission_count,
            SUM(c.amount) as total_revenue,
            AVG(c.amount) as avg_commission,
            COUNT(DISTINCT c.affiliate_id) as active_affiliates
        FROM commissions c
        WHERE c.created_at >= date('now', '-${dateRange}')
        GROUP BY strftime('${dateFormat}', c.created_at)
        ORDER BY date_period
    `).all();

    // Traffic trends
    const trafficTrends = db.prepare(`
        SELECT 
            strftime('${dateFormat}', al.created_at) as date_period,
            COUNT(al.id) as total_clicks,
            COUNT(DISTINCT al.affiliate_id) as unique_affiliates,
            COUNT(DISTINCT al.ip_address) as unique_visitors
        FROM affiliate_links al
        WHERE al.created_at >= date('now', '-${dateRange}')
        GROUP BY strftime('${dateFormat}', al.created_at)
        ORDER BY date_period
    `).all();

    // Conversion trends
    const conversionTrends = revenueTrends.map(revenue => {
        const traffic = trafficTrends.find(t => t.date_period === revenue.date_period);
        const clicks = traffic ? traffic.total_clicks : 0;
        
        return {
            date_period: revenue.date_period,
            conversions: revenue.commission_count,
            clicks: clicks,
            conversion_rate: clicks > 0 ? ((revenue.commission_count / clicks) * 100).toFixed(2) : '0.00'
        };
    });

    return res.json({
        success: true,
        data: {
            revenue_trends: revenueTrends,
            traffic_trends: trafficTrends,
            conversion_trends: conversionTrends,
            granularity,
            period: period
        }
    });
}

// Get detailed affiliate performance analysis
async function getAffiliatePerformance(req, res, db) {
    const { 
        period = '30', 
        limit = 50, 
        offset = 0, 
        sort_by = 'revenue', 
        sort_order = 'desc' 
    } = req.query;

    const validSortFields = ['revenue', 'commissions', 'clicks', 'conversion_rate', 'avg_commission'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'revenue';
    const sortDirection = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    let orderClause;
    switch (sortField) {
        case 'revenue':
            orderClause = `total_revenue ${sortDirection}`;
            break;
        case 'commissions':
            orderClause = `commission_count ${sortDirection}`;
            break;
        case 'clicks':
            orderClause = `total_clicks ${sortDirection}`;
            break;
        case 'conversion_rate':
            orderClause = `conversion_rate ${sortDirection}`;
            break;
        case 'avg_commission':
            orderClause = `avg_commission ${sortDirection}`;
            break;
    }

    const affiliatePerformance = db.prepare(`
        SELECT 
            a.id,
            a.first_name,
            a.last_name,
            a.email,
            a.tier,
            a.status,
            a.created_at as join_date,
            COALESCE(stats.commission_count, 0) as commission_count,
            COALESCE(stats.total_revenue, 0) as total_revenue,
            COALESCE(stats.avg_commission, 0) as avg_commission,
            COALESCE(stats.total_clicks, 0) as total_clicks,
            COALESCE(stats.unique_products, 0) as unique_products,
            CASE 
                WHEN stats.total_clicks > 0 
                THEN ROUND(CAST(stats.commission_count AS FLOAT) / stats.total_clicks * 100, 2)
                ELSE 0 
            END as conversion_rate,
            CASE 
                WHEN stats.total_clicks > 0 
                THEN ROUND(stats.total_revenue / stats.total_clicks, 2)
                ELSE 0 
            END as revenue_per_click
        FROM affiliates a
        LEFT JOIN (
            SELECT 
                c.affiliate_id,
                COUNT(c.id) as commission_count,
                SUM(c.amount) as total_revenue,
                AVG(c.amount) as avg_commission,
                COUNT(DISTINCT c.product_id) as unique_products,
                (
                    SELECT COUNT(al.id) 
                    FROM affiliate_links al 
                    WHERE al.affiliate_id = c.affiliate_id 
                    AND al.created_at >= date('now', '-${period} days')
                ) as total_clicks
            FROM commissions c
            WHERE c.created_at >= date('now', '-${period} days')
            GROUP BY c.affiliate_id
        ) stats ON a.id = stats.affiliate_id
        ORDER BY ${orderClause}
        LIMIT ? OFFSET ?
    `).all(limit, offset);

    // Get tier distribution
    const tierStats = db.prepare(`
        SELECT 
            a.tier,
            COUNT(*) as affiliate_count,
            SUM(COALESCE(c.amount, 0)) as total_revenue,
            AVG(COALESCE(c.amount, 0)) as avg_revenue
        FROM affiliates a
        LEFT JOIN commissions c ON a.id = c.affiliate_id 
            AND c.created_at >= date('now', '-${period} days')
        GROUP BY a.tier
        ORDER BY total_revenue DESC
    `).all();

    return res.json({
        success: true,
        data: {
            affiliates: affiliatePerformance,
            tier_statistics: tierStats,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                sort_by: sortField,
                sort_order: sortDirection
            }
        }
    });
}

// Get product performance analytics
async function getProductPerformance(req, res, db) {
    const { period = '30', limit = 50, offset = 0 } = req.query;

    const productPerformance = db.prepare(`
        SELECT 
            sp.id,
            sp.name,
            sp.category,
            sp.price,
            sp.commission_rate,
            sp.status,
            COALESCE(stats.sales_count, 0) as sales_count,
            COALESCE(stats.total_commissions, 0) as total_commissions,
            COALESCE(stats.total_revenue, 0) as total_revenue,
            COALESCE(stats.unique_affiliates, 0) as unique_affiliates,
            COALESCE(stats.avg_commission, 0) as avg_commission,
            ROUND(COALESCE(stats.total_commissions, 0) / NULLIF(sp.price * COALESCE(stats.sales_count, 0), 0) * 100, 2) as commission_to_revenue_ratio
        FROM shopify_products sp
        LEFT JOIN (
            SELECT 
                c.product_id,
                COUNT(c.id) as sales_count,
                SUM(c.amount) as total_commissions,
                SUM(c.sale_amount) as total_revenue,
                COUNT(DISTINCT c.affiliate_id) as unique_affiliates,
                AVG(c.amount) as avg_commission
            FROM commissions c
            WHERE c.created_at >= date('now', '-${period} days')
            GROUP BY c.product_id
        ) stats ON sp.id = stats.product_id
        ORDER BY total_commissions DESC
        LIMIT ? OFFSET ?
    `).all(limit, offset);

    // Category performance
    const categoryPerformance = db.prepare(`
        SELECT 
            sp.category,
            COUNT(DISTINCT sp.id) as product_count,
            SUM(COALESCE(c.amount, 0)) as total_commissions,
            COUNT(c.id) as total_sales,
            AVG(COALESCE(c.amount, 0)) as avg_commission
        FROM shopify_products sp
        LEFT JOIN commissions c ON sp.id = c.product_id 
            AND c.created_at >= date('now', '-${period} days')
        GROUP BY sp.category
        ORDER BY total_commissions DESC
    `).all();

    return res.json({
        success: true,
        data: {
            products: productPerformance,
            category_performance: categoryPerformance,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        }
    });
}

// Get conversion funnel analysis
async function getConversionFunnel(req, res, db) {
    const { period = '30' } = req.query;

    // Basic funnel metrics
    const funnelData = db.prepare(`
        SELECT 
            (SELECT COUNT(*) FROM affiliate_links WHERE created_at >= date('now', '-${period} days')) as total_clicks,
            (SELECT COUNT(DISTINCT ip_address) FROM affiliate_links WHERE created_at >= date('now', '-${period} days')) as unique_visitors,
            (SELECT COUNT(*) FROM commissions WHERE created_at >= date('now', '-${period} days')) as total_conversions,
            (SELECT SUM(amount) FROM commissions WHERE created_at >= date('now', '-${period} days')) as total_revenue
    `).get();

    // Calculate conversion rates
    const conversionRates = {
        visitor_to_sale: funnelData.unique_visitors > 0 ? 
            ((funnelData.total_conversions / funnelData.unique_visitors) * 100).toFixed(2) : '0.00',
        click_to_sale: funnelData.total_clicks > 0 ? 
            ((funnelData.total_conversions / funnelData.total_clicks) * 100).toFixed(2) : '0.00'
    };

    // Funnel by affiliate tier
    const tierFunnel = db.prepare(`
        SELECT 
            a.tier,
            COUNT(DISTINCT al.id) as clicks,
            COUNT(DISTINCT c.id) as conversions,
            SUM(COALESCE(c.amount, 0)) as revenue,
            CASE 
                WHEN COUNT(DISTINCT al.id) > 0 
                THEN ROUND(CAST(COUNT(DISTINCT c.id) AS FLOAT) / COUNT(DISTINCT al.id) * 100, 2)
                ELSE 0 
            END as conversion_rate
        FROM affiliates a
        LEFT JOIN affiliate_links al ON a.id = al.affiliate_id 
            AND al.created_at >= date('now', '-${period} days')
        LEFT JOIN commissions c ON a.id = c.affiliate_id 
            AND c.created_at >= date('now', '-${period} days')
        GROUP BY a.tier
        ORDER BY conversion_rate DESC
    `).all();

    // Time-based funnel analysis
    const hourlyFunnel = db.prepare(`
        SELECT 
            strftime('%H', created_at) as hour,
            COUNT(*) as clicks,
            (
                SELECT COUNT(*) 
                FROM commissions 
                WHERE strftime('%H', created_at) = strftime('%H', al.created_at)
                AND created_at >= date('now', '-${period} days')
            ) as conversions
        FROM affiliate_links al
        WHERE created_at >= date('now', '-${period} days')
        GROUP BY strftime('%H', created_at)
        ORDER BY hour
    `).all();

    return res.json({
        success: true,
        data: {
            funnel_overview: {
                ...funnelData,
                conversion_rates: conversionRates
            },
            tier_funnel: tierFunnel,
            hourly_funnel: hourlyFunnel
        }
    });
}

// Get real-time metrics
async function getRealTimeMetrics(req, res, db) {
    // Last 24 hours metrics
    const realTimeStats = db.prepare(`
        SELECT 
            (SELECT COUNT(*) FROM affiliate_links WHERE created_at >= datetime('now', '-1 hour')) as clicks_last_hour,
            (SELECT COUNT(*) FROM commissions WHERE created_at >= datetime('now', '-1 hour')) as conversions_last_hour,
            (SELECT SUM(amount) FROM commissions WHERE created_at >= datetime('now', '-1 hour')) as revenue_last_hour,
            (SELECT COUNT(*) FROM affiliate_links WHERE created_at >= datetime('now', '-24 hours')) as clicks_last_24h,
            (SELECT COUNT(*) FROM commissions WHERE created_at >= datetime('now', '-24 hours')) as conversions_last_24h,
            (SELECT SUM(amount) FROM commissions WHERE created_at >= datetime('now', '-24 hours')) as revenue_last_24h
    `).get();

    // Recent activity
    const recentActivity = db.prepare(`
        SELECT 
            'commission' as type,
            c.amount,
            c.created_at,
            a.first_name,
            a.last_name,
            sp.name as product_name
        FROM commissions c
        JOIN affiliates a ON c.affiliate_id = a.id
        LEFT JOIN shopify_products sp ON c.product_id = sp.id
        WHERE c.created_at >= datetime('now', '-2 hours')
        
        UNION ALL
        
        SELECT 
            'signup' as type,
            NULL as amount,
            a.created_at,
            a.first_name,
            a.last_name,
            NULL as product_name
        FROM affiliates a
        WHERE a.created_at >= datetime('now', '-2 hours')
        
        ORDER BY created_at DESC
        LIMIT 20
    `).all();

    // Active affiliates right now (last 5 minutes activity)
    const activeNow = db.prepare(`
        SELECT COUNT(DISTINCT affiliate_id) as active_affiliates
        FROM affiliate_links 
        WHERE created_at >= datetime('now', '-5 minutes')
    `).get();

    return res.json({
        success: true,
        data: {
            real_time_stats: realTimeStats,
            recent_activity: recentActivity,
            active_now: activeNow.active_affiliates || 0,
            timestamp: new Date().toISOString()
        }
    });
}

// Get full comprehensive performance report
async function getFullPerformanceReport(req, res, db) {
    const { period = '30' } = req.query;
    
    // Combine all performance data for a comprehensive report
    const [overview] = await Promise.all([
        getPerformanceOverview(req, res, db)
    ]);
    
    return overview;
}

// Utility function to calculate growth percentage
function calculateGrowth(current, previous) {
    if (!previous || previous === 0) {
        return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100);
}