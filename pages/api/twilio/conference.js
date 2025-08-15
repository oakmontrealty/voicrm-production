// TwiML endpoint for conference bridge
export default async function handler(req, res) {
  const { To, From, CallSid } = req.body || req.query;
  
  console.log('Conference TwiML requested:', { To, From, CallSid });
  
  // Create a conference room for this call
  const conferenceRoom = `voicrm-room-${Date.now()}`;
  
  // TwiML to join both parties into a conference
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say voice="alice">Connecting your call. Please wait.</Say>
      <Dial>
        <Conference 
          startConferenceOnEnter="true"
          endConferenceOnExit="true"
          waitUrl="http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical"
          beep="false"
          record="record-from-start"
          recordingStatusCallback="/api/twilio/recording">
          ${conferenceRoom}
        </Conference>
      </Dial>
    </Response>`;
  
  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml);
}