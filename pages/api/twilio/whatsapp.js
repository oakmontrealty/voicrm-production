import twilio from 'twilio';
import { processContactName } from '../../../lib/name-utils';

export default async function handler(req, res) {
  const { method } = req;

  // Handle incoming WhatsApp messages (webhook)
  if (method === 'POST' && req.body.From && req.body.Body) {
    const { From, Body, ProfileName, MessageSid } = req.body;
    
    // Log incoming WhatsApp message
    console.log('WhatsApp message received:', {
      from: From,
      name: ProfileName,
      message: Body,
      id: MessageSid
    });

    // Auto-reply
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('Thanks for your WhatsApp message! We\'ll get back to you soon.');
    
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(twiml.toString());
  }

  // Send WhatsApp message
  if (method === 'POST') {
    const { to, message, mediaUrl } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: 'Phone number and message are required' });
    }

    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio sandbox number

      if (!accountSid || !authToken) {
        return res.status(500).json({ error: 'Twilio credentials not configured' });
      }

      const client = twilio(accountSid, authToken);

      // Format phone number for WhatsApp
      const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      
      // Prepare message options
      const messageOptions = {
        body: message,
        from: fromNumber,
        to: whatsappTo
      };

      // Add media if provided
      if (mediaUrl) {
        messageOptions.mediaUrl = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];
      }

      // Send the WhatsApp message
      const sentMessage = await client.messages.create(messageOptions);

      res.status(200).json({
        success: true,
        messageId: sentMessage.sid,
        status: sentMessage.status,
        to: sentMessage.to,
        from: sentMessage.from,
        channel: 'whatsapp'
      });

    } catch (error) {
      console.error('WhatsApp Send Error:', error);
      res.status(500).json({ 
        error: 'Failed to send WhatsApp message',
        details: error.message 
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}