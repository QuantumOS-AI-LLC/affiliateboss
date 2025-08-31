const { handleCors, checkAuth, getDemoData, formatCurrency, formatDate, calculateCommission } = require('./utils/helpers');

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    
    const user = checkAuth(req, res);
    if (!user) return;

    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    const path = pathname.replace('/api/commissions', '');

    switch (req.method) {
        case 'GET':
            if (path === '') return getAllCommissions(req, res, user);
            if (path === '/summary') return getCommissionSummary(req, res, user);
            if (path === '/tiers') return getTierStructure(req, res, user);
            if (path === '/history') return getCommissionHistory(req, res, user);
            if (path === '/pending') return getPendingCommissions(req, res, user);
            if (path === '/analytics') return getCommissionAnalytics(req, res, user);
            if (path.match(/^\/\d+$/)) return getCommissionDetails(req, res, user, parseInt(path.slice(1)));
            break;
            
        case 'POST':
            if (path === '/calculate') return calculatePotentialCommission(req, res, user);
            if (path === '/request-payout') return requestPayout(req, res, user);
            break;
            
        case 'PUT':
            if (path === '/tiers') return updateTierStructure(req, res, user);
            break;
    }
    
    return res.status(404).json({ error: 'Commission API endpoint not found' });
};

// Get all commissions with advanced filtering
function getAllCommissions(req, res, user) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const status = url.searchParams.get('status') || 'all';
    const dateFrom = url.searchParams.get('date_from');
    const dateTo = url.searchParams.get('date_to');
    const minAmount = parseFloat(url.searchParams.get('min_amount')) || 0;
    const sortBy = url.searchParams.get('sort_by') || 'date';
    const sortOrder = url.searchParams.get('sort_order') || 'desc';
    
    // Comprehensive commission data - real Bangladesh dev style with detailed tracking
    const allCommissions = [
        {
            id: 1,
            commission_type: "product_sale",
            order_id: 1001,
            product_id: 1,
            product_name: "MacBook Pro M3 Max 16-inch",
            link_id: 1,
            link_code: "mbp001",
            
            // Financial details
            sale_amount: 3999.00,
            base_commission_rate: 8.5,
            tier_multiplier: 1.2,
            final_commission_rate: 10.2,
            commission_amount: 407.90,
            
            // Customer and geo data
            customer_email: "john.doe@email.com",
            customer_country: "United States",
            customer_city: "San Francisco",
            
            // Status tracking
            status: "confirmed",
            payment_status: "paid",
            payout_batch_id: "pb_2024012901",
            
            // Timestamps
            sale_date: "2024-01-28T14:30:00Z",
            confirmed_date: "2024-01-29T10:15:00Z",
            paid_date: "2024-01-30T00:00:00Z",
            created_at: "2024-01-28T14:30:00Z",
            
            // Additional tracking
            shopify_order_id: "gid://shopify/Order/5234567890123",
            shopify_store_name: "TechHub Premium Electronics",
            referrer_source: "direct",
            device_type: "desktop",
            
            // Tier info at time of sale
            user_tier_at_sale: "premium",
            lifetime_earnings_at_sale: 15234.56,
            
            // Notes and metadata
            notes: "High-value conversion from premium user",
            fraud_check_status: "passed",
            refund_risk_score: 0.1
        },
        {
            id: 2,
            commission_type: "product_sale",
            order_id: 1002,
            product_id: 8,
            product_name: "Hermès Birkin 35 Handbag",
            link_id: 4,
            link_code: "rlx001",
            
            sale_amount: 12000.00,
            base_commission_rate: 8.0,
            tier_multiplier: 1.2,
            final_commission_rate: 9.6,
            commission_amount: 1152.00,
            
            customer_email: "sarah.wilson@email.com",
            customer_country: "United States",
            customer_city: "Beverly Hills",
            
            status: "confirmed",
            payment_status: "paid",
            payout_batch_id: "pb_2024012901",
            
            sale_date: "2024-01-29T09:15:00Z",
            confirmed_date: "2024-01-29T11:30:00Z",
            paid_date: "2024-01-30T00:00:00Z",
            created_at: "2024-01-29T09:15:00Z",
            
            shopify_order_id: "gid://shopify/Order/5234567890124",
            shopify_store_name: "Luxury Lifestyle Store",
            referrer_source: "email",
            device_type: "desktop",
            
            user_tier_at_sale: "premium",
            lifetime_earnings_at_sale: 15642.46,
            
            notes: "Luxury item sale - high commission value",
            fraud_check_status: "passed",
            refund_risk_score: 0.05
        },
        {
            id: 3,
            commission_type: "product_sale",
            order_id: 1003,
            product_id: 3,
            product_name: "iPhone 15 Pro 256GB",
            link_id: 3,
            link_code: "ip15pm",
            
            sale_amount: 1199.00,
            base_commission_rate: 6.0,
            tier_multiplier: 1.2,
            final_commission_rate: 7.2,
            commission_amount: 86.33,
            
            customer_email: "mike.chen@email.com",
            customer_country: "Canada",
            customer_city: "Toronto",
            
            status: "confirmed",
            payment_status: "pending",
            payout_batch_id: null,
            
            sale_date: "2024-01-29T16:45:00Z",
            confirmed_date: "2024-01-29T17:20:00Z",
            paid_date: null,
            created_at: "2024-01-29T16:45:00Z",
            
            shopify_order_id: "gid://shopify/Order/5234567890125",
            shopify_store_name: "TechHub Premium Electronics",
            referrer_source: "social",
            device_type: "mobile",
            
            user_tier_at_sale: "premium",
            lifetime_earnings_at_sale: 16794.46,
            
            notes: "Mobile conversion from social media",
            fraud_check_status: "passed",
            refund_risk_score: 0.15
        },
        {
            id: 4,
            commission_type: "product_sale",
            order_id: 1004,
            product_id: 6,
            product_name: "Dyson V15 Detect Absolute Vacuum",
            link_id: 5,
            link_code: "dyv15",
            
            sale_amount: 749.99,
            base_commission_rate: 18.0,
            tier_multiplier: 1.2,
            final_commission_rate: 21.6,
            commission_amount: 162.00,
            
            customer_email: "lisa.garcia@email.com",
            customer_country: "United States",
            customer_city: "Austin",
            
            status: "pending",
            payment_status: "pending",
            payout_batch_id: null,
            
            sale_date: "2024-01-29T18:20:00Z",
            confirmed_date: null,
            paid_date: null,
            created_at: "2024-01-29T18:20:00Z",
            
            shopify_order_id: "gid://shopify/Order/5234567890126",
            shopify_store_name: "TechHub Premium Electronics",
            referrer_source: "direct",
            device_type: "desktop",
            
            user_tier_at_sale: "premium",
            lifetime_earnings_at_sale: 16880.79,
            
            notes: "Recent sale - awaiting confirmation",
            fraud_check_status: "pending",
            refund_risk_score: 0.2
        },
        {
            id: 5,
            commission_type: "bonus_commission",
            order_id: null,
            product_id: null,
            product_name: "Monthly Performance Bonus",
            link_id: null,
            link_code: null,
            
            sale_amount: 0,
            base_commission_rate: 0,
            tier_multiplier: 1.0,
            final_commission_rate: 0,
            commission_amount: 250.00,
            
            customer_email: null,
            customer_country: null,
            customer_city: null,
            
            status: "confirmed",
            payment_status: "paid",
            payout_batch_id: "pb_2024012901",
            
            sale_date: "2024-01-31T23:59:00Z",
            confirmed_date: "2024-01-31T23:59:00Z",
            paid_date: "2024-02-01T00:00:00Z",
            created_at: "2024-01-31T23:59:00Z",
            
            shopify_order_id: null,
            shopify_store_name: null,
            referrer_source: null,
            device_type: null,
            
            user_tier_at_sale: "premium",
            lifetime_earnings_at_sale: 17042.79,
            
            notes: "Monthly performance bonus for exceeding $15k in commissions",
            fraud_check_status: "n/a",
            refund_risk_score: 0
        }
    ];

    // Apply filters
    let filteredCommissions = allCommissions.filter(commission => {
        if (status !== 'all' && commission.status !== status) {
            return false;
        }
        
        if (dateFrom && new Date(commission.sale_date) < new Date(dateFrom)) {
            return false;
        }
        
        if (dateTo && new Date(commission.sale_date) > new Date(dateTo)) {
            return false;
        }
        
        if (commission.commission_amount < minAmount) {
            return false;
        }
        
        return true;
    });

    // Sort results
    filteredCommissions.sort((a, b) => {
        let aVal, bVal;
        switch (sortBy) {
            case 'amount':
                aVal = a.commission_amount;
                bVal = b.commission_amount;
                break;
            case 'product':
                aVal = a.product_name || '';
                bVal = b.product_name || '';
                break;
            case 'status':
                aVal = a.status;
                bVal = b.status;
                break;
            default:
                aVal = new Date(a.sale_date);
                bVal = new Date(b.sale_date);
        }
        
        if (sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });

    // Pagination
    const totalCount = filteredCommissions.length;
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;
    const paginatedCommissions = filteredCommissions.slice(offset, offset + limit);

    // Add formatted fields
    const commissionsWithFormatted = paginatedCommissions.map(commission => ({
        ...commission,
        sale_amount_formatted: formatCurrency(commission.sale_amount),
        commission_amount_formatted: formatCurrency(commission.commission_amount),
        sale_date_formatted: formatDate(commission.sale_date),
        confirmed_date_formatted: commission.confirmed_date ? formatDate(commission.confirmed_date) : 'Pending',
        paid_date_formatted: commission.paid_date ? formatDate(commission.paid_date) : 'Not paid'
    }));

    // Calculate summary
    const summary = {
        total_commissions: totalCount,
        total_amount: filteredCommissions.reduce((sum, c) => sum + c.commission_amount, 0),
        paid_amount: filteredCommissions.filter(c => c.payment_status === 'paid').reduce((sum, c) => sum + c.commission_amount, 0),
        pending_amount: filteredCommissions.filter(c => c.payment_status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0)
    };

    return res.json({
        success: true,
        data: commissionsWithFormatted,
        pagination: {
            page,
            limit,
            total_count: totalCount,
            total_pages: totalPages,
            has_next: page < totalPages,
            has_prev: page > 1
        },
        summary: {
            ...summary,
            total_amount_formatted: formatCurrency(summary.total_amount),
            paid_amount_formatted: formatCurrency(summary.paid_amount),
            pending_amount_formatted: formatCurrency(summary.pending_amount)
        }
    });
}

