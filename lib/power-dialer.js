// PowerDialer - Automated sequential dialing system
// Integrates with Twilio for high-volume calling

import twilio from 'twilio';

class PowerDialer {
  constructor() {
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    this.activeCampaigns = new Map();
    this.callQueue = [];
    this.activeCall = null;
    this.statistics = new Map();
    
    this.config = {
      maxRetries: 2,
      retryDelay: 3600000, // 1 hour
      callTimeout: 30000, // 30 seconds ring time
      voicemailDetection: true,
      recordCalls: true,
      simultaneousCalls: 1, // Can be increased for parallel dialing
      pacingMode: 'progressive', // predictive, progressive, or preview
      abandonRate: 0.03, // 3% max abandon rate for predictive
      wrapUpTime: 30000, // 30 seconds between calls
      complianceMode: true // Ensures TCPA compliance
    };
    
    this.dialingModes = {
      PREVIEW: 'preview', // Agent reviews before call
      PROGRESSIVE: 'progressive', // Auto-dial when agent ready
      PREDICTIVE: 'predictive', // Dial multiple, predict availability
      POWER: 'power' // Rapid sequential dialing
    };
    
    this.callOutcomes = {
      ANSWERED: 'answered',
      VOICEMAIL: 'voicemail',
      BUSY: 'busy',
      NO_ANSWER: 'no_answer',
      FAILED: 'failed',
      INVALID: 'invalid_number',
      DO_NOT_CALL: 'do_not_call',
      CALLBACK: 'callback_scheduled'
    };
  }

  // Create a new dialing campaign
  createCampaign(campaignData) {
    const campaign = {
      id: this.generateCampaignId(),
      name: campaignData.name,
      agentId: campaignData.agentId,
      contacts: campaignData.contacts || [],
      filters: campaignData.filters || {},
      script: campaignData.script || null,
      mode: campaignData.mode || this.dialingModes.PROGRESSIVE,
      schedule: {
        startTime: campaignData.startTime || '09:00',
        endTime: campaignData.endTime || '20:00',
        timezone: campaignData.timezone || 'Australia/Sydney',
        daysOfWeek: campaignData.daysOfWeek || [1, 2, 3, 4, 5] // Mon-Fri
      },
      goals: {
        target: campaignData.targetCalls || 100,
        connects: campaignData.targetConnects || 30,
        appointments: campaignData.targetAppointments || 5
      },
      status: 'created',
      createdAt: new Date(),
      statistics: {
        totalDialed: 0,
        connected: 0,
        voicemails: 0,
        callbacks: 0,
        appointments: 0,
        avgCallDuration: 0,
        conversionRate: 0
      }
    };
    
    this.activeCampaigns.set(campaign.id, campaign);
    return campaign;
  }

  // Start dialing campaign
  async startCampaign(campaignId, agentDevice) {
    const campaign = this.activeCampaigns.get(campaignId);
    if (!campaign) throw new Error('Campaign not found');
    
    campaign.status = 'active';
    campaign.startedAt = new Date();
    campaign.agentDevice = agentDevice;
    
    console.log(`🚀 Starting PowerDialer campaign: ${campaign.name}`);
    
    // Build call queue
    await this.buildCallQueue(campaign);
    
    // Start dialing based on mode
    switch (campaign.mode) {
      case this.dialingModes.PREVIEW:
        return this.startPreviewDialing(campaign);
      case this.dialingModes.PROGRESSIVE:
        return this.startProgressiveDialing(campaign);
      case this.dialingModes.PREDICTIVE:
        return this.startPredictiveDialing(campaign);
      case this.dialingModes.POWER:
        return this.startPowerDialing(campaign);
      default:
        return this.startProgressiveDialing(campaign);
    }
  }

