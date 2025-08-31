#!/usr/bin/env python3
import http.server
import socketserver
import json
import os
import mimetypes
from urllib.parse import urlparse, parse_qs

class AffiliateWebServer(http.server.BaseHTTPRequestHandler):
    
    def do_GET(self):
        path = urlparse(self.path).path
        
        # API endpoints
        if path.startswith('/api/'):
            self.handle_api_request(path)
            return
            
        # Serve static files
        self.serve_file(path)
    
    def do_POST(self):
        path = urlparse(self.path).path
        
        if path.startswith('/api/'):
            # Read POST data
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                body = json.loads(post_data.decode('utf-8')) if post_data else {}
            except:
                body = {}
                
            self.handle_api_request(path, body)
            return
            
        self.send_error(404)
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.add_cors_headers()
        self.end_headers()
    
    def add_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
    
    def serve_file(self, path):
        if path == '/':
            path = '/index.html'
            
        file_path = os.path.join('/home/user/affiliate-boss/public', path.lstrip('/'))
        
        if os.path.exists(file_path) and os.path.isfile(file_path):
            # Get MIME type
            content_type, _ = mimetypes.guess_type(file_path)
            if content_type is None:
                content_type = 'application/octet-stream'
            
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.add_cors_headers()
            self.end_headers()
            
            with open(file_path, 'rb') as f:
                self.wfile.write(f.read())
        else:
            self.send_error(404)
    
    def handle_api_request(self, path, body=None):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.add_cors_headers()
        self.end_headers()
        
        # API responses
        if path == '/api/health':
            response = {
                "success": True,
                "message": "Affiliate Boss API is running!",
                "timestamp": "2024-01-31T12:00:00Z",
                "version": "4.0.0"
            }
        elif path == '/api/dashboard':
            response = {
                "success": True,
                "data": {
                    "stats": {
                        "total_earnings": 15420.50,
                        "total_clicks": 25847,
                        "total_conversions": 342,
                        "conversion_rate": 1.32,
                        "pending_commissions": 1247.30,
                        "approved_commissions": 14173.20
                    },
                    "recent_activity": [
                        {
                            "type": "commission",
                            "amount": 45.67,
                            "product": "Premium Headphones",
                            "date": "2024-01-31T12:00:00Z"
                        },
                        {
                            "type": "click",
                            "product": "Smart Watch",
                            "date": "2024-01-31T11:58:00Z"
                        }
                    ]
                }
            }
        elif path == '/api/analytics':
            response = {
                "success": True,
                "data": {
                    "revenue_trend": [
                        {"date": "2024-01-27", "revenue": 1200},
                        {"date": "2024-01-28", "revenue": 1350},
                        {"date": "2024-01-29", "revenue": 1100},
                        {"date": "2024-01-30", "revenue": 1600},
                        {"date": "2024-01-31", "revenue": 1450}
                    ],
                    "top_products": [
                        {"name": "Premium Headphones", "sales": 45, "revenue": 2250},
                        {"name": "Smart Watch", "sales": 32, "revenue": 1920},
                        {"name": "Fitness Tracker", "sales": 28, "revenue": 1400}
                    ]
                }
            }
        elif path == '/api/links':
            if body is not None:  # POST request
                response = {
                    "success": True,
                    "data": {
                        "id": 12345,
                        "name": body.get("name", "New Link"),
                        "short_url": "https://aff.ly/ABC123",
                        "original_url": body.get("original_url", "https://example.com"),
                        "created_at": "2024-01-31T12:00:00Z"
                    }
                }
            else:  # GET request
                response = {
                    "success": True,
                    "data": [
                        {
                            "id": 1,
                            "name": "Fashion Collection",
                            "short_url": "https://aff.ly/FAS123",
                            "original_url": "https://store.com/fashion",
                            "clicks": 1250,
                            "conversions": 42,
                            "earnings": 1680.00,
                            "created_at": "2024-01-15T10:30:00Z"
                        },
                        {
                            "id": 2,
                            "name": "Tech Gadgets",
                            "short_url": "https://aff.ly/TECH456",
                            "original_url": "https://store.com/tech",
                            "clicks": 890,
                            "conversions": 28,
                            "earnings": 1120.00,
                            "created_at": "2024-01-20T14:45:00Z"
                        }
                    ]
                }
        elif path == '/api/commissions':
            response = {
                "success": True,
                "data": [
                    {
                        "id": 1,
                        "date": "2024-01-25",
                        "product": "Premium Headphones",
                        "customer": "John D.",
                        "sale_amount": 299.99,
                        "rate": "15%",
                        "commission": 45.00,
                        "status": "approved"
                    },
                    {
                        "id": 2,
                        "date": "2024-01-24",
                        "product": "Smart Watch",
                        "customer": "Sarah M.",
                        "sale_amount": 199.99,
                        "rate": "12%",
                        "commission": 24.00,
                        "status": "pending"
                    },
                    {
                        "id": 3,
                        "date": "2024-01-23",
                        "product": "Fitness Tracker",
                        "customer": "Mike B.",
                        "sale_amount": 149.99,
                        "rate": "10%",
                        "commission": 15.00,
                        "status": "paid"
                    }
                ]
            }
        elif path == '/api/tools/content':
            content_type = body.get('content_type', 'product_description')
            product_name = body.get('product_name', 'Sample Product')
            keywords = body.get('keywords', 'amazing benefits')
            
            content_templates = {
                'product_description': f"Discover the amazing {product_name}! This incredible product features cutting-edge technology and premium quality. Perfect for anyone looking to {keywords}. Don't miss out on this exclusive opportunity!",
                'email_campaign': f"Subject: Exclusive Deal on {product_name}!\n\nHi there!\n\nI wanted to share this amazing product with you - {product_name}. It's perfect for {keywords} and I think you'll love it!\n\nCheck it out here: [Your Affiliate Link]\n\nBest regards,\n[Your Name]",
                'social_post': f"🔥 Just discovered {product_name}! Perfect for {keywords}. Highly recommended! #affiliate #{keywords.replace(' ', '')} [link]",
                'blog_post': f"# {product_name} Review: Everything You Need to Know\n\n## Introduction\n{product_name} has been making waves in the market, and for good reason. In this comprehensive review, I'll share my experience with this product.\n\n## Key Features\n- Premium quality\n- Easy to use\n- Great value\n\n## Final Thoughts\nIf you're looking for {keywords}, {product_name} is definitely worth considering. [Affiliate Link]"
            }
            
            response = {
                "success": True,
                "data": {
                    "content": content_templates.get(content_type, f"Generated content for {product_name}"),
                    "content_type": content_type,
                    "generated_at": "2024-01-31T12:00:00Z"
                }
            }
        else:
            response = {
                "success": True,
                "message": f"API endpoint {path} (demo mode)",
                "timestamp": "2024-01-31T12:00:00Z"
            }
        
        self.wfile.write(json.dumps(response, indent=2).encode('utf-8'))

if __name__ == "__main__":
    PORT = 3000
    
    # Kill any existing process on port 3000
    os.system(f"fuser -k {PORT}/tcp 2>/dev/null || true")
    
    Handler = AffiliateWebServer
    
    with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
        print(f"🚀 Affiliate Boss Web Server running at http://localhost:{PORT}")
        print(f"📊 Dashboard: http://localhost:{PORT}")
        print(f"🔗 API Health: http://localhost:{PORT}/api/health")
        print(f"💻 Features: Dashboard, Links, Analytics, Tools")
        print("✅ Ready for testing!")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Server stopped")
            httpd.shutdown()