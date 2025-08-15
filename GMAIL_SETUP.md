# Gmail Integration Setup for VoiCRM

## Fix for Error 401: invalid_client

The Gmail sync authentication error occurs because Google OAuth requires proper client credentials. Follow these steps:

## 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

## 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Configure OAuth consent screen first if needed:
   - Choose "External" user type
   - Fill in app name: "VoiCRM"
   - Add your email as support email
   - Add authorized domains (localhost for dev)
4. For OAuth client ID:
   - Application type: "Web application"
   - Name: "VoiCRM Gmail Integration"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - Your production URL
   - Authorized redirect URIs:
     - `http://localhost:3000/api/gmail/callback`
     - Your production URL + `/api/gmail/callback`

## 3. Add Credentials to .env.local

```env
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REDIRECT_URI=http://localhost:3000/api/gmail/callback
```

## 4. Test Scopes

For development, you may need to add test users:
1. Go to OAuth consent screen
2. Add test users (your email)
3. This allows testing before app verification

## 5. Common Issues

- **Error 401**: Client ID is invalid or not configured
- **Error 400**: Redirect URI mismatch - ensure it matches exactly
- **Scope errors**: User didn't grant required permissions

## Required Scopes

- `gmail.readonly` - Read emails
- `gmail.send` - Send emails
- `gmail.compose` - Create drafts
- `gmail.modify` - Mark as read/unread

## Testing

1. Click "Sync Gmail" button in VoiCRM
2. Authenticate with Google
3. Grant all requested permissions
4. You'll be redirected back to VoiCRM