const { handleCors, checkAuth, generateShortCode, getDemoData, formatCurrency, formatDate } = require('./utils/helpers');

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    
    // Check auth - we need valid user
    const user = checkAuth(req, res);
    if (!user) return;

    // Route based on method and path
    const { pathname, searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const path = pathname.replace('/api/links', '');

    switch (req.method) {
        case 'GET':
            if (path === '') return getAllLinks(req, res, user);
            if (path === '/stats') return getLinkStats(req, res, user);
            if (path === '/performance') return getPerformanceData(req, res, user);
            if (path.match(/^\/\d+$/)) return getSingleLink(req, res, user, parseInt(path.slice(1)));
            if (path.match(/^\/\d+\/analytics$/)) return getLinkAnalytics(req, res, user, parseInt(path.split('/')[1]));
            break;
            
        case 'POST':
            if (path === '') return createLink(req, res, user);
            if (path === '/bulk') return createBulkLinks(req, res, user);
            break;
            
        case 'PUT':
            if (path.match(/^\/\d+$/)) return updateLink(req, res, user, parseInt(path.slice(1)));
            break;
            
        case 'DELETE':
            if (path.match(/^\/\d+$/)) return deleteLink(req, res, user, parseInt(path.slice(1)));
            break;
    }
    
    return res.status(404).json({ error: 'Endpoint not found' });
};

