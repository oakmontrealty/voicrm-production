import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Delete all contacts that are not from Pipedrive source
    // Keep only contacts where source is 'Pipedrive' or where company contains our imported companies
    const pipedriveCompanies = [
      'Thompson Real Estate Group',
      'TechFlow Solutions', 
      'Rodriguez Investment Corp',
      'Wilson Family Trust',
      'Foster Enterprise',
      'Kim Holdings',
      'Murphy Development',
      'Liu Investments',
      'Anderson Holdings',
      'Wright & Co'
    ];

    const { data: allContacts, error: fetchError } = await supabase
      .from('contacts')
      .select('id, company, source, name');

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${allContacts.length} total contacts`);

    // Filter contacts to keep only Pipedrive ones
    const pipedriveContacts = allContacts.filter(contact => 
      pipedriveCompanies.includes(contact.company) || 
      contact.source === 'Pipedrive'
    );

    // Get IDs of contacts to delete (non-Pipedrive)
    const contactsToDelete = allContacts.filter(contact => 
      !pipedriveCompanies.includes(contact.company) && 
      contact.source !== 'Pipedrive'
    );

    console.log(`Keeping ${pipedriveContacts.length} Pipedrive contacts`);
    console.log(`Deleting ${contactsToDelete.length} non-Pipedrive contacts`);

    if (contactsToDelete.length > 0) {
      const idsToDelete = contactsToDelete.map(c => c.id);
      
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        throw deleteError;
      }
    }

    res.status(200).json({
      success: true,
      message: `Cleaned up contacts database`,
      pipedrive_contacts_kept: pipedriveContacts.length,
      contacts_deleted: contactsToDelete.length,
      remaining_contacts: pipedriveContacts.map(c => ({
        name: c.name,
        company: c.company
      }))
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup contacts',
      details: error.message
    });
  }
}