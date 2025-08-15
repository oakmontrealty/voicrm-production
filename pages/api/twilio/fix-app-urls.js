// Update TwiML App to use production URLs
import twilio from 'twilio';

export default async function handler(req, res) {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    const appSid = process.env.TWILIO_APP_SID;
    
    // Update to production URLs
    const app = await client.applications(appSid).update({
      voiceUrl: 'https://voicrm-production.vercel.app/api/voice',
      voiceMethod: 'POST',
      statusCallback: 'https://voicrm-production.vercel.app/api/call-status',
      statusCallbackMethod: 'POST'
    });
    
    console.log('TwiML App updated to production URLs');
    
    res.status(200).json({
      success: true,
      message: 'TwiML App updated to production URLs!',
      app: {
        sid: app.sid,
        friendlyName: app.friendlyName,
        voiceUrl: app.voiceUrl,
        statusCallback: app.statusCallback
      },
      ready: true,
      nextStep: 'You can now make calls at http://localhost:3002/phone'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}