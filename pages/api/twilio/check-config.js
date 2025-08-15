// Check existing Twilio configuration
import twilio from 'twilio';

export default async function handler(req, res) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const appSid = process.env.TWILIO_APP_SID;

    if (!accountSid || !authToken) {
      return res.status(400).json({ 
        error: 'Missing Twilio credentials',
        message: 'Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your environment'
      });
    }

    const client = twilio(accountSid, authToken);

    // Get existing TwiML app details
    if (appSid) {
      try {
        const app = await client.applications(appSid).fetch();
        
        console.log('Found TwiML App:', app.friendlyName);
        
        return res.status(200).json({
          success: true,
          message: 'TwiML App is configured and ready!',
          app: {
            sid: app.sid,
            friendlyName: app.friendlyName,
            voiceUrl: app.voiceUrl,
            statusCallback: app.statusCallback,
            dateCreated: app.dateCreated
          },
          status: {
            credentials: '✅ Valid',
            apiKeys: process.env.TWILIO_API_KEY ? '✅ Configured' : '⚠️ Missing',
            twimlApp: '✅ Ready',
            phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'Not set'
          }
        });
      } catch (error) {
        console.error('Error fetching app:', error);
        return res.status(400).json({
          error: 'Invalid TwiML App SID',
          message: 'Check your TWILIO_APP_SID in .env.local'
        });
      }
    } else {
      // List existing apps
      const apps = await client.applications.list({ limit: 20 });
      
      return res.status(200).json({
        success: true,
        message: 'Found existing TwiML Apps',
        apps: apps.map(app => ({
          sid: app.sid,
          friendlyName: app.friendlyName,
          voiceUrl: app.voiceUrl
        })),
        instruction: 'Add TWILIO_APP_SID to your .env.local with one of these SIDs'
      });
    }

  } catch (error) {
    console.error('Error checking configuration:', error);
    res.status(500).json({
      error: 'Failed to check configuration',
      message: error.message
    });
  }
}