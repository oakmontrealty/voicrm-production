import twilio from 'twilio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, message } = req.body;

  try {
    // Get credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    // Debug info (safe to log)
    const debugInfo = {
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
      hasFromNumber: !!fromNumber,
      accountSidLength: accountSid?.length,
      authTokenLength: authToken?.length,
      accountSidPrefix: accountSid?.substring(0, 6),
      fromNumber: fromNumber,
      nodeEnv: process.env.NODE_ENV
    };

    console.log('Debug info:', debugInfo);

    if (!accountSid || !authToken || !fromNumber) {
      return res.status(500).json({ 
        error: 'Missing credentials',
        debug: debugInfo
      });
    }

    // Try to initialize client
    const client = twilio(accountSid, authToken);

    // First, try to validate the credentials by fetching account info
    try {
      const account = await client.api.accounts(accountSid).fetch();
      console.log('Account validated:', account.friendlyName);
    } catch (authError) {
      console.error('Auth validation failed:', authError.message);
      return res.status(401).json({
        error: 'Authentication failed',
        details: authError.message,
        debug: debugInfo
      });
    }

    // If we get here, credentials are valid, try to send SMS
    if (to && message) {
      const sentMessage = await client.messages.create({
        body: message,
        from: fromNumber,
        to: to
      });

      return res.status(200).json({
        success: true,
        messageId: sentMessage.sid,
        status: sentMessage.status,
        debug: debugInfo
      });
    } else {
      // Just return validation success
      return res.status(200).json({
        success: true,
        message: 'Credentials are valid',
        debug: debugInfo
      });
    }

  } catch (error) {
    console.error('SMS Debug Error:', error);
    return res.status(500).json({ 
      error: 'Failed to send message',
      details: error.message,
      code: error.code,
      moreInfo: error.moreInfo
    });
  }
}