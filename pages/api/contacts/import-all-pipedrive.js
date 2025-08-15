// Import ALL contacts from Pipedrive - handles 11,000+ contacts
import axios from 'axios';

// Configure for large data handling
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: '50mb',
    // Extended timeout for large imports
    externalResolver: true,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set longer timeout for response
  res.setHeader('Content-Type', 'application/json');
  
  const stats = {
    totalFetched: 0,
    totalImported: 0,
    errors: [],
    startTime: Date.now()
  };

  try {
    const pipedriveApiKey = '03648df313fd7b592cca520407a20f3bd749afa9';
    
    console.log('=== Starting FULL Pipedrive Import ===');
    console.log('Time:', new Date().toISOString());
    
    // Step 1: Get total count first
    const countResponse = await axios.get('https://api.pipedrive.com/v1/persons', {
      params: {
        api_token: pipedriveApiKey,
        limit: 1,
        get_summary: 1
      }
    });
    
    const totalCount = countResponse.data.additional_data?.summary?.total_count || 0;
    console.log(`Total contacts in Pipedrive: ${totalCount}`);
    
    // Step 2: Fetch ALL contacts with pagination
    let allPersons = [];
    let start = 0;
    let hasMore = true;
    const batchSize = 500; // Maximum allowed by Pipedrive
    
    while (hasMore) {
      try {
        console.log(`Fetching batch starting at ${start}...`);
        
        const response = await axios.get('https://api.pipedrive.com/v1/persons', {
          params: {
            api_token: pipedriveApiKey,
            start: start,
            limit: batchSize,
            sort: 'add_time DESC'
          },
          timeout: 30000 // 30 second timeout per request
        });

        if (!response.data.success) {
          console.error(`Failed at batch ${start}`);
          stats.errors.push(`Failed to fetch batch at ${start}`);
          break;
        }

        const batch = response.data.data || [];
        allPersons = allPersons.concat(batch);
        stats.totalFetched = allPersons.length;
        
        console.log(`Progress: ${allPersons.length}/${totalCount} contacts fetched (${Math.round(allPersons.length/totalCount*100)}%)`);
        
        // Check pagination
        const pagination = response.data.additional_data?.pagination;
        hasMore = pagination?.more_items_in_collection || false;
        
        if (hasMore) {
          start = pagination?.next_start || (start + batchSize);
          
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.error(`Error fetching batch at ${start}:`, error.message);
        stats.errors.push(`Batch ${start}: ${error.message}`);
        // Continue with next batch
        start += batchSize;
        hasMore = start < totalCount;
      }
    }
    
    console.log(`\n✓ Fetched ${allPersons.length} contacts from Pipedrive`);
    
    // Step 3: Process and store contacts
    console.log('Processing contacts...');
    
    // Initialize global storage if not exists
    if (!global.contacts) {
      global.contacts = [];
    }
    
    // Clear existing contacts for fresh import
    global.contacts = [];
    
    // Process each contact with minimal transformation for speed
    for (let i = 0; i < allPersons.length; i++) {
      const person = allPersons[i];
      
      try {
        // Check for data quality issues
        const hasIssues = [];
        const originalPhone = extractValue(person.phone);
        const formattedPhone = formatPhone(originalPhone);
        
        // Flag contacts with phone formatting issues
        if (originalPhone && !formattedPhone) {
          hasIssues.push('Invalid phone number format');
        }
        if (originalPhone && typeof originalPhone === 'object') {
          hasIssues.push('Phone number stored as object/array');
        }
        
        // Flag contacts missing critical info
        if (!person.name || person.name.trim() === '') {
          hasIssues.push('Missing name');
        }
        if (!extractValue(person.email) && !formattedPhone) {
          hasIssues.push('No contact methods available');
        }
        
        // Extract essential fields only for performance
        const contact = {
          // Core identification
          id: `pd_${person.id}`,
          pipedrive_id: person.id,
          
          // Basic info
          name: person.name || 'Unknown',
          first_name: person.first_name || '',
          last_name: person.last_name || '',
          
          // Contact details
          email: extractValue(person.email),
          phone: formattedPhone,
          
          // Organization
          company: person.org_name || person.org_id?.name || '',
          org_id: person.org_id?.value || person.org_id || null,
          org_name: person.org_name || null,
          
          // Owner/Agent - CRITICAL
          owner_id: person.owner_id?.value || person.owner_id || null,
          owner_name: person.owner_name || person.owner_id?.name || null,
          
          // Labels
          label: person.label || null,
          label_ids: person.label_ids || [],
          
          // Activity summary
          activities_count: person.activities_count || 0,
          done_activities_count: person.done_activities_count || 0,
          undone_activities_count: person.undone_activities_count || 0,
          
          // Last activity
          last_activity_date: person.last_activity_date,
          last_activity_id: person.last_activity_id,
          
          // Next activity - IMPORTANT
          next_activity_date: person.next_activity_date,
          next_activity_time: person.next_activity_time,
          next_activity_subject: person.next_activity_subject,
          next_activity_type: person.next_activity_type,
          
          // Communication
          email_messages_count: person.email_messages_count || 0,
          last_incoming_mail_time: person.last_incoming_mail_time,
          last_outgoing_mail_time: person.last_outgoing_mail_time,
          
          // Deals
          open_deals_count: person.open_deals_count || 0,
          closed_deals_count: person.closed_deals_count || 0,
          won_deals_count: person.won_deals_count || 0,
          lost_deals_count: person.lost_deals_count || 0,
          
          // Notes and files
          notes_count: person.notes_count || 0,
          files_count: person.files_count || 0,
          
          // Timestamps
          created_at: person.add_time,
          updated_at: person.update_time,
          
          // Status
          active_flag: person.active_flag,
          visible_to: person.visible_to,
          
          // Source
          source: 'Pipedrive',
          
          // Data quality flags
          needs_attention: hasIssues.length > 0,
          attention_reasons: hasIssues,
          original_phone_data: originalPhone, // Store original for debugging
          
          // Store any custom fields
          custom_fields: extractCustomFields(person)
        };
        
        global.contacts.push(contact);
        stats.totalImported++;
        
        // Log progress every 1000 contacts
        if (i % 1000 === 0) {
          console.log(`Processed ${i}/${allPersons.length} contacts`);
        }
        
      } catch (error) {
        console.error(`Error processing contact ${person.name}:`, error.message);
        stats.errors.push(`Contact ${person.id}: ${error.message}`);
      }
    }
    
    // Calculate import time
    const importTime = Math.round((Date.now() - stats.startTime) / 1000);
    
    // Count contacts needing attention
    const contactsNeedingAttention = global.contacts.filter(c => c.needs_attention).length;
    
    // Final summary
    const summary = {
      success: true,
      message: `Successfully imported ${stats.totalImported} contacts from Pipedrive`,
      stats: {
        totalInPipedrive: totalCount,
        totalFetched: stats.totalFetched,
        totalImported: stats.totalImported,
        contactsNeedingAttention: contactsNeedingAttention,
        errors: stats.errors.length,
        importTimeSeconds: importTime
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('\n=== Import Complete ===');
    console.log(`✓ Imported ${stats.totalImported} contacts`);
    console.log(`✓ Time taken: ${importTime} seconds`);
    console.log(`✓ Errors: ${stats.errors.length}`);
    console.log(`⚠ Contacts needing attention: ${contactsNeedingAttention}`);
    
    return res.status(200).json(summary);
    
  } catch (error) {
    console.error('Fatal import error:', error);
    return res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error.message,
      stats: {
        totalFetched: stats.totalFetched,
        totalImported: stats.totalImported,
        errors: stats.errors
      }
    });
  }
}

