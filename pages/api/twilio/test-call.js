// Test endpoint to make a call using Twilio REST API
import twilio from 'twilio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to } = req.body;
  
  if (!to) {
    return res.status(400).json({ error: 'Phone number required' });
  }

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    
    const client = twilio(accountSid, authToken);
    
    // Format the number
    let toNumber = to;
    if (!toNumber.startsWith('+')) {
      if (toNumber.startsWith('0')) {
        toNumber = '+61' + toNumber.substring(1); // Australian format
      } else {
        toNumber = '+' + toNumber;
      }
    }
    
    console.log('Making call from', fromNumber, 'to', toNumber);
    
    // Make the call
    const call = await client.calls.create({
      to: toNumber,
      from: fromNumber,
      url: 'http://demo.twilio.com/docs/voice.xml', // Twilio demo TwiML
      statusCallback: 'https://webhook.site/unique-id', // Optional status webhook
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      record: true,
    });
    
    console.log('Call initiated:', call.sid);
    
    res.status(200).json({
      success: true,
      callSid: call.sid,
      status: call.status,
      to: call.to,
      from: call.from,
    });
  } catch (error) {
    console.error('Error making call:', error);
    res.status(500).json({
      error: 'Failed to make call',
      message: error.message,
      code: error.code,
    });
  }
}