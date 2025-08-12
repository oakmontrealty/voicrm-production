// TwiML endpoint for handling voice calls
// This creates the voice connection between two phones

export default function handler(req, res) {
  const { To, From, CallSid } = req.query;
  
  // Set content type for TwiML
  res.setHeader('Content-Type', 'text/xml');
  
  // Create TwiML response for connecting the call
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Connecting your VoiCRM call.</Say>
    <Dial callerId="${From}" timeout="30" action="/api/call-complete">
        <Number>${To}</Number>
    </Dial>
    <Say>The call has ended. Thank you for using VoiCRM.</Say>
</Response>`;
  
  res.status(200).send(twiml);
}