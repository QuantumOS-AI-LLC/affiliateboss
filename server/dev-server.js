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

// Main dashboard route
app.get('/', (req, res) => {
    const htmlPath = path.join(__dirname, '../public/index.html');
    
    if (fs.existsSync(htmlPath)) {
        res.sendFile(htmlPath);
    } else {
        // If index.html doesn't exist, create a basic one
        const basicHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Affiliate Boss Platform</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-gray-100">
    <div id="app">
        <div class="min-h-screen flex items-center justify-center">
            <div class="text-center">
                <h1 class="text-4xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-rocket mr-2 text-blue-500"></i>
                    Affiliate Boss Platform
                </h1>
                <p class="text-gray-600 mb-8">Loading complete dashboard...</p>
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            </div>
        </div>
    </div>
    
    <script>
        // Auto-redirect to dashboard when ready
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    </script>
</body>
</html>`;
        res.send(basicHTML);
    }
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        available_routes: [
            'GET /',
            'GET /api/health',
            'GET /api/demo-key',
            'GET /api/links',
            'GET /api/commissions',
            'GET /api/products',
            'GET /api/analytics',
            'GET /api/payments',
            'GET /api/settings'
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