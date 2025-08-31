const { handleCors, checkAuth, getDemoData, formatCurrency, formatDate } = require('./utils/helpers');

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    
    const user = checkAuth(req, res);
    if (!user) return;

    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    const path = pathname.replace('/api/shopify', '');

    switch (req.method) {
        case 'GET':
            if (path === '/stores') return getConnectedStores(req, res, user);
            if (path === '/products') return getShopifyProducts(req, res, user);
            if (path === '/orders') return getRecentOrders(req, res, user);
            if (path === '/sync-status') return getSyncStatus(req, res, user);
            if (path.match(/^\/stores\/\d+$/)) return getStoreDetails(req, res, user, parseInt(path.split('/')[2]));
            if (path.match(/^\/stores\/\d+\/products$/)) return getStoreProducts(req, res, user, parseInt(path.split('/')[2]));
            break;
            
        case 'POST':
            if (path === '/connect') return connectStore(req, res, user);
            if (path === '/sync') return syncStoreData(req, res, user);
            if (path === '/webhook') return handleWebhook(req, res, user);
            if (path.match(/^\/stores\/\d+\/sync$/)) return syncSpecificStore(req, res, user, parseInt(path.split('/')[2]));
            break;
            
        case 'PUT':
            if (path.match(/^\/stores\/\d+$/)) return updateStoreSettings(req, res, user, parseInt(path.split('/')[2]));
            break;
            
        case 'DELETE':
            if (path.match(/^\/stores\/\d+$/)) return disconnectStore(req, res, user, parseInt(path.split('/')[2]));
            break;
    }
    
    return res.status(404).json({ error: 'Shopify API endpoint not found' });
};

