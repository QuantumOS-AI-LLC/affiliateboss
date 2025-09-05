// Simple Express API server for Affiliate Boss
const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('../lib/database');

// Initialize database
Database.initDatabase();

const app = express();
const PORT = process.env.API_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Database instance
const db = Database.getDatabase();

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Affiliate Boss API is running!',
        timestamp: new Date().toISOString(),
        version: '4.0.0'
    });
});

// Dashboard API
app.get('/api/dashboard', (req, res) => {
    res.json({
        success: true,
        data: {
            stats: {
                total_earnings: 15420.50,
                total_clicks: 25847,
                total_conversions: 342,
                conversion_rate: 1.32,
                pending_commissions: 1247.30,
                approved_commissions: 14173.20
            },
            recent_activity: [
                {
                    type: 'commission',
                    amount: 45.67,
                    product: 'Premium Headphones',
                    date: new Date().toISOString()
                },
                {
                    type: 'click',
                    product: 'Smart Watch',
                    date: new Date().toISOString()
                }
            ]
        }
    });
});

// Analytics API
app.get('/api/analytics', (req, res) => {
    res.json({
        success: true,
        data: {
            revenue_trend: [
                { date: '2024-01-27', revenue: 1200 },
                { date: '2024-01-28', revenue: 1350 },
                { date: '2024-01-29', revenue: 1100 },
                { date: '2024-01-30', revenue: 1600 },
                { date: '2024-01-31', revenue: 1450 }
            ],
            top_products: [
                { name: 'Premium Headphones', sales: 45, revenue: 2250 },
                { name: 'Smart Watch', sales: 32, revenue: 1920 },
                { name: 'Fitness Tracker', sales: 28, revenue: 1400 }
            ]
        }
    });
});

// Links API
app.get('/api/links', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 1,
                name: 'Fashion Collection',
                short_url: 'https://aff.ly/FAS123',
                original_url: 'https://store.com/fashion',
                clicks: 1250,
                conversions: 42,
                earnings: 1680.00,
                created_at: '2024-01-15T10:30:00Z'
            },
            {
                id: 2,
                name: 'Tech Gadgets',
                short_url: 'https://aff.ly/TECH456',
                original_url: 'https://store.com/tech',
                clicks: 890,
                conversions: 28,
                earnings: 1120.00,
                created_at: '2024-01-20T14:45:00Z'
            }
        ]
    });
});

app.post('/api/links', (req, res) => {
    const { name, original_url, description } = req.body;
    
    res.json({
        success: true,
        data: {
            id: Math.floor(Math.random() * 10000),
            name: name || 'New Link',
            short_url: 'https://aff.ly/' + Math.random().toString(36).substring(7).toUpperCase(),
            original_url: original_url || 'https://example.com',
            description: description || '',
            clicks: 0,
            conversions: 0,
            earnings: 0,
            created_at: new Date().toISOString()
        }
    });
});

// Commissions API
app.get('/api/commissions', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 1,
                date: '2024-01-25',
                product: 'Premium Headphones',
                customer: 'John D.',
                sale_amount: 299.99,
                rate: '15%',
                commission: 45.00,
                status: 'approved'
            },
            {
                id: 2,
                date: '2024-01-24',
                product: 'Smart Watch',
                customer: 'Sarah M.',
                sale_amount: 199.99,
                rate: '12%',
                commission: 24.00,
                status: 'pending'
            },
            {
                id: 3,
                date: '2024-01-23',
                product: 'Fitness Tracker',
                customer: 'Mike B.',
                sale_amount: 149.99,
                rate: '10%',
                commission: 15.00,
                status: 'paid'
            }
        ]
    });
});

