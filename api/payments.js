const { handleCors, checkAuth, formatCurrency, formatDate } = require('./utils/helpers');

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    
    const user = checkAuth(req, res);
    if (!user) return;

    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    const path = pathname.replace('/api/payments', '');

    switch (req.method) {
        case 'GET':
            if (path === '/methods') return getPaymentMethods(req, res, user);
            if (path === '/payouts') return getPayoutHistory(req, res, user);
            if (path === '/balance') return getAccountBalance(req, res, user);
            if (path === '/settings') return getPaymentSettings(req, res, user);
            if (path.match(/^\/payouts\/\d+$/)) return getPayoutDetails(req, res, user, path.split('/')[2]);
            break;
            
        case 'POST':
            if (path === '/methods/add') return addPaymentMethod(req, res, user);
            if (path === '/payout/request') return requestPayout(req, res, user);
            if (path === '/payout/instant') return requestInstantPayout(req, res, user);
            if (path === '/webhook/stripe') return handleStripeWebhook(req, res, user);
            if (path === '/webhook/paypal') return handlePayPalWebhook(req, res, user);
            break;
            
        case 'PUT':
            if (path === '/settings') return updatePaymentSettings(req, res, user);
            if (path.match(/^\/methods\/\d+$/)) return updatePaymentMethod(req, res, user, path.split('/')[2]);
            break;
            
        case 'DELETE':
            if (path.match(/^\/methods\/\d+$/)) return removePaymentMethod(req, res, user, path.split('/')[2]);
            break;
    }
    
    return res.status(404).json({ error: 'Payment API endpoint not found' });
};

// Get user's payment methods
function getPaymentMethods(req, res, user) {
    // Demo payment methods - in real app this would be encrypted in database
    const paymentMethods = [
        {
            id: 1,
            type: 'stripe',
            provider: 'Stripe',
            name: 'Chase Bank Account',
            details: {
                account_type: 'checking',
                bank_name: 'Chase Bank',
                last_four: '4567',
                routing_number_last_four: '1234'
            },
            is_default: true,
            status: 'verified',
            added_date: '2024-01-15T10:30:00Z',
            last_used: '2024-01-30T00:00:00Z',
            verification_status: 'verified',
            capabilities: {
                standard_payout: true,
                instant_payout: true,
                international: false
            },
            fees: {
                standard_payout: { percentage: 0, fixed: 0 },
                instant_payout: { percentage: 1.5, fixed: 0 }
            }
        },
        {
            id: 2,
            type: 'paypal',
            provider: 'PayPal',
            name: 'PayPal Account',
            details: {
                email: 'john.demo@affiliateboss.com',
                account_status: 'verified',
                country: 'US'
            },
            is_default: false,
            status: 'verified',
            added_date: '2024-01-20T14:22:00Z',
            last_used: '2024-01-28T12:15:00Z',
            verification_status: 'verified',
            capabilities: {
                standard_payout: true,
                instant_payout: true,
                international: true
            },
            fees: {
                standard_payout: { percentage: 2.9, fixed: 0.30 },
                instant_payout: { percentage: 2.9, fixed: 0.30 }
            }
        },
        {
            id: 3,
            type: 'wire',
            provider: 'Wire Transfer',
            name: 'International Wire',
            details: {
                bank_name: 'Wells Fargo',
                swift_code: 'WFBIUS6S',
                account_type: 'business_checking',
                last_four: '8901'
            },
            is_default: false,
            status: 'pending_verification',
            added_date: '2024-01-29T16:45:00Z',
            last_used: null,
            verification_status: 'pending',
            capabilities: {
                standard_payout: true,
                instant_payout: false,
                international: true
            },
            fees: {
                standard_payout: { percentage: 0, fixed: 25.00 },
                instant_payout: null
            }
        }
    ];

    // Add formatted fields
    const methodsWithFormatted = paymentMethods.map(method => ({
        ...method,
        added_date_formatted: formatDate(method.added_date),
        last_used_formatted: method.last_used ? formatDate(method.last_used) : 'Never used',
        fees: {
            ...method.fees,
            standard_payout: method.fees.standard_payout ? {
                ...method.fees.standard_payout,
                description: method.fees.standard_payout.percentage > 0 || method.fees.standard_payout.fixed > 0 ?
                    `${method.fees.standard_payout.percentage}% + ${formatCurrency(method.fees.standard_payout.fixed)}` :
                    'Free'
            } : null,
            instant_payout: method.fees.instant_payout ? {
                ...method.fees.instant_payout,
                description: `${method.fees.instant_payout.percentage}% + ${formatCurrency(method.fees.instant_payout.fixed)}`
            } : null
        }
    }));

    return res.json({
        success: true,
        data: methodsWithFormatted,
        summary: {
            total_methods: paymentMethods.length,
            verified_methods: paymentMethods.filter(m => m.status === 'verified').length,
            default_method: paymentMethods.find(m => m.is_default)?.provider || null
        }
    });
}

