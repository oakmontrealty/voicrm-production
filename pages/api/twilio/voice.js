// Twilio Voice webhook handler for browser-based calling
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { To, From, CallSid } = req.body;
  
  console.log('Voice webhook called:', { To, From, CallSid });

  // Generate TwiML response
  let twiml = '';

  if (To) {
    // Outgoing call from browser
    const formattedNumber = formatPhoneNumber(To);
    
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Dial callerId="${process.env.TWILIO_PHONE_NUMBER || '+61482080888'}">
          <Number>${formattedNumber}</Number>
        </Dial>
      </Response>`;
  } else {
    // Incoming call to browser  
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Dial>
          <Client>voicrm-user</Client>
        </Dial>
      </Response>`;
  }

  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml);
}

function formatPhoneNumber(number) {
  // Remove any non-digit characters except +
  let cleaned = number.replace(/[^\d+]/g, '');
  
  // Add country code if missing
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('0')) {
      // Australian number
      cleaned = '+61' + cleaned.substring(1);
    } else if (cleaned.length === 10) {
      // US number
      cleaned = '+1' + cleaned;
    } else if (!cleaned.startsWith('61') && !cleaned.startsWith('1')) {
      // Default to Australian
      cleaned = '+61' + cleaned;
    } else if (cleaned.startsWith('61')) {
      cleaned = '+' + cleaned;
    }
  }
  
  return cleaned;
}