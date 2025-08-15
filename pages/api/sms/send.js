import { sendSMS } from '../../../lib/twilio';
import { supabaseAdmin } from '../../../lib/supabaseServer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, message, mediaUrls, userId, contactId, type } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: 'Phone number and message are required' });
    }

    // Validate message length
    if (message.length > 1600) {
      return res.status(400).json({ error: 'Message too long. Maximum 1600 characters.' });
    }

    // Add compliance footer if not present
    let finalMessage = message;
    if (!message.toLowerCase().includes('stop') && !message.toLowerCase().includes('opt')) {
      finalMessage += '\n\nReply STOP to unsubscribe.';
    }

    // Send SMS/MMS
    const result = await sendSMS(to, finalMessage);

    // Log message to database if we have supabase admin
    if (supabaseAdmin && userId) {
      await supabaseAdmin
        .from('messages')
        .insert([{
          user_id: userId,
          contact_id: contactId,
          phone_number: to,
          message: finalMessage,
          direction: 'outbound',
          status: result.status,
          twilio_sid: result.messageSid,
          media_urls: mediaUrls,
          type: type || 'sms',
          created_at: new Date().toISOString()
        }]);
    }

    return res.status(200).json({
      success: true,
      messageId: result.messageSid,
      status: result.status
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send message'
    });
  }
}