const { handleCors, checkAuth, formatCurrency, formatDate, hashPassword } = require('./utils/helpers');

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    
    const user = checkAuth(req, res);
    if (!user) return;

    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    const path = pathname.replace('/api/settings', '');

    switch (req.method) {
        case 'GET':
            if (path === '/profile') return getUserProfile(req, res, user);
            if (path === '/account') return getAccountSettings(req, res, user);
            if (path === '/notifications') return getNotificationSettings(req, res, user);
            if (path === '/security') return getSecuritySettings(req, res, user);
            if (path === '/preferences') return getUserPreferences(req, res, user);
            if (path === '/api-keys') return getApiKeys(req, res, user);
            if (path === '/activity') return getAccountActivity(req, res, user);
            break;
            
        case 'POST':
            if (path === '/otp/send') return sendOTPCode(req, res, user);
            if (path === '/otp/verify') return verifyOTPCode(req, res, user);
            if (path === '/api-keys/generate') return generateApiKey(req, res, user);
            if (path === '/2fa/enable') return enableTwoFactor(req, res, user);
            if (path === '/password/change') return changePassword(req, res, user);
            break;
            
        case 'PUT':
            if (path === '/profile') return updateProfile(req, res, user);
            if (path === '/account') return updateAccountSettings(req, res, user);
            if (path === '/notifications') return updateNotificationSettings(req, res, user);
            if (path === '/preferences') return updateUserPreferences(req, res, user);
            break;
            
        case 'DELETE':
            if (path.match(/^\/api-keys\/\d+$/)) return revokeApiKey(req, res, user, path.split('/')[2]);
            if (path === '/2fa/disable') return disableTwoFactor(req, res, user);
            break;
    }
    
    return res.status(404).json({ error: 'Settings API endpoint not found' });
};

// Get user profile information
function getUserProfile(req, res, user) {
    // Comprehensive user profile - real Bangladesh dev would include all necessary fields
    const profile = {
        basic_info: {
            user_id: user.id,
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            full_name: `${user.first_name} ${user.last_name}`,
            phone: user.phone,
            avatar_url: `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=8B5CF6&color=fff&size=200`,
            
            // Account status and verification
            email_verified: true,
            phone_verified: true,
            profile_completed: 95,
            account_status: user.status,
            member_since: user.created_at,
            last_login: user.last_login,
            timezone: 'America/New_York',
            language: 'en',
            country: 'US'
        },
        
        // Affiliate specific information
        affiliate_info: {
            affiliate_id: `AFF${user.id.toString().padStart(6, '0')}`,
            tier: user.tier,
            tier_level: getTierLevel(user.tier),
            commission_multiplier: getTierMultiplier(user.tier),
            
            // Performance summary
            lifetime_stats: {
                total_earnings: 17292.79,
                total_clicks: 89456,
                total_conversions: 1234,
                total_sales_volume: 456789.12,
                avg_conversion_rate: 1.38,
                member_duration_months: 8,
                successful_referrals: 23
            },
            
            // Current month performance
            current_month: {
                earnings: 2456.78,
                clicks: 12456,
                conversions: 167,
                sales_volume: 78901.23,
                conversion_rate: 1.34,
                rank_this_month: 47,
                target_progress: 68.5
            }
        },
        
        // Personal details and preferences
        personal_details: {
            bio: "Experienced affiliate marketer specializing in tech and lifestyle products. Passionate about helping others discover amazing products while building sustainable income streams.",
            website: "https://johndemo-affiliate.com",
            social_profiles: {
                twitter: "@johndemo_aff",
                instagram: "@johndemo.affiliate",
                youtube: "John Demo Affiliate",
                linkedin: "john-demo-affiliate"
            },
            
            // Professional information
            occupation: "Digital Marketing Specialist",
            company: "Freelance",
            experience_level: "Expert",
            primary_niches: ["Technology", "Home & Garden", "Lifestyle"],
            marketing_channels: ["Social Media", "Email Marketing", "Content Marketing", "Paid Advertising"]
        },
        
        // Contact and address information
        contact_info: {
            primary_email: user.email,
            backup_email: null,
            primary_phone: user.phone,
            backup_phone: null,
            
            // Address for tax and payment purposes
            address: {
                street_1: "123 Affiliate Street",
                street_2: "Apt 4B",
                city: "New York",
                state: "NY",
                postal_code: "10001",
                country: "United States",
                country_code: "US"
            }
        },
        
        // Tax and legal information
        tax_info: {
            tax_id: "***-**-4567", // Masked
            tax_country: "US",
            tax_status: "Individual",
            w9_submitted: true,
            backup_withholding: false,
            tax_form_required: "1099-NEC"
        },
        
        // Account verification status
        verification_status: {
            identity_verified: true,
            address_verified: true,
            phone_verified: true,
            email_verified: true,
            tax_info_verified: true,
            kyc_status: "approved",
            kyc_level: "full",
            verification_date: "2024-01-15T10:30:00Z"
        }
    };

    // Add formatted fields
    const profileWithFormatted = {
        ...profile,
        basic_info: {
            ...profile.basic_info,
            member_since_formatted: formatDate(profile.basic_info.member_since),
            last_login_formatted: formatDate(profile.basic_info.last_login)
        },
        affiliate_info: {
            ...profile.affiliate_info,
            lifetime_stats: {
                ...profile.affiliate_info.lifetime_stats,
                total_earnings_formatted: formatCurrency(profile.affiliate_info.lifetime_stats.total_earnings),
                total_sales_volume_formatted: formatCurrency(profile.affiliate_info.lifetime_stats.total_sales_volume)
            },
            current_month: {
                ...profile.affiliate_info.current_month,
                earnings_formatted: formatCurrency(profile.affiliate_info.current_month.earnings),
                sales_volume_formatted: formatCurrency(profile.affiliate_info.current_month.sales_volume)
            }
        },
        verification_status: {
            ...profile.verification_status,
            verification_date_formatted: formatDate(profile.verification_status.verification_date)
        }
    };

    return res.json({
        success: true,
        data: profileWithFormatted
    });
}