// Content Generation API
app.post('/api/tools/content', (req, res) => {
    const { content_type, product_name, keywords, tone = 'professional' } = req.body;
    
    let content = '';
    
    switch (content_type) {
        case 'product_description':
            content = `Discover the amazing ${product_name}! This incredible product features cutting-edge technology and premium quality. Perfect for anyone looking to ${keywords}. Don't miss out on this exclusive opportunity!`;
            break;
        case 'email_campaign':
            content = `Subject: Exclusive Deal on ${product_name}!\n\nHi there!\n\nI wanted to share this amazing product with you - ${product_name}. It's perfect for ${keywords} and I think you'll love it!\n\nCheck it out here: [Your Affiliate Link]\n\nBest regards,\n[Your Name]`;
            break;
        case 'social_post':
            content = `🔥 Just discovered ${product_name}! Perfect for ${keywords}. Highly recommended! #affiliate #${keywords.replace(/\\s+/g, '')} [link]`;
            break;
        case 'blog_post':
            content = `# ${product_name} Review: Everything You Need to Know\n\n## Introduction\n${product_name} has been making waves in the market, and for good reason. In this comprehensive review, I'll share my experience with this product.\n\n## Key Features\n- Premium quality\n- Easy to use\n- Great value\n\n## Final Thoughts\nIf you're looking for ${keywords}, ${product_name} is definitely worth considering. [Affiliate Link]`;
            break;
        default:
            content = `Generated content for ${product_name} with focus on ${keywords}`;
    }

    res.json({
        success: true,
        data: {
            content,
            content_type,
            generated_at: new Date().toISOString()
        }
    });
});

// QR Code API
app.get('/api/tools/qr', (req, res) => {
    const { url, size = '200' } = req.query;
    
    if (!url) {
        return res.status(400).json({ success: false, error: 'URL parameter required' });
    }
    
    // Generate QR code URL using QR Server API (free service)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
    
    res.json({
        success: true,
        data: {
            qr_url: qrUrl,
            original_url: url,
            size: size
        }
    });
});

// Referrals API
app.get('/api/referrals', (req, res) => {
    res.json({
        success: true,
        data: {
            stats: {
                total_referrals: 23,
                referral_earnings: 1247.50,
                active_referrals: 18,
                tier_bonuses: 325.00
            },
            referrals: [
                {
                    id: 1,
                    name: 'Alex Johnson',
                    email: 'alex@example.com',
                    join_date: '2024-01-15',
                    status: 'active',
                    earnings: 450.00,
                    commission: 22.50
                },
                {
                    id: 2,
                    name: 'Sarah Wilson',
                    email: 'sarah@example.com',
                    join_date: '2024-01-20',
                    status: 'active',
                    earnings: 320.00,
                    commission: 16.00
                }
            ]
        }
    });
});

// Products API
app.get('/api/products', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 1,
                name: 'Premium Headphones',
                category: 'Electronics',
                price: 299.99,
                commission_rate: 15,
                image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
                description: 'High-quality wireless headphones with noise cancellation.'
            },
            {
                id: 2,
                name: 'Smart Watch',
                category: 'Wearables',
                price: 199.99,
                commission_rate: 12,
                image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
                description: 'Feature-rich smartwatch with health tracking.'
            },
            {
                id: 3,
                name: 'Fitness Tracker',
                category: 'Health',
                price: 149.99,
                commission_rate: 10,
                image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=300',
                description: 'Lightweight fitness tracker for active lifestyles.'
            }
        ]
    });
});

// Profile API
app.get('/api/profile', (req, res) => {
    res.json({
        success: true,
        data: {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            tier: 'GOLD',
            commission_rate: 12,
            total_earnings: 15420.50,
            status: 'active',
            joined_date: '2024-01-01',
            payment_method: 'paypal',
            paypal_email: 'john@example.com'
        }
    });
});

// Admin APIs
app.get('/api/admin/overview', (req, res) => {
    res.json({
        success: true,
        data: {
            total_affiliates: 245,
            active_affiliates: 198,
            pending_applications: 12,
            total_commissions: 125420.50,
            pending_payouts: 15240.30,
            conversion_rate: 2.34
        }
    });
});

app.get('/api/admin/affiliates', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                tier: 'GOLD',
                status: 'active',
                earnings: 15420.50,
                joined: '2024-01-01'
            },
            {
                id: 2,
                name: 'Jane Smith',
                email: 'jane@example.com',
                tier: 'SILVER',
                status: 'active',
                earnings: 8750.25,
                joined: '2024-01-15'
            }
        ]
    });
});

// Catch-all for other API endpoints
app.all('/api/*', (req, res) => {
    res.json({
        success: true,
        message: `API endpoint ${req.path} (demo mode)`,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Start server
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Affiliate Boss API server running on http://localhost:${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
        console.log(`✅ Ready for frontend connections`);
    });
}

module.exports = app;