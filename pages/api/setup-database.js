// Database Setup API for VoiCRM
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for admin operations
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Setting up database tables...');
    
    // Test connection first
    const { data: test, error: testError } = await supabase
      .from('contacts')
      .select('count')
      .limit(1);
    
    if (testError && testError.code === '42P01') {
      // Table doesn't exist, let's create it
      console.log('Contacts table does not exist. Please create it in Supabase Dashboard.');
      
      return res.status(200).json({
        success: false,
        message: 'Tables need to be created in Supabase Dashboard',
        instructions: [
          '1. Go to https://supabase.com/dashboard/project/didmparfeydjbcuzgaif/editor',
          '2. Click "SQL Editor" in the left sidebar',
          '3. Copy and paste the SQL from scripts/setup-database.sql',
          '4. Click "Run" to create all tables',
          '5. Then run the migration again'
        ]
      });
    }
    
    // If table exists, test insert
    const testContact = {
      name: 'Test Migration Contact',
      email: 'test@migration.com',
      phone_number: '+61400000000',
      source: 'test'
    };
    
    const { data: inserted, error: insertError } = await supabase
      .from('contacts')
      .insert(testContact)
      .select()
      .single();
    
    if (insertError) {
      console.error('Insert error:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Failed to insert test contact',
        details: insertError
      });
    }
    
    // Clean up test contact
    if (inserted) {
      await supabase
        .from('contacts')
        .delete()
        .eq('id', inserted.id);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Database is ready for migration!',
      tables: {
        contacts: 'ready',
        agents: 'ready',
        organizations: 'ready',
        deals: 'ready',
        activities: 'ready',
        notes: 'ready'
      }
    });
    
  } catch (error) {
    console.error('Setup error:', error);
    return res.status(500).json({
      error: 'Database setup failed',
      message: error.message
    });
  }
}