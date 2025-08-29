// Utility functions for Vercel API routes
import crypto from 'crypto'

// Generate API key
export const generateApiKey = () => `api_key_${Date.now()}_${Math.random().toString(36).substring(7)}`

// Generate short code for affiliate links
export const generateShortCode = () => Math.random().toString(36).substring(2, 8)

// Hash password (simplified for demo)
export const hashPassword = async (password) => {
  return crypto.createHash('sha256').update(password + 'affiliate_boss_salt').digest('hex')
}

// CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key'
}

// Handle OPTIONS requests for CORS
export const handleCORS = (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(200).json({})
    return true
  }
  
  // Add CORS headers to all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value)
  })
  
  return false
}

// Authentication middleware for Vercel API routes
export const authenticateAPI = (req, res) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key
  
  if (!apiKey) {
    res.status(401).json({ error: 'API key required' })
    return null
  }
  
  // Handle demo mode API key
  if (apiKey === 'api_key_john_123456789') {
    return {
      id: 1,
      username: 'john_demo',
      email: 'john.demo@affiliateboss.com',
      first_name: 'John',
      last_name: 'Demo',
      phone: '+1-555-0123',
      api_key: apiKey,
      status: 'approved',
      created_at: '2024-01-15T10:30:00Z',
      last_login: new Date().toISOString()
    }
  }
  
  // In production, validate against database
  // For demo purposes, reject other API keys
  res.status(401).json({ error: 'Invalid API key' })
  return null
}

// Calculate commission (demo function)
export const calculateCommission = async (userId, saleAmount) => {
  // Default 15% commission for demo
  const rate = 15.00
  const amount = saleAmount * (rate / 100)
  return { rate, amount }
}

