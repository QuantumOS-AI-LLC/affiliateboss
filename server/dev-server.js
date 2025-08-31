// Local development server
// Bangladesh dev style - comprehensive, well-organized, production-ready

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const dbManager = require('../lib/database');

// Import API routes
const linksRouter = require('./routes/links');
const commissionsRouter = require('./routes/commissions');
const productsRouter = require('./routes/products');
const analyticsRouter = require('./routes/analytics');
const paymentsRouter = require('./routes/payments');
const settingsRouter = require('./routes/settings');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database on startup
async function initializeApp() {
    try {
        console.log('🚀 Starting Affiliate Boss Platform...');
        
        // Connect to database
        dbManager.connect();
        
        // Check if database is empty and initialize if needed
        const userCount = dbManager.queryOne('SELECT COUNT(*) as count FROM users');
        if (userCount.count === 0) {
            console.log('📊 Database is empty, initializing with demo data...');
            dbManager.initializeSchema();
            dbManager.seedDatabase();
        }
        
        console.log('✅ Database ready with demo data');
        
    } catch (error) {
        console.error('❌ App initialization failed:', error);
        process.exit(1);
    }
}

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Allow inline scripts for development
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));
app.use('/css', express.static(path.join(__dirname, '../public/css')));
app.use('/js', express.static(path.join(__dirname, '../public/js')));

// API Routes
app.use('/api/links', linksRouter);
app.use('/api/commissions', commissionsRouter);
app.use('/api/products', productsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (req, res) => {
    try {
        const dbHealth = dbManager.healthCheck();
        const userCount = dbManager.queryOne('SELECT COUNT(*) as count FROM users');
        
        res.json({
            status: 'healthy',
            database: dbHealth ? 'connected' : 'disconnected',
            users: userCount.count,
            timestamp: new Date().toISOString(),
            version: '3.0.0'
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Demo API key endpoint
app.get('/api/demo-key', (req, res) => {
    res.json({
        api_key: 'api_key_john_123456789',
        user_id: 1,
        message: 'Use this API key for demo purposes'
    });
});

// Route handlers for different interfaces
app.get('/', (req, res) => {
    const htmlPath = path.join(__dirname, '../public/index.html');
    res.sendFile(htmlPath);
});

// Admin/Merchant dashboard
app.get('/admin', (req, res) => {
    const htmlPath = path.join(__dirname, '../public/admin.html');
    res.sendFile(htmlPath);
});

// Public affiliate application page
app.get('/apply', (req, res) => {
    const htmlPath = path.join(__dirname, '../public/apply.html');
    res.sendFile(htmlPath);
});

// Alternative routes for different user types
app.get('/merchant', (req, res) => {
    res.redirect('/admin');
});

app.get('/affiliate', (req, res) => {
    res.redirect('/');
});

app.get('/join', (req, res) => {
    res.redirect('/apply');
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        available_routes: [
            'GET / - Affiliate Dashboard',
            'GET /admin - Merchant Admin Panel',
            'GET /apply - Public Application Page',
            'GET /api/health - Health Check',
            'GET /api/demo-key - Demo API Key',
            'GET /api/links - Affiliate Links API',
            'GET /api/commissions - Commissions API',
            'GET /api/products - Products API',
            'GET /api/analytics - Analytics API',
            'GET /api/payments - Payments API',
            'GET /api/settings - Settings API',
            'GET /api/admin/* - Admin Management API'
        ]
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Server Error:', error);
    res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\\n🛑 Shutting down server...');
    dbManager.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\\n🛑 Shutting down server...');
    dbManager.close();
    process.exit(0);
});

// Start server
async function startServer() {
    await initializeApp();
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\\n🎉 Affiliate Boss Platform is running!`);
        console.log(`📍 Local:     http://localhost:${PORT}`);
        console.log(`📍 Network:   http://0.0.0.0:${PORT}`);
        console.log(`\\n📊 API Endpoints:`);
        console.log(`   GET  /api/health      - Health check`);
        console.log(`   GET  /api/demo-key    - Get demo API key`);
        console.log(`   GET  /api/links       - Affiliate links`);
        console.log(`   GET  /api/commissions - Commissions data`);
        console.log(`   GET  /api/products    - Products catalog`);
        console.log(`   GET  /api/analytics   - Performance analytics`);
        console.log(`   GET  /api/payments    - Payment methods`);
        console.log(`   GET  /api/settings    - User settings`);
        console.log(`\\n🔑 Demo API Key: api_key_john_123456789`);
        console.log(`\\n🚀 Ready for development!`);
    });
}

startServer().catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});

module.exports = app;