// SMS API for Vercel - Twilio Integration
// SMS notifications and OTP functionality
// Bangladesh dev style - reliable messaging system

const { getDatabase, authenticateUser, createErrorResponse, createSuccessResponse } = require('../../lib/database');

// Twilio client (initialize only if credentials available)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  } catch (error) {
    console.warn('Twilio not available:', error.message);
  }
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-API-Key,Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json(createErrorResponse('Method not allowed', 405));
  }

  try {
    // Get API key from headers or query
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    
    if (!apiKey) {
      return res.status(401).json(createErrorResponse('API key required', 401));
    }

    // Authenticate user
    const user = authenticateUser(apiKey);
    if (!user) {
      return res.status(401).json(createErrorResponse('Invalid API key', 401));
    }

    const { 
      type = 'otp', 
      phone, 
      message, 
      purpose = 'verification' 
    } = req.body;

    if (!phone) {
      return res.status(400).json(createErrorResponse('Phone number required', 400));
    }

    const db = getDatabase();

    // Handle different SMS types
    if (type === 'otp') {
      // Generate OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in database
      db.prepare(`
        INSERT INTO otp_codes (phone, code, purpose, expires_at)
        VALUES (?, ?, ?, ?)
      `).run(phone, code, purpose, expiresAt.toISOString());

      // Prepare SMS message
      const smsMessage = `Your Affiliate Boss verification code is: ${code}. Valid for 10 minutes. Do not share this code.`;

      let smsResult = null;
      let smsStatus = 'demo';

      // Send actual SMS if Twilio is configured
      if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
        try {
          smsResult = await twilioClient.messages.create({
            body: smsMessage,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone
          });
          smsStatus = 'sent';
        } catch (error) {
          console.error('Twilio SMS error:', error);
          smsStatus = 'failed';
        }
      }

      const responseData = {
        type: 'otp',
        purpose: purpose,
        phone: phone,
        expires_in: 600, // 10 minutes
        status: smsStatus
      };

      // In demo mode, include the code (remove in production)
      if (smsStatus === 'demo') {
        responseData.demo_code = code;
        responseData.message = 'Demo mode: OTP generated but not sent via SMS';
      } else if (smsStatus === 'sent') {
        responseData.message_sid = smsResult.sid;
        responseData.message = 'OTP sent successfully via SMS';
      } else {
        responseData.message = 'Failed to send SMS, but OTP is stored for demo';
        responseData.demo_code = code; // Fallback for demo
      }

      return res.status(200).json(createSuccessResponse(responseData, 'OTP processing completed'));

    } else if (type === 'notification') {
      // Send notification SMS
      if (!message) {
        return res.status(400).json(createErrorResponse('Message content required for notifications', 400));
      }

      let smsResult = null;
      let smsStatus = 'demo';

      // Send actual SMS if Twilio is configured
      if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
        try {
          const notificationMessage = `Affiliate Boss: ${message}`;
          
          smsResult = await twilioClient.messages.create({
            body: notificationMessage,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone
          });
          smsStatus = 'sent';
        } catch (error) {
          console.error('Twilio SMS error:', error);
          smsStatus = 'failed';
        }
      }

      // Log notification in database
      try {
        db.prepare(`
          INSERT INTO user_notifications (user_id, type, message, phone, status, sent_at)
          VALUES (?, 'sms', ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(user.id, message, phone, smsStatus);
      } catch (error) {
        // If notifications table doesn't exist, create it
        db.exec(`
          CREATE TABLE IF NOT EXISTS user_notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            message TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            status TEXT DEFAULT 'pending',
            sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);
        
        db.prepare(`
          INSERT INTO user_notifications (user_id, type, message, phone, status, sent_at)
          VALUES (?, 'sms', ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(user.id, message, phone, smsStatus);
      }

      const responseData = {
        type: 'notification',
        phone: phone,
        message: message,
        status: smsStatus
      };

      if (smsStatus === 'sent' && smsResult) {
        responseData.message_sid = smsResult.sid;
        responseData.message = 'Notification sent successfully via SMS';
      } else if (smsStatus === 'demo') {
        responseData.message = 'Demo mode: Notification logged but not sent via SMS';
      } else {
        responseData.message = 'Failed to send SMS notification';
      }

      return res.status(200).json(createSuccessResponse(responseData, 'Notification processing completed'));

    } else if (type === 'commission_alert') {
      // Send commission earning notification
      const { commission_amount, product_name } = req.body;

      if (!commission_amount) {
        return res.status(400).json(createErrorResponse('Commission amount required', 400));
      }

      const alertMessage = `🎉 New commission earned! $${commission_amount} from ${product_name || 'your affiliate link'}. Check your dashboard for details.`;

      let smsResult = null;
      let smsStatus = 'demo';

      // Send actual SMS if Twilio is configured
      if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
        try {
          smsResult = await twilioClient.messages.create({
            body: alertMessage,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone
          });
          smsStatus = 'sent';
        } catch (error) {
          console.error('Twilio SMS error:', error);
          smsStatus = 'failed';
        }
      }

      const responseData = {
        type: 'commission_alert',
        phone: phone,
        commission_amount: commission_amount,
        product_name: product_name,
        status: smsStatus
      };

      if (smsStatus === 'sent' && smsResult) {
        responseData.message_sid = smsResult.sid;
      }

      return res.status(200).json(createSuccessResponse(responseData, 'Commission alert processed'));

    } else {
      return res.status(400).json(createErrorResponse('Invalid SMS type', 400, {
        supported_types: ['otp', 'notification', 'commission_alert']
      }));
    }

  } catch (error) {
    console.error('SMS API error:', error);
    return res.status(500).json(createErrorResponse('SMS service error', 500, error.message));
  }
};