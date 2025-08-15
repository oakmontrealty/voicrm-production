// Make a call that forwards to another number
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, callTo } = req.body; // 'to' is who to call, 'callTo' is who to connect them to

  if (!to || !callTo) {
    return res.status(400).json({ error: 'Both phone numbers are required' });
  }

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);

    // Format phone numbers
    const formatNumber = (num) => {
      let cleaned = num.replace(/\D/g, '');
      if (!cleaned.startsWith('+')) {
        if (cleaned.startsWith('0')) {
          cleaned = '+61' + cleaned.substring(1);
        } else if (cleaned.length === 10) {
          cleaned = '+1' + cleaned;
        } else if (!cleaned.startsWith('61')) {
          cleaned = '+61' + cleaned;
        } else {
          cleaned = '+' + cleaned;
        }
      }
      return cleaned;
    };

    const formattedTo = formatNumber(to);
    const formattedCallTo = formatNumber(callTo);

    // Create a call that connects two numbers
    const call = await client.calls.create({
      to: formattedTo,
      from: twilioPhone,
      twiml: `<Response>
        <Dial callerId="${twilioPhone}">
          <Number>${formattedCallTo}</Number>
        </Dial>
      </Response>`
    });

    console.log('Call bridge initiated:', call.sid);

    return res.status(200).json({ 
      success: true,
      callSid: call.sid,
      from: twilioPhone,
      to: formattedTo,
      connecting: formattedCallTo,
      message: 'Connecting two parties'
    });

  } catch (error) {
    console.error('Call error:', error);
    return res.status(200).json({ 
      success: false,
      error: 'Call failed',
      message: error.message
    });
  }
}