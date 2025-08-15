import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting to fix "Just Call" contacts by cross-referencing with Pipedrive...');
    
    // Get all contacts with "Just Call" in their name
    const { data: justCallContacts, error: fetchError } = await supabase
      .from('contacts')
      .select('*')
      .or('name.ilike.%just call%,name.ilike.%just_call%,name.ilike.%justcall%');

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${justCallContacts?.length || 0} "Just Call" contacts to fix`);

    if (!justCallContacts || justCallContacts.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No "Just Call" contacts found',
        stats: { found: 0, updated: 0, failed: 0 }
      });
    }

    // Fetch from Pipedrive to get real contact details
    const pipedriveApiToken = process.env.PIPEDRIVE_API_TOKEN || '03648df313fd7b592cca520407a20f3bd749afa9';
    const pipedriveDomain = process.env.PIPEDRIVE_DOMAIN || 'oakmontrealty';
    
    let updated = 0;
    let failed = 0;
    const updateResults = [];

    // Process each "Just Call" contact
    for (const contact of justCallContacts) {
      try {
        // Extract phone number from the contact
        let phoneNumber = contact.phone_number;
        
        // If no phone number, try to extract from name (sometimes format is "Just Call 0412345678")
        if (!phoneNumber) {
          const phoneMatch = contact.name.match(/\b0\d{9}\b|\b\+61\d{9}\b|\b61\d{9}\b/);
          if (phoneMatch) {
            phoneNumber = phoneMatch[0];
          }
        }

        if (!phoneNumber) {
          console.log(`No phone number found for contact: ${contact.name}`);
          failed++;
          continue;
        }

        // Normalize phone number for search
        const normalizedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/^\+61/, '0').replace(/^61/, '0');
        
        console.log(`Searching Pipedrive for phone: ${normalizedPhone}`);

        // Search Pipedrive for this phone number
        const searchUrl = `https://${pipedriveDomain}.pipedrive.com/api/v1/persons/search?term=${normalizedPhone}&api_token=${pipedriveApiToken}&search_by_phone=1`;
        
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (searchData.success && searchData.data && searchData.data.items && searchData.data.items.length > 0) {
          // Found matching contact in Pipedrive
          const pipedriveContact = searchData.data.items[0].item;
          
          console.log(`Found Pipedrive match: ${pipedriveContact.name} for phone ${normalizedPhone}`);

          // Update the contact with real Pipedrive data
          const updateData = {
            name: pipedriveContact.name || contact.name,
            first_name: pipedriveContact.first_name || '',
            last_name: pipedriveContact.last_name || '',
            email: pipedriveContact.email && pipedriveContact.email.length > 0 
              ? pipedriveContact.email[0].value 
              : contact.email,
            company: pipedriveContact.org_name || contact.company,
            notes: `${contact.notes || ''}\nUpdated from Pipedrive ID: ${pipedriveContact.id}`.trim(),
            source: 'Pipedrive',
            status: pipedriveContact.active_flag ? 'lead' : contact.status || 'cold',
            last_contact_date: pipedriveContact.last_activity_date || contact.last_contact_date,
            next_follow_up: pipedriveContact.next_activity_date || contact.next_follow_up,
            lead_score: calculateLeadScore(pipedriveContact),
            updated_at: new Date().toISOString(),
            
            // Add all Pipedrive fields
            open_deals_count: pipedriveContact.open_deals_count || 0,
            closed_deals_count: pipedriveContact.closed_deals_count || 0,
            won_deals_count: pipedriveContact.won_deals_count || 0,
            activities_count: pipedriveContact.activities_count || 0,
            done_activities_count: pipedriveContact.done_activities_count || 0,
            undone_activities_count: pipedriveContact.undone_activities_count || 0,
            email_messages_count: pipedriveContact.email_messages_count || 0,
            
            pipedrive_id: pipedriveContact.id,
            pipedrive_data: {
              owner_id: pipedriveContact.owner_id?.value || null,
              owner_name: pipedriveContact.owner_name || null,
              label: pipedriveContact.label,
              visible_to: pipedriveContact.visible_to
            }
          };

          // Update the contact in database
          const { error: updateError } = await supabase
            .from('contacts')
            .update(updateData)
            .eq('id', contact.id);

          if (updateError) {
            console.error(`Failed to update contact ${contact.id}:`, updateError);
            failed++;
          } else {
            updated++;
            updateResults.push({
              oldName: contact.name,
              newName: pipedriveContact.name,
              phone: phoneNumber,
              pipedriveId: pipedriveContact.id
            });
            console.log(`Successfully updated: ${contact.name} -> ${pipedriveContact.name}`);
          }
        } else {
          // No match found in Pipedrive, but we can still clean up the name
          if (phoneNumber && contact.name.toLowerCase().includes('just call')) {
            const cleanName = `Contact ${phoneNumber.slice(-4)}`;
            
            const { error: updateError } = await supabase
              .from('contacts')
              .update({
                name: cleanName,
                notes: `${contact.notes || ''}\nOriginal: ${contact.name}`.trim(),
                updated_at: new Date().toISOString()
              })
              .eq('id', contact.id);

            if (!updateError) {
              updated++;
              updateResults.push({
                oldName: contact.name,
                newName: cleanName,
                phone: phoneNumber,
                pipedriveId: null
              });
            } else {
              failed++;
            }
          } else {
            console.log(`No Pipedrive match found for: ${contact.name} (${phoneNumber})`);
            failed++;
          }
        }

      } catch (contactError) {
        console.error(`Error processing contact ${contact.id}:`, contactError);
        failed++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Fixed ${updated} "Just Call" contacts`,
      stats: {
        found: justCallContacts.length,
        updated,
        failed,
        successRate: ((updated / justCallContacts.length) * 100).toFixed(1) + '%'
      },
      updates: updateResults.slice(0, 10) // Show first 10 updates as sample
    });

  } catch (error) {
    console.error('Error fixing Just Call contacts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fix Just Call contacts',
      details: error.message
    });
  }
}

function calculateLeadScore(person) {
  let score = 5; // Base score
  if (person.won_deals_count > 0) score += Math.min(3, person.won_deals_count);
  if (person.open_deals_count > 0) score += 1;
  if (person.activities_count > 5) score += 1;
  return Math.min(10, score);
}