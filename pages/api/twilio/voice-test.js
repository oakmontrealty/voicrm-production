// Test endpoint to verify TwiML is working
export default async function handler(req, res) {
  console.log('Voice test endpoint called');
  console.log('Request body:', req.body);
  console.log('Request query:', req.query);
  
  // Simple TwiML that should work for browser-to-phone
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say>Testing audio connection</Say>
      <Pause length="30"/>
    </Response>`;
  
  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml);
}