import axios from 'axios';

const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;
const PIPEDRIVE_DOMAIN = process.env.PIPEDRIVE_DOMAIN || 'api';

export default async function handler(req, res) {
  const { method } = req;

  if (method !== 'GET' && method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!PIPEDRIVE_API_TOKEN) {
    return res.status(500).json({ error: 'Pipedrive API token not configured' });
  }

  try {
    // Fetch all persons with full details
    const personsUrl = `https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1/persons`;
    const personsResponse = await axios.get(personsUrl, {
      params: {
        api_token: PIPEDRIVE_API_TOKEN,
        limit: 500,
        include_fields: 'id,name,email,phone,org_id,add_time,update_time,visible_to,picture_id,next_activity_date,next_activity_time,next_activity_id,last_activity_date,last_activity_time,last_activity_id,label,org_name,owner_name,cc_email'
      }
    });

    const persons = personsResponse.data.data || [];
    const contacts = [];

    // Process each person and fetch their activities and notes
    for (const person of persons) {
      try {
        // Fetch notes for this person
        const notesUrl = `https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1/persons/${person.id}/notes`;
        const notesResponse = await axios.get(notesUrl, {
          params: {
            api_token: PIPEDRIVE_API_TOKEN,
            limit: 100
          }
        });
        
        // Fetch activities for this person
        const activitiesUrl = `https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1/persons/${person.id}/activities`;
        const activitiesResponse = await axios.get(activitiesUrl, {
          params: {
            api_token: PIPEDRIVE_API_TOKEN,
            limit: 100
          }
        });

        // Fetch deals for this person
        const dealsUrl = `https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1/persons/${person.id}/deals`;
        const dealsResponse = await axios.get(dealsUrl, {
          params: {
            api_token: PIPEDRIVE_API_TOKEN,
            status: 'all_not_deleted'
          }
        });

        const notes = notesResponse.data.data || [];
        const activities = activitiesResponse.data.data || [];
        const deals = dealsResponse.data.data || [];

        // Process phone numbers
        const phones = person.phone || [];
        const primaryPhone = phones.find(p => p.primary) || phones[0];
        
        // Process emails
        const emails = person.email || [];
        const primaryEmail = emails.find(e => e.primary) || emails[0];

        // Calculate deal statistics
        const openDeals = deals.filter(d => d.status === 'open');
        const wonDeals = deals.filter(d => d.status === 'won');
        const lostDeals = deals.filter(d => d.status === 'lost');
        
        // Calculate total deal value
        const totalDealValue = openDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);

        // Get next and last activities
        const nextActivity = activities.find(a => !a.done && new Date(a.due_date) >= new Date());
        const lastActivity = activities
          .filter(a => a.done)
          .sort((a, b) => new Date(b.marked_as_done_time) - new Date(a.marked_as_done_time))[0];

        // Compile all notes into a single string
        const allNotes = notes
          .map(note => `[${new Date(note.add_time).toLocaleDateString()}] ${note.content}`)
          .join('\n\n');

        // Extract custom fields if available
        const customFields = {};
        Object.keys(person).forEach(key => {
          if (key.startsWith('custom_') || /^[a-f0-9]{40}$/.test(key)) {
            customFields[key] = person[key];
          }
        });

        const contact = {
          id: person.id,
          pipedrive_id: person.id,
          name: person.name,
          first_name: person.first_name || person.name?.split(' ')[0] || '',
          last_name: person.last_name || person.name?.split(' ').slice(1).join(' ') || '',
          email: primaryEmail?.value || '',
          phone_number: primaryPhone?.value || '',
          all_phones: phones.map(p => ({ value: p.value, label: p.label })),
          all_emails: emails.map(e => ({ value: e.value, label: e.label })),
          company: person.org_name || person.org_id?.name || '',
          org_id: person.org_id?.value || person.org_id,
          
          // Status and scoring
          status: person.label || 'lead',
          lead_score: person.lead_score || calculateLeadScore(person, activities, deals),
          visible_to: person.visible_to,
          
          // Activity data
          last_activity_date: lastActivity?.marked_as_done_time || person.last_activity_date,
          last_activity_type: lastActivity?.type || null,
          last_activity_subject: lastActivity?.subject || null,
          next_activity_date: nextActivity?.due_date || person.next_activity_date,
          next_activity_type: nextActivity?.type || null,
          next_activity_subject: nextActivity?.subject || null,
          activities_count: person.activities_count || activities.length,
          done_activities_count: person.done_activities_count || activities.filter(a => a.done).length,
          undone_activities_count: person.undone_activities_count || activities.filter(a => !a.done).length,
          
          // Deal data
          open_deals_count: person.open_deals_count || openDeals.length,
          won_deals_count: person.won_deals_count || wonDeals.length,
          lost_deals_count: person.lost_deals_count || lostDeals.length,
          closed_deals_count: person.closed_deals_count || (wonDeals.length + lostDeals.length),
          total_deal_value: totalDealValue,
          deals: deals.map(d => ({
            id: d.id,
            title: d.title,
            value: d.value,
            currency: d.currency,
            status: d.status,
            stage_id: d.stage_id,
            add_time: d.add_time,
            close_time: d.close_time,
            probability: d.probability
          })),
          
          // Communication data
          email_messages_count: person.email_messages_count || 0,
          notes_count: notes.length,
          notes: allNotes,
          recent_notes: notes.slice(0, 5).map(n => ({
            content: n.content,
            add_time: n.add_time,
            user: n.user?.name || 'Unknown'
          })),
          
          // Metadata
          owner_name: person.owner_name || person.owner_id?.name || '',
          owner_id: person.owner_id?.value || person.owner_id,
          created_at: person.add_time,
          updated_at: person.update_time,
          picture_url: person.picture_id?.pictures?.['512'] || null,
          
          // Custom fields
          custom_fields: customFields,
          
          // Calculate if needs attention
          needs_attention: shouldNeedAttention(person, nextActivity, lastActivity),
          attention_reasons: getAttentionReasons(person, nextActivity, lastActivity),
          
          // Source tracking
          source: 'Pipedrive',
          sync_time: new Date().toISOString()
        };

        contacts.push(contact);
      } catch (personError) {
        console.error(`Error processing person ${person.id}:`, personError.message);
        // Still add basic contact info even if detailed fetch fails
        contacts.push({
          id: person.id,
          pipedrive_id: person.id,
          name: person.name,
          email: person.email?.[0]?.value || '',
          phone_number: person.phone?.[0]?.value || '',
          company: person.org_name || '',
          status: person.label || 'lead',
          created_at: person.add_time,
          updated_at: person.update_time,
          source: 'Pipedrive',
          sync_time: new Date().toISOString(),
          sync_error: true,
          error_message: personError.message
        });
      }
    }

    // Return the enriched contacts
    res.status(200).json({
      success: true,
      contacts: contacts,
      total: contacts.length,
      sync_time: new Date().toISOString()
    });

  } catch (error) {
    console.error('Pipedrive sync error:', error);
    res.status(500).json({
      error: 'Failed to sync with Pipedrive',
      details: error.message
    });
  }
}

