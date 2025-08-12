import type { NextApiRequest, NextApiResponse } from 'next'
import twilio from 'twilio'
import { supabase } from '../../../lib/supabase'

const accountSid = process.env.TWILIO_ACCOUNT_SID!
const authToken = process.env.TWILIO_AUTH_TOKEN!
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER!

const client = twilio(accountSid, authToken)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { to, contactId } = req.body

    // Format Australian phone number
    const formattedNumber = formatAustralianNumber(to)

    // Create call via Twilio
    const call = await client.calls.create({
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/voice`,
      to: formattedNumber,
      from: twilioPhoneNumber,
      record: true,
      recordingStatusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/recording-status`,
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    })

    // Create call log in database
    await supabase.from('call_logs').insert({
      contact_id: contactId,
      call_sid: call.sid,
      direction: 'outbound',
      status: 'initiated',
    })

    res.status(200).json({ 
      success: true, 
      callSid: call.sid,
      status: call.status 
    })
  } catch (error: any) {
    console.error('Error making call:', error)
    res.status(500).json({ error: error.message })
  }
}

function formatAustralianNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('04')) {
    return '+61' + cleaned.substring(1)
  }
  
  if (cleaned.startsWith('0')) {
    return '+61' + cleaned.substring(1)
  }
  
  if (cleaned.startsWith('61')) {
    return '+' + cleaned
  }
  
  return phone
}