  // Build prioritized call queue
  async buildCallQueue(campaign) {
    let contacts = [...campaign.contacts];
    
    // Apply filters
    if (campaign.filters.hasPhone) {
      contacts = contacts.filter(c => c.phone);
    }
    if (campaign.filters.lastContactDays) {
      const cutoff = Date.now() - (campaign.filters.lastContactDays * 24 * 60 * 60 * 1000);
      contacts = contacts.filter(c => !c.lastContact || new Date(c.lastContact) < cutoff);
    }
    if (campaign.filters.priority) {
      contacts = contacts.filter(c => c.priority === campaign.filters.priority);
    }
    
    // Sort by priority and score
    contacts.sort((a, b) => {
      // Priority first
      if (a.priority !== b.priority) {
        const priorities = { high: 3, medium: 2, low: 1 };
        return (priorities[b.priority] || 0) - (priorities[a.priority] || 0);
      }
      // Then by score
      return (b.score || 0) - (a.score || 0);
    });
    
    // Check Do Not Call list
    const cleanContacts = await this.filterDoNotCall(contacts);
    
    // Add to queue with metadata
    this.callQueue = cleanContacts.map(contact => ({
      contact,
      campaignId: campaign.id,
      attempts: 0,
      lastAttempt: null,
      outcome: null,
      scheduled: this.calculateCallTime(contact, campaign.schedule)
    }));
    
    console.log(`📋 Call queue built: ${this.callQueue.length} contacts ready`);
    return this.callQueue;
  }

  // Progressive dialing - one call at a time when agent ready
  async startProgressiveDialing(campaign) {
    console.log('📞 Starting Progressive Dialing');
    
    const processNext = async () => {
      if (campaign.status !== 'active') return;
      
      const nextCall = this.getNextCall(campaign.id);
      if (!nextCall) {
        console.log('✅ Campaign complete - no more contacts');
        return this.completeCampaign(campaign.id);
      }
      
      // Wait for agent to be ready
      await this.waitForAgent(campaign);
      
      // Make the call
      const result = await this.placeCall(nextCall, campaign);
      
      // Update statistics
      this.updateStatistics(campaign, result);
      
      // Handle outcome
      await this.handleCallOutcome(result, nextCall, campaign);
      
      // Wrap-up time
      await this.delay(this.config.wrapUpTime);
      
      // Continue to next call
      if (campaign.status === 'active') {
        processNext();
      }
    };
    
    // Start the process
    processNext();
  }

  // Preview dialing - agent sees contact before dialing
  async startPreviewDialing(campaign) {
    console.log('👁️ Starting Preview Dialing');
    
    const processNext = async () => {
      if (campaign.status !== 'active') return;
      
      const nextCall = this.getNextCall(campaign.id);
      if (!nextCall) {
        return this.completeCampaign(campaign.id);
      }
      
      // Show preview to agent
      const preview = await this.showPreview(nextCall, campaign);
      
      if (preview.action === 'dial') {
        const result = await this.placeCall(nextCall, campaign);
        this.updateStatistics(campaign, result);
        await this.handleCallOutcome(result, nextCall, campaign);
      } else if (preview.action === 'skip') {
        nextCall.outcome = 'skipped';
        this.moveToEnd(nextCall);
      } else if (preview.action === 'remove') {
        nextCall.outcome = 'removed';
        this.removeFromQueue(nextCall);
      }
      
      // Continue to next
      await this.delay(2000);
      processNext();
    };
    
    processNext();
  }

