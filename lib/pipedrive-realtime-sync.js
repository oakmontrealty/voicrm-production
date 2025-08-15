// PipeDrive Real-time Sync & Webhook Handler
// Keeps VoiCRM synchronized with PipeDrive changes

import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

class PipeDriveRealtimeSync {
  constructor() {
    this.pipedrive = null;
    this.supabase = null;
    this.webhooks = [];
    this.syncInterval = null;
    this.lastSyncTime = null;
  }

  async initialize(pipedriveApiKey, supabaseUrl, supabaseKey) {
    this.pipedrive = {
      apiKey: pipedriveApiKey,
      baseUrl: 'https://api.pipedrive.com/v1',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    // Setup webhook endpoints
    await this.setupWebhooks();
    
    // Start periodic sync for any missed updates
    this.startPeriodicSync();
    
    return true;
  }

  // Setup webhooks for real-time updates
  async setupWebhooks() {
    const webhookEvents = [
      'added.person',
      'updated.person',
      'deleted.person',
      'added.deal',
      'updated.deal',
      'deleted.deal',
      'added.activity',
      'updated.activity',
      'deleted.activity',
      'added.note',
      'updated.note',
      'deleted.note',
      'added.organization',
      'updated.organization',
      'deleted.organization'
    ];

    try {
      // Register webhooks with PipeDrive
      for (const event of webhookEvents) {
        const webhook = await this.registerWebhook(event);
        if (webhook) {
          this.webhooks.push(webhook);
        }
      }
      
      console.log(`✅ Registered ${this.webhooks.length} webhooks for real-time sync`);
    } catch (error) {
      console.error('Error setting up webhooks:', error);
    }
  }

  // Register a single webhook
  async registerWebhook(event) {
    try {
      const response = await axios.post(`${this.pipedrive.baseUrl}/webhooks`, {
        subscription_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/pipedrive`,
        event_action: event.split('.')[0],
        event_object: event.split('.')[1],
        api_token: this.pipedrive.apiKey
      });

      return response.data.data;
    } catch (error) {
      console.error(`Failed to register webhook for ${event}:`, error);
      return null;
    }
  }

  // Handle incoming webhook
  async handleWebhook(event, data) {
    console.log(`📨 Received webhook: ${event}`);
    
    const [action, object] = event.split('.');
    
    switch (object) {
      case 'person':
        await this.handlePersonWebhook(action, data);
        break;
      case 'deal':
        await this.handleDealWebhook(action, data);
        break;
      case 'activity':
        await this.handleActivityWebhook(action, data);
        break;
      case 'note':
        await this.handleNoteWebhook(action, data);
        break;
      case 'organization':
        await this.handleOrganizationWebhook(action, data);
        break;
    }
    
    // Update last sync time
    this.lastSyncTime = new Date();
    await this.updateSyncStatus();
  }

  // Handle person (contact) webhooks
  async handlePersonWebhook(action, data) {
    switch (action) {
      case 'added':
      case 'updated':
        // Fetch complete person data
        const person = await this.fetchPersonComplete(data.id);
        await this.upsertContact(person);
        break;
      case 'deleted':
        await this.deleteContact(data.id);
        break;
    }
  }

  // Handle deal webhooks
  async handleDealWebhook(action, data) {
    switch (action) {
      case 'added':
      case 'updated':
        const deal = await this.fetchDealComplete(data.id);
        await this.upsertDeal(deal);
        break;
      case 'deleted':
        await this.deleteDeal(data.id);
        break;
    }
  }

  // Handle activity webhooks
  async handleActivityWebhook(action, data) {
    switch (action) {
      case 'added':
      case 'updated':
        const activity = await this.fetchActivityComplete(data.id);
        await this.upsertActivity(activity);
        
        // Update related contact's next activity info
        if (activity.person_id) {
          await this.updateContactNextActivity(activity.person_id);
        }
        break;
      case 'deleted':
        await this.deleteActivity(data.id);
        break;
    }
  }

  // Handle note webhooks
  async handleNoteWebhook(action, data) {
    switch (action) {
      case 'added':
      case 'updated':
        const note = await this.fetchNoteComplete(data.id);
        await this.upsertNote(note);
        break;
      case 'deleted':
        await this.deleteNote(data.id);
        break;
    }
  }

  // Handle organization webhooks
  async handleOrganizationWebhook(action, data) {
    switch (action) {
      case 'added':
      case 'updated':
        const org = await this.fetchOrganizationComplete(data.id);
        await this.upsertOrganization(org);
        break;
      case 'deleted':
        await this.deleteOrganization(data.id);
        break;
    }
  }

  // Fetch complete person data with all related information
  async fetchPersonComplete(personId) {
    try {
      const [person, notes, activities, emails, deals] = await Promise.all([
        // Main person data
        axios.get(`${this.pipedrive.baseUrl}/persons/${personId}`, {
          params: { api_token: this.pipedrive.apiKey }
        }),
        // All notes
        axios.get(`${this.pipedrive.baseUrl}/notes`, {
          params: { 
            api_token: this.pipedrive.apiKey,
            person_id: personId,
            limit: 500
          }
        }),
        // All activities
        axios.get(`${this.pipedrive.baseUrl}/persons/${personId}/activities`, {
          params: { 
            api_token: this.pipedrive.apiKey,
            limit: 500,
            done: '0,1'
          }
        }),
        // All emails
        axios.get(`${this.pipedrive.baseUrl}/persons/${personId}/mailMessages`, {
          params: { 
            api_token: this.pipedrive.apiKey,
            limit: 500
          }
        }),
        // All deals
        axios.get(`${this.pipedrive.baseUrl}/persons/${personId}/deals`, {
          params: { 
            api_token: this.pipedrive.apiKey,
            limit: 500
          }
        })
      ]);

      const personData = person.data.data;
      
      // Compile complete contact record
      return {
        ...personData,
        all_notes: notes.data.data || [],
        all_activities: activities.data.data || [],
        all_emails: emails.data.data || [],
        all_deals: deals.data.data || [],
        last_synced: new Date()
      };
    } catch (error) {
      console.error(`Error fetching complete person ${personId}:`, error);
      return null;
    }
  }

  // Fetch complete deal data
  async fetchDealComplete(dealId) {
    try {
      const [deal, notes, activities, emails, products] = await Promise.all([
        axios.get(`${this.pipedrive.baseUrl}/deals/${dealId}`, {
          params: { api_token: this.pipedrive.apiKey }
        }),
        axios.get(`${this.pipedrive.baseUrl}/deals/${dealId}/notes`, {
          params: { api_token: this.pipedrive.apiKey, limit: 500 }
        }),
        axios.get(`${this.pipedrive.baseUrl}/deals/${dealId}/activities`, {
          params: { api_token: this.pipedrive.apiKey, limit: 500, done: '0,1' }
        }),
        axios.get(`${this.pipedrive.baseUrl}/deals/${dealId}/mailMessages`, {
          params: { api_token: this.pipedrive.apiKey, limit: 500 }
        }),
        axios.get(`${this.pipedrive.baseUrl}/deals/${dealId}/products`, {
          params: { api_token: this.pipedrive.apiKey, limit: 500 }
        })
      ]);

      const dealData = deal.data.data;
      
      return {
        ...dealData,
        all_notes: notes.data.data || [],
        all_activities: activities.data.data || [],
        all_emails: emails.data.data || [],
        all_products: products.data.data || [],
        last_synced: new Date()
      };
    } catch (error) {
      console.error(`Error fetching complete deal ${dealId}:`, error);
      return null;
    }
  }

  // Fetch complete activity data
  async fetchActivityComplete(activityId) {
    try {
      const response = await axios.get(`${this.pipedrive.baseUrl}/activities/${activityId}`, {
        params: { api_token: this.pipedrive.apiKey }
      });
      
      return {
        ...response.data.data,
        last_synced: new Date()
      };
    } catch (error) {
      console.error(`Error fetching activity ${activityId}:`, error);
      return null;
    }
  }

  // Fetch complete note data
  async fetchNoteComplete(noteId) {
    try {
      const response = await axios.get(`${this.pipedrive.baseUrl}/notes/${noteId}`, {
        params: { api_token: this.pipedrive.apiKey }
      });
      
      return {
        ...response.data.data,
        last_synced: new Date()
      };
    } catch (error) {
      console.error(`Error fetching note ${noteId}:`, error);
      return null;
    }
  }

  // Fetch complete organization data
  async fetchOrganizationComplete(orgId) {
    try {
      const response = await axios.get(`${this.pipedrive.baseUrl}/organizations/${orgId}`, {
        params: { api_token: this.pipedrive.apiKey }
      });
      
      return {
        ...response.data.data,
        last_synced: new Date()
      };
    } catch (error) {
      console.error(`Error fetching organization ${orgId}:`, error);
      return null;
    }
  }

  // Update contact's next activity information
  async updateContactNextActivity(personId) {
    try {
      // Fetch upcoming activities for this person
      const response = await axios.get(`${this.pipedrive.baseUrl}/persons/${personId}/activities`, {
        params: { 
          api_token: this.pipedrive.apiKey,
          done: '0',
          limit: 1,
          sort: 'due_date ASC'
        }
      });

      const nextActivity = response.data.data?.[0];
      
      if (nextActivity) {
        // Update contact with next activity info
        await this.supabase
          .from('contacts')
          .update({
            next_activity_date: nextActivity.due_date,
            next_activity_time: nextActivity.due_time,
            next_activity_subject: nextActivity.subject,
            next_activity_type: nextActivity.type,
            next_activity_id: nextActivity.id,
            updated_at: new Date()
          })
          .eq('pipedrive_id', personId);
      }
    } catch (error) {
      console.error(`Error updating next activity for person ${personId}:`, error);
    }
  }

  // Upsert operations
  async upsertContact(personData) {
    if (!personData) return;
    
    const transformedContact = await this.transformPerson(personData);
    
    await this.supabase
      .from('contacts')
      .upsert(transformedContact, { onConflict: 'pipedrive_id' });
  }

  async upsertDeal(dealData) {
    if (!dealData) return;
    
    const transformedDeal = this.transformDeal(dealData);
    
    await this.supabase
      .from('deals')
      .upsert(transformedDeal, { onConflict: 'pipedrive_id' });
  }

  async upsertActivity(activityData) {
    if (!activityData) return;
    
    const transformedActivity = this.transformActivity(activityData);
    
    await this.supabase
      .from('activities')
      .upsert(transformedActivity, { onConflict: 'pipedrive_id' });
  }

  async upsertNote(noteData) {
    if (!noteData) return;
    
    const transformedNote = this.transformNote(noteData);
    
    await this.supabase
      .from('notes')
      .upsert(transformedNote, { onConflict: 'pipedrive_id' });
  }

  async upsertOrganization(orgData) {
    if (!orgData) return;
    
    const transformedOrg = this.transformOrganization(orgData);
    
    await this.supabase
      .from('organizations')
      .upsert(transformedOrg, { onConflict: 'pipedrive_id' });
  }

  // Delete operations
  async deleteContact(personId) {
    await this.supabase
      .from('contacts')
      .delete()
      .eq('pipedrive_id', personId);
  }

  async deleteDeal(dealId) {
    await this.supabase
      .from('deals')
      .delete()
      .eq('pipedrive_id', dealId);
  }

  async deleteActivity(activityId) {
    await this.supabase
      .from('activities')
      .delete()
      .eq('pipedrive_id', activityId);
  }

  async deleteNote(noteId) {
    await this.supabase
      .from('notes')
      .delete()
      .eq('pipedrive_id', noteId);
  }

  async deleteOrganization(orgId) {
    await this.supabase
      .from('organizations')
      .delete()
      .eq('pipedrive_id', orgId);
  }

  // Transform functions (similar to migration tool but for real-time updates)
  async transformPerson(person) {
    return {
      pipedrive_id: person.id,
      name: person.name,
      email: this.extractEmail(person.email),
      phone_number: this.formatAustralianPhone(person.phone),
      organization_id: person.org_id?.value || null,
      assigned_agent_id: person.owner_id?.value || null,
      created_at: person.add_time,
      updated_at: person.update_time || new Date(),
      
      // Activity information
      last_activity_date: person.last_activity_date,
      next_activity_date: person.next_activity_date,
      next_activity_time: person.next_activity_time,
      next_activity_subject: person.next_activity_subject,
      next_activity_type: person.next_activity_type,
      
      // Stats
      activities_count: person.activities_count,
      done_activities_count: person.done_activities_count,
      undone_activities_count: person.undone_activities_count,
      email_messages_count: person.email_messages_count,
      open_deals_count: person.open_deals_count,
      closed_deals_count: person.closed_deals_count,
      won_deals_count: person.won_deals_count,
      lost_deals_count: person.lost_deals_count,
      
      // Additional data
      all_notes: person.all_notes || [],
      all_activities: person.all_activities || [],
      all_emails: person.all_emails || [],
      all_deals: person.all_deals || [],
      
      last_synced: person.last_synced || new Date(),
      source: 'pipedrive_sync'
    };
  }

  transformDeal(deal) {
    return {
      pipedrive_id: deal.id,
      title: deal.title,
      value: deal.value,
      currency: deal.currency,
      contact_id: deal.person_id?.value || null,
      organization_id: deal.org_id?.value || null,
      stage: this.mapDealStage(deal.stage_id),
      status: deal.status,
      probability: deal.probability,
      expected_close_date: deal.expected_close_date,
      created_at: deal.add_time,
      updated_at: deal.update_time || new Date(),
      
      // Activity tracking
      last_activity_date: deal.last_activity_date,
      next_activity_date: deal.next_activity_date,
      next_activity_time: deal.next_activity_time,
      next_activity_subject: deal.next_activity_subject,
      
      // Additional data
      all_notes: deal.all_notes || [],
      all_activities: deal.all_activities || [],
      all_emails: deal.all_emails || [],
      all_products: deal.all_products || [],
      
      last_synced: deal.last_synced || new Date(),
      source: 'pipedrive_sync'
    };
  }

  transformActivity(activity) {
    return {
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
      updated_at: activity.update_time || new Date(),
      completed_at: activity.marked_as_done_time,
      assigned_agent_id: activity.owner_id?.value || null,
      last_synced: activity.last_synced || new Date(),
      source: 'pipedrive_sync'
    };
  }

  transformNote(note) {
    return {
      pipedrive_id: note.id,
      content: note.content,
      contact_id: note.person_id,
      deal_id: note.deal_id,
      organization_id: note.org_id,
      created_at: note.add_time,
      updated_at: note.update_time || new Date(),
      created_by: note.user_id,
      last_synced: note.last_synced || new Date(),
      source: 'pipedrive_sync'
    };
  }

  transformOrganization(org) {
    return {
      pipedrive_id: org.id,
      name: org.name,
      address: org.address,
      assigned_agent_id: org.owner_id?.value || null,
      created_at: org.add_time,
      updated_at: org.update_time || new Date(),
      last_synced: org.last_synced || new Date(),
      source: 'pipedrive_sync'
    };
  }

  // Utility functions
  extractEmail(emailData) {
    if (Array.isArray(emailData) && emailData.length > 0) {
      return emailData[0].value;
    }
    return emailData || null;
  }

  formatAustralianPhone(phoneData) {
    if (!phoneData) return null;
    
    let phone = phoneData;
    if (Array.isArray(phoneData) && phoneData.length > 0) {
      phone = phoneData[0].value;
    }
    
    phone = phone.replace(/\D/g, '');
    
    if (phone.startsWith('61')) {
      phone = '+' + phone;
    } else if (phone.startsWith('0')) {
      phone = '+61' + phone.substr(1);
    } else if (!phone.startsWith('+')) {
      phone = '+61' + phone;
    }
    
    return phone;
  }

  mapDealStage(stageId) {
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

  // Start periodic sync for any missed webhook events
  startPeriodicSync() {
    // Sync every 5 minutes
    this.syncInterval = setInterval(async () => {
      await this.performIncrementalSync();
    }, 5 * 60 * 1000);
  }

  // Perform incremental sync since last sync time
  async performIncrementalSync() {
    if (!this.lastSyncTime) {
      this.lastSyncTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24 hours ago
    }

    console.log(`🔄 Performing incremental sync since ${this.lastSyncTime.toISOString()}`);

    try {
      // Fetch recently updated records
      const [persons, deals, activities] = await Promise.all([
        this.fetchRecentlyUpdatedPersons(),
        this.fetchRecentlyUpdatedDeals(),
        this.fetchRecentlyUpdatedActivities()
      ]);

      // Process updates
      for (const person of persons) {
        await this.upsertContact(person);
      }
      for (const deal of deals) {
        await this.upsertDeal(deal);
      }
      for (const activity of activities) {
        await this.upsertActivity(activity);
      }

      this.lastSyncTime = new Date();
      await this.updateSyncStatus();

      console.log(`✅ Incremental sync completed. Updated: ${persons.length} contacts, ${deals.length} deals, ${activities.length} activities`);
    } catch (error) {
      console.error('Error during incremental sync:', error);
    }
  }

  // Fetch recently updated persons
  async fetchRecentlyUpdatedPersons() {
    try {
      const response = await axios.get(`${this.pipedrive.baseUrl}/persons`, {
        params: {
          api_token: this.pipedrive.apiKey,
          limit: 500,
          sort: 'update_time DESC',
          start_date: this.lastSyncTime.toISOString().split('T')[0]
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching recent persons:', error);
      return [];
    }
  }

  // Fetch recently updated deals
  async fetchRecentlyUpdatedDeals() {
    try {
      const response = await axios.get(`${this.pipedrive.baseUrl}/deals`, {
        params: {
          api_token: this.pipedrive.apiKey,
          limit: 500,
          sort: 'update_time DESC',
          start_date: this.lastSyncTime.toISOString().split('T')[0]
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching recent deals:', error);
      return [];
    }
  }

  // Fetch recently updated activities
  async fetchRecentlyUpdatedActivities() {
    try {
      const response = await axios.get(`${this.pipedrive.baseUrl}/activities`, {
        params: {
          api_token: this.pipedrive.apiKey,
          limit: 500,
          done: '0,1',
          start_date: this.lastSyncTime.toISOString().split('T')[0]
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }

  // Update sync status in database
  async updateSyncStatus() {
    try {
      await this.supabase
        .from('sync_status')
        .upsert({
          service: 'pipedrive',
          last_sync: this.lastSyncTime,
          status: 'active',
          webhooks_active: this.webhooks.length > 0,
          webhook_count: this.webhooks.length
        }, { onConflict: 'service' });
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  }

  // Stop sync and cleanup
  async stopSync() {
    // Clear periodic sync
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    // Remove webhooks
    for (const webhook of this.webhooks) {
      try {
        await axios.delete(`${this.pipedrive.baseUrl}/webhooks/${webhook.id}`, {
          params: { api_token: this.pipedrive.apiKey }
        });
      } catch (error) {
        console.error(`Error removing webhook ${webhook.id}:`, error);
      }
    }

    this.webhooks = [];
    
    await this.supabase
      .from('sync_status')
      .update({ status: 'stopped', webhooks_active: false })
      .eq('service', 'pipedrive');

    console.log('🛑 PipeDrive sync stopped');
  }
}

// Singleton instance
let syncInstance = null;

export const getPipeDriveSync = () => {
  if (!syncInstance) {
    syncInstance = new PipeDriveRealtimeSync();
  }
  return syncInstance;
};

export default PipeDriveRealtimeSync;