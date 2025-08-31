const { handleCors } = require('./utils/helpers');

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    
    const { code } = req.query;
    
    if (!code) {
        return res.status(400).json({ error: 'Short code required' });
    }
    
    // Demo link mappings - in real app, we'd lookup in database
    const linkMappings = {
        'mbp001': 'https://apple.com/macbook-pro',
        'tesla02': 'https://tesla.com/models',
        'ip15pm': 'https://apple.com/iphone-15-pro',
        'sony01': 'https://sony.com/headphones/wh-1000xm5',
        'canr5': 'https://canon.com/cameras/eos-r5'
    };
    
    const originalUrl = linkMappings[code];
    
    if (!originalUrl) {
        return res.status(404).json({ error: 'Link not found' });
    }
    
    // Track the click - in real app, we'd update database
    console.log(`Click tracked: ${code} -> ${originalUrl}`);
    
    // Redirect to the original URL
    res.writeHead(302, { Location: originalUrl });
    res.end();
};