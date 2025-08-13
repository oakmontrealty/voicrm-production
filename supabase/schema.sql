-- VoiCRM Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  company VARCHAR(255),
  status VARCHAR(50) DEFAULT 'New Lead',
  value DECIMAL(10, 2) DEFAULT 0,
  source VARCHAR(100) DEFAULT 'Voice Input',
  tags TEXT[],
  notes TEXT,
  last_contact TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Calls table
CREATE TABLE IF NOT EXISTS calls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  phone_number VARCHAR(50) NOT NULL,
  direction VARCHAR(20) CHECK (direction IN ('inbound', 'outbound')),
  duration INTEGER DEFAULT 0,
  status VARCHAR(50),
  recording_url TEXT,
  transcription TEXT,
  summary TEXT,
  sentiment VARCHAR(20),
  call_sid VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Messages table (SMS)
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  phone_number VARCHAR(50) NOT NULL,
  direction VARCHAR(20) CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  status VARCHAR(50),
  message_sid VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'General',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pipeline deals table
CREATE TABLE IF NOT EXISTS deals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  value DECIMAL(10, 2) DEFAULT 0,
  stage VARCHAR(100) DEFAULT 'New',
  probability INTEGER DEFAULT 0,
  expected_close DATE,
  property_address TEXT,
  property_type VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP,
  completed BOOLEAN DEFAULT FALSE,
  priority VARCHAR(20) DEFAULT 'Medium',
  type VARCHAR(50) DEFAULT 'Follow-up',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_calls_contact_id ON calls(contact_id);
CREATE INDEX idx_calls_created_at ON calls(created_at);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_completed ON tasks(completed);

-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth setup)
-- For now, allowing all operations (update when you add authentication)
CREATE POLICY "Allow all for contacts" ON contacts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for calls" ON calls
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for messages" ON messages
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for notes" ON notes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for deals" ON deals
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for tasks" ON tasks
  FOR ALL USING (true) WITH CHECK (true);

-- Sample data for testing
INSERT INTO contacts (name, phone, email, company, status, value, source)
VALUES 
  ('Sarah Wilson', '0400-123-456', 'sarah@example.com', 'Wilson Properties', 'Hot Lead', 450000, 'Voice Input'),
  ('Michael Chen', '0412-987-654', 'michael@example.com', 'Chen Investments', 'Qualified', 750000, 'Manual Entry'),
  ('Emma Thompson', '0423-456-789', 'emma@example.com', 'Thompson Realty', 'New Lead', 0, 'Website');

-- Success message
SELECT 'VoiCRM Database Setup Complete!' as message;