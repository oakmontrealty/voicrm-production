// TwiML endpoint for handling browser-based calls

export default function handler(req, res) {
  const { To, From } = req.body || req.query;
  
  console.log('Voice call initiated:', { To, From });
  
  // Set content type for TwiML
  res.setHeader('Content-Type', 'text/xml');
  
  // Create TwiML response for the call
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial callerId="${process.env.TWILIO_PHONE_NUMBER || '+61482080888'}">
        <Number>${To}</Number>
    </Dial>
</Response>`;
  
  res.status(200).send(twiml);
}