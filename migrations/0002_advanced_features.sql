-- Advanced Features Migration (Fixed) - Complete Affiliate System
-- KPIs, Commission Profiles, Payment Automation, and Reporting

-- KPI Tracking and Analytics Tables
CREATE TABLE IF NOT EXISTS kpi_daily_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date DATE NOT NULL,
  
  -- Core KPIs matching iDevAffiliate
  raw_clicks INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0.00,
  
  -- Revenue & Commission KPIs
  gross_sales DECIMAL(10,2) DEFAULT 0.00,
  commission_earned DECIMAL(10,2) DEFAULT 0.00,
  average_order_value DECIMAL(10,2) DEFAULT 0.00,
  earnings_per_click DECIMAL(6,4) DEFAULT 0.00,
  
  -- Traffic Quality KPIs
  bounce_rate DECIMAL(5,2) DEFAULT 0.00,
  time_on_site INTEGER DEFAULT 0,
  pages_per_session DECIMAL(4,2) DEFAULT 0.00,
  
  -- Geographic and Device KPIs
  top_country TEXT,
  top_device TEXT,
  mobile_percentage DECIMAL(5,2) DEFAULT 0.00,
  
  -- Campaign Performance
  top_campaign TEXT,
  top_utm_source TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, date)
);

-- Commission Profiles and Rules
CREATE TABLE IF NOT EXISTS commission_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Profile Type
  profile_type TEXT DEFAULT 'standard',
  
  -- Commission Structure
  default_rate DECIMAL(5,2) NOT NULL,
  tier_structure TEXT,
  
  -- Bonus Rules
  signup_bonus DECIMAL(8,2) DEFAULT 0.00,
  performance_bonus_rules TEXT,
  
  -- Restrictions and Requirements
  min_payout DECIMAL(8,2) DEFAULT 50.00,
  max_payout DECIMAL(10,2) DEFAULT 10000.00,
  cookie_duration INTEGER DEFAULT 30,
  
  -- Payment Terms
  payment_frequency TEXT DEFAULT 'monthly',
  payment_day INTEGER DEFAULT 1,
  payment_delay_days INTEGER DEFAULT 30,
  
  -- Status and Dates
  status TEXT DEFAULT 'active',
  effective_from DATE,
  effective_until DATE,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User Commission Profile Assignment
CREATE TABLE IF NOT EXISTS user_commission_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  profile_id INTEGER NOT NULL,
  
  -- Override settings specific to this user
  custom_rate DECIMAL(5,2),
  custom_min_payout DECIMAL(8,2),
  
  -- Assignment details
  assigned_date DATE DEFAULT CURRENT_DATE,
  assigned_by INTEGER,
  notes TEXT,
  
  status TEXT DEFAULT 'active',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (profile_id) REFERENCES commission_profiles(id) ON DELETE CASCADE,
  UNIQUE(user_id, profile_id)
);

-- Payment Automation Rules
CREATE TABLE IF NOT EXISTS payout_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Rule Conditions
  min_balance DECIMAL(8,2) DEFAULT 50.00,
  max_balance DECIMAL(10,2) DEFAULT 10000.00,
  
  -- Schedule Settings
  frequency TEXT DEFAULT 'monthly',
  day_of_week INTEGER,
  day_of_month INTEGER,
  
  -- Processing Rules
  commission_age_days INTEGER DEFAULT 30,
  auto_process BOOLEAN DEFAULT TRUE,
  require_approval BOOLEAN DEFAULT FALSE,
  
  -- Geographic and Currency Rules
  supported_countries TEXT,
  supported_currencies TEXT,
  
  -- Status
  status TEXT DEFAULT 'active',
  priority INTEGER DEFAULT 1,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Stripe Integration Tables
CREATE TABLE IF NOT EXISTS stripe_customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  
  -- Customer details
  email TEXT,
  phone TEXT,
  
  -- Payment methods
  default_payment_method TEXT,
  payment_methods TEXT,
  
  -- Verification status
  identity_verified BOOLEAN DEFAULT FALSE,
  tax_id_verified BOOLEAN DEFAULT FALSE,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS stripe_payouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  
  -- Stripe identifiers
  stripe_payout_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  
  -- Payout details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Processing status
  stripe_status TEXT,
  failure_reason TEXT,
  failure_code TEXT,
  
  -- Timing
  initiated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  failed_at DATETIME,
  
  -- Metadata
  stripe_metadata TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Advanced Reporting Tables
