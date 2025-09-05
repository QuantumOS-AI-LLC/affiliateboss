# 🖥️ **Affiliate Boss - Local Development Setup**

## 🚀 **Quick Start (5 Minutes)**

```bash
# 1. Clone the repository
git clone https://github.com/QuantumOS-AI-LLC/affiliateboss.git
cd affiliateboss

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open browser
# Visit: http://localhost:3000
```

**🎉 That's it! Your affiliate marketing platform is running locally.**

---

## 📋 **Prerequisites**

### **Required Software**
- **Node.js** v18+ - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **Code Editor** (VS Code recommended) - [Download](https://code.visualstudio.com/)

### **Check Your Installation**
```bash
node --version    # Should show v18.0.0 or higher
npm --version     # Should show 8.0.0 or higher
git --version     # Should show 2.0.0 or higher
```

---

## 🛠️ **Complete Setup Guide**

### **1. Clone Repository**
```bash
# Clone from GitHub
git clone https://github.com/QuantumOS-AI-LLC/affiliateboss.git

# Navigate to project directory
cd affiliateboss

# Verify files are there
ls -la
```

### **2. Install Dependencies**
```bash
# Install all required packages
npm install

# Verify installation
npm list --depth=0
```

### **3. Environment Configuration** (Optional)
```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables (optional for basic functionality)
nano .env.local
```

**Environment Variables** (Optional - Platform works without these):
```env
# AI Content Generation (Optional)
OPENAI_API_KEY=sk-your-openai-api-key-here

# SMS Marketing (Optional)  
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token

# Shopify Integration (Optional)
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_your_shopify_token

# Database (Automatically handled)
DATABASE_PATH=./database.db
NODE_ENV=development
```

### **4. Initialize Database**
```bash
# Initialize SQLite database with schema and demo data
npm run init-local

# Verify database was created
ls -la database.db
```

### **5. Start Development Server**

**Option A: Vercel Dev Server (Recommended)**
```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Start development server
vercel dev

# Server will start at: http://localhost:3000
```

**Option B: Custom Express Server**
```bash
# Start Express server with all APIs
node quick-server.js

# Server will start at: http://localhost:3000
```

**Option C: Simple Python Server (Frontend Only)**
```bash
# Start Python HTTP server (frontend only)
cd public
python3 -m http.server 8080

# Server will start at: http://localhost:8080
# Note: APIs won't work with this option
```

---

## 🧪 **Testing Your Setup**

### **1. Test API Health**
```bash
# Test API is working
curl http://localhost:3000/api/health

# Expected response:
{
  "success": true,
  "message": "Affiliate Boss API is running!",
  "timestamp": "2024-01-31T12:00:00Z",
  "version": "4.0.0"
}
```

### **2. Test Dashboard API**
```bash
# Test dashboard data
curl -H "X-API-Key: api_key_john_123456789" \
     http://localhost:3000/api/dashboard

# Should return dashboard statistics
```

### **3. Test Web Interface**
Open your browser and visit: `http://localhost:3000`

**You should see:**
- ✅ Professional affiliate dashboard
- ✅ Navigation menu with all sections
- ✅ Interactive charts and statistics
- ✅ Working affiliate link management
- ✅ Commission tracking tables

---

## 📁 **Project Structure**

```
affiliateboss/
├── 📂 api/                           # Backend API Endpoints
│   ├── 📂 admin/                    # Admin Management
│   │   ├── affiliates.js            # Affiliate management
│   │   ├── applications.js          # Application processing
│   │   ├── overview.js              # Admin dashboard
│   │   ├── payouts.js               # Payout processing
│   │   └── performance.js           # Performance analytics
│   ├── 📂 ai/                       # AI Integration
│   │   └── generate-content.js      # OpenAI content generation
│   ├── 📂 analytics/                # Analytics & Reports
│   │   └── advanced.js              # Advanced analytics
│   ├── 📂 auth/                     # Authentication
│   │   └── change-password.js       # Password management
│   ├── 📂 links/                    # Link Management
│   │   └── tracking.js              # Click tracking
│   ├── 📂 profile/                  # User Profile
│   │   └── payment.js               # Payment information
│   ├── 📂 shopify/                  # Shopify Integration
│   │   └── sync-products.js         # Product synchronization
│   ├── 📂 sms/                      # SMS Marketing
│   │   └── schedule-campaign.js     # SMS campaigns
│   ├── 📂 tools/                    # Marketing Tools
│   │   ├── content.js               # Content generation
│   │   └── qr.js                    # QR code generation
│   ├── analytics.js                 # Main analytics API
│   ├── commissions.js               # Commission tracking
│   ├── dashboard.js                 # Dashboard data
│   ├── health.js                    # Health check
│   ├── index.js                     # Main API router
│   ├── links.js                     # Link management
│   ├── payments.js                  # Payment processing
│   ├── products.js                  # Product catalog
│   ├── referrals.js                 # Referral system
│   └── settings.js                  # System settings
├── 📂 public/                       # Frontend Application
│   ├── index.html                   # Main dashboard interface
│   └── 📂 js/
│       └── app.js                   # Complete frontend logic
├── 📂 lib/                          # Utilities
│   └── database.js                  # Database management
├── 📂 database/                     # Database Schema
│   └── schema.sql                   # Table definitions
├── 📂 migrations/                   # Database Migrations
├── 📄 .env.example                  # Environment template
├── 📄 .gitignore                    # Git ignore rules
├── 📄 package.json                  # Dependencies & scripts
├── 📄 vercel.json                   # Vercel deployment config
├── 📄 README.md                     # Project documentation
└── 📄 LOCAL-SETUP.md               # This setup guide
```

---

## 🎯 **Available NPM Scripts**

```bash
# Development Commands
npm run dev              # Start Vercel development server
npm start               # Alternative start command
npm run init-local      # Initialize local database with demo data

# Database Commands  
npm run db:reset        # Reset database with fresh schema and data
npm run db:seed         # Add demo data to existing database
npm run db:backup       # Create backup of current database

# Testing Commands
npm test                # Test API health endpoint
npm run test-api        # Run comprehensive API test suite

# Deployment Commands
npm run build           # Build for production (Vercel handles this)
npm run deploy          # Deploy to Vercel production
npm run deploy-preview  # Deploy to Vercel preview environment

# Utility Commands
npm run clean           # Clean temporary files and logs
npm run lint            # Run code quality checks (if configured)
```

---

## 🗄️ **Database Information**

### **Database Type**: SQLite (Local file-based database)
### **Location**: `./database.db`
### **Tables** (12 total):
- **users** - User accounts and authentication
- **affiliates** - Affiliate profile information  
- **affiliate_links** - Trackable affiliate links
- **commissions** - Commission records and calculations
- **payouts** - Payment processing and history
- **shopify_products** - Integrated product catalog
- **sms_campaigns** - Marketing campaign management
- **referrals** - Multi-level referral tracking
- **payment_info** - Secure payment method storage
- **admin_settings** - System configuration
- **api_logs** - Request logging and monitoring
- **performance_metrics** - Analytics and performance data

### **Demo Data Included**:
- **Demo User**: John Doe (Gold Tier Affiliate)
- **API Key**: `api_key_john_123456789`
- **Sample Links**: Fashion and tech product links
- **Commission History**: Realistic transaction data
- **Analytics Data**: Performance metrics and charts

### **Database Commands**:
```bash
# View database schema
sqlite3 database.db ".schema"

# View users table
sqlite3 database.db "SELECT * FROM users;"

# View affiliate links
sqlite3 database.db "SELECT * FROM affiliate_links;"

# View commissions
sqlite3 database.db "SELECT * FROM commissions LIMIT 10;"
```

---

## 🔧 **Development Workflow**

### **1. Start Development Session**
```bash
# Open project in VS Code
code .

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

### **2. Make Changes**

**Frontend Changes** (`public/` directory):
- Edit `public/index.html` for UI changes
- Edit `public/js/app.js` for functionality changes
- Changes are reflected immediately (refresh browser)

**Backend Changes** (`api/` directory):
- Edit API files in `api/` for backend logic
- Vercel dev server automatically restarts
- Test changes with API calls

**Database Changes** (`lib/database.js`):
- Modify database schema or queries
- Run `npm run db:reset` to apply changes
- Restart development server

### **3. Test Changes**
```bash
# Test specific API endpoint
curl -H "X-API-Key: api_key_john_123456789" \
     http://localhost:3000/api/dashboard

# Test in browser
# Open http://localhost:3000 and navigate through features
```

### **4. Commit and Deploy**
```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "Add new feature: description"

# Push to GitHub
git push origin main

# Deploy to production (optional)
vercel --prod
```

---

## 🌐 **API Endpoints Reference**

### **Authentication**
All API endpoints accept the demo API key: `api_key_john_123456789`

Include in requests as header: `X-API-Key: api_key_john_123456789`

### **Core Endpoints**
```bash
# System Health
GET /api/health

# Dashboard Data
GET /api/dashboard

# Analytics & Performance  
GET /api/analytics
GET /api/analytics/advanced

# Affiliate Link Management
GET /api/links                    # List all links
POST /api/links                   # Create new link
GET /api/links/tracking           # Get tracking stats

# Commission Management
GET /api/commissions              # List commissions
GET /api/commissions?status=paid  # Filter by status

# Referral System
GET /api/referrals               # Referral data
POST /api/referrals              # Create referral

# Product Catalog
GET /api/products                # List products
GET /api/products?category=tech  # Filter by category

# User Profile
GET /api/profile                 # User profile data
PUT /api/profile                 # Update profile
```

### **Admin Endpoints**
```bash
# Admin Dashboard
GET /api/admin/overview          # Admin statistics
GET /api/admin/performance       # Performance analytics

# Affiliate Management
GET /api/admin/affiliates        # All affiliates
GET /api/admin/applications      # Applications

# Payout Management  
GET /api/admin/payouts           # Payout history
POST /api/admin/payouts          # Process payouts
```

### **Marketing Tools**
```bash
# AI Content Generation
POST /api/ai/generate-content    # Generate marketing content

# SMS Marketing
POST /api/sms/schedule-campaign  # Schedule SMS campaign

# QR Code Generation
GET /api/tools/qr?url=https://example.com  # Generate QR code

# Shopify Integration
GET /api/shopify/sync-products   # Sync products from Shopify
```

---

## 🐛 **Troubleshooting Guide**

### **Common Issues & Solutions**

#### **1. Port Already in Use**
```bash
# Error: EADDRINUSE: address already in use :::3000
# Solution: Kill process using port 3000
npx kill-port 3000
# Or use different port:
PORT=3001 npm run dev
```

#### **2. Database Not Found**
```bash
# Error: Database file not found
# Solution: Initialize database
npm run init-local
# Or manually create:
node -e "require('./lib/database').initDatabase()"
```

#### **3. API Calls Failing**
```bash
# Error: API endpoints returning 404
# Check if server is running:
curl http://localhost:3000/api/health
# Restart server:
npm run dev
```

#### **4. Missing Dependencies**
```bash
# Error: Module not found
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### **5. Vercel CLI Issues**
```bash
# Error: Vercel command not found
# Solution: Install Vercel CLI
npm install -g vercel@latest
vercel login
```

#### **6. Frontend Not Loading**
```bash
# Check if files exist in public/ directory
ls -la public/
# Ensure index.html is present
cat public/index.html | head -5
```

#### **7. Environment Variables Not Working**
```bash
# Check if .env.local exists
ls -la .env.local
# Verify format (no spaces around =)
cat .env.local
```

### **Debug Commands**
```bash
# Check server logs
npm run dev --verbose

# Test database connection
node -e "console.log(require('./lib/database').getDatabase())"

# Verify API responses
curl -v http://localhost:3000/api/health

# Check file permissions
ls -la database.db
```

---

## 🔌 **Optional Integrations Setup**

### **OpenAI Integration** (AI Content Generation)
1. **Get API Key**: Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Add to Environment**: 
   ```bash
   echo "OPENAI_API_KEY=sk-your-api-key-here" >> .env.local
   ```
3. **Test Integration**: 
   ```bash
   curl -X POST -H "Content-Type: application/json" \
        -H "X-API-Key: api_key_john_123456789" \
        -d '{"content_type":"product_description","product_name":"Smart Watch","keywords":"fitness tracking"}' \
        http://localhost:3000/api/ai/generate-content
   ```

### **Twilio Integration** (SMS Marketing)
1. **Get Credentials**: Visit [Twilio Console](https://console.twilio.com/)
2. **Add to Environment**: 
   ```bash
   echo "TWILIO_ACCOUNT_SID=ACxxxxx" >> .env.local
   echo "TWILIO_AUTH_TOKEN=your_auth_token" >> .env.local
   ```
3. **Test Integration**: 
   ```bash
   curl -X POST -H "Content-Type: application/json" \
        -H "X-API-Key: api_key_john_123456789" \
        -d '{"campaign_name":"Test Campaign","message":"Hello from Affiliate Boss!","audience":"test"}' \
        http://localhost:3000/api/sms/schedule-campaign
   ```

### **Shopify Integration** (Product Sync)
1. **Create Private App**: Go to Shopify Admin → Apps → Private Apps
2. **Add to Environment**: 
   ```bash
   echo "SHOPIFY_STORE_URL=your-store.myshopify.com" >> .env.local
   echo "SHOPIFY_ACCESS_TOKEN=shpat_xxxxx" >> .env.local
   ```
3. **Test Integration**: 
   ```bash
   curl -H "X-API-Key: api_key_john_123456789" \
        http://localhost:3000/api/shopify/sync-products
   ```

---

## 🎯 **VS Code Setup** (Recommended)

### **Recommended Extensions**
```bash
# Install VS Code extensions via command line
code --install-extension ms-vscode.vscode-json
code --install-extension bradlc.vscode-tailwindcss  
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension alexcvzz.vscode-sqlite
code --install-extension humao.rest-client
```

### **VS Code Workspace Settings**
Create `.vscode/settings.json`:
```json
{
  "emmet.includeLanguages": {
    "javascript": "html"
  },
  "tailwindCSS.includeLanguages": {
    "html": "html",
    "javascript": "javascript"
  },
  "files.associations": {
    "*.js": "javascript"
  }
}
```

### **Useful VS Code Shortcuts**
- **Ctrl/Cmd + `** - Open integrated terminal
- **Ctrl/Cmd + Shift + P** - Open command palette
- **Ctrl/Cmd + P** - Quick file search
- **F5** - Start debugging
- **Ctrl/Cmd + Shift + ` ** - New terminal

---

## 📊 **Testing Checklist**

### **✅ Basic Functionality Test**
```bash
# 1. Server starts successfully
npm run dev
# ✅ Should show: "Server running at http://localhost:3000"

# 2. API health check passes
curl http://localhost:3000/api/health
# ✅ Should return: {"success": true, "message": "..."}

# 3. Frontend loads
# ✅ Open http://localhost:3000 in browser
# ✅ Should see: Professional dashboard with navigation

# 4. Database initialized
ls -la database.db
# ✅ Should show: database.db file exists

# 5. Demo data loaded
curl -H "X-API-Key: api_key_john_123456789" http://localhost:3000/api/dashboard
# ✅ Should return: Dashboard data with statistics
```

### **✅ Feature Testing**
```bash
# Test affiliate link creation
curl -X POST -H "Content-Type: application/json" \
     -H "X-API-Key: api_key_john_123456789" \
     -d '{"name":"Test Link","original_url":"https://example.com"}' \
     http://localhost:3000/api/links

# Test commission tracking  
curl -H "X-API-Key: api_key_john_123456789" \
     http://localhost:3000/api/commissions

# Test analytics data
curl -H "X-API-Key: api_key_john_123456789" \
     http://localhost:3000/api/analytics
```

### **✅ Frontend Testing**
1. **Dashboard**: Should show earnings, clicks, charts
2. **Links**: Should display affiliate links table
3. **Commissions**: Should show transaction history
4. **Navigation**: All menu items should work
5. **Responsive**: Should work on mobile/desktop

---

## 🚀 **Performance Tips**

### **Development Optimization**
```bash
# Use local database for faster queries
# SQLite is optimized for local development

# Enable hot reloading
# Vercel dev server provides automatic reloading

# Use browser dev tools
# Chrome DevTools → Network tab to monitor API calls
```

### **Database Optimization**
```bash
# Regular database cleanup
npm run db:reset

# Monitor database size
ls -lh database.db

# Use indexes for better performance
# Indexes are already configured in schema.sql
```

---

## 🎉 **Success Indicators**

**You have successfully set up Affiliate Boss locally when:**

✅ **Server Starts**: `npm run dev` starts without errors  
✅ **API Works**: `curl http://localhost:3000/api/health` returns success  
✅ **Frontend Loads**: Browser shows professional dashboard  
✅ **Database Active**: Demo data appears in dashboard  
✅ **Navigation Works**: All menu sections load properly  
✅ **Features Function**: Links, commissions, analytics all work  
✅ **No Console Errors**: Browser console is clean  

**🎯 Your affiliate marketing platform is now running locally and ready for development!**

---

## 📞 **Need Help?**

### **Quick Fixes**
1. **Restart everything**: `npm run dev`
2. **Reset database**: `npm run db:reset`  
3. **Reinstall deps**: `rm -rf node_modules && npm install`
4. **Check ports**: `netstat -tulpn | grep :3000`
5. **Update Node**: Ensure Node.js v18+

### **Documentation**
- **Project README**: `README.md`
- **API Documentation**: Check individual files in `api/` directory
- **Database Schema**: `database/schema.sql`

### **Useful Commands**
```bash
# Show all npm scripts
npm run

# Show project info  
npm info

# Show dependency tree
npm list

# Check for updates
npm outdated
```

**Happy coding! 🚀 Your affiliate empire awaits!**