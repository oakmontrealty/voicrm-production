// Digital Business Card with AI-Generated Templates
import { Configuration, OpenAIApi } from 'openai';

class DigitalBusinessCard {
  constructor() {
    this.openai = null;
    this.cards = new Map(); // Agent ID -> Card Data
    this.templates = [];
    this.analytics = new Map(); // Card ID -> View Analytics
  }

  initialize() {
    if (process.env.OPENAI_API_KEY) {
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.openai = new OpenAIApi(configuration);
    }
    this.loadDefaultTemplates();
  }

  loadDefaultTemplates() {
    this.templates = [
      {
        id: 'professional',
        name: 'Professional',
        style: {
          primaryColor: '#1e40af',
          secondaryColor: '#3b82f6',
          fontFamily: 'Inter, sans-serif',
          layout: 'classic'
        }
      },
      {
        id: 'modern',
        name: 'Modern Minimal',
        style: {
          primaryColor: '#111827',
          secondaryColor: '#6b7280',
          fontFamily: 'Helvetica Neue, sans-serif',
          layout: 'minimal'
        }
      },
      {
        id: 'luxury',
        name: 'Luxury Estate',
        style: {
          primaryColor: '#991b1b',
          secondaryColor: '#dc2626',
          fontFamily: 'Playfair Display, serif',
          layout: 'elegant'
        }
      }
    ];
  }

  // Create new digital business card
  async createCard(agentData) {
    const cardId = `card_${Date.now()}`;
    
    // Generate personalized bio if not provided
    if (!agentData.bio && this.openai) {
      agentData.bio = await this.generateBio(agentData);
    }
    
    // Generate custom tagline if not provided
    if (!agentData.tagline && this.openai) {
      agentData.tagline = await this.generateTagline(agentData);
    }
    
    const card = {
      id: cardId,
      agentId: agentData.agentId,
      personalInfo: {
        name: agentData.name,
        title: agentData.title || 'Real Estate Professional',
        agency: agentData.agency || 'Real Estate Agency',
        phone: agentData.phone,
        email: agentData.email,
        bio: agentData.bio,
        tagline: agentData.tagline,
        photo: agentData.photo || null
      },
      socialLinks: {
        linkedin: agentData.linkedin || '',
        facebook: agentData.facebook || '',
        instagram: agentData.instagram || '',
        website: agentData.website || ''
      },
      achievements: agentData.achievements || [],
      specializations: agentData.specializations || [],
      testimonials: agentData.testimonials || [],
      qrCode: this.generateQRCodeData(cardId),
      template: agentData.templateId || 'professional',
      customization: agentData.customization || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      shortUrl: `oakmont.ly/${cardId.slice(-8)}`,
      analytics: {
        views: 0,
        shares: 0,
        contacts: 0,
        calls: 0
      }
    };
    
    this.cards.set(agentData.agentId, card);
    return card;
  }

  // Generate AI bio
  async generateBio(agentData) {
    if (!this.openai) {
      return `${agentData.name} is a dedicated real estate professional committed to helping clients find their dream homes.`;
    }
    
    try {
      const prompt = `Create a professional 2-3 sentence bio for a real estate agent:
Name: ${agentData.name}
Specializations: ${agentData.specializations?.join(', ') || 'Residential Sales'}
Experience: ${agentData.experience || 'Not specified'}
Agency: ${agentData.agency || 'Real Estate Agency'}

Make it personable, professional, and highlight their dedication to client service.`;

      const completion = await this.openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a professional copywriter specializing in real estate agent profiles." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 150
      });
      