// Helper function to extract email/phone values
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

// Format phone numbers - handles strings, objects, and arrays
function formatPhone(phone) {
  if (!phone) return null;
  
  // Handle string values
  if (typeof phone === 'string') {
    let cleaned = phone.replace(/\D/g, '');
    
    // Format Australian numbers
    if (cleaned.startsWith('61')) {
      return '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
      return '+61' + cleaned.substr(1);
    } else if (!phone.startsWith('+')) {
      return '+61' + cleaned;
    }
    return phone;
  }
  
  // Handle object/array values (extract the actual phone number)
  let phoneStr = null;
  if (Array.isArray(phone) && phone.length > 0) {
    phoneStr = phone[0].value || phone[0];
  } else if (typeof phone === 'object' && phone.value) {
    phoneStr = phone.value;
  } else {
    // Convert to string as fallback
    phoneStr = phone.toString();
  }
  
  // Now format the extracted string
  if (!phoneStr || phoneStr === '[object Object]') return null;
  
  let cleaned = phoneStr.replace(/\D/g, '');
  
  // Format Australian numbers
  if (cleaned.startsWith('61')) {
    return '+' + cleaned;
  } else if (cleaned.startsWith('0')) {
    return '+61' + cleaned.substr(1);
  } else if (!phoneStr.startsWith('+')) {
    return '+61' + cleaned;
  }
  return phoneStr;
}

// Extract custom fields
function extractCustomFields(person) {
  const customFields = {};
  Object.keys(person).forEach(key => {
    // Custom fields in Pipedrive are 40-character hex strings
    if (key.match(/^[a-f0-9]{40}$/)) {
      customFields[key] = person[key];
    }
  });
  return customFields;
}