// API endpoint for making real voice calls with Twilio

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

    // Make the call with proper TwiML for voice connection
    const call = await client.calls.create({
      twiml: '<Response><Say>Connecting your VoiCRM call. Please wait.</Say><Dial callerId="' + twilioPhone + '">' + to + '</Dial></Response>',
      to: to,
      from: twilioPhone,
      statusCallback: `${process.env.VERCEL_URL || 'https://voicrm-production.vercel.app'}/api/call-status`,
      statusCallbackEvent: ['initiated', 'answered', 'completed'],
      record: false  // Set to true if you want to record calls
    });

    return res.status(200).json({
      success: true,
      callSid: call.sid,
      status: call.status,
      to: call.to,
      from: call.from,
      message: 'Call initiated successfully'
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