// Get all links with advanced filtering and pagination
function getAllLinks(req, res, user) {
    const demoData = getDemoData();
    
    // Parse query parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const search = url.searchParams.get('search') || '';
    const sortBy = url.searchParams.get('sort_by') || 'created_at';
    const sortOrder = url.searchParams.get('sort_order') || 'desc';
    const status = url.searchParams.get('status') || 'all';
    const dateFrom = url.searchParams.get('date_from');
    const dateTo = url.searchParams.get('date_to');
    const minClicks = parseInt(url.searchParams.get('min_clicks')) || 0;
    const minEarnings = parseFloat(url.searchParams.get('min_earnings')) || 0;
    
    // Comprehensive demo links data - real dev would pull from database
    let allLinks = [
        {
            id: 1,
            name: "MacBook Pro M3 Max Premium Link",
            description: "High-converting link for MacBook Pro targeting professionals",
            original_url: "https://apple.com/macbook-pro",
            short_url: `${req.headers.host || 'localhost:3000'}/go/mbp001`,
            short_code: "mbp001",
            clicks: 2847,
            unique_clicks: 2341,
            conversions: 45,
            conversion_rate: 1.92,
            earnings: 1529.40,
            avg_order_value: 3998.67,
            status: "active",
            created_at: "2024-01-15T10:30:00Z",
            updated_at: "2024-01-29T14:22:00Z",
            last_click: "2024-01-29T12:15:00Z",
            tags: ["electronics", "apple", "high-ticket"],
            category: "Electronics",
            geographic_performance: {
                "US": { clicks: 1825, conversions: 32, earnings: 1019.20 },
                "CA": { clicks: 456, conversions: 8, earnings: 285.60 },
                "UK": { clicks: 334, conversions: 3, earnings: 134.40 },
                "AU": { clicks: 232, conversions: 2, earnings: 90.20 }
            },
            device_breakdown: {
                "desktop": { clicks: 1708, conversions: 35 },
                "mobile": { clicks: 852, conversions: 8 },
                "tablet": { clicks: 287, conversions: 2 }
            },
            referrer_performance: {
                "direct": { clicks: 1139, conversions: 22 },
                "social": { clicks: 854, conversions: 15 },
                "email": { clicks: 568, conversions: 6 },
                "organic": { clicks: 286, conversions: 2 }
            }
        },
        {
            id: 2,
            name: "Tesla Model S Luxury Deal",
            description: "Exclusive Tesla link for high-net-worth customers",
            original_url: "https://tesla.com/models",
            short_url: `${req.headers.host || 'localhost:3000'}/go/tesla02`,
            short_code: "tesla02",
            clicks: 1056,
            unique_clicks: 934,
            conversions: 9,
            conversion_rate: 0.85,
            earnings: 1079.88,
            avg_order_value: 89990.00,
            status: "active",
            created_at: "2024-01-16T14:22:00Z",
            updated_at: "2024-01-29T16:45:00Z",
            last_click: "2024-01-29T11:30:00Z",
            tags: ["automotive", "tesla", "luxury"],
            category: "Automotive",
            geographic_performance: {
                "US": { clicks: 634, conversions: 6, earnings: 719.92 },
                "CA": { clicks: 211, conversions: 2, earnings: 239.98 },
                "UK": { clicks: 127, conversions: 1, earnings: 119.98 },
                "DE": { clicks: 84, conversions: 0, earnings: 0 }
            },
            device_breakdown: {
                "desktop": { clicks: 738, conversions: 8 },
                "mobile": { clicks: 234, conversions: 1 },
                "tablet": { clicks: 84, conversions: 0 }
            },
            referrer_performance: {
                "direct": { clicks: 422, conversions: 5 },
                "social": { clicks: 317, conversions: 3 },
                "email": { clicks: 211, conversions: 1 },
                "organic": { clicks: 106, conversions: 0 }
            }
        },
        {
            id: 3,
            name: "iPhone 15 Pro Holiday Special",
            description: "Seasonal promotion link for iPhone 15 Pro",
            original_url: "https://apple.com/iphone-15-pro",
            short_url: `${req.headers.host || 'localhost:3000'}/go/ip15pm`,
            short_code: "ip15pm",
            clicks: 892,
            unique_clicks: 756,
            conversions: 31,
            conversion_rate: 3.47,
            earnings: 238.14,
            avg_order_value: 1199.00,
            status: "active",
            created_at: "2024-01-17T09:15:00Z",
            updated_at: "2024-01-29T18:20:00Z",
            last_click: "2024-01-29T16:45:00Z",
            tags: ["electronics", "apple", "mobile"],
            category: "Electronics",
            geographic_performance: {
                "US": { clicks: 535, conversions: 19, earnings: 142.86 },
                "CA": { clicks: 178, conversions: 7, earnings: 52.63 },
                "UK": { clicks: 107, conversions: 3, earnings: 22.57 },
                "AU": { clicks: 72, conversions: 2, earnings: 15.08 }
            },
            device_breakdown: {
                "mobile": { clicks: 534, conversions: 19 },
                "desktop": { clicks: 267, conversions: 9 },
                "tablet": { clicks: 91, conversions: 3 }
            },
            referrer_performance: {
                "social": { clicks: 445, conversions: 17 },
                "direct": { clicks: 267, conversions: 9 },
                "email": { clicks: 134, conversions: 4 },
                "organic": { clicks: 46, conversions: 1 }
            }
        },
        {
            id: 4,
            name: "Rolex Submariner VIP",
            description: "Exclusive luxury watch link for high-value customers",
            original_url: "https://rolex.com/submariner",
            short_url: `${req.headers.host || 'localhost:3000'}/go/rlx001`,
            short_code: "rlx001",
            clicks: 234,
            unique_clicks: 198,
            conversions: 2,
            conversion_rate: 0.85,
            earnings: 915.00,
            avg_order_value: 9150.00,
            status: "active",
            created_at: "2024-01-22T15:45:00Z",
            updated_at: "2024-01-29T10:55:00Z",
            last_click: "2024-01-29T08:20:00Z",
            tags: ["luxury", "watches", "rolex"],
            category: "Luxury Watches",
            geographic_performance: {
                "US": { clicks: 140, conversions: 1, earnings: 457.50 },
                "UK": { clicks: 47, conversions: 1, earnings: 457.50 },
                "DE": { clicks: 28, conversions: 0, earnings: 0 },
                "FR": { clicks: 19, conversions: 0, earnings: 0 }
            },
            device_breakdown: {
                "desktop": { clicks: 164, conversions: 2 },
                "mobile": { clicks: 56, conversions: 0 },
                "tablet": { clicks: 14, conversions: 0 }
            },
            referrer_performance: {
                "direct": { clicks: 117, conversions: 1 },
                "email": { clicks: 70, conversions: 1 },
                "social": { clicks: 35, conversions: 0 },
                "organic": { clicks: 12, conversions: 0 }
            }
        },
        {
            id: 5,
            name: "Dyson V15 Home Cleaning",
            description: "Popular vacuum cleaner with high conversion rate",
            original_url: "https://dyson.com/v15-detect",
            short_url: `${req.headers.host || 'localhost:3000'}/go/dyv15`,
            short_code: "dyv15",
            clicks: 1456,
            unique_clicks: 1234,
            conversions: 67,
            conversion_rate: 4.60,
            earnings: 902.49,
            avg_order_value: 749.99,
            status: "active",
            created_at: "2024-01-20T08:30:00Z",
            updated_at: "2024-01-29T12:10:00Z",
            last_click: "2024-01-29T17:30:00Z",
            tags: ["home", "vacuum", "dyson"],
            category: "Home & Garden",
            geographic_performance: {
                "US": { clicks: 873, conversions: 40, earnings: 540.00 },
                "CA": { clicks: 291, conversions: 15, earnings: 202.50 },
                "UK": { clicks: 204, conversions: 8, earnings: 108.00 },
                "AU": { clicks: 88, conversions: 4, earnings: 52.99 }
            },
            device_breakdown: {
                "mobile": { clicks: 728, conversions: 35 },
                "desktop": { clicks: 582, conversions: 25 },
                "tablet": { clicks: 146, conversions: 7 }
            },
            referrer_performance: {
                "social": { clicks: 728, conversions: 35 },
                "direct": { clicks: 437, conversions: 20 },
                "email": { clicks: 204, conversions: 9 },
                "organic": { clicks: 87, conversions: 3 }
            }
        },
        {
            id: 6,
            name: "Nintendo Switch Gaming Bundle",
            description: "Gaming console with accessories - family friendly",
            original_url: "https://nintendo.com/switch",
            short_url: `${req.headers.host || 'localhost:3000'}/go/nsw01`,
            short_code: "nsw01",
            clicks: 2134,
            unique_clicks: 1876,
            conversions: 89,
            conversion_rate: 4.17,
            earnings: 389.15,
            avg_order_value: 349.99,
            status: "active",
            created_at: "2024-01-21T13:10:00Z",
            updated_at: "2024-01-29T17:20:00Z",
            last_click: "2024-01-29T18:45:00Z",
            tags: ["gaming", "nintendo", "family"],
            category: "Gaming",
            geographic_performance: {
                "US": { clicks: 1280, conversions: 53, earnings: 231.47 },
                "CA": { clicks: 427, conversions: 18, earnings: 78.65 },
                "UK": { clicks: 256, conversions: 12, earnings: 52.50 },
                "AU": { clicks: 171, conversions: 6, earnings: 26.25 }
            },
            device_breakdown: {
                "mobile": { clicks: 1281, conversions: 53 },
                "desktop": { clicks: 640, conversions: 27 },
                "tablet": { clicks: 213, conversions: 9 }
            },
            referrer_performance: {
                "social": { clicks: 1067, conversions: 44 },
                "direct": { clicks: 640, conversions: 27 },
                "email": { clicks: 320, conversions: 13 },
                "organic": { clicks: 107, conversions: 5 }
            }
        },
        {
            id: 7,
            name: "KitchenAid Mixer Cooking",
            description: "Professional kitchen mixer for baking enthusiasts",
            original_url: "https://kitchenaid.com/artisan-mixer",
            short_url: `${req.headers.host || 'localhost:3000'}/go/ka001`,
            short_code: "ka001",
            clicks: 687,
            unique_clicks: 589,
            conversions: 28,
            conversion_rate: 4.08,
            earnings: 240.79,
            avg_order_value: 429.99,
            status: "active",
            created_at: "2024-01-23T10:15:00Z",
            updated_at: "2024-01-29T14:30:00Z",
            last_click: "2024-01-29T13:20:00Z",
            tags: ["kitchen", "baking", "kitchenaid"],
            category: "Kitchen Appliances",
            geographic_performance: {
                "US": { clicks: 412, conversions: 17, earnings: 146.79 },
                "CA": { clicks: 137, conversions: 6, earnings: 51.80 },
                "UK": { clicks: 96, conversions: 3, earnings: 25.90 },
                "AU": { clicks: 42, conversions: 2, earnings: 17.30 }
            },
            device_breakdown: {
                "desktop": { clicks: 412, conversions: 17 },
                "mobile": { clicks: 206, conversions: 8 },
                "tablet": { clicks: 69, conversions: 3 }
            },
            referrer_performance: {
                "direct": { clicks: 275, conversions: 11 },
                "social": { clicks: 206, conversions: 9 },
                "email": { clicks: 137, conversions: 6 },
                "organic": { clicks: 69, conversions: 2 }
            }
        },
        {
            id: 8,
            name: "Samsung 8K TV Entertainment",
            description: "Premium 8K television for home entertainment",
            original_url: "https://samsung.com/8k-tv",
            short_url: `${req.headers.host || 'localhost:3000'}/go/s8ktv`,
            short_code: "s8ktv",
            clicks: 543,
            unique_clicks: 467,
            conversions: 12,
            conversion_rate: 2.21,
            earnings: 369.59,
            avg_order_value: 2799.99,
            status: "paused",
            created_at: "2024-01-25T14:20:00Z",
            updated_at: "2024-01-29T18:45:00Z",
            last_click: "2024-01-28T22:10:00Z",
            tags: ["tv", "8k", "samsung"],
            category: "Home Entertainment",
            geographic_performance: {
                "US": { clicks: 326, conversions: 7, earnings: 215.59 },
                "CA": { clicks: 109, conversions: 3, earnings: 92.40 },
                "UK": { clicks: 65, conversions: 1, earnings: 30.80 },
                "DE": { clicks: 43, conversions: 1, earnings: 30.80 }
            },
            device_breakdown: {
                "desktop": { clicks: 380, conversions: 9 },
                "mobile": { clicks: 130, conversions: 2 },
                "tablet": { clicks: 33, conversions: 1 }
            },
            referrer_performance: {
                "direct": { clicks: 217, conversions: 6 },
                "email": { clicks: 163, conversions: 4 },
                "social": { clicks: 109, conversions: 2 },
                "organic": { clicks: 54, conversions: 0 }
            }
        }
    ];

    // Apply filters - this is how we do it in real projects
    let filteredLinks = allLinks.filter(link => {
        if (search && !link.name.toLowerCase().includes(search.toLowerCase()) && 
            !link.description.toLowerCase().includes(search.toLowerCase()) &&
            !link.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))) {
            return false;
        }
        
        if (status !== 'all' && link.status !== status) {
            return false;
        }
        
        if (dateFrom && new Date(link.created_at) < new Date(dateFrom)) {
            return false;
        }
        
        if (dateTo && new Date(link.created_at) > new Date(dateTo)) {
            return false;
        }
        
        if (link.clicks < minClicks || link.earnings < minEarnings) {
            return false;
        }
        
        return true;
    });

    // Sort the results
    filteredLinks.sort((a, b) => {
        let aVal, bVal;
        switch (sortBy) {
            case 'name':
                aVal = a.name;
                bVal = b.name;
                break;
            case 'clicks':
                aVal = a.clicks;
                bVal = b.clicks;
                break;
            case 'conversions':
                aVal = a.conversions;
                bVal = b.conversions;
                break;
            case 'earnings':
                aVal = a.earnings;
                bVal = b.earnings;
                break;
            case 'conversion_rate':
                aVal = a.conversion_rate;
                bVal = b.conversion_rate;
                break;
            default:
                aVal = new Date(a.created_at);
                bVal = new Date(b.created_at);
        }
        
        if (sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });

    // Pagination
    const totalCount = filteredLinks.length;
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;
    const paginatedLinks = filteredLinks.slice(offset, offset + limit);

    // Add formatted fields for display
    const linksWithFormatted = paginatedLinks.map(link => ({
        ...link,
        earnings_formatted: formatCurrency(link.earnings),
        avg_order_value_formatted: formatCurrency(link.avg_order_value),
        created_at_formatted: formatDate(link.created_at),
        updated_at_formatted: formatDate(link.updated_at),
        last_click_formatted: link.last_click ? formatDate(link.last_click) : 'Never'
    }));

    // Calculate summary stats for the filtered results
    const summaryStats = {
        total_links: totalCount,
        total_clicks: filteredLinks.reduce((sum, link) => sum + link.clicks, 0),
        total_conversions: filteredLinks.reduce((sum, link) => sum + link.conversions, 0),
        total_earnings: filteredLinks.reduce((sum, link) => sum + link.earnings, 0),
        avg_conversion_rate: totalCount > 0 ? (filteredLinks.reduce((sum, link) => sum + link.conversion_rate, 0) / totalCount).toFixed(2) : 0
    };

    return res.json({
        success: true,
        data: linksWithFormatted,
        pagination: {
            page,
            limit,
            total_count: totalCount,
            total_pages: totalPages,
            has_next: page < totalPages,
            has_prev: page > 1
        },
        summary: {
            ...summaryStats,
            total_earnings_formatted: formatCurrency(summaryStats.total_earnings)
        },
        filters_applied: {
            search,
            status,
            date_from: dateFrom,
            date_to: dateTo,
            min_clicks: minClicks,
            min_earnings: minEarnings,
            sort_by: sortBy,
            sort_order: sortOrder
        }
    });
}

