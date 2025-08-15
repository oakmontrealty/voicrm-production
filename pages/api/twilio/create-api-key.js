// Create Twilio API Key for browser calling
import twilio from 'twilio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    const client = twilio(accountSid, authToken);
    
    // Create a new API key
    const apiKey = await client.newKeys.create({
      friendlyName: 'VoiCRM Browser Calling Key'
    });
    
    console.log('API Key created:', apiKey.sid);
    
    // Return the credentials to save
    res.status(200).json({
      success: true,
      message: 'API Key created successfully',
      credentials: {
        apiKeySid: apiKey.sid,
        apiKeySecret: apiKey.secret,
        instructions: 'Add these to your .env.local file:',
        env: `TWILIO_API_KEY=${apiKey.sid}\nTWILIO_API_SECRET=${apiKey.secret}`
      }
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({
      error: 'Failed to create API key',
      message: error.message
    });
  }
}