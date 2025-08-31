// Database seeding script
// Creates comprehensive demo data for development and testing

const dbManager = require('../lib/database');

async function seedDatabase() {
    console.log('🌱 Starting database seeding...');
    
    try {
        // Connect to database
        dbManager.connect();
        
        // Seed with demo data
        console.log('📊 Inserting demo data...');
        dbManager.seedDatabase();
        
        // Verify data was inserted
        const userCount = dbManager.queryOne('SELECT COUNT(*) as count FROM users');
        const productCount = dbManager.queryOne('SELECT COUNT(*) as count FROM products');
        const linkCount = dbManager.queryOne('SELECT COUNT(*) as count FROM affiliate_links');
        
        console.log(`✅ Seeded ${userCount.count} users`);
        console.log(`✅ Seeded ${productCount.count} products`);
        console.log(`✅ Seeded ${linkCount.count} affiliate links`);
        
        console.log('🎉 Database seeding completed successfully!');
        
    } catch (error) {
        console.error('❌ Database seeding failed:', error);
        process.exit(1);
    } finally {
        dbManager.close();
    }
}

// Run if called directly
if (require.main === module) {
    seedDatabase();
}

module.exports = seedDatabase;