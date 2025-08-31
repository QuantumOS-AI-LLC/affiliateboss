const { handleCors, checkAuth, formatCurrency, formatDate } = require('../utils/helpers');

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    
    const user = checkAuth(req, res);
    if (!user) return;

    // Real-time KPI dashboard data - Bangladesh developer style
    const kpiData = {
        overview: {
            total_earnings: 17292.79,
            monthly_earnings: 2456.78,
            daily_earnings: 145.23,
            pending_earnings: 248.33,
            
            total_clicks: 89456,
            monthly_clicks: 12456,
            daily_clicks: 423,
            unique_clicks_today: 367,
            
            total_conversions: 1234,
            monthly_conversions: 167,
            daily_conversions: 6,
            conversion_rate: 1.38,
            
            active_links: 8,
            total_products: 12,
            connected_stores: 2
        },
        
        performance_indicators: {
            earnings_growth: {
                daily: 12.5,    // % change from yesterday
                weekly: 8.7,    // % change from last week
                monthly: 15.3   // % change from last month
            },
            
            traffic_growth: {
                daily: 5.2,
                weekly: 12.1,
                monthly: 23.8
            },
            
            conversion_trends: {
                daily: -2.1,    // Slight dip today
                weekly: 4.5,
                monthly: 18.4
            }
        },
        
        real_time_stats: {
            visitors_online_now: 12,
            clicks_last_hour: 34,
            conversions_last_hour: 2,
            revenue_last_hour: 189.45,
            
            top_links_now: [
                { id: 1, name: "MacBook Pro Link", clicks: 8, conversions: 1 },
                { id: 6, name: "Nintendo Switch", clicks: 12, conversions: 0 },
                { id: 5, name: "Dyson Vacuum", clicks: 6, conversions: 1 }
            ]
        },
        
        goals_progress: {
            monthly_earnings_goal: 5000.00,
            monthly_earnings_current: 2456.78,
            monthly_earnings_progress: 49.1,
            
            monthly_clicks_goal: 20000,
            monthly_clicks_current: 12456,
            monthly_clicks_progress: 62.3,
            
            monthly_conversions_goal: 200,
            monthly_conversions_current: 167,
            monthly_conversions_progress: 83.5
        },
        
        alerts_notifications: [
            {
                id: 1,
                type: 'success',
                title: 'High Value Conversion',
                message: 'Hermès handbag sale generated $960 commission',
                timestamp: new Date().toISOString(),
                read: false
            },
            {
                id: 2,
                type: 'warning',
                title: 'Link Performance Drop',
                message: 'Samsung TV link conversion rate dropped 15%',
                timestamp: '2024-01-29T14:22:00Z',
                read: false
            },
            {
                id: 3,
                type: 'info',
                title: 'Monthly Milestone',
                message: 'You\'ve reached 80% of your monthly goal!',
                timestamp: '2024-01-29T10:15:00Z',
                read: true
            }
        ]
    };

    // Add formatted values
    const formattedKpiData = {
        ...kpiData,
        overview: {
            ...kpiData.overview,
            total_earnings_formatted: formatCurrency(kpiData.overview.total_earnings),
            monthly_earnings_formatted: formatCurrency(kpiData.overview.monthly_earnings),
            daily_earnings_formatted: formatCurrency(kpiData.overview.daily_earnings),
            pending_earnings_formatted: formatCurrency(kpiData.overview.pending_earnings)
        },
        
        real_time_stats: {
            ...kpiData.real_time_stats,
            revenue_last_hour_formatted: formatCurrency(kpiData.real_time_stats.revenue_last_hour)
        },
        
        goals_progress: {
            ...kpiData.goals_progress,
            monthly_earnings_goal_formatted: formatCurrency(kpiData.goals_progress.monthly_earnings_goal),
            monthly_earnings_current_formatted: formatCurrency(kpiData.goals_progress.monthly_earnings_current)
        },
        
        alerts_notifications: kpiData.alerts_notifications.map(alert => ({
            ...alert,
            timestamp_formatted: formatDate(alert.timestamp)
        }))
    };

    return res.json({
        success: true,
        data: formattedKpiData,
        last_updated: new Date().toISOString(),
        refresh_interval: 30000 // 30 seconds
    });
};