// Get payout history
function getPayoutHistory(req, res, user) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const status = url.searchParams.get('status') || 'all';
    const method = url.searchParams.get('method') || 'all';
    
    // Comprehensive payout history
    const allPayouts = [
        {
            id: 'po_2024013001',
            amount: 2456.78,
            net_amount: 2385.45,
            currency: 'USD',
            method: 'stripe',
            method_name: 'Chase Bank Account',
            status: 'completed',
            requested_date: '2024-01-30T00:00:00Z',
            processed_date: '2024-01-30T14:22:00Z',
            completed_date: '2024-01-31T09:15:00Z',
            
            // Fee breakdown
            fees: {
                processing_fee: 0,
                platform_fee: 71.33, // 2.9% platform fee
                total_fees: 71.33
            },
            
            // Commission details
            commission_count: 12,
            commission_period: {
                from: '2024-01-01T00:00:00Z',
                to: '2024-01-31T23:59:59Z'
            },
            
            // Banking details (masked)
            destination: {
                type: 'bank_account',
                last_four: '4567',
                bank_name: 'Chase Bank'
            },
            
            // Transaction tracking
            external_id: 'stripe_po_3OqR4vLkdIwHu7j123456789',
            failure_reason: null,
            notes: 'Monthly payout for January 2024'
        },
        {
            id: 'po_2024012901',
            amount: 1808.23,
            net_amount: 1755.67,
            currency: 'USD',
            method: 'paypal',
            method_name: 'PayPal Account',
            status: 'completed',
            requested_date: '2024-01-29T18:30:00Z',
            processed_date: '2024-01-29T20:15:00Z',
            completed_date: '2024-01-29T20:45:00Z',
            
            fees: {
                processing_fee: 52.56, // PayPal 2.9% + $0.30
                platform_fee: 0,
                total_fees: 52.56
            },
            
            commission_count: 5,
            commission_period: {
                from: '2024-01-28T00:00:00Z',
                to: '2024-01-29T18:30:00Z'
            },
            
            destination: {
                type: 'paypal_account',
                email: 'john.demo@affiliateboss.com'
            },
            
            external_id: 'paypal_batch_PAYOUT_2024012901',
            failure_reason: null,
            notes: 'Weekly instant payout'
        },
        {
            id: 'po_2024012201',
            amount: 892.45,
            net_amount: 867.45,
            currency: 'USD',
            method: 'stripe',
            method_name: 'Chase Bank Account',
            status: 'failed',
            requested_date: '2024-01-22T16:20:00Z',
            processed_date: '2024-01-22T18:45:00Z',
            completed_date: null,
            
            fees: {
                processing_fee: 0,
                platform_fee: 25.00, // Attempted fee
                total_fees: 25.00
            },
            
            commission_count: 3,
            commission_period: {
                from: '2024-01-20T00:00:00Z',
                to: '2024-01-22T16:20:00Z'
            },
            
            destination: {
                type: 'bank_account',
                last_four: '4567',
                bank_name: 'Chase Bank'
            },
            
            external_id: null,
            failure_reason: 'Bank account information outdated',
            notes: 'Failed - bank rejected transfer'
        },
        {
            id: 'po_2024011501',
            amount: 3245.67,
            net_amount: 3151.23,
            currency: 'USD',
            method: 'stripe',
            method_name: 'Chase Bank Account',
            status: 'pending',
            requested_date: '2024-01-15T10:30:00Z',
            processed_date: null,
            completed_date: null,
            
            fees: {
                processing_fee: 0,
                platform_fee: 94.44, // Estimated platform fee
                total_fees: 94.44
            },
            
            commission_count: 18,
            commission_period: {
                from: '2024-01-01T00:00:00Z',
                to: '2024-01-15T10:30:00Z'
            },
            
            destination: {
                type: 'bank_account',
                last_four: '4567',
                bank_name: 'Chase Bank'
            },
            
            external_id: 'stripe_po_pending_123456789',
            failure_reason: null,
            notes: 'Processing - standard 3-5 business days'
        }
    ];

    // Apply filters
    let filteredPayouts = allPayouts;
    
    if (status !== 'all') {
        filteredPayouts = filteredPayouts.filter(payout => payout.status === status);
    }
    
    if (method !== 'all') {
        filteredPayouts = filteredPayouts.filter(payout => payout.method === method);
    }

    // Pagination
    const totalCount = filteredPayouts.length;
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;
    const paginatedPayouts = filteredPayouts.slice(offset, offset + limit);

    // Add formatted fields
    const payoutsWithFormatted = paginatedPayouts.map(payout => ({
        ...payout,
        amount_formatted: formatCurrency(payout.amount),
        net_amount_formatted: formatCurrency(payout.net_amount),
        fees: {
            ...payout.fees,
            processing_fee_formatted: formatCurrency(payout.fees.processing_fee),
            platform_fee_formatted: formatCurrency(payout.fees.platform_fee),
            total_fees_formatted: formatCurrency(payout.fees.total_fees)
        },
        requested_date_formatted: formatDate(payout.requested_date),
        processed_date_formatted: payout.processed_date ? formatDate(payout.processed_date) : 'Not processed',
        completed_date_formatted: payout.completed_date ? formatDate(payout.completed_date) : 'Not completed'
    }));

    // Calculate summary stats
    const summary = {
        total_payouts: totalCount,
        total_amount_paid: filteredPayouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
        total_fees_paid: filteredPayouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.fees.total_fees, 0),
        pending_amount: filteredPayouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
        failed_amount: filteredPayouts.filter(p => p.status === 'failed').reduce((sum, p) => sum + p.amount, 0)
    };

    return res.json({
        success: true,
        data: payoutsWithFormatted,
        pagination: {
            page,
            limit,
            total_count: totalCount,
            total_pages: totalPages,
            has_next: page < totalPages,
            has_prev: page > 1
        },
        summary: {
            ...summary,
            total_amount_paid_formatted: formatCurrency(summary.total_amount_paid),
            total_fees_paid_formatted: formatCurrency(summary.total_fees_paid),
            pending_amount_formatted: formatCurrency(summary.pending_amount),
            failed_amount_formatted: formatCurrency(summary.failed_amount)
        }
    });
}

