// Quick Express server for development - Bangladesh dev style
const express = require('express');
const path = require('path');
const cors = require('cors');

// Import database
const Database = require('./lib/database');

// Initialize database
Database.initDatabase();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Affiliate Boss API is running!',
    timestamp: new Date().toISOString(),
    version: '4.0.0'
  });
});

// Import and mount API routes
const importRoute = (routePath) => {
  try {
    const route = require(`./api/${routePath}`);
    return (req, res) => {
      // Convert Express req/res to Vercel format
      req.method = req.method;
      req.query = req.query;
      req.body = req.body;
      
      // Call the Vercel function
      route.default(req, res);
    };
  } catch (error) {
    console.log(`Route ./api/${routePath} not found, creating stub`);
    return (req, res) => {
      res.json({
        success: true,
        message: `${routePath} endpoint (stub)`,
        data: {},
        timestamp: new Date().toISOString()
      });
    };
  }
};

// Mount API routes
app.use('/api/dashboard', importRoute('dashboard.js'));
app.use('/api/analytics', importRoute('analytics.js'));
app.use('/api/commissions', importRoute('commissions.js'));
app.use('/api/links', importRoute('links.js'));
app.use('/api/products', importRoute('products.js'));
app.use('/api/profile', importRoute('profile.js'));
app.use('/api/referrals', importRoute('referrals.js'));
app.use('/api/settings', importRoute('settings.js'));
app.use('/api/payments', importRoute('payments.js'));
app.use('/api/shopify', importRoute('shopify.js'));

// Admin routes
app.use('/api/admin/overview', importRoute('admin/overview.js'));
app.use('/api/admin/affiliates', importRoute('admin/affiliates.js'));
app.use('/api/admin/applications', importRoute('admin/applications.js'));
app.use('/api/admin/payouts', importRoute('admin/payouts.js'));
app.use('/api/admin/performance', importRoute('admin/performance.js'));

// Tools routes
app.use('/api/tools/content', importRoute('tools/content.js'));
app.use('/api/tools/qr', importRoute('tools/qr.js'));

// SMS and AI routes
app.use('/api/sms/schedule-campaign', importRoute('sms/schedule-campaign.js'));
app.use('/api/ai/generate-content', importRoute('ai/generate-content.js'));

// Link tracking
app.use('/api/links/tracking', importRoute('links/tracking.js'));

// Catch-all for unknown API routes
app.all('/api/*', (req, res) => {
  res.json({
    success: true,
    message: `API endpoint ${req.path} (placeholder)`,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Affiliate Boss server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
});

module.exports = app;