// Fake data for demo mode
export const getFakeData = () => {
  const fakeProducts = [
    {
      id: 1,
      name: "MacBook Pro M3 Max 16-inch",
      price: "$3,999.00",
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop",
      description: "Apple's most powerful laptop with M3 Max chip, 16-inch Liquid Retina XDR display, up to 128GB unified memory.",
      category: "Electronics",
      vendor: "Apple",
      shopify_product_id: "sp_001",
      affiliate_commission: 8.5,
      stock_quantity: 25,
      created_at: "2024-01-15T10:30:00Z"
    },
    {
      id: 2,
      name: "Tesla Model S Plaid",
      price: "$89,990.00",
      image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&h=400&fit=crop",
      description: "Electric luxury sedan with 1,020 horsepower, 0-60 mph in 1.99 seconds, 396 miles range.",
      category: "Automotive",
      vendor: "Tesla",
      shopify_product_id: "sp_002", 
      affiliate_commission: 12.0,
      stock_quantity: 5,
      created_at: "2024-01-16T14:22:00Z"
    },
    {
      id: 3,
      name: "iPhone 15 Pro Max",
      price: "$1,199.00", 
      image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop",
      description: "Latest iPhone with titanium design, A17 Pro chip, advanced camera system with 5x telephoto zoom.",
      category: "Electronics",
      vendor: "Apple",
      shopify_product_id: "sp_003",
      affiliate_commission: 6.5,
      stock_quantity: 150,
      created_at: "2024-01-17T09:15:00Z"
    },
    {
      id: 4,
      name: "Sony WH-1000XM5 Headphones",
      price: "$399.99",
      image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop",
      description: "Industry-leading noise canceling wireless headphones with 30-hour battery life and crystal-clear calls.",
      category: "Audio",
      vendor: "Sony",
      shopify_product_id: "sp_004",
      affiliate_commission: 15.0,
      stock_quantity: 75,
      created_at: "2024-01-18T16:45:00Z"
    },
    {
      id: 5,
      name: "Canon EOS R5 Camera",
      price: "$3,899.00",
      image: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=400&fit=crop",
      description: "Professional mirrorless camera with 45MP sensor, 8K video recording, and advanced autofocus system.",
      category: "Photography",
      vendor: "Canon",
      shopify_product_id: "sp_005",
      affiliate_commission: 10.5,
      stock_quantity: 12,
      created_at: "2024-01-19T11:20:00Z"
    },
    {
      id: 6,
      name: "Dyson V15 Detect Vacuum",
      price: "$749.99",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
      description: "Cordless vacuum with laser dust detection, advanced filtration, and up to 60 minutes runtime.",
      category: "Home & Garden",
      vendor: "Dyson",
      shopify_product_id: "sp_006",
      affiliate_commission: 18.0,
      stock_quantity: 40,
      created_at: "2024-01-20T08:30:00Z"
    },
    {
      id: 7,
      name: "Nintendo Switch OLED",
      price: "$349.99",
      image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=400&fit=crop",
      description: "Gaming console with vibrant 7-inch OLED screen, enhanced audio, and versatile play modes.",
      category: "Gaming",
      vendor: "Nintendo",
      shopify_product_id: "sp_007",
      affiliate_commission: 12.5,
      stock_quantity: 85,
      created_at: "2024-01-21T13:10:00Z"
    },
    {
      id: 8,
      name: "Rolex Submariner",
      price: "$9,150.00",
      image: "https://images.unsplash.com/photo-1587836374868-b8b3c6b2e4b5?w=400&h=400&fit=crop",
      description: "Iconic luxury diving watch with waterproof Oyster case and self-winding movement.",
      category: "Watches",
      vendor: "Rolex",
      shopify_product_id: "sp_008",
      affiliate_commission: 5.0,
      stock_quantity: 3,
      created_at: "2024-01-22T15:45:00Z"
    },
    {
      id: 9,
      name: "KitchenAid Stand Mixer",
      price: "$429.99",
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop",
      description: "Professional-grade stand mixer with 10 speeds and multiple attachment options for all your baking needs.",
      category: "Kitchen",
      vendor: "KitchenAid",
      shopify_product_id: "sp_009",
      affiliate_commission: 20.0,
      stock_quantity: 60,
      created_at: "2024-01-23T10:15:00Z"
    },
    {
      id: 10,
      name: "Peloton Bike+",
      price: "$2,495.00",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
      description: "Premium exercise bike with rotating HD touchscreen and access to live and on-demand classes.",
      category: "Fitness",
      vendor: "Peloton",
      shopify_product_id: "sp_010",
      affiliate_commission: 14.0,
      stock_quantity: 18,
      created_at: "2024-01-24T12:30:00Z"
    },
    {
      id: 11,
      name: "Samsung 85\" QLED 4K TV",
      price: "$2,799.99",
      image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop",
      description: "85-inch QLED 4K Smart TV with Quantum HDR, voice remote, and built-in streaming apps.",
      category: "Electronics",
      vendor: "Samsung",
      shopify_product_id: "sp_011",
      affiliate_commission: 11.0,
      stock_quantity: 22,
      created_at: "2024-01-25T14:20:00Z"
    },
    {
      id: 12,
      name: "Hermès Birkin Bag",
      price: "$12,000.00",
      image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop",
      description: "Iconic luxury handbag crafted from premium leather with gold-plated hardware and exquisite attention to detail.",
      category: "Fashion",
      vendor: "Hermès",
      shopify_product_id: "sp_012",
      affiliate_commission: 8.0,
      stock_quantity: 2,
      created_at: "2024-01-26T16:50:00Z"
    }
  ]

  const fakeShopifyStores = [
    {
      id: 1,
      name: "TechHub Premium",
      shopify_domain: "techhub-premium.myshopify.com",
      status: "connected",
      sync_status: "completed",
      products_count: 8,
      last_sync: "2024-01-29T10:15:00Z",
      created_at: "2024-01-15T10:30:00Z"
    },
    {
      id: 2,
      name: "Luxury Lifestyle Store", 
      shopify_domain: "luxury-lifestyle.myshopify.com",
      status: "connected",
      sync_status: "completed", 
      products_count: 4,
      last_sync: "2024-01-29T09:45:00Z",
      created_at: "2024-01-20T14:20:00Z"
    }
  ]

  const fakeCommissionHistory = [
    {
      id: 1,
      product_name: "MacBook Pro M3 Max 16-inch",
      commission_amount: 339.92,
      sale_amount: 3999.00,
      commission_rate: 8.5,
      date: "2024-01-28T14:30:00Z",
      status: "paid",
      payout_date: "2024-01-30T00:00:00Z"
    },
    {
      id: 2,
      product_name: "iPhone 15 Pro Max",
      commission_amount: 77.94,
      sale_amount: 1199.00,
      commission_rate: 6.5,
      date: "2024-01-27T11:20:00Z",
      status: "pending",
      payout_date: null
    },
    {
      id: 3,
      product_name: "Sony WH-1000XM5 Headphones",
      commission_amount: 60.00,
      sale_amount: 399.99,
      commission_rate: 15.0,
      date: "2024-01-26T16:45:00Z",
      status: "paid",
      payout_date: "2024-01-29T00:00:00Z"
    },
    {
      id: 4,
      product_name: "KitchenAid Stand Mixer",
      commission_amount: 86.00,
      sale_amount: 429.99,
      commission_rate: 20.0,
      date: "2024-01-25T09:15:00Z",
      status: "paid",
      payout_date: "2024-01-28T00:00:00Z"
    },
    {
      id: 5,
      product_name: "Dyson V15 Detect Vacuum",
      commission_amount: 135.00,
      sale_amount: 749.99,
      commission_rate: 18.0,
      date: "2024-01-24T13:30:00Z",
      status: "pending",
      payout_date: null
    }
  ]

  const fakeDashboardKPIs = {
    total_clicks: 15847,
    unique_clicks: 12456,
    conversions: 387,
    conversion_rate: 2.44,
    total_commission: 2847.92,
    pending_commission: 892.45,
    paid_commission: 1955.47,
    active_links: 24,
    top_performing_link: {
      id: 1,
      name: "MacBook Pro M3 Max",
      clicks: 2847,
      conversions: 45,
      commission: 1529.40
    }
  }

  return {
    products: fakeProducts,
    stores: fakeShopifyStores,
    commissionHistory: fakeCommissionHistory,
    dashboardKPIs: fakeDashboardKPIs
  }
}