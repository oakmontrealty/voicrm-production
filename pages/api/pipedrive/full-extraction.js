export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      extract_all = true,
      include_custom_fields = true,
      include_activities = true,
      include_deals = true,
      include_notes = true,
      include_files = true
    } = req.body;

    // Get PipeDrive configuration from environment or request
    const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN || req.body.api_token;
    const PIPEDRIVE_DOMAIN = process.env.PIPEDRIVE_DOMAIN || req.body.domain;

    if (!PIPEDRIVE_API_TOKEN || !PIPEDRIVE_DOMAIN) {
      return res.status(400).json({
        success: false,
        error: 'PipeDrive API token and domain are required'
      });
    }

    console.log('🔄 Starting full PipeDrive data extraction...');

    // Step 1: Get all persons (contacts)
    let allContacts = [];
    let start = 0;
    const limit = 500;
    let hasMore = true;

    while (hasMore) {
      const personsResponse = await fetch(
        `https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1/persons?api_token=${PIPEDRIVE_API_TOKEN}&start=${start}&limit=${limit}`
      );

      if (!personsResponse.ok) {
        throw new Error(`Failed to fetch persons: ${personsResponse.status}`);
      }

      const personsData = await personsResponse.json();

      if (personsData.success && personsData.data && personsData.data.length > 0) {
        allContacts = allContacts.concat(personsData.data);
        start += limit;
        
        // Check if there are more results
        hasMore = personsData.additional_data?.pagination?.more_items_in_collection || false;
      } else {
        hasMore = false;
      }
    }

    console.log(`📊 Extracted ${allContacts.length} contacts from PipeDrive`);

    // Step 2: Enrich contacts with additional data
    const enrichedContacts = await Promise.all(
      allContacts.map(async (contact) => {
        try {
          const enrichedContact = {
            pipedrive_id: contact.id,
            name: contact.name,
            first_name: contact.first_name,
            last_name: contact.last_name,
            email: contact.email?.[0]?.value || null,
            phone: contact.phone?.[0]?.value || null,
            company: contact.org_name || contact.org_id?.name || null,
            title: contact.job_title,
            owner_name: contact.owner_name,
            visible_to: contact.visible_to,
            add_time: contact.add_time,
            update_time: contact.update_time,
            last_activity_date: contact.last_activity_date,
            // Extract custom fields
            custom_fields: {},
            // Additional contact info
            activities_count: contact.activities_count || 0,
            done_activities_count: contact.done_activities_count || 0,
            undone_activities_count: contact.undone_activities_count || 0,
            email_messages_count: contact.email_messages_count || 0,
            // Deal information
            open_deals_count: contact.open_deals_count || 0,
            related_open_deals_count: contact.related_open_deals_count || 0,
            won_deals_count: contact.won_deals_count || 0,
            related_won_deals_count: contact.related_won_deals_count || 0,
            lost_deals_count: contact.lost_deals_count || 0,
            related_lost_deals_count: contact.related_lost_deals_count || 0,
            // Full raw data for reference
            pipedrive_raw_data: contact
          };

          // Extract custom fields if they exist
          if (include_custom_fields && contact.custom_fields) {
            Object.entries(contact.custom_fields).forEach(([key, value]) => {
              if (value !== null && value !== '') {
                enrichedContact.custom_fields[key] = value;
              }
            });
          }

          // Get person activities if requested
          if (include_activities) {
            try {
              const activitiesResponse = await fetch(
                `https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1/persons/${contact.id}/activities?api_token=${PIPEDRIVE_API_TOKEN}`
              );
              
              if (activitiesResponse.ok) {
                const activitiesData = await activitiesResponse.json();
                enrichedContact.activities = activitiesData.data || [];
              }
            } catch (error) {
              console.warn(`Failed to get activities for contact ${contact.id}:`, error);
            }
          }

          // Get person deals if requested
          if (include_deals) {
            try {
              const dealsResponse = await fetch(
                `https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1/persons/${contact.id}/deals?api_token=${PIPEDRIVE_API_TOKEN}`
              );
              
              if (dealsResponse.ok) {
                const dealsData = await dealsResponse.json();
                enrichedContact.deals = dealsData.data || [];
              }
            } catch (error) {
              console.warn(`Failed to get deals for contact ${contact.id}:`, error);
            }
          }

          // Get notes if requested
          if (include_notes) {
            try {
              const notesResponse = await fetch(
                `https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1/persons/${contact.id}/notes?api_token=${PIPEDRIVE_API_TOKEN}`
              );
              
              if (notesResponse.ok) {
                const notesData = await notesResponse.json();
                enrichedContact.notes = notesData.data || [];
              }
            } catch (error) {
              console.warn(`Failed to get notes for contact ${contact.id}:`, error);
            }
          }

          return enrichedContact;

        } catch (error) {
          console.error(`Error enriching contact ${contact.id}:`, error);
          return null;
        }
      })
    );

    // Filter out failed enrichments
    const validContacts = enrichedContacts.filter(contact => contact !== null);

    console.log(`✅ Successfully enriched ${validContacts.length} contacts`);

    // Step 3: Store in database (if Supabase is available)
    let stored = 0;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      // Batch insert contacts
      const batchSize = 100;
      for (let i = 0; i < validContacts.length; i += batchSize) {
        const batch = validContacts.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from('contacts')
          .upsert(
            batch.map(contact => ({
              pipedrive_id: contact.pipedrive_id,
              name: contact.name,
              first_name: contact.first_name,
              last_name: contact.last_name,
              email: contact.email,
              phone: contact.phone,
              company: contact.company,
              title: contact.title,
              notes: contact.notes?.map(n => n.content).join('\n\n') || null,
              custom_fields: contact.custom_fields,
              pipedrive_data: contact.pipedrive_raw_data,
              last_sync: new Date().toISOString(),
              created_at: contact.add_time,
              updated_at: contact.update_time
            })),
            { onConflict: 'pipedrive_id' }
          );

        if (!error) {
          stored += batch.length;
        } else {
          console.error('Error storing batch:', error);
        }
      }

      console.log(`💾 Stored ${stored} contacts in database`);

    } catch (error) {
      console.warn('Database storage failed:', error);
    }

    res.status(200).json({
      success: true,
      message: 'Full PipeDrive extraction completed',
      contacts_count: validContacts.length,
      stored_count: stored,
      extraction_summary: {
        total_extracted: allContacts.length,
        successfully_enriched: validContacts.length,
        stored_in_database: stored,
        extraction_time: new Date().toISOString(),
        includes: {
          custom_fields: include_custom_fields,
          activities: include_activities,
          deals: include_deals,
          notes: include_notes,
          files: include_files
        }
      },
      sample_contact: validContacts[0] || null // Return first contact as sample
    });

  } catch (error) {
    console.error('PipeDrive extraction failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'PipeDrive extraction failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}