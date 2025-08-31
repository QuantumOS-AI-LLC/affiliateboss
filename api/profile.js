const { handleCors, checkAuth } = require('./utils/helpers');

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    
    // Check authentication
    const user = checkAuth(req, res);
    if (!user) return;

    if (req.method === 'GET') {
        return getUserProfile(req, res, user);
    } else if (req.method === 'PUT') {
        return updateUserProfile(req, res, user);
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
};

// Get user profile data
function getUserProfile(req, res, user) {
    // Add demo profile data to the user object
    const profileData = {
        ...user,
        total_links: 24,
        total_earnings: 2847.92,
        pending_earnings: 892.45,
        paid_earnings: 1955.47,
        conversion_rate: 2.44,
        average_commission: 15.75,
        payout_method: 'PayPal',
        payout_email: 'john.demo@example.com',
        address: {
            street: '123 Demo Street',
            city: 'San Francisco',
            state: 'CA',
            zip: '94105',
            country: 'USA'
        },
        preferences: {
            email_notifications: true,
            sms_notifications: false,
            marketing_emails: true
        }
    };
    
    res.status(200).json({
        success: true,
        data: profileData
    });
}

// Update user profile
function updateUserProfile(req, res, user) {
    const updates = req.body || {};
    
    // In real app, we'd validate and save updates to database
    
    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
            ...user,
            ...updates,
            updated_at: new Date().toISOString()
        }
    });
}