// Get comprehensive stats for all links
function getLinkStats(req, res, user) {
    // Calculate comprehensive stats - this is what real affiliate platforms show
    const stats = {
        overview: {
            total_links: 8,
            active_links: 7,
            paused_links: 1,
            total_clicks: 10029,
            unique_clicks: 8595,
            total_conversions: 283,
            total_earnings: 4684.44,
            overall_conversion_rate: 2.82,
            avg_earnings_per_click: 0.47
        },
        performance_by_category: {
            "Electronics": {
                links: 3,
                clicks: 4273,
                conversions: 107,
                earnings: 2006.68,
                conversion_rate: 2.50
            },
            "Automotive": {
                links: 1,
                clicks: 1056,
                conversions: 9,
                earnings: 1079.88,
                conversion_rate: 0.85
            },
            "Home & Garden": {
                links: 1,
                clicks: 1456,
                conversions: 67,
                earnings: 902.49,
                conversion_rate: 4.60
            },
            "Gaming": {
                links: 1,
                clicks: 2134,
                conversions: 89,
                earnings: 389.15,
                conversion_rate: 4.17
            },
            "Kitchen Appliances": {
                links: 1,
                clicks: 687,
                conversions: 28,
                earnings: 240.79,
                conversion_rate: 4.08
            },
            "Luxury Watches": {
                links: 1,
                clicks: 234,
                conversions: 2,
                earnings: 915.00,
                conversion_rate: 0.85
            },
            "Home Entertainment": {
                links: 1,
                clicks: 543,
                conversions: 12,
                earnings: 369.59,
                conversion_rate: 2.21
            }
        },
        top_performers: {
            by_clicks: [
                { id: 3, name: "iPhone 15 Pro Holiday Special", clicks: 892 },
                { id: 1, name: "MacBook Pro M3 Max Premium Link", clicks: 2847 },
                { id: 6, name: "Nintendo Switch Gaming Bundle", clicks: 2134 }
            ],
            by_conversions: [
                { id: 6, name: "Nintendo Switch Gaming Bundle", conversions: 89 },
                { id: 5, name: "Dyson V15 Home Cleaning", conversions: 67 },
                { id: 1, name: "MacBook Pro M3 Max Premium Link", conversions: 45 }
            ],
            by_earnings: [
                { id: 1, name: "MacBook Pro M3 Max Premium Link", earnings: 1529.40 },
                { id: 2, name: "Tesla Model S Luxury Deal", earnings: 1079.88 },
                { id: 4, name: "Rolex Submariner VIP", earnings: 915.00 }
            ]
        },
        recent_activity: [
            { id: 6, name: "Nintendo Switch Gaming Bundle", action: "click", timestamp: "2024-01-29T18:45:00Z" },
            { id: 5, name: "Dyson V15 Home Cleaning", action: "conversion", timestamp: "2024-01-29T17:30:00Z" },
            { id: 3, name: "iPhone 15 Pro Holiday Special", action: "click", timestamp: "2024-01-29T16:45:00Z" },
            { id: 1, name: "MacBook Pro M3 Max Premium Link", action: "conversion", timestamp: "2024-01-29T14:22:00Z" },
            { id: 7, name: "KitchenAid Mixer Cooking", action: "click", timestamp: "2024-01-29T13:20:00Z" }
        ]
    };

    // Add formatted currency values
    Object.keys(stats.performance_by_category).forEach(category => {
        stats.performance_by_category[category].earnings_formatted = formatCurrency(stats.performance_by_category[category].earnings);
    });

    stats.overview.total_earnings_formatted = formatCurrency(stats.overview.total_earnings);
    stats.overview.avg_earnings_per_click_formatted = formatCurrency(stats.overview.avg_earnings_per_click);

    stats.top_performers.by_earnings.forEach(item => {
        item.earnings_formatted = formatCurrency(item.earnings);
    });

    return res.json({
        success: true,
        data: stats
    });
}

