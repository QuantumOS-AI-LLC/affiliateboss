-- Advanced Seed Data (Fixed) for Complete Affiliate System

-- Insert Commission Profiles
INSERT OR IGNORE INTO commission_profiles (id, name, description, profile_type, default_rate, tier_structure, min_payout, payment_frequency, payment_delay_days) VALUES 
  (1, 'Standard Affiliate', 'Basic commission profile for new affiliates', 'standard', 15.00, '[{"min_sales": 0, "rate": 15}, {"min_sales": 1000, "rate": 18}, {"min_sales": 5000, "rate": 20}]', 50.00, 'monthly', 30),
  (2, 'VIP Affiliate', 'Enhanced profile for high-performing affiliates', 'vip', 25.00, '[{"min_sales": 0, "rate": 25}, {"min_sales": 2000, "rate": 28}, {"min_sales": 10000, "rate": 30}]', 25.00, 'bi-weekly', 15),
  (3, 'Premium Partner', 'Top-tier commission structure for premium partners', 'premium', 35.00, '[{"min_sales": 0, "rate": 35}, {"min_sales": 5000, "rate": 40}, {"min_sales": 20000, "rate": 45}]', 10.00, 'weekly', 7),
  (4, 'Enterprise Affiliate', 'Custom enterprise-level commission structure', 'custom', 40.00, '[{"min_sales": 0, "rate": 40}, {"min_sales": 10000, "rate": 45}, {"min_sales": 50000, "rate": 50}]', 0.00, 'weekly', 3);

-- Assign Commission Profiles to Users
INSERT OR IGNORE INTO user_commission_profiles (user_id, profile_id, assigned_date, status) VALUES 
  (1, 2, '2024-01-01', 'active'), -- John gets VIP
  (2, 3, '2024-01-01', 'active'), -- Sarah gets Premium
  (3, 1, '2024-01-01', 'active'), -- Mike gets Standard
  (4, 3, '2024-01-01', 'active'); -- Emma gets Premium

-- Insert Payout Rules
INSERT OR IGNORE INTO payout_rules (id, name, description, min_balance, frequency, day_of_month, commission_age_days, auto_process) VALUES 
  (1, 'Standard Monthly Payout', 'Default monthly payout rule for all affiliates', 50.00, 'monthly', 15, 30, TRUE),
  (2, 'VIP Bi-Weekly Payout', 'Faster payouts for VIP affiliates', 25.00, 'bi-weekly', NULL, 15, TRUE),
  (3, 'Premium Weekly Payout', 'Weekly payouts for premium partners', 10.00, 'weekly', NULL, 7, TRUE),
  (4, 'Enterprise Fast Payout', 'Near-instant payouts for enterprise clients', 0.00, 'daily', NULL, 3, TRUE);

-- Insert User Settings
INSERT OR IGNORE INTO user_settings (user_id, current_balance, pending_balance, lifetime_earnings, commission_profile_id, performance_tier, min_payout_amount, payout_frequency, auto_payout) VALUES 
  (1, 198.85, 49.75, 248.60, 2, 'gold', 25.00, 'bi-weekly', TRUE),
  (2, 155.20, 0.00, 155.20, 3, 'platinum', 10.00, 'weekly', TRUE),
  (3, 0.00, 0.00, 0.00, 1, 'bronze', 50.00, 'monthly', FALSE),
  (4, 311.85, 103.95, 415.80, 3, 'platinum', 10.00, 'weekly', TRUE);

