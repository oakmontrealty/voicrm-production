# Vercel Environment Variables Setup

Run these commands to set up all environment variables in Vercel:

```bash
# Supabase Configuration
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Value: https://didmparfeydjbcuzgaif.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZG1wYXJmZXlkamJjdXpnYWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MzQ4MjMsImV4cCI6MjA2OTUxMDgyM30.3pQvnFHqjLJwEZhDkFsVs6-SPqe87DNf2m0YuVbEuvw

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZG1wYXJmZXlkamJjdXpnYWlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkzNDgyMywiZXhwIjoyMDY5NTEwODIzfQ.KET-8EUiKZugi4ZFPCIQG4GRnV6IQv50hdh7sC2GmUk

# Pipedrive Configuration
vercel env add PIPEDRIVE_API_TOKEN production
# Value: 03648df313fd7b592cca520407a20f3bd749afa9

vercel env add PIPEDRIVE_DOMAIN production
# Value: oakmontrealty

# Twilio Configuration (already set)
# OpenAI Configuration (already set)
```

## Manual Steps in Vercel Dashboard:

1. Go to https://vercel.com/dashboard
2. Select your voicrm project
3. Go to Settings → Environment Variables
4. Add each of the above variables with their values
5. Redeploy the application

## Database Setup:

1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project (didmparfeydjbcuzgaif)
3. Go to SQL Editor
4. Run the migration script from `/supabase/migrations/001_create_contacts_table.sql`
5. This will create the contacts table with all necessary fields

## After Setup:

1. Visit voicrm.com/contacts
2. Click "Sync Pipedrive" button
3. This will import all contacts from Pipedrive into Supabase
4. All future operations will use the Supabase database
5. Contacts will have full history, activities, notes, and deals data