// Get performance data for charts
function getPerformanceData(req, res, user) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const period = url.searchParams.get('period') || '7d';
    const linkId = url.searchParams.get('link_id');
    
    // Generate performance data based on period - this is demo data, real app would query analytics DB
    let chartData = {};
    
    if (period === '7d') {
        chartData = {
            labels: ['Jan 23', 'Jan 24', 'Jan 25', 'Jan 26', 'Jan 27', 'Jan 28', 'Jan 29'],
            datasets: {
                clicks: [145, 189, 234, 198, 276, 312, 298],
                conversions: [3, 5, 8, 4, 9, 12, 11],
                earnings: [89.50, 157.25, 234.80, 125.60, 287.40, 356.20, 325.80]
            }
        };
    } else if (period === '30d') {
        // Generate 30-day data
        const labels = [];
        const clicks = [];
        const conversions = [];
        const earnings = [];
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            // Generate realistic data with some variation
            const baseClicks = Math.floor(Math.random() * 200) + 100;
            const baseConversions = Math.floor(baseClicks * (Math.random() * 0.05 + 0.01));
            const baseEarnings = baseConversions * (Math.random() * 100 + 50);
            
            clicks.push(baseClicks);
            conversions.push(baseConversions);
            earnings.push(parseFloat(baseEarnings.toFixed(2)));
        }
        
        chartData = { labels, datasets: { clicks, conversions, earnings } };
    }

    return res.json({
        success: true,
        data: {
            period,
            link_id: linkId,
            chart_data: chartData,
            summary: {
                total_clicks: chartData.datasets.clicks.reduce((a, b) => a + b, 0),
                total_conversions: chartData.datasets.conversions.reduce((a, b) => a + b, 0),
                total_earnings: chartData.datasets.earnings.reduce((a, b) => a + b, 0),
                avg_conversion_rate: ((chartData.datasets.conversions.reduce((a, b) => a + b, 0) / chartData.datasets.clicks.reduce((a, b) => a + b, 0)) * 100).toFixed(2)
            }
        }
    });
}

