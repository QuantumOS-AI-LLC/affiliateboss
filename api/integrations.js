const { handleCors, checkAuth, getDemoData } = require('./utils/helpers');

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    
    // Check authentication
    const user = checkAuth(req, res);
    if (!user) return;

    if (req.method === 'GET') {
        return getIntegrations(req, res, user);
    } else if (req.method === 'POST') {
        return createIntegration(req, res, user);
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
};

// Get user's store integrations
function getIntegrations(req, res, user) {
    const { stores } = getDemoData();
    
    res.status(200).json({
        success: true,
        data: stores
    });
}

// Create new store integration
function createIntegration(req, res, user) {
    const { store_name, shopify_domain, access_token } = req.body || {};
    
    if (!store_name || !shopify_domain) {
        return res.status(400).json({ error: 'Store name and domain required' });
    }
    
    // Create new integration object
    const newIntegration = {
        id: Math.floor(Math.random() * 1000) + 100,
        name: store_name,
        domain: shopify_domain,
        status: 'connected',
        products_count: 0,
        last_sync: null,
        created_at: new Date().toISOString()
    };
    
    // In real app, we'd save to database and test Shopify connection
    
    res.status(200).json({
        success: true,
        data: newIntegration,
        message: 'Store integration created successfully'
    });
}