-- Generate KPI Daily Stats (Last 7 days)
INSERT OR IGNORE INTO kpi_daily_stats (user_id, date, raw_clicks, unique_clicks, conversions, conversion_rate, gross_sales, commission_earned, average_order_value, earnings_per_click) VALUES 
  -- John Doe (User 1) - Last 7 days
  (1, '2024-08-22', 45, 38, 3, 7.89, 1485.00, 445.50, 495.00, 11.73),
  (1, '2024-08-23', 52, 41, 4, 9.76, 1988.00, 596.40, 497.00, 14.54),
  (1, '2024-08-24', 38, 32, 2, 6.25, 994.00, 298.20, 497.00, 9.32),
  (1, '2024-08-25', 61, 48, 5, 10.42, 2485.00, 745.50, 497.00, 15.53),
  (1, '2024-08-26', 43, 35, 3, 8.57, 1491.00, 447.30, 497.00, 12.78),
  (1, '2024-08-27', 56, 44, 4, 9.09, 1988.00, 596.40, 497.00, 13.55),
  (1, '2024-08-28', 29, 24, 2, 8.33, 994.00, 298.20, 497.00, 12.42),
  
  -- Sarah Smith (User 2) - Last 7 days
  (2, '2024-08-22', 73, 59, 8, 13.56, 776.00, 310.40, 97.00, 5.26),
  (2, '2024-08-23', 89, 71, 10, 14.08, 970.00, 388.00, 97.00, 5.47),
  (2, '2024-08-24', 65, 52, 7, 13.46, 679.00, 271.60, 97.00, 5.22),
  (2, '2024-08-25', 94, 78, 12, 15.38, 1164.00, 465.60, 97.00, 5.97),
  (2, '2024-08-26', 81, 64, 9, 14.06, 873.00, 349.20, 97.00, 5.46),
  (2, '2024-08-27', 77, 61, 8, 13.11, 776.00, 310.40, 97.00, 5.09),
  (2, '2024-08-28', 45, 36, 5, 13.89, 485.00, 194.00, 97.00, 5.39),
  
  -- Emma Wilson (User 4) - Last 7 days
  (4, '2024-08-22', 35, 28, 4, 14.29, 1188.00, 415.80, 297.00, 14.85),
  (4, '2024-08-23', 42, 34, 5, 14.71, 1485.00, 519.75, 297.00, 15.29),
  (4, '2024-08-24', 38, 31, 3, 9.68, 891.00, 311.85, 297.00, 10.05),
  (4, '2024-08-25', 48, 39, 6, 15.38, 1782.00, 623.70, 297.00, 15.99),
  (4, '2024-08-26', 41, 33, 4, 12.12, 1188.00, 415.80, 297.00, 12.60),
  (4, '2024-08-27', 44, 36, 5, 13.89, 1485.00, 519.75, 297.00, 14.44),
  (4, '2024-08-28', 26, 21, 3, 14.29, 891.00, 311.85, 297.00, 14.84);

-- Generate Link Performance Data (Hourly breakdown for today)
INSERT OR IGNORE INTO link_performance (link_id, date, hour, clicks, unique_clicks, conversions, revenue, direct_traffic, social_traffic, email_traffic) VALUES 
  -- Link 1 performance today
  (1, '2024-08-28', 8, 4, 3, 0, 0.00, 2, 1, 1),
  (1, '2024-08-28', 9, 7, 6, 1, 497.00, 3, 2, 2),
  (1, '2024-08-28', 10, 5, 4, 0, 0.00, 3, 1, 1),
  (1, '2024-08-28', 11, 8, 7, 1, 497.00, 4, 2, 2),
  (1, '2024-08-28', 12, 3, 3, 0, 0.00, 2, 1, 0),
  (1, '2024-08-28', 13, 2, 2, 0, 0.00, 1, 1, 0),
  
  -- Link 3 performance today
  (3, '2024-08-28', 8, 12, 9, 1, 97.00, 6, 3, 3),
  (3, '2024-08-28', 9, 15, 12, 2, 194.00, 8, 4, 3),
  (3, '2024-08-28', 10, 8, 6, 1, 97.00, 4, 2, 2),
  (3, '2024-08-28', 11, 10, 9, 1, 97.00, 5, 3, 2),
  (3, '2024-08-28', 12, 6, 5, 0, 0.00, 3, 2, 1),
  
  -- Link 5 performance today
  (5, '2024-08-28', 9, 8, 6, 1, 297.00, 4, 2, 2),
  (5, '2024-08-28', 10, 6, 5, 1, 297.00, 3, 2, 1),
  (5, '2024-08-28', 11, 9, 7, 1, 297.00, 5, 2, 2),
  (5, '2024-08-28', 12, 3, 3, 0, 0.00, 2, 1, 0);