// Get all connected Shopify stores
function getConnectedStores(req, res, user) {
    const demoData = getDemoData();
    
    // Enhanced store data with full details
    const stores = [
        {
            id: 1,
            name: "TechHub Premium Electronics",
            shopify_domain: "techhub-premium.myshopify.com",
            store_url: "https://techhub-premium.myshopify.com",
            status: "connected",
            connection_status: "healthy",
            last_ping: "2024-01-29T10:15:00Z",
            sync_status: "completed",
            products_count: 8,
            orders_count: 156,
            total_revenue: 234567.89,
            commission_earned: 18765.43,
            last_sync: "2024-01-29T10:15:00Z",
            next_sync: "2024-01-29T11:15:00Z",
            created_at: "2024-01-15T10:30:00Z",
            updated_at: "2024-01-29T10:15:00Z",
            
            // Store configuration
            access_token: "shpat_demo_token_123456789",
            webhook_endpoint: "https://app.affiliateboss.com/webhooks/shopify/techhub",
            webhook_status: "active",
            commission_default: 12.0,
            auto_sync_enabled: true,
            sync_frequency: "hourly",
            
            // Store details
            owner_email: "admin@techhub-premium.com",
            phone: "+1-555-0199",
            address: "123 Tech Street, San Francisco, CA 94102",
            country_code: "US",
            currency: "USD",
            timezone: "America/New_York",
            plan_name: "Shopify Plus",
            
            // Product categories this store handles
            product_categories: ["Electronics", "Audio", "Photography", "Gaming"],
            
            // Sync settings
            sync_settings: {
                sync_products: true,
                sync_orders: true,
                sync_customers: false,
                sync_inventory: true,
                auto_create_links: true,
                default_link_category: "Electronics"
            },
            
            // Performance metrics
            performance: {
                total_clicks: 15234,
                total_conversions: 892,
                conversion_rate: 5.85,
                avg_order_value: 1504.53,
                top_product: "MacBook Pro M3 Max 16-inch",
                best_month: "January 2024"
            }
        },
        {
            id: 2,
            name: "Luxury Lifestyle Store",
            shopify_domain: "luxury-lifestyle.myshopify.com",
            store_url: "https://luxury-lifestyle.myshopify.com",
            status: "connected",
            connection_status: "healthy",
            last_ping: "2024-01-29T09:45:00Z",
            sync_status: "completed",
            products_count: 4,
            orders_count: 67,
            total_revenue: 456789.12,
            commission_earned: 34259.18,
            last_sync: "2024-01-29T09:45:00Z",
            next_sync: "2024-01-30T09:45:00Z",
            created_at: "2024-01-20T14:20:00Z",
            updated_at: "2024-01-29T09:45:00Z",
            
            access_token: "shpat_demo_token_987654321",
            webhook_endpoint: "https://app.affiliateboss.com/webhooks/shopify/luxury",
            webhook_status: "active",
            commission_default: 15.0,
            auto_sync_enabled: true,
            sync_frequency: "daily",
            
            owner_email: "owner@luxury-lifestyle.com",
            phone: "+1-555-0188",
            address: "456 Luxury Ave, Beverly Hills, CA 90210",
            country_code: "US",
            currency: "USD",
            timezone: "America/Los_Angeles",
            plan_name: "Shopify Advanced",
            
            product_categories: ["Luxury Fashion", "Luxury Watches", "Home & Garden", "Fitness Equipment"],
            
            sync_settings: {
                sync_products: true,
                sync_orders: true,
                sync_customers: false,
                sync_inventory: true,
                auto_create_links: true,
                default_link_category: "Luxury"
            },
            
            performance: {
                total_clicks: 7845,
                total_conversions: 234,
                conversion_rate: 2.98,
                avg_order_value: 6819.35,
                top_product: "Hermès Birkin 35 Handbag",
                best_month: "January 2024"
            }
        },
        {
            id: 3,
            name: "Home & Kitchen Essentials",
            shopify_domain: "home-kitchen-essentials.myshopify.com",
            store_url: "https://home-kitchen-essentials.myshopify.com",
            status: "connecting",
            connection_status: "pending",
            last_ping: null,
            sync_status: "pending",
            products_count: 0,
            orders_count: 0,
            total_revenue: 0,
            commission_earned: 0,
            last_sync: null,
            next_sync: null,
            created_at: "2024-01-29T08:30:00Z",
            updated_at: "2024-01-29T08:30:00Z",
            
            access_token: null,
            webhook_endpoint: null,
            webhook_status: "pending",
            commission_default: 18.0,
            auto_sync_enabled: true,
            sync_frequency: "daily",
            
            owner_email: "store@home-kitchen-essentials.com",
            phone: null,
            address: null,
            country_code: null,
            currency: "USD",
            timezone: "America/New_York",
            plan_name: null,
            
            product_categories: ["Kitchen Appliances", "Home & Garden"],
            
            sync_settings: {
                sync_products: true,
                sync_orders: true,
                sync_customers: false,
                sync_inventory: true,
                auto_create_links: true,
                default_link_category: "Home"
            },
            
            performance: {
                total_clicks: 0,
                total_conversions: 0,
                conversion_rate: 0,
                avg_order_value: 0,
                top_product: null,
                best_month: null
            }
        }
    ];

    // Add formatted fields
    const storesWithFormatted = stores.map(store => ({
        ...store,
        total_revenue_formatted: formatCurrency(store.total_revenue),
        commission_earned_formatted: formatCurrency(store.commission_earned),
        created_at_formatted: formatDate(store.created_at),
        last_sync_formatted: store.last_sync ? formatDate(store.last_sync) : 'Never',
        next_sync_formatted: store.next_sync ? formatDate(store.next_sync) : 'Not scheduled'
    }));

    // Calculate summary stats
    const summary = {
        total_stores: stores.length,
        connected_stores: stores.filter(s => s.status === 'connected').length,
        total_products: stores.reduce((sum, s) => sum + s.products_count, 0),
        total_revenue: stores.reduce((sum, s) => sum + s.total_revenue, 0),
        total_commission: stores.reduce((sum, s) => sum + s.commission_earned, 0)
    };

    return res.json({
        success: true,
        data: storesWithFormatted,
        summary: {
            ...summary,
            total_revenue_formatted: formatCurrency(summary.total_revenue),
            total_commission_formatted: formatCurrency(summary.total_commission)
        }
    });
}

