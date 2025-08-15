import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;
const PIPEDRIVE_DOMAIN = process.env.PIPEDRIVE_DOMAIN || 'api';

export default async function handler(req, res) {
  const { method } = req;

  if (method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!PIPEDRIVE_API_TOKEN) {
    return res.status(500).json({ error: 'Pipedrive API token not configured' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    console.log('Starting Pipedrive to Supabase sync...');
    
    // Fetch all persons from Pipedrive
    const personsUrl = `https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1/persons`;
    const personsResponse = await axios.get(personsUrl, {
      params: {
        api_token: PIPEDRIVE_API_TOKEN,
        limit: 500,
        include_fields: 'id,name,email,phone,org_id,add_time,update_time,visible_to,picture_id,next_activity_date,next_activity_time,next_activity_id,last_activity_date,last_activity_time,last_activity_id,label,org_name,owner_name,cc_email'
      }
    });

    const persons = personsResponse.data.data || [];
    console.log(`Fetched ${persons.length} persons from Pipedrive`);

    let syncedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each person
    for (const person of persons) {
      try {
        // Fetch additional data for each person
        const [notesRes, activitiesRes, dealsRes] = await Promise.all([
          axios.get(`https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1/persons/${person.id}/notes`, {
            params: { api_token: PIPEDRIVE_API_TOKEN, limit: 100 }
          }).catch(() => ({ data: { data: [] } })),
          
          axios.get(`https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1/persons/${person.id}/activities`, {
            params: { api_token: PIPEDRIVE_API_TOKEN, limit: 100 }
          }).catch(() => ({ data: { data: [] } })),
          
          axios.get(`https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1/persons/${person.id}/deals`, {
            params: { api_token: PIPEDRIVE_API_TOKEN, status: 'all_not_deleted' }
          }).catch(() => ({ data: { data: [] } }))
        ]);

        const notes = notesRes.data.data || [];
        const activities = activitiesRes.data.data || [];
        const deals = dealsRes.data.data || [];

        // Process contact data
        const phones = person.phone || [];
        const primaryPhone = phones.find(p => p.primary) || phones[0];
        
        const emails = person.email || [];
        const primaryEmail = emails.find(e => e.primary) || emails[0];

        // Calculate statistics
        const openDeals = deals.filter(d => d.status === 'open');
        const wonDeals = deals.filter(d => d.status === 'won');
        const lostDeals = deals.filter(d => d.status === 'lost');
        const totalDealValue = openDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);

        // Get activity details
        const nextActivity = activities.find(a => !a.done && new Date(a.due_date) >= new Date());
        const lastActivity = activities
          .filter(a => a.done)
          .sort((a, b) => new Date(b.marked_as_done_time) - new Date(a.marked_as_done_time))[0];

        // Compile notes
        const allNotes = notes
          .map(note => `[${new Date(note.add_time).toLocaleDateString()}] ${note.content}`)
          .join('\n\n');

        // Prepare contact data for Supabase
        const contactData = {
          pipedrive_id: person.id.toString(),
          name: person.name || 'Unknown',
          first_name: person.first_name || person.name?.split(' ')[0] || '',
          last_name: person.last_name || person.name?.split(' ').slice(1).join(' ') || '',
          email: primaryEmail?.value || null,
          phone_number: primaryPhone?.value || null,
          all_phones: phones.map(p => ({ value: p.value, label: p.label })),
          all_emails: emails.map(e => ({ value: e.value, label: e.label })),
          company: person.org_name || person.org_id?.name || null,
          org_id: person.org_id?.value?.toString() || person.org_id?.toString() || null,
          
          status: mapPipedriveStatus(person.label),
          lead_score: calculateLeadScore(person, activities, deals),
          visible_to: person.visible_to?.toString() || '3',
          
          last_activity_date: lastActivity?.marked_as_done_time || person.last_activity_date || null,
          last_activity_type: lastActivity?.type || null,
          last_activity_subject: lastActivity?.subject || null,
          next_activity_date: nextActivity?.due_date || person.next_activity_date || null,
          next_activity_type: nextActivity?.type || null,
          next_activity_subject: nextActivity?.subject || null,
          activities_count: person.activities_count || activities.length,
          done_activities_count: person.done_activities_count || activities.filter(a => a.done).length,
          undone_activities_count: person.undone_activities_count || activities.filter(a => !a.done).length,
          
          open_deals_count: person.open_deals_count || openDeals.length,
          won_deals_count: person.won_deals_count || wonDeals.length,
          lost_deals_count: person.lost_deals_count || lostDeals.length,
          closed_deals_count: person.closed_deals_count || (wonDeals.length + lostDeals.length),
          total_deal_value: totalDealValue,
          deals: deals.slice(0, 10).map(d => ({
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
          
          email_messages_count: person.email_messages_count || 0,
          notes_count: notes.length,
          notes: allNotes.substring(0, 10000), // Limit notes to 10000 chars
          recent_notes: notes.slice(0, 5).map(n => ({
            content: n.content,
            add_time: n.add_time,
            user: n.user?.name || 'Unknown'
          })),
          
          owner_name: person.owner_name || person.owner_id?.name || null,
          owner_id: person.owner_id?.value?.toString() || person.owner_id?.toString() || null,
          picture_url: person.picture_id?.pictures?.['512'] || null,
          
          needs_attention: shouldNeedAttention(person, nextActivity, lastActivity),
          attention_reasons: getAttentionReasons(person, nextActivity, lastActivity),
          
          source: 'Pipedrive',
          sync_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Upsert to Supabase (insert or update based on pipedrive_id)
        const { data, error } = await supabase
          .from('contacts')
          .upsert(contactData, {
            onConflict: 'pipedrive_id',
            returning: 'minimal'
          });

        if (error) {
          throw error;
        }

        syncedCount++;
        console.log(`Synced contact: ${person.name} (${person.id})`);
        
      } catch (personError) {
        errorCount++;
        errors.push({
          person_id: person.id,
          person_name: person.name,
          error: personError.message
        });
        console.error(`Error syncing person ${person.id}:`, personError.message);
      }
    }

    // Return summary
    res.status(200).json({
      success: true,
      message: `Sync completed: ${syncedCount} contacts synced successfully`,
      stats: {
        total_fetched: persons.length,
        synced: syncedCount,
        errors: errorCount
      },
      errors: errors.slice(0, 10), // Return first 10 errors for debugging
      sync_time: new Date().toISOString()
    });

  } catch (error) {
    console.error('Pipedrive sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync with Pipedrive',
      details: error.message
    });
  }
}

// Helper function to map Pipedrive labels to our status
function mapPipedriveStatus(label) {
  if (!label) return 'lead';
  
  const labelLower = label.toLowerCase();
  if (labelLower.includes('hot') || labelLower.includes('active')) return 'Active';
  if (labelLower.includes('warm') || labelLower.includes('prospect')) return 'Prospect';
  if (labelLower.includes('cold') || labelLower.includes('inactive')) return 'Inactive';
  
  return 'lead';
}

// Helper function to calculate lead score
function calculateLeadScore(person, activities, deals) {
  let score = 5; // Base score
  
  // Add points for activities
  if (activities.length > 20) score += 3;
  else if (activities.length > 10) score += 2;
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
  if (person.open_deals_count > 0) {
    if (!lastActivity) return true;
    const daysSinceLastActivity = (new Date() - new Date(lastActivity.marked_as_done_time)) / (1000 * 60 * 60 * 24);
    if (daysSinceLastActivity > 14) return true;
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
  } else if (person.open_deals_count > 0) {
    reasons.push('Open deal with no activity');
  }
  
  if (person.open_deals_count > 0 && lastActivity) {
    const daysSinceLastActivity = (new Date() - new Date(lastActivity.marked_as_done_time)) / (1000 * 60 * 60 * 24);
    if (daysSinceLastActivity > 14 && daysSinceLastActivity <= 30) {
      reasons.push('Open deal needs follow-up');
    }
  }
  
  return reasons;
}