-- Affiliate Boss Database Schema
-- Mirrors iDevAffiliate structure with modern enhancements

-- Users/Affiliates table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company TEXT,
  website TEXT,
  
  -- Status and approval system
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'declined', 'suspended')),
  approved_date DATETIME,
  
  -- Authentication
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  otp_code TEXT,
  otp_expires_at DATETIME,
  
  -- Profile information
  avatar_url TEXT,
  bio TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  
  -- Payment information
  payment_method TEXT DEFAULT 'paypal' CHECK(payment_method IN ('paypal', 'bank', 'crypto', 'check')),
  paypal_email TEXT,
  bank_account TEXT,
  crypto_address TEXT,
  tax_id TEXT,
  
  -- Settings
  commission_rate DECIMAL(5,2) DEFAULT 10.00, -- Default 10%
  cookie_days INTEGER DEFAULT 30,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  
  -- API access
  api_key TEXT UNIQUE,
  api_secret TEXT
);

-- Products/Offers table
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  
  -- Commission structure
  commission_type TEXT DEFAULT 'percentage' CHECK(commission_type IN ('percentage', 'fixed', 'tiered')),
  commission_rate DECIMAL(5,2) DEFAULT 10.00, -- Percentage or fixed amount
  
  -- Product details
  category TEXT,
  sku TEXT UNIQUE,
  url TEXT NOT NULL, -- The actual product/landing page URL
  image_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'archived')),
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Affiliate Links table
CREATE TABLE IF NOT EXISTS affiliate_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id INTEGER,
  
  -- Link details
  original_url TEXT NOT NULL, -- The URL to promote
  short_code TEXT UNIQUE NOT NULL, -- Short identifier for the link
  full_link TEXT NOT NULL, -- Complete affiliate link
  
  -- Tracking
  title TEXT,
  description TEXT,
  campaign_name TEXT,
  utm_source TEXT,
  utm_medium TEXT DEFAULT 'affiliate',
  utm_campaign TEXT,
  utm_content TEXT,
  
  -- Stats
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0.00,
  
  -- Settings
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'archived')),
  expires_at DATETIME,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Traffic/Clicks table - mirrors iDevAffiliate getTraffic endpoint
CREATE TABLE IF NOT EXISTS traffic (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  link_id INTEGER,
  
  -- Tracking details
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  
  -- Geographic data
  country TEXT,
  city TEXT,
  region TEXT,
  
  -- Device/Browser info
  device_type TEXT, -- mobile, desktop, tablet
  browser TEXT,
  os TEXT,
  
  -- UTM parameters
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  
  -- Conversion tracking
  converted BOOLEAN DEFAULT FALSE,
  conversion_value DECIMAL(10,2) DEFAULT 0.00,
  
  -- Timestamps
  clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  converted_at DATETIME,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (link_id) REFERENCES affiliate_links(id) ON DELETE SET NULL
);

-- Commissions table - mirrors iDevAffiliate getCommissions endpoint
CREATE TABLE IF NOT EXISTS commissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  traffic_id INTEGER,
  product_id INTEGER,
  
  -- Commission details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  commission_rate DECIMAL(5,2),
  sale_amount DECIMAL(10,2),
  
  -- Status tracking - mirrors iDevAffiliate status system
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'declined', 'delayed', 'paid')),
  
  -- Order details
  order_id TEXT,
  transaction_id TEXT,
  customer_email TEXT,
  
  -- Dates
  sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  approved_date DATETIME,
  declined_date DATETIME,
  paid_date DATETIME,
  
  -- Notes
  notes TEXT,
  decline_reason TEXT,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (traffic_id) REFERENCES traffic(id) ON DELETE SET NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Payments table - mirrors iDevAffiliate getPayments endpoint
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  
  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT CHECK(payment_method IN ('paypal', 'bank', 'crypto', 'check', 'manual')),
  
  -- Payment reference
  transaction_id TEXT UNIQUE,
  reference_number TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Commission period
  period_start DATE,
  period_end DATE,
  commission_count INTEGER DEFAULT 0, -- Number of commissions in this payment
  
  -- Payment details
  payment_date DATE,
  notes TEXT,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Payment Items - Links payments to specific commissions
CREATE TABLE IF NOT EXISTS payment_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL,
  commission_id INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  FOREIGN KEY (commission_id) REFERENCES commissions(id) ON DELETE CASCADE,
  UNIQUE(payment_id, commission_id)
);

-- SMS OTP verification logs
CREATE TABLE IF NOT EXISTS sms_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT CHECK(type IN ('verification', 'login', 'password_reset')),
  status TEXT DEFAULT 'sent' CHECK(status IN ('sent', 'verified', 'expired', 'failed')),
  attempts INTEGER DEFAULT 0,
  
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  verified_at DATETIME,
  expires_at DATETIME
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);

CREATE INDEX IF NOT EXISTS idx_affiliate_links_user_id ON affiliate_links(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_short_code ON affiliate_links(short_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_status ON affiliate_links(status);

CREATE INDEX IF NOT EXISTS idx_traffic_user_id ON traffic(user_id);
CREATE INDEX IF NOT EXISTS idx_traffic_link_id ON traffic(link_id);
CREATE INDEX IF NOT EXISTS idx_traffic_clicked_at ON traffic(clicked_at);
CREATE INDEX IF NOT EXISTS idx_traffic_converted ON traffic(converted);

CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_sale_date ON commissions(sale_date);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_sms_logs_phone ON sms_logs(phone);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);