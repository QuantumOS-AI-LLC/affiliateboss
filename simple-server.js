// Simple HTTP server for development - Bangladesh dev style
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Import database
const Database = require('./lib/database');

// Initialize database
Database.initDatabase();

const PORT = 3000;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.woff': 'application/font-woff',
  '.woff2': 'application/font-woff2'
};

// Helper to get content type
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

// Helper to serve static files
function serveStaticFile(res, filePath) {
  const fullPath = path.join(__dirname, 'public', filePath);
  
  fs.readFile(fullPath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - File Not Found</h1>');
      return;
    }
    
    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    res.end(content);
  });
}

// Helper to parse JSON body
function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    try {
      const data = body ? JSON.parse(body) : {};
      callback(null, data);
    } catch (error) {
      callback(error, null);
    }
  });
}

// API route handler
function handleAPI(req, res, pathname, query, body) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Affiliate Boss API is running!',
      timestamp: new Date().toISOString(),
      version: '4.0.0'
    }));
    return;
  }

  // Dashboard API
  if (pathname.startsWith('/api/dashboard')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
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
    }));
    return;
  }

  // Analytics API
  if (pathname.startsWith('/api/analytics')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        revenue_trend: [
          { date: '2024-01-01', revenue: 1200 },
          { date: '2024-01-02', revenue: 1350 },
          { date: '2024-01-03', revenue: 1100 },
          { date: '2024-01-04', revenue: 1600 },
          { date: '2024-01-05', revenue: 1450 }
        ],
        top_products: [
          { name: 'Premium Headphones', sales: 45, revenue: 2250 },
          { name: 'Smart Watch', sales: 32, revenue: 1920 },
          { name: 'Fitness Tracker', sales: 28, revenue: 1400 }
        ]
      }
    }));
    return;
  }

  // Links API
  if (pathname.startsWith('/api/links')) {
    if (req.method === 'POST') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          id: Math.floor(Math.random() * 10000),
          name: body.name || 'New Link',
          short_url: 'https://aff.ly/' + Math.random().toString(36).substring(7).toUpperCase(),
          original_url: body.original_url || 'https://example.com',
          created_at: new Date().toISOString()
        }
      }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
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
    }));
    return;
  }

  // Commissions API
  if (pathname.startsWith('/api/commissions')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
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
        }
      ]
    }));
    return;
  }

  // Default API response
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: `API endpoint ${pathname} (working)`,
    method: req.method,
    timestamp: new Date().toISOString()
  }));
}

// Create server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // Handle API routes
  if (pathname.startsWith('/api/')) {
    if (req.method === 'POST' || req.method === 'PUT') {
      parseBody(req, (err, body) => {
        if (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
          return;
        }
        handleAPI(req, res, pathname, query, body);
      });
    } else {
      handleAPI(req, res, pathname, query, {});
    }
    return;
  }

  // Serve static files
  if (pathname === '/') {
    serveStaticFile(res, 'index.html');
  } else {
    serveStaticFile(res, pathname);
  }
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Affiliate Boss server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
});

module.exports = server;