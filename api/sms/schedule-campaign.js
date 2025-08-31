// SMS Marketing Campaign API - Twilio Integration
// Bangladesh dev style - comprehensive SMS marketing system

const { initDatabase } = require('../../lib/database');

// Mock Twilio integration for demo (replace with actual Twilio API in production)
async function sendSMSWithTwilio(phoneNumber, message, accountSid, authToken) {
    // This would be replaced with actual Twilio API call
    // const twilio = require('twilio')(accountSid, authToken);
    
    // Demo SMS sending
    console.log(`[SMS DEMO] Sending to ${phoneNumber}: ${message}`);
    
    return {
        sid: `SM${Math.random().toString(36).substring(2, 15)}`,
        status: 'queued',
        to: phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
        body: message,
        price: '0.0075', // Demo price per SMS
        priceUnit: 'USD'
    };
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const db = await initDatabase();
        const { name, audience, sendTime, message, includeLink } = req.body;

        // Validate required fields
        if (!name || !message) {
            return res.status(400).json({
                success: false,
                error: 'Campaign name and message are required'
            });
        }

        // Get API key from headers
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).json({ success: false, error: 'API key required' });
        }

        // Verify affiliate exists
        const affiliate = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM affiliates WHERE api_key = ?', [apiKey], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!affiliate) {
            return res.status(401).json({ success: false, error: 'Invalid API key' });
        }

        // Get target phone numbers based on audience
        let phoneNumbers = [];
        
        if (audience === 'all') {
            // Get all affiliate phone numbers (for demo)
            phoneNumbers = await new Promise((resolve, reject) => {
                db.all(`
                    SELECT phone_number FROM affiliates 
                    WHERE phone_number IS NOT NULL 
                    AND phone_verified = 1
                    AND sms_opt_in = 1
                `, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.map(row => row.phone_number));
                });
            });
        } else {
            // For demo, use some sample numbers
            phoneNumbers = ['+1234567890', '+1234567891', '+1234567892'];
        }

        // Create campaign record
        const campaignId = await new Promise((resolve, reject) => {
            const query = `
                INSERT INTO sms_campaigns 
                (affiliate_id, name, message, audience, scheduled_time, status, total_recipients, created_at)
                VALUES (?, ?, ?, ?, ?, 'scheduled', ?, datetime('now'))
            `;
            
            db.run(query, [
                affiliate.id,
                name,
                message,
                audience,
                sendTime || 'immediate',
                phoneNumbers.length
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });

        // If sending immediately, process the campaign
        if (!sendTime || sendTime === 'immediate') {
            let successCount = 0;
            let failureCount = 0;
            let totalCost = 0;

            for (const phoneNumber of phoneNumbers) {
                try {
                    // Replace {affiliate_link} placeholder if needed
                    let processedMessage = message;
                    if (includeLink && message.includes('{affiliate_link}')) {
                        // Get a default affiliate link for this affiliate
                        const defaultLink = await new Promise((resolve, reject) => {
                            db.get(`
                                SELECT short_url FROM affiliate_links 
                                WHERE affiliate_id = ? AND status = 'active'
                                LIMIT 1
                            `, [affiliate.id], (err, row) => {
                                if (err) reject(err);
                                else resolve(row?.short_url || 'https://example.com/affiliate');
                            });
                        });
                        
                        processedMessage = processedMessage.replace('{affiliate_link}', defaultLink);
                    }

                    // Send SMS via Twilio (demo)
                    const smsResult = await sendSMSWithTwilio(
                        phoneNumber, 
                        processedMessage,
                        process.env.TWILIO_ACCOUNT_SID,
                        process.env.TWILIO_AUTH_TOKEN
                    );

                    // Log SMS delivery
                    await new Promise((resolve, reject) => {
                        db.run(`
                            INSERT INTO sms_deliveries 
                            (campaign_id, phone_number, message, status, twilio_sid, cost, created_at)
                            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
                        `, [
                            campaignId,
                            phoneNumber,
                            processedMessage,
                            'sent',
                            smsResult.sid,
                            parseFloat(smsResult.price)
                        ], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });

                    successCount++;
                    totalCost += parseFloat(smsResult.price);
                    
                } catch (error) {
                    console.error(`Failed to send SMS to ${phoneNumber}:`, error);
                    
                    // Log failure
                    await new Promise((resolve, reject) => {
                        db.run(`
                            INSERT INTO sms_deliveries 
                            (campaign_id, phone_number, message, status, error_message, created_at)
                            VALUES (?, ?, ?, 'failed', ?, datetime('now'))
                        `, [
                            campaignId,
                            phoneNumber,
                            processedMessage,
                            error.message
                        ], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                    
                    failureCount++;
                }
            }

            // Update campaign with results
            await new Promise((resolve, reject) => {
                db.run(`
                    UPDATE sms_campaigns 
                    SET status = 'completed',
                        sent_count = ?,
                        failed_count = ?,
                        total_cost = ?,
                        completed_at = datetime('now')
                    WHERE id = ?
                `, [successCount, failureCount, totalCost, campaignId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            // Update affiliate's SMS usage
            await new Promise((resolve, reject) => {
                db.run(`
                    UPDATE affiliates 
                    SET sms_campaigns_sent = sms_campaigns_sent + 1,
                        sms_messages_sent = sms_messages_sent + ?,
                        sms_total_cost = sms_total_cost + ?
                    WHERE id = ?
                `, [successCount, totalCost, affiliate.id], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            res.json({
                success: true,
                campaignId,
                status: 'completed',
                results: {
                    totalRecipients: phoneNumbers.length,
                    successCount,
                    failureCount,
                    totalCost: totalCost.toFixed(4)
                }
            });

        } else {
            // Schedule for later
            res.json({
                success: true,
                campaignId,
                status: 'scheduled',
                scheduledTime: sendTime,
                totalRecipients: phoneNumbers.length,
                estimatedCost: (phoneNumbers.length * 0.0075).toFixed(4)
            });
        }

    } catch (error) {
        console.error('SMS Campaign Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to schedule SMS campaign'
        });
    }
};