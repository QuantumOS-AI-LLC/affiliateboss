const { handleCors, checkAuth, generateShortCode } = require('./utils/helpers');

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    
    // Check if user is authenticated
    const user = checkAuth(req, res);
    if (!user) return;

    if (req.method === 'GET') {
        return getMyLinks(req, res, user);
    } else if (req.method === 'POST') {
        return createNewLink(req, res, user);
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
};

// Get user's existing affiliate links
function getMyLinks(req, res, user) {
    // Demo data - in real app, we'd query the database
    const demoLinks = [
        {
            id: 1,
            name: "MacBook Pro M3 Max Link",
            original_url: "https://apple.com/macbook-pro",
            short_url: `${req.headers.host || 'localhost:3000'}/go/mbp001`,
            short_code: "mbp001",
            clicks: 2847,
            conversions: 45,
            earnings: 1529.40,
            created_at: "2024-01-15T10:30:00Z"
        },
        {
            id: 2,
            name: "Tesla Model S Link",
            original_url: "https://tesla.com/models",
            short_url: `${req.headers.host || 'localhost:3000'}/go/tesla02`,
            short_code: "tesla02",
            clicks: 1056,
            conversions: 9,
            earnings: 1079.88,
            created_at: "2024-01-16T14:22:00Z"
        },
        {
            id: 3,
            name: "iPhone 15 Pro Deal",
            original_url: "https://apple.com/iphone-15-pro",
            short_url: `${req.headers.host || 'localhost:3000'}/go/ip15pm`,
            short_code: "ip15pm",
            clicks: 892,
            conversions: 31,
            earnings: 238.14,
            created_at: "2024-01-17T09:15:00Z"
        }
    ];

    res.status(200).json({
        success: true,
        data: demoLinks,
        total: demoLinks.length
    });
}

// Create a new affiliate link
function createNewLink(req, res, user) {
    const { original_url, name, description = '' } = req.body || {};
    
    if (!original_url || !name) {
        return res.status(400).json({ error: 'URL and name are required' });
    }
    
    // Validate URL format
    try {
        new URL(original_url);
    } catch (error) {
        return res.status(400).json({ error: 'Invalid URL format' });
    }
    
    // Generate short code and URL
    const shortCode = generateShortCode();
    const shortUrl = `${req.headers.host || 'localhost:3000'}/go/${shortCode}`;
    
    // Create new link object
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
        user_id: user.id
    };
    
    // In real app, we'd save to database here
    
    res.status(200).json({
        success: true,
        data: newLink,
        message: 'Link created successfully'
    });
}