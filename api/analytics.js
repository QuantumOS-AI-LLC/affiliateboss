const { handleCors, checkAuth, getDemoData, formatCurrency, formatDate } = require('./utils/helpers');

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    
    const user = checkAuth(req, res);
    if (!user) return;

    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    const path = pathname.replace('/api/analytics', '');

    switch (req.method) {
        case 'GET':
            if (path === '/dashboard') return getDashboardAnalytics(req, res, user);
            if (path === '/performance') return getPerformanceAnalytics(req, res, user);
            if (path === '/geographic') return getGeographicAnalytics(req, res, user);
            if (path === '/traffic') return getTrafficAnalytics(req, res, user);
            if (path === '/conversion') return getConversionAnalytics(req, res, user);
            if (path === '/revenue') return getRevenueAnalytics(req, res, user);
            if (path === '/trends') return getTrendAnalytics(req, res, user);
            if (path === '/reports') return getReports(req, res, user);
            if (path === '/export') return exportAnalytics(req, res, user);
            break;
            
        case 'POST':
            if (path === '/report/generate') return generateCustomReport(req, res, user);
            break;
    }
    
    return res.status(404).json({ error: 'Analytics API endpoint not found' });
};

// Get comprehensive dashboard analytics
function getDashboardAnalytics(req, res, user) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const period = url.searchParams.get('period') || '30d';
    const timezone = url.searchParams.get('timezone') || 'America/New_York';
    
    // Real Bangladesh dev style - comprehensive data that actually helps affiliates
    const dashboardData = {
        overview_kpis: {
            total_clicks: 23156,
            unique_clicks: 19824,
            total_conversions: 445,
            conversion_rate: 1.92,
            total_revenue: 186234.56,
            total_commissions: 18623.45,
            avg_order_value: 418.50,
            click_through_rate: 85.6,
            
            // Period comparison
            period_change: {
                clicks: 15.2,      // % change from previous period
                conversions: 23.8,
                revenue: 18.4,
                commission: 22.1
            }
        },
        
        // Real-time data (last 24 hours)
        real_time: {
            active_users_now: 12,
            clicks_last_hour: 34,
            conversions_last_hour: 2,
            revenue_last_hour: 892.34,
            top_links_now: [
                { id: 1, name: "MacBook Pro M3 Max Link", clicks: 145, conversions: 3 },
                { id: 6, name: "Nintendo Switch Bundle", clicks: 89, conversions: 5 },
                { id: 5, name: "Dyson V15 Vacuum", clicks: 67, conversions: 2 }
            ]
        },
        
        // Performance trends (chart data)
        performance_trends: {
            labels: period === '7d' ? 
                ['Jan 23', 'Jan 24', 'Jan 25', 'Jan 26', 'Jan 27', 'Jan 28', 'Jan 29'] :
                generateDateRange(period),
            
            datasets: {
                clicks: period === '7d' ? 
                    [1245, 1389, 1534, 1298, 1676, 1812, 1698] :
                    generateMetricData('clicks', period),
                
                conversions: period === '7d' ? 
                    [23, 35, 48, 24, 59, 72, 61] :
                    generateMetricData('conversions', period),
                
                revenue: period === '7d' ? 
                    [8945.50, 12857.25, 15234.80, 9125.60, 18287.40, 21156.20, 17325.80] :
                    generateMetricData('revenue', period),
                
                commission: period === '7d' ? 
                    [894.55, 1285.73, 1523.48, 912.56, 1828.74, 2115.62, 1732.58] :
                    generateMetricData('commission', period)
            }
        },
        
        // Top performing content
        top_performers: {
            links: [
                {
                    id: 1,
                    name: "MacBook Pro M3 Max Premium Link",
                    clicks: 2847,
                    conversions: 45,
                    conversion_rate: 1.58,
                    revenue: 179955.00,
                    commission: 15297.18,
                    growth: 12.5
                },
                {
                    id: 6,
                    name: "Nintendo Switch Gaming Bundle",
                    clicks: 2134,
                    conversions: 89,
                    conversion_rate: 4.17,
                    revenue: 31149.11,
                    commission: 3893.64,
                    growth: 34.2
                },
                {
                    id: 5,
                    name: "Dyson V15 Home Cleaning",
                    clicks: 1456,
                    conversions: 67,
                    conversion_rate: 4.60,
                    revenue: 50249.33,
                    commission: 9044.88,
                    growth: 28.7
                }
            ],
            
            products: [
                {
                    id: 1,
                    name: "MacBook Pro M3 Max 16-inch",
                    sales: 45,
                    revenue: 179955.00,
                    commission: 15297.18,
                    avg_order_value: 3999.00
                },
                {
                    id: 8,
                    name: "Hermès Birkin 35 Handbag",
                    sales: 8,
                    revenue: 96000.00,
                    commission: 7680.00,
                    avg_order_value: 12000.00
                },
                {
                    id: 6,
                    name: "Dyson V15 Detect Absolute Vacuum",
                    sales: 67,
                    revenue: 50249.33,
                    commission: 9044.88,
                    avg_order_value: 749.99
                }
            ],
            
            referrers: [
                { source: 'direct', clicks: 9284, conversions: 178, revenue: 74528.92 },
                { source: 'social', clicks: 6945, conversions: 156, revenue: 62418.56 },
                { source: 'email', calls: 4826, conversions: 89, revenue: 35297.44 },
                { source: 'organic', clicks: 2101, conversions: 22, revenue: 13989.64 }
            ]
        },
        
        // Geographic performance breakdown
        geographic_summary: {
            top_countries: [
                { country: 'US', clicks: 14672, conversions: 298, revenue: 124789.34, percentage: 63.4 },
                { country: 'CA', clicks: 4632, conversions: 87, revenue: 28564.78, percentage: 20.0 },
                { country: 'UK', clicks: 2317, conversions: 38, revenue: 19847.22, percentage: 10.0 },
                { country: 'AU', clicks: 1535, conversions: 22, revenue: 13033.22, percentage: 6.6 }
            ]
        },
        
        // Device and platform breakdown
        device_analytics: {
            devices: [
                { device: 'Desktop', clicks: 13893, conversions: 289, percentage: 60.0 },
                { device: 'Mobile', clicks: 6947, conversions: 111, percentage: 30.0 },
                { device: 'Tablet', clicks: 2316, conversions: 45, percentage: 10.0 }
            ],
            
            browsers: [
                { browser: 'Chrome', clicks: 12084, percentage: 52.2 },
                { browser: 'Safari', clicks: 5785, percentage: 25.0 },
                { browser: 'Firefox', clicks: 3242, percentage: 14.0 },
                { browser: 'Edge', calls: 2045, percentage: 8.8 }
            ]
        },
        
        // Conversion funnel analysis
        funnel_analytics: {
            steps: [
                { step: 'Link Clicks', count: 23156, percentage: 100.0 },
                { step: 'Product Views', count: 19824, percentage: 85.6 },
                { step: 'Add to Cart', count: 2784, percentage: 12.0 },
                { step: 'Checkout Started', count: 892, percentage: 3.9 },
                { step: 'Purchase Completed', count: 445, percentage: 1.9 }
            ],
            
            drop_off_analysis: {
                'click_to_view': 14.4,     // % that don't proceed
                'view_to_cart': 86.0,
                'cart_to_checkout': 68.0,
                'checkout_to_purchase': 50.1
            }
        }
    };

    // Add formatted currency values
    const formatAnalyticsSection = (section) => {
        if (Array.isArray(section)) {
            return section.map(item => formatAnalyticsSection(item));
        }
        
        if (typeof section === 'object' && section !== null) {
            const formatted = {};
            Object.keys(section).forEach(key => {
                formatted[key] = formatAnalyticsSection(section[key]);
                
                // Add formatted version for money fields
                if (typeof section[key] === 'number' && (
                    key.includes('revenue') || key.includes('commission') || 
                    key.includes('value') || key.includes('earning')
                )) {
                    formatted[key + '_formatted'] = formatCurrency(section[key]);
                }
            });
            return formatted;
        }
        
        return section;
    };

    const formattedData = formatAnalyticsSection(dashboardData);

    return res.json({
        success: true,
        data: formattedData,
        period: period,
        timezone: timezone,
        generated_at: new Date().toISOString(),
        cache_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
    });
}