// Get account balance
function getAccountBalance(req, res, user) {
    const balance = {
        current_balance: 248.33,
        pending_balance: 162.00, // Commissions waiting for confirmation
        available_for_payout: 86.33, // Confirmed but not yet paid out
        
        // Breakdown by status
        confirmed_commissions: 86.33,
        pending_confirmation: 162.00,
        processing_payouts: 0,
        
        // Next payout info
        next_payout: {
            scheduled_date: '2024-02-05T00:00:00Z',
            estimated_amount: 248.33,
            method: 'stripe',
            method_name: 'Chase Bank Account'
        },
        
        // Balance history (last 7 days)
        balance_history: [
            { date: '2024-01-23', balance: 156.78 },
            { date: '2024-01-24', balance: 234.56 },
            { date: '2024-01-25', balance: 312.45 },
            { date: '2024-01-26', balance: 198.32 },
            { date: '2024-01-27', balance: 287.65 },
            { date: '2024-01-28', balance: 165.43 },
            { date: '2024-01-29', balance: 248.33 }
        ],
        
        // Thresholds and limits
        minimum_payout: 50.00,
        maximum_payout: 10000.00,
        daily_payout_limit: 5000.00,
        monthly_payout_limit: 50000.00,
        
        // Usage this month
        payouts_this_month: {
            count: 2,
            total_amount: 4264.01,
            remaining_limit: 45735.99
        }
    };

    // Add formatted values
    const balanceWithFormatted = {
        ...balance,
        current_balance_formatted: formatCurrency(balance.current_balance),
        pending_balance_formatted: formatCurrency(balance.pending_balance),
        available_for_payout_formatted: formatCurrency(balance.available_for_payout),
        confirmed_commissions_formatted: formatCurrency(balance.confirmed_commissions),
        pending_confirmation_formatted: formatCurrency(balance.pending_confirmation),
        
        next_payout: {
            ...balance.next_payout,
            estimated_amount_formatted: formatCurrency(balance.next_payout.estimated_amount),
            scheduled_date_formatted: formatDate(balance.next_payout.scheduled_date)
        },
        
        balance_history: balance.balance_history.map(day => ({
            ...day,
            balance_formatted: formatCurrency(day.balance)
        })),
        
        minimum_payout_formatted: formatCurrency(balance.minimum_payout),
        maximum_payout_formatted: formatCurrency(balance.maximum_payout),
        daily_payout_limit_formatted: formatCurrency(balance.daily_payout_limit),
        monthly_payout_limit_formatted: formatCurrency(balance.monthly_payout_limit),
        
        payouts_this_month: {
            ...balance.payouts_this_month,
            total_amount_formatted: formatCurrency(balance.payouts_this_month.total_amount),
            remaining_limit_formatted: formatCurrency(balance.payouts_this_month.remaining_limit)
        }
    };

    return res.json({
        success: true,
        data: balanceWithFormatted,
        last_updated: new Date().toISOString()
    });
}

