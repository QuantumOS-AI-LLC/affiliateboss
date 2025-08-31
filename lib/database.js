// Database utility for Vercel serverless functions
// Bangladesh dev style - practical, efficient, and production-ready

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database path for Vercel (temporary storage in /tmp)
const DB_PATH = process.env.NODE_ENV === 'production' 
  ? '/tmp/affiliate-boss.db' 
  : path.join(__dirname, '..', 'database.db');

let db = null;

// Initialize database connection
function initDatabase() {
  if (db) return db;
  
  try {
    // Create database connection
    db = new Database(DB_PATH, { 
      verbose: process.env.NODE_ENV === 'development' ? console.log : null 
    });
    
    // Set pragmas for performance
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('foreign_keys = ON');
    
    // If database is empty or doesn't exist, initialize schema
    if (!isSchemaInitialized()) {
      initSchema();
      seedDatabase();
    }
    
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Check if database schema is initialized
function isSchemaInitialized() {
  try {
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    return !!result;
  } catch (error) {
    return false;
  }
}

// Initialize database schema
function initSchema() {
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log('Database schema initialized');
  } else {
    // Fallback schema if file doesn't exist
    const fallbackSchema = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        password_hash TEXT,
        api_key TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'active',
        tier TEXT DEFAULT 'bronze',
        total_earnings DECIMAL(15,2) DEFAULT 0.00,
        total_clicks INTEGER DEFAULT 0,
        total_conversions INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS affiliate_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        original_url TEXT NOT NULL,
        short_code TEXT UNIQUE NOT NULL,
        short_url TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        total_clicks INTEGER DEFAULT 0,
        total_conversions INTEGER DEFAULT 0,
        total_earnings DECIMAL(15,2) DEFAULT 0.00,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);
      CREATE INDEX IF NOT EXISTS idx_affiliate_links_user_id ON affiliate_links(user_id);
      CREATE INDEX IF NOT EXISTS idx_affiliate_links_short_code ON affiliate_links(short_code);
    `;
    db.exec(fallbackSchema);
    console.log('Fallback database schema initialized');
  }
}

// Seed database with demo data
function seedDatabase() {
  const seedPath = path.join(__dirname, '..', 'seed_advanced_fixed.sql');
  
  if (fs.existsSync(seedPath)) {
    const seedData = fs.readFileSync(seedPath, 'utf8');
    
    try {
      // Execute seed data in transaction
      db.transaction(() => {
        db.exec(seedData);
      })();
      console.log('Database seeded with demo data');
    } catch (error) {
      console.error('Error seeding database:', error);
      // Continue without seed data if it fails
    }
  } else {
    // Minimal seed data if file doesn't exist
    const minimalSeed = `
      INSERT OR IGNORE INTO users (username, email, phone, first_name, last_name, api_key, tier, total_earnings) 
      VALUES 
        ('john_affiliate', 'john@example.com', '+1234567890', 'John', 'Smith', 'api_key_john_123456789', 'gold', 15420.50),
        ('admin_user', 'admin@store.com', '+1987654321', 'Admin', 'User', 'admin_key_demo_store_123', 'platinum', 0);
      
      INSERT OR IGNORE INTO affiliate_links (user_id, name, description, original_url, short_code, short_url, total_clicks, total_earnings)
      VALUES 
        (1, 'Fashion Collection', 'Premium fashion items', 'https://store.com/fashion', 'FAS123', 'https://aff.ly/FAS123', 1250, 4850.00),
        (1, 'Tech Gadgets', 'Latest technology products', 'https://store.com/tech', 'TECH456', 'https://aff.ly/TECH456', 890, 3200.00);
    `;
    
    try {
      db.exec(minimalSeed);
      console.log('Minimal database seed data inserted');
    } catch (error) {
      console.error('Error inserting minimal seed data:', error);
    }
  }
}

// Get database instance (singleton pattern)
function getDatabase() {
  if (!db) {
    initDatabase();
  }
  return db;
}

// Close database connection (for cleanup)
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

// Authentication utilities
function authenticateUser(apiKey) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE api_key = ? AND status = "active"');
  return stmt.get(apiKey);
}

function authenticateAdmin(adminKey) {
  const db = getDatabase();
  // Check if it's a valid admin key - could be user with admin privileges or special admin key
  const stmt = db.prepare(`
    SELECT * FROM users 
    WHERE (api_key = ? OR api_key = ?) 
    AND (tier IN ('platinum', 'diamond') OR api_key LIKE 'admin_%')
    AND status = 'active'
  `);
  return stmt.get(adminKey, adminKey);
}

// Utility functions for common operations
function generateShortCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateApiKey(prefix = 'api_key') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return `${prefix}_${timestamp}_${random}`;
}

// Error response helper
function createErrorResponse(message, statusCode = 400, details = null) {
  return {
    error: true,
    message,
    statusCode,
    details,
    timestamp: new Date().toISOString()
  };
}

// Success response helper
function createSuccessResponse(data, message = 'Success') {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

// Bangladesh dev helper - practical query builder for common operations
class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.db = getDatabase();
  }
  
  findById(id) {
    const stmt = this.db.prepare(`SELECT * FROM ${this.table} WHERE id = ?`);
    return stmt.get(id);
  }
  
  findByColumn(column, value) {
    const stmt = this.db.prepare(`SELECT * FROM ${this.table} WHERE ${column} = ?`);
    return stmt.get(value);
  }
  
  findAll(where = '', params = []) {
    const query = `SELECT * FROM ${this.table} ${where ? 'WHERE ' + where : ''}`;
    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }
  
  insert(data) {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    
    const stmt = this.db.prepare(`INSERT INTO ${this.table} (${columns}) VALUES (${placeholders})`);
    return stmt.run(...values);
  }
  
  update(id, data) {
    const sets = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];
    
    const stmt = this.db.prepare(`UPDATE ${this.table} SET ${sets} WHERE id = ?`);
    return stmt.run(...values);
  }
  
  delete(id) {
    const stmt = this.db.prepare(`DELETE FROM ${this.table} WHERE id = ?`);
    return stmt.run(id);
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase,
  authenticateUser,
  authenticateAdmin,
  generateShortCode,
  generateApiKey,
  createErrorResponse,
  createSuccessResponse,
  QueryBuilder
};