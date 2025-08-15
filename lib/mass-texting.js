// Mass Texting with MMS Support and Contact Frequency Safeguards
import twilio from 'twilio';
import { getCallCarousel } from './call-carousel';

class MassTextingService {
  constructor() {
    this.client = null;
    this.textHistory = new Map(); // Contact ID -> Last Text Info
    this.campaigns = new Map(); // Campaign ID -> Campaign Data
    this.templates = [];
    this.mediaLibrary = new Map(); // Media ID -> URL
  }

  async initialize() {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      await this.loadTemplates();
    }
  }

  // Load message templates
  async loadTemplates() {
    this.templates = [
      {
        id: 'open-home',
        name: 'Open Home Invitation',
        message: 'Hi {firstName}, You\'re invited to our open home at {property} this {day} from {time}. RSVP: {link}',
        variables: ['firstName', 'property', 'day', 'time', 'link'],
        category: 'event'
      },
      {
        id: 'new-listing',
        name: 'New Listing Alert',
        message: 'Hi {firstName}, New listing just hit the market! {bedrooms}BR {bathrooms}BA at {address}. View: {link}',
        variables: ['firstName', 'bedrooms', 'bathrooms', 'address', 'link'],
        category: 'listing'
      },
      {
        id: 'price-update',
        name: 'Price Update',
        message: 'Hi {firstName}, Great news! The property at {address} has been reduced to ${price}. Schedule viewing: {link}',
        variables: ['firstName', 'address', 'price', 'link'],
        category: 'update'
      },
      {
        id: 'follow-up',
        name: 'Inspection Follow-up',
        message: 'Hi {firstName}, Thanks for viewing {property} today! Any questions? Reply or call me on {agentPhone}. - {agentName}',
        variables: ['firstName', 'property', 'agentPhone', 'agentName'],
        category: 'follow-up'
      }
    ];
  }

  // Check if contact was recently texted (within 1 month)
  wasRecentlyTexted(contactId, daysThreshold = 30) {
    const lastText = this.textHistory.get(contactId);
    if (!lastText) return false;
    
    const daysSinceText = (Date.now() - lastText.timestamp) / (1000 * 60 * 60 * 24);
    return daysSinceText < daysThreshold;
  }

  // Record text for history tracking
  recordText(contactId, campaignId, phoneNumber) {
    this.textHistory.set(contactId, {
      timestamp: Date.now(),
      campaignId,
      phoneNumber,
      lastTextDate: new Date().toISOString()
    });
  }

  // Create a new campaign
  createCampaign(config) {
    const campaignId = `campaign_${Date.now()}`;
    const campaign = {
      id: campaignId,
      name: config.name,
      templateId: config.templateId,
      recipients: config.recipients || [],
      variables: config.variables || {},
      mediaUrls: config.mediaUrls || [],
      scheduled: config.scheduled || null,
      createdAt: new Date(),
      status: 'draft',
      stats: {
        total: 0,
        sent: 0,
        delivered: 0,
        failed: 0,
        skipped: 0
      }
    };
    
    this.campaigns.set(campaignId, campaign);
    return campaign;
  }

  // Process template variables
  processTemplate(template, contact, globalVars = {}) {
    let message = template.message;
    const vars = { ...globalVars, ...contact.variables };
    
    template.variables.forEach(variable => {
      const value = vars[variable] || contact[variable] || '';
      message = message.replace(`{${variable}}`, value);
    });
    
    return message;
  }

  // Send single SMS/MMS
  async sendMessage(to, body, mediaUrls = []) {
    try {
      const carousel = await getCallCarousel();
      const fromNumber = carousel.getNextCarouselNumber();
      
      const messageOptions = {
        body,
        from: fromNumber,
        to: to.startsWith('+61') ? to : `+61${to.replace(/^0/, '')}`
      };
      
      if (mediaUrls.length > 0) {
        messageOptions.mediaUrl = mediaUrls;
      }
      
      const message = await this.client.messages.create(messageOptions);
      return { success: true, sid: message.sid, status: message.status };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  // Execute mass texting campaign
  async executeCampaign(campaignId) {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    
    const template = this.templates.find(t => t.id === campaign.templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    
    campaign.status = 'running';
    campaign.startedAt = new Date();
    
    const results = [];
    const batchSize = 10; // Send in batches to avoid rate limits
    
    for (let i = 0; i < campaign.recipients.length; i += batchSize) {
      const batch = campaign.recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (recipient) => {
        // Check frequency safeguards
        if (this.wasRecentlyTexted(recipient.id)) {
          campaign.stats.skipped++;
          return {
            recipientId: recipient.id,
            status: 'skipped',
            reason: 'Recently contacted (within 30 days)'
          };
        }
        
        // Process template
        const message = this.processTemplate(template, recipient, campaign.variables);
        
        // Send message
        const result = await this.sendMessage(
          recipient.phone,
          message,
          campaign.mediaUrls
        );
        
        if (result.success) {
          campaign.stats.sent++;
          this.recordText(recipient.id, campaignId, recipient.phone);
        } else {
          campaign.stats.failed++;
        }
        
        return {
          recipientId: recipient.id,
          status: result.success ? 'sent' : 'failed',
          sid: result.sid,
          error: result.error
        };
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Rate limiting - wait 1 second between batches
      if (i + batchSize < campaign.recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    campaign.status = 'completed';
    campaign.completedAt = new Date();
    campaign.results = results;
    campaign.stats.total = campaign.recipients.length;
    
    return campaign;
  }

  // Schedule campaign for later
  scheduleCampaign(campaignId, scheduledTime) {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    
    campaign.scheduled = scheduledTime;
    campaign.status = 'scheduled';
    
    // In production, this would use a job scheduler
    const delay = new Date(scheduledTime) - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        this.executeCampaign(campaignId);
      }, delay);
    }
    
    return campaign;
  }

  // Get campaign analytics
  getCampaignAnalytics(campaignId) {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return null;
    
    const duration = campaign.completedAt 
      ? (campaign.completedAt - campaign.startedAt) / 1000 
      : null;
    
    return {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      stats: campaign.stats,
      deliveryRate: campaign.stats.total > 0 
        ? ((campaign.stats.sent / campaign.stats.total) * 100).toFixed(1)
        : 0,
      skipRate: campaign.stats.total > 0
        ? ((campaign.stats.skipped / campaign.stats.total) * 100).toFixed(1)
        : 0,
      duration: duration ? `${Math.round(duration)}s` : null,
      recipientsPerSecond: duration && campaign.stats.sent > 0
        ? (campaign.stats.sent / duration).toFixed(2)
        : null
    };
  }

  // Upload media for MMS
  async uploadMedia(fileUrl, description = '') {
    const mediaId = `media_${Date.now()}`;
    this.mediaLibrary.set(mediaId, {
      url: fileUrl,
      description,
      uploadedAt: new Date()
    });
    return mediaId;
  }

  // Get contact messaging summary
  getContactMessagingSummary(contactId) {
    const lastText = this.textHistory.get(contactId);
    if (!lastText) {
      return { hasHistory: false, canText: true };
    }
    
    const daysSinceText = Math.floor((Date.now() - lastText.timestamp) / (1000 * 60 * 60 * 24));
    
    return {
      hasHistory: true,
      lastTextDate: lastText.lastTextDate,
      daysSinceText,
      canText: daysSinceText >= 30,
      warning: daysSinceText < 30 ? `Texted ${daysSinceText} days ago` : null,
      recommendation: daysSinceText < 7 
        ? 'Too soon - wait at least a week'
        : daysSinceText < 30 
        ? 'Consider waiting for 30-day mark'
        : 'OK to text'
    };
  }
}

// Singleton instance
let textingInstance = null;

export const getMassTexting = async () => {
  if (!textingInstance) {
    textingInstance = new MassTextingService();
    await textingInstance.initialize();
  }
  return textingInstance;
};

export default MassTextingService;