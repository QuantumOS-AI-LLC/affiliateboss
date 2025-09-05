# 🌳 **Affiliate Boss - Branch Guide**

## 📋 **Available Branches**

### **🚀 vite-express** (Recommended for Development)
**Simple, Fast, Modern Setup**

```bash
git checkout vite-express
npm install
npm run dev
# ✅ Frontend: http://localhost:3000 (Vite + hot reload)
# ✅ API: http://localhost:3001 (Express server)
```

**Benefits:**
- ✅ **Lightning fast** - Vite dev server with hot module replacement
- ✅ **Simple architecture** - Vite frontend + Express backend
- ✅ **Easy debugging** - Standard Node.js development
- ✅ **Flexible deployment** - Multiple hosting options
- ✅ **No complexity** - No serverless abstractions

**Perfect for:**
- Local development and testing
- Developers who want simplicity
- Fast iteration and prototyping
- Standard Node.js deployment

---

### **⚡ main** (Vercel Serverless)
**Production Serverless Setup**

```bash
git checkout main
npm install
vercel dev
# ✅ Serverless functions simulation
# ✅ Vercel deployment ready
```

**Benefits:**
- ✅ **Serverless architecture** - Auto-scaling, pay-per-use
- ✅ **Vercel optimized** - Deploy directly to Vercel
- ✅ **Edge deployment** - Global CDN distribution
- ✅ **Zero maintenance** - No server management

**Perfect for:**
- Production deployment on Vercel
- Serverless architecture preference
- Auto-scaling requirements
- Global edge distribution

---

## 🎯 **Which Branch to Choose?**

### **For Local Development: `vite-express`**
```bash
# Clone and switch to vite-express branch
git clone https://github.com/QuantumOS-AI-LLC/affiliateboss.git
cd affiliateboss
git checkout vite-express
npm install
npm run dev

# Start coding immediately with hot reload!
```

**Why choose vite-express for development:**
- 🚀 **Fastest setup** - 30 seconds from clone to running
- ⚡ **Hot reload** - Instant feedback as you code
- 🔧 **Easy debugging** - Use Chrome DevTools, VS Code debugger
- 📦 **Simple deployment** - Works on any Node.js host

### **For Vercel Production: `main`**
```bash
# For Vercel deployment
git checkout main
vercel --prod

# Serverless functions deployed globally
```

**Why choose main for production:**
- 🌍 **Global CDN** - Edge deployment worldwide
- 📈 **Auto-scaling** - Handles traffic spikes automatically
- 💰 **Cost efficient** - Pay only for usage
- 🔒 **Zero maintenance** - No server management

---

## 🔄 **Switching Between Branches**

### **Switch to Vite + Express:**
```bash
git checkout vite-express
npm install
npm run dev
```

### **Switch to Vercel Serverless:**
```bash
git checkout main
npm install
vercel dev
```

### **Compare Branches:**
```bash
# See differences between branches
git diff main..vite-express

# List all branches
git branch -a
```

---

## 📊 **Feature Comparison**

| Feature | vite-express | main |
|---------|-------------|------|
| **Setup Time** | 30 seconds | 2 minutes |
| **Hot Reload** | ✅ Instant | ❌ Manual refresh |
| **Debugging** | ✅ Standard Node.js | ⚠️ Serverless limitations |
| **Local Development** | ✅ Simple | ⚠️ Simulation |
| **Deployment** | ✅ Flexible | ✅ Vercel optimized |
| **Scaling** | Manual | ✅ Auto-scaling |
| **Cost** | Server cost | Pay-per-use |

---

## 🛠️ **Development Workflow**

### **Recommended Workflow:**
1. **Develop on `vite-express`** - Fast iteration with hot reload
2. **Test locally** - Full functionality with real database
3. **Deploy to production** - Choose deployment target:
   - **Vercel**: Merge to `main` and deploy
   - **Other hosts**: Deploy `vite-express` directly

### **Example Development Flow:**
```bash
# Start development
git checkout vite-express
npm run dev

# Make changes with instant feedback
# Edit files in public/ or server/
# Changes appear immediately

# Ready for production?
# Option 1: Deploy vite-express to any Node.js host
npm run build
# Deploy dist/ + server/api.js

# Option 2: Merge to main for Vercel deployment
git checkout main
git merge vite-express
vercel --prod
```

---

## 🚀 **Deployment Options by Branch**

### **vite-express Branch Deployment:**

**Option 1: Static + API (Recommended)**
```bash
# Build frontend
npm run build

# Deploy:
# - Upload dist/ to Netlify/Vercel/GitHub Pages
# - Deploy server/api.js to Railway/Heroku/VPS
```

**Option 2: Full Stack**
```bash
# Deploy both to same server
# Examples: Railway, Heroku, DigitalOcean, VPS

# Dockerfile example:
FROM node:18
COPY . .
RUN npm install && npm run build
EXPOSE 3001
CMD ["node", "server/api.js"]
```

**Option 3: PM2 on VPS**
```bash
# On your server:
npm install -g pm2
npm run build
pm2 start server/api.js --name affiliate-boss
pm2 startup
pm2 save
```

### **main Branch Deployment:**
```bash
# Simple Vercel deployment
vercel --prod

# Or auto-deploy via GitHub integration
# Push to main → auto-deploy to Vercel
```

---

## 📚 **Documentation by Branch**

### **vite-express Branch:**
- **[VITE-SETUP.md](VITE-SETUP.md)** - Complete Vite + Express setup guide
- **[LOCAL-SETUP.md](LOCAL-SETUP.md)** - Comprehensive development guide

### **main Branch:**
- **[README.md](README.md)** - Main project documentation
- **[LOCAL-SETUP.md](LOCAL-SETUP.md)** - Vercel setup instructions

---

## 💡 **Pro Tips**

### **Branch Management:**
```bash
# Keep branches in sync
git checkout vite-express
git pull origin vite-express

git checkout main
git pull origin main

# Share features between branches
git checkout vite-express
# Make feature changes
git checkout main
git cherry-pick <commit-hash>
```

### **Development Best Practices:**
1. **Develop on vite-express** - Better development experience
2. **Test on both branches** - Ensure compatibility
3. **Deploy based on needs** - Serverless vs traditional hosting
4. **Keep branches updated** - Regular syncing

---

## 🎯 **Quick Start by Use Case**

### **"I want to start coding immediately"**
```bash
git checkout vite-express
npm install
npm run dev
# Code with hot reload!
```

### **"I want to deploy to Vercel"**
```bash
git checkout main
npm install
vercel --prod
# Serverless deployment!
```

### **"I want to understand the differences"**
```bash
# Try both branches:
git checkout vite-express && npm run dev
# vs
git checkout main && vercel dev
```

### **"I want the best of both worlds"**
```bash
# Develop on vite-express for speed
git checkout vite-express
# Deploy main branch for production
git checkout main && vercel --prod
```

---

## 🏆 **Conclusion**

**Both branches provide the same complete affiliate marketing platform with all features:**
- ✅ Complete dashboard with analytics
- ✅ Affiliate link management
- ✅ Commission tracking
- ✅ Referral system
- ✅ Marketing tools (AI, SMS, QR codes)
- ✅ Admin panel
- ✅ Database with demo data

**The difference is in development experience and deployment:**
- **`vite-express`**: Better for development, flexible deployment
- **`main`**: Better for Vercel production deployment

**Choose based on your needs and preferences! 🚀**