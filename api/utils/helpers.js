const crypto = require('crypto');

// Simple helper functions that any dev would write
const generateApiKey = () => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    return `api_key_${timestamp}_${randomStr}`;
};

const generateShortCode = () => {
    return Math.random().toString(36).substring(2, 8);
};

const hashPassword = async (password) => {
    const salt = 'affiliate_boss_salt';
    return crypto.createHash('sha256').update(password + salt).digest('hex');
};

// CORS setup - every project needs this
const setCorsHeaders = (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
};

const handleCors = (req, res) => {
    setCorsHeaders(res);
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return true;
    }
    return false;
};

// Auth middleware - check if user has valid API key
const checkAuth = (req, res) => {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    
    if (!apiKey) {
        res.status(401).json({ error: 'API key required' });
        return null;
    }
    
    // Demo mode - we use a fixed key for testing
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
            created_at: '2024-01-15T10:30:00Z',
            last_login: new Date().toISOString()
        };
    }
    
    // In real app, we'd check database here
    res.status(401).json({ error: 'Invalid API key' });
    return null;
};

// Demo data - keeping it simple and realistic
const getDemoData = () => {
    const products = [
        {
            id: 1,
            name: "MacBook Pro M3 Max 16-inch",
            price: "$3,999.00",
            image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop",
            description: "Apple's most powerful laptop with M3 Max chip, perfect for professionals.",
            category: "Electronics",
            vendor: "Apple",
            commission: 8.5,
            stock: 25
        },
        {
            id: 2,
            name: "Tesla Model S Plaid",
            price: "$89,990.00",
            image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&h=400&fit=crop",
            description: "Electric luxury sedan with insane acceleration and 400+ mile range.",
            category: "Automotive",
            vendor: "Tesla",
            commission: 12.0,
            stock: 5
        },
        {
            id: 3,
            name: "iPhone 15 Pro Max",
            price: "$1,199.00",
            image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop",
            description: "Latest iPhone with titanium design and pro camera system.",
            category: "Electronics",
            vendor: "Apple",
            commission: 6.5,
            stock: 150
        },
        {
            id: 4,
            name: "Sony WH-1000XM5 Headphones",
            price: "$399.99",
            image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop",
            description: "Best noise canceling headphones with 30-hour battery life.",
            category: "Audio",
            vendor: "Sony",
            commission: 15.0,
            stock: 75
        },
        {
            id: 5,
            name: "Canon EOS R5 Camera",
            price: "$3,899.00",
            image: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=400&fit=crop",
            description: "Professional mirrorless camera with 8K video recording.",
            category: "Photography",
            vendor: "Canon",
            commission: 10.5,
            stock: 12
        }
    ];

    const stores = [
        {
            id: 1,
            name: "TechHub Premium",
            domain: "techhub-premium.myshopify.com",
            status: "connected",
            products_count: 8,
            last_sync: "2024-01-29T10:15:00Z"
        },
        {
            id: 2,
            name: "Luxury Lifestyle Store",
            domain: "luxury-lifestyle.myshopify.com",
            status: "connected",
            products_count: 4,
            last_sync: "2024-01-29T09:45:00Z"
        }
    ];

    const dashboardStats = {
        total_links: 24,
        total_clicks: 15847,
        conversions: 387,
        conversion_rate: 2.44,
        total_commission: 2847.92,
        pending_commission: 892.45,
        paid_commission: 1955.47,
        active_links: 24
    };

    const commissionHistory = [
        {
            id: 1,
            product_name: "MacBook Pro M3 Max 16-inch",
            commission_amount: 339.92,
            sale_amount: 3999.00,
            commission_rate: 8.5,
            date: "2024-01-28T14:30:00Z",
            status: "paid"
        },
        {
            id: 2,
            product_name: "iPhone 15 Pro Max",
            commission_amount: 77.94,
            sale_amount: 1199.00,
            commission_rate: 6.5,
            date: "2024-01-27T11:20:00Z",
            status: "pending"
        }
    ];

    return { products, stores, dashboardStats, commissionHistory };
};

module.exports = {
    generateApiKey,
    generateShortCode,
    hashPassword,
    handleCors,
    checkAuth,
    getDemoData
};