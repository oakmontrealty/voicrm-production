// This API endpoint will handle Twilio calls
// Note: Add your Twilio credentials as environment variables in Vercel

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to } = req.body;

  if (!to) {
    return res.status(400).json({ error: 'Phone number required' });
  }

  // Check if Twilio credentials are configured
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioPhone) {
    console.log('Twilio not configured. Add environment variables:');
    console.log('TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER');
    
    // Return demo response for testing
    return res.status(200).json({
      success: true,
      message: 'Demo call initiated (Twilio not configured)',
      callSid: 'DEMO_' + Date.now(),
      to: to,
      status: 'demo'
    });
  }

  try {
    // Initialize Twilio client
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);

    // Make the call
    const call = await client.calls.create({
      url: 'http://demo.twilio.com/docs/voice.xml', // TwiML for the call
      to: to,
      from: twilioPhone,
      statusCallback: `${process.env.VERCEL_URL}/api/call-status`,
      statusCallbackEvent: ['initiated', 'answered', 'completed']
    });

    return res.status(200).json({
      success: true,
      callSid: call.sid,
      status: call.status,
      to: call.to,
      from: call.from
    });

  } catch (error) {
    console.error('Twilio error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: 'Check your Twilio credentials and phone number format'
    });
  }
}