// Get commission summary and KPIs
function getCommissionSummary(req, res, user) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const period = url.searchParams.get('period') || '30d';
    
    // Comprehensive summary with KPIs - this is what real affiliates need to see
    const summary = {
        overview: {
            total_lifetime_earnings: 17292.79,
            current_month_earnings: 1808.23,
            pending_commissions: 248.33,
            next_payout_amount: 248.33,
            next_payout_date: "2024-02-05T00:00:00Z",
            current_tier: "premium",
            tier_multiplier: 1.2
        },
        
        this_month: {
            total_commissions: 5,
            total_earnings: 1808.23,
            total_sales_volume: 18947.99,
            avg_commission_rate: 9.54,
            avg_order_value: 3789.60,
            conversion_count: 5,
            best_performing_product: "Hermès Birkin 35 Handbag",
            best_commission: 1152.00
        },
        
        last_month: {
            total_commissions: 8,
            total_earnings: 2456.78,
            total_sales_volume: 24567.89,
            avg_commission_rate: 10.0,
            avg_order_value: 3070.99,
            conversion_count: 8,
            growth_vs_previous: 15.2
        },
        
        year_to_date: {
            total_commissions: 45,
            total_earnings: 17292.79,
            total_sales_volume: 189472.34,
            avg_commission_rate: 9.13,
            avg_order_value: 4210.50,
            conversion_count: 45,
            best_month: "December 2023"
        },
        
        performance_by_category: {
            "Electronics": {
                commissions: 28,
                earnings: 12456.78,
                avg_commission_rate: 8.5,
                total_sales: 146541.65
            },
            "Luxury Fashion": {
                commissions: 8,
                earnings: 3250.45,
                avg_commission_rate: 7.8,
                total_sales: 41672.44
            },
            "Home & Garden": {
                commissions: 6,
                earnings: 1245.67,
                avg_commission_rate: 17.5,
                total_sales: 7121.51
            },
            "Automotive": {
                commissions: 3,
                earnings: 339.89,
                avg_commission_rate: 12.0,
                total_sales: 2832.41
            }
        },
        
        tier_progression: {
            current_tier: "premium",
            current_benefits: {
                base_multiplier: 1.2,
                bonus_rate: 20,
                priority_support: true,
                exclusive_products: true
            },
            next_tier: "platinum",
            next_tier_requirements: {
                lifetime_earnings_required: 25000.00,
                current_progress: 17292.79,
                remaining: 7707.21,
                progress_percentage: 69.17
            },
            tier_benefits_comparison: [
                { tier: "bronze", multiplier: 1.0, min_earnings: 0 },
                { tier: "silver", multiplier: 1.1, min_earnings: 5000 },
                { tier: "gold", multiplier: 1.15, min_earnings: 10000 },
                { tier: "premium", multiplier: 1.2, min_earnings: 15000 },
                { tier: "platinum", multiplier: 1.3, min_earnings: 25000 },
                { tier: "diamond", multiplier: 1.5, min_earnings: 50000 }
            ]
        },
        
        recent_milestones: [
            {
                type: "tier_upgrade",
                description: "Upgraded to Premium tier",
                date: "2024-01-15T10:30:00Z",
                bonus_earned: 150.00
            },
            {
                type: "monthly_bonus",
                description: "Monthly performance bonus earned",
                date: "2024-01-31T23:59:00Z",
                bonus_earned: 250.00
            },
            {
                type: "high_value_sale",
                description: "Earned $1,152 from luxury item sale",
                date: "2024-01-29T09:15:00Z",
                bonus_earned: 0
            }
        ]
    };

    // Add formatted currency values
    const formatSummarySection = (section) => {
        const formatted = {};
        Object.keys(section).forEach(key => {
            if (typeof section[key] === 'number' && (key.includes('earnings') || key.includes('amount') || key.includes('value') || key.includes('volume') || key.includes('commission'))) {
                formatted[key + '_formatted'] = formatCurrency(section[key]);
            }
        });
        return { ...section, ...formatted };
    };

    summary.overview = formatSummarySection(summary.overview);
    summary.this_month = formatSummarySection(summary.this_month);
    summary.last_month = formatSummarySection(summary.last_month);
    summary.year_to_date = formatSummarySection(summary.year_to_date);

    Object.keys(summary.performance_by_category).forEach(category => {
        summary.performance_by_category[category] = formatSummarySection(summary.performance_by_category[category]);
    });

    return res.json({
        success: true,
        data: summary,
        period: period,
        generated_at: new Date().toISOString()
    });
}

