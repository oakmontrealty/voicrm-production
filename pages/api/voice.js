// Twilio voice webhook handler for browser calling
import twilio from 'twilio';

export default function handler(req, res) {
  const twiml = new twilio.twiml.VoiceResponse();
  
  // Get the number to dial from the request
  const { To, From, CallSid } = req.body || req.query;
  
  console.log('Voice webhook called:', { To, From, CallSid });
  
  if (To) {
    // Create a dial verb to connect the call
    const dial = twiml.dial({
      callerId: process.env.TWILIO_PHONE_NUMBER || From || '+61482080888',
      answerOnBridge: true,
      record: 'record-from-answer-dual',
      recordingStatusCallback: 'https://voicrm-production.vercel.app/api/recording-status',
      recordingStatusCallbackMethod: 'POST'
    });
    
    // Check if calling a client or phone number
    if (To.startsWith('client:')) {
      // Calling another browser client
      dial.client(To.replace('client:', ''));
    } else {
      // Calling a regular phone number
      dial.number(To);
    }
    
    console.log('Dialing:', To);
  } else {
    // Incoming call or no destination specified
    twiml.say({
      voice: 'alice',
      language: 'en-AU'
    }, 'Welcome to VoiCRM. Connecting your call.');
    
    // You can add more logic here for incoming calls
    twiml.dial({
      callerId: process.env.TWILIO_PHONE_NUMBER || '+61482080888'
    }, process.env.DEFAULT_FORWARD_NUMBER || '+61400000000');
  }
  
  // Return TwiML response
  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml.toString());
}