// Get account settings
function getAccountSettings(req, res, user) {
    const accountSettings = {
        general: {
            username: user.username,
            email: user.email,
            timezone: 'America/New_York',
            language: 'en',
            currency: 'USD',
            date_format: 'MM/DD/YYYY',
            time_format: '12_hour'
        },
        
        privacy: {
            profile_visibility: 'public', // public, private, affiliates_only
            show_earnings_publicly: false,
            show_statistics_publicly: true,
            allow_contact_from_others: true,
            include_in_leaderboards: true,
            marketing_emails: true
        },
        
        affiliate_settings: {
            default_link_category: 'General',
            auto_generate_links: true,
            link_cloaking_enabled: true,
            tracking_parameters: {
                utm_source: 'affiliate_boss',
                utm_medium: 'affiliate',
                custom_parameters: []
            },
            
            // Performance targets
            monthly_earnings_goal: 5000.00,
            monthly_clicks_goal: 20000,
            monthly_conversions_goal: 200,
            
            // Link management preferences
            link_expiration_days: 0, // 0 = never expire
            redirect_type: '301', // 301, 302
            click_fraud_protection: true,
            geo_blocking_enabled: false,
            device_blocking_enabled: false
        },
        
        payout_settings: {
            minimum_payout: 50.00,
            auto_payout_enabled: true,
            auto_payout_frequency: 'weekly',
            auto_payout_day: 'friday',
            default_payout_method: 'stripe',
            currency_preference: 'USD',
            
            // Tax settings
            tax_withholding: false,
            tax_rate: 0.00
        },
        
        api_access: {
            api_access_enabled: true,
            rate_limit_tier: 'premium',
            allowed_ip_addresses: [],
            webhook_endpoints: [
                {
                    id: 1,
                    name: 'Conversion Tracking',
                    url: 'https://my-site.com/webhooks/conversions',
                    events: ['conversion.created', 'payout.processed'],
                    status: 'active'
                }
            ]
        }
    };

    // Add formatted values
    const settingsWithFormatted = {
        ...accountSettings,
        affiliate_settings: {
            ...accountSettings.affiliate_settings,
            monthly_earnings_goal_formatted: formatCurrency(accountSettings.affiliate_settings.monthly_earnings_goal)
        },
        payout_settings: {
            ...accountSettings.payout_settings,
            minimum_payout_formatted: formatCurrency(accountSettings.payout_settings.minimum_payout)
        }
    };

    return res.json({
        success: true,
        data: settingsWithFormatted
    });
}

