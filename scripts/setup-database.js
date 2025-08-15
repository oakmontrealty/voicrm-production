const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('Setting up Supabase database...');
  
  try {
    // Create contacts table with all fields
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing table if needed (be careful in production!)
        DROP TABLE IF EXISTS contacts CASCADE;
        
        -- Create contacts table with full Pipedrive integration fields
        CREATE TABLE contacts (
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
      `
    });

    if (createError) {
      // If exec_sql doesn't exist, try direct SQL
      console.log('Using direct SQL approach...');
      
      const { error } = await supabase
        .from('contacts')
        .select('id')
        .limit(1);
      
      if (error && error.code === '42P01') {
        console.log('Table does not exist, please create it manually in Supabase dashboard');
        console.log('Copy the SQL from supabase/migrations/001_create_contacts_table.sql');
      } else if (!error) {
        console.log('Contacts table already exists!');
      }
    } else {
      console.log('✅ Database schema created successfully!');
    }

    // Insert test contact
    console.log('Inserting test contact...');
    const testContact = {
      pipedrive_id: 'test-001',
      name: 'Sarah Thompson',
      first_name: 'Sarah',
      last_name: 'Thompson',
      email: 'sarah.thompson@example.com',
      phone_number: '+61412345678',
      all_phones: [
        { value: '+61412345678', label: 'Mobile' },
        { value: '+61298765432', label: 'Office' }
      ],
      all_emails: [
        { value: 'sarah.thompson@example.com', label: 'Work' },
        { value: 'sarah.personal@gmail.com', label: 'Personal' }
      ],
      company: 'Thompson Property Investments',
      status: 'Active',
      lead_score: 8,
      last_activity_date: '2024-12-10T14:30:00Z',
      last_activity_type: 'call',
      last_activity_subject: 'Property valuation discussion',
      next_activity_date: '2024-12-20T10:00:00Z',
      next_activity_type: 'meeting',
      next_activity_subject: 'Review contract terms for Bondi property',
      activities_count: 47,
      done_activities_count: 42,
      undone_activities_count: 5,
      open_deals_count: 2,
      won_deals_count: 3,
      lost_deals_count: 1,
      total_deal_value: 4250000,
      deals: [
        {
          id: 'deal_001',
          title: '45 Beach Road, Bondi - Sale',
          value: 2100000,
          currency: 'AUD',
          status: 'open',
          probability: 75
        },
        {
          id: 'deal_002',
          title: '12 Harbour View, Mosman - Investment',
          value: 1850000,
          currency: 'AUD',
          status: 'open',
          probability: 60
        }
      ],
      notes_count: 23,
      notes: '[2024-12-10] Called to discuss property valuation. Client interested in Bondi beachfront property.',
      recent_notes: [
        {
          content: 'Called to discuss property valuation. Client interested in Bondi beachfront.',
          add_time: '2024-12-10T14:30:00Z',
          user: 'John Agent'
        }
      ],
      owner_name: 'John Agent',
      source: 'Pipedrive',
      sync_time: new Date().toISOString()
    };

    const { data, error: insertError } = await supabase
      .from('contacts')
      .upsert(testContact, { onConflict: 'pipedrive_id' })
      .select();

    if (insertError) {
      console.error('Error inserting test contact:', insertError);
    } else {
      console.log('✅ Test contact inserted successfully!');
    }

    console.log('\n✅ Database setup complete!');
    console.log('\nNext steps:');
    console.log('1. Go to voicrm.com/contacts');
    console.log('2. Click "Sync Pipedrive" to import all your contacts');
    console.log('3. Click on "Sarah Thompson" to see the full contact modal with all data');

  } catch (error) {
    console.error('Setup error:', error);
  }
}

setupDatabase();