import twilio from 'twilio';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken) {
      return res.status(500).json({ error: 'Twilio credentials not configured' });
    }

    const client = twilio(accountSid, authToken);

    // Get account details
    const account = await client.api.accounts(accountSid).fetch();
    
    // Get phone number details
    let phoneNumberDetails = null;
    let verifiedNumbers = [];
    let messageServices = [];
    
    try {
      // Get incoming phone numbers
      const phoneNumbers = await client.incomingPhoneNumbers.list({ limit: 10 });
      phoneNumberDetails = phoneNumbers.map(p => ({
        phoneNumber: p.phoneNumber,
        friendlyName: p.friendlyName,
        capabilities: p.capabilities,
        smsEnabled: p.capabilities?.sms,
        mmsEnabled: p.capabilities?.mms,
        voiceEnabled: p.capabilities?.voice
      }));

      // Get verified caller IDs (for trial accounts)
      const callerIds = await client.validationRequests.list({ limit: 10 });
      verifiedNumbers = callerIds.map(v => ({
        phoneNumber: v.phoneNumber,
        status: v.validationCode ? 'pending' : 'verified'
      }));

      // Also check outgoing caller IDs
      const outgoingCallerIds = await client.outgoingCallerIds.list({ limit: 10 });
      outgoingCallerIds.forEach(o => {
        if (!verifiedNumbers.find(v => v.phoneNumber === o.phoneNumber)) {
          verifiedNumbers.push({
            phoneNumber: o.phoneNumber,
            status: 'verified',
            friendlyName: o.friendlyName
          });
        }
      });

      // Get messaging services
      const services = await client.messaging.v1.services.list({ limit: 10 });
      messageServices = services.map(s => ({
        sid: s.sid,
        friendlyName: s.friendlyName,
        statusCallback: s.statusCallback
      }));

    } catch (error) {
      console.error('Error fetching phone details:', error);
    }

    // Check balance for trial accounts
    let balance = null;
    try {
      const balanceData = await client.balance.fetch();
      balance = {
        balance: balanceData.balance,
        currency: balanceData.currency
      };
    } catch (error) {
      console.error('Error fetching balance:', error);
    }

    res.status(200).json({
      success: true,
      account: {
        sid: account.sid,
        friendlyName: account.friendlyName,
        type: account.type,
        status: account.status,
        dateCreated: account.dateCreated,
        dateUpdated: account.dateUpdated,
        subresourceUris: account.subresourceUris
      },
      balance,
      isTrial: account.type === 'Trial',
      phoneNumbers: phoneNumberDetails,
      configuredFromNumber: fromNumber,
      verifiedNumbers,
      messageServices,
      warnings: [
        account.type === 'Trial' && 'This is a trial account - can only send to verified numbers',
        !phoneNumberDetails?.length && 'No phone numbers found in account',
        balance?.balance === '0.00' && 'Account has zero balance',
        !verifiedNumbers?.length && account.type === 'Trial' && 'No verified phone numbers - you need to verify recipient numbers first'
      ].filter(Boolean)
    });

  } catch (error) {
    console.error('Account check error:', error);
    res.status(500).json({ 
      error: 'Failed to check account',
      details: error.message,
      code: error.code
    });
  }
}