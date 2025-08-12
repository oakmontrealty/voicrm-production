import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

const client = twilio(accountSid, authToken)

export async function makeCall(to: string, url?: string) {
  try {
    const call = await client.calls.create({
      url: url || 'http://demo.twilio.com/docs/voice.xml',
      to: formatAustralianNumber(to),
      from: twilioPhoneNumber!,
      record: true,
      recordingStatusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/recording-status`,
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    })
    return call
  } catch (error) {
    console.error('Call error:', error)
    throw error
  }
}

export async function sendSMS(to: string, body: string) {
  try {
    const message = await client.messages.create({
      body,
      to: formatAustralianNumber(to),
      from: twilioPhoneNumber!,
    })
    return message
  } catch (error) {
    console.error('SMS error:', error)
    throw error
  }
}

export async function getCallRecording(callSid: string) {
  try {
    const recordings = await client.recordings.list({
      callSid,
      limit: 1,
    })
    return recordings[0]
  } catch (error) {
    console.error('Recording error:', error)
    throw error
  }
}

export function formatAustralianNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Handle Australian mobile numbers
  if (cleaned.startsWith('04')) {
    return '+61' + cleaned.substring(1)
  }
  
  // Handle landlines with area code
  if (cleaned.startsWith('0')) {
    return '+61' + cleaned.substring(1)
  }
  
  // Already formatted
  if (cleaned.startsWith('61')) {
    return '+' + cleaned
  }
  
  // Assume it's already in international format
  return phone
}

export function generateAccessToken(identity: string) {
  const AccessToken = twilio.jwt.AccessToken
  const VoiceGrant = AccessToken.VoiceGrant

  const token = new AccessToken(
    accountSid!,
    process.env.TWILIO_API_KEY!,
    process.env.TWILIO_API_SECRET!,
    { identity }
  )

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
    incomingAllow: true,
  })

  token.addGrant(voiceGrant)
  return token.toJwt()
}

export default client