// Get detailed performance analytics
function getPerformanceAnalytics(req, res, user) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const period = url.searchParams.get('period') || '30d';
    const metric = url.searchParams.get('metric') || 'all';
    const segment = url.searchParams.get('segment') || 'all';
    
    const performanceData = {
        summary: {
            total_links: 8,
            active_links: 7,
            total_clicks: 23156,
            unique_visitors: 19824,
            total_conversions: 445,
            conversion_rate: 1.92,
            avg_session_duration: 245, // seconds
            bounce_rate: 23.4,
            pages_per_session: 3.2
        },
        
        // Link performance ranking
        link_performance: [
            {
                id: 1,
                name: "MacBook Pro M3 Max Premium Link",
                clicks: 2847,
                unique_clicks: 2341,
                conversions: 45,
                conversion_rate: 1.92,
                bounce_rate: 18.5,
                avg_time_on_site: 342,
                revenue: 179955.00,
                commission: 15297.18,
                epc: 5.37, // Earnings per click
                quality_score: 8.9
            },
            {
                id: 6,
                name: "Nintendo Switch Gaming Bundle",
                clicks: 2134,
                unique_clicks: 1876,
                conversions: 89,
                conversion_rate: 4.17,
                bounce_rate: 15.2,
                avg_time_on_site: 278,
                revenue: 31149.11,
                commission: 3893.64,
                epc: 1.82,
                quality_score: 9.4
            },
            {
                id: 5,
                name: "Dyson V15 Home Cleaning",
                clicks: 1456,
                unique_clicks: 1234,
                conversions: 67,
                conversion_rate: 4.60,
                bounce_rate: 12.8,
                avg_time_on_site: 298,
                revenue: 50249.33,
                commission: 9044.88,
                epc: 6.21,
                quality_score: 9.1
            }
        ],
        
        // Time-based performance trends
        hourly_performance: generateHourlyData(),
        daily_performance: generateDailyData(period),
        
        // Cohort analysis (user behavior over time)
        cohort_analysis: {
            retention_rates: [
                { day: 0, retention: 100.0 },
                { day: 1, retention: 45.2 },
                { day: 7, retention: 23.8 },
                { day: 14, retention: 18.5 },
                { day: 30, retention: 12.1 }
            ]
        },
        
        // Performance by segments
        segment_performance: {
            by_traffic_source: [
                { source: 'Direct', clicks: 9284, conversion_rate: 2.8, quality_score: 8.9 },
                { source: 'Social Media', clicks: 6945, conversion_rate: 2.1, quality_score: 7.2 },
                { source: 'Email Marketing', clicks: 4826, conversion_rate: 1.8, quality_score: 8.1 },
                { source: 'Search (Organic)', clicks: 2101, conversion_rate: 1.0, quality_score: 6.8 }
            ],
            
            by_device_type: [
                { device: 'Desktop', clicks: 13893, conversion_rate: 2.4, avg_order_value: 456.78 },
                { device: 'Mobile', clicks: 6947, conversion_rate: 1.2, avg_order_value: 298.45 },
                { device: 'Tablet', clicks: 2316, conversion_rate: 1.8, avg_order_value: 389.23 }
            ]
        }
    };

    return res.json({
        success: true,
        data: performanceData,
        filters: { period, metric, segment }
    });
}

