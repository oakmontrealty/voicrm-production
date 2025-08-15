export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { callSid, number } = req.body;

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      return res.status(200).json({ 
        success: false,
        error: 'Twilio not configured'
      });
    }

    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);

    // End the call if we have a call SID
    if (callSid && !callSid.startsWith('DEMO_')) {
      const call = await client.calls(callSid).update({
        status: 'completed'
      });
      
      return res.status(200).json({ 
        success: true,
        message: 'Call ended',
        callSid: call.sid
      });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Call ended'
    });

  } catch (error) {
    console.error('Error ending call:', error);
    return res.status(200).json({ 
      success: false,
      error: 'Failed to end call',
      message: error.message
    });
  }
}