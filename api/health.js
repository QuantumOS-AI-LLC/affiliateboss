// Health Check API for Vercel
// System status and database connectivity
// Bangladesh dev style - comprehensive health monitoring

const { getDatabase, createSuccessResponse, createErrorResponse } = require('../lib/database');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json(createErrorResponse('Method not allowed', 405));
  }

  try {
    const startTime = Date.now();
    
    // Check database connectivity
    const db = getDatabase();
    const dbCheck = db.prepare('SELECT 1 as test').get();
    
    // Get basic system stats
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const linkCount = db.prepare('SELECT COUNT(*) as count FROM affiliate_links').get().count;
    const commissionCount = db.prepare('SELECT COUNT(*) as count FROM commissions').get().count;
    
    // Get recent activity
    const recentActivity = db.prepare(`
      SELECT COUNT(*) as count 
      FROM click_tracking 
      WHERE clicked_at >= datetime('now', '-1 hour')
    `).get().count;
    
    const responseTime = Date.now() - startTime;
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '3.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: dbCheck ? 'healthy' : 'unhealthy',
          response_time_ms: responseTime
        },
        api: {
          status: 'healthy',
          response_time_ms: responseTime
        }
      },
      statistics: {
        total_users: userCount,
        total_links: linkCount,
        total_commissions: commissionCount,
        recent_activity_1h: recentActivity
      },
      system: {
        uptime: process.uptime ? Math.floor(process.uptime()) : 0,
        memory_usage: process.memoryUsage ? process.memoryUsage() : {},
        node_version: process.version
      },
      endpoints: {
        affiliate_dashboard: '/',
        admin_panel: '/admin',
        application_page: '/apply',
        api_base: '/api',
        health_check: '/api/health'
      }
    };

    return res.status(200).json(createSuccessResponse(healthData, 'System is healthy'));

  } catch (error) {
    console.error('Health check error:', error);
    
    const errorData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        database: {
          status: 'error',
          error: error.message
        },
        api: {
          status: 'degraded'
        }
      }
    };

    return res.status(503).json(createErrorResponse('System unhealthy', 503, errorData));
  }
};