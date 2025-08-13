// Generate Twilio access token for browser-based calling

export default async function handler(req, res) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
  const appSid = process.env.TWILIO_APP_SID || 'AP85394fa07818eb37bf1f5b6c6ff41de0';
  
  if (!accountSid || !authToken) {
    return res.status(400).json({ 
      error: 'Twilio not configured',
      message: 'Please check your environment variables' 
    });
  }
  
  try {
    const twilio = require('twilio');
    
    // Create capability token for browser
    const capability = new twilio.jwt.ClientCapability({
      accountSid: accountSid,
      authToken: authToken
    });
    
    // Allow incoming connections
    capability.addScope(
      new twilio.jwt.ClientCapability.IncomingClientScope('voicrm-browser')
    );
    
    // Allow outgoing connections
    capability.addScope(
      new twilio.jwt.ClientCapability.OutgoingClientScope({
        applicationSid: appSid,
        clientName: 'voicrm-browser'
      })
    );
    
    // Generate token (valid for 1 hour)
    const token = capability.toJwt();
    
    return res.status(200).json({
      token: token,
      identity: 'voicrm-browser',
      twilioPhone: twilioPhone
    });
    
  } catch (error) {
    console.error('Token generation error:', error);
    return res.status(500).json({ 
      error: error.message,
      details: 'Failed to generate access token'
    });
  }
}