// Get tier structure and progression
function getTierStructure(req, res, user) {
    const tierStructure = {
        current_user_tier: {
            name: "premium",
            display_name: "Premium Affiliate",
            level: 4,
            multiplier: 1.2,
            color: "#8B5CF6",
            icon: "crown",
            benefits: [
                "20% commission bonus on all sales",
                "Priority customer support",
                "Access to exclusive high-commission products",
                "Monthly performance bonuses",
                "Advanced analytics and reporting",
                "Custom link branding options"
            ],
            requirements: {
                min_lifetime_earnings: 15000.00,
                min_monthly_volume: 5000.00,
                min_conversion_rate: 2.0
            }
        },
        
        all_tiers: [
            {
                name: "bronze",
                display_name: "Bronze Affiliate",
                level: 1,
                multiplier: 1.0,
                color: "#CD7F32",
                icon: "star",
                benefits: [
                    "Standard commission rates",
                    "Basic link tracking",
                    "Email support",
                    "Monthly payout (minimum $50)"
                ],
                requirements: {
                    min_lifetime_earnings: 0,
                    min_monthly_volume: 0,
                    min_conversion_rate: 0
                }
            },
            {
                name: "silver",
                display_name: "Silver Affiliate",
                level: 2,
                multiplier: 1.1,
                color: "#C0C0C0",
                icon: "award",
                benefits: [
                    "10% commission bonus",
                    "Advanced link analytics",
                    "Priority email support",
                    "Weekly payout option",
                    "Access to promotional materials"
                ],
                requirements: {
                    min_lifetime_earnings: 5000.00,
                    min_monthly_volume: 2000.00,
                    min_conversion_rate: 1.5
                }
            },
            {
                name: "gold",
                display_name: "Gold Affiliate",
                level: 3,
                multiplier: 1.15,
                color: "#FFD700",
                icon: "medal",
                benefits: [
                    "15% commission bonus",
                    "Real-time analytics",
                    "Phone support",
                    "Weekly payouts",
                    "Exclusive product previews",
                    "Custom landing pages"
                ],
                requirements: {
                    min_lifetime_earnings: 10000.00,
                    min_monthly_volume: 3500.00,
                    min_conversion_rate: 2.0
                }
            },
            {
                name: "premium",
                display_name: "Premium Affiliate",
                level: 4,
                multiplier: 1.2,
                color: "#8B5CF6",
                icon: "crown",
                benefits: [
                    "20% commission bonus on all sales",
                    "Priority customer support",
                    "Access to exclusive high-commission products",
                    "Monthly performance bonuses",
                    "Advanced analytics and reporting",
                    "Custom link branding options"
                ],
                requirements: {
                    min_lifetime_earnings: 15000.00,
                    min_monthly_volume: 5000.00,
                    min_conversion_rate: 2.5
                }
            },
            {
                name: "platinum",
                display_name: "Platinum Affiliate",
                level: 5,
                multiplier: 1.3,
                color: "#E5E4E2",
                icon: "gem",
                benefits: [
                    "30% commission bonus",
                    "Dedicated account manager",
                    "Exclusive product access",
                    "Daily payouts available",
                    "Co-marketing opportunities",
                    "Revenue sharing programs",
                    "VIP event invitations"
                ],
                requirements: {
                    min_lifetime_earnings: 25000.00,
                    min_monthly_volume: 8000.00,
                    min_conversion_rate: 3.0
                }
            },
            {
                name: "diamond",
                display_name: "Diamond Affiliate",
                level: 6,
                multiplier: 1.5,
                color: "#B9F2FF",
                icon: "diamond",
                benefits: [
                    "50% commission bonus",
                    "Personal success manager",
                    "Equity participation options",
                    "Instant payouts",
                    "Co-branding opportunities",
                    "Product development input",
                    "Speaking opportunities",
                    "Exclusive diamond-tier network"
                ],
                requirements: {
                    min_lifetime_earnings: 50000.00,
                    min_monthly_volume: 15000.00,
                    min_conversion_rate: 4.0
                }
            }
        ],
        
        user_progress: {
            current_lifetime_earnings: 17292.79,
            current_tier: "premium",
            next_tier: "platinum",
            progress_to_next: {
                earnings_needed: 7707.21,
                percentage_complete: 69.17,
                estimated_months_to_next: 2.3
            }
        },
        
        tier_comparison: {
            commission_example: {
                sale_amount: 1000.00,
                commissions_by_tier: {
                    bronze: 80.00,    // 8% base rate
                    silver: 88.00,    // 8% * 1.1
                    gold: 92.00,      // 8% * 1.15
                    premium: 96.00,   // 8% * 1.2
                    platinum: 104.00, // 8% * 1.3
                    diamond: 120.00   // 8% * 1.5
                }
            }
        }
    };

    // Add formatted currency values
    tierStructure.all_tiers.forEach(tier => {
        tier.requirements.min_lifetime_earnings_formatted = formatCurrency(tier.requirements.min_lifetime_earnings);
        tier.requirements.min_monthly_volume_formatted = formatCurrency(tier.requirements.min_monthly_volume);
    });

    tierStructure.user_progress.current_lifetime_earnings_formatted = formatCurrency(tierStructure.user_progress.current_lifetime_earnings);
    tierStructure.user_progress.progress_to_next.earnings_needed_formatted = formatCurrency(tierStructure.user_progress.progress_to_next.earnings_needed);

    Object.keys(tierStructure.tier_comparison.commission_example.commissions_by_tier).forEach(tier => {
        const amount = tierStructure.tier_comparison.commission_example.commissions_by_tier[tier];
        tierStructure.tier_comparison.commission_example.commissions_by_tier[tier + '_formatted'] = formatCurrency(amount);
    });

    return res.json({
        success: true,
        data: tierStructure
    });
}

