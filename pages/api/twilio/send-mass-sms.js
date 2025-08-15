import twilio from 'twilio';
import { processContactsForMassText } from '../../../lib/name-utils';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { recipients, message, campaignName, includeOptOut, allowGenericOverride = false } = req.body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'Recipients array is required' });
  }

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Limit to prevent abuse (max 100 recipients per request)
  if (recipients.length > 100) {
    return res.status(400).json({ 
      error: 'Too many recipients. Maximum 100 per request.' 
    });
  }

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return res.status(500).json({ error: 'Twilio credentials not configured' });
    }

    const client = twilio(accountSid, authToken);

    // Process contacts for smart name extraction
    const { processed, summary } = processContactsForMassText(
      recipients, 
      message,
      { allowGenericOverride }
    );

    // Add opt-out message if requested
    const addOptOut = (msg) => includeOptOut 
      ? `${msg}\n\nReply STOP to unsubscribe.`
      : msg;

    // Send messages sequentially with 10-second intervals
    const results = [];
    for (let index = 0; index < processed.length; index++) {
      const item = processed[index];
      
      // Wait 10 seconds between messages (except for the first one)
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
      }

      try {
        if (!item.phone) {
          results.push({
            success: false,
            recipient: 'Unknown',
            error: 'No phone number found',
            hasValidName: item.hasValidName
          });
          continue;
        }

        // Don't add opt-out by default - let user control this
        const finalMessage = item.personalizedMessage;

        const sentMessage = await client.messages.create({
          body: finalMessage,
          from: fromNumber,
          to: item.phone
        });

        results.push({
          success: true,
          recipient: item.phone,
          contactName: item.firstName,
          hasValidName: item.hasValidName,
          messageId: sentMessage.sid,
          status: sentMessage.status,
          price: sentMessage.price,
          sentAt: new Date().toISOString()
        });
      } catch (error) {
        results.push({
          success: false,
          recipient: item.phone || 'Unknown',
          contactName: item.firstName,
          hasValidName: item.hasValidName,
          error: error.message
        });
      }
    }

    // Calculate statistics
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalCost = results
      .filter(r => r.success && r.price)
      .reduce((sum, r) => sum + Math.abs(parseFloat(r.price)), 0);

    res.status(200).json({
      success: true,
      campaignName,
      statistics: {
        total: recipients.length,
        successful,
        failed,
        estimatedCost: totalCost.toFixed(4),
        currency: 'USD'
      },
      results
    });

  } catch (error) {
    console.error('Mass SMS Error:', error);
    res.status(500).json({ 
      error: 'Failed to send mass SMS',
      details: error.message 
    });
  }
}