// Get single link details
function getSingleLink(req, res, user, linkId) {
    // Find the link - in real app this would be DB query
    const demoData = getDemoData();
    
    // For demo, just return detailed info for first few IDs
    const linkDetails = {
        1: {
            id: 1,
            name: "MacBook Pro M3 Max Premium Link",
            description: "High-converting link for MacBook Pro targeting professionals",
            original_url: "https://apple.com/macbook-pro",
            short_url: `${req.headers.host || 'localhost:3000'}/go/mbp001`,
            short_code: "mbp001",
            clicks: 2847,
            unique_clicks: 2341,
            conversions: 45,
            conversion_rate: 1.92,
            earnings: 1529.40,
            avg_order_value: 3998.67,
            status: "active",
            created_at: "2024-01-15T10:30:00Z",
            updated_at: "2024-01-29T14:22:00Z",
            last_click: "2024-01-29T12:15:00Z",
            tags: ["electronics", "apple", "high-ticket"],
            category: "Electronics",
            notes: "This is our best performing Apple product link. Targets professionals and power users.",
            utm_parameters: {
                utm_source: "affiliate_boss",
                utm_medium: "affiliate",
                utm_campaign: "macbook_promo_2024",
                utm_content: "premium_link",
                utm_term: "macbook_pro_m3"
            },
            click_fraud_protection: true,
            geo_targeting: {
                allowed_countries: ["US", "CA", "UK", "AU"],
                blocked_countries: []
            },
            device_targeting: {
                allowed_devices: ["desktop", "mobile", "tablet"],
                blocked_devices: []
            },
            schedule: {
                active_hours: "00:00-23:59",
                active_days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
                timezone: "America/New_York"
            }
        }
    };

    const link = linkDetails[linkId];
    
    if (!link) {
        return res.status(404).json({ error: 'Link not found' });
    }

    // Add formatted fields
    const linkWithFormatted = {
        ...link,
        earnings_formatted: formatCurrency(link.earnings),
        avg_order_value_formatted: formatCurrency(link.avg_order_value),
        created_at_formatted: formatDate(link.created_at),
        updated_at_formatted: formatDate(link.updated_at),
        last_click_formatted: link.last_click ? formatDate(link.last_click) : 'Never'
    };

    return res.json({
        success: true,
        data: linkWithFormatted
    });
}

