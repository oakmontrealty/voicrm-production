import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Clear existing fake contacts first
    await supabase.from('contacts').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // You'll need to provide your actual Pipedrive API credentials
    const pipedriveApiToken = process.env.PIPEDRIVE_API_TOKEN;
    const pipedriveDomain = process.env.PIPEDRIVE_DOMAIN; // e.g. 'yourcompany'
    
    if (!pipedriveApiToken || !pipedriveDomain) {
      return res.status(400).json({
        success: false,
        error: 'Pipedrive API credentials not configured',
        message: 'Please add PIPEDRIVE_API_TOKEN and PIPEDRIVE_DOMAIN to your .env.local file'
      });
    }

    // Fetch ALL real contacts from Pipedrive API (handle pagination)
    let allContacts = [];
    let start = 0;
    let hasMore = true;
    const limit = 500;

    while (hasMore) {
      const pipedriveUrl = `https://${pipedriveDomain}.pipedrive.com/api/v1/persons?api_token=${pipedriveApiToken}&limit=${limit}&start=${start}`;
      
      const response = await fetch(pipedriveUrl);
      const pipedriveData = await response.json();

      if (!pipedriveData.success) {
        throw new Error('Failed to fetch contacts from Pipedrive API');
      }

      if (pipedriveData.data && pipedriveData.data.length > 0) {
        allContacts = allContacts.concat(pipedriveData.data);
        start += limit;
        hasMore = pipedriveData.additional_data?.pagination?.more_items_in_collection || false;
      } else {
        hasMore = false;
      }
    }

    // Transform Pipedrive contacts to our format
    const transformedContacts = allContacts
      .filter(person => person.phone && person.phone.length > 0) // Only contacts with phone numbers
      .map(person => ({
        name: person.name,
        first_name: person.first_name,
        last_name: person.last_name,
        email: person.email && person.email.length > 0 ? person.email[0].value : null,
        phone_number: person.phone[0].value,
        company: person.org_name,
        notes: `Pipedrive ID: ${person.id}. ${person.notes || ''}`.trim(),
        source: 'Pipedrive',
        status: person.active_flag ? 'lead' : 'cold',
        last_contact_date: person.last_activity_date,
        next_follow_up: person.next_activity_date,
        created_at: person.add_time,
        updated_at: person.update_time
      }));

    if (transformedContacts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No contacts with phone numbers found in Pipedrive'
      });
    }

    // Insert real contacts into Supabase
    const { data, error } = await supabase
      .from('contacts')
      .insert(transformedContacts)
      .select();

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      message: `Successfully imported ${transformedContacts.length} real contacts from Pipedrive (ALL contacts with phone numbers)`,
      total_pipedrive_contacts: allContacts.length,
      contacts_with_phones: transformedContacts.length,
      contacts_imported: data.length,
      sample_contacts: data.slice(0, 3).map(c => ({
        name: c.name,
        phone: c.phone_number,
        company: c.company
      }))
    });

  } catch (error) {
    console.error('Pipedrive sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync real Pipedrive contacts',
      details: error.message,
      setup_help: 'Make sure your Pipedrive API token and domain are correctly configured in .env.local'
    });
  }
}