// Get notification settings
function getNotificationSettings(req, res, user) {
    const notificationSettings = {
        email_notifications: {
            // Marketing and updates
            marketing_emails: true,
            product_updates: true,
            newsletter: true,
            promotional_offers: false,
            
            // Account and security
            login_alerts: true,
            security_updates: true,
            password_changes: true,
            profile_changes: false,
            
            // Affiliate activity
            new_conversions: true,
            payout_notifications: true,
            performance_reports: true,
            weekly_summary: true,
            monthly_report: true,
            
            // System notifications
            maintenance_updates: true,
            feature_announcements: true,
            policy_changes: true
        },
        
        sms_notifications: {
            // High priority only
            security_alerts: true,
            payout_confirmations: true,
            high_value_conversions: true, // Over $500
            account_issues: true,
            
            // Optional SMS
            daily_summary: false,
            weekly_performance: false,
            marketing_messages: false
        },
        
        push_notifications: {
            // Real-time alerts
            new_conversions: true,
            click_milestones: true,
            earnings_milestones: true,
            tier_upgrades: true,
            
            // Performance alerts
            performance_drops: true,
            conversion_spikes: true,
            traffic_anomalies: true
        },
        
        in_app_notifications: {
            show_onboarding_tips: false,
            show_feature_highlights: true,
            show_performance_insights: true,
            show_optimization_suggestions: true
        },
        
        notification_schedule: {
            quiet_hours: {
                enabled: true,
                start_time: '22:00',
                end_time: '08:00',
                timezone: 'America/New_York'
            },
            
            frequency_limits: {
                max_emails_per_day: 5,
                max_sms_per_day: 2,
                max_push_per_hour: 10
            }
        }
    };

    return res.json({
        success: true,
        data: notificationSettings
    });
}

// Get security settings
function getSecuritySettings(req, res, user) {
    const securitySettings = {
        authentication: {
            password_last_changed: '2024-01-15T10:30:00Z',
            password_expires_at: null, // null = never expires
            failed_login_attempts: 0,
            last_failed_login: null,
            
            // Two-factor authentication
            two_factor_enabled: true,
            two_factor_method: 'sms', // sms, app, email
            backup_codes_generated: true,
            backup_codes_used: 2,
            
            // SMS verification
            phone_verified: true,
            phone_verification_date: '2024-01-15T10:30:00Z',
            
            // Recovery options
            recovery_email: 'john.recovery@email.com',
            security_questions_set: true
        },
        
        session_management: {
            current_sessions: [
                {
                    id: 'sess_current',
                    device: 'Desktop - Chrome 120',
                    ip_address: '192.168.1.100',
                    location: 'New York, NY, US',
                    last_activity: new Date().toISOString(),
                    is_current: true
                },
                {
                    id: 'sess_mobile',
                    device: 'Mobile - Safari iOS',
                    ip_address: '192.168.1.101',
                    location: 'New York, NY, US',
                    last_activity: '2024-01-29T14:22:00Z',
                    is_current: false
                }
            ],
            
            session_timeout: 24, // hours
            remember_me_duration: 30, // days
            concurrent_sessions_limit: 5
        },
        
        api_security: {
            api_keys_count: 2,
            last_api_call: new Date().toISOString(),
            ip_whitelist_enabled: false,
            allowed_ips: [],
            rate_limiting_enabled: true,
            
            webhook_security: {
                signature_verification: true,
                ip_filtering: false,
                https_required: true
            }
        },
        
        privacy_settings: {
            data_processing_consent: true,
            marketing_consent: true,
            analytics_consent: true,
            
            // Data retention
            login_history_retention: 90, // days
            activity_log_retention: 365, // days
            
            // Account deletion
            data_export_available: true,
            account_deletion_available: true
        },
        
        security_alerts: [
            {
                id: 1,
                type: 'login',
                message: 'New login from Chrome on Desktop',
                timestamp: new Date().toISOString(),
                resolved: true
            },
            {
                id: 2,
                type: 'password_change',
                message: 'Password successfully updated',
                timestamp: '2024-01-15T10:30:00Z',
                resolved: true
            }
        ]
    };

    // Add formatted dates
    const securityWithFormatted = {
        ...securitySettings,
        authentication: {
            ...securitySettings.authentication,
            password_last_changed_formatted: formatDate(securitySettings.authentication.password_last_changed),
            phone_verification_date_formatted: formatDate(securitySettings.authentication.phone_verification_date)
        },
        session_management: {
            ...securitySettings.session_management,
            current_sessions: securitySettings.session_management.current_sessions.map(session => ({
                ...session,
                last_activity_formatted: formatDate(session.last_activity)
            }))
        },
        security_alerts: securitySettings.security_alerts.map(alert => ({
            ...alert,
            timestamp_formatted: formatDate(alert.timestamp)
        }))
    };

    return res.json({
        success: true,
        data: securityWithFormatted
    });
}

