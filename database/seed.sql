-- Simple seed data for Affiliate Boss Demo
-- Bangladesh dev approach - practical and working

-- Insert demo user
INSERT OR REPLACE INTO users (
    id, username, email, phone, first_name, last_name, 
    api_key, status, tier, email_verified, phone_verified,
    total_earnings, total_clicks, total_conversions, conversion_rate,
    created_at
) VALUES (
    1, 'john_demo', 'john@affiliateboss.com', '+1-555-0123', 
    'John', 'Doe', 'api_key_john_123456789', 'active', 'gold', 1, 1,
    12847.50, 89432, 1234, 4.2,
    datetime('now', '-30 days')
);

-- Insert products
INSERT OR REPLACE INTO products (
    id, name, description, price, category, vendor, sku,
    commission_rate, stock_quantity, status, created_at
) VALUES 
(1, 'iPhone 15 Pro Max', 'Latest iPhone with titanium design', 1199.99, 'Electronics', 'Apple', 'IP15PM', 8.5, 100, 'active', datetime('now', '-20 days')),
(2, 'MacBook Pro M3', 'Professional laptop with M3 chip', 1999.99, 'Electronics', 'Apple', 'MBP-M3', 6.5, 50, 'active', datetime('now', '-18 days')),
(3, 'Nike Air Jordan', 'Premium basketball shoes', 170.00, 'Fashion', 'Nike', 'AIR-J1', 12.0, 200, 'active', datetime('now', '-15 days')),
(4, 'Samsung 65 TV', 'QLED 4K Smart TV', 1299.99, 'Electronics', 'Samsung', 'QN65Q90C', 10.0, 30, 'active', datetime('now', '-12 days'));

-- Insert Shopify store
INSERT OR REPLACE INTO shopify_stores (
    id, user_id, name, shopify_domain, store_url, access_token,
    products_count, orders_count, total_revenue, commission_earned, commission_default,
    status, connection_status, created_at
) VALUES (
    1, 1, 'Demo Fashion Store', 'demo-fashion.myshopify.com', 'https://demo-fashion.myshopify.com',
    'demo_token_123', 247, 156, 45678.90, 4567.89, 10.0, 'connected', 'healthy', datetime('now', '-25 days')
);

-- Insert affiliate links
INSERT OR REPLACE INTO affiliate_links (
    id, user_id, name, description, original_url, short_code, short_url,
    status, category, total_clicks, total_conversions, total_earnings, created_at
) VALUES 
(1, 1, 'iPhone 15 Pro Max Link', 'High converting iPhone link', 'https://apple.com/iphone-15-pro', 'iphone15', 'https://aff.boss/iphone15', 'active', 'Electronics', 2847, 89, 1247.30, datetime('now', '-20 days')),
(2, 1, 'MacBook Pro Link', 'MacBook for professionals', 'https://apple.com/macbook-pro', 'macbook', 'https://aff.boss/macbook', 'active', 'Electronics', 1456, 34, 1567.89, datetime('now', '-18 days')),
(3, 1, 'Nike Shoes Link', 'Trendy Nike shoes', 'https://nike.com/air-jordan', 'nike-aj', 'https://aff.boss/nike-aj', 'active', 'Fashion', 987, 23, 678.90, datetime('now', '-15 days')),
(4, 1, 'Samsung TV Link', 'Best TV deals', 'https://samsung.com/tv', 'samsung-tv', 'https://aff.boss/samsung-tv', 'paused', 'Electronics', 654, 12, 456.78, datetime('now', '-12 days'));

-- Insert commissions
INSERT OR REPLACE INTO commissions (
    id, user_id, link_id, product_id, commission_type, sale_amount, commission_rate, commission_amount,
    user_tier, order_id, status, payment_status, sale_date, created_at
) VALUES 
(1, 1, 1, 1, 'product_sale', 1199.99, 8.5, 101.99, 'gold', 'ORD-001', 'confirmed', 'paid', datetime('now', '-5 days'), datetime('now', '-5 days')),
(2, 1, 2, 2, 'product_sale', 1999.99, 6.5, 129.99, 'gold', 'ORD-002', 'confirmed', 'paid', datetime('now', '-3 days'), datetime('now', '-3 days')),
(3, 1, 3, 3, 'product_sale', 170.00, 12.0, 20.40, 'gold', 'ORD-003', 'pending', 'pending', datetime('now', '-2 days'), datetime('now', '-2 days')),
(4, 1, 4, 4, 'product_sale', 1299.99, 10.0, 129.99, 'gold', 'ORD-004', 'confirmed', 'pending', datetime('now', '-1 day'), datetime('now', '-1 day'));

-- Insert payment methods
INSERT OR REPLACE INTO payment_methods (
    id, user_id, type, provider, name, details, is_default, status, created_at
) VALUES 
(1, 1, 'stripe', 'Stripe', 'Bank Account', '{"account": "****4567"}', 1, 'verified', datetime('now', '-30 days')),
(2, 1, 'paypal', 'PayPal', 'PayPal Account', '{"email": "john@affiliateboss.com"}', 0, 'verified', datetime('now', '-25 days'));

-- Insert user settings
INSERT OR REPLACE INTO user_settings (
    user_id, timezone, language, currency, monthly_earnings_goal, minimum_payout, 
    auto_payout_enabled, two_factor_enabled, created_at
) VALUES (
    1, 'America/New_York', 'en', 'USD', 5000.00, 50.00, 1, 1, datetime('now', '-30 days')
);

-- Insert sample click tracking
INSERT OR REPLACE INTO click_tracking (
    link_id, user_id, ip_address, country, device_type, browser, 
    converted, conversion_value, clicked_at
) VALUES 
(1, 1, '192.168.1.100', 'US', 'desktop', 'chrome', 1, 1199.99, datetime('now', '-5 days')),
(1, 1, '192.168.1.101', 'US', 'mobile', 'safari', 0, NULL, datetime('now', '-4 days')),
(2, 1, '192.168.1.102', 'CA', 'desktop', 'firefox', 1, 1999.99, datetime('now', '-3 days')),
(3, 1, '192.168.1.103', 'UK', 'mobile', 'chrome', 0, NULL, datetime('now', '-2 days'));