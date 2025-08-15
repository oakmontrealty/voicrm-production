// Verify Twilio credentials
import twilio from 'twilio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { accountSid, authToken, phoneNumber } = req.body;

  if (!accountSid || !authToken) {
    return res.status(400).json({ 
      success: false, 
      error: 'Account SID and Auth Token are required' 
    });
  }

  try {
    // Create Twilio client with provided credentials
    const client = twilio(accountSid, authToken);
    
    // Try to fetch account details to verify credentials
    const account = await client.api.accounts(accountSid).fetch();
    
    // If we get here, credentials are valid
    console.log('✅ Twilio credentials verified:', account.friendlyName);
    
    // Try to verify the phone number if provided
    let phoneNumberValid = false;
    if (phoneNumber) {
      try {
        const numbers = await client.incomingPhoneNumbers.list({ limit: 20 });
        phoneNumberValid = numbers.some(n => n.phoneNumber === phoneNumber);
      } catch (error) {
        console.log('Could not verify phone number');
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Credentials are valid!',
      account: {
        sid: account.sid,
        friendly_name: account.friendlyName,
        status: account.status,
        date_created: account.dateCreated,
        type: account.type
      },
      phoneNumberValid
    });
  } catch (error) {
    console.error('Credential verification failed:', error.message);
    
    res.status(401).json({
      success: false,
      error: error.message,
      code: error.code,
      message: error.code === 20003 ? 
        'Invalid credentials. Please check your Account SID and Auth Token.' :
        'Failed to verify credentials'
    });
  }
}