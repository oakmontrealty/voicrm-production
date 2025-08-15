import twilio from 'twilio';
import { getTwilioConfig } from '../../../lib/twilio-config';

// Track recent messages to prevent duplicates
const recentMessages = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, message, mediaUrl } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: 'Phone number and message are required' });
  }

  // Create a unique key for this message
  const messageKey = `${to}-${message.substring(0, 50)}-${Date.now()}`;
  
  // Check if we sent this exact message in the last 5 seconds
  const now = Date.now();
  for (const [key, timestamp] of recentMessages.entries()) {
    if (now - timestamp > 5000) {
      recentMessages.delete(key); // Clean up old entries
    }
  }
  
  // Check for duplicate
  const similarKey = Array.from(recentMessages.keys()).find(key => 
    key.startsWith(`${to}-${message.substring(0, 50)}`)
  );
  
  if (similarKey && now - recentMessages.get(similarKey) < 5000) {
    console.log('Duplicate SMS prevented:', { to, message: message.substring(0, 30) });
    return res.status(200).json({ 
      success: true,
      messageId: 'duplicate-prevented',
      status: 'blocked',
      note: 'Duplicate message prevented'
    });
  }
  
  // Record this message
  recentMessages.set(messageKey, now);

  try {
    // Get Twilio configuration
    let config;
    try {
      config = getTwilioConfig();
    } catch (configError) {
      console.error('Twilio config error:', configError.message);
      return res.status(500).json({ 
        error: 'Twilio configuration error',
        details: configError.message
      });
    }

    const client = twilio(config.accountSid, config.authToken);

    // Prepare message options
    const messageOptions = {
      body: message,
      from: config.phoneNumber,
      to: to
    };

    // Add media URL if provided (for MMS)
    if (mediaUrl) {
      messageOptions.mediaUrl = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];
    }

    // Send the message
    const sentMessage = await client.messages.create(messageOptions);

    res.status(200).json({
      success: true,
      messageId: sentMessage.sid,
      status: sentMessage.status,
      to: sentMessage.to,
      from: sentMessage.from,
      dateCreated: sentMessage.dateCreated,
      price: sentMessage.price,
      priceUnit: sentMessage.priceUnit
    });

  } catch (error) {
    console.error('SMS Send Error:', error);
    res.status(500).json({ 
      error: 'Failed to send message',
      details: error.message 
    });
  }
}