import twilio from 'twilio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, message, mediaUrl } = req.body;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio Sandbox number
    
    const client = twilio(accountSid, authToken);

    // Format the recipient number for WhatsApp
    const toWhatsApp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    // Send WhatsApp message
    const messageOptions = {
      from: fromNumber,
      to: toWhatsApp,
      body: message
    };

    // Add media if provided
    if (mediaUrl) {
      messageOptions.mediaUrl = [mediaUrl];
    }

    const sentMessage = await client.messages.create(messageOptions);

    // Log the message for summary purposes
    const messageLog = {
      id: sentMessage.sid,
      to: to.replace('whatsapp:', ''),
      from: 'VoiCRM',
      message,
      status: sentMessage.status,
      timestamp: new Date().toISOString(),
      type: 'outbound',
      hasMedia: !!mediaUrl
    };

    res.status(200).json({
      success: true,
      message: 'WhatsApp message sent successfully',
      messageId: sentMessage.sid,
      status: sentMessage.status,
      log: messageLog
    });

  } catch (error) {
    console.error('WhatsApp send error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send WhatsApp message',
      details: error.message
    });
  }
}