// FIXED: No more double-calling - single outbound call only

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to } = req.body;

  if (!to) {
    return res.status(400).json({ error: 'Phone number required' });
  }

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
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);

    // FIXED: This makes ONE call to the destination only
    // No more calling you back, no more "CRM call" message
    const call = await client.calls.create({
      twiml: '<Response><Pause length="1"/><Say>Call connected.</Say><Pause length="30"/></Response>',
      to: to,  // Destination number only
      from: twilioPhone,  // Your Twilio number as caller ID
      statusCallback: 'https://voicrm-production.vercel.app/api/call-status',
      statusCallbackEvent: ['initiated', 'answered', 'completed']
    });

    return res.status(200).json({
      success: true,
      callSid: call.sid,
      status: call.status,
      to: call.to,
      from: call.from,
      message: 'Single call initiated to destination'
    });

  } catch (error) {
    console.error('Twilio error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: 'Check your Twilio credentials'
    });
  }
}