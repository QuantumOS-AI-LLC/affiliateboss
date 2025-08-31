// Database initialization script
// Bangladesh dev approach - clean setup with error handling

const dbManager = require('../lib/database');

async function initializeDatabase() {
    console.log('🚀 Starting database initialization...');
    
    try {
        // Connect to database
        dbManager.connect();
        
        // Initialize schema
        console.log('📊 Creating database schema...');
        dbManager.initializeSchema();
        
        // Health check
        if (dbManager.healthCheck()) {
            console.log('✅ Database is healthy and ready');
        } else {
            throw new Error('Database health check failed');
        }
        
        console.log('🎉 Database initialization completed successfully!');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    } finally {
        dbManager.close();
    }
}

// Run if called directly
if (require.main === module) {
    initializeDatabase();
}

module.exports = initializeDatabase;