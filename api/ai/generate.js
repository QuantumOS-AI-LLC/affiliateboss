// AI Content Generation API for Vercel
// OpenAI integration for affiliate marketing content
// Bangladesh dev style - practical AI assistance

const { getDatabase, authenticateUser, createErrorResponse, createSuccessResponse } = require('../../lib/database');

// OpenAI client (initialize only if API key available)
let openaiClient = null;
if (process.env.OPENAI_API_KEY) {
  try {
    const { OpenAI } = require('openai');
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  } catch (error) {
    console.warn('OpenAI not available:', error.message);
  }
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-API-Key,Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json(createErrorResponse('Method not allowed', 405));
  }

  try {
    // Get API key from headers or query
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    
    if (!apiKey) {
      return res.status(401).json(createErrorResponse('API key required', 401));
    }

    // Authenticate user
    const user = authenticateUser(apiKey);
    if (!user) {
      return res.status(401).json(createErrorResponse('Invalid API key', 401));
    }

    const { 
      type = 'product_description',
      product_name,
      product_description,
      product_category,
      product_price,
      target_audience,
      tone = 'professional',
      length = 'medium',
      custom_prompt
    } = req.body;

    const db = getDatabase();

    // Check user's AI generation limits (implement rate limiting)
    const today = new Date().toISOString().split('T')[0];
    const usageToday = db.prepare(`
      SELECT COUNT(*) as count FROM ai_usage 
      WHERE user_id = ? AND date(created_at) = ?
    `).get(user.id, today)?.count || 0;

    // Rate limiting based on user tier
    const tierLimits = {
      'bronze': 10,
      'silver': 25,
      'gold': 50,
      'premium': 100,
      'platinum': 200,
      'diamond': 500
    };

    const dailyLimit = tierLimits[user.tier] || 10;

    if (usageToday >= dailyLimit) {
      return res.status(429).json(createErrorResponse('Daily AI generation limit exceeded', 429, {
        daily_limit: dailyLimit,
        usage_today: usageToday,
        tier: user.tier
      }));
    }

    // Prepare AI prompt based on request type
    let aiPrompt = '';
    let responseData = {};

    if (type === 'product_description') {
      if (!product_name) {
        return res.status(400).json(createErrorResponse('Product name required for product descriptions', 400));
      }

      aiPrompt = buildProductDescriptionPrompt({
        product_name,
        product_description,
        product_category,
        product_price,
        target_audience,
        tone,
        length
      });

    } else if (type === 'social_post') {
      aiPrompt = buildSocialPostPrompt({
        product_name,
        product_description,
        target_audience,
        tone,
        length
      });

    } else if (type === 'email_content') {
      aiPrompt = buildEmailContentPrompt({
        product_name,
        product_description,
        target_audience,
        tone
      });

    } else if (type === 'custom') {
      if (!custom_prompt) {
        return res.status(400).json(createErrorResponse('Custom prompt required for custom generation', 400));
      }
      
      aiPrompt = `As an expert affiliate marketing content creator, please help with the following request:\n\n${custom_prompt}\n\nPlease provide helpful, engaging, and professional content that would be effective for affiliate marketing purposes.`;

    } else {
      return res.status(400).json(createErrorResponse('Invalid generation type', 400, {
        supported_types: ['product_description', 'social_post', 'email_content', 'custom']
      }));
    }

    let generatedContent = '';
    let aiStatus = 'demo';

    // Generate content with OpenAI if available
    if (openaiClient) {
      try {
        const completion = await openaiClient.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert affiliate marketing content creator. Create compelling, persuasive, and professional content that drives conversions while being authentic and helpful to the audience.'
            },
            {
              role: 'user',
              content: aiPrompt
            }
          ],
          max_tokens: getMaxTokensForLength(length),
          temperature: 0.7
        });

        generatedContent = completion.choices[0].message.content.trim();
        aiStatus = 'generated';

      } catch (error) {
        console.error('OpenAI API error:', error);
        aiStatus = 'fallback';
        generatedContent = getFallbackContent(type, { product_name, product_description });
      }
    } else {
      aiStatus = 'fallback';
      generatedContent = getFallbackContent(type, { product_name, product_description });
    }

    // Log AI usage
    try {
      db.prepare(`
        INSERT INTO ai_usage (user_id, type, prompt_tokens, completion_tokens, total_tokens, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(user.id, type, 0, 0, 0); // In production, get actual token counts from OpenAI response
    } catch (error) {
      // Create ai_usage table if it doesn't exist
      db.exec(`
        CREATE TABLE IF NOT EXISTS ai_usage (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          prompt_tokens INTEGER DEFAULT 0,
          completion_tokens INTEGER DEFAULT 0,
          total_tokens INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      db.prepare(`
        INSERT INTO ai_usage (user_id, type, prompt_tokens, completion_tokens, total_tokens, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(user.id, type, 0, 0, 0);
    }

    responseData = {
      type: type,
      generated_content: generatedContent,
      ai_status: aiStatus,
      usage_info: {
        usage_today: usageToday + 1,
        daily_limit: dailyLimit,
        remaining: dailyLimit - (usageToday + 1),
        tier: user.tier
      },
      generation_params: {
        tone: tone,
        length: length,
        target_audience: target_audience || 'general'
      }
    };

    if (aiStatus === 'generated') {
      responseData.message = 'Content generated successfully with AI';
    } else if (aiStatus === 'fallback') {
      responseData.message = 'AI unavailable, using fallback content template';
    } else {
      responseData.message = 'Demo mode: Using sample generated content';
    }

    return res.status(200).json(createSuccessResponse(responseData, responseData.message));

  } catch (error) {
    console.error('AI generation error:', error);
    return res.status(500).json(createErrorResponse('AI generation failed', 500, error.message));
  }
};

// Helper function to build product description prompt
function buildProductDescriptionPrompt(params) {
  const lengthMap = {
    short: 'Write a concise 50-75 word description',
    medium: 'Write a detailed 150-200 word description',
    long: 'Write a comprehensive 300-400 word description'
  };

  return `${lengthMap[params.length] || lengthMap.medium} for the product "${params.product_name}".

Product Details:
- Name: ${params.product_name}
- Category: ${params.product_category || 'General'}
- Price: ${params.product_price ? '$' + params.product_price : 'Not specified'}
- Existing Description: ${params.product_description || 'Not provided'}
- Target Audience: ${params.target_audience || 'General consumers'}
- Tone: ${params.tone}

Create compelling copy that highlights benefits, creates urgency, and encourages purchases. Focus on how this product solves problems or improves the customer's life. Include emotional triggers and clear calls to action.`;
}

// Helper function to build social media post prompt
function buildSocialPostPrompt(params) {
  return `Create an engaging social media post promoting "${params.product_name}".

Guidelines:
- Keep it under 280 characters for Twitter compatibility
- Include relevant hashtags
- Create urgency and excitement
- Target audience: ${params.target_audience || 'social media users'}
- Tone: ${params.tone}
- Product info: ${params.product_description || 'Amazing product'}

Make it shareable and include a clear call-to-action.`;
}

// Helper function to build email content prompt
function buildEmailContentPrompt(params) {
  return `Write a persuasive email promoting "${params.product_name}".

Include:
- Compelling subject line
- Personal greeting
- Problem/solution approach
- Product benefits
- Social proof elements
- Clear call-to-action
- Professional signature

Target audience: ${params.target_audience || 'email subscribers'}
Tone: ${params.tone}
Product details: ${params.product_description || 'High-quality product'}

Keep it concise but persuasive, around 200-300 words.`;
}

// Helper function to get max tokens based on length
function getMaxTokensForLength(length) {
  switch (length) {
    case 'short': return 150;
    case 'medium': return 300;
    case 'long': return 600;
    default: return 300;
  }
}

// Fallback content when AI is not available
function getFallbackContent(type, params) {
  const templates = {
    product_description: `Experience the amazing ${params.product_name || 'product'}! This high-quality item offers exceptional value and performance. Perfect for anyone looking for reliability and style. ${params.product_description || 'Crafted with attention to detail and designed to exceed your expectations.'} Don't miss out on this opportunity to enhance your lifestyle. Order now and discover why customers love this product!`,
    
    social_post: `🔥 Just discovered this amazing ${params.product_name || 'product'}! The quality is incredible and the value is unbeatable. If you're looking for something special, this is it! #AffiliateMarketing #QualityProducts #MustHave #ShopNow`,
    
    email_content: `Subject: You'll Love This Amazing Discovery!

Hi there!

I wanted to share something exciting with you. I recently discovered ${params.product_name || 'an incredible product'} and I think you'll love it as much as I do.

${params.product_description || 'This product stands out for its exceptional quality and amazing value.'}

What makes it special:
• Outstanding quality and craftsmanship
• Excellent value for money
• Trusted by thousands of satisfied customers
• Perfect for your needs

Don't miss out on this opportunity. Check it out now and see why everyone is talking about it!

Best regards,
Your Affiliate Partner`,

    custom: `Here's some great content tailored to your needs! This professional copy is designed to engage your audience and drive results. Feel free to customize it further to match your brand voice and specific requirements.`
  };

  return templates[type] || templates.custom;
}