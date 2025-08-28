import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt, sign, verify } from 'hono/jwt'
import { serveStatic } from 'hono/cloudflare-workers'

// Type definitions for Cloudflare bindings
type Bindings = {
  DB: D1Database;
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

// Authentication middleware
const authenticateAPI = async (c: any, next: any) => {
  const apiKey = c.req.header('X-API-Key') || c.req.query('api_key')
  
  if (!apiKey) {
    return c.json({ error: 'API key required' }, 401)
  }
  
  const user = await c.env.DB.prepare(`
    SELECT * FROM users WHERE api_key = ? AND status = 'approved'
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

                <!-- Other sections would be implemented here -->
                <div id="commissions-section" class="section hidden">
                    <h2 class="text-3xl font-bold mb-8">Commission History</h2>
                    <div class="glass p-6 rounded-lg">
                        <p>Commission tracking coming soon...</p>
                    </div>
                </div>

                <div id="payments-section" class="section hidden">
                    <h2 class="text-3xl font-bold mb-8">Payment History</h2>
                    <div class="glass p-6 rounded-lg">
                        <p>Payment history coming soon...</p>
                    </div>
                </div>

                <div id="profile-section" class="section hidden">
                    <h2 class="text-3xl font-bold mb-8">Profile Settings</h2>
                    <div class="glass p-6 rounded-lg">
                        <p>Profile management coming soon...</p>
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Check authentication
            const token = localStorage.getItem('auth_token')
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
                }
            }

            async function loadDashboardStats() {
                // Demo data for now
                document.getElementById('totalLinks').textContent = '5'
                document.getElementById('totalClicks').textContent = '233'
                document.getElementById('totalConversions').textContent = '12'
                document.getElementById('totalEarnings').textContent = '$340.25'
                
                document.getElementById('recentActivity').innerHTML = \`
                    <div class="flex items-center justify-between p-3 bg-gray-800 rounded">
                        <span>New click on Marketing Course link</span>
                        <span class="text-sm text-gray-400">2 minutes ago</span>
                    </div>
                    <div class="flex items-center justify-between p-3 bg-gray-800 rounded">
                        <span>Commission earned: $29.85</span>
                        <span class="text-sm text-gray-400">1 hour ago</span>
                    </div>
                    <div class="flex items-center justify-between p-3 bg-gray-800 rounded">
                        <span>New affiliate link created</span>
                        <span class="text-sm text-gray-400">3 hours ago</span>
                    </div>
                \`
            }

            async function loadAffiliateLinks() {
                // Demo data for now
                document.getElementById('linksList').innerHTML = \`
                    <div class="border border-gray-600 rounded-lg p-4">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <h3 class="font-semibold">Ultimate Marketing Course</h3>
                                <p class="text-sm text-gray-400">Summer Sale Campaign</p>
                            </div>
                            <span class="bg-green-600 text-xs px-2 py-1 rounded">Active</span>
                        </div>
                        <div class="text-sm mb-3">
                            <strong>Link:</strong> <span class="text-blue-400">https://affiliateboss.com/go/mkt001</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span>Clicks: <strong>150</strong></span>
                            <span>Conversions: <strong>8</strong></span>
                            <span>Earnings: <strong>$149.10</strong></span>
                        </div>
                        <div class="mt-3 flex space-x-2">
                            <button class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">Copy</button>
                            <button class="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm">Share SMS</button>
                            <button class="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm">Edit</button>
                        </div>
                    </div>
                \`
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
                            'X-API-Key': 'demo-api-key-123456789' // Demo mode
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

// Link redirect handler
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
    
    // Log the click
    await c.env.DB.prepare(`
      INSERT INTO traffic 
      (user_id, link_id, ip_address, user_agent, referrer)
      VALUES (?, ?, ?, ?, ?)
    `).bind(link.user_id, link.id, ip, userAgent, referrer).run()
    
    // Update click count
    await c.env.DB.prepare(`
      UPDATE affiliate_links 
      SET clicks = clicks + 1, updated_at = datetime('now')
      WHERE id = ?
    `).bind(link.id).run()
    
    // Redirect to original URL
    return c.redirect(link.original_url)
  } catch (error) {
    return c.html('<h1>Redirect error</h1>', 500)
  }
})

export default app