// Helper function to calculate lead score
function calculateLeadScore(person, activities, deals) {
  let score = 5; // Base score
  
  // Add points for activities
  if (activities.length > 10) score += 2;
  else if (activities.length > 5) score += 1;
  
  // Add points for deals
  if (deals.filter(d => d.status === 'won').length > 0) score += 2;
  if (deals.filter(d => d.status === 'open').length > 0) score += 1;
  
  // Add points for recent activity
  const lastActivityDate = activities
    .filter(a => a.done)
    .sort((a, b) => new Date(b.marked_as_done_time) - new Date(a.marked_as_done_time))[0]?.marked_as_done_time;
  
  if (lastActivityDate) {
    const daysSinceLastActivity = (new Date() - new Date(lastActivityDate)) / (1000 * 60 * 60 * 24);
    if (daysSinceLastActivity < 7) score += 2;
    else if (daysSinceLastActivity < 30) score += 1;
  }
  
  return Math.min(score, 10);
}

// Helper function to determine if contact needs attention
function shouldNeedAttention(person, nextActivity, lastActivity) {
  // Has overdue activity
  if (nextActivity && new Date(nextActivity.due_date) < new Date()) {
    return true;
  }
  
  // No activity in 30+ days
  if (lastActivity) {
    const daysSinceLastActivity = (new Date() - new Date(lastActivity.marked_as_done_time)) / (1000 * 60 * 60 * 24);
    if (daysSinceLastActivity > 30) return true;
  }
  
  // Has open deals but no recent activity
  if (person.open_deals_count > 0 && !lastActivity) {
    return true;
  }
  
  return false;
}

// Helper function to get attention reasons
function getAttentionReasons(person, nextActivity, lastActivity) {
  const reasons = [];
  
  if (nextActivity && new Date(nextActivity.due_date) < new Date()) {
    reasons.push('Overdue activity');
  }
  
  if (lastActivity) {
    const daysSinceLastActivity = (new Date() - new Date(lastActivity.marked_as_done_time)) / (1000 * 60 * 60 * 24);
    if (daysSinceLastActivity > 30) {
      reasons.push(`No activity in ${Math.floor(daysSinceLastActivity)} days`);
    }
  }
  
  if (person.open_deals_count > 0 && !lastActivity) {
    reasons.push('Open deal with no activity');
  }
  
  return reasons;
}