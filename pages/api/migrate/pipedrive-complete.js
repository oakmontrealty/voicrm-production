// Complete PipeDrive Migration - Extracts EVERYTHING
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    pipedriveApiKey = '03648df313fd7b592cca520407a20f3bd749afa9',
    batchSize = 50,
    startFrom = 0
  } = req.body;

  const stats = {
    contacts: { total: 0, processed: 0, migrated: 0, failed: 0 },
    agents: new Set(),
    labels: new Set(),
    customFields: new Set()
  };

  try {
    console.log('🚀 Starting complete PipeDrive migration...');
    
    // Step 1: Get total count
    const countResponse = await axios.get('https://api.pipedrive.com/v1/persons', {
      params: {
        api_token: pipedriveApiKey,
        limit: 1,
        get_summary: 1
      }
    });
    
    stats.contacts.total = countResponse.data.additional_data?.summary?.total_count || 0;
    console.log(`📊 Found ${stats.contacts.total} total contacts`);

    // Step 2: Get all users/agents first
    const usersResponse = await axios.get('https://api.pipedrive.com/v1/users', {
      params: { api_token: pipedriveApiKey }
    });
    
    const agents = {};
    for (const user of usersResponse.data.data || []) {
      agents[user.id] = {
        id: user.id,
        name: user.name,
        email: user.email,
        active: user.active_flag
      };
      stats.agents.add(user.name);
      
      // Store agent in Supabase
      await supabase
        .from('agents')
        .upsert({
          pipedrive_id: user.id,
          name: user.name,
          email: user.email,
          active: user.active_flag,
          created_at: new Date()
        }, { onConflict: 'pipedrive_id' });
    }
    
    console.log(`👥 Found ${Object.keys(agents).length} agents`);

    // Step 3: Process contacts in batches
    let start = startFrom;
    let hasMore = true;
    const allContacts = [];

    while (hasMore && stats.contacts.processed < stats.contacts.total) {
      // Fetch batch
      const response = await axios.get('https://api.pipedrive.com/v1/persons', {
        params: {
          api_token: pipedriveApiKey,
          start,
          limit: batchSize
        }
      });

      const persons = response.data.data || [];
      
      if (persons.length === 0) {
        hasMore = false;
        break;
      }

      // Process each contact with COMPLETE data
      for (const person of persons) {
        stats.contacts.processed++;
        
        try {
          // Extract ALL fields
          const contact = {
            // Core fields
            pipedrive_id: person.id,
            name: person.name || 'Unknown',
            
            // Contact info
            email: extractValue(person.email),
            phone: formatAustralianPhone(extractValue(person.phone)),
            
            // Agent/Owner info - CRITICAL
            owner_id: person.owner_id?.value || person.owner_id || null,
            owner_name: person.owner_name || agents[person.owner_id?.value]?.name || null,
            assigned_agent: agents[person.owner_id?.value] || null,
            
            // Organization
            org_id: person.org_id?.value || null,
            org_name: person.org_name || null,
            
            // Labels and tags
            label: person.label || null,
            labels: person.label ? [person.label] : [],
            
            // Activity tracking
            activities_count: person.activities_count || 0,
            done_activities_count: person.done_activities_count || 0,
            undone_activities_count: person.undone_activities_count || 0,
            last_activity_date: person.last_activity_date,
            last_activity_id: person.last_activity_id,
            
            // Next scheduled activity - IMPORTANT
            next_activity_date: person.next_activity_date,
            next_activity_time: person.next_activity_time,
            next_activity_subject: person.next_activity_subject,
            next_activity_type: person.next_activity_type,
            next_activity_note: person.next_activity_note,
            next_activity_duration: person.next_activity_duration,
            next_activity_id: person.next_activity_id,
            
            // Communication history
            email_messages_count: person.email_messages_count || 0,
            last_incoming_mail_time: person.last_incoming_mail_time,
            last_outgoing_mail_time: person.last_outgoing_mail_time,
            
            // Deals
            open_deals_count: person.open_deals_count || 0,
            closed_deals_count: person.closed_deals_count || 0,
            won_deals_count: person.won_deals_count || 0,
            lost_deals_count: person.lost_deals_count || 0,
            
            // Files and notes
            files_count: person.files_count || 0,
            notes_count: person.notes_count || 0,
            
            // Timestamps
            add_time: person.add_time,
            update_time: person.update_time,
            first_char: person.first_char,
            
            // Marketing
            marketing_status: person.marketing_status,
            
            // Custom fields - extract ALL
            custom_fields: {},
            
            // Full raw data
            raw_data: person
          };

          // Extract ALL custom fields
          Object.keys(person).forEach(key => {
            // Custom fields in PipeDrive are 40-character hex strings
            if (key.match(/^[a-f0-9]{40}$/)) {
              contact.custom_fields[key] = person[key];
              stats.customFields.add(key);
            }
          });

          // Track labels
          if (person.label) {
            stats.labels.add(person.label);
          }

          // Store in Supabase with ALL data
          const { error } = await supabase
            .from('contacts')
            .upsert({
              pipedrive_id: contact.pipedrive_id,
              name: contact.name,
              email: contact.email,
              phone_number: contact.phone,
              owner_name: contact.owner_name,
              owner_id: contact.owner_id,
              organization_name: contact.org_name,
              organization_id: contact.org_id,
              label: contact.label,
              activities_count: contact.activities_count,
              done_activities_count: contact.done_activities_count,
              undone_activities_count: contact.undone_activities_count,
              last_activity_date: contact.last_activity_date,
              next_activity_date: contact.next_activity_date,
              next_activity_time: contact.next_activity_time,
              next_activity_subject: contact.next_activity_subject,
              next_activity_type: contact.next_activity_type,
              email_messages_count: contact.email_messages_count,
              open_deals_count: contact.open_deals_count,
              closed_deals_count: contact.closed_deals_count,
              won_deals_count: contact.won_deals_count,
              lost_deals_count: contact.lost_deals_count,
              files_count: contact.files_count,
              notes_count: contact.notes_count,
              marketing_status: contact.marketing_status,
              custom_fields: contact.custom_fields,
              raw_data: contact.raw_data,
              created_at: contact.add_time,
              updated_at: contact.update_time || new Date(),
              source: 'pipedrive_complete'
            }, { onConflict: 'pipedrive_id' });

          if (error) throw error;

          stats.contacts.migrated++;
          allContacts.push(contact);

        } catch (error) {
          console.error(`Failed to migrate contact ${person.name}:`, error);
          stats.contacts.failed++;
        }
      }

      // Update progress
      const progress = Math.round((stats.contacts.processed / stats.contacts.total) * 100);
      console.log(`Progress: ${stats.contacts.processed}/${stats.contacts.total} (${progress}%)`);
      console.log(`Migrated: ${stats.contacts.migrated}, Failed: ${stats.contacts.failed}`);

      // Check for more data
      hasMore = response.data.additional_data?.pagination?.more_items_in_collection || false;
      if (hasMore) {
        start = response.data.additional_data?.pagination?.next_start || (start + batchSize);
      }

      // Send progress update
      if (stats.contacts.processed % 100 === 0) {
        console.log(`
=== PROGRESS UPDATE ===
Processed: ${stats.contacts.processed}/${stats.contacts.total}
Migrated: ${stats.contacts.migrated}
Failed: ${stats.contacts.failed}
Agents found: ${stats.agents.size}
Labels found: ${stats.labels.size}
Custom fields: ${stats.customFields.size}
======================`);
      }
    }

    // Step 4: Now fetch ALL notes for all contacts
    console.log('📝 Fetching all notes...');
    const notesResponse = await axios.get('https://api.pipedrive.com/v1/notes', {
      params: {
        api_token: pipedriveApiKey,
        limit: 500
      }
    });

    for (const note of notesResponse.data.data || []) {
      await supabase
        .from('notes')
        .upsert({
          pipedrive_id: note.id,
          content: note.content,
          contact_id: note.person_id,
          deal_id: note.deal_id,
          organization_id: note.org_id,
          created_at: note.add_time,
          updated_at: note.update_time,
          created_by: note.user_id,
          source: 'pipedrive_complete'
        }, { onConflict: 'pipedrive_id' });
    }

    // Step 5: Fetch ALL activities
    console.log('📅 Fetching all activities...');
    const activitiesResponse = await axios.get('https://api.pipedrive.com/v1/activities', {
      params: {
        api_token: pipedriveApiKey,
        limit: 500,
        done: '0,1'
      }
    });

    for (const activity of activitiesResponse.data.data || []) {
      await supabase
        .from('activities')
        .upsert({
          pipedrive_id: activity.id,
          subject: activity.subject,
          type: activity.type,
          completed: activity.done,
          due_date: activity.due_date,
          due_time: activity.due_time,
          duration: activity.duration,
          contact_id: activity.person_id,
          deal_id: activity.deal_id,
          notes: activity.note,
          created_at: activity.add_time,
          completed_at: activity.marked_as_done_time,
          assigned_agent_id: activity.owner_id,
          source: 'pipedrive_complete'
        }, { onConflict: 'pipedrive_id' });
    }

    // Final summary
    const summary = {
      success: true,
      message: 'Complete migration finished',
      stats: {
        contacts: {
          total: stats.contacts.total,
          processed: stats.contacts.processed,
          migrated: stats.contacts.migrated,
          failed: stats.contacts.failed
        },
        agents: Array.from(stats.agents),
        labels: Array.from(stats.labels),
        customFields: Array.from(stats.customFields),
        notes: notesResponse.data.data?.length || 0,
        activities: activitiesResponse.data.data?.length || 0
      },
      sampleContacts: allContacts.slice(0, 5)
    };

    console.log('✅ Migration complete!');
    console.log(summary);

    return res.status(200).json(summary);

  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({
      error: 'Migration failed',
      message: error.message,
      stats
    });
  }
}

// Helper functions
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

function formatAustralianPhone(phone) {
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

// Increase timeout for large migrations
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false,
    externalResolver: true,
    // Increase timeout to 10 minutes for large migrations
    maxDuration: 600
  },
};