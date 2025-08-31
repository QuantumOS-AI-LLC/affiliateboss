#!/usr/bin/env node

// Test script for Affiliate Boss API endpoints
const http = require('http');
const url = require('url');

// Import our API handlers
const indexHandler = require('./api/index.js');
const linksHandler = require('./api/links.js');
const dashboardHandler = require('./api/dashboard.js');
const commissionsHandler = require('./api/commissions.js');
const paymentsHandler = require('./api/payments.js');
const analyticsHandler = require('./api/analytics.js');
const productsHandler = require('./api/products.js');
const shopifyHandler = require('./api/shopify.js');
const settingsHandler = require('./api/settings.js');

// Create test server
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const { pathname } = parsedUrl;
    
    // Add query params to req object for compatibility
    req.query = parsedUrl.query;
    
    // Simple routing
    try {
        if (pathname === '/' || pathname === '/api') {
            await indexHandler(req, res);
        } else if (pathname.startsWith('/api/links')) {
            await linksHandler(req, res);
        } else if (pathname === '/api/dashboard') {
            await dashboardHandler(req, res);
        } else if (pathname.startsWith('/api/commissions')) {
            await commissionsHandler(req, res);
        } else if (pathname.startsWith('/api/payments')) {
            await paymentsHandler(req, res);
        } else if (pathname.startsWith('/api/analytics')) {
            await analyticsHandler(req, res);
        } else if (pathname.startsWith('/api/products')) {
            await productsHandler(req, res);
        } else if (pathname.startsWith('/api/shopify')) {
            await shopifyHandler(req, res);
        } else if (pathname.startsWith('/api/settings')) {
            await settingsHandler(req, res);
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Endpoint not found', path: pathname }));
        }
    } catch (error) {
        console.error('API Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error', details: error.message }));
    }
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`🚀 Affiliate Boss API Server running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard`);
    console.log(`🔗 Links API: http://localhost:${PORT}/api/links?api_key=api_key_john_123456789`);
    console.log(`💰 Demo API Key: api_key_john_123456789`);
    
    // Run some test requests
    setTimeout(runTests, 1000);
});

async function runTests() {
    console.log('\n🧪 Running API Tests...\n');
    
    const tests = [
        {
            name: 'Test Links API',
            url: 'http://localhost:3001/api/links?api_key=api_key_john_123456789'
        },
        {
            name: 'Test Dashboard',
            url: 'http://localhost:3001/api/dashboard?api_key=api_key_john_123456789'
        },
        {
            name: 'Test Commission Summary',
            url: 'http://localhost:3001/api/commissions/summary?api_key=api_key_john_123456789'
        },
        {
            name: 'Test Products',
            url: 'http://localhost:3001/api/products?api_key=api_key_john_123456789'
        }
    ];

    for (const test of tests) {
        try {
            const response = await fetch(test.url);
            const data = await response.json();
            
            if (data.success) {
                console.log(`✅ ${test.name}: SUCCESS`);
                if (data.data) {
                    if (Array.isArray(data.data)) {
                        console.log(`   📊 Returned ${data.data.length} items`);
                    } else if (typeof data.data === 'object') {
                        console.log(`   📊 Returned object with ${Object.keys(data.data).length} properties`);
                    }
                }
            } else {
                console.log(`❌ ${test.name}: FAILED - ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.log(`❌ ${test.name}: ERROR - ${error.message}`);
        }
    }
    
    console.log('\n🎉 Affiliate Boss API is ready for Vercel deployment!');
    console.log('\n📚 API Documentation:');
    console.log('   • GET  /api/links - Manage affiliate links');
    console.log('   • GET  /api/commissions - Track earnings');
    console.log('   • GET  /api/products - Browse products');
    console.log('   • GET  /api/analytics - Performance data');
    console.log('   • GET  /api/shopify - Store integration');
    console.log('   • GET  /api/payments - Payout management');
    console.log('   • GET  /api/settings - User preferences');
    
    process.exit(0);
}

// Handle errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});