// Content Generation Tools API - Vercel Serverless
const Database = require('../../lib/database');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
    
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { method, query, body } = req;

    try {
        if (method === 'POST' && query.action === 'generate') {
            const { content_type, product_name, keywords, tone = 'professional' } = body;
            
            // Generate content based on templates (simplified for demo)
            let content = '';
            
            switch (content_type) {
                case 'product_description':
                    content = `Discover the amazing ${product_name}! This incredible product features cutting-edge technology and premium quality. Perfect for anyone looking to ${keywords}. Don't miss out on this exclusive opportunity!`;
                    break;
                case 'email_campaign':
                    content = `Subject: Exclusive Deal on ${product_name}!\n\nHi there!\n\nI wanted to share this amazing product with you - ${product_name}. It's perfect for ${keywords} and I think you'll love it!\n\nCheck it out here: [Your Affiliate Link]\n\nBest regards,\n[Your Name]`;
                    break;
                case 'social_post':
                    content = `🔥 Just discovered ${product_name}! Perfect for ${keywords}. Highly recommended! #affiliate #${keywords.replace(/\s+/g, '')} [link]`;
                    break;
                case 'blog_post':
                    content = `# ${product_name} Review: Everything You Need to Know\n\n## Introduction\n${product_name} has been making waves in the market, and for good reason. In this comprehensive review, I'll share my experience with this product.\n\n## Key Features\n- Premium quality\n- Easy to use\n- Great value\n\n## Final Thoughts\nIf you're looking for ${keywords}, ${product_name} is definitely worth considering. [Affiliate Link]`;
                    break;
                default:
                    content = `Generated content for ${product_name} with focus on ${keywords}`;
            }

            return res.json({
                success: true,
                data: { content, content_type, generated_at: new Date().toISOString() }
            });
        }

        if (method === 'GET' && query.action === 'templates') {
            const templates = [
                { id: 'product_description', name: 'Product Description', category: 'marketing' },
                { id: 'email_campaign', name: 'Email Campaign', category: 'email' },
                { id: 'social_post', name: 'Social Media Post', category: 'social' },
                { id: 'blog_post', name: 'Blog Post', category: 'content' }
            ];

            return res.json({ success: true, data: templates });
        }

        return res.status(400).json({ error: 'Invalid request' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}