import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set longer timeout for large import
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const pipedriveApiToken = process.env.PIPEDRIVE_API_TOKEN;
    const pipedriveDomain = process.env.PIPEDRIVE_DOMAIN;
    
    if (!pipedriveApiToken || !pipedriveDomain) {
      return res.status(400).json({
        success: false,
        error: 'Pipedrive credentials not configured'
      });
    }

    console.log('Starting import of ALL Pipedrive contacts...');
    
    // Clear existing contacts first (optional - comment out to append)
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.log('Could not clear existing contacts:', deleteError);
    }

    // Fetch ALL contacts from Pipedrive with pagination
    let allContacts = [];
    let start = 0;
    let hasMore = true;
    const limit = 500;
    let pageCount = 0;

    while (hasMore) {
      pageCount++;
      console.log(`Fetching page ${pageCount} (contacts ${start} to ${start + limit})...`);
      
      const pipedriveUrl = `https://${pipedriveDomain}.pipedrive.com/api/v1/persons?api_token=${pipedriveApiToken}&limit=${limit}&start=${start}`;
      
      const response = await fetch(pipedriveUrl);
      const pipedriveData = await response.json();

      if (!pipedriveData.success) {
        throw new Error('Failed to fetch contacts from Pipedrive');
      }

      if (pipedriveData.data && pipedriveData.data.length > 0) {
        allContacts = allContacts.concat(pipedriveData.data);
        start += limit;
        hasMore = pipedriveData.additional_data?.pagination?.more_items_in_collection || false;
        
        // Send progress update
        console.log(`Retrieved ${allContacts.length} contacts so far...`);
      } else {
        hasMore = false;
      }
    }

    console.log(`Total contacts fetched from Pipedrive: ${allContacts.length}`);

    // Transform ALL contacts with COMPLETE Pipedrive data extraction
    const transformedContacts = allContacts.map(person => ({
      // Basic Info
      name: person.name || 'Unknown',
      first_name: person.first_name || '',
      last_name: person.last_name || '',
      
      // Contact Details
      email: person.email && person.email.length > 0 ? person.email[0].value : null,
      phone_number: person.phone && person.phone.length > 0 ? person.phone[0].value : null,
      
      // All phone numbers
      all_phones: person.phone ? person.phone.map(p => ({
        value: p.value,
        label: p.label,
        primary: p.primary
      })) : [],
      
      // All emails
      all_emails: person.email ? person.email.map(e => ({
        value: e.value,
        label: e.label,
        primary: e.primary
      })) : [],
      
      // Company/Organization
      company: person.org_name || '',
      org_id: person.org_id?.value || null,
      
      // Pipedrive Specific Data
      pipedrive_id: person.id,
      pipedrive_data: {
        owner_id: person.owner_id?.value || null,
        owner_name: person.owner_name || null,
        visible_to: person.visible_to,
        add_time: person.add_time,
        update_time: person.update_time,
        delete_time: person.delete_time,
        active_flag: person.active_flag,
        picture_id: person.picture_id?.value || null,
        label: person.label,
        cc_email: person.cc_email
      },
      
      // Activity & Engagement
      last_activity_date: person.last_activity_date,
      last_activity_time: person.last_activity_time,
      last_activity_id: person.last_activity_id,
      next_activity_date: person.next_activity_date,
      next_activity_time: person.next_activity_time,
      next_activity_id: person.next_activity_id,
      next_activity_subject: person.next_activity_subject,
      
      // Deal Information
      open_deals_count: person.open_deals_count || 0,
      closed_deals_count: person.closed_deals_count || 0,
      won_deals_count: person.won_deals_count || 0,
      lost_deals_count: person.lost_deals_count || 0,
      activities_count: person.activities_count || 0,
      done_activities_count: person.done_activities_count || 0,
      undone_activities_count: person.undone_activities_count || 0,
      email_messages_count: person.email_messages_count || 0,
      files_count: person.files_count || 0,
      notes_count: person.notes_count || 0,
      followers_count: person.followers_count || 0,
      
      // Marketing Status
      marketing_status: person.marketing_status,
      
      // Custom Fields (if any)
      custom_fields: person.custom_fields || {},
      
      // Notes - combine all relevant info
      notes: [
        `Pipedrive ID: ${person.id}`,
        person.notes ? `Notes: ${person.notes}` : null,
        person.won_deals_count ? `Won Deals: ${person.won_deals_count}` : null,
        person.open_deals_count ? `Open Deals: ${person.open_deals_count}` : null,
        person.activities_count ? `Total Activities: ${person.activities_count}` : null
      ].filter(Boolean).join(' | '),
      
      // Status & Scoring
      source: 'Pipedrive',
      status: person.active_flag ? 'lead' : 'cold',
      lead_score: calculateLeadScore(person),
      property_interests: person.label ? [person.label] : null,
      
      // Timestamps
      created_at: person.add_time,
      updated_at: person.update_time || person.add_time,
      
      // Follow-up Info
      last_contact_date: person.last_activity_date,
      next_follow_up: person.next_activity_date,
      urgency_level: calculateUrgency(person),
      
      // Additional metadata
      needs_attention: shouldNeedAttention(person),
      attention_reasons: getAttentionReasons(person)
    }));

    // Helper functions for scoring and prioritization
    function calculateLeadScore(person) {
      let score = 5; // Base score
      if (person.won_deals_count > 0) score += Math.min(3, person.won_deals_count);
      if (person.open_deals_count > 0) score += 1;
      if (person.activities_count > 5) score += 1;
      if (person.email_messages_count > 3) score += 1;
      return Math.min(10, score);
    }

    function calculateUrgency(person) {
      if (person.next_activity_date) {
        const daysUntil = Math.floor((new Date(person.next_activity_date) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntil < 0) return 'overdue';
        if (daysUntil === 0) return 'today';
        if (daysUntil <= 3) return 'high';
        if (daysUntil <= 7) return 'medium';
      }
      return 'low';
    }

    function shouldNeedAttention(person) {
      return person.next_activity_date && new Date(person.next_activity_date) < new Date() ||
             person.open_deals_count > 0 && !person.last_activity_date ||
             person.undone_activities_count > 3;
    }

    function getAttentionReasons(person) {
      const reasons = [];
      if (person.next_activity_date && new Date(person.next_activity_date) < new Date()) {
        reasons.push('Overdue activity');
      }
      if (person.open_deals_count > 0 && !person.last_activity_date) {
        reasons.push('Open deal needs follow-up');
      }
      if (person.undone_activities_count > 3) {
        reasons.push(`${person.undone_activities_count} pending activities`);
      }
      return reasons;
    }

    console.log(`Transformed ${transformedContacts.length} contacts for import`);

    // Import in batches to avoid timeout
    const batchSize = 100;
    let imported = 0;
    let failed = 0;

    for (let i = 0; i < transformedContacts.length; i += batchSize) {
      const batch = transformedContacts.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from('contacts')
          .insert(batch)
          .select();

        if (error) {
          console.error(`Batch ${Math.floor(i/batchSize) + 1} error:`, error);
          failed += batch.length;
        } else {
          imported += data.length;
          console.log(`Imported batch ${Math.floor(i/batchSize) + 1}: ${data.length} contacts (Total: ${imported})`);
        }
      } catch (batchError) {
        console.error(`Batch import error:`, batchError);
        failed += batch.length;
      }
    }

    // Get final count
    const { count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true });

    res.status(200).json({
      success: true,
      message: `Successfully imported ${imported} contacts from Pipedrive`,
      stats: {
        total_fetched: allContacts.length,
        successfully_imported: imported,
        failed_imports: failed,
        total_in_database: count,
        with_phone: transformedContacts.filter(c => c.phone_number).length,
        without_phone: transformedContacts.filter(c => !c.phone_number).length
      },
      sample: transformedContacts.slice(0, 3).map(c => ({
        name: c.name,
        phone: c.phone_number || 'No phone',
        company: c.company || 'No company'
      }))
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import contacts',
      details: error.message
    });
  }
}

// Increase timeout for Vercel
export const config = {
  api: {
    bodyParser: true,
    responseLimit: false,
    externalResolver: true,
  },
};