// This endpoint makes a proper outbound call with 2-way audio
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to } = req.body;

  if (!to) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhone) {
      return res.status(400).json({ 
        error: 'Twilio not configured'
      });
    }

    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);

    // Format phone number
    let formattedTo = to.replace(/\D/g, '');
    if (!formattedTo.startsWith('+')) {
      if (formattedTo.startsWith('0')) {
        formattedTo = '+61' + formattedTo.substring(1);
      } else if (formattedTo.length === 10) {
        formattedTo = '+1' + formattedTo;
      } else if (!formattedTo.startsWith('61')) {
        formattedTo = '+61' + formattedTo;
      } else {
        formattedTo = '+' + formattedTo;
      }
    }

    // Create a normal phone call without any messages
    const call = await client.calls.create({
      to: formattedTo,
      from: twilioPhone,
      twiml: '<Response><Pause length="60"/></Response>', // Just keep the line open
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL || 'http://192.168.68.57:3003'}/api/twilio/status`,
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      timeout: 60
    });

    console.log('Call initiated:', call.sid);

    return res.status(200).json({ 
      success: true,
      callSid: call.sid,
      to: formattedTo,
      from: twilioPhone,
      status: call.status
    });

  } catch (error) {
    console.error('Call error:', error);
    
    if (error.code === 21606) {
      return res.status(200).json({ 
        success: false,
        error: 'Number not verified',
        message: 'In trial mode, you can only call verified numbers.'
      });
    }
    
    return res.status(200).json({ 
      success: false,
      error: 'Call failed',
      message: error.message || 'Unable to initiate call'
    });
  }
}