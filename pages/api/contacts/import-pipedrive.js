// Import contacts from Pipedrive with COMPLETE information
import axios from 'axios';

// Increase timeout for large imports
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false,
    // Increase timeout to 5 minutes for large imports
    externalResolver: true,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pipedriveApiKey = '03648df313fd7b592cca520407a20f3bd749afa9'; // Your Pipedrive API key
    
    console.log('Fetching complete contact data from Pipedrive...');
    
    // 1. Fetch ALL persons from Pipedrive with pagination
    let allPersons = [];
    let start = 0;
    let hasMore = true;
    
    console.log('Starting to fetch all contacts from Pipedrive...');
    
    while (hasMore) {
      const personsResponse = await axios.get('https://api.pipedrive.com/v1/persons', {
        params: {
          api_token: pipedriveApiKey,
          start: start,
          limit: 500, // Max allowed per request
          sort: 'add_time DESC'
        }
      });

      if (!personsResponse.data.success) {
        throw new Error('Failed to fetch from Pipedrive');
      }

      const batch = personsResponse.data.data || [];
      allPersons = allPersons.concat(batch);
      
      // Check if there are more pages
      hasMore = personsResponse.data.additional_data?.pagination?.more_items_in_collection || false;
      
      if (hasMore) {
        start = personsResponse.data.additional_data?.pagination?.next_start || start + 500;
        console.log(`Fetched ${allPersons.length} contacts so far...`);
      }
    }
    
    const persons = allPersons;
    console.log(`Found total of ${persons.length} contacts`);
    
    // 2. Fetch all notes
    console.log('Fetching notes...');
    const notesResponse = await axios.get('https://api.pipedrive.com/v1/notes', {
      params: {
        api_token: pipedriveApiKey,
        limit: 1000
      }
    });
    const allNotes = notesResponse.data.data || [];
    
    // 3. Fetch all activities
    console.log('Fetching activities...');
    const activitiesResponse = await axios.get('https://api.pipedrive.com/v1/activities', {
      params: {
        api_token: pipedriveApiKey,
        limit: 1000,
        done: '0,1' // Get both done and undone
      }
    });
    const allActivities = activitiesResponse.data.data || [];
    
    // Helper function to extract email/phone values
    const extractValue = (field) => {
      if (!field) return null;
      if (Array.isArray(field) && field.length > 0) {
        return field[0].value || field[0];
      }
      if (typeof field === 'object' && field.value) {
        return field.value;
      }
      return field;
    };
    
    // Helper function to format Australian phone numbers
    const formatAustralianPhone = (phone) => {
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
    };
    
    // Process contacts with COMPLETE information
    const processedContacts = persons.map(person => {
      // Get all notes for this contact
      const contactNotes = allNotes.filter(note => note.person_id === person.id);
      const notesContent = contactNotes.map(n => n.content).join('\n\n');
      
      // Get all activities for this contact
      const contactActivities = allActivities.filter(act => act.person_id === person.id);
      const lastActivity = contactActivities
        .filter(a => a.done)
        .sort((a, b) => new Date(b.marked_as_done_time || b.update_time) - new Date(a.marked_as_done_time || a.update_time))[0];
      const nextActivity = contactActivities
        .filter(a => !a.done)
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];
      
      // Extract ALL fields from the person object
      const contact = {
        // Core identification
        id: `pd_${person.id}`,
        pipedrive_id: person.id,
        
        // Basic contact info
        name: person.name || 'Unknown',
        first_name: person.first_name || '',
        last_name: person.last_name || '',
        email: extractValue(person.email),
        phone: formatAustralianPhone(extractValue(person.phone)),
        
        // Additional contact details
        address: person.address || '',
        postal_address: person.postal_address || '',
        postal_address_subpremise: person.postal_address_subpremise || '',
        postal_address_street_number: person.postal_address_street_number || '',
        postal_address_route: person.postal_address_route || '',
        postal_address_sublocality: person.postal_address_sublocality || '',
        postal_address_locality: person.postal_address_locality || '',
        postal_address_admin_area_level_1: person.postal_address_admin_area_level_1 || '',
        postal_address_admin_area_level_2: person.postal_address_admin_area_level_2 || '',
        postal_address_country: person.postal_address_country || '',
        postal_address_postal_code: person.postal_address_postal_code || '',
        
        // Organization/Company
        company: person.org_name || person.org_id?.name || '',
        org_id: person.org_id?.value || person.org_id || null,
        org_name: person.org_name || null,
        
        // Owner/Agent information - CRITICAL
        owner_id: person.owner_id?.value || person.owner_id || null,
        owner_name: person.owner_name || person.owner_id?.name || null,
        
        // Labels and categorization
        label: person.label || null,
        label_ids: person.label_ids || [],
        
        // Activity tracking - COMPLETE
        activities_count: person.activities_count || 0,
        done_activities_count: person.done_activities_count || 0,
        undone_activities_count: person.undone_activities_count || 0,
        
        // Last activity details
        last_activity_date: lastActivity?.marked_as_done_time || person.last_activity_date,
        last_activity_id: lastActivity?.id || person.last_activity_id,
        last_activity_subject: lastActivity?.subject || '',
        last_activity_type: lastActivity?.type || '',
        last_activity_note: lastActivity?.note || '',
        
        // Next activity details - IMPORTANT
        next_activity_date: nextActivity?.due_date || person.next_activity_date,
        next_activity_time: nextActivity?.due_time || person.next_activity_time,
        next_activity_subject: nextActivity?.subject || person.next_activity_subject,
        next_activity_type: nextActivity?.type || person.next_activity_type,
        next_activity_note: nextActivity?.note || person.next_activity_note,
        next_activity_duration: nextActivity?.duration || person.next_activity_duration,
        next_activity_id: nextActivity?.id || person.next_activity_id,
        
        // Email communication history
        email_messages_count: person.email_messages_count || 0,
        last_incoming_mail_time: person.last_incoming_mail_time,
        last_outgoing_mail_time: person.last_outgoing_mail_time,
        
        // Deal information
        open_deals_count: person.open_deals_count || 0,
        closed_deals_count: person.closed_deals_count || 0,
        won_deals_count: person.won_deals_count || 0,
        lost_deals_count: person.lost_deals_count || 0,
        related_open_deals_count: person.related_open_deals_count || 0,
        related_closed_deals_count: person.related_closed_deals_count || 0,
        related_won_deals_count: person.related_won_deals_count || 0,
        related_lost_deals_count: person.related_lost_deals_count || 0,
        
        // Notes - COMBINED from all sources
        notes: notesContent || person.notes || '',
        notes_count: contactNotes.length || person.notes_count || 0,
        
        // Files and attachments
        files_count: person.files_count || 0,
        
        // Timestamps
        created_at: person.add_time,
        updated_at: person.update_time,
        first_char: person.first_char,
        
        // Marketing and permissions
        marketing_status: person.marketing_status,
        visible_to: person.visible_to,
        active_flag: person.active_flag,
        
        // Picture
        picture_id: person.picture_id?.value || person.picture_id,
        
        // Timeline events (activities)
        timeline: contactActivities.map(act => ({
          id: act.id,
          type: act.type,
          subject: act.subject,
          done: act.done,
          due_date: act.due_date,
          due_time: act.due_time,
          duration: act.duration,
          note: act.note,
          created_at: act.add_time,
          completed_at: act.marked_as_done_time
        })),
        
        // Source tracking
        source: 'Pipedrive',
        
        // Store ALL custom fields
        custom_fields: {}
      };
      
      // Extract ALL custom fields (40-character hex strings)
      Object.keys(person).forEach(key => {
        if (key.match(/^[a-f0-9]{40}$/)) {
          contact.custom_fields[key] = person[key];
        }
      });
      
      // Store raw data for reference
      contact.raw_data = person;
      
      return contact;
    });

    // Store in global memory for now (in production, save to database)
    if (!global.contacts) {
      global.contacts = [];
    }
    
    // Merge with existing contacts
    processedContacts.forEach(newContact => {
      const existingIndex = global.contacts.findIndex(c => c.pipedrive_id === newContact.pipedrive_id);
      if (existingIndex >= 0) {
        global.contacts[existingIndex] = newContact; // Update existing
      } else {
        global.contacts.push(newContact); // Add new
      }
    });

    console.log(`Successfully imported ${processedContacts.length} contacts from Pipedrive`);

    return res.status(200).json({
      success: true,
      imported: processedContacts.length,
      total: global.contacts.length,
      contacts: processedContacts.slice(0, 10) // Return first 10 as preview
    });

  } catch (error) {
    console.error('Pipedrive import error:', error);
    return res.status(500).json({
      error: 'Failed to import contacts',
      message: error.message,
      details: error.response?.data || error
    });
  }
}