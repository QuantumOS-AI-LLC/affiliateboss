const http = require('http');
const url = require('url');
const path = require('path');

// Import our API routes
const indexRoute = require('./api/index.js');
const dashboardRoute = require('./api/dashboard.js');
const sendOtpRoute = require('./api/auth/send-otp.js');
const verifyOtpRoute = require('./api/auth/verify-otp.js');
const signupRoute = require('./api/auth/signup.js');
const linksRoute = require('./api/links.js');
const dashboardKpisRoute = require('./api/kpis/dashboard.js');
const integrationsRoute = require('./api/integrations.js');
const profileRoute = require('./api/profile.js');
const redirectRoute = require('./api/redirect.js');

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // Add query parameters to req object
    req.query = parsedUrl.query;
    
    // Parse request body for POST requests
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                req.body = JSON.parse(body);
            } catch (e) {
                req.body = {};
            }
        });
        // Wait for body to be parsed
        await new Promise(resolve => req.on('end', resolve));
    }
    
    // Route requests
    try {
        if (pathname === '/') {
            await indexRoute(req, res);
        } else if (pathname === '/dashboard') {
            await dashboardRoute(req, res);
        } else if (pathname === '/api/auth/send-otp') {
            await sendOtpRoute(req, res);
        } else if (pathname === '/api/auth/verify-otp') {
            await verifyOtpRoute(req, res);
        } else if (pathname === '/api/auth/signup') {
            await signupRoute(req, res);
        } else if (pathname === '/api/links') {
            await linksRoute(req, res);
        } else if (pathname === '/api/kpis/dashboard') {
            await dashboardKpisRoute(req, res);
        } else if (pathname === '/api/integrations') {
            await integrationsRoute(req, res);
        } else if (pathname === '/api/profile') {
            await profileRoute(req, res);
        } else if (pathname.startsWith('/go/')) {
            const code = pathname.split('/go/')[1];
            req.query = { ...req.query, code };
            await redirectRoute(req, res);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    } catch (error) {
        console.error('Server error:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Affiliate Boss running at http://localhost:${PORT}`);
    console.log(`📱 Demo: http://localhost:${PORT}/dashboard?demo=true`);
    console.log(`🔑 API Key: api_key_john_123456789`);
});