// Get link analytics
function getLinkAnalytics(req, res, user, linkId) {
    // Detailed analytics for specific link
    const analytics = {
        link_id: linkId,
        time_series: {
            "7d": {
                labels: ['Jan 23', 'Jan 24', 'Jan 25', 'Jan 26', 'Jan 27', 'Jan 28', 'Jan 29'],
                clicks: [145, 189, 234, 198, 276, 312, 298],
                conversions: [3, 5, 8, 4, 9, 12, 11],
                earnings: [89.50, 157.25, 234.80, 125.60, 287.40, 356.20, 325.80]
            }
        },
        geographic_breakdown: {
            "US": { clicks: 1825, conversions: 32, earnings: 1019.20, percentage: 64.1 },
            "CA": { clicks: 456, conversions: 8, earnings: 285.60, percentage: 16.0 },
            "UK": { clicks: 334, conversions: 3, earnings: 134.40, percentage: 11.7 },
            "AU": { clicks: 232, conversions: 2, earnings: 90.20, percentage: 8.2 }
        },
        device_breakdown: {
            "desktop": { clicks: 1708, conversions: 35, percentage: 60.0 },
            "mobile": { clicks: 852, conversions: 8, percentage: 29.9 },
            "tablet": { clicks: 287, conversions: 2, percentage: 10.1 }
        },
        referrer_breakdown: {
            "direct": { clicks: 1139, conversions: 22, percentage: 40.0 },
            "social": { clicks: 854, conversions: 15, percentage: 30.0 },
            "email": { clicks: 568, conversions: 6, percentage: 20.0 },
            "organic": { clicks: 286, conversions: 2, percentage: 10.0 }
        },
        hourly_performance: [
            { hour: "00", clicks: 45, conversions: 1 },
            { hour: "01", clicks: 23, conversions: 0 },
            { hour: "02", clicks: 12, conversions: 0 },
            { hour: "03", clicks: 8, conversions: 0 },
            { hour: "04", clicks: 15, conversions: 0 },
            { hour: "05", clicks: 34, conversions: 1 },
            { hour: "06", clicks: 67, conversions: 2 },
            { hour: "07", clicks: 98, conversions: 3 },
            { hour: "08", clicks: 145, conversions: 4 },
            { hour: "09", clicks: 189, conversions: 5 },
            { hour: "10", clicks: 234, conversions: 6 },
            { hour: "11", clicks: 198, conversions: 4 },
            { hour: "12", clicks: 276, conversions: 7 },
            { hour: "13", clicks: 312, conversions: 8 },
            { hour: "14", clicks: 298, conversions: 6 },
            { hour: "15", clicks: 267, conversions: 5 },
            { hour: "16", clicks: 234, conversions: 4 },
            { hour: "17", clicks: 189, conversions: 3 },
            { hour: "18", clicks: 156, conversions: 2 },
            { hour: "19", clicks: 134, conversions: 2 },
            { hour: "20", clicks: 112, conversions: 1 },
            { hour: "21", clicks: 89, conversions: 1 },
            { hour: "22", clicks: 67, conversions: 1 },
            { hour: "23", clicks: 56, conversions: 0 }
        ]
    };

    return res.json({
        success: true,
        data: analytics
    });
}

