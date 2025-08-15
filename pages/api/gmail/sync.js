import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { accessToken, refreshToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ 
        error: 'Access token required',
        authUrl: '/api/gmail/auth' 
      });
    }

    // Set up OAuth2 client with tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    // Initialize Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get user's email address
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const userEmail = profile.data.emailAddress;

    // Fetch emails from Gmail
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 50,
      q: 'is:unread OR is:important OR from:@pipedrive.com OR from:@realestate.com'
    });

    const messages = response.data.messages || [];
    const emailData = [];

    // Fetch full message details
    for (const message of messages) {
      try {
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id
        });

        const headers = fullMessage.data.payload.headers;
        const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
        const from = headers.find(h => h.name === 'From')?.value || '';
        const to = headers.find(h => h.name === 'To')?.value || '';
        const date = headers.find(h => h.name === 'Date')?.value || '';
        
        // Extract body
        let body = '';
        const parts = fullMessage.data.payload.parts || [fullMessage.data.payload];
        for (const part of parts) {
          if (part.mimeType === 'text/plain' && part.body.data) {
            body = Buffer.from(part.body.data, 'base64').toString('utf-8');
            break;
          }
        }

        // Extract email addresses and match with contacts
        const fromEmail = from.match(/<(.+?)>/) ? from.match(/<(.+?)>/)[1] : from;
        
        // Check if email is from a known contact
        const { data: contact } = await supabase
          .from('contacts')
          .select('*')
          .eq('email', fromEmail)
          .single();

        emailData.push({
          id: message.id,
          threadId: message.threadId,
          subject,
          from,
          fromEmail,
          to,
          date: new Date(date).toISOString(),
          snippet: fullMessage.data.snippet,
          body: body.substring(0, 500), // Limit body length
          labels: fullMessage.data.labelIds || [],
          isUnread: fullMessage.data.labelIds?.includes('UNREAD'),
          isImportant: fullMessage.data.labelIds?.includes('IMPORTANT'),
          contactId: contact?.id || null,
          contactName: contact?.name || null,
          contactCompany: contact?.company || null
        });

      } catch (msgError) {
        console.error(`Error fetching message ${message.id}:`, msgError);
      }
    }

    // Store sync status
    const syncStatus = {
      userEmail,
      lastSync: new Date().toISOString(),
      totalEmails: emailData.length,
      unreadCount: emailData.filter(e => e.isUnread).length,
      importantCount: emailData.filter(e => e.isImportant).length,
      contactEmails: emailData.filter(e => e.contactId).length
    };

    res.status(200).json({
      success: true,
      emails: emailData,
      syncStatus,
      message: `Successfully synced ${emailData.length} emails from Gmail`
    });

  } catch (error) {
    console.error('Gmail sync error:', error);
    
    // Check if it's an auth error
    if (error.code === 401) {
      return res.status(401).json({
        success: false,
        error: 'Gmail authentication expired',
        authUrl: '/api/gmail/auth',
        message: 'Please re-authenticate with Gmail'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to sync Gmail',
      details: error.message
    });
  }
}