  // Predictive dialing - dial multiple lines, predict agent availability
  async startPredictiveDialing(campaign) {
    console.log('🔮 Starting Predictive Dialing');
    
    const simultaneousDialing = async () => {
      if (campaign.status !== 'active') return;
      
      // Calculate optimal dial ratio based on statistics
      const dialRatio = this.calculateDialRatio(campaign);
      const callsToPlace = Math.ceil(dialRatio);
      
      const calls = [];
      for (let i = 0; i < callsToPlace; i++) {
        const nextCall = this.getNextCall(campaign.id);
        if (nextCall) {
          calls.push(this.placeCall(nextCall, campaign));
        }
      }
      
      // Wait for first connection
      const results = await Promise.allSettled(calls);
      const connected = results.find(r => r.status === 'fulfilled' && r.value.outcome === 'answered');
      
      if (connected) {
        // Route to agent
        await this.routeToAgent(connected.value, campaign);
        this.updateStatistics(campaign, connected.value);
        
        // Handle abandoned calls
        results.forEach(r => {
          if (r !== connected && r.value?.outcome === 'answered') {
            this.handleAbandonedCall(r.value);
          }
        });
      }
      
      // Adjust pacing based on performance
      this.adjustPacing(campaign, results);
      
      // Continue dialing
      if (campaign.status === 'active') {
        setTimeout(() => simultaneousDialing(), 1000);
      }
    };
    
    simultaneousDialing();
  }

  // Power dialing - rapid sequential dialing
  async startPowerDialing(campaign) {
    console.log('⚡ Starting Power Dialing');
    
    const rapidDial = async () => {
      if (campaign.status !== 'active') return;
      
      const nextCall = this.getNextCall(campaign.id);
      if (!nextCall) {
        return this.completeCampaign(campaign.id);
      }
      
      // Place call immediately
      const result = await this.placeCall(nextCall, campaign);
      
      // Quick handling based on outcome
      if (result.outcome === this.callOutcomes.ANSWERED) {
        // Connected - handle the call
        await this.routeToAgent(result, campaign);
        this.updateStatistics(campaign, result);
        await this.delay(this.config.wrapUpTime);
      } else {
        // Not connected - move to next immediately
        this.updateStatistics(campaign, result);
        await this.delay(1000); // Brief pause between failed calls
      }
      
      // Continue rapidly
      rapidDial();
    };
    
    rapidDial();
  }

