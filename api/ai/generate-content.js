// AI Content Generation API - OpenAI Integration
// Bangladesh dev style - comprehensive AI content generation

const { initDatabase } = require('../../lib/database');

// Mock OpenAI integration for demo (replace with actual OpenAI API in production)
async function generateWithOpenAI(prompt, type, productInfo) {
    // This would be replaced with actual OpenAI API call
    // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Demo content generation based on type
    const templates = {
        'product-description': `🚀 Discover the amazing ${productInfo.product}! 

Perfect for ${productInfo.audience}, this incredible product offers unmatched quality and value. With cutting-edge features and reliable performance, it's exactly what you've been looking for.

✨ Key Benefits:
• Premium quality materials  
• Advanced technology
• Excellent customer support
• Money-back guarantee

Don't miss out on this exclusive offer! Get yours today and experience the difference.

#${productInfo.product.replace(/\s+/g, '')} #QualityProducts #SpecialOffer`,

        'email-campaign': `Subject: 🔥 Exclusive ${productInfo.product} Deal - Limited Time!

Hi [Name],

Hope you're having an amazing day! I wanted to share something special with you.

I've been using the ${productInfo.product} for a while now, and I can't stop raving about it. As someone who values quality and performance, this product has completely exceeded my expectations.

Here's why I think you'll love it:
✅ ${productInfo.product} delivers exceptional results
✅ Perfect for ${productInfo.audience} like yourself  
✅ Backed by excellent customer service
✅ Limited-time exclusive pricing

I've managed to secure a special discount just for my subscribers. But hurry - this offer won't last long!

👉 [GET YOUR EXCLUSIVE DEAL NOW]

Questions? Just hit reply - I'm here to help!

Best regards,
[Your Name]

P.S. Don't wait too long - only a few spots left at this price!`,

        'social-post': `🚀 GAME CHANGER ALERT! 🚀

Just discovered the ${productInfo.product} and I'm absolutely blown away! 🤩

Perfect for ${productInfo.audience} who want:
✨ Quality that lasts
✨ Performance you can trust  
✨ Value for money

Been using it for [time period] and the results speak for themselves! 📈

Who else needs this in their life? 👇

#${productInfo.product.replace(/\s+/g, '')} #GameChanger #MustHave #Quality`,

        'blog-post': `# ${productInfo.product} Review: Is It Worth Your Money in 2024?

## Introduction

As ${productInfo.audience}, we're always looking for products that deliver real value. Today, I'm diving deep into the ${productInfo.product} to see if it lives up to the hype.

## What Makes ${productInfo.product} Special?

After extensive testing, here's what stood out:

### 1. Quality Construction
The build quality is impressive. You can immediately feel the attention to detail.

### 2. Performance
In real-world testing, the ${productInfo.product} consistently delivered excellent results.

### 3. Value Proposition  
Compared to alternatives, this offers excellent bang for your buck.

## Who Should Consider This?

Perfect for:
- ${productInfo.audience}
- Anyone seeking quality and reliability
- Users who value long-term performance

## Final Verdict

**Rating: 4.5/5 stars**

The ${productInfo.product} delivers on its promises. While no product is perfect, this comes remarkably close for its intended audience.

**Pros:**
- Excellent build quality
- Strong performance
- Good value for money

**Cons:**
- Minor learning curve
- Premium pricing

## Get Your ${productInfo.product}

Ready to experience the ${productInfo.product} for yourself? 

👉 [Check Latest Pricing and Availability]

*Disclosure: This post contains affiliate links. I earn a small commission at no extra cost to you.*`,

        'ad-copy': `🎯 ${productInfo.product} - The ${productInfo.audience} Choice!

✅ Premium Quality
✅ Proven Results  
✅ Customer Favorite
✅ Limited Time Offer

Join thousands of satisfied customers who chose ${productInfo.product}!

🔥 SPECIAL OFFER: Save [X]% Today Only!

👉 CLAIM YOUR DEAL NOW
⏰ Offer expires soon!

*Free shipping • 30-day guarantee • 5-star reviews*`
    };

    return {
        content: templates[type] || templates['product-description'],
        usage: {
            prompt_tokens: prompt.length,
            completion_tokens: 500,
            total_tokens: prompt.length + 500
        }
    };
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const db = await initDatabase();
        const { type, product, audience, tone, instructions } = req.body;

        // Validate required fields
        if (!type || !product) {
            return res.status(400).json({
                success: false,
                error: 'Content type and product/topic are required'
            });
        }

        // Get API key from headers
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).json({ success: false, error: 'API key required' });
        }

        // Verify affiliate exists
        const affiliate = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM affiliates WHERE api_key = ?', [apiKey], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!affiliate) {
            return res.status(401).json({ success: false, error: 'Invalid API key' });
        }

        // Build prompt for AI generation
        const promptParts = [
            `Create ${type.replace('-', ' ')} for: ${product}`,
            audience ? `Target audience: ${audience}` : '',
            tone ? `Tone: ${tone}` : '',
            instructions ? `Additional instructions: ${instructions}` : ''
        ].filter(Boolean);

        const prompt = promptParts.join('\n');

        // Generate content with AI
        const aiResponse = await generateWithOpenAI(prompt, type, {
            product,
            audience: audience || 'customers',
            tone: tone || 'professional'
        });

        // Log the generation for analytics
        await new Promise((resolve, reject) => {
            const query = `
                INSERT INTO ai_content_history 
                (affiliate_id, content_type, prompt, generated_content, tokens_used, created_at)
                VALUES (?, ?, ?, ?, ?, datetime('now'))
            `;
            
            db.run(query, [
                affiliate.id,
                type,
                prompt,
                aiResponse.content,
                aiResponse.usage.total_tokens
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });

        // Update affiliate's AI usage stats
        await new Promise((resolve, reject) => {
            db.run(`
                UPDATE affiliates 
                SET ai_generations_used = ai_generations_used + 1,
                    ai_tokens_used = ai_tokens_used + ?
                WHERE id = ?
            `, [aiResponse.usage.total_tokens, affiliate.id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        res.json({
            success: true,
            content: aiResponse.content,
            usage: aiResponse.usage,
            generationId: Date.now() // For tracking/regeneration
        });

    } catch (error) {
        console.error('AI Generation Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate content'
        });
    }
};