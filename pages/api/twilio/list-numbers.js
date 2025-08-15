import twilio from 'twilio';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      return res.status(500).json({ error: 'Twilio credentials not configured' });
    }

    const client = twilio(accountSid, authToken);

    // Fetch all phone numbers from your Twilio account
    const phoneNumbers = await client.incomingPhoneNumbers.list();

    // Format the numbers for display
    const formattedNumbers = phoneNumbers.map(number => ({
      sid: number.sid,
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName,
      capabilities: {
        voice: number.capabilities.voice,
        sms: number.capabilities.sms,
        mms: number.capabilities.mms,
        fax: number.capabilities.fax
      },
      dateCreated: number.dateCreated,
      dateUpdated: number.dateUpdated,
      status: number.status || 'active',
      // Determine type based on capabilities and number format
      type: determinePhoneType(number),
      // Australian specific formatting
      formattedNumber: formatAustralianNumber(number.phoneNumber),
      isAustralian: number.phoneNumber.startsWith('+61')
    }));

    // Sort Australian numbers first
    formattedNumbers.sort((a, b) => {
      if (a.isAustralian && !b.isAustralian) return -1;
      if (!a.isAustralian && b.isAustralian) return 1;
      return 0;
    });

    res.status(200).json({
      success: true,
      numbers: formattedNumbers,
      total: formattedNumbers.length,
      australianNumbers: formattedNumbers.filter(n => n.isAustralian).length
    });

  } catch (error) {
    console.error('Error fetching Twilio numbers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch phone numbers',
      details: error.message 
    });
  }
}

function determinePhoneType(number) {
  const phoneNumber = number.phoneNumber;
  
  // Australian mobile numbers
  if (phoneNumber.match(/^\+614\d{8}$/)) {
    return 'Mobile (AU)';
  }
  
  // Australian landline numbers
  if (phoneNumber.match(/^\+612\d{8}$/)) {
    return 'Landline (Sydney)';
  }
  if (phoneNumber.match(/^\+613\d{8}$/)) {
    return 'Landline (Melbourne)';
  }
  if (phoneNumber.match(/^\+617\d{8}$/)) {
    return 'Landline (Brisbane)';
  }
  if (phoneNumber.match(/^\+618\d{8}$/)) {
    return 'Landline (Perth/Adelaide)';
  }
  
  // Australian toll-free
  if (phoneNumber.match(/^\+611800\d{6}$/)) {
    return 'Toll-Free (AU)';
  }
  
  // Check capabilities
  if (number.capabilities.voice && number.capabilities.sms) {
    return 'Voice + SMS';
  } else if (number.capabilities.voice) {
    return 'Voice Only';
  } else if (number.capabilities.sms) {
    return 'SMS Only';
  }
  
  return 'Standard';
}

function formatAustralianNumber(phoneNumber) {
  // Format Australian numbers nicely
  if (phoneNumber.startsWith('+61')) {
    const cleaned = phoneNumber.replace('+61', '');
    
    // Mobile: +61 4XX XXX XXX
    if (cleaned.startsWith('4') && cleaned.length === 9) {
      return `+61 4${cleaned.slice(1, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    
    // Landline: +61 2 XXXX XXXX
    if (cleaned.length === 9) {
      return `+61 ${cleaned[0]} ${cleaned.slice(1, 5)} ${cleaned.slice(5)}`;
    }
    
    // Toll-free: +61 1800 XXX XXX
    if (cleaned.startsWith('1800')) {
      return `+61 1800 ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
  }
  
  return phoneNumber;
}