import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error) {
    // User denied access
    return res.redirect('/email?error=access_denied');
  }

  if (!code) {
    return res.status(400).json({ error: 'Authorization code missing' });
  }

  try {
    // Exchange authorization code for tokens
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const redirectUri = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/api/gmail/callback';

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error('Token exchange error:', tokens);
      return res.redirect('/email?error=token_exchange_failed');
    }

    // Get user email
    const userResponse = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const userProfile = await userResponse.json();

    // Store tokens in database (encrypted in production)
    const { error: dbError } = await supabase
      .from('gmail_tokens')
      .upsert({
        email: userProfile.emailAddress,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      });

    if (dbError) {
      console.error('Database error:', dbError);
      // Store in session as fallback
      res.setHeader('Set-Cookie', `gmail_token=${tokens.access_token}; Path=/; HttpOnly; Max-Age=3600`);
    }

    // Redirect back to email page with success
    res.redirect('/email?gmail_connected=true&email=' + encodeURIComponent(userProfile.emailAddress));

  } catch (error) {
    console.error('Gmail callback error:', error);
    res.redirect('/email?error=authentication_failed');
  }
}