// Get commission history with advanced analytics
function getCommissionHistory(req, res, user) {
    const demoData = getDemoData();
    
    // This would be much more extensive in real app - pulling from commission_history table
    const historyData = demoData.commissionHistory.map(record => ({
        ...record,
        commission_amount_formatted: formatCurrency(record.commission_amount),
        sale_amount_formatted: formatCurrency(record.sale_amount),
        date_formatted: formatDate(record.date),
        payout_date_formatted: record.payout_date ? formatDate(record.payout_date) : 'Pending'
    }));

    return res.json({
        success: true,
        data: historyData,
        summary: {
            total_records: historyData.length,
            total_commission_earned: historyData.reduce((sum, record) => sum + record.commission_amount, 0),
            avg_commission_per_sale: historyData.length > 0 ? 
                historyData.reduce((sum, record) => sum + record.commission_amount, 0) / historyData.length : 0,
            best_month: "January 2024",
            top_product: "MacBook Pro M3 Max 16-inch"
        }
    });
}

// Get pending commissions
function getPendingCommissions(req, res, user) {
    const pendingCommissions = [
        {
            id: 3,
            product_name: "iPhone 15 Pro 256GB",
            commission_amount: 86.33,
            sale_date: "2024-01-29T16:45:00Z",
            estimated_payout_date: "2024-02-05T00:00:00Z",
            status: "confirmed",
            days_until_payout: 7
        },
        {
            id: 4,
            product_name: "Dyson V15 Detect Absolute Vacuum",
            commission_amount: 162.00,
            sale_date: "2024-01-29T18:20:00Z",
            estimated_payout_date: "2024-02-05T00:00:00Z",
            status: "pending_confirmation",
            days_until_payout: 7
        }
    ];

    const summary = {
        total_pending: pendingCommissions.length,
        total_amount: pendingCommissions.reduce((sum, comm) => sum + comm.commission_amount, 0),
        next_payout_date: "2024-02-05T00:00:00Z"
    };

    return res.json({
        success: true,
        data: pendingCommissions.map(comm => ({
            ...comm,
            commission_amount_formatted: formatCurrency(comm.commission_amount),
            sale_date_formatted: formatDate(comm.sale_date),
            estimated_payout_date_formatted: formatDate(comm.estimated_payout_date)
        })),
        summary: {
            ...summary,
            total_amount_formatted: formatCurrency(summary.total_amount),
            next_payout_date_formatted: formatDate(summary.next_payout_date)
        }
    });
}

