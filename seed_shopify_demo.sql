-- Demo Shopify Integration Data
-- This creates sample data for testing the Shopify integration features

-- Insert demo store integration
INSERT OR IGNORE INTO store_integrations (
    id, user_id, platform, store_name, store_url, api_key, access_token,
    store_settings, sync_settings, last_sync_at, status, created_at, updated_at
) VALUES (
    1, 1, 'shopify', 'demo-fashion-store', 'https://demo-fashion-store.myshopify.com',
    'demo_api_key', 'demo_access_token',
    '{"id": 12345, "name": "Demo Fashion Store", "domain": "demo-fashion-store.myshopify.com", "currency": "USD"}',
    '{"auto_sync": true, "sync_frequency": "daily"}',
    datetime('now', '-2 hours'), 'active',
    datetime('now', '-7 days'), datetime('now', '-2 hours')
);

-- Insert demo products
INSERT OR IGNORE INTO synced_products (
    id, integration_id, user_id, external_product_id, title, description,
    price, vendor, product_type, tags, handle, product_url, image_url, images,
    status, sync_status, last_synced_at, created_at, updated_at
) VALUES 
-- Fashion Products
(1, 1, 1, 'shopify_prod_001', 'Premium Cotton T-Shirt', 
 'Soft, comfortable cotton t-shirt perfect for everyday wear. Made from 100% organic cotton.',
 29.99, 'Fashion Brand', 'T-Shirts', 'cotton,organic,casual,comfortable',
 'premium-cotton-t-shirt', 'https://demo-fashion-store.myshopify.com/products/premium-cotton-t-shirt',
 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
 '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop", "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=300&h=300&fit=crop"]',
 'active', 'synced', datetime('now', '-2 hours'), datetime('now', '-7 days'), datetime('now', '-2 hours')),

(2, 1, 1, 'shopify_prod_002', 'Denim Jeans - Classic Blue',
 'Classic blue denim jeans with a comfortable fit. Perfect for casual and semi-formal occasions.',
 79.99, 'Denim Co', 'Jeans', 'denim,blue,casual,classic,cotton',
 'denim-jeans-classic-blue', 'https://demo-fashion-store.myshopify.com/products/denim-jeans-classic-blue',
 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop',
 '["https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop"]',
 'active', 'synced', datetime('now', '-2 hours'), datetime('now', '-7 days'), datetime('now', '-2 hours')),

(3, 1, 1, 'shopify_prod_003', 'Wireless Bluetooth Headphones',
 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
 149.99, 'Tech Audio', 'Electronics', 'bluetooth,wireless,headphones,audio,tech',
 'wireless-bluetooth-headphones', 'https://demo-fashion-store.myshopify.com/products/wireless-bluetooth-headphones',
 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
 '["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop", "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=300&h=300&fit=crop"]',
 'active', 'synced', datetime('now', '-2 hours'), datetime('now', '-7 days'), datetime('now', '-2 hours')),

(4, 1, 1, 'shopify_prod_004', 'Leather Crossbody Bag',
 'Stylish leather crossbody bag perfect for daily use. Handcrafted from genuine leather.',
 89.99, 'Leather Craft', 'Bags', 'leather,crossbody,bag,handcrafted,accessory',
 'leather-crossbody-bag', 'https://demo-fashion-store.myshopify.com/products/leather-crossbody-bag',
 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop',
 '["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop"]',
 'active', 'synced', datetime('now', '-2 hours'), datetime('now', '-7 days'), datetime('now', '-2 hours')),

(5, 1, 1, 'shopify_prod_005', 'Smart Fitness Watch',
 'Advanced fitness tracker with heart rate monitoring, GPS, and smartphone connectivity.',
 199.99, 'FitTech', 'Electronics', 'fitness,watch,smart,gps,health,tracking',
 'smart-fitness-watch', 'https://demo-fashion-store.myshopify.com/products/smart-fitness-watch',
 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop',
 '["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop", "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=300&h=300&fit=crop"]',
 'active', 'synced', datetime('now', '-2 hours'), datetime('now', '-7 days'), datetime('now', '-2 hours')),

(6, 1, 1, 'shopify_prod_006', 'Organic Skincare Set',
 'Complete organic skincare routine with cleanser, toner, and moisturizer. Suitable for all skin types.',
 59.99, 'Natural Beauty', 'Skincare', 'organic,skincare,natural,beauty,routine',
 'organic-skincare-set', 'https://demo-fashion-store.myshopify.com/products/organic-skincare-set',
 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&h=300&fit=crop',
 '["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&h=300&fit=crop"]',
 'active', 'synced', datetime('now', '-2 hours'), datetime('now', '-7 days'), datetime('now', '-2 hours')),