// Send OTP code for verification
function sendOTPCode(req, res, user) {
    const { purpose, phone_number } = req.body || {};
    
    // Valid purposes for OTP
    const validPurposes = ['phone_verification', 'password_reset', 'payout_confirmation', '2fa_setup', 'security_verification'];
    
    if (!purpose || !validPurposes.includes(purpose)) {
        return res.status(400).json({
            error: 'Valid purpose required',
            valid_purposes: validPurposes
        });
    }

    // Use existing phone number or provided one
    const targetPhone = phone_number || user.phone;
    
    if (!targetPhone) {
        return res.status(400).json({
            error: 'Phone number required',
            details: 'Please provide a phone number or update your profile with one'
        });
    }

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // In real app:
    // 1. Store OTP in database with expiration
    // 2. Send SMS using Twilio/AWS SNS
    // 3. Rate limit OTP requests
    // 4. Log attempt for security

    // Mock SMS sending
    console.log(`SMS OTP: ${otpCode} sent to ${targetPhone} for ${purpose}`);

    // Create OTP session
    const otpSession = {
        otp_id: `otp_${Date.now()}`,
        purpose: purpose,
        phone_number: targetPhone,
        expires_at: expiresAt.toISOString(),
        attempts_remaining: 3,
        created_at: new Date().toISOString()
    };

    return res.json({
        success: true,
        data: {
            ...otpSession,
            expires_at_formatted: formatDate(otpSession.expires_at),
            masked_phone: targetPhone.replace(/(\d{3})\d{3}(\d{4})/, '$1***$2') // Mask middle digits
        },
        message: `OTP code sent to ${targetPhone.replace(/(\d{3})\d{3}(\d{4})/, '$1***$2')}. Code expires in 10 minutes.`,
        // In demo mode, return the code for testing
        demo_otp_code: otpCode
    });
}

// Verify OTP code
function verifyOTPCode(req, res, user) {
    const { otp_code, otp_id, purpose } = req.body || {};
    
    if (!otp_code || !otp_id || !purpose) {
        return res.status(400).json({
            error: 'OTP code, session ID, and purpose are required'
        });
    }

    // In demo mode, accept any 6-digit code
    if (!/^\d{6}$/.test(otp_code)) {
        return res.status(400).json({
            error: 'Invalid OTP format',
            details: 'OTP must be 6 digits'
        });
    }

    // Mock verification - in real app, verify against stored OTP
    const isValidOTP = true; // In demo, always valid
    const otpExpired = false; // In demo, never expired

    if (otpExpired) {
        return res.status(400).json({
            error: 'OTP expired',
            details: 'Please request a new OTP code'
        });
    }

    if (!isValidOTP) {
        return res.status(400).json({
            error: 'Invalid OTP code',
            details: 'Please check the code and try again'
        });
    }

    // Process based on purpose
    let result = { verified: true };

    switch (purpose) {
        case 'phone_verification':
            result.phone_verified = true;
            result.message = 'Phone number verified successfully';
            break;
            
        case 'password_reset':
            result.reset_token = `reset_${Date.now()}`;
            result.message = 'OTP verified. You can now reset your password.';
            break;
            
        case 'payout_confirmation':
            result.payout_authorized = true;
            result.message = 'Payout confirmed and authorized';
            break;
            
        case '2fa_setup':
            result.two_factor_setup = true;
            result.message = 'Two-factor authentication setup verified';
            break;
            
        default:
            result.message = 'OTP verified successfully';
    }

    return res.json({
        success: true,
        data: {
            otp_id: otp_id,
            purpose: purpose,
            verified_at: new Date().toISOString(),
            ...result
        }
    });
}

