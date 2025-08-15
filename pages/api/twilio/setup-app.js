// Create or update TwiML Application programmatically
import twilio from 'twilio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';

    if (!accountSid || !authToken) {
      return res.status(400).json({ 
        error: 'Missing Twilio credentials',
        message: 'Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your environment'
      });
    }

    const client = twilio(accountSid, authToken);

    // Check if we already have a TwiML app for this URL
    const existingApps = await client.applications.list({ limit: 50 });
    let twimlApp = existingApps.find(app => 
      app.friendlyName === 'VoiCRM Browser Calling' ||
      app.voiceUrl?.includes('api/twilio/browser-voice')
    );

    const voiceUrl = `${appUrl}/api/twilio/browser-voice`;
    const statusCallback = `${appUrl}/api/twilio/status`;

    if (twimlApp) {
      // Update existing app
      twimlApp = await client.applications(twimlApp.sid).update({
        voiceUrl: voiceUrl,
        voiceMethod: 'POST',
        statusCallback: statusCallback,
        statusCallbackMethod: 'POST',
        friendlyName: 'VoiCRM Browser Calling'
      });
      
      console.log('Updated existing TwiML application:', twimlApp.sid);
    } else {
      // Create new app
      twimlApp = await client.applications.create({
        friendlyName: 'VoiCRM Browser Calling',
        voiceUrl: voiceUrl,
        voiceMethod: 'POST',
        statusCallback: statusCallback,
        statusCallbackMethod: 'POST'
      });
      
      console.log('Created new TwiML application:', twimlApp.sid);
    }

    res.status(200).json({
      success: true,
      message: 'TwiML application configured successfully',
      application: {
        sid: twimlApp.sid,
        friendlyName: twimlApp.friendlyName,
        voiceUrl: twimlApp.voiceUrl,
        statusCallback: twimlApp.statusCallback,
        dateCreated: twimlApp.dateCreated
      },
      instructions: {
        envVariable: `TWILIO_APP_SID=${twimlApp.sid}`,
        message: 'Add this to your .env.local file to complete setup'
      }
    });

  } catch (error) {
    console.error('Error setting up TwiML application:', error);
    res.status(500).json({
      error: 'Failed to setup TwiML application',
      message: error.message,
      details: error.code ? `Twilio Error ${error.code}: ${error.moreInfo}` : 'Unknown error'
    });
  }
}