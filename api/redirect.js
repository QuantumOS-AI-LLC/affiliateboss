const { handleCors, getDemoData } = require('./utils/helpers');

module.exports = async (req, res) => {
    // Don't handle CORS for redirects - they need to be fast
    const { code } = req.query;
    
    if (!code) {
        return res.status(400).json({ error: 'Short code required' });
    }
    
    // Get user info from headers if available (for tracking)
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers['referer'] || '';
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    
    // Enhanced link mappings with affiliate parameters
    const linkMappings = {
        // Product links with proper affiliate tracking
        'mbp001': 'https://apple.com/macbook-pro?affiliate_id=affiliateboss&utm_source=affiliate_boss&utm_medium=affiliate&utm_campaign=macbook_promo_2024',
        'tesla02': 'https://tesla.com/models?referral=affiliateboss&source=affiliate_platform',
        'ip15pm': 'https://apple.com/iphone-15-pro?affiliate_id=affiliateboss&utm_source=affiliate_boss&utm_medium=affiliate&utm_campaign=iphone_holiday_2024',
        'rlx001': 'https://rolex.com/submariner?partner=affiliateboss&tracking=luxury_affiliate',
        'dyv15': 'https://dyson.com/v15-detect?affiliate=affiliateboss&utm_source=affiliate_boss&utm_medium=affiliate',
        'nsw01': 'https://nintendo.com/switch?affiliate_id=affiliateboss&utm_source=affiliate_boss&utm_medium=affiliate&utm_campaign=gaming_bundle',
        'ka001': 'https://kitchenaid.com/artisan-mixer?partner=affiliateboss&utm_source=affiliate_boss&utm_medium=affiliate',
        's8ktv': 'https://samsung.com/8k-tv?affiliate_id=affiliateboss&utm_source=affiliate_boss&utm_medium=affiliate',
        
        // Auto-generated Shopify product links
        'sp001': 'https://apple.com/macbook-pro?affiliate_id=affiliateboss',
        'sp002': 'https://tesla.com/models?referral=affiliateboss',
        'sp003': 'https://apple.com/iphone-15-pro?affiliate_id=affiliateboss',
        'sp004': 'https://sony.com/headphones/wh-1000xm5?partner=affiliateboss',
        'sp005': 'https://canon.com/cameras/eos-r5?affiliate=affiliateboss',
        'sp006': 'https://dyson.com/v15-detect?affiliate=affiliateboss',
        'sp007': 'https://nintendo.com/switch?affiliate_id=affiliateboss',
        'sp008': 'https://rolex.com/submariner?partner=affiliateboss',
        'sp009': 'https://kitchenaid.com/artisan-mixer?partner=affiliateboss',
        'sp010': 'https://peloton.com/bike?affiliate_id=affiliateboss',
        'sp011': 'https://samsung.com/8k-tv?affiliate_id=affiliateboss',
        'sp012': 'https://hermes.com/birkin-handbag?partner=affiliateboss'
    };
    
    const originalUrl = linkMappings[code];
    
    if (!originalUrl) {
        return res.status(404).json({ 
            error: 'Link not found',
            code: code,
            available_codes: Object.keys(linkMappings).slice(0, 5) // Show first 5 as examples
        });
    }
    
    // Advanced click tracking data
    const clickData = {
        short_code: code,
        original_url: originalUrl,
        timestamp: new Date().toISOString(),
        
        // User tracking
        ip_address: ipAddress,
        user_agent: userAgent,
        referer: referer,
        
        // Geo tracking (mock data - in real app use IP geolocation)
        country: getCountryFromIP(ipAddress),
        device_type: getDeviceType(userAgent),
        browser: getBrowser(userAgent),
        
        // Performance tracking
        redirect_type: '301', // SEO friendly
        cache_status: 'miss',
        processing_time_ms: Date.now() % 10 + 1 // Mock processing time
    };
    
    // In real app, this would:
    // 1. Log click to analytics database
    // 2. Update link performance metrics
    // 3. Trigger real-time KPI updates
    // 4. Check for click fraud protection
    // 5. Apply geo/device blocking if configured
    
    console.log('Advanced Click Tracking:', JSON.stringify(clickData, null, 2));
    
    // Set performance headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Redirect-Type', 'affiliate-link');
    res.setHeader('X-Processing-Time', `${clickData.processing_time_ms}ms`);
    
    // Perform 301 redirect (SEO friendly)
    res.writeHead(301, { 
        'Location': originalUrl,
        'X-Affiliate-Platform': 'affiliate-boss',
        'X-Click-ID': `click_${Date.now()}`
    });
    res.end();
};

// Helper functions for tracking
function getCountryFromIP(ipAddress) {
    // Mock geo detection - in real app use MaxMind or similar
    const mockCountries = ['US', 'CA', 'UK', 'AU', 'DE', 'FR'];
    return mockCountries[Math.floor(Math.random() * mockCountries.length)];
}

function getDeviceType(userAgent) {
    if (!userAgent) return 'unknown';
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        return 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
        return 'tablet';
    }
    return 'desktop';
}

function getBrowser(userAgent) {
    if (!userAgent) return 'unknown';
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('chrome')) return 'chrome';
    if (ua.includes('firefox')) return 'firefox';
    if (ua.includes('safari')) return 'safari';
    if (ua.includes('edge')) return 'edge';
    return 'other';
}