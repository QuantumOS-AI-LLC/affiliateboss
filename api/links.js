// Affiliate Links API for Vercel
// Complete link management endpoint
// Bangladesh dev style - comprehensive and efficient

const { getDatabase, authenticateUser, createErrorResponse, createSuccessResponse, generateShortCode } = require('../lib/database');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-API-Key,Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    const db = getDatabase();

    // GET - Get all affiliate links for user
    if (req.method === 'GET') {
      const { category, status, page = 1, limit = 20 } = req.query;
      
      let whereClause = 'user_id = ?';
      let params = [user.id];
      
      if (category && category !== 'all') {
        whereClause += ' AND category = ?';
        params.push(category);
      }
      
      if (status && status !== 'all') {
        whereClause += ' AND status = ?';
        params.push(status);
      }
      
      const offset = (page - 1) * limit;
      
      // Get links with analytics
      const links = db.prepare(`
        SELECT 
          al.*,
          COUNT(ct.id) as recent_clicks,
          AVG(CASE WHEN ct.converted THEN 1 ELSE 0 END) as conversion_rate_calc
        FROM affiliate_links al
        LEFT JOIN click_tracking ct ON al.id = ct.link_id 
        WHERE ${whereClause}
        GROUP BY al.id
        ORDER BY al.created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, limit, offset);

      // Get total count
      const totalCount = db.prepare(`
        SELECT COUNT(*) as count 
        FROM affiliate_links 
        WHERE ${whereClause}
      `).get(...params).count;

      // Get categories for filter
      const categories = db.prepare(`
        SELECT DISTINCT category 
        FROM affiliate_links 
        WHERE user_id = ? 
        ORDER BY category
      `).all(user.id);

      const responseData = {
        links: links.map(link => ({
          ...link,
          conversion_rate: parseFloat(link.conversion_rate || 0).toFixed(2),
          tags: link.tags ? JSON.parse(link.tags) : [],
          short_url: `https://aff.ly/${link.short_code}`
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        categories: categories.map(c => c.category),
        summary: {
          total_links: totalCount,
          total_clicks: links.reduce((sum, link) => sum + (link.total_clicks || 0), 0),
          total_earnings: links.reduce((sum, link) => sum + (parseFloat(link.total_earnings) || 0), 0)
        }
      };

      return res.status(200).json(createSuccessResponse(responseData, 'Links retrieved successfully'));
    }

    // POST - Create new affiliate link
    if (req.method === 'POST') {
      const {
        name,
        description,
        original_url,
        category = 'General',
        tags = [],
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term
      } = req.body;

      if (!name || !original_url) {
        return res.status(400).json(createErrorResponse('Name and original URL required', 400));
      }

      // Validate URL
      try {
        new URL(original_url);
      } catch (error) {
        return res.status(400).json(createErrorResponse('Invalid URL format', 400));
      }

      // Generate unique short code
      let shortCode;
      let attempts = 0;
      do {
        shortCode = generateShortCode();
        attempts++;
        if (attempts > 10) {
          throw new Error('Could not generate unique short code');
        }
      } while (db.prepare('SELECT id FROM affiliate_links WHERE short_code = ?').get(shortCode));

      // Build UTM parameters if provided
      let finalUrl = original_url;
      const utmParams = [];
      if (utm_source) utmParams.push(`utm_source=${encodeURIComponent(utm_source)}`);
      if (utm_medium) utmParams.push(`utm_medium=${encodeURIComponent(utm_medium)}`);
      if (utm_campaign) utmParams.push(`utm_campaign=${encodeURIComponent(utm_campaign)}`);
      if (utm_content) utmParams.push(`utm_content=${encodeURIComponent(utm_content)}`);
      if (utm_term) utmParams.push(`utm_term=${encodeURIComponent(utm_term)}`);
      
      if (utmParams.length > 0) {
        const separator = original_url.includes('?') ? '&' : '?';
        finalUrl = `${original_url}${separator}${utmParams.join('&')}`;
      }

      const shortUrl = `https://aff.ly/${shortCode}`;

      // Insert new link
      const result = db.prepare(`
        INSERT INTO affiliate_links (
          user_id, name, description, original_url, short_code, short_url,
          category, tags, utm_source, utm_medium, utm_campaign, utm_content, utm_term
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        user.id, name, description, finalUrl, shortCode, shortUrl,
        category, JSON.stringify(tags), utm_source, utm_medium, utm_campaign, utm_content, utm_term
      );

      const newLink = db.prepare('SELECT * FROM affiliate_links WHERE id = ?').get(result.lastInsertRowid);

      const responseData = {
        ...newLink,
        tags: newLink.tags ? JSON.parse(newLink.tags) : [],
        short_url: shortUrl
      };

      return res.status(201).json(createSuccessResponse(responseData, 'Link created successfully'));
    }

    // PUT - Update existing link
    if (req.method === 'PUT') {
      const { id } = req.query;
      const {
        name,
        description,
        status,
        category,
        tags,
        notes
      } = req.body;

      if (!id) {
        return res.status(400).json(createErrorResponse('Link ID required', 400));
      }

      // Check if link belongs to user
      const existingLink = db.prepare('SELECT * FROM affiliate_links WHERE id = ? AND user_id = ?').get(id, user.id);
      if (!existingLink) {
        return res.status(404).json(createErrorResponse('Link not found', 404));
      }

      // Update link
      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;
      if (category !== undefined) updateData.category = category;
      if (tags !== undefined) updateData.tags = JSON.stringify(tags);
      if (notes !== undefined) updateData.notes = notes;

      const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(updateData), id, user.id];

      db.prepare(`UPDATE affiliate_links SET ${setClause} WHERE id = ? AND user_id = ?`).run(...values);

      const updatedLink = db.prepare('SELECT * FROM affiliate_links WHERE id = ?').get(id);

      const responseData = {
        ...updatedLink,
        tags: updatedLink.tags ? JSON.parse(updatedLink.tags) : []
      };

      return res.status(200).json(createSuccessResponse(responseData, 'Link updated successfully'));
    }

    // DELETE - Delete link
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json(createErrorResponse('Link ID required', 400));
      }

      // Check if link belongs to user
      const existingLink = db.prepare('SELECT * FROM affiliate_links WHERE id = ? AND user_id = ?').get(id, user.id);
      if (!existingLink) {
        return res.status(404).json(createErrorResponse('Link not found', 404));
      }

      // Delete link (cascade will handle related records)
      db.prepare('DELETE FROM affiliate_links WHERE id = ? AND user_id = ?').run(id, user.id);

      return res.status(200).json(createSuccessResponse({ id }, 'Link deleted successfully'));
    }

    return res.status(405).json(createErrorResponse('Method not allowed', 405));

  } catch (error) {
    console.error('Links API error:', error);
    return res.status(500).json(createErrorResponse('Internal server error', 500, error.message));
  }
};