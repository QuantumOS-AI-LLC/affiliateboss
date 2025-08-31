const crypto = require('crypto');

// Basic utility functions - keep it simple
function generateApiKey() {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(7);
    return `api_key_${timestamp}_${randomPart}`;
}

function generateShortCode() {
    return Math.random().toString(36).substring(2, 8);
}

async function hashPassword(password) {
    const salt = 'affiliate_boss_salt_2024';
    return crypto.createHash('sha256').update(password + salt).digest('hex');
}

// CORS handling
function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
}

function handleCors(req, res) {
    setCorsHeaders(res);
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return true;
    }
    return false;
}

// Authentication - check if user has valid API key
function checkAuth(req, res) {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    
    if (!apiKey) {
        res.status(401).json({ error: 'API key required' });
        return null;
    }
    
    // Demo mode - fixed key for testing all features
    if (apiKey === 'api_key_john_123456789') {
        return {
            id: 1,
            username: 'john_demo',
            email: 'john.demo@affiliateboss.com',
            first_name: 'John',
            last_name: 'Demo',
            phone: '+1-555-0123',
            api_key: apiKey,
            status: 'approved',
            tier: 'premium',
            created_at: '2024-01-15T10:30:00Z',
            last_login: new Date().toISOString()
        };
    }
    
    // In real app, we'd check database here
    res.status(401).json({ error: 'Invalid API key' });
    return null;
}

// Calculate commission based on tier and amount
function calculateCommission(userId, saleAmount, productCommissionRate = 15) {
    // Demo logic - in real app this would be more complex
    let baseRate = productCommissionRate;
    let tierMultiplier = 1.0;
    
    // Premium tier gets bonus
    if (userId === 1) {
        tierMultiplier = 1.2; // 20% bonus for demo user
    }
    
    const finalRate = baseRate * tierMultiplier;
    const commissionAmount = saleAmount * (finalRate / 100);
    
    return {
        rate: finalRate,
        amount: commissionAmount,
        base_rate: baseRate,
        tier_multiplier: tierMultiplier
    };
}

