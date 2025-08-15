import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { voicemailId, audioUrl, text, callSid } = req.body;

  try {
    if (!callSid) {
      return res.status(400).json({ error: 'No active call found' });
    }

    // If we have audio data (base64), we need to convert it to a URL
    let voicemailUrl;
    
    if (audioUrl && audioUrl.startsWith('data:')) {
      // For now, we'll use TTS as Twilio needs a public URL for audio
      // In production, you'd upload the audio to S3/Cloudinary and get a public URL
      voicemailUrl = null;
    } else if (text) {
      // Use Twilio's text-to-speech
      voicemailUrl = null;
    }

    // Update the call to play the voicemail
    const call = await client.calls(callSid).update({
      twiml: `
        <Response>
          <Say voice="alice" language="en-US">
            ${text || 'Thank you for your call. Please leave a message after the beep.'}
          </Say>
          <Pause length="1"/>
          <Hangup/>
        </Response>
      `
    });

    // Log the voicemail drop
    console.log(`Voicemail dropped on call ${callSid}`);

    res.status(200).json({ 
      success: true, 
      message: 'Voicemail dropped successfully',
      callSid: call.sid 
    });

  } catch (error) {
    console.error('Error dropping voicemail:', error);
    res.status(500).json({ 
      error: 'Failed to drop voicemail',
      details: error.message 
    });
  }
}