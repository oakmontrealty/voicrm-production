// Generate Twilio access token for browser-based calling
import twilio from 'twilio';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const apiKey = process.env.TWILIO_API_KEY;
    const apiSecret = process.env.TWILIO_API_SECRET;
    const appSid = process.env.TWILIO_APP_SID || 'AP76b82c4f57dcfee606f09036f5f0a8b0';

    // Use API key and secret for browser calling
    const twilioApiKey = apiKey || accountSid;
    const twilioApiSecret = apiSecret || authToken;
    
    console.log('Generating token with:', {
      accountSid: accountSid ? 'Set' : 'Missing',
      authToken: authToken ? 'Set' : 'Missing',
      apiKey: apiKey ? 'Set' : 'Missing',
      apiSecret: apiSecret ? 'Set' : 'Missing',
      appSid: appSid ? 'Set' : 'Missing'
    });

    // Create access token for Twilio Voice SDK
    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    // Create unique identity for this user
    const identity = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create access token
    const accessToken = new AccessToken(
      accountSid,
      twilioApiKey,
      twilioApiSecret,
      { 
        identity: identity,
        ttl: 3600 // Token valid for 1 hour
      }
    );

    // Create voice grant
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: appSid,
      incomingAllow: true,
    });

    // Add grant to token
    accessToken.addGrant(voiceGrant);
    
    const tokenString = accessToken.toJwt();
    console.log('Token generated successfully for identity:', identity);

    res.status(200).json({
      success: true,
      token: tokenString,
      identity: identity,
    });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({
      error: 'Failed to generate token',
      message: error.message,
    });
  }
}