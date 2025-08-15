export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, offer } = req.body;

  if (!to) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhone) {
      return res.status(400).json({ 
        error: 'Twilio not configured',
        message: 'Missing Twilio credentials'
      });
    }

    // Import Twilio
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

    // Create a call with WebRTC media streams
    const call = await client.calls.create({
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://192.168.68.57:3002'}/api/twilio/webrtc-twiml`,
      to: formattedTo,
      from: twilioPhone,
      method: 'POST',
      record: true,
      machineDetection: 'Enable',
      statusCallback: '/api/twilio/status',
      statusCallbackMethod: 'POST'
    });

    // For WebRTC, we need to establish media bridge
    // This is a simplified version - full implementation would require media server
    const answer = {
      type: 'answer',
      sdp: offer // Echo back for demo - real implementation needs media server
    };

    console.log('WebRTC call initiated:', call.sid);

    return res.status(200).json({ 
      success: true,
      callSid: call.sid,
      to: formattedTo,
      from: twilioPhone,
      answer: answer.sdp,
      message: 'Call initiated with WebRTC support'
    });

  } catch (error) {
    console.error('WebRTC call error:', error);
    
    if (error.code === 21606) {
      return res.status(200).json({ 
        success: false,
        error: 'Number not verified',
        message: 'In trial mode, you can only call verified numbers. Add this number in your Twilio console.'
      });
    }
    
    return res.status(200).json({ 
      success: false,
      error: 'Call failed',
      message: error.message || 'Unable to initiate WebRTC call'
    });
  }
}