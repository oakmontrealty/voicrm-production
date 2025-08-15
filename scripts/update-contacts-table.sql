-- Add missing columns to existing contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS pipedrive_id TEXT UNIQUE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS all_phones JSONB DEFAULT '[]';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS all_emails JSONB DEFAULT '[]';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS org_id TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 5;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS visible_to TEXT;

-- Activity columns
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_activity_type TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_activity_subject TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS next_activity_date TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS next_activity_type TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS next_activity_subject TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS activities_count INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS done_activities_count INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS undone_activities_count INTEGER DEFAULT 0;

-- Deal columns
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS open_deals_count INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS won_deals_count INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lost_deals_count INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS closed_deals_count INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS total_deal_value DECIMAL(15,2) DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS deals JSONB DEFAULT '[]';

-- Communication columns
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS email_messages_count INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS notes_count INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS recent_notes JSONB DEFAULT '[]';

-- Metadata columns
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS owner_id TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS picture_url TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';

-- Attention columns
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS needs_attention BOOLEAN DEFAULT false;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS attention_reasons TEXT[];

-- Tracking columns
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Manual';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS sync_time TIMESTAMPTZ;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contacts_pipedrive_id ON contacts(pipedrive_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_needs_attention ON contacts(needs_attention);
CREATE INDEX IF NOT EXISTS idx_contacts_next_activity ON contacts(next_activity_date);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);