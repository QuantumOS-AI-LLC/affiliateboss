// Links API endpoints
import { handleCORS, authenticateAPI, generateShortCode, getFakeData } from '../_utils.js'

export default function handler(req, res) {
  if (handleCORS(req, res)) return

  // Authenticate user
  const user = authenticateAPI(req, res)
  if (!user) return

  if (req.method === 'GET') {
    return getLinks(req, res, user)
  } else if (req.method === 'POST') {
    return createLink(req, res, user)
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

// Get user's affiliate links
function getLinks(req, res, user) {
  // For demo mode, return fake links data
  const fakeLinks = [
    {
      id: 1,
      name: "MacBook Pro M3 Max Link",
      original_url: "https://apple.com/macbook-pro",
      short_url: `${req.headers.host || 'localhost'}/go/mbp001`,
      short_code: "mbp001",
      clicks: 2847,
      conversions: 45,
      earnings: 1529.40,
      created_at: "2024-01-15T10:30:00Z",
      status: "active"
    },
    {
      id: 2,
      name: "Tesla Model S Plaid",
      original_url: "https://tesla.com/models",
      short_url: `${req.headers.host || 'localhost'}/go/tesla02`,
      short_code: "tesla02", 
      clicks: 1056,
      conversions: 9,
      earnings: 1079.88,
      created_at: "2024-01-16T14:22:00Z",
      status: "active"
    },
    {
      id: 3,
      name: "iPhone 15 Pro Max Deal",
      original_url: "https://apple.com/iphone-15-pro",
      short_url: `${req.headers.host || 'localhost'}/go/ip15pm`,
      short_code: "ip15pm",
      clicks: 892,
      conversions: 31,
      earnings: 238.14,
      created_at: "2024-01-17T09:15:00Z",
      status: "active"
    },
    {
      id: 4,
      name: "Sony WH-1000XM5 Headphones",
      original_url: "https://sony.com/headphones/wh-1000xm5",
      short_url: `${req.headers.host || 'localhost'}/go/sony01`,
      short_code: "sony01",
      clicks: 645,
      conversions: 18,
      earnings: 108.00,
      created_at: "2024-01-18T16:45:00Z", 
      status: "active"
    },
    {
      id: 5,
      name: "Canon EOS R5 Camera",
      original_url: "https://canon.com/cameras/eos-r5",
      short_url: `${req.headers.host || 'localhost'}/go/canr5`,
      short_code: "canr5",
      clicks: 234,
      conversions: 3,
      earnings: 1229.70,
      created_at: "2024-01-19T11:20:00Z",
      status: "active"
    }
  ]

  return res.status(200).json({
    success: true,
    data: fakeLinks,
    total: fakeLinks.length
  })
}

// Create new affiliate link
function createLink(req, res, user) {
  const { original_url, name, description = '' } = req.body || {}
  
  if (!original_url || !name) {
    return res.status(400).json({ error: 'Original URL and name are required' })
  }
  
  // Validate URL format
  try {
    new URL(original_url)
  } catch (error) {
    return res.status(400).json({ error: 'Invalid URL format' })
  }
  
  // Generate short code
  const shortCode = generateShortCode()
  const shortUrl = `${req.headers.host || 'localhost'}/go/${shortCode}`
  
  // For demo mode, simulate successful creation
  const newLink = {
    id: Math.floor(Math.random() * 1000) + 100,
    name: name,
    original_url: original_url,
    short_url: shortUrl,
    short_code: shortCode,
    description: description,
    clicks: 0,
    conversions: 0,
    earnings: 0,
    created_at: new Date().toISOString(),
    status: 'active',
    user_id: user.id
  }
  
  return res.status(200).json({
    success: true,
    data: newLink,
    message: 'Link created successfully'
  })
}