import twilio from 'twilio';

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client only on server side
let twilioClient = null;
if (typeof window === 'undefined' && accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

// Format phone number for Australian market
export const formatPhoneNumber = (phone) => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle Australian numbers
  if (cleaned.startsWith('61')) {
    // International format
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    // Local Australian format - convert to international
    return `+61${cleaned.substring(1)}`;
  } else if (cleaned.length === 9) {
    // Missing leading 0 - assume Australian
    return `+61${cleaned}`;
  }
  
  // Default to adding country code if not present
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
};

// Make an outbound call
export const makeCall = async (to, from = twilioPhoneNumber) => {
  if (!twilioClient) {
    throw new Error('Twilio client not initialized. Check your credentials.');
  }

  try {
    const call = await twilioClient.calls.create({
      to: formatPhoneNumber(to),
      from: from || twilioPhoneNumber,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/voice`, // TwiML endpoint
      record: true,
      recordingStatusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/recording`,
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/status`,
    });

    return {
      success: true,
      callSid: call.sid,
      status: call.status,
      direction: call.direction,
      from: call.from,
      to: call.to,
    };
  } catch (error) {
    console.error('Error making call:', error);
    throw error;
  }
};

// Send SMS
export const sendSMS = async (to, body, from = twilioPhoneNumber) => {
  if (!twilioClient) {
    throw new Error('Twilio client not initialized. Check your credentials.');
  }

  try {
    const message = await twilioClient.messages.create({
      body,
      to: formatPhoneNumber(to),
      from: from || twilioPhoneNumber,
    });

    return {
      success: true,
      messageSid: message.sid,
      status: message.status,
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
};

// Get call recording
export const getCallRecording = async (callSid) => {
  if (!twilioClient) {
    throw new Error('Twilio client not initialized.');
  }

  try {
    const recordings = await twilioClient.recordings.list({
      callSid: callSid,
      limit: 1,
    });

    if (recordings.length > 0) {
      const recording = recordings[0];
      return {
        recordingSid: recording.sid,
        duration: recording.duration,
        url: `https://api.twilio.com${recording.uri.replace('.json', '.mp3')}`,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching recording:', error);
    throw error;
  }
};

// Generate capability token for browser-based calling
export const generateAccessToken = (identity) => {
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }

  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;

  // Create access token
  const accessToken = new AccessToken(
    accountSid,
    process.env.TWILIO_API_KEY || accountSid,
    process.env.TWILIO_API_SECRET || authToken,
    { identity }
  );

  // Create voice grant
  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: process.env.TWILIO_APP_SID,
    incomingAllow: true,
  });

  // Add grant to token
  accessToken.addGrant(voiceGrant);

  return accessToken.toJwt();
};

export default twilioClient;