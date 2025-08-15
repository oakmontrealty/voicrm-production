// Server-side only Twilio import
const twilio = require('twilio');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, contactId, leadId, notes } = req.body;

  if (!to) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // Get Twilio credentials from environment
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken) {
    return res.status(500).json({ 
      error: 'Twilio not configured',
      message: 'Please add Twilio credentials to environment variables'
    });
  }

  try {
    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    // Format phone number for Australian market
    const formattedTo = formatPhoneNumber(to);

    // Initiate the call
    const call = await client.calls.create({
      to: formattedTo,
      from: twilioPhoneNumber,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/voice`,
      record: true,
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/status`,
    });

    res.status(200).json({
      success: true,
      call: {
        sid: call.sid,
        status: call.status,
        from: call.from,
        to: call.to,
      },
    });
  } catch (error) {
    console.error('Error initiating call:', error);
    res.status(500).json({
      error: 'Failed to initiate call',
      message: error.message,
    });
  }
}

// Helper function to format phone numbers
function formatPhoneNumber(phone) {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('61')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    return `+61${cleaned.substring(1)}`;
  } else if (cleaned.length === 9) {
    return `+61${cleaned}`;
  }
  
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}