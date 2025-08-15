export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    const config = {
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
      hasPhoneNumber: !!fromNumber,
      accountSidPreview: accountSid ? `${accountSid.substring(0, 8)}...` : 'Not set',
      phoneNumberPreview: fromNumber ? `${fromNumber.substring(0, 6)}...` : 'Not set'
    };

    res.status(200).json({
      success: true,
      config,
      allConfigured: config.hasAccountSid && config.hasAuthToken && config.hasPhoneNumber
    });

  } catch (error) {
    console.error('Config check error:', error);
    res.status(500).json({ 
      error: 'Failed to check configuration',
      details: error.message 
    });
  }
}