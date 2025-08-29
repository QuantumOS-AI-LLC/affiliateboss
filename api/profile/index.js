// User profile API
import { handleCORS, authenticateAPI } from '../_utils.js'

export default function handler(req, res) {
  if (handleCORS(req, res)) return

  // Authenticate user
  const user = authenticateAPI(req, res)
  if (!user) return

  if (req.method === 'GET') {
    return getProfile(req, res, user)
  } else if (req.method === 'PUT') {
    return updateProfile(req, res, user)
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

// Get user profile
function getProfile(req, res, user) {
  // Return user profile with additional demo data
  const profile = {
    ...user,
    total_links: 24,
    total_earnings: 2847.92,
    pending_earnings: 892.45,
    paid_earnings: 1955.47,
    conversion_rate: 2.44,
    average_commission: 15.75,
    payout_method: 'PayPal',
    payout_email: 'john.demo@example.com',
    tax_id: '***-**-1234',
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
  }
  
  return res.status(200).json({
    success: true,
    data: profile
  })
}

// Update user profile
function updateProfile(req, res, user) {
  const updates = req.body || {}
  
  // For demo mode, simulate successful update
  return res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      ...user,
      ...updates,
      updated_at: new Date().toISOString()
    }
  })
}