// Get commission analytics and trends
function getCommissionAnalytics(req, res, user) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const period = url.searchParams.get('period') || '30d';
    
    let chartData = {};
    
    if (period === '7d') {
        chartData = {
            labels: ['Jan 23', 'Jan 24', 'Jan 25', 'Jan 26', 'Jan 27', 'Jan 28', 'Jan 29'],
            datasets: {
                commissions: [89.50, 157.25, 234.80, 125.60, 287.40, 1152.20, 325.80],
                sales_volume: [1199.00, 2099.00, 3499.00, 1699.00, 3899.00, 12000.00, 4299.00],
                conversion_count: [1, 2, 3, 1, 4, 1, 3]
            }
        };
    } else if (period === '30d') {
        // Generate 30-day analytics data
        const labels = [];
        const commissions = [];
        const salesVolume = [];
        const conversions = [];
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            const dailyCommissions = Math.random() * 500 + 50;
            const dailySales = dailyCommissions * (Math.random() * 8 + 5); // 5-13x multiplier
            const dailyConversions = Math.floor(Math.random() * 5) + 1;
            
            commissions.push(parseFloat(dailyCommissions.toFixed(2)));
            salesVolume.push(parseFloat(dailySales.toFixed(2)));
            conversions.push(dailyConversions);
        }
        
        chartData = { labels, datasets: { commissions, sales_volume: salesVolume, conversion_count: conversions } };
    }

    const analytics = {
        period: period,
        chart_data: chartData,
        performance_metrics: {
            total_commission: chartData.datasets.commissions.reduce((a, b) => a + b, 0),
            total_sales_volume: chartData.datasets.sales_volume.reduce((a, b) => a + b, 0),
            total_conversions: chartData.datasets.conversion_count.reduce((a, b) => a + b, 0),
            avg_commission_per_day: chartData.datasets.commissions.reduce((a, b) => a + b, 0) / chartData.labels.length,
            avg_order_value: chartData.datasets.sales_volume.reduce((a, b) => a + b, 0) / chartData.datasets.conversion_count.reduce((a, b) => a + b, 0),
            commission_rate: (chartData.datasets.commissions.reduce((a, b) => a + b, 0) / chartData.datasets.sales_volume.reduce((a, b) => a + b, 0)) * 100
        },
        top_performing_days: [
            { date: "2024-01-28", commission: 1152.20, reason: "Luxury item sale" },
            { date: "2024-01-27", commission: 287.40, reason: "Multiple conversions" },
            { date: "2024-01-29", commission: 325.80, reason: "High-value electronics" }
        ]
    };

    // Add formatted values
    const metrics = analytics.performance_metrics;
    analytics.performance_metrics = {
        ...metrics,
        total_commission_formatted: formatCurrency(metrics.total_commission),
        total_sales_volume_formatted: formatCurrency(metrics.total_sales_volume),
        avg_commission_per_day_formatted: formatCurrency(metrics.avg_commission_per_day),
        avg_order_value_formatted: formatCurrency(metrics.avg_order_value),
        commission_rate_formatted: `${metrics.commission_rate.toFixed(2)}%`
    };

    return res.json({
        success: true,
        data: analytics
    });
}

