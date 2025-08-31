-- Affiliate Boss Database Schema
-- Bangladesh dev style - practical, comprehensive, and well-structured

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    password_hash TEXT,
    api_key TEXT UNIQUE NOT NULL,
    
    -- Account status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'premium', 'platinum', 'diamond')),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    
    -- Profile info
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    timezone TEXT DEFAULT 'America/New_York',
    language TEXT DEFAULT 'en',
    currency TEXT DEFAULT 'USD',
    
    -- Performance tracking
    total_earnings DECIMAL(15,2) DEFAULT 0.00,
    total_clicks INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- Affiliate links table
CREATE TABLE IF NOT EXISTS affiliate_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    original_url TEXT NOT NULL,
    short_code TEXT UNIQUE NOT NULL,
    short_url TEXT NOT NULL,
    
    -- Link settings
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'inactive')),
    category TEXT DEFAULT 'general',
    tags TEXT, -- JSON array as text
    notes TEXT,
    
    -- UTM parameters
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    
    -- Performance metrics
    total_clicks INTEGER DEFAULT 0,
    unique_clicks INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    total_earnings DECIMAL(15,2) DEFAULT 0.00,
    
    -- Advanced settings
    geo_targeting TEXT, -- JSON as text
    device_targeting TEXT, -- JSON as text
    schedule_settings TEXT, -- JSON as text
    click_fraud_protection BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_click_at DATETIME,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(15,2) NOT NULL,
    image_url TEXT,
    category TEXT NOT NULL,
    vendor TEXT NOT NULL,
    sku TEXT UNIQUE,
    
    -- Commission settings
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_type TEXT DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
    
    -- Inventory
    stock_quantity INTEGER DEFAULT 0,
    track_inventory BOOLEAN DEFAULT TRUE,
    
    -- Product details
    weight TEXT,
    dimensions TEXT,
    tags TEXT, -- JSON array as text
    
    -- Shopify integration
    shopify_product_id TEXT,
    shopify_store_id INTEGER,
    
    -- Performance tracking
    total_sales INTEGER DEFAULT 0,
    total_revenue DECIMAL(15,2) DEFAULT 0.00,
    total_commissions_paid DECIMAL(15,2) DEFAULT 0.00,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Shopify stores table
