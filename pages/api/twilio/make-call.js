export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, from } = req.body;

  if (!to) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    // Check if Twilio is configured
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = from || process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken) {
      return res.status(200).json({ 
        success: false,
        error: 'Twilio not configured',
        message: 'To enable real calling, add these to your .env.local file:',
        setup: {
          TWILIO_ACCOUNT_SID: 'Get from console.twilio.com',
          TWILIO_AUTH_TOKEN: 'Get from console.twilio.com',
          TWILIO_PHONE_NUMBER: 'Your Twilio phone number (e.g., +61XXXXXXXXX)'
        }
      });
    }

    // Import Twilio dynamically
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);

    // Format phone number
    let formattedTo = to.replace(/\D/g, '');
    if (!formattedTo.startsWith('+')) {
      // Assume Australian number if starts with 0
      if (formattedTo.startsWith('0')) {
        formattedTo = '+61' + formattedTo.substring(1);
      } else if (formattedTo.startsWith('61')) {
        formattedTo = '+' + formattedTo;
      } else if (formattedTo.length === 10) {
        // US number
        formattedTo = '+1' + formattedTo;
      } else {
        formattedTo = '+61' + formattedTo; // Default to Australian
      }
    }

    // Create TwiML for the call with enhanced audio quality
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="alice">Connecting your VoiCRM call with noise suppression enabled.</Say>
        <Dial callerId="${twilioPhone}" answerOnBridge="true">
          <Number statusCallbackEvent="initiated ringing answered completed" statusCallback="/api/twilio/status">${formattedTo}</Number>
        </Dial>
      </Response>`;

    // For demo purposes without actual Twilio account
    if (accountSid === 'demo' || !twilioPhone) {
      console.log('Demo mode - Would call:', formattedTo);
      return res.status(200).json({ 
        success: true,
        demo: true,
        message: `Demo: Would call ${formattedTo}`,
        callSid: 'DEMO_' + Date.now(),
        to: formattedTo,
        from: twilioPhone || '+61456789012',
        status: 'demo-initiated'
      });
    }

    // Make the actual call
    const call = await client.calls.create({
      twiml: twiml,
      to: formattedTo,
      from: twilioPhone,
      statusCallback: '/api/twilio/status',
      statusCallbackMethod: 'POST'
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
    
    // Provide helpful error messages
    if (error.code === 20003) {
      return res.status(200).json({ 
        success: false,
        error: 'Invalid Twilio credentials',
        message: 'Please check your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env.local'
      });
    } else if (error.code === 21211) {
      return res.status(200).json({ 
        success: false,
        error: 'Invalid phone number format',
        message: 'Please enter a valid phone number (e.g., 0456789012 or +61456789012)'
      });
    } else if (error.code === 21606) {
      return res.status(200).json({ 
        success: false,
        error: 'Number not verified',
        message: 'In trial mode, you can only call verified numbers. Add this number in your Twilio console.'
      });
    }
    
    return res.status(200).json({ 
      success: false,
      error: 'Call failed',
      message: error.message || 'Unable to initiate call'
    });
  }
}