// Update your existing TwiML App configuration
import twilio from 'twilio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    const appSid = process.env.TWILIO_APP_SID;
    
    // Update the TwiML app to use Twilio's demo URL for testing
    const app = await client.applications(appSid)
      .update({
        voiceUrl: 'http://demo.twilio.com/docs/voice.xml',
        voiceMethod: 'POST',
        statusCallback: 'http://demo.twilio.com/docs/voice.xml'
      });
    
    console.log('TwiML App updated:', app.friendlyName);
    
    res.status(200).json({
      success: true,
      message: 'TwiML App updated successfully!',
      app: {
        sid: app.sid,
        friendlyName: app.friendlyName,
        voiceUrl: app.voiceUrl
      },
      nextSteps: [
        '1. Try making a call at http://localhost:3003/phone',
        '2. You should hear a demo message when connected',
        '3. For real calls, you need to set up ngrok or deploy online'
      ]
    });
  } catch (error) {
    console.error('Error updating app:', error);
    res.status(500).json({
      error: 'Failed to update TwiML app',
      message: error.message,
      suggestion: 'Check if your TWILIO_APP_SID is correct'
    });
  }
}