(7, 1, 1, 'shopify_prod_007', 'Casual Running Sneakers',
 'Lightweight running sneakers with cushioned sole and breathable mesh upper.',
 69.99, 'Sport Shoes', 'Footwear', 'sneakers,running,sports,casual,comfortable',
 'casual-running-sneakers', 'https://demo-fashion-store.myshopify.com/products/casual-running-sneakers',
 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop',
 '["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop", "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=300&h=300&fit=crop"]',
 'active', 'synced', datetime('now', '-2 hours'), datetime('now', '-7 days'), datetime('now', '-2 hours')),

(8, 1, 1, 'shopify_prod_008', 'Stainless Steel Water Bottle',
 'Insulated stainless steel water bottle that keeps drinks cold for 24 hours or hot for 12 hours.',
 24.99, 'Hydro Gear', 'Accessories', 'water bottle,stainless steel,insulated,eco-friendly',
 'stainless-steel-water-bottle', 'https://demo-fashion-store.myshopify.com/products/stainless-steel-water-bottle',
 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300&h=300&fit=crop',
 '["https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300&h=300&fit=crop"]',
 'active', 'synced', datetime('now', '-2 hours'), datetime('now', '-7 days'), datetime('now', '-2 hours'));

-- Insert demo collections
INSERT OR IGNORE INTO product_collections (
    id, integration_id, external_collection_id, title, description, handle,
    products_count, created_at, updated_at
) VALUES 
(1, 1, 'collection_001', 'Fashion Essentials', 'Everyday fashion items for modern lifestyle', 'fashion-essentials', 3, datetime('now', '-7 days'), datetime('now', '-2 hours'));

INSERT OR IGNORE INTO product_collections (
    id, integration_id, external_collection_id, title, description, handle,
    products_count, created_at, updated_at
) VALUES 
(2, 1, 'collection_002', 'Tech Gadgets', 'Latest technology and smart devices', 'tech-gadgets', 2, datetime('now', '-7 days'), datetime('now', '-2 hours'));

INSERT OR IGNORE INTO product_collections (
    id, integration_id, external_collection_id, title, description, handle,
    products_count, created_at, updated_at
) VALUES 
(3, 1, 'collection_003', 'Health & Wellness', 'Products for a healthy lifestyle', 'health-wellness', 3, datetime('now', '-7 days'), datetime('now', '-2 hours'));

-- Map products to collections
INSERT OR IGNORE INTO product_collection_mappings (product_id, collection_id, created_at) VALUES (1, 1, datetime('now', '-7 days'));
INSERT OR IGNORE INTO product_collection_mappings (product_id, collection_id, created_at) VALUES (2, 1, datetime('now', '-7 days'));
INSERT OR IGNORE INTO product_collection_mappings (product_id, collection_id, created_at) VALUES (4, 1, datetime('now', '-7 days'));
INSERT OR IGNORE INTO product_collection_mappings (product_id, collection_id, created_at) VALUES (3, 2, datetime('now', '-7 days'));
INSERT OR IGNORE INTO product_collection_mappings (product_id, collection_id, created_at) VALUES (5, 2, datetime('now', '-7 days'));
INSERT OR IGNORE INTO product_collection_mappings (product_id, collection_id, created_at) VALUES (5, 3, datetime('now', '-7 days'));
INSERT OR IGNORE INTO product_collection_mappings (product_id, collection_id, created_at) VALUES (6, 3, datetime('now', '-7 days'));
INSERT OR IGNORE INTO product_collection_mappings (product_id, collection_id, created_at) VALUES (7, 3, datetime('now', '-7 days'));
INSERT OR IGNORE INTO product_collection_mappings (product_id, collection_id, created_at) VALUES (8, 3, datetime('now', '-7 days'));

-- Insert demo sync log
INSERT OR IGNORE INTO sync_logs (
    id, integration_id, user_id, sync_type, status, products_processed,
    products_added, products_updated, products_errors, started_at,
    completed_at, duration_seconds
) VALUES (
    1, 1, 1, 'full_sync', 'completed', 8, 8, 0, 0,
    datetime('now', '-2 hours'), datetime('now', '-2 hours', '+3 minutes'), 180
);