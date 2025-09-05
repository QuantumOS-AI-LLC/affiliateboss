# 🛠️ Troubleshooting Guide - Affiliate Boss

## 🚨 Common Issues and Solutions

### **Issue 1: "spawn npx ENOENT" Error**

**Error:**
```
Error: spawn npx ENOENT
```

**Solutions:**

#### **Option 1: Install missing dependency (Recommended)**
```bash
npm install cross-env
```

#### **Option 2: Run servers manually**
```bash
# Terminal 1 - API Server
npm run api

# Terminal 2 - Frontend Server  
npm run frontend
```

#### **Option 3: Use alternative npm script**
```bash
npm run dev:manual
# Then follow the instructions to run in separate terminals
```

#### **Option 4: Install/Fix npm and npx**
```bash
# Check if npm/npx is installed
npm --version
npx --version

# If missing, reinstall Node.js from https://nodejs.org
# Or update npm
npm install -g npm@latest
```

---

### **Issue 2: Port Already in Use**

**Error:**
```
Error: listen EADDRINUSE: address already in use
```

**Solutions:**

#### **Kill processes using ports:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

netstat -ano | findstr :3002  
taskkill /PID <PID_NUMBER> /F

# Mac/Linux
lsof -ti :3000 | xargs kill -9
lsof -ti :3002 | xargs kill -9

# Or use npx kill-port (if available)
npx kill-port 3000 3002
```

#### **Use different ports:**
```bash
# Start API on different port
API_PORT=3003 npm run api

# Start frontend on different port  
npx vite --port 3001 --host 0.0.0.0
```

---

### **Issue 3: API Calls Failing (404 or Connection Refused)**

**Problem:** Frontend can't reach API server

**Solutions:**

#### **Check if API server is running:**
```bash
# Test API directly
curl http://localhost:3002/api/health

# Or in browser visit:
http://localhost:3002/api/health
```

#### **Verify Vite proxy configuration:**
Check `vite.config.js` has correct API port:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3002', // Should match API server port
    changeOrigin: true
  }
}
```

#### **Start servers in correct order:**
```bash
# 1. Start API first
npm run api

# 2. Wait for "API server running" message

# 3. Start frontend
npm run frontend
```

---

### **Issue 4: Database Errors**

**Error:**
```
Database file not found
Error: no such table: users
```

**Solutions:**

#### **Initialize database:**
```bash
npm run init-local
```

#### **Check database file exists:**
```bash
# Should see database.db file
ls -la database.db

# If missing, recreate:
node -e "require('./lib/database').initDatabase()"
```

#### **Reset database completely:**
```bash
rm database.db
npm run init-local
```

---

### **Issue 5: Module Not Found Errors**

**Error:**
```
Cannot find module 'express'
Cannot find module 'vite'
```

**Solutions:**

#### **Reinstall dependencies:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### **Check Node.js version:**
```bash
node --version
# Should be v18 or higher

# If too old, update Node.js from https://nodejs.org
```

#### **Install specific missing packages:**
```bash
npm install express vite cors better-sqlite3
```

---

### **Issue 6: Vite Build/Development Issues**

**Error:**
```
Vite server not starting
Build errors
```

**Solutions:**

#### **Clear Vite cache:**
```bash
rm -rf node_modules/.vite
rm -rf dist
npm run build
```

#### **Check vite.config.js:**
```javascript
import { defineConfig } from 'vite'

export default defineConfig({
  root: 'public',
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: ['all'],
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true
      }
    }
  }
})
```

#### **Try manual Vite start:**
```bash
npx vite --port 3000 --host 0.0.0.0
```

---

## 🔧 **Step-by-Step Manual Setup**

If automatic setup fails, follow these manual steps:

### **1. Verify Prerequisites**
```bash
node --version    # Should be v18+
npm --version     # Should be 8+
git --version     # Should be 2+
```

### **2. Clean Installation**
```bash
# Clone fresh copy
git clone https://github.com/QuantumOS-AI-LLC/affiliateboss.git
cd affiliateboss
git checkout vite-express

# Clean install
rm -rf node_modules package-lock.json
npm install
```

### **3. Initialize Database**
```bash
npm run init-local
# Should create database.db file
```

### **4. Test Components Individually**

#### **Test Database:**
```bash
node -e "const db = require('./lib/database'); console.log('Database OK:', !!db.getDatabase())"
```

#### **Test API Server:**
```bash
npm run api
# Should show: "API server running on http://localhost:3002"
# Test: curl http://localhost:3002/api/health
```

#### **Test Frontend (in new terminal):**
```bash
npm run frontend
# Should show: "Local: http://localhost:3000"
# Visit: http://localhost:3000
```

### **5. Test Integration**
```bash
# With both servers running, test API through proxy:
curl http://localhost:3000/api/health
# Should return same as direct API call
```

---

## 🌍 **Platform-Specific Issues**

### **Windows Issues:**

#### **PowerShell Execution Policy:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### **Path Issues:**
```bash
# Use full path to npm
"C:\Program Files\nodejs\npm.cmd" run dev
```

#### **Firewall/Antivirus:**
- Allow Node.js through Windows Firewall
- Add project folder to antivirus exclusions

### **macOS Issues:**

#### **Permission Errors:**
```bash
sudo chown -R $(whoami) ~/.npm
```

#### **Port Binding Issues:**
```bash
# macOS might restrict port binding
sudo npm run dev
# Or use ports > 1024
```

### **Linux Issues:**

#### **Permission Errors:**
```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

---

## 📋 **Quick Diagnostic Commands**

Run these to diagnose issues:

```bash
# Check Node.js and npm
node --version && npm --version

# Check installed packages
npm list --depth=0

# Check if ports are free
netstat -an | grep 3000
netstat -an | grep 3002

# Check if files exist
ls -la server/api.js
ls -la public/index.html
ls -la database.db

# Check git branch
git branch --show-current

# Test database connection
node -e "console.log(require('./lib/database').getDatabase())"
```

---

## 🆘 **Still Having Issues?**

### **Get Help:**
1. **Check the error message carefully** - Often contains the exact solution
2. **Try the manual setup steps** - More reliable than automatic startup
3. **Test each component individually** - API, frontend, database
4. **Check your environment** - Node version, operating system, permissions

### **Common Working Combinations:**
```bash
# Option 1: Manual (Most Reliable)
Terminal 1: npm run api
Terminal 2: npm run frontend

# Option 2: If cross-env works
npm install cross-env
npm run dev

# Option 3: Direct commands
Terminal 1: node server/api.js
Terminal 2: npx vite --port 3000 --host 0.0.0.0
```

### **Verify Success:**
- ✅ API responds: `curl http://localhost:3002/api/health`
- ✅ Frontend loads: Visit `http://localhost:3000`
- ✅ Proxy works: `curl http://localhost:3000/api/health`
- ✅ Database works: Dashboard shows data

**If all checks pass, your Affiliate Boss platform is running correctly! 🎉**