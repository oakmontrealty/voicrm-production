// Batch PipeDrive Migration - Processes contacts in chunks
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { 
    start = 0,
    limit = 100,
    apiKey = '03648df313fd7b592cca520407a20f3bd749afa9'
  } = req.body || {};

  try {
    console.log(`Processing batch: start=${start}, limit=${limit}`);
    
    // Fetch batch from PipeDrive
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
    const stats = {
      fetched: persons.length,
      migrated: 0,
      failed: 0,
      contacts: []
    };

    // Process each contact
    for (const person of persons) {
      try {
        const contact = {
          pipedrive_id: person.id,
          name: person.name || 'Unknown',
          email: extractValue(person.email),
          phone_number: formatPhone(extractValue(person.phone)),
          
          // Owner/Agent info
          owner_id: person.owner_id?.value || person.owner_id,
          owner_name: person.owner_name || person.owner_id?.name,
          
          // Organization
          organization_id: person.org_id?.value,
          organization_name: person.org_name || person.org_id?.name,
          
          // Labels
          label: person.label,
          
          // Activity counts
          activities_count: person.activities_count || 0,
          done_activities_count: person.done_activities_count || 0,
          undone_activities_count: person.undone_activities_count || 0,
          
          // Last activity
          last_activity_date: person.last_activity_date,
          last_activity_id: person.last_activity_id,
          
          // Next activity - CRITICAL for follow-ups
          next_activity_date: person.next_activity_date,
          next_activity_time: person.next_activity_time,
          next_activity_subject: person.next_activity_subject,
          next_activity_type: person.next_activity_type,
          next_activity_note: person.next_activity_note,
          next_activity_id: person.next_activity_id,
          
          // Communication
          email_messages_count: person.email_messages_count || 0,
          last_incoming_mail_time: person.last_incoming_mail_time,
          last_outgoing_mail_time: person.last_outgoing_mail_time,
          
          // Deals
          open_deals_count: person.open_deals_count || 0,
          closed_deals_count: person.closed_deals_count || 0,
          won_deals_count: person.won_deals_count || 0,
          lost_deals_count: person.lost_deals_count || 0,
          
          // Files & Notes
          files_count: person.files_count || 0,
          notes_count: person.notes_count || 0,
          
          // Marketing
          marketing_status: person.marketing_status,
          
          // Timestamps
          created_at: person.add_time,
          updated_at: person.update_time || new Date(),
          
          // Source
          source: 'pipedrive_batch'
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

        // Insert into Supabase
        const { error } = await supabase
          .from('contacts')
          .upsert(contact, { 
            onConflict: 'pipedrive_id',
            ignoreDuplicates: false 
          });

        if (error) throw error;
        
        stats.migrated++;
        stats.contacts.push({
          id: person.id,
          name: person.name,
          owner: contact.owner_name,
          next_activity: contact.next_activity_date
        });
        
      } catch (error) {
        console.error(`Failed to migrate contact ${person.name}:`, error.message);
        stats.failed++;
      }
    }

    // Check if there are more contacts
    const hasMore = response.data.additional_data?.pagination?.more_items_in_collection || false;
    const nextStart = response.data.additional_data?.pagination?.next_start || (start + limit);
    const total = response.data.additional_data?.pagination?.total || 0;

    return res.status(200).json({
      success: true,
      stats,
      pagination: {
        start,
        limit,
        hasMore,
        nextStart,
        total: total || 'counting...'
      },
      nextBatchUrl: hasMore ? `/api/migrate/pipedrive-batch?start=${nextStart}&limit=${limit}` : null
    });

  } catch (error) {
    console.error('Batch migration error:', error);
    return res.status(500).json({
      error: 'Batch migration failed',
      message: error.message,
      batch: { start, limit }
    });
  }
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
  } else if (!cleaned.startsWith('+')) {
    return '+61' + cleaned;
  }
  return phone;
}