// Calculate potential commission for a sale
function calculatePotentialCommission(req, res, user) {
    const { sale_amount, product_commission_rate, tier_override } = req.body || {};
    
    if (!sale_amount || sale_amount <= 0) {
        return res.status(400).json({
            error: 'Valid sale amount is required',
            details: 'Please provide a positive sale amount to calculate commission'
        });
    }

    const baseRate = product_commission_rate || 15.0;
    const calculation = calculateCommission(user.id, sale_amount, baseRate);
    
    // Add detailed breakdown
    const detailedCalculation = {
        sale_amount: sale_amount,
        base_commission_rate: calculation.base_rate,
        user_tier: user.tier,
        tier_multiplier: calculation.tier_multiplier,
        final_commission_rate: calculation.rate,
        commission_amount: calculation.amount,
        
        breakdown: {
            step1: `Base Rate: ${calculation.base_rate}%`,
            step2: `Tier Multiplier (${user.tier}): ${calculation.tier_multiplier}x`,
            step3: `Final Rate: ${calculation.base_rate}% × ${calculation.tier_multiplier} = ${calculation.rate}%`,
            step4: `Commission: $${sale_amount} × ${calculation.rate}% = $${calculation.amount.toFixed(2)}`
        },
        
        tier_comparison: {
            bronze: { rate: baseRate * 1.0, amount: sale_amount * (baseRate * 1.0 / 100) },
            silver: { rate: baseRate * 1.1, amount: sale_amount * (baseRate * 1.1 / 100) },
            gold: { rate: baseRate * 1.15, amount: sale_amount * (baseRate * 1.15 / 100) },
            premium: { rate: baseRate * 1.2, amount: sale_amount * (baseRate * 1.2 / 100) },
            platinum: { rate: baseRate * 1.3, amount: sale_amount * (baseRate * 1.3 / 100) },
            diamond: { rate: baseRate * 1.5, amount: sale_amount * (baseRate * 1.5 / 100) }
        }
    };

    // Add formatted values
    detailedCalculation.sale_amount_formatted = formatCurrency(detailedCalculation.sale_amount);
    detailedCalculation.commission_amount_formatted = formatCurrency(detailedCalculation.commission_amount);

    Object.keys(detailedCalculation.tier_comparison).forEach(tier => {
        const tierData = detailedCalculation.tier_comparison[tier];
        detailedCalculation.tier_comparison[tier].amount_formatted = formatCurrency(tierData.amount);
    });

    return res.json({
        success: true,
        data: detailedCalculation
    });
}