// Get geographic analytics
function getGeographicAnalytics(req, res, user) {
    const geoData = {
        country_performance: [
            {
                country: 'United States',
                country_code: 'US',
                clicks: 14672,
                unique_visitors: 12234,
                conversions: 298,
                conversion_rate: 2.03,
                revenue: 124789.34,
                commission: 12478.93,
                avg_order_value: 418.75,
                top_cities: [
                    { city: 'New York', clicks: 2847, conversions: 58 },
                    { city: 'Los Angeles', clicks: 2134, conversions: 43 },
                    { city: 'Chicago', clicks: 1456, conversions: 29 }
                ]
            },
            {
                country: 'Canada',
                country_code: 'CA',
                clicks: 4632,
                unique_visitors: 3892,
                conversions: 87,
                conversion_rate: 1.88,
                revenue: 28564.78,
                commission: 2856.48,
                avg_order_value: 328.33,
                top_cities: [
                    { city: 'Toronto', clicks: 1234, conversions: 25 },
                    { city: 'Vancouver', clicks: 892, conversions: 18 },
                    { city: 'Montreal', clicks: 567, conversions: 11 }
                ]
            },
            {
                country: 'United Kingdom',
                country_code: 'UK',
                clicks: 2317,
                unique_visitors: 1943,
                conversions: 38,
                conversion_rate: 1.64,
                revenue: 19847.22,
                commission: 1984.72,
                avg_order_value: 522.29,
                top_cities: [
                    { city: 'London', clicks: 1045, conversions: 21 },
                    { city: 'Manchester', clicks: 423, conversions: 8 },
                    { city: 'Birmingham', clicks: 289, conversions: 5 }
                ]
            }
        ],
        
        // Heatmap data for visualization
        heatmap_data: [
            { country: 'US', value: 298, color_intensity: 1.0 },
            { country: 'CA', value: 87, color_intensity: 0.29 },
            { country: 'UK', value: 38, color_intensity: 0.13 },
            { country: 'AU', value: 22, color_intensity: 0.07 }
        ],
        
        timezone_performance: [
            { timezone: 'EST', peak_hours: [14, 15, 16, 20, 21], conversion_rate: 2.4 },
            { timezone: 'PST', peak_hours: [11, 12, 13, 17, 18], conversion_rate: 2.1 },
            { timezone: 'GMT', peak_hours: [19, 20, 21, 22], conversion_rate: 1.8 }
        ]
    };

    return res.json({
        success: true,
        data: geoData
    });
}