// Create new affiliate link
function createLink(req, res, user) {
    const { 
        name, 
        description = '', 
        original_url, 
        category = 'General',
        tags = [],
        custom_short_code = null,
        utm_parameters = {},
        notes = '',
        geo_targeting = {},
        device_targeting = {},
        schedule = {},
        click_fraud_protection = true
    } = req.body || {};
    
    // Validation - essential stuff
    if (!name || !original_url) {
        return res.status(400).json({ 
            error: 'Link name and original URL are required',
            details: 'Please provide both a descriptive name and the target URL for your affiliate link'
        });
    }
    
    // Validate URL format
    try {
        new URL(original_url);
    } catch (error) {
        return res.status(400).json({ 
            error: 'Invalid URL format',
            details: 'Please provide a valid URL including http:// or https://'
        });
    }
    
    // Generate short code - use custom if provided and valid
    let shortCode = custom_short_code;
    if (shortCode) {
        // Validate custom short code
        if (!/^[a-zA-Z0-9-_]{3,20}$/.test(shortCode)) {
            return res.status(400).json({
                error: 'Invalid custom short code',
                details: 'Short code must be 3-20 characters and contain only letters, numbers, hyphens, and underscores'
            });
        }
        // In real app, check if short code already exists
    } else {
        shortCode = generateShortCode();
    }
    
    const shortUrl = `${req.headers.host || 'localhost:3000'}/go/${shortCode}`;
    
    // Create new link object with all the advanced features
    const newLink = {
        id: Math.floor(Math.random() * 10000) + 1000,
        name: name.trim(),
        description: description.trim(),
        original_url: original_url,
        short_url: shortUrl,
        short_code: shortCode,
        category: category,
        tags: Array.isArray(tags) ? tags : [],
        clicks: 0,
        unique_clicks: 0,
        conversions: 0,
        conversion_rate: 0,
        earnings: 0,
        avg_order_value: 0,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_click: null,
        user_id: user.id,
        notes: notes.trim(),
        utm_parameters: {
            utm_source: utm_parameters.utm_source || 'affiliate_boss',
            utm_medium: utm_parameters.utm_medium || 'affiliate',
            utm_campaign: utm_parameters.utm_campaign || 'default_campaign',
            utm_content: utm_parameters.utm_content || shortCode,
            utm_term: utm_parameters.utm_term || ''
        },
        click_fraud_protection: click_fraud_protection,
        geo_targeting: {
            allowed_countries: geo_targeting.allowed_countries || [],
            blocked_countries: geo_targeting.blocked_countries || []
        },
        device_targeting: {
            allowed_devices: device_targeting.allowed_devices || ['desktop', 'mobile', 'tablet'],
            blocked_devices: device_targeting.blocked_devices || []
        },
        schedule: {
            active_hours: schedule.active_hours || '00:00-23:59',
            active_days: schedule.active_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            timezone: schedule.timezone || 'America/New_York'
        }
    };
    
    // In real app, we'd save to database here with proper error handling
    // await db.links.create(newLink)
    
    return res.status(201).json({
        success: true,
        data: newLink,
        message: 'Affiliate link created successfully! Start sharing your link to earn commissions.'
    });
}