// Get payment settings
function getPaymentSettings(req, res, user) {
    const settings = {
        auto_payout: {
            enabled: true,
            frequency: 'weekly', // weekly, monthly, threshold
            day_of_week: 'friday', // for weekly
            day_of_month: 1, // for monthly
            threshold_amount: 100.00, // for threshold
            method_id: 1
        },
        
        payout_preferences: {
            minimum_amount: 50.00,
            preferred_method: 'stripe',
            instant_payout_enabled: true,
            notifications: {
                payout_requested: true,
                payout_completed: true,
                payout_failed: true,
                balance_threshold: true,
                balance_threshold_amount: 500.00
            }
        },
        
        tax_settings: {
            tax_country: 'US',
            tax_id: '***-**-4567', // Masked
            tax_form: 'W9',
            backup_withholding: false,
            foreign_tax_exempt: false
        },
        
        compliance: {
            kyc_status: 'verified',
            kyc_verified_date: '2024-01-15T10:30:00Z',
            aml_status: 'cleared',
            sanctions_check: 'passed',
            pep_status: 'not_applicable'
        },
        
        security: {
            two_factor_required: true,
            payout_confirmation_required: true,
            ip_whitelist_enabled: false,
            allowed_ips: []
        }
    };

    // Add formatted values
    const settingsWithFormatted = {
        ...settings,
        auto_payout: {
            ...settings.auto_payout,
            threshold_amount_formatted: formatCurrency(settings.auto_payout.threshold_amount)
        },
        payout_preferences: {
            ...settings.payout_preferences,
            minimum_amount_formatted: formatCurrency(settings.payout_preferences.minimum_amount),
            notifications: {
                ...settings.payout_preferences.notifications,
                balance_threshold_amount_formatted: formatCurrency(settings.payout_preferences.notifications.balance_threshold_amount)
            }
        },
        compliance: {
            ...settings.compliance,
            kyc_verified_date_formatted: formatDate(settings.compliance.kyc_verified_date)
        }
    };

    return res.json({
        success: true,
        data: settingsWithFormatted
    });
}

