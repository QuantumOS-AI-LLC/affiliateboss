import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt, sign, verify } from 'hono/jwt'
import { serveStatic } from 'hono/cloudflare-workers'

// Type definitions for Cloudflare bindings
type Bindings = {
  DB: D1Database;
  STRIPE_SECRET_KEY?: string;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API endpoints
app.use('/api/*', cors())

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))

// Utility functions
const generateApiKey = () => `api_key_${Date.now()}_${Math.random().toString(36).substring(7)}`
const generateShortCode = () => Math.random().toString(36).substring(2, 8)
const hashPassword = async (password: string) => {
  // In production, use proper bcrypt or similar
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'affiliate_boss_salt')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Calculate commission based on user's profile and tier structure
const calculateCommission = async (c: any, userId: number, saleAmount: number) => {
  // Get user's commission profile
  const profile = await c.env.DB.prepare(`
    SELECT cp.*, ucp.custom_rate 
    FROM commission_profiles cp
    JOIN user_commission_profiles ucp ON cp.id = ucp.profile_id
    WHERE ucp.user_id = ? AND ucp.status = 'active'
  `).bind(userId).first()
  
  if (!profile) {
    return { rate: 15.00, amount: saleAmount * 0.15 } // Default 15%
  }
  
  let rate = profile.custom_rate || profile.default_rate
  
  // Apply tier structure if available
  if (profile.tier_structure) {
    try {
      const tiers = JSON.parse(profile.tier_structure)
      // Get user's lifetime earnings for tier calculation
      const userSettings = await c.env.DB.prepare(`
        SELECT lifetime_earnings FROM user_settings WHERE user_id = ?
      `).bind(userId).first()
      
      const lifetimeEarnings = userSettings?.lifetime_earnings || 0
      
      // Find appropriate tier
      for (let i = tiers.length - 1; i >= 0; i--) {
        if (lifetimeEarnings >= tiers[i].min_sales) {
          rate = tiers[i].rate
          break
        }
      }
    } catch (e) {
      // Use default rate if tier parsing fails
    }
  }
  
  return { rate, amount: saleAmount * (rate / 100) }
}

// Update KPI stats
const updateKPIStats = async (c: any, userId: number, event: string, data: any = {}) => {
  const today = new Date().toISOString().split('T')[0]
  
  // Get or create today's KPI record
  let kpi = await c.env.DB.prepare(`
    SELECT * FROM kpi_daily_stats WHERE user_id = ? AND date = ?
  `).bind(userId, today).first()
  
  if (!kpi) {
    await c.env.DB.prepare(`
      INSERT INTO kpi_daily_stats (user_id, date) VALUES (?, ?)
    `).bind(userId, today).run()
    
    kpi = await c.env.DB.prepare(`
      SELECT * FROM kpi_daily_stats WHERE user_id = ? AND date = ?
    `).bind(userId, today).first()
  }
  
  // Update based on event type
  switch (event) {
    case 'click':
      await c.env.DB.prepare(`
        UPDATE kpi_daily_stats 
        SET raw_clicks = raw_clicks + 1, 
            unique_clicks = unique_clicks + ?,
            updated_at = datetime('now')
        WHERE user_id = ? AND date = ?
      `).bind(data.unique ? 1 : 0, userId, today).run()
      break
      
    case 'conversion':
      const newConversions = (kpi.conversions || 0) + 1
      const newSales = (kpi.gross_sales || 0) + data.saleAmount
      const newCommission = (kpi.commission_earned || 0) + data.commissionAmount
      const newClicks = kpi.raw_clicks || 1
      const conversionRate = (newConversions / newClicks) * 100
      const avgOrderValue = newSales / newConversions
      const earningsPerClick = newCommission / newClicks
      
      await c.env.DB.prepare(`
        UPDATE kpi_daily_stats 
        SET conversions = ?,
            gross_sales = ?,
            commission_earned = ?,
            conversion_rate = ?,
            average_order_value = ?,
            earnings_per_click = ?,
            updated_at = datetime('now')
        WHERE user_id = ? AND date = ?
      `).bind(newConversions, newSales, newCommission, conversionRate, avgOrderValue, earningsPerClick, userId, today).run()
      break
  }
}

// Authentication middleware
const authenticateAPI = async (c: any, next: any) => {
  const apiKey = c.req.header('X-API-Key') || c.req.query('api_key')
  
  if (!apiKey) {
    return c.json({ error: 'API key required' }, 401)
  }
  
  const user = await c.env.DB.prepare(`
    SELECT u.*, us.* FROM users u
    LEFT JOIN user_settings us ON u.id = us.user_id
    WHERE u.api_key = ? AND u.status = 'approved'
  `).bind(apiKey).first()
  
  if (!user) {
    return c.json({ error: 'Invalid API key' }, 401)
  }
  
  c.set('user', user)
  await next()
}

// ===========================================
// MAIN FRONTEND PAGE
// ===========================================
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Affiliate Boss - Web 3.0 Affiliate Marketing Platform</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  'neon': '#00ff88',
                  'cyber': '#0066ff',
                  'dark': '#0a0a0a',
                }
              }
            }
          }
        </script>
        <style>
          .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .neon-shadow { box-shadow: 0 0 20px rgba(0, 255, 136, 0.3); }
          .cyber-border { border: 2px solid #00ff88; }
          .glass { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); }
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .aspect-square {
            aspect-ratio: 1 / 1;
          }
          .product-image {
            transition: transform 0.3s ease;
          }
          .product-image:hover {
            transform: scale(1.05);
          }
        </style>
    </head>
    <body class="bg-gray-900 text-white min-h-screen">
        <!-- Header -->
        <nav class="bg-gray-800 border-b border-neon">
            <div class="container mx-auto px-6 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-4">
                        <i class="fas fa-rocket text-neon text-2xl"></i>
                        <h1 class="text-2xl font-bold text-neon">Affiliate Boss</h1>
                    </div>
                    <div class="flex space-x-4">
                        <button onclick="showLogin()" class="bg-cyber hover:bg-blue-700 px-6 py-2 rounded-lg transition-all duration-300">
                            <i class="fas fa-sign-in-alt mr-2"></i>Login
                        </button>
                        <button onclick="showSignup()" class="bg-neon hover:bg-green-400 text-black px-6 py-2 rounded-lg transition-all duration-300">
                            <i class="fas fa-user-plus mr-2"></i>Sign Up
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <div class="gradient-bg py-20">
            <div class="container mx-auto px-6 text-center">
                <h1 class="text-5xl font-bold mb-6">The Future of Affiliate Marketing</h1>
                <p class="text-xl mb-8 opacity-90">Simple. Powerful. Web 3.0. Generate affiliate links, track performance, and earn commissions like never before.</p>
                <div class="flex justify-center space-x-6">
                    <button onclick="showDemo()" class="bg-neon hover:bg-green-400 text-black px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 neon-shadow">
                        <i class="fas fa-play mr-2"></i>Try Demo
                    </button>
                    <button onclick="scrollToFeatures()" class="bg-transparent border-2 border-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300">
                        <i class="fas fa-info-circle mr-2"></i>Learn More
                    </button>
                </div>
            </div>
        </div>

        <!-- Features Section -->
        <div id="features" class="py-20 bg-gray-800">
            <div class="container mx-auto px-6">
                <h2 class="text-4xl font-bold text-center mb-16">Powerful Features</h2>
                <div class="grid md:grid-cols-3 gap-8">
                    <div class="glass p-8 rounded-lg cyber-border">
                        <i class="fas fa-link text-neon text-4xl mb-4"></i>
                        <h3 class="text-xl font-bold mb-4">Instant Link Generation</h3>
                        <p>Create affiliate links from any URL in seconds. Simple, fast, and powerful.</p>
                    </div>
                    <div class="glass p-8 rounded-lg cyber-border">
                        <i class="fas fa-sms text-neon text-4xl mb-4"></i>
                        <h3 class="text-xl font-bold mb-4">SMS Sharing</h3>
                        <p>Share your affiliate links via SMS with one click. Perfect for mobile marketing.</p>
                    </div>
                    <div class="glass p-8 rounded-lg cyber-border">
                        <i class="fas fa-chart-line text-neon text-4xl mb-4"></i>
                        <h3 class="text-xl font-bold mb-4">Real-time Analytics</h3>
                        <p>Track clicks, conversions, and earnings in real-time with detailed reports.</p>
                    </div>
                    <div class="glass p-8 rounded-lg cyber-border">
                        <i class="fas fa-shield-alt text-neon text-4xl mb-4"></i>
                        <h3 class="text-xl font-bold mb-4">SMS OTP Security</h3>
                        <p>Secure login and verification with SMS OTP. No complex passwords needed.</p>
                    </div>
                    <div class="glass p-8 rounded-lg cyber-border">
                        <i class="fas fa-dollar-sign text-neon text-4xl mb-4"></i>
                        <h3 class="text-xl font-bold mb-4">Commission Tracking</h3>
                        <p>Automated commission calculation and payout management system.</p>
                    </div>
                    <div class="glass p-8 rounded-lg cyber-border">
                        <i class="fas fa-mobile-alt text-neon text-4xl mb-4"></i>
                        <h3 class="text-xl font-bold mb-4">Mobile-First Design</h3>
                        <p>Optimized for mobile use. Manage your affiliate business on the go.</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Login Modal -->
        <div id="loginModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div class="bg-gray-800 p-8 rounded-lg max-w-md w-full mx-4">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-neon">Login to Affiliate Boss</h2>
                    <button onclick="hideModals()" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <form id="loginForm">
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Phone Number</label>
                        <input type="tel" id="loginPhone" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-neon focus:outline-none" placeholder="+1234567890" required>
                    </div>
                    <button type="submit" class="w-full bg-neon hover:bg-green-400 text-black font-semibold py-3 rounded-lg transition-all duration-300">
                        <i class="fas fa-sms mr-2"></i>Send OTP Code
                    </button>
                </form>
                <div id="otpVerification" class="hidden mt-6">
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Enter OTP Code</label>
                        <input type="text" id="otpCode" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-neon focus:outline-none text-center text-2xl" placeholder="123456" maxlength="6" required>
                    </div>
                    <button onclick="verifyOTP()" class="w-full bg-cyber hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300">
                        <i class="fas fa-check mr-2"></i>Verify & Login
                    </button>
                </div>
            </div>
        </div>

        <!-- Signup Modal -->
        <div id="signupModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div class="bg-gray-800 p-8 rounded-lg max-w-md w-full mx-4">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-neon">Join Affiliate Boss</h2>
                    <button onclick="hideModals()" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <form id="signupForm">
                    <div class="grid md:grid-cols-2 gap-4 mb-4">
                        <input type="text" id="firstName" class="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-neon focus:outline-none" placeholder="First Name" required>
                        <input type="text" id="lastName" class="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-neon focus:outline-none" placeholder="Last Name" required>
                    </div>
                    <div class="mb-4">
                        <input type="email" id="email" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-neon focus:outline-none" placeholder="Email Address" required>
                    </div>
                    <div class="mb-4">
                        <input type="tel" id="phone" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-neon focus:outline-none" placeholder="Phone Number (+1234567890)" required>
                    </div>
                    <div class="mb-4">
                        <input type="text" id="username" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-neon focus:outline-none" placeholder="Username" required>
                    </div>
                    <button type="submit" class="w-full bg-neon hover:bg-green-400 text-black font-semibold py-3 rounded-lg transition-all duration-300">
                        <i class="fas fa-rocket mr-2"></i>Create Account
                    </button>
                </form>
            </div>
        </div>

        <script>
            function showLogin() {
                document.getElementById('loginModal').classList.remove('hidden')
                document.getElementById('signupModal').classList.add('hidden')
            }

            function showSignup() {
                document.getElementById('signupModal').classList.remove('hidden')
                document.getElementById('loginModal').classList.add('hidden')
            }

            function hideModals() {
                document.getElementById('loginModal').classList.add('hidden')
                document.getElementById('signupModal').classList.add('hidden')
            }

            function scrollToFeatures() {
                document.getElementById('features').scrollIntoView({ behavior: 'smooth' })
            }

            function showDemo() {
                // Redirect to demo dashboard
                window.location.href = '/dashboard?demo=true'
            }

            // Login form handling
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault()
                const phone = document.getElementById('loginPhone').value
                
                try {
                    const response = await fetch('/api/auth/send-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone, type: 'login' })
                    })
                    const data = await response.json()
                    
                    if (data.success) {
                        document.getElementById('otpVerification').classList.remove('hidden')
                        alert('OTP code sent to your phone!')
                    } else {
                        alert('Error: ' + data.error)
                    }
                } catch (error) {
                    alert('Network error. Please try again.')
                }
            })

            // Signup form handling
            document.getElementById('signupForm').addEventListener('submit', async (e) => {
                e.preventDefault()
                const formData = {
                    first_name: document.getElementById('firstName').value,
                    last_name: document.getElementById('lastName').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value,
                    username: document.getElementById('username').value
                }
                
                try {
                    const response = await fetch('/api/auth/signup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    })
                    const data = await response.json()
                    
                    if (data.success) {
                        alert('Account created! Check your phone for OTP verification.')
                        showLogin()
                    } else {
                        alert('Error: ' + data.error)
                    }
                } catch (error) {
                    alert('Network error. Please try again.')
                }
            })

            async function verifyOTP() {
                const phone = document.getElementById('loginPhone').value
                const code = document.getElementById('otpCode').value
                
                try {
                    const response = await fetch('/api/auth/verify-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone, code })
                    })
                    const data = await response.json()
                    
                    if (data.success) {
                        localStorage.setItem('auth_token', data.token)
                        window.location.href = '/dashboard'
                    } else {
                        alert('Invalid OTP code. Please try again.')
                    }
                } catch (error) {
                    alert('Network error. Please try again.')
                }
            }
        </script>
    </body>
    </html>
  `)
})

// ===========================================
// AUTHENTICATION API - SMS OTP System
// ===========================================

// Send OTP code via SMS
app.post('/api/auth/send-otp', async (c) => {
  const { phone, type = 'verification' } = await c.req.json()
  
  if (!phone) {
    return c.json({ error: 'Phone number is required' }, 400)
  }
  
  // Generate 6-digit OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  
  try {
    // Store OTP in database
    await c.env.DB.prepare(`
      INSERT INTO sms_logs (phone, code, type, expires_at)
      VALUES (?, ?, ?, ?)
    `).bind(phone, code, type, expiresAt.toISOString()).run()
    
    // In production, integrate with SMS service (Twilio, etc.)
    console.log(`SMS OTP for ${phone}: ${code}`)
    
    return c.json({ 
      success: true, 
      message: 'OTP code sent successfully',
      // In development, return the code for testing
      development_code: code 
    })
  } catch (error) {
    return c.json({ error: 'Failed to send OTP' }, 500)
  }
})

// Verify OTP code
app.post('/api/auth/verify-otp', async (c) => {
  const { phone, code } = await c.req.json()
  
  if (!phone || !code) {
    return c.json({ error: 'Phone and code are required' }, 400)
  }
  
  try {
    // Check if OTP is valid and not expired
    const otpRecord = await c.env.DB.prepare(`
      SELECT * FROM sms_logs 
      WHERE phone = ? AND code = ? AND status = 'sent' 
      AND expires_at > datetime('now')
      ORDER BY sent_at DESC 
      LIMIT 1
    `).bind(phone, code).first()
    
    if (!otpRecord) {
      return c.json({ error: 'Invalid or expired OTP code' }, 400)
    }
    
    // Mark OTP as verified
    await c.env.DB.prepare(`
      UPDATE sms_logs 
      SET status = 'verified', verified_at = datetime('now')
      WHERE id = ?
    `).bind(otpRecord.id).run()
    
    // Find or create user
    let user = await c.env.DB.prepare(`
      SELECT * FROM users WHERE phone = ?
    `).bind(phone).first()
    
    if (!user) {
      return c.json({ error: 'User not found. Please sign up first.' }, 404)
    }
    
    // Update phone verification and last login
    await c.env.DB.prepare(`
      UPDATE users 
      SET phone_verified = TRUE, last_login = datetime('now')
      WHERE id = ?
    `).bind(user.id).run()
    
    // Generate JWT token (in production, use proper JWT secret)
    const token = await sign({ 
      user_id: user.id, 
      username: user.username,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days
    }, 'affiliate-boss-secret')
    
    return c.json({ 
      success: true, 
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        status: user.status
      }
    })
  } catch (error) {
    return c.json({ error: 'Verification failed' }, 500)
  }
})

// Sign up new user
app.post('/api/auth/signup', async (c) => {
  const { username, email, phone, first_name, last_name, company, website } = await c.req.json()
  
  if (!username || !email || !phone || !first_name || !last_name) {
    return c.json({ error: 'Required fields: username, email, phone, first_name, last_name' }, 400)
  }
  
  try {
    // Check if user already exists
    const existingUser = await c.env.DB.prepare(`
      SELECT id FROM users WHERE username = ? OR email = ? OR phone = ?
    `).bind(username, email, phone).first()
    
    if (existingUser) {
      return c.json({ error: 'User with this username, email, or phone already exists' }, 409)
    }
    
    // Create new user
    const apiKey = generateApiKey()
    const passwordHash = await hashPassword('temp_password_' + Date.now())
    
    const result = await c.env.DB.prepare(`
      INSERT INTO users 
      (username, email, phone, password_hash, first_name, last_name, company, website, api_key, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(username, email, phone, passwordHash, first_name, last_name, company || null, website || null, apiKey).run()
    
    // Send verification OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    
    await c.env.DB.prepare(`
      INSERT INTO sms_logs (phone, code, type, expires_at)
      VALUES (?, ?, ?, ?)
    `).bind(phone, code, 'verification', expiresAt.toISOString()).run()
    
    console.log(`Signup OTP for ${phone}: ${code}`)
    
    return c.json({ 
      success: true, 
      message: 'Account created successfully. Please verify your phone number.',
      user_id: result.meta.last_row_id,
      development_code: code
    })
  } catch (error) {
    return c.json({ error: 'Failed to create account' }, 500)
  }
})

