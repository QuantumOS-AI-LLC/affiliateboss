// Store integrations API
const { handleCORS, authenticateAPI, getFakeData } = require('../_utils.js')

module.exports = function handler(req, res) {
  if (handleCORS(req, res)) return

  // Authenticate user
  const user = authenticateAPI(req, res)
  if (!user) return

  if (req.method === 'GET') {
    return getIntegrations(req, res, user)
  } else if (req.method === 'POST') {
    return createIntegration(req, res, user)
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

// Get user's store integrations
function getIntegrations(req, res, user) {
  const { stores } = getFakeData()
  
  return res.status(200).json({
    success: true,
    data: stores
  })
}

// Create new store integration
function createIntegration(req, res, user) {
  const { store_name, shopify_domain, access_token } = req.body || {}
  
  if (!store_name || !shopify_domain) {
    return res.status(400).json({ error: 'Store name and Shopify domain are required' })
  }
  
  // For demo mode, simulate successful integration
  const newIntegration = {
    id: Math.floor(Math.random() * 1000) + 100,
    name: store_name,
    shopify_domain: shopify_domain,
    status: 'connected',
    sync_status: 'pending',
    products_count: 0,
    last_sync: null,
    created_at: new Date().toISOString()
  }
  
  return res.status(200).json({
    success: true,
    data: newIntegration,
    message: 'Store integration created successfully'
  })
}