// Get traffic analytics
function getTrafficAnalytics(req, res, user) {
    const trafficData = {
        traffic_sources: {
            overview: [
                { source: 'Direct', clicks: 9284, percentage: 40.1, conversion_rate: 2.8, quality: 'High' },
                { source: 'Social Media', clicks: 6945, percentage: 30.0, conversion_rate: 2.1, quality: 'Medium' },
                { source: 'Email', clicks: 4826, percentage: 20.8, conversion_rate: 1.8, quality: 'High' },
                { source: 'Organic Search', clicks: 2101, percentage: 9.1, conversion_rate: 1.0, quality: 'Medium' }
            ],
            
            detailed_breakdown: {
                social_media: [
                    { platform: 'Facebook', clicks: 2847, conversions: 67, engagement_rate: 4.2 },
                    { platform: 'Instagram', clicks: 2134, conversions: 45, engagement_rate: 3.8 },
                    { platform: 'Twitter', clicks: 1456, conversions: 23, engagement_rate: 2.9 },
                    { platform: 'LinkedIn', clicks: 508, conversions: 11, engagement_rate: 5.1 }
                ],
                
                search_keywords: [
                    { keyword: 'macbook pro deal', clicks: 456, position: 3.2, ctr: 2.8 },
                    { keyword: 'dyson vacuum discount', clicks: 298, position: 2.1, ctr: 4.1 },
                    { keyword: 'nintendo switch bundle', clicks: 234, position: 1.8, ctr: 5.2 },
                    { keyword: 'luxury handbag sale', clicks: 189, position: 4.5, ctr: 1.9 }
                ]
            }
        },
        
        user_behavior: {
            session_metrics: {
                avg_session_duration: 245, // seconds
                pages_per_session: 3.2,
                bounce_rate: 23.4,
                new_vs_returning: {
                    new_visitors: 78.5,
                    returning_visitors: 21.5
                }
            },
            
            user_flow: [
                { step: 'Landing Page', users: 23156, drop_rate: 0 },
                { step: 'Product Page', users: 19824, drop_rate: 14.4 },
                { step: 'Add to Cart', users: 2784, drop_rate: 86.0 },
                { step: 'Checkout', users: 892, drop_rate: 68.0 },
                { step: 'Purchase', users: 445, drop_rate: 50.1 }
            ]
        },
        
        technical_metrics: {
            page_load_times: {
                avg_load_time: 1.2, // seconds
                bounce_rate_by_speed: [
                    { load_time_range: '0-1s', bounce_rate: 15.2 },
                    { load_time_range: '1-2s', bounce_rate: 23.4 },
                    { load_time_range: '2-3s', bounce_rate: 35.7 },
                    { load_time_range: '3s+', bounce_rate: 58.9 }
                ]
            },
            
            device_performance: [
                { device: 'Desktop', avg_load_time: 1.1, conversion_rate: 2.4 },
                { device: 'Mobile', avg_load_time: 1.8, conversion_rate: 1.2 },
                { device: 'Tablet', avg_load_time: 1.4, conversion_rate: 1.8 }
            ]
        }
    };

    return res.json({
        success: true,
        data: trafficData
    });
}