// Add payment method
function addPaymentMethod(req, res, user) {
    const { type, details, set_as_default = false } = req.body || {};
    
    if (!type || !details) {
        return res.status(400).json({
            error: 'Payment method type and details required',
            supported_types: ['stripe', 'paypal', 'wire', 'check']
        });
    }

    // Validate based on type
    let validationErrors = [];
    
    if (type === 'stripe' && (!details.account_number || !details.routing_number)) {
        validationErrors.push('Bank account and routing number required for Stripe');
    }
    
    if (type === 'paypal' && !details.email) {
        validationErrors.push('PayPal email address required');
    }
    
    if (type === 'wire' && (!details.swift_code || !details.account_number)) {
        validationErrors.push('SWIFT code and account number required for wire transfer');
    }
    
    if (validationErrors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            details: validationErrors
        });
    }

    // Create new payment method
    const newMethod = {
        id: Math.floor(Math.random() * 1000) + 100,
        type: type,
        provider: type === 'stripe' ? 'Stripe' : type === 'paypal' ? 'PayPal' : 'Wire Transfer',
        name: details.name || `${type} method`,
        details: {
            ...details,
            // Mask sensitive info in response
            account_number: details.account_number ? `****${details.account_number.slice(-4)}` : undefined,
            routing_number: details.routing_number ? `****${details.routing_number.slice(-4)}` : undefined
        },
        is_default: set_as_default,
        status: 'pending_verification',
        added_date: new Date().toISOString(),
        verification_status: 'pending'
    };

    // In real app:
    // 1. Encrypt and store payment details securely
    // 2. Initiate verification process with payment provider
    // 3. Send micro-deposits for bank verification
    // 4. Update user's default method if requested

    return res.status(201).json({
        success: true,
        data: newMethod,
        message: 'Payment method added successfully. Verification process initiated.',
        next_steps: [
            'Verification process started with payment provider',
            'Check your account for micro-deposits (for bank accounts)',
            'Verify your email (for PayPal)',
            'Method will be available after successful verification'
        ]
    });
}