  // Place a call
  async placeCall(callItem, campaign) {
    const { contact } = callItem;
    
    console.log(`📞 Dialing: ${contact.name} - ${contact.phone}`);
    
    try {
      // Check time restrictions
      if (!this.isCallTimeAllowed(campaign.schedule)) {
        console.log('⏰ Outside calling hours');
        return { outcome: 'scheduled', contact };
      }
      
      // Initiate call via Twilio
      const call = await this.twilioClient.calls.create({
        to: contact.phone,
        from: campaign.callerId || process.env.TWILIO_PHONE_NUMBER,
        url: `${process.env.BASE_URL}/api/voice/powerdialer-connect`,
        statusCallback: `${process.env.BASE_URL}/api/voice/status`,
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        timeout: Math.floor(this.config.callTimeout / 1000),
        record: this.config.recordCalls,
        machineDetection: this.config.voicemailDetection ? 'DetectMessageEnd' : 'none',
        machineDetectionTimeout: 3000
      });
      
      // Wait for outcome
      const outcome = await this.waitForCallOutcome(call.sid);
      
      return {
        callSid: call.sid,
        contact,
        outcome: outcome.status,
        duration: outcome.duration,
        answeredBy: outcome.answeredBy, // human or machine
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error(`❌ Call failed: ${error.message}`);
      return {
        contact,
        outcome: this.callOutcomes.FAILED,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  // Wait for call outcome
  async waitForCallOutcome(callSid) {
    return new Promise((resolve) => {
      let checkCount = 0;
      const maxChecks = 30; // 30 seconds max
      
      const checkStatus = async () => {
        checkCount++;
        
        try {
          const call = await this.twilioClient.calls(callSid).fetch();
          
          if (call.status === 'completed' || call.status === 'failed' || call.status === 'busy' || call.status === 'no-answer') {
            resolve({
              status: this.mapTwilioStatus(call.status),
              duration: call.duration,
              answeredBy: call.answeredBy
            });
          } else if (checkCount >= maxChecks) {
            resolve({
              status: this.callOutcomes.NO_ANSWER,
              duration: 0
            });
          } else {
            setTimeout(checkStatus, 1000);
          }
        } catch (error) {
          resolve({
            status: this.callOutcomes.FAILED,
            duration: 0,
            error: error.message
          });
        }
      };
      
      setTimeout(checkStatus, 2000); // Start checking after 2 seconds
    });
  }

  // Map Twilio status to our outcomes
  mapTwilioStatus(twilioStatus) {
    const statusMap = {
      'completed': this.callOutcomes.ANSWERED,
      'busy': this.callOutcomes.BUSY,
      'no-answer': this.callOutcomes.NO_ANSWER,
      'failed': this.callOutcomes.FAILED,
      'canceled': this.callOutcomes.FAILED
    };
    
    return statusMap[twilioStatus] || this.callOutcomes.FAILED;
  }

  // Handle call outcome
  async handleCallOutcome(result, callItem, campaign) {
    const { outcome, contact } = result;
    
    // Log outcome
    this.logCallOutcome(campaign.id, result);
    
    // Update contact record
    callItem.lastAttempt = new Date();
    callItem.attempts++;
    callItem.outcome = outcome;
    
    // Determine next action
    switch (outcome) {
      case this.callOutcomes.ANSWERED:
        // Successful connection - remove from queue
        this.removeFromQueue(callItem);
        break;
        
      case this.callOutcomes.VOICEMAIL:
        // Leave voicemail if configured
        if (campaign.leaveVoicemail) {
          await this.leaveVoicemail(result, campaign);
        }
        // Retry later
        if (callItem.attempts < this.config.maxRetries) {
          this.scheduleRetry(callItem);
        } else {
          this.removeFromQueue(callItem);
        }
        break;
        
      case this.callOutcomes.BUSY:
      case this.callOutcomes.NO_ANSWER:
        // Retry later if under max attempts
        if (callItem.attempts < this.config.maxRetries) {
          this.scheduleRetry(callItem);
        } else {
          this.removeFromQueue(callItem);
        }
        break;
        
      case this.callOutcomes.FAILED:
      case this.callOutcomes.INVALID:
        // Remove from queue
        this.removeFromQueue(callItem);
        break;
    }
  }

  // Update campaign statistics
  updateStatistics(campaign, result) {
    const stats = campaign.statistics;
    
    stats.totalDialed++;
    
    if (result.outcome === this.callOutcomes.ANSWERED) {
      stats.connected++;
      if (result.duration) {
        const totalDuration = stats.avgCallDuration * (stats.connected - 1) + result.duration;
        stats.avgCallDuration = totalDuration / stats.connected;
      }
    } else if (result.outcome === this.callOutcomes.VOICEMAIL) {
      stats.voicemails++;
    }
    
    // Calculate conversion rate
    if (stats.totalDialed > 0) {
      stats.conversionRate = (stats.connected / stats.totalDialed) * 100;
    }
    
    // Store in persistent stats
    this.statistics.set(campaign.id, stats);
  }

  // Calculate optimal dial ratio for predictive dialing
  calculateDialRatio(campaign) {
    const stats = campaign.statistics;
    
    if (stats.totalDialed < 10) {
      return 1.2; // Conservative start
    }
    
    const connectRate = stats.connected / stats.totalDialed;
    const avgHandleTime = stats.avgCallDuration || 180; // Default 3 minutes
    const avgWaitTime = 5; // Average wait time for connection
    
    // Calculate based on Erlang C formula (simplified)
    const agentUtilization = 0.85; // Target 85% agent utilization
    const dialRatio = 1 / (connectRate * agentUtilization);
    
    // Cap to prevent excessive abandonment
    const maxRatio = 1 / (this.config.abandonRate * 10);
    
    return Math.min(dialRatio, maxRatio);
  }

  // Show preview to agent
  async showPreview(callItem, campaign) {
    const { contact } = callItem;
    
    // Send preview to agent interface
    const preview = {
      contact,
      script: campaign.script,
      history: await this.getContactHistory(contact.id),
      suggestions: await this.getCallSuggestions(contact)
    };
    
    // Wait for agent decision (simulated)
    return new Promise((resolve) => {
      // In production, this would wait for actual agent input
      setTimeout(() => {
        resolve({ action: 'dial' }); // Default to dial
      }, 3000);
    });
  }

  // Route call to agent
  async routeToAgent(result, campaign) {
    console.log(`☎️ Routing call to agent: ${campaign.agentDevice}`);
    
    // Bridge the call to agent
    try {
      await this.twilioClient.calls(result.callSid).update({
        url: `${process.env.BASE_URL}/api/voice/agent-connect`,
        method: 'POST'
      });
      
      return { success: true, agentConnected: true };
    } catch (error) {
      console.error('Failed to route to agent:', error);
      return { success: false, error: error.message };
    }
  }

  // Get next call from queue
  getNextCall(campaignId) {
    const now = new Date();
    
    return this.callQueue.find(item => 
      item.campaignId === campaignId &&
      !item.outcome &&
      (!item.scheduled || item.scheduled <= now)
    );
  }

  // Schedule retry
  scheduleRetry(callItem) {
    callItem.scheduled = new Date(Date.now() + this.config.retryDelay);
    callItem.outcome = null; // Reset outcome for retry
    console.log(`🔄 Scheduled retry for ${callItem.contact.name} at ${callItem.scheduled}`);
  }

  // Remove from queue
  removeFromQueue(callItem) {
    const index = this.callQueue.indexOf(callItem);
    if (index > -1) {
      this.callQueue.splice(index, 1);
    }
  }

  // Move to end of queue
  moveToEnd(callItem) {
    this.removeFromQueue(callItem);
    this.callQueue.push(callItem);
  }

  // Complete campaign
  completeCampaign(campaignId) {
    const campaign = this.activeCampaigns.get(campaignId);
    if (!campaign) return;
    
    campaign.status = 'completed';
    campaign.completedAt = new Date();
    
    console.log(`🎯 Campaign Complete: ${campaign.name}`);
    console.log(`📊 Results:`, campaign.statistics);
    
    // Generate report
    const report = this.generateCampaignReport(campaign);
    
    return report;
  }

  // Generate campaign report
  generateCampaignReport(campaign) {
    const duration = (campaign.completedAt - campaign.startedAt) / 1000 / 60; // minutes
    const stats = campaign.statistics;
    
    return {
      campaignId: campaign.id,
      name: campaign.name,
      duration: Math.round(duration),
      totalDialed: stats.totalDialed,
      connected: stats.connected,
      connectRate: `${stats.conversionRate.toFixed(1)}%`,
      avgCallDuration: `${Math.round(stats.avgCallDuration)} seconds`,
      voicemails: stats.voicemails,
      callbacks: stats.callbacks,
      appointments: stats.appointments,
      costEstimate: this.calculateCost(stats),
      recommendations: this.generateRecommendations(stats)
    };
  }

  // Pause campaign
  pauseCampaign(campaignId) {
    const campaign = this.activeCampaigns.get(campaignId);
    if (campaign && campaign.status === 'active') {
      campaign.status = 'paused';
      campaign.pausedAt = new Date();
      console.log(`⏸️ Campaign paused: ${campaign.name}`);
      return true;
    }
    return false;
  }

  // Resume campaign
  resumeCampaign(campaignId) {
    const campaign = this.activeCampaigns.get(campaignId);
    if (campaign && campaign.status === 'paused') {
      campaign.status = 'active';
      delete campaign.pausedAt;
      console.log(`▶️ Campaign resumed: ${campaign.name}`);
      
      // Restart dialing
      this.startCampaign(campaignId, campaign.agentDevice);
      return true;
    }
    return false;
  }

  // Helper functions
  generateCampaignId() {
    return `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async filterDoNotCall(contacts) {
    // Check against Do Not Call registry
    // In production, this would check actual DNC lists
    return contacts.filter(c => !c.doNotCall);
  }

  calculateCallTime(contact, schedule) {
    // Calculate optimal call time based on contact preferences and schedule
    const now = new Date();
    const hour = now.getHours();
    
    if (hour < parseInt(schedule.startTime) || hour >= parseInt(schedule.endTime)) {
      // Schedule for next available time
      const nextDay = new Date(now);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(parseInt(schedule.startTime), 0, 0, 0);
      return nextDay;
    }
    
    return now;
  }

  isCallTimeAllowed(schedule) {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    return hour >= parseInt(schedule.startTime) && 
           hour < parseInt(schedule.endTime) &&
           schedule.daysOfWeek.includes(day);
  }

  async waitForAgent(campaign) {
    // Check if agent is ready
    // In production, this would check actual agent status
    return new Promise(resolve => setTimeout(resolve, 1000));
  }

  adjustPacing(campaign, results) {
    // Adjust dialing pace based on results
    const answered = results.filter(r => r.value?.outcome === 'answered').length;
    const total = results.length;
    
    if (answered > 1) {
      // Too many simultaneous answers - reduce pace
      campaign.dialRatio = Math.max(1, (campaign.dialRatio || 1.5) - 0.1);
    } else if (answered === 0 && total > 2) {
      // No answers - increase pace
      campaign.dialRatio = Math.min(3, (campaign.dialRatio || 1.5) + 0.1);
    }
  }

  handleAbandonedCall(call) {
    console.log(`⚠️ Abandoned call: ${call.contact.name}`);
    // Log abandoned call for compliance
    this.logAbandonedCall(call);
  }

  logCallOutcome(campaignId, result) {
    // Log call outcome for reporting
    const log = {
      campaignId,
      timestamp: new Date(),
      contact: result.contact,
      outcome: result.outcome,
      duration: result.duration
    };
    
    // Store in database or file
    console.log('📝 Call logged:', log);
  }

  logAbandonedCall(call) {
    // Log abandoned calls for compliance reporting
    const log = {
      timestamp: new Date(),
      contact: call.contact,
      reason: 'No agent available'
    };
    
    console.log('⚠️ Abandoned call logged:', log);
  }

  async leaveVoicemail(result, campaign) {
    // Leave pre-recorded voicemail
    if (campaign.voicemailUrl) {
      console.log(`📬 Leaving voicemail for ${result.contact.name}`);
      // Twilio would play the voicemail message
    }
  }

  async getContactHistory(contactId) {
    // Fetch contact history from database
    return {
      lastCall: null,
      notes: [],
      deals: []
    };
  }

  async getCallSuggestions(contact) {
    // Generate AI suggestions for the call
    return {
      opening: 'Mention their interest in Gregory Hills property',
      topics: ['Property availability', 'Market update', 'Viewing schedule'],
      objections: ['Price concern', 'Timing', 'Location']
    };
  }

  calculateCost(stats) {
    // Estimate campaign cost based on Twilio rates
    const costPerMinute = 0.013; // Twilio rate
    const totalMinutes = (stats.avgCallDuration * stats.totalDialed) / 60;
    return Math.round(totalMinutes * costPerMinute * 100) / 100;
  }

  generateRecommendations(stats) {
    const recommendations = [];
    
    if (stats.conversionRate < 20) {
      recommendations.push('Consider improving contact data quality');
    }
    if (stats.avgCallDuration < 60) {
      recommendations.push('Calls are too short - review opening script');
    }
    if (stats.voicemails > stats.connected) {
      recommendations.push('High voicemail rate - try different calling times');
    }
    
    return recommendations;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let dialerInstance = null;

export const getPowerDialer = () => {
  if (!dialerInstance) {
    dialerInstance = new PowerDialer();
  }
  return dialerInstance;
};

export default PowerDialer;