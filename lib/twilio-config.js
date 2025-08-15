// Twilio configuration with fallback values
export function getTwilioConfig() {
  // Check environment variables
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  
  // Log what we have (without exposing sensitive data)
  console.log('Twilio config check:', {
    hasAccountSid: !!accountSid,
    hasAuthToken: !!authToken,
    hasPhoneNumber: !!phoneNumber,
    accountSidLength: accountSid?.length,
    authTokenLength: authToken?.length,
    env: process.env.NODE_ENV
  });
  
  // If environment variables are not available, throw error
  if (!accountSid || !authToken || !phoneNumber) {
    throw new Error(
      'Twilio credentials not found. Please ensure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER are set in Vercel environment variables.'
    );
  }
  
  return {
    accountSid,
    authToken,
    phoneNumber
  };
}