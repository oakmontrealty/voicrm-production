export default async function handler(req, res) {
  // Generate TwiML for WebRTC calls with enhanced audio
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say voice="alice">Connecting your VoiCRM call with enhanced audio quality and noise suppression.</Say>
      <Record maxLength="600" action="/api/twilio/recording" />
      <Dial answerOnBridge="true" callerId="${process.env.TWILIO_PHONE_NUMBER}">
        <Conference>
          voicrm-${Date.now()}
        </Conference>
      </Dial>
    </Response>`;

  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml);
}