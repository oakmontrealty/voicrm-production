import twilio from 'twilio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, message, mediaUrl } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: 'Phone number and message are required' });
  }

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return res.status(500).json({ error: 'Twilio credentials not configured' });
    }

    const client = twilio(accountSid, authToken);

    // Prepare message options
    const messageOptions = {
      body: message,
      from: fromNumber,
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