CREATE TABLE IF NOT EXISTS report_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Report identification
  report_type TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Aggregate KPIs (system-wide)
  total_affiliates INTEGER DEFAULT 0,
  active_affiliates INTEGER DEFAULT 0,
  new_affiliates INTEGER DEFAULT 0,
  
  total_clicks INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0.00,
  
  total_revenue DECIMAL(12,2) DEFAULT 0.00,
  total_commissions DECIMAL(12,2) DEFAULT 0.00,
  total_payouts DECIMAL(12,2) DEFAULT 0.00,
  
  average_order_value DECIMAL(8,2) DEFAULT 0.00,
  revenue_per_affiliate DECIMAL(8,2) DEFAULT 0.00,
  
  -- Top performers (JSON data)
  top_affiliates TEXT,
  top_products TEXT,
  top_countries TEXT,
  
  -- Generated at
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Link Performance Tracking (Enhanced)
CREATE TABLE IF NOT EXISTS link_performance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  link_id INTEGER NOT NULL,
  
  -- Time-based tracking
  hour INTEGER NOT NULL,
  date DATE NOT NULL,
  
  -- Hourly metrics
  clicks INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0.00,
  
  -- Traffic sources
  direct_traffic INTEGER DEFAULT 0,
  social_traffic INTEGER DEFAULT 0,
  email_traffic INTEGER DEFAULT 0,
  search_traffic INTEGER DEFAULT 0,
  other_traffic INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (link_id) REFERENCES affiliate_links(id) ON DELETE CASCADE,
  UNIQUE(link_id, date, hour)
);

-- Conversion Tracking (Enhanced)
CREATE TABLE IF NOT EXISTS conversions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Core tracking
  user_id INTEGER NOT NULL,
  link_id INTEGER,
  traffic_id INTEGER NOT NULL,
  commission_id INTEGER,
  
  -- Conversion details
  order_id TEXT,
  product_id INTEGER,
  product_sku TEXT,
  
  -- Values
  order_value DECIMAL(10,2) NOT NULL,
  commission_value DECIMAL(10,2) NOT NULL,
  
  -- Customer info (anonymized)
  customer_hash TEXT,
  customer_country TEXT,
  customer_device TEXT,
  
  -- Attribution
  first_click_date DATETIME,
  conversion_path TEXT,
  
  -- Timing analysis
  time_to_conversion INTEGER,
  session_count INTEGER DEFAULT 1,
  
  -- Status
  status TEXT DEFAULT 'confirmed',
  
  converted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  confirmed_at DATETIME,
  reversed_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (link_id) REFERENCES affiliate_links(id) ON DELETE SET NULL,
  FOREIGN KEY (traffic_id) REFERENCES traffic(id) ON DELETE CASCADE,
  FOREIGN KEY (commission_id) REFERENCES commissions(id) ON DELETE SET NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Enhanced User Settings - Using separate table to avoid ALTER TABLE issues
CREATE TABLE IF NOT EXISTS user_settings (
  user_id INTEGER PRIMARY KEY,
  
  -- Payment settings
  stripe_customer_id TEXT,
  payout_method TEXT DEFAULT 'stripe',
  min_payout_amount DECIMAL(8,2) DEFAULT 50.00,
  payout_frequency TEXT DEFAULT 'monthly',
  payout_day INTEGER DEFAULT 1,
  auto_payout BOOLEAN DEFAULT TRUE,
  hold_payments BOOLEAN DEFAULT FALSE,
  
  -- Commission settings
  commission_profile_id INTEGER,
  performance_tier TEXT DEFAULT 'standard',
  lifetime_earnings DECIMAL(12,2) DEFAULT 0.00,
  current_balance DECIMAL(10,2) DEFAULT 0.00,
  pending_balance DECIMAL(10,2) DEFAULT 0.00,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Enhanced Payment Processing - Using separate table
CREATE TABLE IF NOT EXISTS payment_processing (
  payment_id INTEGER PRIMARY KEY,
  
  processing_fee DECIMAL(6,2) DEFAULT 0.00,
  net_amount DECIMAL(10,2),
  stripe_payout_id TEXT,
  processing_status TEXT DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  last_retry_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_kpi_daily_user_date ON kpi_daily_stats(user_id, date);
CREATE INDEX IF NOT EXISTS idx_commission_profiles_status ON commission_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_commission_profiles_user ON user_commission_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payouts_user ON stripe_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_link_performance_link_date ON link_performance(link_id, date);
CREATE INDEX IF NOT EXISTS idx_conversions_user_date ON conversions(user_id, converted_at);
CREATE INDEX IF NOT EXISTS idx_conversions_status ON conversions(status);
CREATE INDEX IF NOT EXISTS idx_report_snapshots_type_period ON report_snapshots(report_type, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);