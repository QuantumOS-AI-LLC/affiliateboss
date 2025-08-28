-- Shopify Integration Schema
-- Migration: 0003_shopify_integration.sql

-- Store integrations table
CREATE TABLE IF NOT EXISTS store_integrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    platform VARCHAR(50) NOT NULL DEFAULT 'shopify',
    store_name VARCHAR(255) NOT NULL,
    store_url VARCHAR(500) NOT NULL,
    api_key VARCHAR(500) NOT NULL,
    api_secret VARCHAR(500),
    access_token VARCHAR(500),
    webhook_secret VARCHAR(255),
    store_settings TEXT, -- JSON for platform-specific settings
    sync_settings TEXT, -- JSON for sync preferences
    last_sync_at DATETIME,
    status VARCHAR(20) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Products sync table
CREATE TABLE IF NOT EXISTS synced_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    integration_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    external_product_id VARCHAR(255) NOT NULL, -- Shopify product ID
    external_variant_id VARCHAR(255), -- Shopify variant ID (if applicable)
    title VARCHAR(500) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    compare_at_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    vendor VARCHAR(255),
    product_type VARCHAR(255),
    tags TEXT,
    sku VARCHAR(255),
    barcode VARCHAR(255),
    weight DECIMAL(8,3),
    weight_unit VARCHAR(10),
    inventory_quantity INTEGER DEFAULT 0,
    inventory_tracked BOOLEAN DEFAULT TRUE,
    image_url TEXT, -- Primary image URL
    images TEXT, -- JSON array of all image URLs
    handle VARCHAR(255), -- Shopify handle/slug
    product_url TEXT, -- Direct product URL
    status VARCHAR(20) DEFAULT 'active',
    sync_status VARCHAR(20) DEFAULT 'synced', -- synced, pending, error
    last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (integration_id) REFERENCES store_integrations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Product collections/categories
CREATE TABLE IF NOT EXISTS product_collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    integration_id INTEGER NOT NULL,
    external_collection_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    handle VARCHAR(255),
    image_url TEXT,
    products_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (integration_id) REFERENCES store_integrations(id) ON DELETE CASCADE
);

-- Many-to-many relationship between products and collections
CREATE TABLE IF NOT EXISTS product_collection_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    collection_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES synced_products(id) ON DELETE CASCADE,
    FOREIGN KEY (collection_id) REFERENCES product_collections(id) ON DELETE CASCADE,
    UNIQUE(product_id, collection_id)
);

-- Sync logs for tracking integration activities
CREATE TABLE IF NOT EXISTS sync_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    integration_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    sync_type VARCHAR(50) NOT NULL, -- full_sync, product_sync, webhook_update
    status VARCHAR(20) NOT NULL, -- started, completed, failed, partial
    products_processed INTEGER DEFAULT 0,
    products_added INTEGER DEFAULT 0,
    products_updated INTEGER DEFAULT 0,
    products_errors INTEGER DEFAULT 0,
    error_details TEXT, -- JSON array of errors
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    duration_seconds INTEGER,
    FOREIGN KEY (integration_id) REFERENCES store_integrations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Enhanced affiliate_links table to support product linking
ALTER TABLE affiliate_links ADD COLUMN integration_id INTEGER;
ALTER TABLE affiliate_links ADD COLUMN external_product_id VARCHAR(255);
ALTER TABLE affiliate_links ADD COLUMN product_data TEXT; -- JSON for storing product snapshot

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_store_integrations_user_id ON store_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_store_integrations_platform ON store_integrations(platform);
CREATE INDEX IF NOT EXISTS idx_synced_products_integration_id ON synced_products(integration_id);
CREATE INDEX IF NOT EXISTS idx_synced_products_user_id ON synced_products(user_id);
CREATE INDEX IF NOT EXISTS idx_synced_products_external_id ON synced_products(external_product_id);
CREATE INDEX IF NOT EXISTS idx_synced_products_status ON synced_products(status);
CREATE INDEX IF NOT EXISTS idx_synced_products_sync_status ON synced_products(sync_status);
CREATE INDEX IF NOT EXISTS idx_product_collections_integration_id ON product_collections(integration_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_integration_id ON sync_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_integration_id ON affiliate_links(integration_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_external_product_id ON affiliate_links(external_product_id);