// Format currency for display
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format dates nicely
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Generate realistic demo data - comprehensive fake data for testing
function getDemoData() {
    
    // 12 realistic products with detailed info
    const products = [
        {
            id: 1,
            name: "MacBook Pro M3 Max 16-inch",
            price: 3999.00,
            price_formatted: "$3,999.00",
            image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop",
            description: "Apple's most powerful laptop featuring the revolutionary M3 Max chip, 16-inch Liquid Retina XDR display, up to 128GB unified memory, and advanced thermal architecture for sustained pro performance.",
            category: "Electronics",
            vendor: "Apple",
            shopify_product_id: "gid://shopify/Product/8234567890123",
            sku: "MBP-M3MAX-16-1TB",
            commission_rate: 8.5,
            stock_quantity: 25,
            weight: "2.15 kg",
            dimensions: "35.57 x 24.81 x 1.68 cm",
            tags: ["laptop", "apple", "professional", "m3-max"],
            created_at: "2024-01-15T10:30:00Z",
            updated_at: "2024-01-29T14:22:00Z"
        },
        {
            id: 2,
            name: "Tesla Model S Plaid",
            price: 89990.00,
            price_formatted: "$89,990.00",
            image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&h=400&fit=crop",
            description: "Electric luxury sedan with tri-motor all-wheel drive, 1,020 horsepower, 0-60 mph in 1.99 seconds, 396 miles range, and revolutionary yoke steering.",
            category: "Automotive",
            vendor: "Tesla",
            shopify_product_id: "gid://shopify/Product/8234567890124",
            sku: "TESLA-MS-PLAID-2024",
            commission_rate: 12.0,
            stock_quantity: 5,
            weight: "2,265 kg",
            dimensions: "196 x 196 x 144 inches",
            tags: ["electric-vehicle", "luxury", "performance", "tesla"],
            created_at: "2024-01-16T14:22:00Z",
            updated_at: "2024-01-29T16:45:00Z"
        },
        {
            id: 3,
            name: "iPhone 15 Pro Max",
            price: 1199.00,
            price_formatted: "$1,199.00",
            image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop",
            description: "The ultimate iPhone with titanium design, A17 Pro chip, advanced camera system with 5x telephoto zoom, Action Button, and USB-C connectivity.",
            category: "Electronics",
            vendor: "Apple",
            shopify_product_id: "gid://shopify/Product/8234567890125",
            sku: "IPHONE-15-PRO-MAX-1TB",
            commission_rate: 6.5,
            stock_quantity: 150,
            weight: "221 grams",
            dimensions: "159.9 x 76.7 x 8.25 mm",
            tags: ["smartphone", "apple", "pro", "titanium"],
            created_at: "2024-01-17T09:15:00Z",
            updated_at: "2024-01-29T11:30:00Z"
        },
        {
            id: 4,
            name: "Sony WH-1000XM5 Wireless Headphones",
            price: 399.99,
            price_formatted: "$399.99",
            image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop",
            description: "Industry-leading noise canceling with Auto NC Optimizer, crystal clear hands-free calling, 30-hour battery life, and intuitive touch controls.",
            category: "Audio",
            vendor: "Sony",
            shopify_product_id: "gid://shopify/Product/8234567890126",
            sku: "SONY-WH1000XM5-BLACK",
            commission_rate: 15.0,
            stock_quantity: 75,
            weight: "250 grams",
            dimensions: "27.0 x 19.5 x 8.0 cm",
            tags: ["headphones", "wireless", "noise-canceling", "sony"],
            created_at: "2024-01-18T16:45:00Z",
            updated_at: "2024-01-29T13:15:00Z"
        },
        {
            id: 5,
            name: "Canon EOS R5 Mirrorless Camera",
            price: 3899.00,
            price_formatted: "$3,899.00",
            image: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=400&fit=crop",
            description: "Professional mirrorless camera with 45MP full-frame sensor, 8K video recording, advanced autofocus system, and image stabilization.",
            category: "Photography",
            vendor: "Canon",
            shopify_product_id: "gid://shopify/Product/8234567890127",
            sku: "CANON-EOS-R5-BODY",
            commission_rate: 10.5,
            stock_quantity: 12,
            weight: "650 grams",
            dimensions: "138.5 x 97.5 x 88.0 mm",
            tags: ["camera", "mirrorless", "professional", "canon"],
            created_at: "2024-01-19T11:20:00Z",
            updated_at: "2024-01-29T15:40:00Z"
        },
        {
            id: 6,
            name: "Dyson V15 Detect Absolute Vacuum",
            price: 749.99,
            price_formatted: "$749.99",
            image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
            description: "Cordless vacuum with laser dust detection technology, advanced whole-machine filtration, and up to 60 minutes of powerful suction.",
            category: "Home & Garden",
            vendor: "Dyson",
            shopify_product_id: "gid://shopify/Product/8234567890128",
            sku: "DYSON-V15-DETECT-ABS",
            commission_rate: 18.0,
            stock_quantity: 40,
            weight: "2.2 kg",
            dimensions: "125.7 x 25.0 x 26.1 cm",
            tags: ["vacuum", "cordless", "laser-detection", "dyson"],
            created_at: "2024-01-20T08:30:00Z",
            updated_at: "2024-01-29T12:10:00Z"
        },
        {
            id: 7,
            name: "Nintendo Switch OLED Model",
            price: 349.99,
            price_formatted: "$349.99",
            image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=400&fit=crop",
            description: "Gaming console with vibrant 7-inch OLED screen, enhanced audio, wide adjustable stand, and dock with wired LAN port.",
            category: "Gaming",
            vendor: "Nintendo",
            shopify_product_id: "gid://shopify/Product/8234567890129",
            sku: "NINTENDO-SWITCH-OLED-WHITE",
            commission_rate: 12.5,
            stock_quantity: 85,
            weight: "320 grams",
            dimensions: "24.2 x 10.2 x 1.4 cm",
            tags: ["gaming", "console", "oled", "nintendo"],
            created_at: "2024-01-21T13:10:00Z",
            updated_at: "2024-01-29T17:20:00Z"
        },
        {
            id: 8,
            name: "Rolex Submariner Date",
            price: 9150.00,
            price_formatted: "$9,150.00",
            image: "https://images.unsplash.com/photo-1587836374868-b8b3c6b2e4b5?w=400&h=400&fit=crop",
            description: "Iconic luxury diving watch with waterproof Oyster case, self-winding movement, Cerachrom bezel, and Oystersteel construction.",
            category: "Luxury Watches",
            vendor: "Rolex",
            shopify_product_id: "gid://shopify/Product/8234567890130",
            sku: "ROLEX-SUB-DATE-126610LN",
            commission_rate: 5.0,
            stock_quantity: 3,
            weight: "157 grams",
            dimensions: "41 mm case diameter",
            tags: ["luxury", "watch", "diving", "rolex"],
            created_at: "2024-01-22T15:45:00Z",
            updated_at: "2024-01-29T10:55:00Z"
        },
        {
            id: 9,
            name: "KitchenAid Artisan Stand Mixer",
            price: 429.99,
            price_formatted: "$429.99",
            image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop",
            description: "Professional-grade stand mixer with 10-speed control, 5-quart stainless steel bowl, and multiple attachment options for versatile cooking.",
            category: "Kitchen Appliances",
            vendor: "KitchenAid",
            shopify_product_id: "gid://shopify/Product/8234567890131",
            sku: "KITCHENAID-ARTISAN-RED",
            commission_rate: 20.0,
            stock_quantity: 60,
            weight: "11.1 kg",
            dimensions: "35.3 x 22.1 x 35.1 cm",
            tags: ["kitchen", "mixer", "baking", "kitchenaid"],
            created_at: "2024-01-23T10:15:00Z",
            updated_at: "2024-01-29T14:30:00Z"
        },
        {
            id: 10,
            name: "Peloton Bike+ Premium",
            price: 2495.00,
            price_formatted: "$2,495.00",
            image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
            description: "Premium exercise bike with rotating 23.8\" HD touchscreen, immersive sound system, and access to live and on-demand fitness classes.",
            category: "Fitness Equipment",
            vendor: "Peloton",
            shopify_product_id: "gid://shopify/Product/8234567890132",
            sku: "PELOTON-BIKE-PLUS-2024",
            commission_rate: 14.0,
            stock_quantity: 18,
            weight: "63.5 kg",
            dimensions: "59 x 23 x 53 inches",
            tags: ["fitness", "bike", "streaming", "peloton"],
            created_at: "2024-01-24T12:30:00Z",
            updated_at: "2024-01-29T16:15:00Z"
        },
        {
            id: 11,
            name: "Samsung 85\" Neo QLED 8K TV",
            price: 2799.99,
            price_formatted: "$2,799.99",
            image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop",
            description: "85-inch 8K Neo QLED Smart TV with Quantum Matrix Technology Pro, Neural Quantum Processor 8K, and Dolby Atmos sound.",
            category: "Home Entertainment",
            vendor: "Samsung",
            shopify_product_id: "gid://shopify/Product/8234567890133",
            sku: "SAMSUNG-QN85QN900C",
            commission_rate: 11.0,
            stock_quantity: 22,
            weight: "46.7 kg",
            dimensions: "188.2 x 107.7 x 2.68 cm",
            tags: ["tv", "8k", "qled", "samsung"],
            created_at: "2024-01-25T14:20:00Z",
            updated_at: "2024-01-29T18:45:00Z"
        },
        {
            id: 12,
            name: "Hermès Birkin 35 Handbag",
            price: 12000.00,
            price_formatted: "$12,000.00",
            image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop",
            description: "Iconic luxury handbag crafted from premium Togo leather with palladium-plated hardware, featuring exquisite hand-stitching and timeless design.",
            category: "Luxury Fashion",
            vendor: "Hermès",
            shopify_product_id: "gid://shopify/Product/8234567890134",
            sku: "HERMES-BIRKIN-35-TOGO",
            commission_rate: 8.0,
            stock_quantity: 2,
            weight: "1.2 kg",
            dimensions: "35 x 28 x 18 cm",
            tags: ["luxury", "handbag", "leather", "hermes"],
            created_at: "2024-01-26T16:50:00Z",
            updated_at: "2024-01-29T19:20:00Z"
        }
    ];

    // Mock Shopify stores with detailed configuration
    const shopifyStores = [
        {
            id: 1,
            name: "TechHub Premium Electronics",
            shopify_domain: "techhub-premium.myshopify.com",
            status: "connected",
            sync_status: "completed",
            products_count: 8,
            last_sync: "2024-01-29T10:15:00Z",
            created_at: "2024-01-15T10:30:00Z",
            access_token: "shpat_demo_token_123456789",
            webhook_endpoint: "https://app.affiliateboss.com/webhooks/shopify/techhub",
            commission_default: 12.0,
            auto_sync_enabled: true,
            sync_frequency: "hourly",
            product_categories: ["Electronics", "Audio", "Photography"],
            currency: "USD",
            timezone: "America/New_York"
        },
        {
            id: 2,
            name: "Luxury Lifestyle Store",
            shopify_domain: "luxury-lifestyle.myshopify.com", 
            status: "connected",
            sync_status: "completed",
            products_count: 4,
            last_sync: "2024-01-29T09:45:00Z",
            created_at: "2024-01-20T14:20:00Z",
            access_token: "shpat_demo_token_987654321",
            webhook_endpoint: "https://app.affiliateboss.com/webhooks/shopify/luxury",
            commission_default: 15.0,
            auto_sync_enabled: true,
            sync_frequency: "daily",
            product_categories: ["Luxury Fashion", "Luxury Watches", "Home & Garden"],
            currency: "USD",
            timezone: "America/Los_Angeles"
        }
    ];

    // Comprehensive commission history
    const commissionHistory = [
        {
            id: 1,
            product_id: 1,
            product_name: "MacBook Pro M3 Max 16-inch",
            commission_amount: 339.92,
            sale_amount: 3999.00,
            commission_rate: 8.5,
            tier_bonus: 1.2,
            date: "2024-01-28T14:30:00Z",
            status: "paid",
            payout_date: "2024-01-30T00:00:00Z",
            payout_method: "stripe",
            transaction_id: "pi_demo_1234567890",
            customer_country: "United States",
            link_id: 1
        },
        {
            id: 2,
            product_id: 3,
            product_name: "iPhone 15 Pro Max",
            commission_amount: 77.94,
            sale_amount: 1199.00,
            commission_rate: 6.5,
            tier_bonus: 1.2,
            date: "2024-01-27T11:20:00Z",
            status: "pending",
            payout_date: null,
            payout_method: null,
            transaction_id: "ord_demo_2345678901",
            customer_country: "Canada",
            link_id: 3
        },
        {
            id: 3,
            product_id: 4,
            product_name: "Sony WH-1000XM5 Headphones",
            commission_amount: 60.00,
            sale_amount: 399.99,
            commission_rate: 15.0,
            tier_bonus: 1.0,
            date: "2024-01-26T16:45:00Z",
            status: "paid",
            payout_date: "2024-01-29T00:00:00Z",
            payout_method: "paypal",
            transaction_id: "pp_demo_3456789012",
            customer_country: "United Kingdom",
            link_id: 4
        },
        {
            id: 4,
            product_id: 9,
            product_name: "KitchenAid Stand Mixer",
            commission_amount: 86.00,
            sale_amount: 429.99,
            commission_rate: 20.0,
            tier_bonus: 1.0,
            date: "2024-01-25T09:15:00Z",
            status: "paid",
            payout_date: "2024-01-28T00:00:00Z",
            payout_method: "stripe",
            transaction_id: "pi_demo_4567890123",
            customer_country: "Australia",
            link_id: 9
        },
        {
            id: 5,
            product_id: 6,
            product_name: "Dyson V15 Detect Vacuum",
            commission_amount: 135.00,
            sale_amount: 749.99,
            commission_rate: 18.0,
            tier_bonus: 1.0,
            date: "2024-01-24T13:30:00Z",
            status: "pending",
            payout_date: null,
            payout_method: null,
            transaction_id: "ord_demo_5678901234",
            customer_country: "Germany",
            link_id: 6
        }
    ];

    // Advanced dashboard KPIs
    const dashboardKPIs = {
        total_links: 24,
        active_links: 22,
        inactive_links: 2,
        total_clicks: 15847,
        unique_clicks: 12456,
        conversions: 387,
        conversion_rate: 2.44,
        click_through_rate: 3.2,
        average_order_value: 1847.23,
        total_commission: 2847.92,
        pending_commission: 892.45,
        paid_commission: 1955.47,
        lifetime_earnings: 15647.83,
        monthly_earnings: 2847.92,
        weekly_earnings: 734.21,
        daily_earnings: 127.45,
        top_performing_link: {
            id: 1,
            name: "MacBook Pro M3 Max",
            clicks: 2847,
            conversions: 45,
            commission: 1529.40,
            conversion_rate: 1.58
        },
        recent_activity: [
            {
                type: "sale",
                description: "MacBook Pro sale - $339.92 commission",
                timestamp: "2024-01-29T14:30:00Z"
            },
            {
                type: "click",
                description: "iPhone 15 Pro link clicked",
                timestamp: "2024-01-29T13:45:00Z"
            },
            {
                type: "payout",
                description: "Weekly payout processed - $734.21",
                timestamp: "2024-01-29T10:00:00Z"
            }
        ],
        geographical_stats: {
            "United States": { clicks: 8234, conversions: 198, revenue: 1547.83 },
            "Canada": { clicks: 2456, conversions: 67, revenue: 634.21 },
            "United Kingdom": { clicks: 1987, conversions: 43, revenue: 421.67 },
            "Australia": { clicks: 1654, conversions: 38, revenue: 287.45 },
            "Germany": { clicks: 1516, conversions: 41, revenue: 356.76 }
        }
    };

    // Commission profiles and tiers
    const commissionProfiles = [
        {
            id: 1,
            name: "Standard Affiliate",
            description: "Basic commission structure for new affiliates",
            default_rate: 15.0,
            tier_structure: [
                { min_sales: 0, rate: 15.0, name: "Bronze" },
                { min_sales: 1000, rate: 17.5, name: "Silver" },
                { min_sales: 5000, rate: 20.0, name: "Gold" },
                { min_sales: 15000, rate: 25.0, name: "Platinum" }
            ],
            bonus_structure: {
                monthly_target_bonus: 0.05,
                quarterly_target_bonus: 0.10,
                yearly_target_bonus: 0.15
            },
            status: "active"
        },
        {
            id: 2,
            name: "Premium Electronics",
            description: "Specialized rates for electronics products",
            default_rate: 12.0,
            tier_structure: [
                { min_sales: 0, rate: 12.0, name: "Bronze" },
                { min_sales: 2000, rate: 14.0, name: "Silver" },
                { min_sales: 8000, rate: 16.0, name: "Gold" },
                { min_sales: 20000, rate: 20.0, name: "Platinum" }
            ],
            bonus_structure: {
                volume_bonus: 0.02,
                exclusive_product_bonus: 0.05
            },
            status: "active"
        }
    ];

    return {
        products,
        shopifyStores,
        commissionHistory,
        dashboardKPIs,
        commissionProfiles
    };
}

module.exports = {
    generateApiKey,
    generateShortCode,
    hashPassword,
    handleCors,
    checkAuth,
    calculateCommission,
    formatCurrency,
    formatDate,
    getDemoData
};