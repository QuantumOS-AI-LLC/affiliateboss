// SMS OTP Verification API for Vercel
// Verify SMS OTP codes for authentication
// Bangladesh dev style - secure verification system

const { getDatabase, createErrorResponse, createSuccessResponse } = require('../../lib/database');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json(createErrorResponse('Method not allowed', 405));
  }

  try {
    const { phone, code, purpose = 'verification' } = req.body;

    if (!phone || !code) {
      return res.status(400).json(createErrorResponse('Phone and code required', 400));
    }

    const db = getDatabase();

    // Find valid OTP
    const otp = db.prepare(`
      SELECT * FROM otp_codes 
      WHERE phone = ? AND code = ? AND purpose = ? 
      AND used = 0 AND expires_at > datetime('now')
      AND attempts < max_attempts
      ORDER BY created_at DESC 
      LIMIT 1
    `).get(phone, code, purpose);

    if (!otp) {
      // Increment attempts for all matching phone/purpose combinations
      db.prepare(`
        UPDATE otp_codes 
        SET attempts = attempts + 1 
        WHERE phone = ? AND purpose = ? AND used = 0
      `).run(phone, purpose);

      return res.status(400).json(createErrorResponse('Invalid, expired, or already used OTP code', 400));
    }

    // Check if too many attempts
    if (otp.attempts >= otp.max_attempts - 1) {
      db.prepare(`
        UPDATE otp_codes 
        SET attempts = attempts + 1 
        WHERE id = ?
      `).run(otp.id);

      return res.status(400).json(createErrorResponse('Too many verification attempts. Please request a new code.', 400));
    }

    // Mark OTP as used
    db.prepare(`
      UPDATE otp_codes 
      SET used = 1, used_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(otp.id);

    // Update user phone verification if applicable
    if (purpose === 'verification') {
      const updateResult = db.prepare(`
        UPDATE users 
        SET phone_verified = 1, updated_at = CURRENT_TIMESTAMP
        WHERE phone = ?
      `).run(phone);

      if (updateResult.changes > 0) {
        console.log(`Phone ${phone} verified successfully`);
      }
    }

    // Handle different verification purposes
    let responseData = {
      verified: true,
      phone: phone,
      purpose: purpose,
      verified_at: new Date().toISOString()
    };

    if (purpose === 'verification') {
      responseData.message = 'Phone number verified successfully';
      responseData.phone_verified = true;
    } else if (purpose === 'password_reset') {
      responseData.message = 'Verification successful. You may now reset your password.';
      responseData.reset_token_valid = true;
    } else if (purpose === 'two_factor') {
      responseData.message = 'Two-factor authentication verified successfully';
      responseData.two_factor_verified = true;
    } else {
      responseData.message = 'Verification completed successfully';
    }

    // Clean up old/expired OTP codes for this phone number
    db.prepare(`
      DELETE FROM otp_codes 
      WHERE phone = ? AND (used = 1 OR expires_at < datetime('now') OR attempts >= max_attempts)
    `).run(phone);

    return res.status(200).json(createSuccessResponse(responseData, responseData.message));

  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json(createErrorResponse('Verification failed', 500, error.message));
  }
};