CREATE TABLE IF NOT EXISTS shopify_stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    shopify_domain TEXT NOT NULL,
    store_url TEXT NOT NULL,
    
    -- Authentication
    access_token TEXT NOT NULL,
    
    -- Store details
    owner_email TEXT,
    phone TEXT,
    country_code TEXT,
    currency TEXT DEFAULT 'USD',
    timezone TEXT,
    plan_name TEXT,
    
    -- Sync settings
    webhook_endpoint TEXT,
    webhook_status TEXT DEFAULT 'pending',
    auto_sync_enabled BOOLEAN DEFAULT TRUE,
    sync_frequency TEXT DEFAULT 'daily',
    last_sync DATETIME,
    next_sync DATETIME,
    
    -- Performance
    products_count INTEGER DEFAULT 0,
    orders_count INTEGER DEFAULT 0,
    total_revenue DECIMAL(15,2) DEFAULT 0.00,
    commission_earned DECIMAL(15,2) DEFAULT 0.00,
    commission_default DECIMAL(5,2) DEFAULT 15.0,
    
    -- Status
    status TEXT DEFAULT 'connected' CHECK (status IN ('connected', 'connecting', 'error', 'disconnected')),
    connection_status TEXT DEFAULT 'healthy',
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Commissions table
CREATE TABLE IF NOT EXISTS commissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    link_id INTEGER,
    product_id INTEGER,
    
    -- Commission details
    commission_type TEXT DEFAULT 'product_sale' CHECK (commission_type IN ('product_sale', 'bonus', 'referral', 'tier_bonus')),
    sale_amount DECIMAL(15,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(15,2) NOT NULL,
    
    -- Tier calculation
    base_commission_rate DECIMAL(5,2),
    tier_multiplier DECIMAL(3,2) DEFAULT 1.00,
    user_tier TEXT,
    
    -- Order details
    order_id TEXT,
    shopify_order_id TEXT,
    customer_email TEXT,
    customer_country TEXT,
    
    -- Tracking info
    referrer_source TEXT,
    device_type TEXT,
    browser TEXT,
    ip_address TEXT,
    
    -- Payment status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled', 'refunded')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    payout_batch_id TEXT,
    
    -- Timestamps
    sale_date DATETIME NOT NULL,
    confirmed_date DATETIME,
    paid_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (link_id) REFERENCES affiliate_links(id) ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Click tracking table
CREATE TABLE IF NOT EXISTS click_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    link_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    
    -- Click details
    ip_address TEXT,
    user_agent TEXT,
    referer TEXT,
    
    -- Geographic info
    country TEXT,
    city TEXT,
    region TEXT,
    
    -- Device info
    device_type TEXT,
    browser TEXT,
    os TEXT,
    
    -- Conversion tracking
    converted BOOLEAN DEFAULT FALSE,
    conversion_value DECIMAL(15,2),
    order_id TEXT,
    
    -- Timestamps
    clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    converted_at DATETIME,
    
    FOREIGN KEY (link_id) REFERENCES affiliate_links(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('stripe', 'paypal', 'wire', 'check')),
    provider TEXT NOT NULL,
    name TEXT NOT NULL,
    
    -- Payment details (encrypted in production)
    details TEXT NOT NULL, -- JSON as text
    
    -- Status
    is_default BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
    verification_status TEXT DEFAULT 'pending',
    
    -- Usage tracking
    last_used_at DATETIME,
    usage_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Payouts table
CREATE TABLE IF NOT EXISTS payouts (
    id TEXT PRIMARY KEY, -- e.g., 'po_2024013001'
    user_id INTEGER NOT NULL,
    payment_method_id INTEGER NOT NULL,
    
    -- Payout details
    amount DECIMAL(15,2) NOT NULL,
    net_amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    
    -- Fee breakdown
    processing_fee DECIMAL(15,2) DEFAULT 0.00,
    platform_fee DECIMAL(15,2) DEFAULT 0.00,
    total_fees DECIMAL(15,2) NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'processing', 'completed', 'failed', 'cancelled')),
    
    -- External tracking
    external_id TEXT,
    failure_reason TEXT,
    
    -- Commission details
    commission_count INTEGER NOT NULL,
    commission_period_start DATE,
    commission_period_end DATE,
    
    -- Timestamps
    requested_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_date DATETIME,
    completed_date DATETIME,
    
    -- Notes
    notes TEXT,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE RESTRICT
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    
    -- General settings
    timezone TEXT DEFAULT 'America/New_York',
    language TEXT DEFAULT 'en',
    currency TEXT DEFAULT 'USD',
    date_format TEXT DEFAULT 'MM/DD/YYYY',
    time_format TEXT DEFAULT '12_hour',
    
    -- Privacy settings
    profile_visibility TEXT DEFAULT 'public',
    show_earnings_publicly BOOLEAN DEFAULT FALSE,
    show_statistics_publicly BOOLEAN DEFAULT TRUE,
    allow_contact_from_others BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT TRUE,
    
    -- Affiliate preferences
    default_link_category TEXT DEFAULT 'General',
    auto_generate_links BOOLEAN DEFAULT TRUE,
    link_cloaking_enabled BOOLEAN DEFAULT TRUE,
    click_fraud_protection BOOLEAN DEFAULT TRUE,
    
    -- Goals
    monthly_earnings_goal DECIMAL(15,2) DEFAULT 0.00,
    monthly_clicks_goal INTEGER DEFAULT 0,
    monthly_conversions_goal INTEGER DEFAULT 0,
    
    -- Payout settings
    minimum_payout DECIMAL(10,2) DEFAULT 50.00,
    auto_payout_enabled BOOLEAN DEFAULT FALSE,
    auto_payout_frequency TEXT DEFAULT 'weekly',
    default_payout_method_id INTEGER,
    
    -- Notification preferences
    email_notifications TEXT, -- JSON as text
    sms_notifications TEXT, -- JSON as text
    
    -- Security settings
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_method TEXT DEFAULT 'sms',
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (default_payout_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL
);

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL, -- Hashed version
    key_preview TEXT NOT NULL, -- First few and last few characters
    
    -- Permissions
    permissions TEXT NOT NULL, -- JSON array as text
    
    -- Usage tracking
    last_used_at DATETIME,
    usage_count INTEGER DEFAULT 0,
    
    -- Status and expiration
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
    expires_at DATETIME,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sessions table (for authentication)
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    
    -- Session details
    token_hash TEXT NOT NULL,
    device_info TEXT,
    ip_address TEXT,
    location TEXT,
    
    -- Session status
    is_active BOOLEAN DEFAULT TRUE,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- OTP codes table (for SMS authentication)
CREATE TABLE IF NOT EXISTS otp_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    purpose TEXT NOT NULL,
    
    -- Status
    used BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    -- Expiration
    expires_at DATETIME NOT NULL,
    used_at DATETIME,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_user_id ON affiliate_links(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_short_code ON affiliate_links(short_code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_click_tracking_link_id ON click_tracking(link_id);
CREATE INDEX IF NOT EXISTS idx_click_tracking_clicked_at ON click_tracking(clicked_at);
CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone, expires_at);