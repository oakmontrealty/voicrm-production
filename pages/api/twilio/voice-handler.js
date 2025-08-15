// Voice handler for browser-to-phone calls with proper two-way audio
export default async function handler(req, res) {
  const { To, From, CallSid, Direction, CallStatus } = req.body;
  
  console.log('Voice handler called:', { To, From, CallSid, Direction, CallStatus });

  // Generate TwiML to handle the call
  let twiml = '';

  if (To && To !== 'undefined') {
    // Outgoing call from browser to phone
    // Format the number properly
    let formattedTo = To;
    if (!formattedTo.startsWith('+')) {
      const cleaned = formattedTo.replace(/\D/g, '');
      if (cleaned.startsWith('0')) {
        // Australian mobile
        formattedTo = '+61' + cleaned.substring(1);
      } else if (cleaned.length === 10) {
        // US number
        formattedTo = '+1' + cleaned;
      } else if (cleaned.length === 9 && cleaned.startsWith('4')) {
        // Australian mobile without 0
        formattedTo = '+61' + cleaned;
      } else if (!cleaned.startsWith('61') && !cleaned.startsWith('1')) {
        formattedTo = '+61' + cleaned;
      } else if (cleaned.startsWith('61') || cleaned.startsWith('1')) {
        formattedTo = '+' + cleaned;
      }
    }

    console.log('Dialing number:', formattedTo);

    // TwiML with recording enabled for AI summaries
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial callerId="${process.env.TWILIO_PHONE_NUMBER || '+61482080888'}"
          record="record-from-answer-dual"
          recordingStatusCallback="https://ninety-jokes-happen.loca.lt/api/twilio/recording-complete"
          recordingStatusCallbackMethod="POST">
        <Number>${formattedTo}</Number>
    </Dial>
</Response>`;
  } else if (Direction === 'inbound') {
    // Incoming call to browser
    console.log('Incoming call, routing to browser client');
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Connecting your VoiCRM call</Say>
    <Dial>
        <Client>browser-user</Client>
    </Dial>
</Response>`;
  } else {
    // Default response
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Thank you for calling VoiCRM. Please try again.</Say>
    <Hangup/>
</Response>`;
  }

  console.log('Sending TwiML response:', twiml);
  
  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml);
}