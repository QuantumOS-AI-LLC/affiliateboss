// Affiliate Applications API for Vercel
// Public application submission and admin management
// Bangladesh dev style - comprehensive application processing

const { getDatabase, authenticateAdmin, createErrorResponse, createSuccessResponse, generateApiKey } = require('../../lib/database');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Admin-Key,Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = getDatabase();

  try {
    // POST - Submit new application (public endpoint)
    if (req.method === 'POST') {
      const {
        // Personal Information
        first_name,
        last_name,
        email,
        phone,
        website,
        
        // Marketing Experience
        marketing_experience,
        audience_size,
        primary_platforms,
        content_types,
        previous_affiliate_programs,
        
        // Business Information
        business_type,
        target_audience,
        promotional_strategy,
        expected_monthly_sales,
        
        // Additional Information
        why_join,
        additional_comments,
        
        // Agreement
        terms_agreed
      } = req.body;

      // Validate required fields
      if (!first_name || !last_name || !email || !phone || !marketing_experience || !terms_agreed) {
        return res.status(400).json(createErrorResponse('Required fields missing', 400, {
          required: ['first_name', 'last_name', 'email', 'phone', 'marketing_experience', 'terms_agreed']
        }));
      }

      // Check if application already exists for this email
      const existingApplication = db.prepare(`
        SELECT id FROM affiliate_applications WHERE email = ?
      `).get(email);

      if (existingApplication) {
        return res.status(409).json(createErrorResponse('Application already exists for this email', 409));
      }

      // Check if user already exists
      const existingUser = db.prepare(`
        SELECT id FROM users WHERE email = ? OR phone = ?
      `).get(email, phone);

      if (existingUser) {
        return res.status(409).json(createErrorResponse('User already exists with this email or phone', 409));
      }

      // Calculate application score based on provided information
      const applicationScore = calculateApplicationScore({
        marketing_experience,
        audience_size,
        primary_platforms,
        previous_affiliate_programs,
        business_type,
        expected_monthly_sales
      });

      // Auto-approve if score is high enough
      const autoApprove = applicationScore >= 70;
      const status = autoApprove ? 'approved' : 'pending';

      // Create application record first
      const applicationData = {
        first_name,
        last_name,
        email,
        phone,
        website: website || null,
        marketing_experience,
        audience_size: audience_size || 0,
        primary_platforms: JSON.stringify(primary_platforms || []),
        content_types: JSON.stringify(content_types || []),
        previous_affiliate_programs: JSON.stringify(previous_affiliate_programs || []),
        business_type: business_type || 'individual',
        target_audience,
        promotional_strategy,
        expected_monthly_sales: expected_monthly_sales || 0,
        why_join,
        additional_comments,
        application_score: applicationScore,
        status: status,
        submitted_at: new Date().toISOString()
      };

      // First, ensure affiliate_applications table exists
      db.exec(`
        CREATE TABLE IF NOT EXISTS affiliate_applications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT NOT NULL,
          website TEXT,
          marketing_experience TEXT NOT NULL,
          audience_size INTEGER DEFAULT 0,
          primary_platforms TEXT,
          content_types TEXT,
          previous_affiliate_programs TEXT,
          business_type TEXT DEFAULT 'individual',
          target_audience TEXT,
          promotional_strategy TEXT,
          expected_monthly_sales INTEGER DEFAULT 0,
          why_join TEXT,
          additional_comments TEXT,
          application_score INTEGER DEFAULT 0,
          status TEXT DEFAULT 'pending',
          submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          reviewed_at DATETIME,
          reviewed_by INTEGER,
          admin_notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const result = db.prepare(`
        INSERT INTO affiliate_applications (
          first_name, last_name, email, phone, website,
          marketing_experience, audience_size, primary_platforms, content_types,
          previous_affiliate_programs, business_type, target_audience,
          promotional_strategy, expected_monthly_sales, why_join,
          additional_comments, application_score, status, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        first_name, last_name, email, phone, website,
        marketing_experience, audience_size, JSON.stringify(primary_platforms || []),
        JSON.stringify(content_types || []), JSON.stringify(previous_affiliate_programs || []),
        business_type || 'individual', target_audience, promotional_strategy,
        expected_monthly_sales || 0, why_join, additional_comments,
        applicationScore, status, new Date().toISOString()
      );

      let responseData = {
        application_id: result.lastInsertRowid,
        status: status,
        application_score: applicationScore,
        message: status === 'approved' 
          ? 'Congratulations! Your application has been auto-approved based on your qualifications.'
          : 'Thank you for your application. It will be reviewed within 24-48 hours.'
      };

      // If auto-approved, create user account immediately
      if (autoApprove) {
        const username = `${first_name.toLowerCase()}_${last_name.toLowerCase()}_${Date.now()}`;
        const apiKey = generateApiKey(`api_key_${first_name.toLowerCase()}_${last_name.toLowerCase()}`);

        const userResult = db.prepare(`
          INSERT INTO users (
            username, email, phone, first_name, last_name,
            api_key, status, tier, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'active', 'bronze', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).run(username, email, phone, first_name, last_name, apiKey);

        // Create default user settings
        db.prepare(`
          INSERT INTO user_settings (user_id, created_at, updated_at) 
          VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).run(userResult.lastInsertRowid);

        // Update application with user_id
        db.prepare(`
          UPDATE affiliate_applications 
          SET reviewed_at = CURRENT_TIMESTAMP, status = 'approved'
          WHERE id = ?
        `).run(result.lastInsertRowid);

        responseData.user_created = true;
        responseData.api_key = apiKey;
        responseData.username = username;
      }

      return res.status(201).json(createSuccessResponse(responseData, 'Application submitted successfully'));
    }

    // For admin operations, require authentication
    const adminKey = req.headers['x-admin-key'] || req.query.admin_key;
    if (!adminKey) {
      return res.status(401).json(createErrorResponse('Admin key required for this operation', 401));
    }

    const admin = authenticateAdmin(adminKey);
    if (!admin) {
      return res.status(401).json(createErrorResponse('Invalid admin key', 401));
    }

    // GET - Get all applications (admin only)
    if (req.method === 'GET') {
      const { 
        status = 'all', 
        page = 1, 
        limit = 20, 
        sort_by = 'submitted_at',
        sort_order = 'DESC'
      } = req.query;

      // Ensure table exists
      db.exec(`
        CREATE TABLE IF NOT EXISTS affiliate_applications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT NOT NULL,
          website TEXT,
          marketing_experience TEXT NOT NULL,
          audience_size INTEGER DEFAULT 0,
          primary_platforms TEXT,
          content_types TEXT,
          previous_affiliate_programs TEXT,
          business_type TEXT DEFAULT 'individual',
          target_audience TEXT,
          promotional_strategy TEXT,
          expected_monthly_sales INTEGER DEFAULT 0,
          why_join TEXT,
          additional_comments TEXT,
          application_score INTEGER DEFAULT 0,
          status TEXT DEFAULT 'pending',
          submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          reviewed_at DATETIME,
          reviewed_by INTEGER,
          admin_notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      let whereClause = '1=1';
      let params = [];

      if (status !== 'all') {
        whereClause += ' AND status = ?';
        params.push(status);
      }

      const offset = (page - 1) * limit;

      const applications = db.prepare(`
        SELECT * FROM affiliate_applications
        WHERE ${whereClause}
        ORDER BY ${sort_by} ${sort_order}
        LIMIT ? OFFSET ?
      `).all(...params, limit, offset);

      const totalCount = db.prepare(`
        SELECT COUNT(*) as count FROM affiliate_applications WHERE ${whereClause}
      `).get(...params).count;

      const summary = db.prepare(`
        SELECT 
          COUNT(*) as total_applications,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
          AVG(application_score) as avg_score
        FROM affiliate_applications
      `).get();

      const responseData = {
        applications: applications.map(app => ({
          ...app,
          primary_platforms: app.primary_platforms ? JSON.parse(app.primary_platforms) : [],
          content_types: app.content_types ? JSON.parse(app.content_types) : [],
          previous_affiliate_programs: app.previous_affiliate_programs ? JSON.parse(app.previous_affiliate_programs) : []
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        summary: {
          ...summary,
          avg_score: parseFloat(summary.avg_score || 0).toFixed(1)
        }
      };

      return res.status(200).json(createSuccessResponse(responseData, 'Applications retrieved successfully'));
    }

    // PUT - Update application status (admin only)
    if (req.method === 'PUT') {
      const { id } = req.query;
      const { status, admin_notes, create_user = false } = req.body;

      if (!id) {
        return res.status(400).json(createErrorResponse('Application ID required', 400));
      }

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json(createErrorResponse('Invalid status', 400));
      }

      // Get application
      const application = db.prepare('SELECT * FROM affiliate_applications WHERE id = ?').get(id);
      if (!application) {
        return res.status(404).json(createErrorResponse('Application not found', 404));
      }

      // Update application
      db.prepare(`
        UPDATE affiliate_applications 
        SET status = ?, admin_notes = ?, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ?
        WHERE id = ?
      `).run(status, admin_notes, admin.id || 1, id);

      let responseData = { id, status, admin_notes };

      // Create user account if approved and requested
      if (status === 'approved' && create_user) {
        const username = `${application.first_name.toLowerCase()}_${application.last_name.toLowerCase()}_${Date.now()}`;
        const apiKey = generateApiKey(`api_key_${application.first_name.toLowerCase()}_${application.last_name.toLowerCase()}`);

        const userResult = db.prepare(`
          INSERT INTO users (
            username, email, phone, first_name, last_name,
            api_key, status, tier, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'active', 'bronze', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).run(
          username, application.email, application.phone, 
          application.first_name, application.last_name, apiKey
        );

        // Create default user settings
        db.prepare(`
          INSERT INTO user_settings (user_id, created_at, updated_at) 
          VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).run(userResult.lastInsertRowid);

        responseData.user_created = true;
        responseData.api_key = apiKey;
        responseData.username = username;
        responseData.user_id = userResult.lastInsertRowid;
      }

      return res.status(200).json(createSuccessResponse(responseData, 'Application updated successfully'));
    }

    return res.status(405).json(createErrorResponse('Method not allowed', 405));

  } catch (error) {
    console.error('Applications API error:', error);
    return res.status(500).json(createErrorResponse('Internal server error', 500, error.message));
  }
};

// Helper function to calculate application score
function calculateApplicationScore(data) {
  let score = 0;

  // Marketing experience (30 points max)
  const experience = data.marketing_experience.toLowerCase();
  if (experience.includes('expert') || experience.includes('professional') || experience.includes('5+ years')) {
    score += 30;
  } else if (experience.includes('intermediate') || experience.includes('2-5 years')) {
    score += 20;
  } else if (experience.includes('beginner') || experience.includes('1-2 years')) {
    score += 10;
  }

  // Audience size (25 points max)
  const audienceSize = parseInt(data.audience_size) || 0;
  if (audienceSize >= 100000) {
    score += 25;
  } else if (audienceSize >= 50000) {
    score += 20;
  } else if (audienceSize >= 10000) {
    score += 15;
  } else if (audienceSize >= 1000) {
    score += 10;
  } else if (audienceSize >= 100) {
    score += 5;
  }

  // Platform diversity (20 points max)
  const platforms = data.primary_platforms || [];
  if (platforms.length >= 4) {
    score += 20;
  } else if (platforms.length === 3) {
    score += 15;
  } else if (platforms.length === 2) {
    score += 10;
  } else if (platforms.length === 1) {
    score += 5;
  }

  // Previous affiliate experience (15 points max)
  const previousPrograms = data.previous_affiliate_programs || [];
  if (previousPrograms.length >= 3) {
    score += 15;
  } else if (previousPrograms.length === 2) {
    score += 10;
  } else if (previousPrograms.length === 1) {
    score += 5;
  }

  // Expected monthly sales (10 points max)
  const expectedSales = parseInt(data.expected_monthly_sales) || 0;
  if (expectedSales >= 10000) {
    score += 10;
  } else if (expectedSales >= 5000) {
    score += 8;
  } else if (expectedSales >= 1000) {
    score += 5;
  } else if (expectedSales >= 100) {
    score += 3;
  }

  return Math.min(100, score);
}