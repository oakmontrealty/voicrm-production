// Simplified Gmail OAuth without googleapis package
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Gmail OAuth2 configuration
    const clientId = process.env.GMAIL_CLIENT_ID || 'your-client-id.apps.googleusercontent.com';
    const redirectUri = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/api/gmail/callback';
    
    // Scopes for Gmail access
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.modify'
    ].join(' ');

    // Generate OAuth2 URL manually
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `access_type=offline&` +
      `prompt=consent`;

    res.status(200).json({
      success: true,
      authUrl,
      message: 'Redirect user to this URL to authenticate with Gmail'
    });

  } catch (error) {
    console.error('Gmail auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate Gmail auth URL',
      details: error.message
    });
  }
}