-- Create contacts table with full Pipedrive integration fields
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  pipedrive_id TEXT UNIQUE,
  
  -- Basic Information
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone_number TEXT,
  all_phones JSONB DEFAULT '[]',
  all_emails JSONB DEFAULT '[]',
  company TEXT,
  org_id TEXT,
  
  -- Status and Scoring
  status TEXT DEFAULT 'lead',
  lead_score INTEGER DEFAULT 5,
  visible_to TEXT,
  
  -- Activity Data
  last_activity_date TIMESTAMPTZ,
  last_activity_type TEXT,
  last_activity_subject TEXT,
  next_activity_date TIMESTAMPTZ,
  next_activity_type TEXT,
  next_activity_subject TEXT,
  activities_count INTEGER DEFAULT 0,
  done_activities_count INTEGER DEFAULT 0,
  undone_activities_count INTEGER DEFAULT 0,
  
  -- Deal Data
  open_deals_count INTEGER DEFAULT 0,
  won_deals_count INTEGER DEFAULT 0,
  lost_deals_count INTEGER DEFAULT 0,
  closed_deals_count INTEGER DEFAULT 0,
  total_deal_value DECIMAL(15,2) DEFAULT 0,
  deals JSONB DEFAULT '[]',
  
  -- Communication Data
  email_messages_count INTEGER DEFAULT 0,
  notes_count INTEGER DEFAULT 0,
  notes TEXT,
  recent_notes JSONB DEFAULT '[]',
  
  -- Metadata
  owner_name TEXT,
  owner_id TEXT,
  picture_url TEXT,
  custom_fields JSONB DEFAULT '{}',
  
  -- Attention Flags
  needs_attention BOOLEAN DEFAULT false,
  attention_reasons TEXT[],
  
  -- Tracking
  source TEXT DEFAULT 'Manual',
  sync_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- User Association
  user_id TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_pipedrive_id ON contacts(pipedrive_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_needs_attention ON contacts(needs_attention);
CREATE INDEX IF NOT EXISTS idx_contacts_next_activity ON contacts(next_activity_date);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);

-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all contacts" ON contacts
  FOR SELECT USING (true);

CREATE POLICY "Users can insert contacts" ON contacts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update contacts" ON contacts
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete contacts" ON contacts
  FOR DELETE USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();