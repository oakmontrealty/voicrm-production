// This creates/updates the TwiML app in your Twilio account
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    // Use public tunnel URL for Twilio webhooks
    const appUrl = 'https://ninety-jokes-happen.loca.lt';

    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);

    // First, check if app already exists
    const existingApps = await client.applications.list({ limit: 20 });
    let app = existingApps.find(a => a.friendlyName === 'VoiCRM Browser Phone');

    if (app) {
      // Update existing app
      app = await client.applications(app.sid).update({
        voiceUrl: `${appUrl}/api/twilio/voice-handler`,
        voiceMethod: 'POST',
        statusCallback: `${appUrl}/api/twilio/status`,
        statusCallbackMethod: 'POST'
      });
      
      console.log('Updated existing TwiML App:', app.sid);
    } else {
      // Create new app
      app = await client.applications.create({
        friendlyName: 'VoiCRM Browser Phone',
        voiceUrl: `${appUrl}/api/twilio/voice-handler`,
        voiceMethod: 'POST',
        statusCallback: `${appUrl}/api/twilio/status`,
        statusCallbackMethod: 'POST'
      });
      
      console.log('Created new TwiML App:', app.sid);
    }

    // Update the .env.local file with the app SID
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('TWILIO_APP_SID=')) {
      envContent = envContent.replace(/TWILIO_APP_SID=.*/, `TWILIO_APP_SID=${app.sid}`);
    } else {
      envContent += `\nTWILIO_APP_SID=${app.sid}`;
    }
    
    fs.writeFileSync(envPath, envContent);

    return res.status(200).json({ 
      success: true,
      appSid: app.sid,
      message: 'TwiML App configured successfully',
      voiceUrl: app.voiceUrl
    });

  } catch (error) {
    console.error('TwiML App creation error:', error);
    return res.status(500).json({ 
      error: 'Failed to create TwiML App',
      message: error.message 
    });
  }
}