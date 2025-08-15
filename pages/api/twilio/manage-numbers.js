import twilio from 'twilio';

export default async function handler(req, res) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = twilio(accountSid, authToken);

  if (req.method === 'GET') {
    try {
      // List all phone numbers on the account
      const phoneNumbers = await client.incomingPhoneNumbers.list();
      
      const numbers = phoneNumbers.map(num => ({
        sid: num.sid,
        phoneNumber: num.phoneNumber,
        friendlyName: num.friendlyName,
        capabilities: num.capabilities,
        dateCreated: num.dateCreated,
        voiceUrl: num.voiceUrl,
        smsUrl: num.smsUrl,
        status: num.status
      }));

      // Get available Australian numbers for purchase
      const availableNumbers = await client.availablePhoneNumbers('AU')
        .local
        .list({
          voiceEnabled: true,
          smsEnabled: true,
          limit: 10
        });

      res.status(200).json({
        current: numbers,
        available: availableNumbers.map(n => ({
          phoneNumber: n.phoneNumber,
          locality: n.locality,
          region: n.region,
          capabilities: n.capabilities,
          monthlyFee: '$3.00 AUD' // Approximate
        }))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    const { action, phoneNumber, assignTo } = req.body;

    try {
      if (action === 'purchase') {
        // Purchase a new Australian number
        const purchasedNumber = await client.incomingPhoneNumbers.create({
          phoneNumber: phoneNumber,
          voiceUrl: 'https://voicrm.com/api/twilio/voice',
          smsUrl: 'https://voicrm.com/api/twilio/sms-webhook',
          voiceMethod: 'POST',
          smsMethod: 'POST',
          friendlyName: `VoiCRM - ${assignTo || 'Main'}`
        });

        res.status(200).json({
          success: true,
          number: purchasedNumber.phoneNumber,
          sid: purchasedNumber.sid
        });
      }

      if (action === 'assign') {
        // Assign number to staff member
        // Store in database
        res.status(200).json({
          success: true,
          message: `Number ${phoneNumber} assigned to ${assignTo}`
        });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}