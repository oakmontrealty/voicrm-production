// Make a direct call with Twilio that connects two phones
import twilio from 'twilio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to } = req.body;
  
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    // Format the number
    let toNumber = to;
    if (!toNumber.startsWith('+')) {
      if (toNumber.startsWith('0')) {
        toNumber = '+61' + toNumber.substring(1);
      } else {
        toNumber = '+' + toNumber;
      }
    }
    
    // Create a call that actually connects
    const call = await client.calls.create({
      to: toNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      twiml: `<Response>
        <Say voice="alice" language="en-AU">
          Connecting you to VoiCRM. This call is being recorded.
        </Say>
        <Record maxLength="600" playBeep="true" />
      </Response>`
    });
    
    res.status(200).json({
      success: true,
      callSid: call.sid,
      message: 'Call initiated! The person will hear a greeting and can leave a message.'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}