-- Generate Conversion Data
INSERT OR IGNORE INTO conversions (id, user_id, link_id, traffic_id, order_id, product_id, order_value, commission_value, customer_country, time_to_conversion, session_count, status, converted_at) VALUES 
  (1, 1, 1, 1, 'ORD-2024-001', 1, 497.00, 149.10, 'US', 1800, 1, 'confirmed', '2024-08-28 09:15:00'),
  (2, 1, 1, NULL, 'ORD-2024-002', 1, 497.00, 149.10, 'CA', 3600, 2, 'confirmed', '2024-08-28 11:30:00'),
  (3, 2, 3, 3, 'ORD-2024-003', 3, 97.00, 38.80, 'UK', 900, 1, 'confirmed', '2024-08-28 08:45:00'),
  (4, 2, 3, 4, 'ORD-2024-004', 3, 97.00, 38.80, 'AU', 2700, 1, 'confirmed', '2024-08-28 09:30:00'),
  (5, 2, 3, NULL, 'ORD-2024-005', 3, 97.00, 38.80, 'DE', 1200, 1, 'confirmed', '2024-08-28 10:15:00'),
  (6, 2, 3, NULL, 'ORD-2024-006', 3, 97.00, 38.80, 'FR', 4500, 3, 'confirmed', '2024-08-28 11:45:00'),
  (7, 4, 5, 5, 'ORD-2024-007', 5, 297.00, 103.95, 'US', 600, 1, 'confirmed', '2024-08-28 09:10:00'),
  (8, 4, 5, NULL, 'ORD-2024-008', 5, 297.00, 103.95, 'CA', 1800, 2, 'confirmed', '2024-08-28 10:30:00'),
  (9, 4, 5, NULL, 'ORD-2024-009', 5, 297.00, 103.95, 'UK', 3300, 2, 'confirmed', '2024-08-28 11:55:00');

-- Generate Report Snapshots (Weekly and Monthly)
INSERT OR IGNORE INTO report_snapshots (report_type, period_start, period_end, total_affiliates, active_affiliates, new_affiliates, total_clicks, unique_clicks, total_conversions, conversion_rate, total_revenue, total_commissions, average_order_value, top_affiliates, top_products, top_countries) VALUES 
  -- This Week
  ('weekly', '2024-08-22', '2024-08-28', 4, 3, 0, 1247, 982, 89, 9.07, 26262.00, 9191.70, 295.07, 
   '[{"user_id": 2, "username": "sarah_smith", "earnings": 3104.00}, {"user_id": 1, "username": "john_doe", "earnings": 2982.00}, {"user_id": 4, "username": "emma_wilson", "earnings": 3105.70}]',
   '[{"product_id": 3, "name": "Affiliate Mastery Blueprint", "sales": 45}, {"product_id": 1, "name": "Ultimate Marketing Course", "sales": 23}, {"product_id": 5, "name": "E-commerce Growth Accelerator", "sales": 21}]',
   '[{"country": "US", "conversions": 28}, {"country": "CA", "conversions": 18}, {"country": "UK", "conversions": 15}]'),
   
  -- This Month
  ('monthly', '2024-08-01', '2024-08-31', 4, 3, 1, 5438, 4211, 342, 8.12, 101485.00, 35519.75, 296.73,
   '[{"user_id": 2, "username": "sarah_smith", "earnings": 12416.00}, {"user_id": 4, "username": "emma_wilson", "earnings": 12422.80}, {"user_id": 1, "username": "john_doe", "earnings": 10680.95}]',
   '[{"product_id": 3, "name": "Affiliate Mastery Blueprint", "sales": 178}, {"product_id": 1, "name": "Ultimate Marketing Course", "sales": 89}, {"product_id": 5, "name": "E-commerce Growth Accelerator", "sales": 75}]',
   '[{"country": "US", "conversions": 112}, {"country": "CA", "conversions": 67}, {"country": "UK", "conversions": 54}, {"country": "AU", "conversions": 38}, {"country": "DE", "conversions": 32}]');