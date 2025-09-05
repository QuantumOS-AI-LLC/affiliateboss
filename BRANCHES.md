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

---

### **⚡ main** (Vercel Serverless - Current Branch)
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

---

## 🎯 **Quick Recommendations**

### **For Development: Choose `vite-express`**
- 🚀 30-second setup with hot reload
- ⚡ Instant feedback as you code
- 🔧 Standard Node.js debugging

### **For Vercel Production: Use `main`**
- 🌍 Global edge deployment
- 📈 Automatic scaling
- 💰 Pay-per-use pricing

## 🔄 **Switch Branches**

```bash
# Switch to Vite + Express (recommended for development)
git checkout vite-express
npm install
npm run dev

# Switch back to Vercel serverless
git checkout main
npm install
vercel dev
```

**Both branches have identical features - the difference is architecture!**