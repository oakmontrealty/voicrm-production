// PipeDrive Data Migration Tool
// Complete data import from PipeDrive to VoiCRM

import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

class PipeDriveMigration {
  constructor() {
    this.pipedrive = null;
    this.supabase = null;
    this.migrationStats = {
      contacts: { total: 0, migrated: 0, failed: 0 },
      deals: { total: 0, migrated: 0, failed: 0 },
      activities: { total: 0, migrated: 0, failed: 0 },
      notes: { total: 0, migrated: 0, failed: 0 },
      organizations: { total: 0, migrated: 0, failed: 0 }
    };
    this.fieldMappings = {};
    this.batchSize = 100;
    this.onProgress = null; // Progress callback function
  }

  async initialize(pipedriveApiKey, supabaseUrl, supabaseKey) {
    // Initialize PipeDrive API
    this.pipedrive = {
      apiKey: pipedriveApiKey,
      baseUrl: 'https://api.pipedrive.com/v1',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Initialize Supabase
    this.supabase = createClient(supabaseUrl, supabaseKey);

    // Setup field mappings
    this.setupFieldMappings();

    return true;
  }

  // Setup field mappings between PipeDrive and VoiCRM
  setupFieldMappings() {
    this.fieldMappings = {
      persons: {
        // PipeDrive field -> VoiCRM field
        'name': 'name',
        'email': 'email',
        'phone': 'phone_number',
        'org_id': 'organization_id',
        'owner_id': 'assigned_agent_id',
        'add_time': 'created_at',
        'update_time': 'updated_at',
        'notes': 'notes',
        'label': 'tags',
        'visible_to': 'visibility',
        // Custom fields
        'address': 'address',
        'city': 'city',
        'state': 'state',
        'postal_code': 'postal_code',
        'country': 'country'
      },
      deals: {
        'title': 'title',
        'value': 'value',
        'currency': 'currency',
        'person_id': 'contact_id',
        'org_id': 'organization_id',
        'stage_id': 'stage',
        'status': 'status',
        'probability': 'probability',
        'expected_close_date': 'expected_close_date',
        'add_time': 'created_at',
        'update_time': 'updated_at',
        'won_time': 'closed_at',
        'lost_reason': 'lost_reason',
        'owner_id': 'assigned_agent_id'
      },
      activities: {
        'subject': 'subject',
        'type': 'type',
        'done': 'completed',
        'due_date': 'due_date',
        'due_time': 'due_time',
        'duration': 'duration',
        'person_id': 'contact_id',
        'deal_id': 'deal_id',
        'note': 'notes',
        'add_time': 'created_at',
        'marked_as_done_time': 'completed_at',
        'owner_id': 'assigned_agent_id'
      },
      notes: {
        'content': 'content',
        'person_id': 'contact_id',
        'deal_id': 'deal_id',
        'org_id': 'organization_id',
        'add_time': 'created_at',
        'update_time': 'updated_at'
      },
      organizations: {
        'name': 'name',
        'address': 'address',
        'owner_id': 'assigned_agent_id',
        'add_time': 'created_at',
        'update_time': 'updated_at'
      }
    };
  }

  // Start full migration
  async startMigration(options = {}) {
    console.log('🚀 Starting PipeDrive migration to VoiCRM...');
    
    const startTime = Date.now();
    const report = {
      startTime: new Date(),
      endTime: null,
      duration: null,
      stats: {},
      errors: [],
      warnings: []
    };

    try {
      // Step 1: Migrate Organizations
      if (options.includeOrganizations !== false) {
        console.log('📁 Migrating organizations...');
        await this.migrateOrganizations();
      }

      // Step 2: Migrate Contacts (Persons)
      if (options.includeContacts !== false) {
        console.log('👥 Migrating contacts...');
        await this.migrateContacts();
      }

      // Step 3: Migrate Deals
      if (options.includeDeals !== false) {
        console.log('💼 Migrating deals...');
        await this.migrateDeals();
      }

      // Step 4: Migrate Activities
      if (options.includeActivities !== false) {
        console.log('📅 Migrating activities...');
        await this.migrateActivities();
      }

      // Step 5: Migrate Notes
      if (options.includeNotes !== false) {
        console.log('📝 Migrating notes...');
        await this.migrateNotes();
      }

      // Step 6: Migrate Custom Fields
      if (options.includeCustomFields !== false) {
        console.log('⚙️ Migrating custom fields...');
        await this.migrateCustomFields();
      }

      report.endTime = new Date();
      report.duration = (Date.now() - startTime) / 1000; // seconds
      report.stats = this.migrationStats;
      report.success = true;

      console.log('✅ Migration completed successfully!');
      console.log(`⏱️ Total time: ${report.duration} seconds`);
      console.log('📊 Migration Statistics:');
      console.log(this.migrationStats);

      // Save migration report
      await this.saveMigrationReport(report);

      return report;

    } catch (error) {
      console.error('❌ Migration failed:', error);
      report.endTime = new Date();
      report.duration = (Date.now() - startTime) / 1000;
      report.success = false;
      report.error = error.message;
      report.stats = this.migrationStats;
      
      await this.saveMigrationReport(report);
      throw error;
    }
  }

  // Migrate contacts from PipeDrive
  async migrateContacts() {
    let start = 0;
    let hasMore = true;
    let totalProcessed = 0;
    const maxContacts = 15000; // Safety limit

    // First get the total count
    console.log('🔍 Fetching total contacts count...');
    const countResponse = await axios.get(`${this.pipedrive.baseUrl}/persons`, {
      params: {
        api_token: this.pipedrive.apiKey,
        limit: 1,
        get_summary: 1
      }
    });
    
    const totalContacts = countResponse.data.additional_data?.summary?.total_count || 0;
    console.log(`📊 Found ${totalContacts} total contacts in PipeDrive`);
    this.migrationStats.contacts.total = totalContacts;

    while (hasMore && totalProcessed < maxContacts) {
      try {
        // Fetch batch from PipeDrive
        const response = await axios.get(`${this.pipedrive.baseUrl}/persons`, {
          params: {
            api_token: this.pipedrive.apiKey,
            start,
            limit: this.batchSize
          }
        });

        if (!response.data.success) {
          throw new Error('Failed to fetch contacts from PipeDrive');
        }

        const persons = response.data.data || [];
        
        // If no persons returned, we're done
        if (persons.length === 0) {
          hasMore = false;
          break;
        }
        
        totalProcessed += persons.length;

        // Process each contact with full data extraction
        for (const person of persons) {
          try {
            const contact = await this.transformContact(person);
            
            // Check if contact already exists
            const { data: existing } = await this.supabase
              .from('contacts')
              .select('id')
              .eq('email', contact.email)
              .single();

            if (existing) {
              // Update existing contact
              await this.supabase
                .from('contacts')
                .update(contact)
                .eq('id', existing.id);
            } else {
              // Insert new contact
              await this.supabase
                .from('contacts')
                .insert(contact);
            }

            this.migrationStats.contacts.migrated++;
          } catch (error) {
            console.error(`Failed to migrate contact ${person.name}:`, error);
            this.migrationStats.contacts.failed++;
          }
        }

        // Check for more data - PipeDrive returns hasMore even when pagination total is 0
        hasMore = response.data.additional_data?.pagination?.more_items_in_collection || false;
        
        // Increment start position
        if (hasMore) {
          start = response.data.additional_data?.pagination?.next_start || (start + this.batchSize);
        }

        // Progress update
        const percentComplete = totalContacts > 0 ? Math.round((totalProcessed / totalContacts) * 100) : 0;
        console.log(`  Processed ${totalProcessed}/${totalContacts} contacts (${percentComplete}%) - Migrated: ${this.migrationStats.contacts.migrated}, Failed: ${this.migrationStats.contacts.failed}`);
        
        // Call progress callback if provided
        if (this.onProgress) {
          this.onProgress(this.migrationStats);
        }

      } catch (error) {
        console.error('Error fetching contacts batch:', error);
        hasMore = false;
      }
    }
  }

  // Transform PipeDrive contact to VoiCRM format with ALL data
  async transformContact(pipedriveContact) {
    // For initial migration, we'll use the data we already have
    // Additional details can be fetched in a separate enrichment pass
    const additionalData = {
      notes: [],
      activities: [],
      emails: [],
      files: [],
      callLogs: [],
      meetings: []
    };
    
    const contact = {
      pipedrive_id: pipedriveContact.id,
      name: pipedriveContact.name,
      email: this.extractEmail(pipedriveContact.email),
      phone_number: this.extractPhone(pipedriveContact.phone),
      organization_id: pipedriveContact.org_id?.value || null,
      assigned_agent_id: pipedriveContact.owner_id?.value || null,
      created_at: pipedriveContact.add_time,
      updated_at: pipedriveContact.update_time,
      notes: pipedriveContact.notes || null,
      tags: pipedriveContact.label ? [pipedriveContact.label] : [],
      
      // Additional fields
      address: this.extractAddress(pipedriveContact),
      lead_score: this.calculateLeadScore(pipedriveContact),
      status: this.determineStatus(pipedriveContact),
      source: 'pipedrive_import',
      
      // Activity tracking
      last_activity_date: pipedriveContact.last_activity_date,
      last_activity_id: pipedriveContact.last_activity_id,
      next_activity_date: pipedriveContact.next_activity_date,
      next_activity_time: pipedriveContact.next_activity_time,
      next_activity_id: pipedriveContact.next_activity_id,
      next_activity_subject: pipedriveContact.next_activity_subject,
      next_activity_type: pipedriveContact.next_activity_type,
      next_activity_note: pipedriveContact.next_activity_note,
      
      // Communication history
      last_incoming_mail_time: pipedriveContact.last_incoming_mail_time,
      last_outgoing_mail_time: pipedriveContact.last_outgoing_mail_time,
      email_messages_count: pipedriveContact.email_messages_count,
      activities_count: pipedriveContact.activities_count,
      done_activities_count: pipedriveContact.done_activities_count,
      undone_activities_count: pipedriveContact.undone_activities_count,
      
      // Deal information
      open_deals_count: pipedriveContact.open_deals_count,
      closed_deals_count: pipedriveContact.closed_deals_count,
      won_deals_count: pipedriveContact.won_deals_count,
      lost_deals_count: pipedriveContact.lost_deals_count,
      related_won_deals_count: pipedriveContact.related_won_deals_count,
      related_lost_deals_count: pipedriveContact.related_lost_deals_count,
      
      // Files and attachments
      files_count: pipedriveContact.files_count,
      notes_count: pipedriveContact.notes_count,
      followers_count: pipedriveContact.followers_count,
      
      // Marketing status
      marketing_status: pipedriveContact.marketing_status,
      
      // Social profiles
      social_profiles: {
        linkedin: pipedriveContact['linkedin'] || null,
        facebook: pipedriveContact['facebook'] || null,
        twitter: pipedriveContact['twitter'] || null
      },
      
      // Custom fields
      custom_fields: this.extractCustomFields(pipedriveContact),
      
      // Additional detailed data
      all_notes: additionalData.notes || [],
      all_activities: additionalData.activities || [],
      all_emails: additionalData.emails || [],
      all_files: additionalData.files || [],
      call_logs: additionalData.callLogs || [],
      meeting_history: additionalData.meetings || []
    };

    return contact;
  }

  // Migrate deals from PipeDrive
  async migrateDeals() {
    let start = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await axios.get(`${this.pipedrive.baseUrl}/deals`, {
          params: {
            api_token: this.pipedrive.apiKey,
            start,
            limit: this.batchSize
          }
        });

        if (!response.data.success) {
          throw new Error('Failed to fetch deals from PipeDrive');
        }

        const deals = response.data.data || [];
        this.migrationStats.deals.total += deals.length;

        for (const deal of deals) {
          try {
            const transformedDeal = await this.transformDeal(deal);
            
            await this.supabase
              .from('deals')
              .upsert(transformedDeal, { onConflict: 'pipedrive_id' });

            this.migrationStats.deals.migrated++;
          } catch (error) {
            console.error(`Failed to migrate deal ${deal.title}:`, error);
            this.migrationStats.deals.failed++;
          }
        }

        hasMore = response.data.additional_data?.pagination?.more_items_in_collection || false;
        start = response.data.additional_data?.pagination?.next_start || 0;

        console.log(`  Migrated ${this.migrationStats.deals.migrated}/${this.migrationStats.deals.total} deals...`);

      } catch (error) {
        console.error('Error fetching deals batch:', error);
        hasMore = false;
      }
    }
  }

  // Fetch detailed contact data including all activities, notes, emails, etc.
  async fetchContactDetails(personId) {
    try {
      const [notes, activities, emails, files, deals] = await Promise.all([
        // Fetch all notes for this contact
        this.fetchPersonNotes(personId),
        // Fetch all activities (calls, meetings, tasks)
        this.fetchPersonActivities(personId),
        // Fetch all email communications
        this.fetchPersonEmails(personId),
        // Fetch all files/attachments
        this.fetchPersonFiles(personId),
        // Fetch all related deals
        this.fetchPersonDeals(personId)
      ]);

      // Separate activities by type
      const callLogs = activities.filter(a => a.type === 'call');
      const meetings = activities.filter(a => a.type === 'meeting');
      const tasks = activities.filter(a => a.type === 'task');
      const otherActivities = activities.filter(a => !['call', 'meeting', 'task'].includes(a.type));

      return {
        notes,
        activities,
        emails,
        files,
        deals,
        callLogs,
        meetings,
        tasks,
        otherActivities,
        totalInteractions: notes.length + activities.length + emails.length
      };
    } catch (error) {
      console.error(`Error fetching details for person ${personId}:`, error);
      return {
        notes: [],
        activities: [],
        emails: [],
        files: [],
        deals: [],
        callLogs: [],
        meetings: [],
        tasks: [],
        otherActivities: [],
        totalInteractions: 0
      };
    }
  }

  // Fetch all notes for a person
  async fetchPersonNotes(personId) {
    try {
      const response = await axios.get(`${this.pipedrive.baseUrl}/notes`, {
        params: {
          api_token: this.pipedrive.apiKey,
          person_id: personId,
          limit: 500
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching notes for person ${personId}:`, error);
      return [];
    }
  }

  // Fetch all activities for a person
  async fetchPersonActivities(personId) {
    try {
      const response = await axios.get(`${this.pipedrive.baseUrl}/persons/${personId}/activities`, {
        params: {
          api_token: this.pipedrive.apiKey,
          limit: 500,
          done: '0,1' // Get both done and undone activities
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching activities for person ${personId}:`, error);
      return [];
    }
  }

  // Fetch all emails for a person
  async fetchPersonEmails(personId) {
    try {
      const response = await axios.get(`${this.pipedrive.baseUrl}/persons/${personId}/mailMessages`, {
        params: {
          api_token: this.pipedrive.apiKey,
          limit: 500
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching emails for person ${personId}:`, error);
      return [];
    }
  }

  // Fetch all files for a person
  async fetchPersonFiles(personId) {
    try {
      const response = await axios.get(`${this.pipedrive.baseUrl}/persons/${personId}/files`, {
        params: {
          api_token: this.pipedrive.apiKey,
          limit: 500
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching files for person ${personId}:`, error);
      return [];
    }
  }

  // Fetch all deals for a person
  async fetchPersonDeals(personId) {
    try {
      const response = await axios.get(`${this.pipedrive.baseUrl}/persons/${personId}/deals`, {
        params: {
          api_token: this.pipedrive.apiKey,
          limit: 500,
          status: 'all_not_deleted'
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching deals for person ${personId}:`, error);
      return [];
    }
  }

  // Transform PipeDrive deal to VoiCRM format with complete data
  async transformDeal(pipedriveDeal) {
    // For initial migration, we'll use the data we already have
    const dealDetails = {
      notes: [],
      activities: [],
      emails: [],
      files: [],
      products: [],
      participants: [],
      timeline: []
    };
    
    return {
      pipedrive_id: pipedriveDeal.id,
      title: pipedriveDeal.title,
      value: pipedriveDeal.value,
      currency: pipedriveDeal.currency,
      contact_id: pipedriveDeal.person_id?.value || null,
      organization_id: pipedriveDeal.org_id?.value || null,
      stage: this.mapDealStage(pipedriveDeal.stage_id),
      status: pipedriveDeal.status,
      probability: pipedriveDeal.probability,
      expected_close_date: pipedriveDeal.expected_close_date,
      created_at: pipedriveDeal.add_time,
      updated_at: pipedriveDeal.update_time,
      closed_at: pipedriveDeal.won_time || pipedriveDeal.lost_time,
      lost_reason: pipedriveDeal.lost_reason,
      assigned_agent_id: pipedriveDeal.owner_id?.value || null,
      source: 'pipedrive_import',
      
      // Additional deal data
      products_count: pipedriveDeal.products_count,
      files_count: pipedriveDeal.files_count,
      notes_count: pipedriveDeal.notes_count,
      email_messages_count: pipedriveDeal.email_messages_count,
      activities_count: pipedriveDeal.activities_count,
      done_activities_count: pipedriveDeal.done_activities_count,
      undone_activities_count: pipedriveDeal.undone_activities_count,
      participants_count: pipedriveDeal.participants_count,
      
      // Activity tracking
      last_activity_date: pipedriveDeal.last_activity_date,
      last_activity_id: pipedriveDeal.last_activity_id,
      next_activity_date: pipedriveDeal.next_activity_date,
      next_activity_time: pipedriveDeal.next_activity_time,
      next_activity_id: pipedriveDeal.next_activity_id,
      next_activity_subject: pipedriveDeal.next_activity_subject,
      next_activity_type: pipedriveDeal.next_activity_type,
      next_activity_duration: pipedriveDeal.next_activity_duration,
      next_activity_note: pipedriveDeal.next_activity_note,
      
      // Communication tracking
      last_incoming_mail_time: pipedriveDeal.last_incoming_mail_time,
      last_outgoing_mail_time: pipedriveDeal.last_outgoing_mail_time,
      
      // Stage history
      stage_order_nr: pipedriveDeal.stage_order_nr,
      stage_change_time: pipedriveDeal.stage_change_time,
      
      // Detailed data from additional fetch
      all_notes: dealDetails.notes || [],
      all_activities: dealDetails.activities || [],
      all_emails: dealDetails.emails || [],
      all_files: dealDetails.files || [],
      all_products: dealDetails.products || [],
      all_participants: dealDetails.participants || [],
      timeline: dealDetails.timeline || []
    };
  }

  // Fetch detailed deal data
  async fetchDealDetails(dealId) {
    try {
      const [notes, activities, emails, files, products, participants, timeline] = await Promise.all([
        this.fetchDealNotes(dealId),
        this.fetchDealActivities(dealId),
        this.fetchDealEmails(dealId),
        this.fetchDealFiles(dealId),
        this.fetchDealProducts(dealId),
        this.fetchDealParticipants(dealId),
        this.fetchDealTimeline(dealId)
      ]);

      return {
        notes,
        activities,
        emails,
        files,
        products,
        participants,
        timeline
      };
    } catch (error) {
      console.error(`Error fetching details for deal ${dealId}:`, error);
      return {};
    }
  }

  // Fetch deal notes
  async fetchDealNotes(dealId) {
    try {
      const response = await axios.get(`${this.pipedrive.baseUrl}/deals/${dealId}/notes`, {
        params: { api_token: this.pipedrive.apiKey, limit: 500 }
      });
      return response.data.data || [];
    } catch (error) {
      return [];
    }
  }

  // Fetch deal activities
  async fetchDealActivities(dealId) {
    try {
      const response = await axios.get(`${this.pipedrive.baseUrl}/deals/${dealId}/activities`, {
        params: { api_token: this.pipedrive.apiKey, limit: 500, done: '0,1' }
      });
      return response.data.data || [];
    } catch (error) {
      return [];
    }
  }

  // Fetch deal emails
  async fetchDealEmails(dealId) {
    try {
      const response = await axios.get(`${this.pipedrive.baseUrl}/deals/${dealId}/mailMessages`, {
        params: { api_token: this.pipedrive.apiKey, limit: 500 }
      });
      return response.data.data || [];
    } catch (error) {
      return [];
    }
  }

  // Fetch deal files
  async fetchDealFiles(dealId) {
    try {
      const response = await axios.get(`${this.pipedrive.baseUrl}/deals/${dealId}/files`, {
        params: { api_token: this.pipedrive.apiKey, limit: 500 }
      });
      return response.data.data || [];
    } catch (error) {
      return [];
    }
  }

  // Fetch deal products
  async fetchDealProducts(dealId) {
    try {
      const response = await axios.get(`${this.pipedrive.baseUrl}/deals/${dealId}/products`, {
        params: { api_token: this.pipedrive.apiKey, limit: 500 }
      });
      return response.data.data || [];
    } catch (error) {
      return [];
    }
  }

  // Fetch deal participants
  async fetchDealParticipants(dealId) {
    try {
      const response = await axios.get(`${this.pipedrive.baseUrl}/deals/${dealId}/participants`, {
        params: { api_token: this.pipedrive.apiKey, limit: 500 }
      });
      return response.data.data || [];
    } catch (error) {
      return [];
    }
  }

  // Fetch deal timeline/flow
  async fetchDealTimeline(dealId) {
    try {
      const response = await axios.get(`${this.pipedrive.baseUrl}/deals/${dealId}/flow`, {
        params: { api_token: this.pipedrive.apiKey, limit: 500 }
      });
      return response.data.data || [];
    } catch (error) {
      return [];
    }
  }

  // Migrate activities
  async migrateActivities() {
    let start = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await axios.get(`${this.pipedrive.baseUrl}/activities`, {
          params: {
            api_token: this.pipedrive.apiKey,
            start,
            limit: this.batchSize
          }
        });

        if (!response.data.success) {
          throw new Error('Failed to fetch activities from PipeDrive');
        }

        const activities = response.data.data || [];
        this.migrationStats.activities.total += activities.length;

        for (const activity of activities) {
          try {
            const transformedActivity = this.transformActivity(activity);
            
            await this.supabase
              .from('activities')
              .upsert(transformedActivity, { onConflict: 'pipedrive_id' });

            this.migrationStats.activities.migrated++;
          } catch (error) {
            console.error(`Failed to migrate activity ${activity.subject}:`, error);
            this.migrationStats.activities.failed++;
          }
        }

        hasMore = response.data.additional_data?.pagination?.more_items_in_collection || false;
        start = response.data.additional_data?.pagination?.next_start || 0;

        console.log(`  Migrated ${this.migrationStats.activities.migrated}/${this.migrationStats.activities.total} activities...`);

      } catch (error) {
        console.error('Error fetching activities batch:', error);
        hasMore = false;
      }
    }
  }

  // Transform activity
  transformActivity(pipedriveActivity) {
    return {
      pipedrive_id: pipedriveActivity.id,
      subject: pipedriveActivity.subject,
      type: this.mapActivityType(pipedriveActivity.type),
      completed: pipedriveActivity.done,
      due_date: pipedriveActivity.due_date,
      due_time: pipedriveActivity.due_time,
      duration: pipedriveActivity.duration,
      contact_id: pipedriveActivity.person_id,
      deal_id: pipedriveActivity.deal_id,
      notes: pipedriveActivity.note,
      created_at: pipedriveActivity.add_time,
      completed_at: pipedriveActivity.marked_as_done_time,
      assigned_agent_id: pipedriveActivity.owner_id?.value || null,
      source: 'pipedrive_import'
    };
  }

  // Migrate notes
  async migrateNotes() {
    let start = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await axios.get(`${this.pipedrive.baseUrl}/notes`, {
          params: {
            api_token: this.pipedrive.apiKey,
            start,
            limit: this.batchSize
          }
        });

        if (!response.data.success) {
          throw new Error('Failed to fetch notes from PipeDrive');
        }

        const notes = response.data.data || [];
        this.migrationStats.notes.total += notes.length;

        for (const note of notes) {
          try {
            const transformedNote = {
              pipedrive_id: note.id,
              content: note.content,
              contact_id: note.person_id,
              deal_id: note.deal_id,
              organization_id: note.org_id,
              created_at: note.add_time,
              updated_at: note.update_time,
              created_by: note.user_id,
              source: 'pipedrive_import'
            };
            
            await this.supabase
              .from('notes')
              .upsert(transformedNote, { onConflict: 'pipedrive_id' });

            this.migrationStats.notes.migrated++;
          } catch (error) {
            console.error(`Failed to migrate note:`, error);
            this.migrationStats.notes.failed++;
          }
        }

        hasMore = response.data.additional_data?.pagination?.more_items_in_collection || false;
        start = response.data.additional_data?.pagination?.next_start || 0;

        console.log(`  Migrated ${this.migrationStats.notes.migrated}/${this.migrationStats.notes.total} notes...`);

      } catch (error) {
        console.error('Error fetching notes batch:', error);
        hasMore = false;
      }
    }
  }

  // Migrate organizations
  async migrateOrganizations() {
    let start = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await axios.get(`${this.pipedrive.baseUrl}/organizations`, {
          params: {
            api_token: this.pipedrive.apiKey,
            start,
            limit: this.batchSize
          }
        });

        if (!response.data.success) {
          throw new Error('Failed to fetch organizations from PipeDrive');
        }

        const orgs = response.data.data || [];
        this.migrationStats.organizations.total += orgs.length;

        for (const org of orgs) {
          try {
            const transformedOrg = {
              pipedrive_id: org.id,
              name: org.name,
              address: org.address,
              assigned_agent_id: org.owner_id?.value || null,
              created_at: org.add_time,
              updated_at: org.update_time,
              source: 'pipedrive_import'
            };
            
            await this.supabase
              .from('organizations')
              .upsert(transformedOrg, { onConflict: 'pipedrive_id' });

            this.migrationStats.organizations.migrated++;
          } catch (error) {
            console.error(`Failed to migrate organization ${org.name}:`, error);
            this.migrationStats.organizations.failed++;
          }
        }

        hasMore = response.data.additional_data?.pagination?.more_items_in_collection || false;
        start = response.data.additional_data?.pagination?.next_start || 0;

        console.log(`  Migrated ${this.migrationStats.organizations.migrated}/${this.migrationStats.organizations.total} organizations...`);

      } catch (error) {
        console.error('Error fetching organizations batch:', error);
        hasMore = false;
      }
    }
  }

  // Migrate custom fields
  async migrateCustomFields() {
    try {
      // Fetch person fields
      const personFieldsResponse = await axios.get(`${this.pipedrive.baseUrl}/personFields`, {
        params: { api_token: this.pipedrive.apiKey }
      });

      // Fetch deal fields
      const dealFieldsResponse = await axios.get(`${this.pipedrive.baseUrl}/dealFields`, {
        params: { api_token: this.pipedrive.apiKey }
      });

      // Process and store custom field definitions
      const customFields = {
        person: personFieldsResponse.data.data || [],
        deal: dealFieldsResponse.data.data || []
      };

      // Save custom field mappings
      await this.supabase
        .from('custom_field_mappings')
        .insert({
          pipedrive_fields: customFields,
          created_at: new Date(),
          source: 'pipedrive_import'
        });

      console.log(`  Migrated ${customFields.person.length} person fields and ${customFields.deal.length} deal fields`);

    } catch (error) {
      console.error('Error migrating custom fields:', error);
    }
  }

  // Helper functions
  extractEmail(emailData) {
    if (Array.isArray(emailData) && emailData.length > 0) {
      return emailData[0].value;
    }
    return emailData || null;
  }

  extractPhone(phoneData) {
    if (Array.isArray(phoneData) && phoneData.length > 0) {
      // Format for Australian numbers
      let phone = phoneData[0].value;
      phone = phone.replace(/\D/g, ''); // Remove non-digits
      
      if (phone.startsWith('61')) {
        phone = '+' + phone;
      } else if (phone.startsWith('0')) {
        phone = '+61' + phone.substr(1);
      } else if (!phone.startsWith('+')) {
        phone = '+61' + phone;
      }
      
      return phone;
    }
    return phoneData || null;
  }

  extractAddress(person) {
    // Combine address fields
    const parts = [];
    if (person.address) parts.push(person.address);
    if (person.city) parts.push(person.city);
    if (person.state) parts.push(person.state);
    if (person.postal_code) parts.push(person.postal_code);
    if (person.country) parts.push(person.country);
    
    return parts.length > 0 ? parts.join(', ') : null;
  }

  calculateLeadScore(person) {
    let score = 50; // Base score
    
    // Has email: +10
    if (person.email) score += 10;
    
    // Has phone: +10
    if (person.phone) score += 10;
    
    // Has organization: +10
    if (person.org_id) score += 10;
    
    // Has recent activity: +20
    if (person.last_activity_date) {
      const daysSinceActivity = (Date.now() - new Date(person.last_activity_date)) / (1000 * 60 * 60 * 24);
      if (daysSinceActivity < 7) score += 20;
      else if (daysSinceActivity < 30) score += 10;
    }
    
    // Has open deals: +10
    if (person.open_deals_count > 0) score += 10;
    
    return Math.min(100, score);
  }

  determineStatus(person) {
    if (person.open_deals_count > 0) return 'active';
    if (person.closed_deals_count > 0) return 'customer';
    if (person.activities_count > 0) return 'engaged';
    return 'lead';
  }

  extractCustomFields(person) {
    const customFields = {};
    
    // Extract all fields that start with a hash (custom fields in PipeDrive)
    Object.keys(person).forEach(key => {
      if (key.match(/^[a-f0-9]{40}$/)) {
        customFields[key] = person[key];
      }
    });
    
    return customFields;
  }

  mapDealStage(stageId) {
    // Map PipeDrive stages to VoiCRM stages
    const stageMap = {
      1: 'prospecting',
      2: 'qualification',
      3: 'proposal',
      4: 'negotiation',
      5: 'closing',
      6: 'won',
      7: 'lost'
    };
    
    return stageMap[stageId] || 'prospecting';
  }

  mapActivityType(type) {
    // Map PipeDrive activity types to VoiCRM types
    const typeMap = {
      'call': 'phone_call',
      'meeting': 'meeting',
      'task': 'task',
      'deadline': 'deadline',
      'email': 'email',
      'lunch': 'meeting'
    };
    
    return typeMap[type] || 'task';
  }

  // Save migration report
  async saveMigrationReport(report) {
    try {
      await this.supabase
        .from('migration_reports')
        .insert({
          source: 'pipedrive',
          started_at: report.startTime,
          completed_at: report.endTime,
          duration_seconds: report.duration,
          statistics: report.stats,
          errors: report.errors,
          warnings: report.warnings,
          success: report.success
        });
    } catch (error) {
      console.error('Failed to save migration report:', error);
    }
  }

  // Quick migration status check
  async checkMigrationStatus() {
    const status = {
      contacts: await this.checkEntityStatus('contacts'),
      deals: await this.checkEntityStatus('deals'),
      activities: await this.checkEntityStatus('activities'),
      notes: await this.checkEntityStatus('notes'),
      organizations: await this.checkEntityStatus('organizations')
    };
    
    return status;
  }

  async checkEntityStatus(entity) {
    const { count: total } = await this.supabase
      .from(entity)
      .select('*', { count: 'exact', head: true });
    
    const { count: imported } = await this.supabase
      .from(entity)
      .select('*', { count: 'exact', head: true })
      .eq('source', 'pipedrive_import');
    
    return {
      total,
      imported,
      percentage: total > 0 ? ((imported / total) * 100).toFixed(1) : 0
    };
  }
}

// Singleton instance
let migrationInstance = null;

export const getPipeDriveMigration = () => {
  if (!migrationInstance) {
    migrationInstance = new PipeDriveMigration();
  }
  return migrationInstance;
};

export default PipeDriveMigration;