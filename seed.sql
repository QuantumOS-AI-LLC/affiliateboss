-- Affiliate Boss Seed Data
-- Test data for development and demonstration

-- Insert test products/offers
INSERT OR IGNORE INTO products (id, name, description, price, commission_rate, url, category, sku) VALUES 
  (1, 'Ultimate Marketing Course', 'Complete digital marketing masterclass with 50+ modules', 497.00, 30.00, 'https://example.com/marketing-course', 'Education', 'UMC-2024'),
  (2, 'Premium SEO Tools Suite', 'Professional SEO toolkit for agencies and marketers', 199.00, 25.00, 'https://example.com/seo-tools', 'Software', 'SEO-SUITE-PRO'),
  (3, 'Affiliate Mastery Blueprint', 'Step-by-step guide to building profitable affiliate campaigns', 97.00, 40.00, 'https://example.com/affiliate-blueprint', 'Education', 'AMB-GUIDE'),
  (4, 'Social Media Management Tool', 'All-in-one platform for social media scheduling and analytics', 49.00, 20.00, 'https://example.com/social-tool', 'Software', 'SMM-TOOL-2024'),
  (5, 'E-commerce Growth Accelerator', 'Advanced strategies for scaling online stores', 297.00, 35.00, 'https://example.com/ecom-growth', 'Education', 'EGA-COURSE');

-- Insert test users (affiliates)
INSERT OR IGNORE INTO users (id, username, email, phone, password_hash, first_name, last_name, status, commission_rate, api_key) VALUES 
  (1, 'john_doe', 'john@example.com', '+1234567890', 'hashed_password_123', 'John', 'Doe', 'approved', 25.00, 'api_key_john_123456789'),
  (2, 'sarah_smith', 'sarah@example.com', '+1987654321', 'hashed_password_456', 'Sarah', 'Smith', 'approved', 30.00, 'api_key_sarah_987654321'),
  (3, 'mike_johnson', 'mike@example.com', '+1122334455', 'hashed_password_789', 'Mike', 'Johnson', 'pending', 20.00, 'api_key_mike_555666777'),
  (4, 'emma_wilson', 'emma@example.com', '+1555666777', 'hashed_password_abc', 'Emma', 'Wilson', 'approved', 35.00, 'api_key_emma_111222333');

-- Insert test affiliate links
INSERT OR IGNORE INTO affiliate_links (id, user_id, product_id, original_url, short_code, full_link, title, campaign_name, clicks, conversions) VALUES 
  (1, 1, 1, 'https://example.com/marketing-course', 'mkt001', 'https://affiliateboss.com/go/mkt001', 'Marketing Course Promotion', 'Q1 Marketing Push', 150, 8),
  (2, 1, 2, 'https://example.com/seo-tools', 'seo001', 'https://affiliateboss.com/go/seo001', 'SEO Tools Suite', 'SEO Campaign 2024', 89, 4),
  (3, 2, 3, 'https://example.com/affiliate-blueprint', 'aff001', 'https://affiliateboss.com/go/aff001', 'Affiliate Mastery Guide', 'Affiliate Education', 203, 12),
  (4, 2, 4, 'https://example.com/social-tool', 'soc001', 'https://affiliateboss.com/go/soc001', 'Social Media Tool', 'Social Media Blitz', 67, 3),
  (5, 4, 5, 'https://example.com/ecom-growth', 'eco001', 'https://affiliateboss.com/go/eco001', 'E-commerce Growth Course', 'E-com Masterclass', 124, 7);

-- Insert test traffic data
INSERT OR IGNORE INTO traffic (id, user_id, link_id, ip_address, country, device_type, converted, conversion_value) VALUES 
  (1, 1, 1, '192.168.1.100', 'US', 'desktop', TRUE, 497.00),
  (2, 1, 1, '192.168.1.101', 'CA', 'mobile', FALSE, 0.00),
  (3, 2, 3, '192.168.1.102', 'UK', 'desktop', TRUE, 97.00),
  (4, 2, 3, '192.168.1.103', 'AU', 'tablet', TRUE, 97.00),
  (5, 4, 5, '192.168.1.104', 'DE', 'desktop', TRUE, 297.00);

-- Insert test commissions
INSERT OR IGNORE INTO commissions (id, user_id, traffic_id, product_id, amount, commission_rate, sale_amount, status, order_id) VALUES 
  (1, 1, 1, 1, 149.10, 30.00, 497.00, 'approved', 'ORD-001'),
  (2, 1, NULL, 2, 49.75, 25.00, 199.00, 'pending', 'ORD-002'),
  (3, 2, 3, 3, 38.80, 40.00, 97.00, 'approved', 'ORD-003'),
  (4, 2, 4, 3, 38.80, 40.00, 97.00, 'approved', 'ORD-004'),
  (5, 4, 5, 5, 103.95, 35.00, 297.00, 'pending', 'ORD-005');

-- Insert test payments
INSERT OR IGNORE INTO payments (id, user_id, amount, payment_method, status, commission_count, period_start, period_end) VALUES 
  (1, 1, 149.10, 'paypal', 'completed', 1, '2024-01-01', '2024-01-31'),
  (2, 2, 77.60, 'paypal', 'completed', 2, '2024-01-01', '2024-01-31'),
  (3, 4, 103.95, 'bank', 'pending', 1, '2024-02-01', '2024-02-29');

-- Link payments to commissions
INSERT OR IGNORE INTO payment_items (payment_id, commission_id, amount) VALUES 
  (1, 1, 149.10),
  (2, 3, 38.80),
  (2, 4, 38.80),
  (3, 5, 103.95);