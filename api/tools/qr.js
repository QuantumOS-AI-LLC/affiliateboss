// QR Code Generator API - Vercel Serverless
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
    
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { method, query } = req;

    try {
        if (method === 'GET' && query.url) {
            const { url, size = '200' } = query;
            
            // Generate QR code URL using QR Server API (free service)
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
            
            return res.json({
                success: true,
                data: {
                    qr_url: qrUrl,
                    original_url: url,
                    size: size
                }
            });
        }

        return res.status(400).json({ error: 'URL parameter required' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}