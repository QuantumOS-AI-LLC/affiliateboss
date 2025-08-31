#!/usr/bin/env python3
import http.server
import socketserver
import json
import urllib.parse
from pathlib import Path
import subprocess
import sys
import os

class AffiliateHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        
        if path == '/':
            self.send_landing_page()
        elif path == '/dashboard':
            self.send_dashboard_page()
        elif path.startswith('/go/'):
            code = path.split('/go/')[1]
            self.redirect_link(code)
        elif path.startswith('/api/'):
            self.handle_api_get(path)
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not Found')

    def do_POST(self):
        path = urllib.parse.urlparse(self.path).path
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        try:
            body = json.loads(post_data) if post_data else {}
        except:
            body = {}
            
        if path.startswith('/api/'):
            self.handle_api_post(path, body)
        else:
            self.send_response(404)
            self.end_headers()

    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def send_landing_page(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.send_cors_headers()
        self.end_headers()
        
        html = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Affiliate Boss - Demo</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .neon-glow { box-shadow: 0 0 20px rgba(0, 255, 136, 0.3); }
    </style>
</head>
<body class="bg-gray-900 text-white">
    <nav class="bg-gray-800 border-b-2 border-green-400 p-4">
        <div class="container mx-auto flex justify-between items-center">
            <div class="flex items-center space-x-4">
                <i class="fas fa-rocket text-green-400 text-2xl"></i>
                <h1 class="text-2xl font-bold text-green-400">Affiliate Boss</h1>
            </div>
            <div class="flex space-x-4">
                <button onclick="alert('Demo mode - login not needed')" class="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg">
                    <i class="fas fa-sign-in-alt mr-2"></i>Login
                </button>
            </div>
        </div>
    </nav>

    <div class="gradient-bg py-20">
        <div class="container mx-auto px-6 text-center">
            <h1 class="text-5xl font-bold mb-6">Affiliate Boss Demo</h1>
            <p class="text-xl mb-8 opacity-90">Test the full affiliate marketing platform with realistic demo data.</p>
            <div class="flex justify-center space-x-6">
                <button onclick="window.location.href='/dashboard'" class="bg-green-400 hover:bg-green-500 text-black px-8 py-4 rounded-lg text-lg font-semibold neon-glow">
                    <i class="fas fa-play mr-2"></i>Try Demo Dashboard
                </button>
            </div>
            
            <div class="mt-8 p-4 bg-yellow-600 text-black rounded-lg inline-block">
                <strong>Demo API Key:</strong> <code>api_key_john_123456789</code>
            </div>
        </div>
    </div>

    <div class="py-20 bg-gray-800">
        <div class="container mx-auto px-6">
            <h2 class="text-4xl font-bold text-center mb-16">Demo Features</h2>
            <div class="grid md:grid-cols-3 gap-8">
                <div class="p-8 rounded-lg border-2 border-green-400 bg-gray-900">
                    <i class="fas fa-link text-green-400 text-4xl mb-4"></i>
                    <h3 class="text-xl font-bold mb-4">Affiliate Links</h3>
                    <p>Create and manage affiliate links with realistic demo data.</p>
                </div>
                <div class="p-8 rounded-lg border-2 border-green-400 bg-gray-900">
                    <i class="fas fa-chart-line text-green-400 text-4xl mb-4"></i>
                    <h3 class="text-xl font-bold mb-4">Analytics Dashboard</h3>
                    <p>View performance metrics and earnings with interactive charts.</p>
                </div>
                <div class="p-8 rounded-lg border-2 border-green-400 bg-gray-900">
                    <i class="fas fa-shopping-cart text-green-400 text-4xl mb-4"></i>
                    <h3 class="text-xl font-bold mb-4">Store Integrations</h3>
                    <p>Connect with Shopify stores and import products.</p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
        """
        self.wfile.write(html.encode('utf-8'))

    def send_dashboard_page(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.send_cors_headers()
        self.end_headers()
        
        # Read dashboard HTML from the actual file
        try:
            # Run node to get dashboard HTML
            result = subprocess.run([
                'node', '-e', 
                '''
                const { handleCors } = require("./api/utils/helpers");
                const fs = require("fs");
                const path = "./api/dashboard.js";
                const content = fs.readFileSync(path, "utf8");
                const match = content.match(/const dashboardHtml = `([\\s\\S]*?)`;/);
                if (match) {
                    console.log(match[1]);
                } else {
                    console.log("Dashboard HTML not found");
                }
                '''
            ], capture_output=True, text=True, cwd='/home/user/affiliate-boss')
            
            if result.returncode == 0 and result.stdout.strip():
                dashboard_html = result.stdout.strip()
            else:
                dashboard_html = "<h1>Dashboard Loading Error</h1><p>Please check the server logs.</p>"
                
        except Exception as e:
            dashboard_html = f"<h1>Dashboard Error</h1><p>{str(e)}</p>"
            
        self.wfile.write(dashboard_html.encode('utf-8'))

    def handle_api_get(self, path):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_cors_headers()
        self.end_headers()
        
        if '/kpis/dashboard' in path:
            response = {
                "success": True,
                "data": {
                    "total_links": 24,
                    "total_clicks": 15847,
                    "conversions": 387,
                    "conversion_rate": 2.44,
                    "total_commission": 2847.92,
                    "pending_commission": 892.45,
                    "paid_commission": 1955.47,
                    "active_links": 24
                }
            }
        else:
            response = {"success": True, "data": []}
            
        self.wfile.write(json.dumps(response).encode('utf-8'))

    def handle_api_post(self, path, body):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_cors_headers()
        self.end_headers()
        
        response = {"success": True, "message": "Demo mode - request processed"}
        self.wfile.write(json.dumps(response).encode('utf-8'))

    def redirect_link(self, code):
        # Demo link mappings
        links = {
            'mbp001': 'https://apple.com/macbook-pro',
            'tesla02': 'https://tesla.com/models',
            'ip15pm': 'https://apple.com/iphone-15-pro'
        }
        
        url = links.get(code, 'https://example.com')
        self.send_response(302)
        self.send_header('Location', url)
        self.end_headers()

if __name__ == "__main__":
    PORT = 8080
    with socketserver.TCPServer(("0.0.0.0", PORT), AffiliateHandler) as httpd:
        print(f"🚀 Affiliate Boss Demo Server running at http://localhost:{PORT}")
        print(f"📱 Dashboard: http://localhost:{PORT}/dashboard")
        print(f"🔑 Demo API Key: api_key_john_123456789")
        httpd.serve_forever()