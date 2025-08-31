// Database connection module
// Bangladesh dev style - robust, error handling, and performance focused

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

class DatabaseManager {
    constructor() {
        this.db = null;
        this.dbPath = path.join(process.cwd(), 'database.db');
        this.schemaPath = path.join(process.cwd(), 'database/schema.sql');
        this.seedPath = path.join(process.cwd(), 'database/seed.sql');
    }

    // Initialize database connection
    connect() {
        try {
            // Create database file if it doesn't exist
            if (!fs.existsSync(this.dbPath)) {
                console.log('Creating new database...');
            }

            this.db = new Database(this.dbPath);
            
            // Enable foreign keys and WAL mode for better performance
            this.db.pragma('journal_mode = WAL');
            this.db.pragma('foreign_keys = ON');
            this.db.pragma('synchronous = NORMAL');
            
            console.log('✅ Database connected successfully');
            return this.db;
        } catch (error) {
            console.error('❌ Database connection failed:', error);
            throw error;
        }
    }

    // Execute schema creation
    initializeSchema() {
        try {
            if (!fs.existsSync(this.schemaPath)) {
                throw new Error('Schema file not found: ' + this.schemaPath);
            }

            const schema = fs.readFileSync(this.schemaPath, 'utf8');
            
            // Split by semicolon and execute each statement
            const statements = schema.split(';').filter(stmt => stmt.trim());
            
            for (const statement of statements) {
                if (statement.trim()) {
                    this.db.exec(statement);
                }
            }
            
            console.log('✅ Database schema initialized');
        } catch (error) {
            console.error('❌ Schema initialization failed:', error);
            throw error;
        }
    }

    // Seed database with demo data
    seedDatabase() {
        try {
            if (!fs.existsSync(this.seedPath)) {
                console.log('⚠️  Seed file not found, skipping seed data');
                return;
            }

            const seedData = fs.readFileSync(this.seedPath, 'utf8');
            
            // Split by semicolon and execute each statement
            const statements = seedData.split(';').filter(stmt => stmt.trim());
            
            for (const statement of statements) {
                if (statement.trim()) {
                    this.db.exec(statement);
                }
            }
            
            console.log('✅ Database seeded with demo data');
        } catch (error) {
            console.error('❌ Database seeding failed:', error);
            throw error;
        }
    }

    // Get database instance
    getDB() {
        if (!this.db) {
            this.connect();
        }
        return this.db;
    }

    // Close database connection
    close() {
        if (this.db) {
            this.db.close();
            console.log('✅ Database connection closed');
        }
    }

    // Health check
    healthCheck() {
        try {
            const result = this.db.prepare('SELECT 1 as health').get();
            return result.health === 1;
        } catch (error) {
            console.error('Database health check failed:', error);
            return false;
        }
    }

    // Helper methods for common operations
    
    // Execute a query and return results
    query(sql, params = []) {
        try {
            const stmt = this.db.prepare(sql);
            return stmt.all(params);
        } catch (error) {
            console.error('Query failed:', error);
            throw error;
        }
    }

    // Execute a query and return single result
    queryOne(sql, params = []) {
        try {
            const stmt = this.db.prepare(sql);
            return stmt.get(params);
        } catch (error) {
            console.error('QueryOne failed:', error);
            throw error;
        }
    }

    // Execute insert/update/delete and return info
    run(sql, params = []) {
        try {
            const stmt = this.db.prepare(sql);
            return stmt.run(params);
        } catch (error) {
            console.error('Run failed:', error);
            throw error;
        }
    }

    // Begin transaction
    beginTransaction() {
        return this.db.transaction((queries) => {
            for (const query of queries) {
                if (query.type === 'run') {
                    this.run(query.sql, query.params);
                } else if (query.type === 'get') {
                    return this.queryOne(query.sql, query.params);
                } else if (query.type === 'all') {
                    return this.query(query.sql, query.params);
                }
            }
        });
    }

    // Helper to get user by API key (common operation)
    getUserByApiKey(apiKey) {
        return this.queryOne('SELECT * FROM users WHERE api_key = ?', [apiKey]);
    }

    // Helper to get user stats
    getUserStats(userId) {
        const stats = this.queryOne(`
            SELECT 
                u.total_earnings,
                u.total_clicks,
                u.total_conversions,
                u.conversion_rate,
                u.tier,
                COUNT(al.id) as total_links,
                COUNT(CASE WHEN c.status = 'confirmed' THEN 1 END) as confirmed_commissions,
                SUM(CASE WHEN c.status = 'pending' THEN c.commission_amount ELSE 0 END) as pending_earnings
            FROM users u
            LEFT JOIN affiliate_links al ON u.id = al.user_id
            LEFT JOIN commissions c ON u.id = c.user_id
            WHERE u.id = ?
            GROUP BY u.id
        `, [userId]);
        
        return stats || {};
    }

    // Helper to get recent activity
    getRecentActivity(userId, limit = 10) {
        return this.query(`
            SELECT 
                'commission' as type,
                commission_amount as amount,
                sale_date as date,
                status,
                order_id
            FROM commissions 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        `, [userId, limit]);
    }

    // Helper to get performance data for charts
    getPerformanceData(userId, days = 30) {
        return this.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as clicks,
                SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as conversions,
                SUM(conversion_value) as revenue
            FROM click_tracking 
            WHERE user_id = ? 
            AND created_at >= datetime('now', '-${days} days')
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `, [userId]);
    }
}

// Export singleton instance
const dbManager = new DatabaseManager();

module.exports = dbManager;