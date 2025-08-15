-- VoiCRM Internal Contact Management System
-- All contact data stored internally with full ownership

-- Enhanced contacts table with all information
CREATE TABLE IF NOT EXISTS contacts (
  -- Core Identity
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Personal Information
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  full_name VARCHAR(200) GENERATED ALWAYS AS (
    CASE 
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
      THEN first_name || ' ' || last_name
      ELSE COALESCE(first_name, last_name, '')
    END
  ) STORED,
  
  -- Contact Details
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  work_phone VARCHAR(50),
  whatsapp_number VARCHAR(50),
  
  -- Address Information
  street_address VARCHAR(255),
  unit_number VARCHAR(50),
  city VARCHAR(100),
  state VARCHAR(50),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Australia',
  
  -- Professional Information
  company VARCHAR(200),
  job_title VARCHAR(200),
  industry VARCHAR(100),
  website VARCHAR(255),
  linkedin_url VARCHAR(255),
  
  -- Real Estate Specific
  contact_type VARCHAR(50) CHECK (contact_type IN (
    'lead', 'prospect', 'client', 'past_client', 
    'vendor', 'buyer', 'tenant', 'landlord', 
    'investor', 'developer', 'agent', 'solicitor'
  )),
  lead_source VARCHAR(100),
  property_interest TEXT[],
  budget_min DECIMAL(12, 2),
  budget_max DECIMAL(12, 2),
  preferred_suburbs TEXT[],
  property_type_interest VARCHAR(50)[],
  
  -- Engagement Tracking
  last_contacted TIMESTAMPTZ,
  next_follow_up DATE,
  contact_frequency VARCHAR(50), -- weekly, monthly, quarterly
  preferred_contact_method VARCHAR(50) DEFAULT 'phone',
  best_time_to_contact VARCHAR(100),
  
  -- Communication Preferences
  sms_opted_in BOOLEAN DEFAULT true,
  email_opted_in BOOLEAN DEFAULT true,
  whatsapp_opted_in BOOLEAN DEFAULT false,
  marketing_consent BOOLEAN DEFAULT false,
  
  -- Scoring and Classification
  lead_score INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  lifetime_value DECIMAL(12, 2) DEFAULT 0,
  deal_probability INTEGER CHECK (deal_probability >= 0 AND deal_probability <= 100),
  
  -- Internal Tags and Notes
  tags TEXT[],
  internal_notes TEXT,
  important_dates JSONB, -- birthdays, anniversaries, etc
  custom_fields JSONB,
  
  -- Relationship Management
  referred_by UUID REFERENCES contacts(id),
  spouse_partner_id UUID REFERENCES contacts(id),
  related_contacts UUID[],
  
  -- Status and Workflow
  status VARCHAR(50) DEFAULT 'active',
  pipeline_stage VARCHAR(100),
  assigned_to VARCHAR(255),
  team VARCHAR(100),
  
  -- Social Media
  facebook_url VARCHAR(255),
  instagram_handle VARCHAR(100),
  twitter_handle VARCHAR(100),
  
  -- VoiCRM Specific
  voicrm_id VARCHAR(50) UNIQUE DEFAULT 'VOI-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),
  is_vip BOOLEAN DEFAULT false,
  needs_attention BOOLEAN DEFAULT false,
  do_not_call BOOLEAN DEFAULT false,
  
  -- Data Quality
  data_source VARCHAR(100), -- manual, import, pipedrive, api
  import_id VARCHAR(255),
  external_id VARCHAR(255),
  is_duplicate BOOLEAN DEFAULT false,
  merge_parent_id UUID REFERENCES contacts(id),
  
  -- Indexes for performance
  CONSTRAINT unique_email UNIQUE(email),
  CONSTRAINT unique_phone UNIQUE(phone)
);

-- Create indexes for fast lookups
CREATE INDEX idx_contacts_full_name ON contacts(full_name);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_type ON contacts(contact_type);
CREATE INDEX idx_contacts_assigned ON contacts(assigned_to);
CREATE INDEX idx_contacts_tags ON contacts USING GIN(tags);
CREATE INDEX idx_contacts_suburbs ON contacts USING GIN(preferred_suburbs);
CREATE INDEX idx_contacts_next_follow ON contacts(next_follow_up);
CREATE INDEX idx_contacts_lead_score ON contacts(lead_score DESC);