// Get products from all Shopify stores
function getShopifyProducts(req, res, user) {
    const demoData = getDemoData();
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Parse filters
    const storeId = parseInt(url.searchParams.get('store_id')) || null;
    const category = url.searchParams.get('category') || '';
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const sortBy = url.searchParams.get('sort_by') || 'created_at';
    const sortOrder = url.searchParams.get('sort_order') || 'desc';
    
    // Enhanced product data with Shopify integration details
    let products = demoData.products.map(product => ({
        ...product,
        
        // Shopify-specific fields
        shopify_store_id: product.id <= 8 ? 1 : 2, // First 8 products from store 1, rest from store 2
        shopify_store_name: product.id <= 8 ? "TechHub Premium Electronics" : "Luxury Lifestyle Store",
        shopify_product_handle: product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        shopify_variant_id: `gid://shopify/ProductVariant/82345678901${20 + product.id}`,
        
        // Sync information
        sync_status: "synced",
        last_synced: "2024-01-29T10:15:00Z",
        sync_errors: [],
        
        // Affiliate link auto-generation
        auto_link_created: true,
        affiliate_link: `${req.headers.host || 'localhost:3000'}/go/sp${product.id.toString().padStart(3, '0')}`,
        
        // Performance metrics
        affiliate_performance: {
            total_clicks: Math.floor(Math.random() * 1000) + 100,
            total_conversions: Math.floor(Math.random() * 50) + 5,
            total_earnings: Math.random() * 1000 + 200,
            conversion_rate: Math.random() * 5 + 1
        },
        
        // Inventory tracking
        inventory_tracking: {
            track_quantity: true,
            continue_selling_when_out_of_stock: false,
            inventory_policy: "deny"
        },
        
        // SEO and marketing
        seo: {
            title: product.name,
            description: product.description,
            handle: product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        }
    }));

    // Apply filters
    if (storeId) {
        products = products.filter(p => p.shopify_store_id === storeId);
    }
    
    if (category) {
        products = products.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
    }
    
    if (search) {
        products = products.filter(p => 
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description.toLowerCase().includes(search.toLowerCase()) ||
            p.vendor.toLowerCase().includes(search.toLowerCase())
        );
    }

    // Sort products
    products.sort((a, b) => {
        let aVal, bVal;
        switch (sortBy) {
            case 'name':
                aVal = a.name;
                bVal = b.name;
                break;
            case 'price':
                aVal = a.price;
                bVal = b.price;
                break;
            case 'commission_rate':
                aVal = a.commission_rate;
                bVal = b.commission_rate;
                break;
            case 'stock_quantity':
                aVal = a.stock_quantity;
                bVal = b.stock_quantity;
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
    const totalCount = products.length;
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;
    const paginatedProducts = products.slice(offset, offset + limit);

    // Add formatted fields
    const productsWithFormatted = paginatedProducts.map(product => ({
        ...product,
        price_formatted: formatCurrency(product.price),
        last_synced_formatted: formatDate(product.last_synced),
        affiliate_performance: {
            ...product.affiliate_performance,
            total_earnings_formatted: formatCurrency(product.affiliate_performance.total_earnings),
            conversion_rate_formatted: `${product.affiliate_performance.conversion_rate.toFixed(2)}%`
        }
    }));

    return res.json({
        success: true,
        data: productsWithFormatted,
        pagination: {
            page,
            limit,
            total_count: totalCount,
            total_pages: totalPages,
            has_next: page < totalPages,
            has_prev: page > 1
        },
        filters_applied: {
            store_id: storeId,
            category,
            search,
            sort_by: sortBy,
            sort_order: sortOrder
        }
    });
}

// Get recent orders from Shopify stores
function getRecentOrders(req, res, user) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const storeId = parseInt(url.searchParams.get('store_id')) || null;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const status = url.searchParams.get('status') || 'all';
    
    // Demo order data - comprehensive order tracking
    const allOrders = [
        {
            id: 1001,
            shopify_order_id: "gid://shopify/Order/5234567890123",
            order_number: "#SO1001",
            shopify_store_id: 1,
            shopify_store_name: "TechHub Premium Electronics",
            customer_email: "john.doe@email.com",
            customer_name: "John Doe",
            
            // Order details
            total_price: 3999.00,
            subtotal_price: 3999.00,
            tax_amount: 359.91,
            shipping_amount: 0.00,
            currency: "USD",
            
            // Affiliate tracking
            affiliate_commission: 339.92,
            commission_rate: 8.5,
            affiliate_link_id: 1,
            affiliate_link_code: "mbp001",
            
            // Order status
            financial_status: "paid",
            fulfillment_status: "fulfilled",
            order_status: "completed",
            
            // Timestamps
            created_at: "2024-01-28T14:30:00Z",
            updated_at: "2024-01-29T10:15:00Z",
            processed_at: "2024-01-28T14:35:00Z",
            
            // Customer info
            customer: {
                id: "gid://shopify/Customer/1234567890",
                first_name: "John",
                last_name: "Doe",
                email: "john.doe@email.com",
                phone: "+1-555-0123",
                country: "United States",
                city: "San Francisco",
                zip: "94102"
            },
            
            // Products in order
            line_items: [
                {
                    id: 1,
                    product_id: 1,
                    variant_id: "gid://shopify/ProductVariant/82345678901221",
                    name: "MacBook Pro M3 Max 16-inch",
                    quantity: 1,
                    price: 3999.00,
                    total_discount: 0.00,
                    vendor: "Apple"
                }
            ]
        },
        {
            id: 1002,
            shopify_order_id: "gid://shopify/Order/5234567890124",
            order_number: "#SO1002",
            shopify_store_id: 2,
            shopify_store_name: "Luxury Lifestyle Store",
            customer_email: "sarah.wilson@email.com",
            customer_name: "Sarah Wilson",
            
            total_price: 12000.00,
            subtotal_price: 12000.00,
            tax_amount: 1080.00,
            shipping_amount: 50.00,
            currency: "USD",
            
            affiliate_commission: 960.00,
            commission_rate: 8.0,
            affiliate_link_id: 4,
            affiliate_link_code: "rlx001",
            
            financial_status: "paid",
            fulfillment_status: "shipped",
            order_status: "processing",
            
            created_at: "2024-01-29T09:15:00Z",
            updated_at: "2024-01-29T11:30:00Z",
            processed_at: "2024-01-29T09:20:00Z",
            
            customer: {
                id: "gid://shopify/Customer/1234567891",
                first_name: "Sarah",
                last_name: "Wilson",
                email: "sarah.wilson@email.com",
                phone: "+1-555-0124",
                country: "United States",
                city: "Beverly Hills",
                zip: "90210"
            },
            
            line_items: [
                {
                    id: 1,
                    product_id: 8,
                    variant_id: "gid://shopify/ProductVariant/82345678901230",
                    name: "Hermès Birkin 35 Handbag",
                    quantity: 1,
                    price: 12000.00,
                    total_discount: 0.00,
                    vendor: "Hermès"
                }
            ]
        },
        {
            id: 1003,
            shopify_order_id: "gid://shopify/Order/5234567890125",
            order_number: "#SO1003",
            shopify_store_id: 1,
            shopify_store_name: "TechHub Premium Electronics",
            customer_email: "mike.chen@email.com",
            customer_name: "Mike Chen",
            
            total_price: 1199.00,
            subtotal_price: 1199.00,
            tax_amount: 107.91,
            shipping_amount: 0.00,
            currency: "USD",
            
            affiliate_commission: 71.94,
            commission_rate: 6.0,
            affiliate_link_id: 3,
            affiliate_link_code: "ip15pm",
            
            financial_status: "paid",
            fulfillment_status: "fulfilled",
            order_status: "completed",
            
            created_at: "2024-01-29T16:45:00Z",
            updated_at: "2024-01-29T17:20:00Z",
            processed_at: "2024-01-29T16:50:00Z",
            
            customer: {
                id: "gid://shopify/Customer/1234567892",
                first_name: "Mike",
                last_name: "Chen",
                email: "mike.chen@email.com",
                phone: "+1-555-0125",
                country: "Canada",
                city: "Toronto",
                zip: "M5V 3A8"
            },
            
            line_items: [
                {
                    id: 1,
                    product_id: 3,
                    variant_id: "gid://shopify/ProductVariant/82345678901225",
                    name: "iPhone 15 Pro 256GB",
                    quantity: 1,
                    price: 1199.00,
                    total_discount: 0.00,
                    vendor: "Apple"
                }
            ]
        },
        {
            id: 1004,
            shopify_order_id: "gid://shopify/Order/5234567890126",
            order_number: "#SO1004",
            shopify_store_id: 1,
            shopify_store_name: "TechHub Premium Electronics",
            customer_email: "lisa.garcia@email.com",
            customer_name: "Lisa Garcia",
            
            total_price: 749.99,
            subtotal_price: 749.99,
            tax_amount: 67.50,
            shipping_amount: 15.00,
            currency: "USD",
            
            affiliate_commission: 134.98,
            commission_rate: 18.0,
            affiliate_link_id: 5,
            affiliate_link_code: "dyv15",
            
            financial_status: "pending",
            fulfillment_status: "unfulfilled",
            order_status: "pending",
            
            created_at: "2024-01-29T18:20:00Z",
            updated_at: "2024-01-29T18:20:00Z",
            processed_at: null,
            
            customer: {
                id: "gid://shopify/Customer/1234567893",
                first_name: "Lisa",
                last_name: "Garcia",
                email: "lisa.garcia@email.com",
                phone: "+1-555-0126",
                country: "United States",
                city: "Austin",
                zip: "73301"
            },
            
            line_items: [
                {
                    id: 1,
                    product_id: 6,
                    variant_id: "gid://shopify/ProductVariant/82345678901228",
                    name: "Dyson V15 Detect Absolute Vacuum",
                    quantity: 1,
                    price: 749.99,
                    total_discount: 0.00,
                    vendor: "Dyson"
                }
            ]
        }
    ];

    // Apply filters
    let orders = allOrders;
    
    if (storeId) {
        orders = orders.filter(order => order.shopify_store_id === storeId);
    }
    
    if (status !== 'all') {
        orders = orders.filter(order => order.order_status === status);
    }

    // Limit results
    orders = orders.slice(0, limit);

    // Add formatted fields
    const ordersWithFormatted = orders.map(order => ({
        ...order,
        total_price_formatted: formatCurrency(order.total_price),
        affiliate_commission_formatted: formatCurrency(order.affiliate_commission),
        created_at_formatted: formatDate(order.created_at),
        processed_at_formatted: order.processed_at ? formatDate(order.processed_at) : 'Not processed'
    }));

    // Calculate summary
    const summary = {
        total_orders: orders.length,
        total_revenue: orders.reduce((sum, order) => sum + order.total_price, 0),
        total_commission: orders.reduce((sum, order) => sum + order.affiliate_commission, 0),
        avg_order_value: orders.length > 0 ? orders.reduce((sum, order) => sum + order.total_price, 0) / orders.length : 0
    };

    return res.json({
        success: true,
        data: ordersWithFormatted,
        summary: {
            ...summary,
            total_revenue_formatted: formatCurrency(summary.total_revenue),
            total_commission_formatted: formatCurrency(summary.total_commission),
            avg_order_value_formatted: formatCurrency(summary.avg_order_value)
        }
    });
}

// Get sync status for stores
function getSyncStatus(req, res, user) {
    const syncStatus = {
        overall_status: "healthy",
        last_sync_check: new Date().toISOString(),
        stores: [
            {
                id: 1,
                name: "TechHub Premium Electronics",
                sync_status: "completed",
                last_sync: "2024-01-29T10:15:00Z",
                next_sync: "2024-01-29T11:15:00Z",
                sync_frequency: "hourly",
                errors: [],
                sync_progress: {
                    products: { synced: 8, total: 8, status: "completed" },
                    orders: { synced: 156, total: 156, status: "completed" },
                    inventory: { synced: 8, total: 8, status: "completed" }
                }
            },
            {
                id: 2,
                name: "Luxury Lifestyle Store",
                sync_status: "completed",
                last_sync: "2024-01-29T09:45:00Z",
                next_sync: "2024-01-30T09:45:00Z",
                sync_frequency: "daily",
                errors: [],
                sync_progress: {
                    products: { synced: 4, total: 4, status: "completed" },
                    orders: { synced: 67, total: 67, status: "completed" },
                    inventory: { synced: 4, total: 4, status: "completed" }
                }
            },
            {
                id: 3,
                name: "Home & Kitchen Essentials",
                sync_status: "connecting",
                last_sync: null,
                next_sync: null,
                sync_frequency: "daily",
                errors: ["Store authentication pending"],
                sync_progress: {
                    products: { synced: 0, total: 0, status: "pending" },
                    orders: { synced: 0, total: 0, status: "pending" },
                    inventory: { synced: 0, total: 0, status: "pending" }
                }
            }
        ]
    };

    return res.json({
        success: true,
        data: syncStatus
    });
}

// Connect new Shopify store
function connectStore(req, res, user) {
    const { 
        store_name, 
        shopify_domain, 
        access_token,
        commission_default = 15.0,
        sync_frequency = 'daily',
        auto_sync_enabled = true,
        sync_settings = {}
    } = req.body || {};

    // Validation
    if (!store_name || !shopify_domain) {
        return res.status(400).json({
            error: 'Store name and Shopify domain are required',
            details: 'Please provide both store name and the myshopify.com domain'
        });
    }

    if (!shopify_domain.endsWith('.myshopify.com')) {
        return res.status(400).json({
            error: 'Invalid Shopify domain',
            details: 'Domain must be in format: your-store.myshopify.com'
        });
    }

    // In real app, we'd validate the access token with Shopify API
    if (!access_token) {
        return res.status(400).json({
            error: 'Shopify access token required',
            details: 'Please provide a valid Shopify private app access token'
        });
    }

    // Create new store connection
    const newStore = {
        id: Math.floor(Math.random() * 1000) + 100,
        name: store_name.trim(),
        shopify_domain: shopify_domain.trim(),
        store_url: `https://${shopify_domain.trim()}`,
        status: "connecting",
        connection_status: "pending",
        sync_status: "pending",
        
        // Configuration
        access_token: access_token,
        webhook_endpoint: `https://app.affiliateboss.com/webhooks/shopify/${Math.random().toString(36).substring(7)}`,
        webhook_status: "pending",
        commission_default: commission_default,
        auto_sync_enabled: auto_sync_enabled,
        sync_frequency: sync_frequency,
        
        // Default sync settings
        sync_settings: {
            sync_products: true,
            sync_orders: true,
            sync_customers: false,
            sync_inventory: true,
            auto_create_links: true,
            default_link_category: "General",
            ...sync_settings
        },
        
        // Initialize counters
        products_count: 0,
        orders_count: 0,
        total_revenue: 0,
        commission_earned: 0,
        
        // Timestamps
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_sync: null,
        next_sync: null
    };

    // In real app, we'd:
    // 1. Test connection to Shopify API
    // 2. Create webhooks
    // 3. Start initial sync
    // 4. Save to database

    return res.status(201).json({
        success: true,
        data: newStore,
        message: 'Shopify store connection initiated successfully. Sync will begin shortly.',
        next_steps: [
            'Testing connection to Shopify API',
            'Setting up webhooks for real-time updates',
            'Starting initial product and order sync',
            'Creating affiliate links for products'
        ]
    });
}

// Manual sync trigger
function syncStoreData(req, res, user) {
    const { store_ids = [], force_sync = false } = req.body || {};

    if (!store_ids.length) {
        return res.status(400).json({
            error: 'Store IDs required',
            details: 'Please provide an array of store IDs to sync'
        });
    }

    // Start sync process
    const syncResults = store_ids.map(storeId => ({
        store_id: storeId,
        status: "started",
        started_at: new Date().toISOString(),
        estimated_completion: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        sync_tasks: [
            { task: "products", status: "queued" },
            { task: "orders", status: "queued" },
            { task: "inventory", status: "queued" },
            { task: "webhooks", status: "queued" }
        ]
    }));

    return res.json({
        success: true,
        data: {
            sync_id: `sync_${Date.now()}`,
            stores: syncResults,
            force_sync: force_sync,
            total_stores: store_ids.length
        },
        message: `Sync started for ${store_ids.length} store(s). You can monitor progress in the sync status endpoint.`
    });
}

// Handle Shopify webhooks
function handleWebhook(req, res, user) {
    // In real app, we'd verify webhook signature
    const webhookData = req.body;
    const shopifyTopic = req.headers['x-shopify-topic'] || 'unknown';
    
    // Log webhook for demo
    console.log(`Received Shopify webhook: ${shopifyTopic}`, webhookData);

    // Process different webhook types
    let response = {};
    
    switch (shopifyTopic) {
        case 'orders/create':
            response = {
                processed: true,
                action: 'order_created',
                message: 'New order processed for commission calculation'
            };
            break;
            
        case 'orders/updated':
            response = {
                processed: true,
                action: 'order_updated',
                message: 'Order status updated'
            };
            break;
            
        case 'products/create':
            response = {
                processed: true,
                action: 'product_created',
                message: 'New product added and affiliate link created'
            };
            break;
            
        case 'products/update':
            response = {
                processed: true,
                action: 'product_updated',
                message: 'Product information updated'
            };
            break;
            
        default:
            response = {
                processed: true,
                action: 'webhook_logged',
                message: 'Webhook received and logged'
            };
    }

    return res.json({
        success: true,
        webhook_topic: shopifyTopic,
        timestamp: new Date().toISOString(),
        ...response
    });
}

// Other functions for completeness...
function getStoreDetails(req, res, user, storeId) {
    return res.json({
        success: true,
        message: `Store ${storeId} details endpoint - full implementation in production`
    });
}

function getStoreProducts(req, res, user, storeId) {
    return res.json({
        success: true,
        message: `Store ${storeId} products endpoint - full implementation in production`
    });
}

function syncSpecificStore(req, res, user, storeId) {
    return res.json({
        success: true,
        message: `Sync triggered for store ${storeId}`
    });
}

function updateStoreSettings(req, res, user, storeId) {
    return res.json({
        success: true,
        message: `Store ${storeId} settings updated`
    });
}

function disconnectStore(req, res, user, storeId) {
    return res.json({
        success: true,
        message: `Store ${storeId} disconnected successfully`
    });
}