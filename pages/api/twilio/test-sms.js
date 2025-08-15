import twilio from 'twilio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return res.status(500).json({ 
        error: 'Twilio credentials not configured',
        details: {
          hasAccountSid: !!accountSid,
          hasAuthToken: !!authToken,
          hasFromNumber: !!fromNumber
        }
      });
    }

    const client = twilio(accountSid, authToken);

    // Send test message
    const message = await client.messages.create({
      body: 'Test message from VoiCRM - Your SMS system is working! 🎉',
      from: fromNumber,
      to: phoneNumber
    });

    res.status(200).json({
      success: true,
      message: 'Test SMS sent successfully!',
      details: {
        messageSid: message.sid,
        to: message.to,
        from: message.from,
        status: message.status,
        dateCreated: message.dateCreated
      }
    });

  } catch (error) {
    console.error('Test SMS Error:', error);
    res.status(500).json({ 
      error: 'Failed to send test SMS',
      details: error.message,
      code: error.code,
      moreInfo: error.moreInfo
    });
  }
}