-- Communication history table
CREATE TABLE IF NOT EXISTS communication_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Communication Details
  type VARCHAR(50) NOT NULL, -- call, sms, whatsapp, email, meeting, note
  direction VARCHAR(20), -- inbound, outbound
  channel VARCHAR(50), -- phone, mobile, whatsapp, email, in-person
  
  -- Content
  subject VARCHAR(255),
  message TEXT,
  attachments JSONB,
  
  -- Call Specific
  duration_seconds INTEGER,
  recording_url VARCHAR(500),
  call_outcome VARCHAR(100),
  
  -- Status
  status VARCHAR(50), -- sent, delivered, read, failed
  delivery_status JSONB,
  
  -- Metadata
  created_by VARCHAR(255),
  twilio_sid VARCHAR(255),
  
  -- Performance
  sentiment_score DECIMAL(3, 2), -- -1 to 1
  ai_summary TEXT,
  tags TEXT[]
);

CREATE INDEX idx_comm_contact ON communication_history(contact_id);
CREATE INDEX idx_comm_created ON communication_history(created_at DESC);
CREATE INDEX idx_comm_type ON communication_history(type);

-- Activities and tasks
CREATE TABLE IF NOT EXISTS contact_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  
  -- Activity Details
  type VARCHAR(50), -- task, appointment, callback, viewing
  title VARCHAR(255),
  description TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  completed_by VARCHAR(255),
  
  -- Metadata
  assigned_to VARCHAR(255),
  priority VARCHAR(20) DEFAULT 'normal',
  tags TEXT[]
);

CREATE INDEX idx_activity_contact ON contact_activities(contact_id);
CREATE INDEX idx_activity_due ON contact_activities(due_date);
CREATE INDEX idx_activity_status ON contact_activities(status);

-- Properties of interest
CREATE TABLE IF NOT EXISTS contact_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  property_id VARCHAR(255),
  
  -- Interest Details
  interest_level VARCHAR(50), -- hot, warm, cold
  first_inquiry TIMESTAMPTZ DEFAULT NOW(),
  last_viewed TIMESTAMPTZ,
  
  -- Actions
  saved BOOLEAN DEFAULT false,
  viewed_count INTEGER DEFAULT 0,
  shared BOOLEAN DEFAULT false,
  
  -- Notes
  notes TEXT
);

-- Documents and files
CREATE TABLE IF NOT EXISTS contact_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Document Details
  name VARCHAR(255),
  type VARCHAR(100), -- contract, id, proof_of_income, etc
  file_url VARCHAR(500),
  file_size INTEGER,
  mime_type VARCHAR(100),
  
  -- Metadata
  uploaded_by VARCHAR(255),
  description TEXT,
  expiry_date DATE,
  is_verified BOOLEAN DEFAULT false
);

-- Create views for easy access
CREATE OR REPLACE VIEW active_leads AS
SELECT * FROM contacts 
WHERE status = 'active' 
  AND contact_type IN ('lead', 'prospect')
  AND do_not_call = false
ORDER BY lead_score DESC, created_at DESC;

CREATE OR REPLACE VIEW vip_contacts AS
SELECT * FROM contacts 
WHERE is_vip = true 
   OR lifetime_value > 100000
ORDER BY lifetime_value DESC;

CREATE OR REPLACE VIEW needs_follow_up AS
SELECT * FROM contacts 
WHERE next_follow_up <= CURRENT_DATE
  AND status = 'active'
  AND do_not_call = false
ORDER BY next_follow_up ASC;

-- Functions for contact management
CREATE OR REPLACE FUNCTION update_contact_engagement(contact_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE contacts 
  SET 
    last_contacted = NOW(),
    engagement_score = engagement_score + 1,
    updated_at = NOW()
  WHERE id = contact_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON contacts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Grant permissions
GRANT ALL ON contacts TO authenticated;
GRANT ALL ON communication_history TO authenticated;
GRANT ALL ON contact_activities TO authenticated;
GRANT ALL ON contact_properties TO authenticated;
GRANT ALL ON contact_documents TO authenticated;