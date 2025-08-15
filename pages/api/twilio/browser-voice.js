// TwiML endpoint for browser-based calling
import twilio from 'twilio';

export default async function handler(req, res) {
  try {
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Get parameters from the request
    const { To, From, ContactName, ContactId } = req.body;
    
    console.log('Browser voice request:', { To, From, ContactName, ContactId });

    if (To) {
      // This is an outbound call from browser
      
      // Add a brief greeting
      twiml.say({
        voice: 'alice',
        language: 'en-AU'
      }, `Connecting to ${ContactName || 'your contact'}...`);
      
      // Dial the destination number
      const dial = twiml.dial({
        callerId: process.env.TWILIO_PHONE_NUMBER,
        record: 'record-from-answer-dual', // Record both sides
        recordingStatusCallback: '/api/twilio/recording',
        timeout: 30,
        answerOnBridge: true // Only connect when answered
      });
      
      // Add the number to dial
      dial.number({
        statusCallback: `/api/twilio/status?contactId=${ContactId || ''}`,
        statusCallbackEvent: 'answered completed'
      }, To);
      
    } else {
      // Fallback - no destination provided
      twiml.say({
        voice: 'alice',
        language: 'en-AU'
      }, 'I\'m sorry, no destination number was provided. Please try again.');
      
      twiml.hangup();
    }

    // Set response headers for TwiML
    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 'no-cache');
    
    const twimlString = twiml.toString();
    console.log('Generated TwiML:', twimlString);
    
    res.status(200).send(twimlString);
    
  } catch (error) {
    console.error('Error generating TwiML:', error);
    
    // Return error TwiML
    const errorTwiml = new twilio.twiml.VoiceResponse();
    errorTwiml.say({
      voice: 'alice',
      language: 'en-AU'
    }, 'I\'m sorry, there was an error processing your call. Please try again.');
    errorTwiml.hangup();
    
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(errorTwiml.toString());
  }
}