      return completion.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating bio:', error);
      return `${agentData.name} is a dedicated real estate professional committed to helping clients find their dream homes.`;
    }
  }

  // Generate AI tagline
  async generateTagline(agentData) {
    if (!this.openai) {
      return 'Your trusted partner in real estate';
    }
    
    try {
      const prompt = `Create a short, memorable tagline (5-8 words) for a real estate agent named ${agentData.name}.
Focus on: trust, expertise, and results.
Examples: "Making your property dreams reality", "Excellence in every transaction"`;

      const completion = await this.openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a creative copywriter specializing in real estate marketing." },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 50
      });
      
      return completion.data.choices[0].message.content.trim().replace(/['"]/g, '');
    } catch (error) {
      console.error('Error generating tagline:', error);
      return 'Your trusted partner in real estate';
    }
  }

  // Generate QR code data
  generateQRCodeData(cardId) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voicrm.oakmont.com.au';
    const cardUrl = `${baseUrl}/card/${cardId}`;
    
    // In production, this would generate actual QR code image data
    return {
      url: cardUrl,
      dataUri: `data:image/svg+xml;base64,${Buffer.from(this.generateQRSVG(cardUrl)).toString('base64')}`
    };
  }

  // Generate simple QR code SVG (placeholder)
  generateQRSVG(url) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="white"/>
      <rect x="10" y="10" width="180" height="180" fill="none" stroke="black" stroke-width="2"/>
      <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="10">QR: ${url.slice(-20)}</text>
    </svg>`;
  }

  // Generate vCard for contact download
  generateVCard(card) {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${card.personalInfo.name}`,
      `ORG:${card.personalInfo.agency}`,
      `TITLE:${card.personalInfo.title}`,
      `TEL;TYPE=WORK,VOICE:${card.personalInfo.phone}`,
      `EMAIL:${card.personalInfo.email}`,
      card.socialLinks.website ? `URL:${card.socialLinks.website}` : '',
      `NOTE:${card.personalInfo.bio}`,
      'END:VCARD'
    ].filter(line => line).join('\r\n');
    
    return vcard;
  }

  // Track card analytics
  trackEvent(cardId, eventType) {
    const analytics = this.analytics.get(cardId) || {
      views: [],
      shares: [],
      contacts: [],
      calls: []
    };
    
    const event = {
      timestamp: new Date(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
      referrer: typeof document !== 'undefined' ? document.referrer : ''
    };
    
    if (analytics[eventType]) {
      analytics[eventType].push(event);
    }
    
    this.analytics.set(cardId, analytics);
    
    // Update card analytics summary
    const card = Array.from(this.cards.values()).find(c => c.id === cardId);
    if (card) {
      card.analytics[eventType === 'views' ? 'views' : eventType]++;
      card.updatedAt = new Date();
    }
  }

  // Get card by agent ID
  getCardByAgent(agentId) {
    return this.cards.get(agentId);
  }

  // Get card by card ID
  getCardById(cardId) {
    return Array.from(this.cards.values()).find(card => card.id === cardId);
  }

  // Update card
  updateCard(agentId, updates) {
    const card = this.cards.get(agentId);
    if (!card) return null;
    
    Object.assign(card.personalInfo, updates.personalInfo || {});
    Object.assign(card.socialLinks, updates.socialLinks || {});
    
    if (updates.achievements) card.achievements = updates.achievements;
    if (updates.specializations) card.specializations = updates.specializations;
    if (updates.testimonials) card.testimonials = updates.testimonials;
    if (updates.template) card.template = updates.template;
    if (updates.customization) card.customization = updates.customization;
    
    card.updatedAt = new Date();
    return card;
  }

  // Generate shareable link with tracking
  generateShareLink(cardId, channel = 'direct') {
    const card = this.getCardById(cardId);
    if (!card) return null;
    
    const baseUrl = card.shortUrl;
    const trackingParams = `?utm_source=${channel}&utm_medium=digital_card&utm_campaign=share`;
    
    return {
      url: `${baseUrl}${trackingParams}`,
      qrCode: card.qrCode.dataUri,
      message: this.generateShareMessage(card, channel)
    };
  }

  // Generate share message based on channel
  generateShareMessage(card, channel) {
    const templates = {
      sms: `Hi! I'm ${card.personalInfo.name} from ${card.personalInfo.agency}. Here's my digital business card: ${card.shortUrl}`,
      email: `Subject: ${card.personalInfo.name} - Digital Business Card\n\nHello,\n\nPlease find my digital business card at: ${card.shortUrl}\n\n${card.personalInfo.tagline}\n\nBest regards,\n${card.personalInfo.name}`,
      social: `Connect with ${card.personalInfo.name} - ${card.personalInfo.tagline} 🏡 View my digital card: ${card.shortUrl}`,
      direct: card.shortUrl
    };
    
    return templates[channel] || templates.direct;
  }

  // Get analytics summary
  getAnalyticsSummary(agentId) {
    const card = this.cards.get(agentId);
    if (!card) return null;
    
    const detailedAnalytics = this.analytics.get(card.id) || {
      views: [],
      shares: [],
      contacts: [],
      calls: []
    };
    
    // Calculate engagement metrics
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const weeklyViews = detailedAnalytics.views.filter(v => new Date(v.timestamp) > lastWeek).length;
    const monthlyViews = detailedAnalytics.views.filter(v => new Date(v.timestamp) > lastMonth).length;
    
    return {
      cardId: card.id,
      totalViews: card.analytics.views,
      totalShares: card.analytics.shares,
      totalContacts: card.analytics.contacts,
      totalCalls: card.analytics.calls,
      weeklyViews,
      monthlyViews,
      conversionRate: card.analytics.views > 0 
        ? ((card.analytics.contacts / card.analytics.views) * 100).toFixed(1)
        : 0,
      topReferrers: this.getTopReferrers(detailedAnalytics.views),
      peakViewingTimes: this.getPeakTimes(detailedAnalytics.views)
    };
  }

  // Get top referrers
  getTopReferrers(views) {
    const referrers = {};
    views.forEach(view => {
      const ref = view.referrer || 'Direct';
      referrers[ref] = (referrers[ref] || 0) + 1;
    });
    
    return Object.entries(referrers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([referrer, count]) => ({ referrer, count }));
  }

  // Get peak viewing times
  getPeakTimes(views) {
    const hours = new Array(24).fill(0);
    views.forEach(view => {
      const hour = new Date(view.timestamp).getHours();
      hours[hour]++;
    });
    
    return hours.map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }
}

// Singleton instance
let cardInstance = null;

export const getDigitalBusinessCard = () => {
  if (!cardInstance) {
    cardInstance = new DigitalBusinessCard();
    cardInstance.initialize();
  }
  return cardInstance;
};

export default DigitalBusinessCard;