// Generate new API key
function generateApiKey(req, res, user) {
    const { name, permissions = [], expires_in_days = 365 } = req.body || {};
    
    if (!name || name.trim().length === 0) {
        return res.status(400).json({
            error: 'API key name is required'
        });
    }

    // Generate secure API key
    const apiKey = `aboss_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000);

    const newApiKey = {
        id: Math.floor(Math.random() * 1000) + 100,
        name: name.trim(),
        key: apiKey,
        permissions: permissions.length > 0 ? permissions : ['read:links', 'read:analytics', 'read:commissions'],
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        last_used_at: null,
        usage_count: 0,
        status: 'active'
    };

    return res.status(201).json({
        success: true,
        data: {
            ...newApiKey,
            created_at_formatted: formatDate(newApiKey.created_at),
            expires_at_formatted: formatDate(newApiKey.expires_at)
        },
        message: 'API key generated successfully. Store it securely - it won\'t be shown again.',
        warning: 'This is the only time the full API key will be displayed. Please save it now.'
    });
}

// Get user's API keys
function getApiKeys(req, res, user) {
    // Mock API keys data
    const apiKeys = [
        {
            id: 1,
            name: 'Website Integration',
            key_preview: 'aboss_1706***************45f2a',
            permissions: ['read:links', 'read:analytics', 'create:links'],
            created_at: '2024-01-15T10:30:00Z',
            expires_at: '2025-01-15T10:30:00Z',
            last_used_at: new Date().toISOString(),
            usage_count: 1547,
            status: 'active'
        },
        {
            id: 2,
            name: 'Mobile App API',
            key_preview: 'aboss_1706***************8b3c',
            permissions: ['read:links', 'read:commissions'],
            created_at: '2024-01-20T14:22:00Z',
            expires_at: '2025-01-20T14:22:00Z',
            last_used_at: '2024-01-28T09:15:00Z',
            usage_count: 234,
            status: 'active'
        }
    ];

    const apiKeysWithFormatted = apiKeys.map(key => ({
        ...key,
        created_at_formatted: formatDate(key.created_at),
        expires_at_formatted: formatDate(key.expires_at),
        last_used_at_formatted: key.last_used_at ? formatDate(key.last_used_at) : 'Never used'
    }));

    return res.json({
        success: true,
        data: apiKeysWithFormatted,
        summary: {
            total_keys: apiKeys.length,
            active_keys: apiKeys.filter(k => k.status === 'active').length,
            total_usage: apiKeys.reduce((sum, k) => sum + k.usage_count, 0)
        }
    });
}

// Helper functions
function getTierLevel(tier) {
    const tiers = { bronze: 1, silver: 2, gold: 3, premium: 4, platinum: 5, diamond: 6 };
    return tiers[tier] || 1;
}

function getTierMultiplier(tier) {
    const multipliers = { bronze: 1.0, silver: 1.1, gold: 1.15, premium: 1.2, platinum: 1.3, diamond: 1.5 };
    return multipliers[tier] || 1.0;
}

// Other functions (simplified for now)
function getUserPreferences(req, res, user) {
    return res.json({
        success: true,
        message: 'User preferences - dashboard layout, default views, etc.'
    });
}

function getAccountActivity(req, res, user) {
    return res.json({
        success: true,
        message: 'Account activity log - logins, changes, API calls, etc.'
    });
}

function enableTwoFactor(req, res, user) {
    return res.json({
        success: true,
        message: 'Two-factor authentication enabled'
    });
}

function disableTwoFactor(req, res, user) {
    return res.json({
        success: true,
        message: 'Two-factor authentication disabled'
    });
}

function changePassword(req, res, user) {
    return res.json({
        success: true,
        message: 'Password changed successfully'
    });
}

function updateProfile(req, res, user) {
    return res.json({
        success: true,
        message: 'Profile updated successfully'
    });
}

function updateAccountSettings(req, res, user) {
    return res.json({
        success: true,
        message: 'Account settings updated successfully'
    });
}

function updateNotificationSettings(req, res, user) {
    return res.json({
        success: true,
        message: 'Notification settings updated successfully'
    });
}

function updateUserPreferences(req, res, user) {
    return res.json({
        success: true,
        message: 'User preferences updated successfully'
    });
}

function revokeApiKey(req, res, user, keyId) {
    return res.json({
        success: true,
        message: `API key ${keyId} revoked successfully`
    });
}