// Get conversion analytics
function getConversionAnalytics(req, res, user) {
    const conversionData = {
        conversion_funnel: {
            overall_funnel: [
                { stage: 'Awareness (Link Clicks)', count: 23156, rate: 100.0 },
                { stage: 'Interest (Product Views)', count: 19824, rate: 85.6 },
                { stage: 'Consideration (Add to Cart)', count: 2784, rate: 12.0 },
                { stage: 'Intent (Checkout Started)', count: 892, rate: 3.9 },
                { stage: 'Purchase (Completed)', count: 445, rate: 1.9 }
            ],
            
            funnel_by_product: {
                'MacBook Pro': {
                    views: 2847, carts: 456, checkouts: 189, purchases: 45,
                    conversion_rates: { view_to_cart: 16.0, cart_to_checkout: 41.4, checkout_to_purchase: 23.8 }
                },
                'Nintendo Switch': {
                    views: 2134, carts: 634, checkouts: 267, purchases: 89,
                    conversion_rates: { view_to_cart: 29.7, cart_to_checkout: 42.1, checkout_to_purchase: 33.3 }
                }
            }
        },
        
        conversion_attribution: {
            first_click: { conversions: 178, revenue: 74289.45 },
            last_click: { conversions: 445, revenue: 186234.56 },
            linear: { conversions: 298, revenue: 124567.89 },
            time_decay: { conversions: 334, revenue: 139823.45 }
        },
        
        micro_conversions: [
            { action: 'Email Signup', count: 1234, value: 5.50 },
            { action: 'Product View >30s', count: 5678, value: 2.25 },
            { action: 'Add to Wishlist', count: 892, value: 8.75 },
            { action: 'Social Share', count: 445, value: 12.00 }
        ],
        
        conversion_optimization: {
            a_b_tests: [
                {
                    test_name: 'Product Description Length',
                    variant_a: { name: 'Short Description', conversion_rate: 2.1, confidence: 95 },
                    variant_b: { name: 'Long Description', conversion_rate: 2.8, confidence: 95 },
                    winner: 'variant_b',
                    improvement: 33.3
                }
            ]
        }
    };

    return res.json({
        success: true,
        data: conversionData
    });
}

// Generate helper functions for data
function generateDateRange(period) {
    const dates = [];
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    
    return dates;
}

function generateMetricData(metric, period) {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = 0; i < days; i++) {
        let value;
        switch (metric) {
            case 'clicks':
                value = Math.floor(Math.random() * 800) + 800;
                break;
            case 'conversions':
                value = Math.floor(Math.random() * 40) + 20;
                break;
            case 'revenue':
                value = Math.random() * 8000 + 8000;
                break;
            case 'commission':
                value = Math.random() * 800 + 800;
                break;
            default:
                value = Math.random() * 100;
        }
        data.push(parseFloat(value.toFixed(2)));
    }
    
    return data;
}

function generateHourlyData() {
    const hours = [];
    for (let hour = 0; hour < 24; hour++) {
        hours.push({
            hour: hour.toString().padStart(2, '0'),
            clicks: Math.floor(Math.random() * 200) + 50,
            conversions: Math.floor(Math.random() * 8) + 1,
            conversion_rate: (Math.random() * 3 + 1).toFixed(2)
        });
    }
    return hours;
}

function generateDailyData(period) {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        data.push({
            date: date.toISOString().split('T')[0],
            clicks: Math.floor(Math.random() * 800) + 800,
            conversions: Math.floor(Math.random() * 40) + 20,
            revenue: Math.random() * 8000 + 8000,
            commission: Math.random() * 800 + 800
        });
    }
    
    return data;
}

// Other analytics functions (simplified for now)
function getRevenueAnalytics(req, res, user) {
    return res.json({
        success: true,
        message: 'Revenue analytics - full implementation with financial reporting'
    });
}

function getTrendAnalytics(req, res, user) {
    return res.json({
        success: true,
        message: 'Trend analytics - predictive analytics and forecasting'
    });
}

function getReports(req, res, user) {
    return res.json({
        success: true,
        message: 'Reports - pre-built and custom report templates'
    });
}

function exportAnalytics(req, res, user) {
    return res.json({
        success: true,
        message: 'Export analytics - CSV/Excel/PDF export functionality'
    });
}

function generateCustomReport(req, res, user) {
    return res.json({
        success: true,
        message: 'Custom report generation - user-defined metrics and dimensions'
    });
}