// Create multiple links at once
function createBulkLinks(req, res, user) {
    const { links } = req.body || {};
    
    if (!links || !Array.isArray(links) || links.length === 0) {
        return res.status(400).json({ 
            error: 'Links array is required',
            details: 'Please provide an array of link objects to create'
        });
    }
    
    if (links.length > 50) {
        return res.status(400).json({
            error: 'Too many links',
            details: 'Maximum 50 links can be created at once'
        });
    }
    
    const createdLinks = [];
    const errors = [];
    
    links.forEach((linkData, index) => {
        try {
            const { name, original_url, description = '', category = 'General' } = linkData;
            
            if (!name || !original_url) {
                errors.push({
                    index,
                    error: 'Name and URL are required',
                    data: linkData
                });
                return;
            }
            
            // Validate URL
            new URL(original_url);
            
            const shortCode = generateShortCode();
            const shortUrl = `${req.headers.host || 'localhost:3000'}/go/${shortCode}`;
            
            const newLink = {
                id: Math.floor(Math.random() * 10000) + 1000,
                name: name.trim(),
                description: description.trim(),
                original_url: original_url,
                short_url: shortUrl,
                short_code: shortCode,
                category: category,
                clicks: 0,
                conversions: 0,
                earnings: 0,
                status: 'active',
                created_at: new Date().toISOString(),
                user_id: user.id
            };
            
            createdLinks.push(newLink);
            
        } catch (error) {
            errors.push({
                index,
                error: error.message,
                data: linkData
            });
        }
    });
    
    return res.status(201).json({
        success: true,
        data: {
            created: createdLinks,
            errors: errors,
            summary: {
                total_submitted: links.length,
                successfully_created: createdLinks.length,
                errors: errors.length
            }
        },
        message: `${createdLinks.length} links created successfully${errors.length > 0 ? `, ${errors.length} failed` : ''}`
    });
}

// Update existing link
function updateLink(req, res, user, linkId) {
    const updateData = req.body || {};
    
    // In real app, we'd fetch the existing link from database first
    // For demo, just return success with updated data
    
    const allowedFields = [
        'name', 'description', 'category', 'tags', 'notes', 'status',
        'utm_parameters', 'geo_targeting', 'device_targeting', 'schedule',
        'click_fraud_protection'
    ];
    
    const updatedFields = {};
    Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
            updatedFields[key] = updateData[key];
        }
    });
    
    if (Object.keys(updatedFields).length === 0) {
        return res.status(400).json({
            error: 'No valid fields to update',
            allowed_fields: allowedFields
        });
    }
    
    // Validate URL if provided
    if (updatedFields.original_url) {
        try {
            new URL(updatedFields.original_url);
        } catch (error) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }
    }
    
    const updatedLink = {
        id: linkId,
        ...updatedFields,
        updated_at: new Date().toISOString()
    };
    
    // In real app: await db.links.update(linkId, updatedFields)
    
    return res.json({
        success: true,
        data: updatedLink,
        message: 'Link updated successfully'
    });
}

// Delete link
function deleteLink(req, res, user, linkId) {
    // In real app, we'd check if link exists and belongs to user
    // Also handle any dependent data (analytics, etc.)
    
    // For demo, just return success
    return res.json({
        success: true,
        message: 'Link deleted successfully',
        data: {
            id: linkId,
            deleted_at: new Date().toISOString()
        }
    });
}