// Request payout
function requestPayout(req, res, user) {
    const { payout_method = 'stripe', minimum_amount = 50.00 } = req.body || {};
    
    // Check pending commission amount
    const pendingAmount = 248.33; // In real app, sum from database
    
    if (pendingAmount < minimum_amount) {
        return res.status(400).json({
            error: 'Insufficient balance for payout',
            details: `Minimum payout amount is ${formatCurrency(minimum_amount)}. Current pending: ${formatCurrency(pendingAmount)}`
        });
    }

    // Create payout request
    const payoutRequest = {
        id: `payout_${Date.now()}`,
        amount: pendingAmount,
        payout_method: payout_method,
        status: 'requested',
        requested_at: new Date().toISOString(),
        estimated_completion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
        commission_ids: [3, 4], // IDs of commissions included in this payout
        fees: {
            processing_fee: payout_method === 'stripe' ? pendingAmount * 0.029 : 0, // 2.9% for Stripe
            fixed_fee: 0.30
        }
    };

    const totalFees = payoutRequest.fees.processing_fee + payoutRequest.fees.fixed_fee;
    payoutRequest.net_amount = payoutRequest.amount - totalFees;

    return res.json({
        success: true,
        data: {
            ...payoutRequest,
            amount_formatted: formatCurrency(payoutRequest.amount),
            net_amount_formatted: formatCurrency(payoutRequest.net_amount),
            total_fees_formatted: formatCurrency(totalFees),
            estimated_completion_formatted: formatDate(payoutRequest.estimated_completion)
        },
        message: 'Payout request submitted successfully. You will receive confirmation within 24 hours.'
    });
}

// Other helper functions
function getCommissionDetails(req, res, user, commissionId) {
    return res.json({
        success: true,
        message: `Commission ${commissionId} details - full implementation in production`
    });
}

function updateTierStructure(req, res, user) {
    return res.json({
        success: true,
        message: 'Tier structure update - admin only endpoint'
    });
}