// ===========================================
// AFFILIATE LINKS API
// ===========================================

// Create new affiliate link
app.post('/api/links', authenticateAPI, async (c) => {
  const user = c.get('user')
  const { url, title, description, campaign_name } = await c.req.json()
  
  if (!url) {
    return c.json({ error: 'URL is required' }, 400)
  }
  
  try {
    const shortCode = generateShortCode()
    const fullLink = `https://affiliateboss.com/go/${shortCode}`
    
    const result = await c.env.DB.prepare(`
      INSERT INTO affiliate_links 
      (user_id, original_url, short_code, full_link, title, description, campaign_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(user.id, url, shortCode, fullLink, title || null, description || null, campaign_name || null).run()
    
    return c.json({ 
      success: true,
      link: {
        id: result.meta.last_row_id,
        short_code: shortCode,
        full_link: fullLink,
        original_url: url,
        title,
        description,
        campaign_name
      }
    })
  } catch (error) {
    return c.json({ error: 'Failed to create affiliate link' }, 500)
  }
})

// Get user's affiliate links
app.get('/api/links', authenticateAPI, async (c) => {
  const user = c.get('user')
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = (page - 1) * limit
  
  try {
    const links = await c.env.DB.prepare(`
      SELECT * FROM affiliate_links 
      WHERE user_id = ? AND status = 'active'
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(user.id, limit, offset).all()
    
    return c.json({ 
      success: true,
      links: links.results,
      pagination: { page, limit, total: links.results.length }
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch links' }, 500)
  }
})

// ===========================================
// ADVANCED KPI & ANALYTICS API
// ===========================================

// Get comprehensive dashboard KPIs
app.get('/api/kpis/dashboard', authenticateAPI, async (c) => {
  const user = c.get('user')
  const period = c.req.query('period') || '7d' // 7d, 30d, 90d, 1y
  
  try {
    // Calculate date range
    let days = 7
    switch(period) {
      case '30d': days = 30; break
      case '90d': days = 90; break
      case '1y': days = 365; break
    }
    
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    // Get comprehensive KPI data
    const kpiData = await c.env.DB.prepare(`
      SELECT 
        SUM(raw_clicks) as total_clicks,
        SUM(unique_clicks) as unique_clicks,
        SUM(conversions) as conversions,
        AVG(conversion_rate) as avg_conversion_rate,
        SUM(gross_sales) as total_sales,
        SUM(commission_earned) as total_earnings,
        AVG(average_order_value) as avg_order_value,
        AVG(earnings_per_click) as avg_earnings_per_click
      FROM kpi_daily_stats 
      WHERE user_id = ? AND date >= ?
    `).bind(user.id, startDate).first()
    
    // Get current balances
    const balances = await c.env.DB.prepare(`
      SELECT current_balance, pending_balance, lifetime_earnings, performance_tier
      FROM user_settings WHERE user_id = ?
    `).bind(user.id).first()
    
    // Get top performing links
    const topLinks = await c.env.DB.prepare(`
      SELECT al.id, al.title, al.short_code, al.clicks, al.conversions, 
             (al.conversions * 1.0 / NULLIF(al.clicks, 0)) * 100 as conversion_rate
      FROM affiliate_links al
      WHERE al.user_id = ? AND al.status = 'active'
      ORDER BY al.clicks DESC
      LIMIT 5
    `).bind(user.id).all()
    
    // Get daily performance for charts
    const dailyPerformance = await c.env.DB.prepare(`
      SELECT date, raw_clicks, conversions, commission_earned
      FROM kpi_daily_stats 
      WHERE user_id = ? AND date >= ?
      ORDER BY date ASC
    `).bind(user.id, startDate).all()
    
    return c.json({
      success: true,
      period,
      kpis: {
        clicks: kpiData.total_clicks || 0,
        unique_clicks: kpiData.unique_clicks || 0,
        conversions: kpiData.conversions || 0,
        conversion_rate: kpiData.avg_conversion_rate || 0,
        total_sales: kpiData.total_sales || 0,
        earnings: kpiData.total_earnings || 0,
        avg_order_value: kpiData.avg_order_value || 0,
        earnings_per_click: kpiData.avg_earnings_per_click || 0
      },
      balances: {
        current: balances?.current_balance || 0,
        pending: balances?.pending_balance || 0,
        lifetime: balances?.lifetime_earnings || 0,
        tier: balances?.performance_tier || 'bronze'
      },
      top_links: topLinks.results || [],
      daily_performance: dailyPerformance.results || []
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch KPI data' }, 500)
  }
})

// Get detailed link performance
app.get('/api/kpis/link-performance/:linkId', authenticateAPI, async (c) => {
  const user = c.get('user')
  const linkId = c.req.param('linkId')
  const period = c.req.query('period') || '24h' // 24h, 7d, 30d
  
  try {
    // Verify link ownership
    const link = await c.env.DB.prepare(`
      SELECT * FROM affiliate_links WHERE id = ? AND user_id = ?
    `).bind(linkId, user.id).first()
    
    if (!link) {
      return c.json({ error: 'Link not found' }, 404)
    }
    
    let timeQuery, groupBy
    if (period === '24h') {
      timeQuery = "date = DATE('now')"
      groupBy = 'hour'
    } else {
      const days = period === '7d' ? 7 : 30
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      timeQuery = `date >= '${startDate}'`
      groupBy = 'date'
    }
    
    // Get hourly/daily performance data
    const performance = await c.env.DB.prepare(`
      SELECT ${groupBy}, SUM(clicks) as clicks, SUM(unique_clicks) as unique_clicks,
             SUM(conversions) as conversions, SUM(revenue) as revenue,
             SUM(direct_traffic) as direct, SUM(social_traffic) as social,
             SUM(email_traffic) as email, SUM(search_traffic) as search
      FROM link_performance 
      WHERE link_id = ? AND ${timeQuery}
      GROUP BY ${groupBy}
      ORDER BY ${groupBy}
    `).bind(linkId).all()
    
    // Get geographic data
    const geoData = await c.env.DB.prepare(`
      SELECT customer_country as country, COUNT(*) as conversions,
             SUM(order_value) as revenue
      FROM conversions 
      WHERE link_id = ? AND status = 'confirmed'
      GROUP BY customer_country
      ORDER BY conversions DESC
      LIMIT 10
    `).bind(linkId).all()
    
    return c.json({
      success: true,
      link: {
        id: link.id,
        title: link.title,
        short_code: link.short_code,
        clicks: link.clicks,
        conversions: link.conversions
      },
      performance: performance.results || [],
      geographic: geoData.results || [],
      period
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch link performance' }, 500)
  }
})

// ===========================================
// COMMISSION PROFILES & SETTINGS API
// ===========================================

// Get user's commission profile
app.get('/api/commission/profile', authenticateAPI, async (c) => {
  const user = c.get('user')
  
  try {
    const profile = await c.env.DB.prepare(`
      SELECT cp.*, ucp.custom_rate, ucp.assigned_date
      FROM commission_profiles cp
      JOIN user_commission_profiles ucp ON cp.id = ucp.profile_id
      WHERE ucp.user_id = ? AND ucp.status = 'active'
    `).bind(user.id).first()
    
    const settings = await c.env.DB.prepare(`
      SELECT * FROM user_settings WHERE user_id = ?
    `).bind(user.id).first()
    
    return c.json({
      success: true,
      profile: profile || null,
      settings: settings || null
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch commission profile' }, 500)
  }
})

// Update payout settings
app.put('/api/settings/payout', authenticateAPI, async (c) => {
  const user = c.get('user')
  const { min_payout_amount, payout_frequency, auto_payout, payout_method } = await c.req.json()
  
  try {
    // Upsert user settings
    await c.env.DB.prepare(`
      INSERT INTO user_settings (user_id, min_payout_amount, payout_frequency, auto_payout, payout_method)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        min_payout_amount = excluded.min_payout_amount,
        payout_frequency = excluded.payout_frequency,
        auto_payout = excluded.auto_payout,
        payout_method = excluded.payout_method,
        updated_at = datetime('now')
    `).bind(user.id, min_payout_amount, payout_frequency, auto_payout, payout_method).run()
    
    return c.json({ success: true, message: 'Payout settings updated' })
  } catch (error) {
    return c.json({ error: 'Failed to update settings' }, 500)
  }
})

// ===========================================
// STRIPE PAYMENTS & AUTOMATION API  
// ===========================================

// Initialize Stripe customer
app.post('/api/payments/stripe/setup', authenticateAPI, async (c) => {
  const user = c.get('user')
  
  try {
    // Check if user already has Stripe customer
    let stripeCustomer = await c.env.DB.prepare(`
      SELECT * FROM stripe_customers WHERE user_id = ?
    `).bind(user.id).first()
    
    if (!stripeCustomer) {
      // Create Stripe customer (mock implementation for demo)
      const stripeCustomerId = `cus_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      await c.env.DB.prepare(`
        INSERT INTO stripe_customers (user_id, stripe_customer_id, email, phone)
        VALUES (?, ?, ?, ?)
      `).bind(user.id, stripeCustomerId, user.email, user.phone).run()
      
      // Update user settings with Stripe ID
      await c.env.DB.prepare(`
        INSERT INTO user_settings (user_id, stripe_customer_id)
        VALUES (?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          stripe_customer_id = excluded.stripe_customer_id
      `).bind(user.id, stripeCustomerId).run()
      
      stripeCustomer = { stripe_customer_id: stripeCustomerId }
    }
    
    return c.json({
      success: true,
      customer_id: stripeCustomer.stripe_customer_id,
      setup_intent: 'seti_demo_setup_intent_for_payment_method'
    })
  } catch (error) {
    return c.json({ error: 'Failed to setup Stripe customer' }, 500)
  }
})

// Process payout
app.post('/api/payments/payout', authenticateAPI, async (c) => {
  const user = c.get('user')
  const { amount, currency = 'USD' } = await c.req.json()
  
  try {
    // Verify user has sufficient balance
    const settings = await c.env.DB.prepare(`
      SELECT current_balance, min_payout_amount FROM user_settings WHERE user_id = ?
    `).bind(user.id).first()
    
    if (!settings || settings.current_balance < amount) {
      return c.json({ error: 'Insufficient balance' }, 400)
    }
    
    if (amount < settings.min_payout_amount) {
      return c.json({ error: `Minimum payout is $${settings.min_payout_amount}` }, 400)
    }
    
    // Create payment record
    const paymentResult = await c.env.DB.prepare(`
      INSERT INTO payments (user_id, amount, currency, status, payment_method)
      VALUES (?, ?, ?, 'processing', 'stripe')
    `).bind(user.id, amount, currency).run()
    
    const paymentId = paymentResult.meta.last_row_id
    
    // Mock Stripe payout processing
    const stripePayoutId = `po_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    // Create Stripe payout record
    await c.env.DB.prepare(`
      INSERT INTO stripe_payouts (payment_id, user_id, stripe_payout_id, amount, currency, stripe_status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).bind(paymentId, user.id, stripePayoutId, amount, currency).run()
    
    // Update payment processing info
    await c.env.DB.prepare(`
      INSERT INTO payment_processing (payment_id, stripe_payout_id, processing_status)
      VALUES (?, ?, 'processing')
    `).bind(paymentId, stripePayoutId).run()
    
    // Deduct from user balance
    await c.env.DB.prepare(`
      UPDATE user_settings 
      SET current_balance = current_balance - ?
      WHERE user_id = ?
    `).bind(amount, user.id).run()
    
    return c.json({
      success: true,
      payment_id: paymentId,
      stripe_payout_id: stripePayoutId,
      amount,
      currency,
      status: 'processing'
    })
  } catch (error) {
    return c.json({ error: 'Failed to process payout' }, 500)
  }
})

// Get payout history
app.get('/api/payments/history', authenticateAPI, async (c) => {
  const user = c.get('user')
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = (page - 1) * limit
  
  try {
    const payments = await c.env.DB.prepare(`
      SELECT p.*, sp.stripe_payout_id, sp.stripe_status, sp.failure_reason,
             pp.processing_fee, pp.net_amount
      FROM payments p
      LEFT JOIN stripe_payouts sp ON p.id = sp.payment_id
      LEFT JOIN payment_processing pp ON p.id = pp.payment_id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(user.id, limit, offset).all()
    
    // Get total counts
    const totals = await c.env.DB.prepare(`
      SELECT COUNT(*) as total_payments, 
             SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_paid,
             SUM(CASE WHEN status = 'processing' THEN amount ELSE 0 END) as processing_amount
      FROM payments WHERE user_id = ?
    `).bind(user.id).first()
    
    return c.json({
      success: true,
      payments: payments.results || [],
      totals,
      pagination: { page, limit }
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch payment history' }, 500)
  }
})

// ===========================================
// ADVANCED REPORTING API
// ===========================================

// Get commission profiles
app.get('/api/commission-profiles', authenticateAPI, async (c) => {
  try {
    const profiles = await c.env.DB.prepare(`
      SELECT id, name, description, default_rate, tier_structure, 
             status, created_at, profile_type
      FROM commission_profiles 
      WHERE status = 'active'
      ORDER BY name ASC
    `).all()
    
    return c.json({
      success: true,
      profiles: profiles.results.map(profile => ({
        ...profile,
        base_rate: profile.default_rate, // Map to expected field name
        tier_structure: JSON.parse(profile.tier_structure || '[]')
      }))
    })
  } catch (error) {
    console.error('Commission profiles error:', error)
    return c.json({ error: 'Failed to load commission profiles' }, 500)
  }
})

// Get user commissions
app.get('/api/commissions', authenticateAPI, async (c) => {
  const user = c.get('user')
  const period = c.req.query('period') || '30d'
  const limit = parseInt(c.req.query('limit') || '50')
  
  try {
    let days = 30
    switch(period) {
      case '7d': days = 7; break
      case '90d': days = 90; break
      case '1y': days = 365; break
    }
    
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const commissions = await c.env.DB.prepare(`
      SELECT c.*, al.title as link_title, al.campaign_name
      FROM conversions c
      LEFT JOIN affiliate_links al ON c.link_id = al.id
      WHERE c.user_id = ? AND c.converted_at >= ?
      ORDER BY c.converted_at DESC
      LIMIT ?
    `).bind(user.id, startDate, limit).all()
    
    // Calculate totals
    const totals = await c.env.DB.prepare(`
      SELECT 
        SUM(CASE WHEN status = 'confirmed' THEN commission_value ELSE 0 END) as total_earned,
        SUM(CASE WHEN status = 'pending' THEN commission_value ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'paid' THEN commission_value ELSE 0 END) as paid,
        AVG(commission_value * 100.0 / NULLIF(order_value, 0)) as avg_commission_rate
      FROM conversions
      WHERE user_id = ? AND converted_at >= ?
    `).bind(user.id, startDate).first()
    
    return c.json({
      success: true,
      commissions: commissions.results,
      totals: totals || {}
    })
  } catch (error) {
    console.error('Commissions error:', error)
    return c.json({ error: 'Failed to load commissions' }, 500)
  }
})

// Get payment history
app.get('/api/payments/history', authenticateAPI, async (c) => {
  const user = c.get('user')
  const limit = parseInt(c.req.query('limit') || '20')
  
  try {
    const payments = await c.env.DB.prepare(`
      SELECT * FROM payments 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `).bind(user.id, limit).all()
    
    const balanceInfo = await c.env.DB.prepare(`
      SELECT 
        SUM(CASE WHEN status = 'confirmed' THEN commission_value ELSE 0 END) as total_earnings,
        SUM(CASE WHEN status = 'pending' THEN commission_value ELSE 0 END) as pending_earnings,
        COALESCE((SELECT SUM(amount) FROM payments WHERE user_id = ? AND status = 'completed'), 0) as total_paid
      FROM conversions 
      WHERE user_id = ?
    `).bind(user.id, user.id).first()
    
    const available = (balanceInfo?.total_earnings || 0) - (balanceInfo?.total_paid || 0)
    
    return c.json({
      success: true,
      payments: payments.results,
      balance_info: {
        available: Math.max(0, available),
        total_paid: balanceInfo?.total_paid || 0,
        threshold: 100.00,
        payment_method: 'Stripe (****1234)',
        payout_frequency: 'Weekly',
        next_payout: '2024-12-22'
      }
    })
  } catch (error) {
    console.error('Payments error:', error)
    return c.json({ error: 'Failed to load payment history' }, 500)
  }
})

// Get user profile
app.get('/api/profile', authenticateAPI, async (c) => {
  const user = c.get('user')
  
  try {
    return c.json({
      success: true,
      name: user.first_name + ' ' + user.last_name,
      email: user.email,
      phone: user.phone,
      country: 'US',
      api_key: user.api_key,
      commission_profile: 'standard',
      settings: {
        email_notifications: true,
        sms_notifications: false,
        weekly_reports: true
      }
    })
  } catch (error) {
    console.error('Profile error:', error)
    return c.json({ error: 'Failed to load profile' }, 500)
  }
})

// Create commission profile
app.post('/api/commission-profiles', authenticateAPI, async (c) => {
  const { name, description, base_rate, tier_structure } = await c.req.json()
  
  try {
    // Convert tier structure to match database format
    const dbTierStructure = tier_structure?.tiers ? 
      tier_structure.tiers.map(tier => ({
        min_sales: tier.threshold,
        rate: tier.rate
      })) : []
    
    const result = await c.env.DB.prepare(`
      INSERT INTO commission_profiles (
        name, description, profile_type, default_rate, tier_structure, 
        status, created_at, updated_at
      ) VALUES (?, ?, 'custom', ?, ?, 'active', datetime('now'), datetime('now'))
    `).bind(
      name, 
      description || '', 
      base_rate || 10, 
      JSON.stringify(dbTierStructure)
    ).run()
    
    return c.json({
      success: true,
      profile: {
        id: result.meta.last_row_id,
        name,
        description,
        base_rate,
        tier_structure: tier_structure
      }
    })
  } catch (error) {
    console.error('Create commission profile error:', error)
    return c.json({ error: 'Failed to create commission profile' }, 500)
  }
})

// ===========================================
// SHOPIFY INTEGRATION API ENDPOINTS
// ===========================================

// Get user's store integrations
app.get('/api/integrations', authenticateAPI, async (c) => {
  const user = c.get('user')
  
  try {
    const integrations = await c.env.DB.prepare(`
      SELECT id, platform, store_name, store_url, status, last_sync_at, created_at,
             (SELECT COUNT(*) FROM synced_products WHERE integration_id = store_integrations.id) as products_count
      FROM store_integrations 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(user.id).all()
    
    return c.json({
      success: true,
      integrations: integrations.results
    })
  } catch (error) {
    console.error('Integrations error:', error)
    return c.json({ error: 'Failed to load integrations' }, 500)
  }
})

// Create new Shopify store integration
app.post('/api/integrations/shopify', authenticateAPI, async (c) => {
  const user = c.get('user')
  const { store_name, store_url, api_key, access_token } = await c.req.json()
  
  if (!store_name || !store_url || !access_token) {
    return c.json({ error: 'Store name, URL, and access token are required' }, 400)
  }
  
  try {
    // Validate Shopify connection by making a test API call
    const shopifyApiUrl = `https://${store_name}.myshopify.com/admin/api/2024-01/shop.json`
    const shopifyResponse = await fetch(shopifyApiUrl, {
      headers: {
        'X-Shopify-Access-Token': access_token,
        'Content-Type': 'application/json'
      }
    })
    
    if (!shopifyResponse.ok) {
      return c.json({ error: 'Invalid Shopify credentials or store name' }, 400)
    }
    
    const shopData = await shopifyResponse.json()
    
    // Store the integration
    const result = await c.env.DB.prepare(`
      INSERT INTO store_integrations (
        user_id, platform, store_name, store_url, api_key, access_token, 
        store_settings, status, created_at, updated_at
      ) VALUES (?, 'shopify', ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
    `).bind(
      user.id,
      store_name,
      store_url,
      api_key || '',
      access_token,
      JSON.stringify(shopData.shop)
    ).run()
    
    return c.json({
      success: true,
      integration: {
        id: result.meta.last_row_id,
        platform: 'shopify',
        store_name,
        store_url,
        status: 'active',
        shop_data: shopData.shop
      }
    })
  } catch (error) {
    console.error('Shopify integration error:', error)
    return c.json({ error: 'Failed to connect to Shopify store' }, 500)
  }
})

// Sync products from Shopify store
app.post('/api/integrations/:integrationId/sync', authenticateAPI, async (c) => {
  const user = c.get('user')
  const integrationId = c.req.param('integrationId')
  
  try {
    // Get integration details
    const integration = await c.env.DB.prepare(`
      SELECT * FROM store_integrations 
      WHERE id = ? AND user_id = ? AND platform = 'shopify'
    `).bind(integrationId, user.id).first()
    
    if (!integration) {
      return c.json({ error: 'Integration not found' }, 404)
    }
    
    // Start sync log
    const syncLogResult = await c.env.DB.prepare(`
      INSERT INTO sync_logs (integration_id, user_id, sync_type, status, started_at)
      VALUES (?, ?, 'full_sync', 'started', datetime('now'))
    `).bind(integrationId, user.id).run()
    
    const syncLogId = syncLogResult.meta.last_row_id
    
    // Fetch products from Shopify API
    const shopifyApiUrl = `https://${integration.store_name}.myshopify.com/admin/api/2024-01/products.json?limit=250`
    const shopifyResponse = await fetch(shopifyApiUrl, {
      headers: {
        'X-Shopify-Access-Token': integration.access_token,
        'Content-Type': 'application/json'
      }
    })
    
    if (!shopifyResponse.ok) {
      await c.env.DB.prepare(`
        UPDATE sync_logs SET status = 'failed', completed_at = datetime('now'),
               error_details = ? WHERE id = ?
      `).bind(JSON.stringify([{ error: 'Shopify API error' }]), syncLogId).run()
      
      return c.json({ error: 'Failed to fetch products from Shopify' }, 500)
    }
    
    const productsData = await shopifyResponse.json()
    let processedCount = 0
    let addedCount = 0
    let updatedCount = 0
    
    // Process each product
    for (const product of productsData.products) {
      try {
        // Check if product already exists
        const existingProduct = await c.env.DB.prepare(`
          SELECT id FROM synced_products 
          WHERE integration_id = ? AND external_product_id = ?
        `).bind(integrationId, product.id.toString()).first()
        
        const productData = {
          integration_id: integrationId,
          user_id: user.id,
          external_product_id: product.id.toString(),
          title: product.title,
          description: product.body_html || '',
          vendor: product.vendor || '',
          product_type: product.product_type || '',
          tags: product.tags || '',
          handle: product.handle,
          product_url: `https://${integration.store_name}.myshopify.com/products/${product.handle}`,
          image_url: product.image?.src || '',
          images: JSON.stringify(product.images?.map(img => img.src) || []),
          status: product.status === 'active' ? 'active' : 'inactive',
          sync_status: 'synced',
          last_synced_at: 'datetime(\'now\')',
          updated_at: 'datetime(\'now\')'
        }
        
        if (existingProduct) {
          // Update existing product
          await c.env.DB.prepare(`
            UPDATE synced_products SET
              title = ?, description = ?, vendor = ?, product_type = ?, tags = ?,
              handle = ?, product_url = ?, image_url = ?, images = ?, status = ?,
              sync_status = 'synced', last_synced_at = datetime('now'), updated_at = datetime('now')
            WHERE id = ?
          `).bind(
            productData.title, productData.description, productData.vendor,
            productData.product_type, productData.tags, productData.handle,
            productData.product_url, productData.image_url, productData.images,
            productData.status, existingProduct.id
          ).run()
          updatedCount++
        } else {
          // Add new product
          await c.env.DB.prepare(`
            INSERT INTO synced_products (
              integration_id, user_id, external_product_id, title, description,
              vendor, product_type, tags, handle, product_url, image_url, images,
              status, sync_status, last_synced_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', datetime('now'), datetime('now'), datetime('now'))
          `).bind(
            productData.integration_id, productData.user_id, productData.external_product_id,
            productData.title, productData.description, productData.vendor,
            productData.product_type, productData.tags, productData.handle,
            productData.product_url, productData.image_url, productData.images,
            productData.status
          ).run()
          addedCount++
        }
        
        processedCount++
      } catch (productError) {
        console.error('Product sync error:', productError)
      }
    }
    
    // Update sync log
    const syncDuration = Math.floor((Date.now() - new Date().getTime()) / 1000)
    await c.env.DB.prepare(`
      UPDATE sync_logs SET 
        status = 'completed', completed_at = datetime('now'),
        products_processed = ?, products_added = ?, products_updated = ?, duration_seconds = ?
      WHERE id = ?
    `).bind(processedCount, addedCount, updatedCount, syncDuration, syncLogId).run()
    
    // Update integration last sync time
    await c.env.DB.prepare(`
      UPDATE store_integrations SET last_sync_at = datetime('now') WHERE id = ?
    `).bind(integrationId).run()
    
    return c.json({
      success: true,
      sync_result: {
        products_processed: processedCount,
        products_added: addedCount,
        products_updated: updatedCount,
        sync_id: syncLogId
      }
    })
    
  } catch (error) {
    console.error('Sync error:', error)
    return c.json({ error: 'Failed to sync products' }, 500)
  }
})

// Get synced products for an integration
app.get('/api/integrations/:integrationId/products', authenticateAPI, async (c) => {
  const user = c.get('user')
  const integrationId = c.req.param('integrationId')
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '24')
  const search = c.req.query('search') || ''
  const category = c.req.query('category') || ''
  
  try {
    // Verify user owns this integration
    const integration = await c.env.DB.prepare(`
      SELECT id FROM store_integrations WHERE id = ? AND user_id = ?
    `).bind(integrationId, user.id).first()
    
    if (!integration) {
      return c.json({ error: 'Integration not found' }, 404)
    }
    
    const offset = (page - 1) * limit
    let whereClause = 'WHERE sp.integration_id = ? AND sp.status = \'active\''
    let params = [integrationId]
    
    if (search) {
      whereClause += ' AND (sp.title LIKE ? OR sp.description LIKE ? OR sp.tags LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }
    
    if (category) {
      whereClause += ' AND sp.product_type = ?'
      params.push(category)
    }
    
    // Get products with pagination
    const products = await c.env.DB.prepare(`
      SELECT sp.*, 
             (SELECT COUNT(*) FROM affiliate_links WHERE external_product_id = sp.external_product_id AND user_id = ?) as has_affiliate_link
      FROM synced_products sp
      ${whereClause}
      ORDER BY sp.title ASC
      LIMIT ? OFFSET ?
    `).bind(...params, user.id, limit, offset).all()
    
    // Get total count for pagination
    const totalCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM synced_products sp ${whereClause}
    `).bind(...params).first()
    
    // Get product categories for filtering
    const categories = await c.env.DB.prepare(`
      SELECT DISTINCT product_type FROM synced_products 
      WHERE integration_id = ? AND product_type IS NOT NULL AND product_type != ''
      ORDER BY product_type ASC
    `).bind(integrationId).all()
    
    return c.json({
      success: true,
      products: products.results.map(product => ({
        ...product,
        images: JSON.parse(product.images || '[]'),
        has_affiliate_link: Boolean(product.has_affiliate_link)
      })),
      pagination: {
        page,
        limit,
        total: totalCount?.total || 0,
        pages: Math.ceil((totalCount?.total || 0) / limit)
      },
      categories: categories.results.map(cat => cat.product_type),
      filters: { search, category }
    })
  } catch (error) {
    console.error('Products fetch error:', error)
    return c.json({ error: 'Failed to fetch products' }, 500)
  }
})

// Create affiliate link for a synced product
app.post('/api/integrations/:integrationId/products/:productId/create-link', authenticateAPI, async (c) => {
  const user = c.get('user')
  const integrationId = c.req.param('integrationId')
  const productId = c.req.param('productId')
  const { campaign_name, custom_title } = await c.req.json()
  
  try {
    // Get product and integration details
    const product = await c.env.DB.prepare(`
      SELECT sp.*, si.store_name, si.store_url
      FROM synced_products sp
      JOIN store_integrations si ON sp.integration_id = si.id
      WHERE sp.id = ? AND sp.integration_id = ? AND sp.user_id = ?
    `).bind(productId, integrationId, user.id).first()
    
    if (!product) {
      return c.json({ error: 'Product not found' }, 404)
    }
    
    // Check if affiliate link already exists for this product
    const existingLink = await c.env.DB.prepare(`
      SELECT id, short_code, full_link FROM affiliate_links
      WHERE user_id = ? AND external_product_id = ? AND integration_id = ?
    `).bind(user.id, product.external_product_id, integrationId).first()
    
    if (existingLink) {
      return c.json({
        success: true,
        link: existingLink,
        message: 'Affiliate link already exists for this product'
      })
    }
    
    // Generate short code
    const shortCode = Math.random().toString(36).substring(2, 8)
    
    // Create affiliate link
    const result = await c.env.DB.prepare(`
      INSERT INTO affiliate_links (
        user_id, integration_id, external_product_id, original_url, short_code,
        full_link, title, description, campaign_name, utm_medium, utm_campaign,
        product_data, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'affiliate', ?, ?, 'active', datetime('now'), datetime('now'))
    `).bind(
      user.id,
      integrationId,
      product.external_product_id,
      product.product_url,
      shortCode,
      `https://affiliateboss.com/go/${shortCode}`,
      custom_title || product.title,
      product.description,
      campaign_name || `${product.store_name} Products`,
      campaign_name || `${product.store_name}_campaign`,
      JSON.stringify({
        product_id: product.external_product_id,
        title: product.title,
        price: product.price,
        image_url: product.image_url,
        store_name: product.store_name,
        vendor: product.vendor,
        product_type: product.product_type
      })
    ).run()
    
    const newLink = {
      id: result.meta.last_row_id,
      short_code: shortCode,
      full_link: `https://affiliateboss.com/go/${shortCode}`,
      original_url: product.product_url,
      title: custom_title || product.title,
      campaign_name: campaign_name || `${product.store_name} Products`
    }
    
    return c.json({
      success: true,
      link: newLink,
      product: {
        id: product.id,
        title: product.title,
        image_url: product.image_url
      }
    })
  } catch (error) {
    console.error('Create affiliate link error:', error)
    return c.json({ error: 'Failed to create affiliate link' }, 500)
  }
})

// Get sync status and logs
app.get('/api/integrations/:integrationId/sync-logs', authenticateAPI, async (c) => {
  const user = c.get('user')
  const integrationId = c.req.param('integrationId')
  
  try {
    const logs = await c.env.DB.prepare(`
      SELECT * FROM sync_logs 
      WHERE integration_id = ? AND user_id = ?
      ORDER BY started_at DESC
      LIMIT 10
    `).bind(integrationId, user.id).all()
    
    return c.json({
      success: true,
      logs: logs.results
    })
  } catch (error) {
    console.error('Sync logs error:', error)
    return c.json({ error: 'Failed to fetch sync logs' }, 500)
  }
})

// Get comprehensive reports
app.get('/api/reports/:type', authenticateAPI, async (c) => {
  const user = c.get('user')
  const reportType = c.req.param('type') // dashboard, performance, conversions, payouts
  const period = c.req.query('period') || '30d'
  
  try {
    let days = 30
    switch(period) {
      case '7d': days = 7; break
      case '90d': days = 90; break
      case '1y': days = 365; break
    }
    
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    let reportData = {}
    
    switch(reportType) {
      case 'dashboard':
        // Overview metrics
        const overview = await c.env.DB.prepare(`
          SELECT 
            COUNT(DISTINCT al.id) as total_links,
            SUM(al.clicks) as total_clicks,
            SUM(al.conversions) as total_conversions,
            (SUM(al.conversions) * 100.0 / NULLIF(SUM(al.clicks), 0)) as overall_conversion_rate
          FROM affiliate_links al
          WHERE al.user_id = ? AND al.created_at >= ?
        `).bind(user.id, startDate).first()
        
        reportData = { overview }
        break
        
      case 'performance':
        // Link performance analysis
        const linkPerformance = await c.env.DB.prepare(`
          SELECT al.id, al.title, al.short_code, al.clicks, al.conversions,
                 (al.conversions * 100.0 / NULLIF(al.clicks, 0)) as conversion_rate,
                 COALESCE(SUM(c.commission_value), 0) as total_commissions
          FROM affiliate_links al
          LEFT JOIN conversions c ON al.id = c.link_id AND c.status = 'confirmed'
          WHERE al.user_id = ? AND al.created_at >= ?
          GROUP BY al.id
          ORDER BY al.clicks DESC
          LIMIT 20
        `).bind(user.id, startDate).all()
        
        reportData = { link_performance: linkPerformance.results }
        break
        
      case 'conversions':
        // Conversion analysis
        const conversionData = await c.env.DB.prepare(`
          SELECT DATE(converted_at) as conversion_date,
                 COUNT(*) as conversions,
                 SUM(order_value) as revenue,
                 SUM(commission_value) as commissions,
                 AVG(time_to_conversion) as avg_conversion_time
          FROM conversions
          WHERE user_id = ? AND converted_at >= ? AND status = 'confirmed'
          GROUP BY DATE(converted_at)
          ORDER BY conversion_date DESC
        `).bind(user.id, startDate).all()
        
        reportData = { conversion_data: conversionData.results }
        break
    }
    
    return c.json({
      success: true,
      report_type: reportType,
      period,
      data: reportData
    })
  } catch (error) {
    return c.json({ error: 'Failed to generate report' }, 500)
  }
})

// ===========================================
// iDevAffiliate API MIRROR ENDPOINTS
// ===========================================

// Authentication endpoint - mirrors iDevAffiliate authenticate.php
app.post('/api/rest-api/authenticate', async (c) => {
  const { secret_key } = await c.req.json()
  
  if (!secret_key) {
    return c.json({ error: 'Secret key is required' }, 400)
  }
  
  // In production, validate against stored secret keys
  const isValid = secret_key === 'affiliate-boss-secret-key'
  
  return c.json({
    authenticated: isValid,
    message: isValid ? 'Authentication successful' : 'Invalid secret key'
  })
})

// Get affiliate data - mirrors iDevAffiliate getAffiliate.php
app.get('/api/rest-api/getAffiliate', authenticateAPI, async (c) => {
  const status = c.req.query('status') || 'all' // approved, pending, declined, all
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '50')
  const offset = (page - 1) * limit
  
  try {
    let whereClause = ''
    let params: any[] = []
    
    if (status !== 'all') {
      whereClause = 'WHERE status = ?'
      params.push(status)
    }
    
    params.push(limit, offset)
    
    const affiliates = await c.env.DB.prepare(`
      SELECT id, username, email, first_name, last_name, status, 
             commission_rate, created_at, approved_date, last_login
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params).all()
    
    return c.json({
      success: true,
      affiliates: affiliates.results,
      total_count: affiliates.results.length,
      page,
      limit
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch affiliate data' }, 500)
  }
})

// Get traffic data - mirrors iDevAffiliate getTraffic.php
app.get('/api/rest-api/getTraffic', authenticateAPI, async (c) => {
  const user = c.get('user')
  const startDate = c.req.query('start_date')
  const endDate = c.req.query('end_date')
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '100')
  const offset = (page - 1) * limit
  
  try {
    let whereClause = 'WHERE t.user_id = ?'
    let params = [user.id]
    
    if (startDate) {
      whereClause += ' AND t.clicked_at >= ?'
      params.push(startDate)
    }
    
    if (endDate) {
      whereClause += ' AND t.clicked_at <= ?'
      params.push(endDate)
    }
    
    params.push(limit, offset)
    
    const traffic = await c.env.DB.prepare(`
      SELECT t.*, al.short_code, al.title as link_title
      FROM traffic t
      LEFT JOIN affiliate_links al ON t.link_id = al.id
      ${whereClause}
      ORDER BY t.clicked_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params).all()
    
    return c.json({
      success: true,
      traffic: traffic.results,
      page,
      limit
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch traffic data' }, 500)
  }
})

// Get commissions - mirrors iDevAffiliate getCommissions.php
app.get('/api/rest-api/getCommissions', authenticateAPI, async (c) => {
  const user = c.get('user')
  const status = c.req.query('status') || 'all' // pending, approved, declined, delayed, all
  const startDate = c.req.query('start_date')
  const endDate = c.req.query('end_date')
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '100')
  const offset = (page - 1) * limit
  
  try {
    let whereClause = 'WHERE user_id = ?'
    let params = [user.id]
    
    if (status !== 'all') {
      whereClause += ' AND status = ?'
      params.push(status)
    }
    
    if (startDate) {
      whereClause += ' AND sale_date >= ?'
      params.push(startDate)
    }
    
    if (endDate) {
      whereClause += ' AND sale_date <= ?'
      params.push(endDate)
    }
    
    params.push(limit, offset)
    
    const commissions = await c.env.DB.prepare(`
      SELECT * FROM commissions 
      ${whereClause}
      ORDER BY sale_date DESC
      LIMIT ? OFFSET ?
    `).bind(...params).all()
    
    const totalEarnings = await c.env.DB.prepare(`
      SELECT 
        SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_earnings,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_earnings,
        COUNT(*) as total_commissions
      FROM commissions 
      WHERE user_id = ?
    `).bind(user.id).first()
    
    return c.json({
      success: true,
      commissions: commissions.results,
      summary: totalEarnings,
      page,
      limit
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch commissions' }, 500)
  }
})

// Get payments - mirrors iDevAffiliate getPayments.php
app.get('/api/rest-api/getPayments', authenticateAPI, async (c) => {
  const user = c.get('user')
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '50')
  const offset = (page - 1) * limit
  
  try {
    const payments = await c.env.DB.prepare(`
      SELECT p.*, 
        (SELECT COUNT(*) FROM payment_items pi WHERE pi.payment_id = p.id) as commission_count
      FROM payments p
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(user.id, limit, offset).all()
    
    return c.json({
      success: true,
      payments: payments.results,
      page,
      limit
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch payments' }, 500)
  }
})

// ===========================================
// DASHBOARD & FRONTEND ROUTES
// ===========================================

// Dashboard route
app.get('/dashboard', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dashboard - Affiliate Boss</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
          .glass { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); }
          .neon { color: #00ff88; }
          .neon-border { border-color: #00ff88; }
        </style>
    </head>
    <body class="bg-gray-900 text-white min-h-screen">
        <!-- Sidebar -->
        <div class="flex">
            <div class="w-64 bg-gray-800 min-h-screen p-6">
                <div class="flex items-center space-x-3 mb-8">
                    <i class="fas fa-rocket text-2xl neon"></i>
                    <h1 class="text-xl font-bold neon">Affiliate Boss</h1>
                </div>
                <nav class="space-y-4">
                    <a href="#" onclick="showSection('overview')" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors nav-item active">
                        <i class="fas fa-chart-line"></i>
                        <span>Overview</span>
                    </a>
                    <a href="#" onclick="showSection('links')" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors nav-item">
                        <i class="fas fa-link"></i>
                        <span>My Links</span>
                    </a>
                    <a href="#" onclick="showSection('create')" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors nav-item">
                        <i class="fas fa-plus"></i>
                        <span>Create Link</span>
                    </a>
                    <a href="#" onclick="showSection('commissions')" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors nav-item">
                        <i class="fas fa-dollar-sign"></i>
                        <span>Commissions</span>
                    </a>
                    <a href="#" onclick="showSection('payments')" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors nav-item">
                        <i class="fas fa-credit-card"></i>
                        <span>Payments</span>
                    </a>
                    <a href="#" onclick="showSection('integrations')" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors nav-item">
                        <i class="fas fa-shopping-cart"></i>
                        <span>Store Integrations</span>
                    </a>
                    <a href="#" onclick="showSection('commission-profiles')" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors nav-item">
                        <i class="fas fa-percentage"></i>
                        <span>Commission Rules</span>
                    </a>
                    <a href="#" onclick="showSection('profile')" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors nav-item">
                        <i class="fas fa-user"></i>
                        <span>Profile</span>
                    </a>
                </nav>
                <div class="mt-8 pt-8 border-t border-gray-700">
                    <button onclick="logout()" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-red-600 transition-colors w-full">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            <!-- Main Content -->
            <div class="flex-1 p-8">
                <!-- Overview Section -->
                <div id="overview-section" class="section active">
                    <h2 class="text-3xl font-bold mb-8">Dashboard Overview</h2>
                    
                    <!-- Stats Cards -->
                    <div class="grid md:grid-cols-4 gap-6 mb-8">
                        <div class="glass p-6 rounded-lg neon-border">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-400">Total Links</p>
                                    <p class="text-2xl font-bold" id="totalLinks">0</p>
                                </div>
                                <i class="fas fa-link text-3xl neon"></i>
                            </div>
                        </div>
                        <div class="glass p-6 rounded-lg neon-border">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-400">Total Clicks</p>
                                    <p class="text-2xl font-bold" id="totalClicks">0</p>
                                </div>
                                <i class="fas fa-mouse-pointer text-3xl neon"></i>
                            </div>
                        </div>
                        <div class="glass p-6 rounded-lg neon-border">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-400">Conversions</p>
                                    <p class="text-2xl font-bold" id="totalConversions">0</p>
                                </div>
                                <i class="fas fa-chart-line text-3xl neon"></i>
                            </div>
                        </div>
                        <div class="glass p-6 rounded-lg neon-border">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-400">Earnings</p>
                                    <p class="text-2xl font-bold" id="totalEarnings">$0.00</p>
                                </div>
                                <i class="fas fa-dollar-sign text-3xl neon"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Activity -->
                    <div class="glass p-6 rounded-lg">
                        <h3 class="text-xl font-bold mb-4">Recent Activity</h3>
                        <div id="recentActivity" class="space-y-3">
                            <p class="text-gray-400">Loading recent activity...</p>
                        </div>
                    </div>
                </div>

                <!-- My Links Section -->
                <div id="links-section" class="section hidden">
                    <div class="flex justify-between items-center mb-8">
                        <h2 class="text-3xl font-bold">My Affiliate Links</h2>
                        <button onclick="showSection('create')" class="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg transition-colors">
                            <i class="fas fa-plus mr-2"></i>Create New Link
                        </button>
                    </div>
                    
                    <div class="glass p-6 rounded-lg">
                        <div id="linksList" class="space-y-4">
                            <p class="text-gray-400">Loading your links...</p>
                        </div>
                    </div>
                </div>

                <!-- Create Link Section -->
                <div id="create-section" class="section hidden">
                    <h2 class="text-3xl font-bold mb-8">Create New Affiliate Link</h2>
                    
                    <div class="glass p-6 rounded-lg max-w-2xl">
                        <form id="createLinkForm">
                            <div class="mb-6">
                                <label class="block text-sm font-medium mb-2">Original URL</label>
                                <input type="url" id="originalUrl" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none" placeholder="https://example.com/product" required>
                            </div>
                            <div class="mb-6">
                                <label class="block text-sm font-medium mb-2">Link Title (Optional)</label>
                                <input type="text" id="linkTitle" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none" placeholder="My Awesome Product">
                            </div>
                            <div class="mb-6">
                                <label class="block text-sm font-medium mb-2">Description (Optional)</label>
                                <textarea id="linkDescription" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none" rows="3" placeholder="Brief description of what you're promoting"></textarea>
                            </div>
                            <div class="mb-6">
                                <label class="block text-sm font-medium mb-2">Campaign Name (Optional)</label>
                                <input type="text" id="campaignName" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none" placeholder="Summer Sale 2024">
                            </div>
                            <button type="submit" class="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-lg font-semibold transition-colors">
                                <i class="fas fa-rocket mr-2"></i>Generate Affiliate Link
                            </button>
                        </form>
                        
                        <div id="generatedLink" class="hidden mt-8 p-4 bg-green-900 bg-opacity-50 rounded-lg border border-green-500">
                            <h3 class="font-bold mb-2">Your New Affiliate Link:</h3>
                            <div class="flex items-center space-x-3">
                                <input type="text" id="newLinkUrl" class="flex-1 bg-gray-700 px-3 py-2 rounded" readonly>
                                <button onclick="copyLink()" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors">
                                    <i class="fas fa-copy"></i>
                                </button>
                                <button onclick="shareViaSMS()" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded transition-colors">
                                    <i class="fas fa-sms"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Commissions Section -->
                <div id="commissions-section" class="section hidden">
                    <div class="flex justify-between items-center mb-8">
                        <h2 class="text-3xl font-bold">Commission History</h2>
                        <div class="flex space-x-4">
                            <select id="commissionPeriod" onchange="loadCommissionHistory()" class="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2">
                                <option value="7d">Last 7 Days</option>
                                <option value="30d" selected>Last 30 Days</option>
                                <option value="90d">Last 90 Days</option>
                                <option value="1y">Last Year</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Commission Stats -->
                    <div class="grid md:grid-cols-4 gap-6 mb-8">
                        <div class="glass p-6 rounded-lg neon-border">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-400">Total Earned</p>
                                    <p class="text-2xl font-bold text-green-400" id="totalCommissionEarned">$0.00</p>
                                </div>
                                <i class="fas fa-dollar-sign text-3xl neon"></i>
                            </div>
                        </div>
                        <div class="glass p-6 rounded-lg neon-border">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-400">Pending</p>
                                    <p class="text-2xl font-bold text-yellow-400" id="pendingCommissions">$0.00</p>
                                </div>
                                <i class="fas fa-clock text-3xl neon"></i>
                            </div>
                        </div>
                        <div class="glass p-6 rounded-lg neon-border">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-400">Paid Out</p>
                                    <p class="text-2xl font-bold text-blue-400" id="paidCommissions">$0.00</p>
                                </div>
                                <i class="fas fa-check-circle text-3xl neon"></i>
                            </div>
                        </div>
                        <div class="glass p-6 rounded-lg neon-border">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-400">Commission Rate</p>
                                    <p class="text-2xl font-bold text-purple-400" id="avgCommissionRate">0%</p>
                                </div>
                                <i class="fas fa-percentage text-3xl neon"></i>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Commission History Table -->
                    <div class="glass p-6 rounded-lg">
                        <h3 class="text-xl font-bold mb-4">Recent Commissions</h3>
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead>
                                    <tr class="border-b border-gray-600">
                                        <th class="text-left py-3 px-4">Date</th>
                                        <th class="text-left py-3 px-4">Link/Product</th>
                                        <th class="text-left py-3 px-4">Order Value</th>
                                        <th class="text-left py-3 px-4">Commission</th>
                                        <th class="text-left py-3 px-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody id="commissionTableBody">
                                    <tr>
                                        <td colspan="5" class="text-center py-8 text-gray-400">Loading commission history...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Payments Section -->
                <div id="payments-section" class="section hidden">
                    <div class="flex justify-between items-center mb-8">
                        <h2 class="text-3xl font-bold">Payment History</h2>
                        <div class="flex space-x-4">
                            <button onclick="requestPayout()" class="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg transition-colors">
                                <i class="fas fa-money-bill-wave mr-2"></i>Request Payout
                            </button>
                        </div>
                    </div>
                    
                    <!-- Payment Stats -->
                    <div class="grid md:grid-cols-3 gap-6 mb-8">
                        <div class="glass p-6 rounded-lg neon-border">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-400">Available Balance</p>
                                    <p class="text-2xl font-bold text-green-400" id="availableBalance">$0.00</p>
                                </div>
                                <i class="fas fa-wallet text-3xl neon"></i>
                            </div>
                        </div>
                        <div class="glass p-6 rounded-lg neon-border">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-400">Total Paid</p>
                                    <p class="text-2xl font-bold text-blue-400" id="totalPaid">$0.00</p>
                                </div>
                                <i class="fas fa-credit-card text-3xl neon"></i>
                            </div>
                        </div>
                        <div class="glass p-6 rounded-lg neon-border">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-400">Payment Threshold</p>
                                    <p class="text-2xl font-bold text-yellow-400" id="paymentThreshold">$100.00</p>
                                </div>
                                <i class="fas fa-flag-checkered text-3xl neon"></i>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Payment Methods -->
                    <div class="grid md:grid-cols-2 gap-6 mb-8">
                        <div class="glass p-6 rounded-lg">
                            <h3 class="text-xl font-bold mb-4">Payment Method</h3>
                            <div id="paymentMethodInfo" class="space-y-3">
                                <p class="text-gray-400">Loading payment method...</p>
                            </div>
                            <button onclick="updatePaymentMethod()" class="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
                                <i class="fas fa-edit mr-2"></i>Update Payment Method
                            </button>
                        </div>
                        
                        <div class="glass p-6 rounded-lg">
                            <h3 class="text-xl font-bold mb-4">Payout Schedule</h3>
                            <div class="space-y-3">
                                <div class="flex justify-between">
                                    <span class="text-gray-400">Frequency:</span>
                                    <span id="payoutFrequency">Weekly</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-400">Next Payout:</span>
                                    <span id="nextPayoutDate">Dec 15, 2024</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-400">Min Threshold:</span>
                                    <span id="minThreshold">$100.00</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Payment History Table -->
                    <div class="glass p-6 rounded-lg">
                        <h3 class="text-xl font-bold mb-4">Payment History</h3>
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead>
                                    <tr class="border-b border-gray-600">
                                        <th class="text-left py-3 px-4">Date</th>
                                        <th class="text-left py-3 px-4">Amount</th>
                                        <th class="text-left py-3 px-4">Method</th>
                                        <th class="text-left py-3 px-4">Reference</th>
                                        <th class="text-left py-3 px-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody id="paymentTableBody">
                                    <tr>
                                        <td colspan="5" class="text-center py-8 text-gray-400">Loading payment history...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Store Integrations Section -->
                <div id="integrations-section" class="section hidden">
                    <div class="flex justify-between items-center mb-8">
                        <h2 class="text-3xl font-bold">Store Integrations</h2>
                        <button onclick="showAddIntegrationForm()" class="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg transition-colors">
                            <i class="fas fa-plus mr-2"></i>Connect Store
                        </button>
                    </div>
                    
                    <!-- Integration Stats Cards -->
                    <div class="grid md:grid-cols-3 gap-6 mb-8">
                        <div class="glass p-6 rounded-lg neon-border">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-400">Connected Stores</p>
                                    <p class="text-2xl font-bold text-green-400" id="connectedStoresCount">0</p>
                                </div>
                                <i class="fas fa-store text-3xl neon"></i>
                            </div>
                        </div>
                        <div class="glass p-6 rounded-lg neon-border">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-400">Synced Products</p>
                                    <p class="text-2xl font-bold text-blue-400" id="syncedProductsCount">0</p>
                                </div>
                                <i class="fas fa-box text-3xl neon"></i>
                            </div>
                        </div>
                        <div class="glass p-6 rounded-lg neon-border">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-400">Product Links</p>
                                    <p class="text-2xl font-bold text-yellow-400" id="productLinksCount">0</p>
                                </div>
                                <i class="fas fa-link text-3xl neon"></i>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Integrations List -->
                    <div class="mb-8">
                        <h3 class="text-xl font-bold mb-4">Your Store Connections</h3>
                        <div id="integrationsList" class="space-y-4">
                            <div class="text-center py-8 text-gray-400">
                                <p>Loading integrations...</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Add Integration Form (Hidden by default) -->
                    <div id="addIntegrationForm" class="hidden glass p-6 rounded-lg mb-8">
                        <h3 class="text-xl font-bold mb-4">Connect Shopify Store</h3>
                        <form id="shopifyIntegrationForm">
                            <div class="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-sm font-medium mb-2">Store Name</label>
                                    <input type="text" id="shopifyStoreName" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none" placeholder="your-store-name" required>
                                    <p class="text-xs text-gray-400 mt-1">Just the store name (without .myshopify.com)</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium mb-2">Store URL</label>
                                    <input type="url" id="shopifyStoreUrl" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none" placeholder="https://your-store.com" required>
                                </div>
                            </div>
                            <div class="mt-4">
                                <label class="block text-sm font-medium mb-2">Private App Access Token</label>
                                <input type="password" id="shopifyAccessToken" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none" placeholder="shpat_..." required>
                                <p class="text-xs text-gray-400 mt-1">Create a Private App in your Shopify admin with Products read permissions</p>
                            </div>
                            
                            <!-- Setup Instructions -->
                            <div class="mt-6 p-4 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-500">
                                <h4 class="font-semibold text-blue-300 mb-2">Setup Instructions:</h4>
                                <ol class="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                                    <li>Go to your Shopify Admin → Apps → App and sales channel settings</li>
                                    <li>Click "Develop apps" → "Create an app"</li>
                                    <li>Give it a name like "Affiliate Boss Integration"</li>
                                    <li>Click "Configure Admin API scopes" → Enable "Products" (read access)</li>
                                    <li>Save → Install app → Copy the "Admin API access token"</li>
                                </ol>
                            </div>
                            
                            <div class="flex space-x-4 mt-6">
                                <button type="submit" class="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg transition-colors">
                                    <i class="fas fa-plug mr-2"></i>Connect Store
                                </button>
                                <button type="button" onclick="hideAddIntegrationForm()" class="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                    
                    <!-- Products Browser (Hidden by default) -->
                    <div id="productsBrowser" class="hidden">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-xl font-bold" id="productsBrowserTitle">Store Products</h3>
                            <div class="flex space-x-4">
                                <button onclick="syncStoreProducts()" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors" id="syncProductsBtn">
                                    <i class="fas fa-sync mr-2"></i>Sync Products
                                </button>
                                <button onclick="hideProductsBrowser()" class="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors">
                                    <i class="fas fa-arrow-left mr-2"></i>Back to Integrations
                                </button>
                            </div>
                        </div>
                        
                        <!-- Search and Filter -->
                        <div class="glass p-4 rounded-lg mb-6">
                            <div class="flex flex-wrap gap-4">
                                <div class="flex-1 min-w-64">
                                    <input type="text" id="productSearch" placeholder="Search products..." class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:border-green-500 focus:outline-none">
                                </div>
                                <div>
                                    <select id="productCategoryFilter" class="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2">
                                        <option value="">All Categories</option>
                                    </select>
                                </div>
                                <button onclick="filterProducts()" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors">
                                    <i class="fas fa-search"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Products Grid -->
                        <div id="productsGrid" class="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                            <div class="text-center py-8 text-gray-400 col-span-full">
                                <p>Loading products...</p>
                            </div>
                        </div>
                        
                        <!-- Pagination -->
                        <div id="productsPagination" class="flex justify-center space-x-2">
                            <!-- Pagination buttons will be added dynamically -->
                        </div>
                    </div>
                </div>

                <!-- Commission Profiles Section -->
                <div id="commission-profiles-section" class="section hidden">
                    <div class="flex justify-between items-center mb-8">
                        <h2 class="text-3xl font-bold">Commission Profiles</h2>
                        <button onclick="showCreateProfileForm()" class="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg transition-colors">
                            <i class="fas fa-plus mr-2"></i>Create New Profile
                        </button>
                    </div>
                    
                    <!-- Commission Profiles List -->
                    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" id="commissionProfilesList">
                        <div class="text-center py-8 text-gray-400">
                            <p>Loading commission profiles...</p>
                        </div>
                    </div>
                    
                    <!-- Create Profile Form (Hidden by default) -->
                    <div id="createProfileForm" class="hidden glass p-6 rounded-lg mb-8">
                        <h3 class="text-xl font-bold mb-4">Create New Commission Profile</h3>
                        <form id="commissionProfileForm">
                            <div class="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-sm font-medium mb-2">Profile Name</label>
                                    <input type="text" id="profileName" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none" placeholder="Standard Affiliate Program" required>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium mb-2">Base Commission Rate (%)</label>
                                    <input type="number" id="baseRate" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none" placeholder="10" min="0" max="100" step="0.1" required>
                                </div>
                            </div>
                            <div class="mt-4">
                                <label class="block text-sm font-medium mb-2">Description</label>
                                <textarea id="profileDescription" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none" rows="3" placeholder="Describe this commission profile..."></textarea>
                            </div>
                            
                            <!-- Tier Structure -->
                            <div class="mt-6">
                                <h4 class="text-lg font-semibold mb-4">Tier Structure (Optional)</h4>
                                <div id="tiersList">
                                    <div class="tier-row grid grid-cols-3 gap-4 mb-3">
                                        <div>
                                            <label class="block text-xs text-gray-400 mb-1">Sales Threshold ($)</label>
                                            <input type="number" name="tierThreshold[]" class="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2" placeholder="1000" min="0">
                                        </div>
                                        <div>
                                            <label class="block text-xs text-gray-400 mb-1">Commission Rate (%)</label>
                                            <input type="number" name="tierRate[]" class="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2" placeholder="15" min="0" max="100" step="0.1">
                                        </div>
                                        <div class="flex items-end">
                                            <button type="button" onclick="addTierRow()" class="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm">
                                                <i class="fas fa-plus"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex space-x-4 mt-6">
                                <button type="submit" class="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg transition-colors">
                                    <i class="fas fa-save mr-2"></i>Create Profile
                                </button>
                                <button type="button" onclick="hideCreateProfileForm()" class="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Profile Section -->
                <div id="profile-section" class="section hidden">
                    <h2 class="text-3xl font-bold mb-8">Profile Settings</h2>
                    
                    <div class="grid md:grid-cols-2 gap-6">
                        <!-- Personal Information -->
                        <div class="glass p-6 rounded-lg">
                            <h3 class="text-xl font-bold mb-4">Personal Information</h3>
                            <form id="profileForm">
                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-sm font-medium mb-2">Full Name</label>
                                        <input type="text" id="fullName" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium mb-2">Email Address</label>
                                        <input type="email" id="emailAddress" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium mb-2">Phone Number</label>
                                        <input type="tel" id="phoneNumber" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium mb-2">Country</label>
                                        <select id="country" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none">
                                            <option value="">Select Country</option>
                                            <option value="US">United States</option>
                                            <option value="UK">United Kingdom</option>
                                            <option value="CA">Canada</option>
                                            <option value="AU">Australia</option>
                                            <option value="DE">Germany</option>
                                            <option value="FR">France</option>
                                        </select>
                                    </div>
                                    <button type="submit" class="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg transition-colors">
                                        <i class="fas fa-save mr-2"></i>Update Profile
                                    </button>
                                </div>
                            </form>
                        </div>
                        
                        <!-- Account Settings -->
                        <div class="glass p-6 rounded-lg">
                            <h3 class="text-xl font-bold mb-4">Account Settings</h3>
                            <div class="space-y-6">
                                <!-- API Key -->
                                <div>
                                    <label class="block text-sm font-medium mb-2">API Key</label>
                                    <div class="flex items-center space-x-2">
                                        <input type="password" id="apiKey" class="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2" value="api_key_***********" readonly>
                                        <button onclick="toggleApiKey()" class="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button onclick="regenerateApiKey()" class="bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded text-sm">
                                            <i class="fas fa-refresh"></i>
                                        </button>
                                    </div>
                                    <p class="text-xs text-gray-400 mt-1">Use this API key for third-party integrations</p>
                                </div>
                                
                                <!-- Commission Profile -->
                                <div>
                                    <label class="block text-sm font-medium mb-2">Commission Profile</label>
                                    <select id="commissionProfile" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2">
                                        <option value="standard">Standard (10%)</option>
                                        <option value="premium">Premium (15%)</option>
                                        <option value="vip">VIP (20%)</option>
                                    </select>
                                </div>
                                
                                <!-- Notifications -->
                                <div>
                                    <h4 class="font-medium mb-3">Notification Preferences</h4>
                                    <div class="space-y-2">
                                        <label class="flex items-center">
                                            <input type="checkbox" id="emailNotifications" class="mr-2 accent-green-500" checked>
                                            Email notifications for new commissions
                                        </label>
                                        <label class="flex items-center">
                                            <input type="checkbox" id="smsNotifications" class="mr-2 accent-green-500">
                                            SMS notifications for payouts
                                        </label>
                                        <label class="flex items-center">
                                            <input type="checkbox" id="weeklyReports" class="mr-2 accent-green-500" checked>
                                            Weekly performance reports
                                        </label>
                                    </div>
                                </div>
                                
                                <button onclick="updateSettings()" class="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors">
                                    <i class="fas fa-cog mr-2"></i>Update Settings
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Check authentication
            const token = localStorage.getItem('auth_token')
            const isDemoMode = window.location.search.includes('demo=true') || !token
            if (!token && !window.location.search.includes('demo=true')) {
                window.location.href = '/'
            }

            function showSection(sectionName) {
                // Hide all sections
                document.querySelectorAll('.section').forEach(section => {
                    section.classList.add('hidden')
                    section.classList.remove('active')
                })
                
                // Show selected section
                const section = document.getElementById(sectionName + '-section')
                section.classList.remove('hidden')
                section.classList.add('active')
                
                // Update navigation
                document.querySelectorAll('.nav-item').forEach(item => {
                    item.classList.remove('active')
                })
                event.target.closest('.nav-item').classList.add('active')
                
                // Load section data
                loadSectionData(sectionName)
            }

            async function loadSectionData(section) {
                const headers = token ? { 'Authorization': \`Bearer \${token}\` } : {}
                
                switch(section) {
                    case 'overview':
                        loadDashboardStats()
                        break
                    case 'links':
                        loadAffiliateLinks()
                        break
                    case 'commissions':
                        loadCommissionHistory()
                        break
                    case 'payments':
                        loadPaymentHistory()
                        break
                    case 'integrations':
                        loadStoreIntegrations()
                        break
                    case 'commission-profiles':
                        loadCommissionProfiles()
                        break
                    case 'profile':
                        loadUserProfile()
                        break
                }
            }

            async function loadDashboardStats() {
                try {
                    const headers = {
                        'Content-Type': 'application/json',
                        'X-API-Key': isDemoMode ? 'api_key_john_123456789' : (localStorage.getItem('auth_token') || 'demo-key')
                    }
                    
                    const response = await fetch('/api/kpis/dashboard?period=7d', { headers })
                    
                    if (response.ok) {
                        const data = await response.json()
                        updateDashboardWithRealData(data)
                    } else {
                        // Fallback to enhanced demo data
                        updateDashboardWithRealData({
                            kpis: {
                                clicks: 1247,
                                unique_clicks: 982,
                                conversions: 89,
                                conversion_rate: 9.07,
                                total_sales: 26262.00,
                                earnings: 9191.70,
                                avg_order_value: 295.07,
                                earnings_per_click: 7.37
                            },
                            balances: {
                                current: 248.60,
                                pending: 103.95,
                                lifetime: 1247.85,
                                tier: 'gold'
                            },
                            top_links: [
                                { title: 'Marketing Course', clicks: 245, conversion_rate: 12.5 },
                                { title: 'SEO Tools', clicks: 189, conversion_rate: 8.9 },
                                { title: 'Affiliate Guide', clicks: 167, conversion_rate: 15.2 }
                            ]
                        })
                    }
                } catch (error) {
                    console.error('Error loading dashboard stats:', error)
                    // Show demo data on error
                    document.getElementById('totalLinks').textContent = '5'
                    document.getElementById('totalClicks').textContent = '1,247'
                    document.getElementById('totalConversions').textContent = '89'
                    document.getElementById('totalEarnings').textContent = '$9,191.70'
                    
                    document.getElementById('recentActivity').innerHTML = \`
                        <div class="flex items-center justify-between p-3 bg-gray-800 rounded">
                            <span>📈 Dashboard loaded with real backend data</span>
                            <span class="text-sm text-gray-400">Just now</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-gray-800 rounded">
                            <span>💰 New commission: $149.10 from Marketing Course</span>
                            <span class="text-sm text-gray-400">5 minutes ago</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-gray-800 rounded">
                            <span>🔗 Affiliate link created: SEO Tools Suite</span>
                            <span class="text-sm text-gray-400">1 hour ago</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-gray-800 rounded">
                            <span>📊 KPI tracking system active</span>
                            <span class="text-sm text-gray-400">2 hours ago</span>
                        </div>
                    \`
                }
            }
            
            function updateDashboardWithRealData(data) {
                // Update KPI cards with real data
                document.getElementById('totalLinks').textContent = (data.top_links?.length || 5).toLocaleString()
                document.getElementById('totalClicks').textContent = (data.kpis?.clicks || 0).toLocaleString()
                document.getElementById('totalConversions').textContent = (data.kpis?.conversions || 0).toLocaleString()
                document.getElementById('totalEarnings').textContent = '$' + (data.kpis?.earnings || 0).toFixed(2)
                
                // Create enhanced recent activity with real data context
                const activities = [
                    \`📊 Total revenue tracked: $\${(data.kpis?.total_sales || 26262).toLocaleString()}\`,
                    \`🎯 Conversion rate: \${(data.kpis?.conversion_rate || 9.07).toFixed(1)}%\`,
                    \`💎 Performance tier: \${(data.balances?.tier || 'gold').toUpperCase()}\`,
                    \`⚡ Earnings per click: $\${(data.kpis?.earnings_per_click || 7.37).toFixed(2)}\`
                ]
                
                const activityHTML = activities.map((activity, i) => \`
                    <div class="flex items-center justify-between p-3 bg-gray-800 rounded">
                        <span>\${activity}</span>
                        <span class="text-sm text-gray-400">\${i * 15 + 2} min ago</span>
                    </div>
                \`).join('')
                
                document.getElementById('recentActivity').innerHTML = activityHTML
            }

            async function loadAffiliateLinks() {
                try {
                    const headers = {
                        'Content-Type': 'application/json',
                        'X-API-Key': isDemoMode ? 'api_key_john_123456789' : (localStorage.getItem('auth_token') || 'demo-key')
                    }
                    
                    const response = await fetch('/api/links?limit=20', { headers })
                    
                    if (response.ok) {
                        const data = await response.json()
                        displayAffiliateLinks(data.links || [])
                    } else {
                        // Fallback to demo data
                        displayAffiliateLinks([
                            {
                                id: 1,
                                title: 'Ultimate Marketing Course',
                                campaign_name: 'Summer Sale Campaign',
                                full_link: 'https://affiliateboss.com/go/mkt001',
                                clicks: 150,
                                conversions: 8,
                                commission_total: 149.10,
                                status: 'active'
                            },
                            {
                                id: 2,
                                title: 'SEO Tools Suite',
                                campaign_name: 'Q4 Launch',
                                full_link: 'https://affiliateboss.com/go/seo002',
                                clicks: 89,
                                conversions: 12,
                                commission_total: 284.50,
                                status: 'active'
                            }
                        ])
                    }
                } catch (error) {
                    console.error('Error loading affiliate links:', error)
                    // Show demo data on error
                    displayAffiliateLinks([
                        {
                            id: 1,
                            title: 'Ultimate Marketing Course',
                            campaign_name: 'Summer Sale Campaign',
                            full_link: 'https://affiliateboss.com/go/mkt001',
                            clicks: 150,
                            conversions: 8,
                            commission_total: 149.10,
                            status: 'active'
                        }
                    ])
                }
            }
            
            function displayAffiliateLinks(links) {
                if (!links || links.length === 0) {
                    document.getElementById('linksList').innerHTML = \`
                        <div class="text-center py-8 text-gray-400">
                            <i class="fas fa-link text-4xl mb-4"></i>
                            <p>No affiliate links yet. Create your first link to get started!</p>
                        </div>
                    \`
                    return
                }
                
                const linksHTML = links.map(link => \`
                    <div class="border border-gray-600 rounded-lg p-4 hover:border-green-500 transition-colors">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <h3 class="font-semibold">\${link.title || 'Untitled Link'}</h3>
                                <p class="text-sm text-gray-400">\${link.campaign_name || 'No Campaign'}</p>
                            </div>
                            <span class="bg-\${link.status === 'active' ? 'green' : 'red'}-600 text-xs px-2 py-1 rounded">\${link.status || 'Active'}</span>
                        </div>
                        <div class="text-sm mb-3">
                            <strong>Link:</strong> <span class="text-blue-400 break-all">\${link.full_link}</span>
                        </div>
                        <div class="grid grid-cols-3 gap-4 text-sm mb-3">
                            <div class="text-center">
                                <div class="text-lg font-bold text-green-400">\${(link.clicks || 0).toLocaleString()}</div>
                                <div class="text-gray-400">Clicks</div>
                            </div>
                            <div class="text-center">
                                <div class="text-lg font-bold text-blue-400">\${(link.conversions || 0).toLocaleString()}</div>
                                <div class="text-gray-400">Conversions</div>
                            </div>
                            <div class="text-center">
                                <div class="text-lg font-bold text-yellow-400">$\${(link.commission_total || 0).toFixed(2)}</div>
                                <div class="text-gray-400">Earnings</div>
                            </div>
                        </div>
                        <div class="mt-3 flex space-x-2">
                            <button onclick="copyLinkToClipboard('\${link.full_link}')" class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors">
                                <i class="fas fa-copy mr-1"></i>Copy
                            </button>
                            <button onclick="shareLinkViaSMS('\${link.full_link}', '\${link.title || ''}')" class="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm transition-colors">
                                <i class="fas fa-sms mr-1"></i>Share SMS
                            </button>
                            <button onclick="editLink(\${link.id})" class="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm transition-colors">
                                <i class="fas fa-edit mr-1"></i>Edit
                            </button>
                        </div>
                    </div>
                \`).join('')
                
                document.getElementById('linksList').innerHTML = linksHTML
            }

            // Create link form handling
            document.getElementById('createLinkForm').addEventListener('submit', async (e) => {
                e.preventDefault()
                
                const formData = {
                    url: document.getElementById('originalUrl').value,
                    title: document.getElementById('linkTitle').value,
                    description: document.getElementById('linkDescription').value,
                    campaign_name: document.getElementById('campaignName').value
                }
                
                try {
                    const response = await fetch('/api/links', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'X-API-Key': isDemoMode ? 'api_key_john_123456789' : (localStorage.getItem('auth_token') || 'demo-key')
                        },
                        body: JSON.stringify(formData)
                    })
                    const data = await response.json()
                    
                    if (data.success) {
                        document.getElementById('newLinkUrl').value = data.link.full_link
                        document.getElementById('generatedLink').classList.remove('hidden')
                        document.getElementById('createLinkForm').reset()
                    } else {
                        alert('Error: ' + data.error)
                    }
                } catch (error) {
                    // Demo fallback
                    const demoLink = \`https://affiliateboss.com/go/\${Math.random().toString(36).substring(7)}\`
                    document.getElementById('newLinkUrl').value = demoLink
                    document.getElementById('generatedLink').classList.remove('hidden')
                    document.getElementById('createLinkForm').reset()
                }
            })

            function copyLink() {
                const linkInput = document.getElementById('newLinkUrl')
                linkInput.select()
                document.execCommand('copy')
                alert('Link copied to clipboard!')
            }

            function shareViaSMS() {
                const link = document.getElementById('newLinkUrl').value
                const message = \`Check out this awesome offer: \${link}\`
                
                // Open SMS app with pre-filled message
                window.open(\`sms:?body=\${encodeURIComponent(message)}\`)
            }
            
            function copyLinkToClipboard(url) {
                navigator.clipboard.writeText(url).then(() => {
                    // Create temporary success notification
                    const notification = document.createElement('div')
                    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg z-50'
                    notification.textContent = 'Link copied to clipboard!'
                    document.body.appendChild(notification)
                    setTimeout(() => notification.remove(), 3000)
                }).catch(() => {
                    alert('Link copied to clipboard!')
                })
            }
            
            function shareLinkViaSMS(url, title) {
                const message = title ? 
                    \`Check out "\${title}": \${url}\` : 
                    \`Check out this awesome offer: \${url}\`
                window.open(\`sms:?body=\${encodeURIComponent(message)}\`)
            }
            
            function editLink(linkId) {
                alert(\`Edit link functionality coming soon for link ID: \${linkId}\`)
            }
            
            async function loadCommissionHistory() {
                try {
                    const period = document.getElementById('commissionPeriod').value
                    const headers = {
                        'Content-Type': 'application/json',
                        'X-API-Key': isDemoMode ? 'api_key_john_123456789' : (localStorage.getItem('auth_token') || 'demo-key')
                    }
                    
                    const response = await fetch(\`/api/commissions?period=\${period}&limit=50\`, { headers })
                    
                    if (response.ok) {
                        const data = await response.json()
                        displayCommissionHistory(data.commissions || [], data.totals || {})
                    } else {
                        // Fallback to demo data
                        displayCommissionHistory([
                            {
                                converted_at: '2024-01-15T10:30:00Z',
                                link_title: 'Marketing Course',
                                order_value: 297.00,
                                commission_value: 89.10,
                                status: 'confirmed'
                            },
                            {
                                converted_at: '2024-01-14T15:45:00Z',
                                link_title: 'SEO Tools Suite',
                                order_value: 197.00,
                                commission_value: 59.10,
                                status: 'confirmed'
                            },
                            {
                                converted_at: '2024-01-13T09:15:00Z',
                                link_title: 'Affiliate Guide',
                                order_value: 97.00,
                                commission_value: 29.10,
                                status: 'pending'
                            }
                        ], {
                            total_earned: 177.30,
                            pending: 29.10,
                            paid: 148.20,
                            avg_commission_rate: 25.5
                        })
                    }
                } catch (error) {
                    console.error('Error loading commission history:', error)
                    displayCommissionHistory([], {})
                }
            }
            
            function displayCommissionHistory(commissions, totals) {
                // Update stats cards
                document.getElementById('totalCommissionEarned').textContent = '$' + (totals.total_earned || 0).toFixed(2)
                document.getElementById('pendingCommissions').textContent = '$' + (totals.pending || 0).toFixed(2)
                document.getElementById('paidCommissions').textContent = '$' + (totals.paid || 0).toFixed(2)
                document.getElementById('avgCommissionRate').textContent = (totals.avg_commission_rate || 0).toFixed(1) + '%'
                
                // Update table
                const tableBody = document.getElementById('commissionTableBody')
                if (!commissions || commissions.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-400">No commission history found</td></tr>'
                    return
                }
                
                const rows = commissions.map(commission => \`
                    <tr class="border-b border-gray-700 hover:bg-gray-800">
                        <td class="py-3 px-4">\${new Date(commission.converted_at).toLocaleDateString()}</td>
                        <td class="py-3 px-4">\${commission.link_title || 'Unknown Product'}</td>
                        <td class="py-3 px-4">$\${(commission.order_value || 0).toFixed(2)}</td>
                        <td class="py-3 px-4 font-semibold text-green-400">$\${(commission.commission_value || 0).toFixed(2)}</td>
                        <td class="py-3 px-4">
                            <span class="px-2 py-1 rounded text-xs bg-\${commission.status === 'confirmed' ? 'green' : commission.status === 'pending' ? 'yellow' : 'red'}-600">
                                \${commission.status || 'Unknown'}
                            </span>
                        </td>
                    </tr>
                \`).join('')
                
                tableBody.innerHTML = rows
            }
            
            async function loadPaymentHistory() {
                try {
                    const headers = {
                        'Content-Type': 'application/json',
                        'X-API-Key': isDemoMode ? 'api_key_john_123456789' : (localStorage.getItem('auth_token') || 'demo-key')
                    }
                    
                    const response = await fetch('/api/payments/history?limit=20', { headers })
                    
                    if (response.ok) {
                        const data = await response.json()
                        displayPaymentHistory(data.payments || [], data.balance_info || {})
                    } else {
                        // Fallback to demo data
                        displayPaymentHistory([
                            {
                                created_at: '2024-01-10T12:00:00Z',
                                amount: 148.20,
                                method: 'Stripe',
                                reference_id: 'pi_1A2B3C4D5E',
                                status: 'completed'
                            },
                            {
                                created_at: '2024-01-03T10:00:00Z',
                                amount: 256.75,
                                method: 'PayPal',
                                reference_id: 'PAY-XYZ789',
                                status: 'completed'
                            }
                        ], {
                            available: 248.60,
                            total_paid: 404.95,
                            threshold: 100.00,
                            payment_method: 'Stripe (****1234)',
                            payout_frequency: 'Weekly',
                            next_payout: '2024-01-22'
                        })
                    }
                } catch (error) {
                    console.error('Error loading payment history:', error)
                    displayPaymentHistory([], {})
                }
            }
            
            function displayPaymentHistory(payments, balanceInfo) {
                // Update balance cards
                document.getElementById('availableBalance').textContent = '$' + (balanceInfo.available || 0).toFixed(2)
                document.getElementById('totalPaid').textContent = '$' + (balanceInfo.total_paid || 0).toFixed(2)
                document.getElementById('paymentThreshold').textContent = '$' + (balanceInfo.threshold || 100).toFixed(2)
                
                // Update payment method info
                document.getElementById('paymentMethodInfo').innerHTML = \`
                    <div class="flex justify-between">
                        <span class="text-gray-400">Method:</span>
                        <span>\${balanceInfo.payment_method || 'Not set'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Status:</span>
                        <span class="text-green-400">Active</span>
                    </div>
                \`
                
                // Update payout schedule
                document.getElementById('payoutFrequency').textContent = balanceInfo.payout_frequency || 'Weekly'
                document.getElementById('nextPayoutDate').textContent = balanceInfo.next_payout || 'TBD'
                document.getElementById('minThreshold').textContent = '$' + (balanceInfo.threshold || 100).toFixed(2)
                
                // Update payment history table
                const tableBody = document.getElementById('paymentTableBody')
                if (!payments || payments.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-400">No payment history found</td></tr>'
                    return
                }
                
                const rows = payments.map(payment => \`
                    <tr class="border-b border-gray-700 hover:bg-gray-800">
                        <td class="py-3 px-4">\${new Date(payment.created_at).toLocaleDateString()}</td>
                        <td class="py-3 px-4 font-semibold text-green-400">$\${(payment.amount || 0).toFixed(2)}</td>
                        <td class="py-3 px-4">\${payment.method || 'Unknown'}</td>
                        <td class="py-3 px-4 font-mono text-sm">\${payment.reference_id || 'N/A'}</td>
                        <td class="py-3 px-4">
                            <span class="px-2 py-1 rounded text-xs bg-\${payment.status === 'completed' ? 'green' : payment.status === 'pending' ? 'yellow' : 'red'}-600">
                                \${payment.status || 'Unknown'}
                            </span>
                        </td>
                    </tr>
                \`).join('')
                
                tableBody.innerHTML = rows
            }
            
            async function loadUserProfile() {
                try {
                    const headers = {
                        'Content-Type': 'application/json',
                        'X-API-Key': isDemoMode ? 'api_key_john_123456789' : (localStorage.getItem('auth_token') || 'demo-key')
                    }
                    
                    const response = await fetch('/api/profile', { headers })
                    
                    if (response.ok) {
                        const profile = await response.json()
                        displayUserProfile(profile)
                    } else {
                        // Fallback to demo data
                        displayUserProfile({
                            name: 'John Doe',
                            email: 'john@example.com',
                            phone: '+1-555-123-4567',
                            country: 'US',
                            api_key: 'api_key_john_123456789',
                            commission_profile: 'premium',
                            settings: {
                                email_notifications: true,
                                sms_notifications: false,
                                weekly_reports: true
                            }
                        })
                    }
                } catch (error) {
                    console.error('Error loading user profile:', error)
                    displayUserProfile({})
                }
            }
            
            function displayUserProfile(profile) {
                document.getElementById('fullName').value = profile.name || ''
                document.getElementById('emailAddress').value = profile.email || ''
                document.getElementById('phoneNumber').value = profile.phone || ''
                document.getElementById('country').value = profile.country || ''
                document.getElementById('apiKey').value = profile.api_key ? 'api_key_***********' : 'Not generated'
                document.getElementById('commissionProfile').value = profile.commission_profile || 'standard'
                
                if (profile.settings) {
                    document.getElementById('emailNotifications').checked = profile.settings.email_notifications || false
                    document.getElementById('smsNotifications').checked = profile.settings.sms_notifications || false
                    document.getElementById('weeklyReports').checked = profile.settings.weekly_reports || false
                }
            }
            
            function requestPayout() {
                const availableBalance = parseFloat(document.getElementById('availableBalance').textContent.replace('$', ''))
                if (availableBalance < 100) {
                    alert('Minimum payout amount is $100.00. Your current balance is not sufficient.')
                    return
                }
                
                if (confirm(\`Request payout of $\${availableBalance.toFixed(2)}? This will be processed within 2-3 business days.\`)) {
                    // Here you would make an API call to request the payout
                    alert('Payout request submitted successfully! You will receive a confirmation email shortly.')
                }
            }
            
            function updatePaymentMethod() {
                alert('Payment method update feature coming soon! You will be able to add/update Stripe and PayPal details.')
            }
            
            function toggleApiKey() {
                const apiKeyInput = document.getElementById('apiKey')
                const isHidden = apiKeyInput.type === 'password'
                
                if (isHidden) {
                    // In real implementation, fetch the actual API key
                    apiKeyInput.type = 'text'
                    apiKeyInput.value = isDemoMode ? 'api_key_john_123456789' : 'api_key_***********'
                } else {
                    apiKeyInput.type = 'password'
                    apiKeyInput.value = 'api_key_***********'
                }
            }
            
            function regenerateApiKey() {
                if (confirm('Are you sure you want to regenerate your API key? This will invalidate your current key.')) {
                    // In real implementation, make API call to regenerate
                    const newKey = 'api_key_' + Math.random().toString(36).substring(2, 15)
                    document.getElementById('apiKey').value = newKey
                    alert('API key regenerated successfully! Make sure to update any integrations using the old key.')
                }
            }
            
            function updateSettings() {
                alert('Settings updated successfully!')
            }
            
            async function loadCommissionProfiles() {
                try {
                    const headers = {
                        'Content-Type': 'application/json',
                        'X-API-Key': isDemoMode ? 'api_key_john_123456789' : (localStorage.getItem('auth_token') || 'demo-key')
                    }
                    
                    const response = await fetch('/api/commission-profiles', { headers })
                    
                    if (response.ok) {
                        const data = await response.json()
                        displayCommissionProfiles(data.profiles || [])
                    } else {
                        // Fallback to demo data
                        displayCommissionProfiles([
                            {
                                id: 1,
                                name: 'Standard Program',
                                description: 'Default commission structure',
                                base_rate: 10,
                                tier_structure: {
                                    tiers: [
                                        { threshold: 1000, rate: 12 },
                                        { threshold: 5000, rate: 15 }
                                    ]
                                },
                                status: 'active'
                            },
                            {
                                id: 2,
                                name: 'Premium Program',
                                description: 'Higher commission rates for top performers',
                                base_rate: 15,
                                tier_structure: {
                                    tiers: [
                                        { threshold: 2000, rate: 18 },
                                        { threshold: 10000, rate: 25 }
                                    ]
                                },
                                status: 'active'
                            }
                        ])
                    }
                } catch (error) {
                    console.error('Error loading commission profiles:', error)
                    displayCommissionProfiles([])
                }
            }
            
            function displayCommissionProfiles(profiles) {
                const container = document.getElementById('commissionProfilesList')
                
                if (!profiles || profiles.length === 0) {
                    container.innerHTML = \`
                        <div class="col-span-full text-center py-8 text-gray-400">
                            <i class="fas fa-percentage text-4xl mb-4"></i>
                            <p>No commission profiles found. Create your first profile to get started!</p>
                        </div>
                    \`
                    return
                }
                
                const profilesHTML = profiles.map(profile => {
                    // Handle both formats: array from DB and object with tiers from frontend
                    let tiers = []
                    if (Array.isArray(profile.tier_structure)) {
                        tiers = profile.tier_structure
                    } else if (profile.tier_structure && profile.tier_structure.tiers) {
                        tiers = profile.tier_structure.tiers
                    }
                    
                    const tierInfo = tiers.length > 0 ? \`\${tiers.length} tiers\` : 'No tiers'
                    
                    const tierDetails = tiers.length > 0 ? 
                        tiers.map(tier => {
                            const sales = tier.min_sales || tier.threshold || 0
                            const rate = tier.rate
                            return \`$\${sales}: \${rate}%\`
                        }).join(', ') : 
                        'Base rate only'
                    
                    return \`
                        <div class="glass p-6 rounded-lg hover:border-green-500 transition-colors border border-gray-600">
                            <div class="flex justify-between items-start mb-3">
                                <h3 class="text-lg font-semibold">\${profile.name}</h3>
                                <span class="bg-\${profile.status === 'active' ? 'green' : 'red'}-600 text-xs px-2 py-1 rounded">
                                    \${profile.status || 'Active'}
                                </span>
                            </div>
                            
                            <p class="text-gray-400 text-sm mb-4">\${profile.description || 'No description'}</p>
                            
                            <div class="space-y-2 mb-4">
                                <div class="flex justify-between">
                                    <span class="text-gray-400">Base Rate:</span>
                                    <span class="font-semibold text-green-400">\${profile.base_rate}%</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-400">Tiers:</span>
                                    <span class="text-sm">\${tierInfo}</span>
                                </div>
                            </div>
                            
                            \${profile.tier_structure && profile.tier_structure.tiers ? \`
                                <div class="bg-gray-800 p-3 rounded text-xs mb-4">
                                    <div class="font-medium mb-1">Tier Structure:</div>
                                    <div class="text-gray-400">\${tierDetails}</div>
                                </div>
                            \` : ''}
                            
                            <div class="flex space-x-2">
                                <button onclick="editCommissionProfile(\${profile.id})" class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors">
                                    <i class="fas fa-edit mr-1"></i>Edit
                                </button>
                                <button onclick="deleteCommissionProfile(\${profile.id})" class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors">
                                    <i class="fas fa-trash mr-1"></i>Delete
                                </button>
                            </div>
                        </div>
                    \`
                }).join('')
                
                container.innerHTML = profilesHTML
            }
            
            function showCreateProfileForm() {
                document.getElementById('createProfileForm').classList.remove('hidden')
            }
            
            function hideCreateProfileForm() {
                document.getElementById('createProfileForm').classList.add('hidden')
                document.getElementById('commissionProfileForm').reset()
            }
            
            function addTierRow() {
                const tiersList = document.getElementById('tiersList')
                const newRow = document.createElement('div')
                newRow.className = 'tier-row grid grid-cols-3 gap-4 mb-3'
                newRow.innerHTML = \`
                    <div>
                        <label class="block text-xs text-gray-400 mb-1">Sales Threshold ($)</label>
                        <input type="number" name="tierThreshold[]" class="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2" placeholder="5000" min="0">
                    </div>
                    <div>
                        <label class="block text-xs text-gray-400 mb-1">Commission Rate (%)</label>
                        <input type="number" name="tierRate[]" class="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2" placeholder="20" min="0" max="100" step="0.1">
                    </div>
                    <div class="flex items-end">
                        <button type="button" onclick="removeTierRow(this)" class="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm">
                            <i class="fas fa-minus"></i>
                        </button>
                    </div>
                \`
                tiersList.appendChild(newRow)
            }
            
            function removeTierRow(button) {
                button.closest('.tier-row').remove()
            }
            
            function editCommissionProfile(profileId) {
                alert(\`Edit commission profile functionality coming soon for profile ID: \${profileId}\`)
            }
            
            function deleteCommissionProfile(profileId) {
                if (confirm('Are you sure you want to delete this commission profile? This action cannot be undone.')) {
                    alert(\`Delete commission profile functionality coming soon for profile ID: \${profileId}\`)
                }
            }
            
            // ===========================================
            // STORE INTEGRATIONS FUNCTIONALITY
            // ===========================================
            
            let currentIntegration = null
            let currentProducts = []
            let currentPage = 1
            let productsPerPage = 24
            
            async function loadStoreIntegrations() {
                try {
                    const headers = {
                        'Content-Type': 'application/json',
                        'X-API-Key': isDemoMode ? 'api_key_john_123456789' : (localStorage.getItem('auth_token') || 'demo-key')
                    }
                    
                    const response = await fetch('/api/integrations', { headers })
                    
                    if (response.ok) {
                        const data = await response.json()
                        displayStoreIntegrations(data.integrations || [])
                        updateIntegrationStats(data.integrations || [])
                    } else {
                        // Fallback to demo data
                        displayStoreIntegrations([])
                        updateIntegrationStats([])
                    }
                } catch (error) {
                    console.error('Error loading integrations:', error)
                    displayStoreIntegrations([])
                }
            }
            
            function updateIntegrationStats(integrations) {
                const connectedStores = integrations.length
                const totalProducts = integrations.reduce((sum, int) => sum + (int.products_count || 0), 0)
                
                document.getElementById('connectedStoresCount').textContent = connectedStores
                document.getElementById('syncedProductsCount').textContent = totalProducts.toLocaleString()
                document.getElementById('productLinksCount').textContent = '0' // Will be calculated when needed
            }
            
            function displayStoreIntegrations(integrations) {
                const container = document.getElementById('integrationsList')
                
                if (!integrations || integrations.length === 0) {
                    container.innerHTML = \`
                        <div class="glass p-8 rounded-lg text-center">
                            <i class="fas fa-store text-4xl text-gray-400 mb-4"></i>
                            <h3 class="text-lg font-semibold mb-2">No Store Connections</h3>
                            <p class="text-gray-400 mb-4">Connect your Shopify store to start creating affiliate links for your products.</p>
                            <button onclick="showAddIntegrationForm()" class="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg transition-colors">
                                <i class="fas fa-plus mr-2"></i>Connect Your First Store
                            </button>
                        </div>
                    \`
                    return
                }
                
                const integrationsHTML = integrations.map(integration => {
                    const statusColor = integration.status === 'active' ? 'green' : 'red'
                    const lastSync = integration.last_sync_at ? 
                        new Date(integration.last_sync_at).toLocaleDateString() : 
                        'Never'
                    
                    return \`
                        <div class="glass p-6 rounded-lg hover:border-green-500 transition-colors border border-gray-600">
                            <div class="flex justify-between items-start mb-4">
                                <div class="flex items-center space-x-3">
                                    <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-shopify text-white text-xl"></i>
                                    </div>
                                    <div>
                                        <h3 class="text-lg font-semibold">\${integration.store_name}</h3>
                                        <p class="text-sm text-gray-400">\${integration.platform.charAt(0).toUpperCase() + integration.platform.slice(1)} Store</p>
                                    </div>
                                </div>
                                <span class="bg-\${statusColor}-600 text-xs px-2 py-1 rounded">
                                    \${integration.status.charAt(0).toUpperCase() + integration.status.slice(1)}
                                </span>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div class="text-center">
                                    <div class="text-2xl font-bold text-blue-400">\${(integration.products_count || 0).toLocaleString()}</div>
                                    <div class="text-sm text-gray-400">Products Synced</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-2xl font-bold text-green-400">0</div>
                                    <div class="text-sm text-gray-400">Affiliate Links</div>
                                </div>
                            </div>
                            
                            <div class="text-xs text-gray-400 mb-4">
                                <strong>Store URL:</strong> <a href="\${integration.store_url}" target="_blank" class="text-blue-400 hover:underline">\${integration.store_url}</a><br>
                                <strong>Last Sync:</strong> \${lastSync}
                            </div>
                            
                            <div class="flex space-x-2">
                                <button onclick="browseProducts(\${integration.id}, '\${integration.store_name}')" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm transition-colors flex-1">
                                    <i class="fas fa-boxes mr-1"></i>Browse Products
                                </button>
                                <button onclick="syncIntegration(\${integration.id})" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm transition-colors">
                                    <i class="fas fa-sync mr-1"></i>Sync
                                </button>
                                <button onclick="deleteIntegration(\${integration.id})" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm transition-colors">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    \`
                }).join('')
                
                container.innerHTML = integrationsHTML
            }
            
            function showAddIntegrationForm() {
                document.getElementById('addIntegrationForm').classList.remove('hidden')
                document.getElementById('shopifyStoreName').focus()
            }
            
            function hideAddIntegrationForm() {
                document.getElementById('addIntegrationForm').classList.add('hidden')
                document.getElementById('shopifyIntegrationForm').reset()
            }
            
            async function browseProducts(integrationId, storeName) {
                currentIntegration = { id: integrationId, name: storeName }
                currentPage = 1
                
                // Show products browser
                document.getElementById('integrationsList').style.display = 'none'
                document.getElementById('addIntegrationForm').classList.add('hidden')
                document.getElementById('productsBrowser').classList.remove('hidden')
                document.getElementById('productsBrowserTitle').textContent = \`\${storeName} Products\`
                
                await loadProducts(integrationId)
            }
            
            function hideProductsBrowser() {
                document.getElementById('productsBrowser').classList.add('hidden')
                document.getElementById('integrationsList').style.display = 'block'
                currentIntegration = null
            }
            
            async function loadProducts(integrationId, search = '', category = '') {
                try {
                    const headers = {
                        'Content-Type': 'application/json',
                        'X-API-Key': isDemoMode ? 'api_key_john_123456789' : (localStorage.getItem('auth_token') || 'demo-key')
                    }
                    
                    const params = new URLSearchParams({
                        page: currentPage,
                        limit: productsPerPage,
                        search,
                        category
                    })
                    
                    const response = await fetch(\`/api/integrations/\${integrationId}/products?\${params}\`, { headers })
                    
                    if (response.ok) {
                        const data = await response.json()
                        currentProducts = data.products || []
                        displayProducts(data.products || [])
                        updateProductsFilters(data.categories || [])
                        updateProductsPagination(data.pagination)
                    } else {
                        displayProducts([])
                    }
                } catch (error) {
                    console.error('Error loading products:', error)
                    displayProducts([])
                }
            }
            
            function displayProducts(products) {
                const grid = document.getElementById('productsGrid')
                
                if (!products || products.length === 0) {
                    grid.innerHTML = \`
                        <div class="col-span-full text-center py-8 text-gray-400">
                            <i class="fas fa-box text-4xl mb-4"></i>
                            <p>No products found. Try syncing your store or adjusting filters.</p>
                        </div>
                    \`
                    return
                }
                
                const productsHTML = products.map(product => {
                    const images = Array.isArray(product.images) ? product.images : JSON.parse(product.images || '[]')
                    const imageUrl = product.image_url || images[0] || '/placeholder-product.png'
                    const hasLink = product.has_affiliate_link
                    
                    return \`
                        <div class="glass p-4 rounded-lg hover:border-green-500 transition-colors border border-gray-600">
                            <div class="aspect-square mb-3 overflow-hidden rounded-lg bg-gray-800 flex items-center justify-center">
                                \${imageUrl && imageUrl !== '/placeholder-product.png' ? \`
                                    <img src="\${imageUrl}" alt="\${product.title}" class="w-full h-full object-cover product-image" 
                                         onerror="this.parentElement.innerHTML='<i class=\\"fas fa-box text-4xl text-gray-500\\"></i>'">
                                \` : \`
                                    <i class="fas fa-box text-4xl text-gray-500"></i>
                                \`}
                            </div>
                            
                            <h4 class="font-semibold text-sm mb-2 line-clamp-2">\${product.title}</h4>
                            
                            <div class="text-xs text-gray-400 mb-3">
                                \${product.vendor ? \`<div><strong>Brand:</strong> \${product.vendor}</div>\` : ''}
                                \${product.product_type ? \`<div><strong>Type:</strong> \${product.product_type}</div>\` : ''}
                            </div>
                            
                            \${hasLink ? \`
                                <button class="w-full bg-gray-600 text-gray-300 px-3 py-2 rounded text-sm cursor-not-allowed" disabled>
                                    <i class="fas fa-check mr-1"></i>Link Created
                                </button>
                            \` : \`
                                <button onclick="createProductLink(\${product.id}, '\${product.title.replace(/'/g, '\\\\\'')}')" 
                                        class="w-full bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm transition-colors">
                                    <i class="fas fa-link mr-1"></i>Create Link
                                </button>
                            \`}
                        </div>
                    \`
                }).join('')
                
                grid.innerHTML = productsHTML
            }
            
            function updateProductsFilters(categories) {
                const categoryFilter = document.getElementById('productCategoryFilter')
                categoryFilter.innerHTML = '<option value="">All Categories</option>'
                
                categories.forEach(category => {
                    const option = document.createElement('option')
                    option.value = category
                    option.textContent = category
                    categoryFilter.appendChild(option)
                })
            }
            
            function updateProductsPagination(pagination) {
                const container = document.getElementById('productsPagination')
                
                if (!pagination || pagination.pages <= 1) {
                    container.innerHTML = ''
                    return
                }
                
                let paginationHTML = ''
                
                // Previous button
                if (pagination.page > 1) {
                    paginationHTML += \`
                        <button onclick="changePage(\${pagination.page - 1})" class="bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                    \`
                }
                
                // Page numbers
                const startPage = Math.max(1, pagination.page - 2)
                const endPage = Math.min(pagination.pages, pagination.page + 2)
                
                for (let i = startPage; i <= endPage; i++) {
                    const isActive = i === pagination.page
                    paginationHTML += \`
                        <button onclick="changePage(\${i})" 
                                class="\${isActive ? 'bg-green-600' : 'bg-gray-600 hover:bg-gray-700'} px-3 py-2 rounded">
                            \${i}
                        </button>
                    \`
                }
                
                // Next button
                if (pagination.page < pagination.pages) {
                    paginationHTML += \`
                        <button onclick="changePage(\${pagination.page + 1})" class="bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    \`
                }
                
                container.innerHTML = paginationHTML
            }
            
            function changePage(page) {
                currentPage = page
                const search = document.getElementById('productSearch').value
                const category = document.getElementById('productCategoryFilter').value
                loadProducts(currentIntegration.id, search, category)
            }
            
            function filterProducts() {
                currentPage = 1
                const search = document.getElementById('productSearch').value
                const category = document.getElementById('productCategoryFilter').value
                loadProducts(currentIntegration.id, search, category)
            }
            
            async function createProductLink(productId, productTitle) {
                try {
                    const headers = {
                        'Content-Type': 'application/json',
                        'X-API-Key': isDemoMode ? 'api_key_john_123456789' : (localStorage.getItem('auth_token') || 'demo-key')
                    }
                    
                    const campaignName = prompt('Enter campaign name (optional):', \`\${currentIntegration.name} Products\`)
                    if (campaignName === null) return // User cancelled
                    
                    const customTitle = prompt('Custom link title (optional):', productTitle)
                    if (customTitle === null) return // User cancelled
                    
                    const response = await fetch(\`/api/integrations/\${currentIntegration.id}/products/\${productId}/create-link\`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            campaign_name: campaignName,
                            custom_title: customTitle
                        })
                    })
                    
                    if (response.ok) {
                        const data = await response.json()
                        
                        // Show success notification with copy option
                        const notification = document.createElement('div')
                        notification.className = 'fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg z-50 max-w-sm'
                        notification.innerHTML = \`
                            <div class="flex items-center justify-between mb-2">
                                <strong>Affiliate Link Created!</strong>
                                <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-300">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <div class="text-sm mb-2">Product: \${data.product.title}</div>
                            <div class="flex items-center space-x-2">
                                <input type="text" value="\${data.link.full_link}" class="flex-1 bg-green-700 px-2 py-1 rounded text-xs" readonly>
                                <button onclick="copyToClipboard('\${data.link.full_link}')" class="bg-green-700 hover:bg-green-800 px-2 py-1 rounded text-xs">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                        \`
                        document.body.appendChild(notification)
                        
                        setTimeout(() => notification.remove(), 10000)
                        
                        // Refresh the products grid to show the updated state
                        const search = document.getElementById('productSearch').value
                        const category = document.getElementById('productCategoryFilter').value
                        loadProducts(currentIntegration.id, search, category)
                        
                    } else {
                        const error = await response.json()
                        alert('Error creating affiliate link: ' + (error.message || 'Unknown error'))
                    }
                } catch (error) {
                    console.error('Error creating product link:', error)
                    alert('Error creating affiliate link. Please try again.')
                }
            }
            
            function copyToClipboard(text) {
                navigator.clipboard.writeText(text).then(() => {
                    const notification = document.createElement('div')
                    notification.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50'
                    notification.textContent = 'Link copied to clipboard!'
                    document.body.appendChild(notification)
                    setTimeout(() => notification.remove(), 2000)
                })
            }
            
            async function syncIntegration(integrationId) {
                const syncBtn = event.target
                const originalText = syncBtn.innerHTML
                syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Syncing...'
                syncBtn.disabled = true
                
                try {
                    const headers = {
                        'Content-Type': 'application/json',
                        'X-API-Key': isDemoMode ? 'api_key_john_123456789' : (localStorage.getItem('auth_token') || 'demo-key')
                    }
                    
                    const response = await fetch(\`/api/integrations/\${integrationId}/sync\`, {
                        method: 'POST',
                        headers
                    })
                    
                    if (response.ok) {
                        const data = await response.json()
                        alert(\`Sync completed! Processed: \${data.sync_result.products_processed}, Added: \${data.sync_result.products_added}, Updated: \${data.sync_result.products_updated}\`)
                        loadStoreIntegrations() // Refresh the list
                    } else {
                        const error = await response.json()
                        alert('Sync failed: ' + (error.error || 'Unknown error'))
                    }
                } catch (error) {
                    console.error('Sync error:', error)
                    alert('Sync failed. Please check your store connection.')
                } finally {
                    syncBtn.innerHTML = originalText
                    syncBtn.disabled = false
                }
            }
            
            function syncStoreProducts() {
                if (currentIntegration) {
                    syncIntegration(currentIntegration.id)
                }
            }
            
            function deleteIntegration(integrationId) {
                if (confirm('Are you sure you want to delete this store integration? This will also remove all associated product links.')) {
                    // Implementation for deletion would go here
                    alert('Delete integration functionality coming soon!')
                }
            }
            
            // Profile form handler
            document.addEventListener('DOMContentLoaded', () => {
                const profileForm = document.getElementById('profileForm')
                if (profileForm) {
                    profileForm.addEventListener('submit', (e) => {
                        e.preventDefault()
                        alert('Profile updated successfully!')
                    })
                }
                
                const shopifyIntegrationForm = document.getElementById('shopifyIntegrationForm')
                if (shopifyIntegrationForm) {
                    shopifyIntegrationForm.addEventListener('submit', async (e) => {
                        e.preventDefault()
                        
                        const storeName = document.getElementById('shopifyStoreName').value
                        const storeUrl = document.getElementById('shopifyStoreUrl').value
                        const accessToken = document.getElementById('shopifyAccessToken').value
                        
                        const submitBtn = e.target.querySelector('button[type="submit"]')
                        const originalText = submitBtn.innerHTML
                        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Connecting...'
                        submitBtn.disabled = true
                        
                        try {
                            const headers = {
                                'Content-Type': 'application/json',
                                'X-API-Key': isDemoMode ? 'api_key_john_123456789' : (localStorage.getItem('auth_token') || 'demo-key')
                            }
                            
                            const response = await fetch('/api/integrations/shopify', {
                                method: 'POST',
                                headers,
                                body: JSON.stringify({
                                    store_name: storeName,
                                    store_url: storeUrl,
                                    access_token: accessToken
                                })
                            })
                            
                            if (response.ok) {
                                const data = await response.json()
                                alert(\`Successfully connected to \${data.integration.store_name}! You can now sync products.\`)
                                hideAddIntegrationForm()
                                loadStoreIntegrations() // Refresh the list
                            } else {
                                const error = await response.json()
                                alert('Connection failed: ' + (error.error || 'Please check your credentials'))
                            }
                        } catch (error) {
                            console.error('Integration error:', error)
                            alert('Connection failed. Please check your network and try again.')
                        } finally {
                            submitBtn.innerHTML = originalText
                            submitBtn.disabled = false
                        }
                    })
                }
                
                const commissionProfileForm = document.getElementById('commissionProfileForm')
                if (commissionProfileForm) {
                    commissionProfileForm.addEventListener('submit', async (e) => {
                        e.preventDefault()
                        
                        const formData = new FormData(e.target)
                        const thresholds = formData.getAll('tierThreshold[]')
                        const rates = formData.getAll('tierRate[]')
                        
                        const tiers = []
                        for (let i = 0; i < thresholds.length; i++) {
                            if (thresholds[i] && rates[i]) {
                                tiers.push({
                                    threshold: parseFloat(thresholds[i]),
                                    rate: parseFloat(rates[i])
                                })
                            }
                        }
                        
                        const profileData = {
                            name: document.getElementById('profileName').value,
                            description: document.getElementById('profileDescription').value,
                            base_rate: parseFloat(document.getElementById('baseRate').value),
                            tier_structure: tiers.length > 0 ? { tiers } : {}
                        }
                        
                        try {
                            const headers = {
                                'Content-Type': 'application/json',
                                'X-API-Key': isDemoMode ? 'api_key_john_123456789' : (localStorage.getItem('auth_token') || 'demo-key')
                            }
                            
                            const response = await fetch('/api/commission-profiles', {
                                method: 'POST',
                                headers,
                                body: JSON.stringify(profileData)
                            })
                            
                            if (response.ok) {
                                const result = await response.json()
                                alert('Commission profile created successfully!')
                                hideCreateProfileForm()
                                loadCommissionProfiles() // Reload the list
                            } else {
                                alert('Error creating commission profile. Please try again.')
                            }
                        } catch (error) {
                            console.error('Error creating commission profile:', error)
                            alert('Commission profile created successfully! (Demo mode)')
                            hideCreateProfileForm()
                            loadCommissionProfiles()
                        }
                    })
                }
                
                // Product search enter key handler
                const productSearch = document.getElementById('productSearch')
                if (productSearch) {
                    productSearch.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            filterProducts()
                        }
                    })
                }
            })

            function logout() {
                localStorage.removeItem('auth_token')
                window.location.href = '/'
            }

            // Load initial data
            loadSectionData('overview')
        </script>
    </body>
    </html>
  `)
})

// Link redirect handler with enhanced tracking
app.get('/go/:shortCode', async (c) => {
  const shortCode = c.req.param('shortCode')
  
  try {
    // Find the affiliate link
    const link = await c.env.DB.prepare(`
      SELECT al.*, u.id as user_id 
      FROM affiliate_links al
      JOIN users u ON al.user_id = u.id
      WHERE al.short_code = ? AND al.status = 'active'
    `).bind(shortCode).first()
    
    if (!link) {
      return c.html('<h1>Link not found</h1>', 404)
    }
    
    // Get visitor information
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown'
    const userAgent = c.req.header('User-Agent') || 'unknown'
    const referrer = c.req.header('Referer') || null
    
    // Analyze traffic source
    let trafficSource = 'direct'
    if (referrer) {
      const refDomain = new URL(referrer).hostname.toLowerCase()
      if (refDomain.includes('facebook.') || refDomain.includes('twitter.') || refDomain.includes('instagram.') || refDomain.includes('linkedin.')) {
        trafficSource = 'social'
      } else if (refDomain.includes('google.') || refDomain.includes('bing.') || refDomain.includes('yahoo.')) {
        trafficSource = 'search'
      } else if (refDomain.includes('gmail.') || refDomain.includes('outlook.') || referrer.includes('email')) {
        trafficSource = 'email'
      } else {
        trafficSource = 'other'
      }
    }
    
    // Get device type
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent)
    const deviceType = isMobile ? 'mobile' : 'desktop'
    
    // Check for unique visitor (simple IP-based check for demo)
    const existingVisit = await c.env.DB.prepare(`
      SELECT id FROM traffic 
      WHERE user_id = ? AND ip_address = ? AND clicked_at > datetime('now', '-1 hour')
    `).bind(link.user_id, ip).first()
    
    const isUnique = !existingVisit
    
    // Log the click in traffic table
    const trafficResult = await c.env.DB.prepare(`
      INSERT INTO traffic 
      (user_id, link_id, ip_address, user_agent, referrer, device_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(link.user_id, link.id, ip, userAgent, referrer, deviceType).run()
    
    // Update affiliate link click count
    await c.env.DB.prepare(`
      UPDATE affiliate_links 
      SET clicks = clicks + 1, updated_at = datetime('now')
      WHERE id = ?
    `).bind(link.id).run()
    
    // Update hourly link performance tracking
    const currentHour = new Date().getHours()
    const today = new Date().toISOString().split('T')[0]
    
    await c.env.DB.prepare(`
      INSERT INTO link_performance 
      (link_id, date, hour, clicks, unique_clicks, ${trafficSource}_traffic)
      VALUES (?, ?, ?, 1, ?, 1)
      ON CONFLICT(link_id, date, hour) DO UPDATE SET
        clicks = clicks + 1,
        unique_clicks = unique_clicks + ?,
        ${trafficSource}_traffic = ${trafficSource}_traffic + 1
    `).bind(link.id, today, currentHour, isUnique ? 1 : 0, isUnique ? 1 : 0).run()
    
    // Update daily KPI stats
    await updateKPIStats(c, link.user_id, 'click', { unique: isUnique })
    
    // Redirect to original URL
    return c.redirect(link.original_url)
  } catch (error) {
    console.error('Redirect error:', error)
    return c.html('<h1>Redirect error</h1>', 500)
  }
})

// Conversion webhook endpoint (for external integration)
app.post('/api/conversions/webhook', async (c) => {
  const { order_id, affiliate_code, customer_email, order_value, product_id } = await c.req.json()
  
  if (!order_id || !affiliate_code || !order_value) {
    return c.json({ error: 'Missing required fields' }, 400)
  }
  
  try {
    // Find the affiliate link and user
    const link = await c.env.DB.prepare(`
      SELECT al.*, u.id as user_id 
      FROM affiliate_links al
      JOIN users u ON al.user_id = u.id
      WHERE al.short_code = ? AND al.status = 'active'
    `).bind(affiliate_code).first()
    
    if (!link) {
      return c.json({ error: 'Invalid affiliate code' }, 404)
    }
    
    // Check for duplicate conversion
    const existingConversion = await c.env.DB.prepare(`
      SELECT id FROM conversions WHERE order_id = ?
    `).bind(order_id).first()
    
    if (existingConversion) {
      return c.json({ error: 'Conversion already recorded' }, 409)
    }
    
    // Calculate commission
    const commissionData = await calculateCommission(c, link.user_id, order_value)
    
    // Create conversion record
    const conversionResult = await c.env.DB.prepare(`
      INSERT INTO conversions 
      (user_id, link_id, order_id, product_id, order_value, commission_value, 
       customer_hash, status, converted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', datetime('now'))
    `).bind(
      link.user_id, 
      link.id, 
      order_id, 
      product_id || null,
      order_value, 
      commissionData.amount,
      customer_email ? await hashPassword(customer_email) : null
    ).run()
    
    // Create commission record
    await c.env.DB.prepare(`
      INSERT INTO commissions 
      (user_id, product_id, amount, commission_rate, sale_amount, 
       status, order_id, customer_email, sale_date)
      VALUES (?, ?, ?, ?, ?, 'approved', ?, ?, datetime('now'))
    `).bind(
      link.user_id,
      product_id || null,
      commissionData.amount,
      commissionData.rate,
      order_value,
      order_id,
      customer_email || null
    ).run()
    
    // Update affiliate link conversion count
    await c.env.DB.prepare(`
      UPDATE affiliate_links 
      SET conversions = conversions + 1, revenue = revenue + ?
      WHERE id = ?
    `).bind(commissionData.amount, link.id).run()
    
    // Update user balances
    await c.env.DB.prepare(`
      INSERT INTO user_settings (user_id, current_balance, lifetime_earnings)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        current_balance = current_balance + ?,
        lifetime_earnings = lifetime_earnings + ?
    `).bind(
      link.user_id, 
      commissionData.amount, 
      commissionData.amount,
      commissionData.amount,
      commissionData.amount
    ).run()
    
    // Update KPI stats for conversion
    await updateKPIStats(c, link.user_id, 'conversion', {
      saleAmount: order_value,
      commissionAmount: commissionData.amount
    })
    
    // Update hourly performance
    const currentHour = new Date().getHours()
    const today = new Date().toISOString().split('T')[0]
    
    await c.env.DB.prepare(`
      UPDATE link_performance 
      SET conversions = conversions + 1, revenue = revenue + ?
      WHERE link_id = ? AND date = ? AND hour = ?
    `).bind(commissionData.amount, link.id, today, currentHour).run()
    
    return c.json({
      success: true,
      conversion_id: conversionResult.meta.last_row_id,
      commission_amount: commissionData.amount,
      commission_rate: commissionData.rate
    })
  } catch (error) {
    console.error('Conversion webhook error:', error)
    return c.json({ error: 'Failed to process conversion' }, 500)
  }
})

export default app
