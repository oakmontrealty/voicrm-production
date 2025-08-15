// Handle incoming calls to your Twilio number

export default function handler(req, res) {
  const { From, To, CallSid } = req.body || req.query;
  
  console.log('Incoming call from:', From, 'to:', To);
  
  // Set content type for TwiML
  res.setHeader('Content-Type', 'text/xml');
  
  // TwiML response for incoming calls
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Welcome to VoiCRM Real Estate Services.</Say>
    <Pause length="1"/>
    <Say>Connecting you to an agent.</Say>
    <Dial timeout="30">
        <Number>+61400000000</Number>
    </Dial>
    <Say>Sorry, no agents are available. Please try again later.</Say>
</Response>`;
  
  res.status(200).send(twiml);
}