// Request payout
function requestPayout(req, res, user) {
    const { 
        amount, 
        method_id, 
        payout_type = 'standard', // standard, instant
        notes = '' 
    } = req.body || {};
    
    // Get current balance (in real app, from database)
    const availableBalance = 248.33;
    const minimumPayout = 50.00;
    
    // Validations
    if (!amount || amount <= 0) {
        return res.status(400).json({
            error: 'Valid payout amount required'
        });
    }
    
    if (amount < minimumPayout) {
        return res.status(400).json({
            error: `Minimum payout amount is ${formatCurrency(minimumPayout)}`
        });
    }
    
    if (amount > availableBalance) {
        return res.status(400).json({
            error: `Insufficient balance. Available: ${formatCurrency(availableBalance)}`
        });
    }
    
    if (!method_id) {
        return res.status(400).json({
            error: 'Payment method ID required'
        });
    }

    // Calculate fees based on method and type
    let processingFee = 0;
    let platformFee = amount * 0.029; // 2.9% platform fee
    
    if (payout_type === 'instant') {
        processingFee = amount * 0.015; // Additional 1.5% for instant
    }
    
    const totalFees = processingFee + platformFee;
    const netAmount = amount - totalFees;

    // Create payout request
    const payoutRequest = {
        id: `po_${Date.now()}`,
        user_id: user.id,
        amount: amount,
        net_amount: netAmount,
        currency: 'USD',
        method_id: method_id,
        method_name: 'Chase Bank Account', // From method lookup
        payout_type: payout_type,
        status: 'requested',
        
        fees: {
            processing_fee: processingFee,
            platform_fee: platformFee,
            total_fees: totalFees
        },
        
        requested_date: new Date().toISOString(),
        estimated_completion: payout_type === 'instant' ? 
            new Date(Date.now() + 60 * 60 * 1000).toISOString() : // 1 hour
            new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
        
        notes: notes.trim(),
        
        // Commission IDs included (in real app, get from database)
        commission_ids: [3, 4],
        commission_count: 2
    };

    // In real app:
    // 1. Create payout record in database
    // 2. Queue for processing
    // 3. Send to payment provider
    // 4. Update user balance
    // 5. Send confirmation email

    return res.status(201).json({
        success: true,
        data: {
            ...payoutRequest,
            amount_formatted: formatCurrency(payoutRequest.amount),
            net_amount_formatted: formatCurrency(payoutRequest.net_amount),
            total_fees_formatted: formatCurrency(payoutRequest.fees.total_fees),
            estimated_completion_formatted: formatDate(payoutRequest.estimated_completion)
        },
        message: `Payout request submitted successfully. ${payout_type === 'instant' ? 'Processing typically takes 1 hour.' : 'Processing typically takes 3-5 business days.'}`
    });
}

// Request instant payout (premium feature)
function requestInstantPayout(req, res, user) {
    // Check if user has instant payout privileges
    if (user.tier !== 'premium' && user.tier !== 'platinum' && user.tier !== 'diamond') {
        return res.status(403).json({
            error: 'Instant payouts are available for Premium tier and above',
            upgrade_info: {
                current_tier: user.tier,
                required_tier: 'premium',
                benefits: 'Upgrade to Premium for instant payouts, higher commission rates, and priority support'
            }
        });
    }

    // Forward to regular payout with instant type
    req.body.payout_type = 'instant';
    return requestPayout(req, res, user);
}

// Handle Stripe webhooks
function handleStripeWebhook(req, res, user) {
    const signature = req.headers['stripe-signature'];
    const payload = req.body;
    
    // In real app, verify webhook signature
    console.log('Received Stripe webhook:', payload);
    
    // Process different webhook events
    const eventType = payload.type || 'unknown';
    
    let response = {};
    
    switch (eventType) {
        case 'payout.paid':
            response = {
                processed: true,
                action: 'payout_completed',
                message: 'Payout completed successfully'
            };
            break;
            
        case 'payout.failed':
            response = {
                processed: true,
                action: 'payout_failed',
                message: 'Payout failed - will retry or notify user'
            };
            break;
            
        default:
            response = {
                processed: true,
                action: 'webhook_logged',
                message: 'Stripe webhook received and logged'
            };
    }

    return res.json({
        success: true,
        event_type: eventType,
        timestamp: new Date().toISOString(),
        ...response
    });
}

// Handle PayPal webhooks
function handlePayPalWebhook(req, res, user) {
    const payload = req.body;
    
    // In real app, verify webhook signature
    console.log('Received PayPal webhook:', payload);
    
    return res.json({
        success: true,
        message: 'PayPal webhook processed'
    });
}

// Other helper functions
function getPayoutDetails(req, res, user, payoutId) {
    return res.json({
        success: true,
        message: `Payout ${payoutId} details - full implementation in production`
    });
}

function updatePaymentSettings(req, res, user) {
    return res.json({
        success: true,
        message: 'Payment settings updated successfully'
    });
}

function updatePaymentMethod(req, res, user, methodId) {
    return res.json({
        success: true,
        message: `Payment method ${methodId} updated successfully`
    });
}

function removePaymentMethod(req, res, user, methodId) {
    return res.json({
        success: true,
        message: `Payment method ${methodId} removed successfully`
    });
}