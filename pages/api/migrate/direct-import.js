// Direct PipeDrive Import - Bypasses RLS issues
import axios from 'axios';

// Store data in memory for now (in production, use proper database)
global.importedContacts = global.importedContacts || [];

export default async function handler(req, res) {
  const { 
    action = 'import',
    start = 0,
    limit = 500,
    apiKey = '03648df313fd7b592cca520407a20f3bd749afa9'
  } = req.body || req.query || {};

  if (action === 'import') {
    try {
      console.log(`Importing batch: start=${start}, limit=${limit}`);
      
      // Fetch from PipeDrive
      const response = await axios.get('https://api.pipedrive.com/v1/persons', {
        params: {
          api_token: apiKey,
          start,
          limit
        }
      });

      if (!response.data.success) {
        throw new Error('Failed to fetch from PipeDrive');
      }

      const persons = response.data.data || [];
      const batch = [];

      // Process each contact
      for (const person of persons) {
        const contact = {
          id: person.id,
          name: person.name || 'Unknown',
          email: extractValue(person.email),
          phone: formatPhone(extractValue(person.phone)),
          
          // CRITICAL: Owner/Agent assignment
          owner_id: person.owner_id?.value || person.owner_id,
          owner_name: person.owner_name || person.owner_id?.name || 'Unassigned',
          
          // Organization
          organization: person.org_name || person.org_id?.name,
          
          // Label (for filtering)
          label: person.label,
          
          // CRITICAL: Next scheduled activity
          next_activity: {
            date: person.next_activity_date,
            time: person.next_activity_time,
            subject: person.next_activity_subject,
            type: person.next_activity_type,
            note: person.next_activity_note
          },
          
          // Last activity
          last_activity: {
            date: person.last_activity_date,
            id: person.last_activity_id
          },
          
          // Counts
          activities_count: person.activities_count || 0,
          done_activities: person.done_activities_count || 0,
          undone_activities: person.undone_activities_count || 0,
          emails_count: person.email_messages_count || 0,
          notes_count: person.notes_count || 0,
          
          // Deals
          open_deals: person.open_deals_count || 0,
          won_deals: person.won_deals_count || 0,
          lost_deals: person.lost_deals_count || 0,
          
          // Timestamps
          added: person.add_time,
          updated: person.update_time,
          
          // Marketing status
          marketing_status: person.marketing_status
        };

        // Extract custom fields
        const customFields = {};
        Object.keys(person).forEach(key => {
          if (key.match(/^[a-f0-9]{40}$/)) {
            customFields[key] = person[key];
          }
        });
        
        if (Object.keys(customFields).length > 0) {
          contact.custom_fields = customFields;
        }

        batch.push(contact);
        global.importedContacts.push(contact);
      }

      // Get pagination info
      const hasMore = response.data.additional_data?.pagination?.more_items_in_collection || false;
      const nextStart = response.data.additional_data?.pagination?.next_start || (start + limit);
      
      // Get total count if available
      let total = global.importedContacts.length;
      if (start === 0) {
        const countResponse = await axios.get('https://api.pipedrive.com/v1/persons', {
          params: {
            api_token: apiKey,
            limit: 1,
            get_summary: 1
          }
        });
        total = countResponse.data.additional_data?.summary?.total_count || total;
      }

      return res.status(200).json({
        success: true,
        imported: batch.length,
        totalImported: global.importedContacts.length,
        totalInPipedrive: total,
        hasMore,
        nextStart,
        nextUrl: hasMore ? `/api/migrate/direct-import?action=import&start=${nextStart}&limit=${limit}` : null,
        sample: batch.slice(0, 3)
      });

    } catch (error) {
      console.error('Import error:', error);
      return res.status(500).json({
        error: 'Import failed',
        message: error.message
      });
    }
  }

  if (action === 'status') {
    const agents = {};
    const labels = new Set();
    
    // Analyze imported data
    global.importedContacts.forEach(contact => {
      if (contact.owner_name) {
        agents[contact.owner_name] = (agents[contact.owner_name] || 0) + 1;
      }
      if (contact.label) {
        labels.add(contact.label);
      }
    });

    return res.status(200).json({
      success: true,
      totalImported: global.importedContacts.length,
      agents,
      labels: Array.from(labels),
      withNextActivity: global.importedContacts.filter(c => c.next_activity?.date).length,
      withOpenDeals: global.importedContacts.filter(c => c.open_deals > 0).length,
      sample: global.importedContacts.slice(0, 10)
    });
  }

  if (action === 'export') {
    // Export to CSV or JSON
    return res.status(200).json({
      success: true,
      data: global.importedContacts
    });
  }

  if (action === 'clear') {
    global.importedContacts = [];
    return res.status(200).json({
      success: true,
      message: 'Imported data cleared'
    });
  }

  return res.status(400).json({ error: 'Invalid action' });
}

function extractValue(field) {
  if (!field) return null;
  if (Array.isArray(field) && field.length > 0) {
    return field[0].value || field[0];
  }
  if (typeof field === 'object' && field.value) {
    return field.value;
  }
  return field;
}

function formatPhone(phone) {
  if (!phone) return null;
  let cleaned = phone.toString().replace(/\D/g, '');
  if (cleaned.startsWith('61')) {
    return '+' + cleaned;
  } else if (cleaned.startsWith('0')) {
    return '+61' + cleaned.substr(1);
  }
  return phone;
}