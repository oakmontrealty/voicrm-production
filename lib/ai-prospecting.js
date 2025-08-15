// AI Prospecting Suggestions
// Intelligent lead generation and prospecting recommendations

import OpenAI from 'openai';

class AIProspecting {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.prospectingStrategies = {
      COLD_OUTREACH: 'cold_outreach',
      WARM_REFERRAL: 'warm_referral',
      PAST_CLIENT: 'past_client',
      SPHERE_OF_INFLUENCE: 'sphere_of_influence',
      GEOGRAPHIC_FARMING: 'geographic_farming',
      EXPIRED_LISTING: 'expired_listing',
      FSBO: 'for_sale_by_owner',
      INVESTOR: 'investor',
      DOWNSIZING: 'downsizing',
      UPSIZING: 'upsizing'
    };
    
    this.contactMethods = {
      CALL: { method: 'call', icon: '📞', priority: 1 },
      TEXT: { method: 'text', icon: '💬', priority: 2 },
      EMAIL: { method: 'email', icon: '📧', priority: 3 },
      DOOR_KNOCK: { method: 'door_knock', icon: '🚪', priority: 4 },
      SOCIAL_MEDIA: { method: 'social_media', icon: '📱', priority: 5 }
    };
  }

  // Generate daily prospecting suggestions
  async generateDailyProspects(agentData) {
    try {
      const { agentId, agentName, currentContacts, recentActivity, market } = agentData;
      
      // Analyze agent's current pipeline
      const pipelineAnalysis = await this.analyzePipeline(currentContacts);
      
      // Get market insights
      const marketInsights = await this.getMarketInsights(market);
      
      // Generate AI suggestions
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert real estate prospecting coach analyzing data to generate high-value prospecting opportunities.
            
            Consider:
            1. Current market conditions and trends
            2. Agent's existing pipeline and recent activity
            3. Seasonal patterns and timing
            4. Local area demographics
            5. Past success patterns
            
            For each prospect suggestion, provide:
            - Contact information
            - Reason for outreach (why now?)
            - Best contact method and timing
            - Conversation starter/hook
            - Value proposition
            - Probability of success (1-10)
            - Expected timeline to conversion`
          },
          {
            role: 'user',
            content: `Agent: ${agentName}
            Current Pipeline: ${JSON.stringify(pipelineAnalysis)}
            Market: ${JSON.stringify(marketInsights)}
            Recent Activity: ${JSON.stringify(recentActivity)}
            
            Generate 20 high-value prospecting opportunities for today.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      });

      const suggestions = JSON.parse(response.choices[0].message.content);
      
      // Enhance with local data
      const enhanced = await this.enhanceProspects(suggestions.prospects);
      
      // Score and prioritize
      const scored = this.scoreProspects(enhanced);
      
      // Generate scripts
      const withScripts = await this.generateScripts(scored);
      
      // Check compliance
      const compliant = this.checkCompliance(withScripts);
      
      return {
        date: new Date(),
        agentId,
        agentName,
        totalSuggestions: compliant.length,
        prospects: compliant,
        summary: this.generateSummary(compliant),
        bestTimes: this.calculateBestTimes(compliant),
        campaigns: this.groupIntoCampaigns(compliant)
      };
      
    } catch (error) {
      console.error('Prospecting generation error:', error);
      return this.getFallbackProspects(agentData);
    }
  }

  // Analyze existing pipeline
  async analyzePipeline(contacts) {
    const analysis = {
      total: contacts.length,
      stages: {
        cold: 0,
        contacted: 0,
        qualified: 0,
        showing: 0,
        negotiating: 0,
        closed: 0
      },
      avgDaysInPipeline: 0,
      conversionRate: 0,
      gaps: []
    };
    
    // Analyze each contact
    contacts.forEach(contact => {
      if (contact.stage) {
        analysis.stages[contact.stage] = (analysis.stages[contact.stage] || 0) + 1;
      }
      
      // Calculate days in pipeline
      if (contact.addedDate) {
        const days = (new Date() - new Date(contact.addedDate)) / (1000 * 60 * 60 * 24);
        analysis.avgDaysInPipeline += days;
      }
    });
    
    // Calculate averages
    if (contacts.length > 0) {
      analysis.avgDaysInPipeline = Math.round(analysis.avgDaysInPipeline / contacts.length);
      analysis.conversionRate = (analysis.stages.closed / contacts.length) * 100;
    }
    
    // Identify gaps
    if (analysis.stages.cold < 50) {
      analysis.gaps.push('Need more top-of-funnel leads');
    }
    if (analysis.stages.qualified < analysis.stages.contacted * 0.3) {
      analysis.gaps.push('Qualification rate is low');
    }
    if (analysis.stages.showing < analysis.stages.qualified * 0.5) {
      analysis.gaps.push('Not enough qualified leads converting to showings');
    }
    
    return analysis;
  }

  // Get market insights
  async getMarketInsights(market) {
    // Simulated market data - would connect to real estate APIs
    return {
      location: market.location || 'Sydney SW',
      avgDaysOnMarket: 28,
      inventoryLevel: 'low',
      pricesTrend: 'increasing',
      buyerDemand: 'high',
      bestSuburbs: ['Gregory Hills', 'Oran Park', 'Harrington Park'],
      demographics: {
        avgAge: 35,
        familySize: 3.2,
        incomeLevel: 'middle-high',
        primaryBuyers: 'young families'
      },
      opportunities: [
        'Downsizers in established areas',
        'First-time buyers needing guidance',
        'Investors looking for growth suburbs'
      ]
    };
  }

  // Enhance prospects with additional data
  async enhanceProspects(prospects) {
    const enhanced = [];
    
    for (const prospect of prospects) {
      const enhancedProspect = {
        ...prospect,
        id: this.generateProspectId(),
        createdAt: new Date(),
        
        // Contact enrichment
        contact: {
          ...prospect.contact,
          preferredTime: this.calculatePreferredTime(prospect),
          timezone: 'Australia/Sydney',
          language: 'English'
        },
        
        // Property data
        property: {
          estimatedValue: prospect.propertyValue || null,
          lastSoldDate: prospect.lastSold || null,
          ownership: prospect.ownershipLength || null,
          type: prospect.propertyType || 'residential'
        },
        
        // Behavioral data
        behavior: {
          lastContact: prospect.lastContact || null,
          responseRate: prospect.responseRate || 'unknown',
          preferredChannel: prospect.preferredChannel || 'phone',
          interests: prospect.interests || []
        },
        
        // Market timing
        timing: {
          urgency: this.calculateUrgency(prospect),
          bestContactWindow: this.getBestContactWindow(prospect),
          seasonalFactor: this.getSeasonalFactor()
        },
        
        // Relationship
        relationship: {
          source: prospect.source || 'database',
          referredBy: prospect.referredBy || null,
          sharedConnections: prospect.connections || [],
          previousInteractions: prospect.interactions || 0
        }
      };
      
      enhanced.push(enhancedProspect);
    }
    
    return enhanced;
  }

  // Score and prioritize prospects
  scoreProspects(prospects) {
    return prospects.map(prospect => {
      let score = 0;
      
      // Base probability score
      score += (prospect.probability || 5) * 10;
      
      // Urgency bonus
      if (prospect.timing?.urgency === 'high') score += 20;
      if (prospect.timing?.urgency === 'medium') score += 10;
      
      // Relationship bonus
      if (prospect.relationship?.source === 'referral') score += 15;
      if (prospect.relationship?.previousInteractions > 3) score += 10;
      
      // Market timing bonus
      if (prospect.reason?.includes('lease ending')) score += 15;
      if (prospect.reason?.includes('job relocation')) score += 20;
      if (prospect.reason?.includes('downsizing')) score += 10;
      
      // Response rate bonus
      if (prospect.behavior?.responseRate === 'high') score += 10;
      
      // Property value bonus (higher value = higher priority)
      if (prospect.property?.estimatedValue > 1000000) score += 15;
      if (prospect.property?.estimatedValue > 750000) score += 10;
      if (prospect.property?.estimatedValue > 500000) score += 5;
      
      return {
        ...prospect,
        score: Math.min(100, score),
        priority: score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low'
      };
    }).sort((a, b) => b.score - a.score);
  }

  // Generate conversation scripts
  async generateScripts(prospects) {
    const withScripts = [];
    
    for (const prospect of prospects.slice(0, 10)) { // Generate scripts for top 10
      try {
        const script = await this.generateScript(prospect);
        withScripts.push({
          ...prospect,
          script
        });
      } catch (error) {
        console.error('Script generation error:', error);
        withScripts.push({
          ...prospect,
          script: this.getFallbackScript(prospect)
        });
      }
    }
    
    // Add basic scripts for remaining
    prospects.slice(10).forEach(prospect => {
      withScripts.push({
        ...prospect,
        script: this.getBasicScript(prospect)
      });
    });
    
    return withScripts;
  }

  // Generate personalized script
  async generateScript(prospect) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Create a personalized, natural conversation script for real estate prospecting.
          Make it conversational, not salesy. Focus on providing value.`
        },
        {
          role: 'user',
          content: `Prospect: ${prospect.contact.name}
          Reason: ${prospect.reason}
          Strategy: ${prospect.strategy}
          Hook: ${prospect.hook}
          
          Generate:
          1. Opening (friendly, personal)
          2. Value statement (what's in it for them)
          3. Soft close (next step)
          4. Objection handlers (2-3 common ones)`
        }
      ],
      temperature: 0.7,
      max_tokens: 400
    });
    
    const content = response.choices[0].message.content;
    
    // Parse into structured format
    return {
      opening: this.extractSection(content, 'Opening'),
      value: this.extractSection(content, 'Value'),
      close: this.extractSection(content, 'Close'),
      objections: this.extractObjections(content),
      fullScript: content
    };
  }

  // Check compliance and Do Not Call
  checkCompliance(prospects) {
    return prospects.filter(prospect => {
      // Check Do Not Call registry
      if (prospect.contact?.doNotCall) return false;
      
      // Check contact frequency limits
      if (prospect.behavior?.lastContact) {
        const daysSinceContact = (new Date() - new Date(prospect.behavior.lastContact)) / (1000 * 60 * 60 * 24);
        if (daysSinceContact < 14) return false; // 2-week minimum
      }
      
      // Check time restrictions
      const hour = new Date().getHours();
      if (hour < 9 || hour > 20) return false; // 9 AM - 8 PM only
      
      // Check opt-out status
      if (prospect.contact?.optedOut) return false;
      
      return true;
    });
  }

  // Generate summary
  generateSummary(prospects) {
    const summary = {
      total: prospects.length,
      byPriority: {
        high: prospects.filter(p => p.priority === 'high').length,
        medium: prospects.filter(p => p.priority === 'medium').length,
        low: prospects.filter(p => p.priority === 'low').length
      },
      byStrategy: {},
      byMethod: {},
      estimatedCalls: 0,
      estimatedConversions: 0,
      estimatedRevenue: 0
    };
    
    prospects.forEach(prospect => {
      // Count by strategy
      const strategy = prospect.strategy || 'general';
      summary.byStrategy[strategy] = (summary.byStrategy[strategy] || 0) + 1;
      
      // Count by method
      const method = prospect.preferredMethod || 'call';
      summary.byMethod[method] = (summary.byMethod[method] || 0) + 1;
      
      // Calculate estimates
      if (prospect.priority === 'high') {
        summary.estimatedCalls++;
        summary.estimatedConversions += (prospect.probability || 5) / 100;
      }
      
      // Estimate revenue (commission)
      if (prospect.property?.estimatedValue) {
        const commission = prospect.property.estimatedValue * 0.025 * ((prospect.probability || 5) / 100);
        summary.estimatedRevenue += commission;
      }
    });
    
    summary.estimatedConversions = Math.round(summary.estimatedConversions * 10) / 10;
    summary.estimatedRevenue = Math.round(summary.estimatedRevenue);
    
    return summary;
  }

  // Calculate best calling times
  calculateBestTimes(prospects) {
    const timeSlots = {};
    
    prospects.forEach(prospect => {
      const bestTime = prospect.timing?.bestContactWindow || '10:00-12:00';
      timeSlots[bestTime] = (timeSlots[bestTime] || []);
      timeSlots[bestTime].push(prospect.id);
    });
    
    return Object.entries(timeSlots)
      .map(([time, ids]) => ({
        timeSlot: time,
        prospectCount: ids.length,
        prospectIds: ids
      }))
      .sort((a, b) => b.prospectCount - a.prospectCount);
  }

  // Group into campaigns
  groupIntoCampaigns(prospects) {
    const campaigns = {
      hotLeads: {
        name: 'Hot Leads - Immediate Action',
        icon: '🔥',
        prospects: prospects.filter(p => p.priority === 'high' && p.timing?.urgency === 'high'),
        strategy: 'Direct call with urgency focus'
      },
      warmFollowUps: {
        name: 'Warm Follow-ups',
        icon: '☀️',
        prospects: prospects.filter(p => p.priority === 'high' && p.relationship?.previousInteractions > 0),
        strategy: 'Relationship building and trust'
      },
      geographic: {
        name: 'Geographic Farming',
        icon: '🗺️',
        prospects: prospects.filter(p => p.strategy === 'geographic_farming'),
        strategy: 'Local market expertise positioning'
      },
      investors: {
        name: 'Investor Outreach',
        icon: '💰',
        prospects: prospects.filter(p => p.strategy === 'investor'),
        strategy: 'ROI and opportunity focus'
      },
      sphereOfInfluence: {
        name: 'Sphere of Influence',
        icon: '🤝',
        prospects: prospects.filter(p => p.strategy === 'sphere_of_influence'),
        strategy: 'Referral and relationship nurturing'
      },
      expired: {
        name: 'Expired Listings',
        icon: '⏰',
        prospects: prospects.filter(p => p.strategy === 'expired_listing'),
        strategy: 'Fresh approach and new strategies'
      }
    };
    
    // Remove empty campaigns
    Object.keys(campaigns).forEach(key => {
      if (campaigns[key].prospects.length === 0) {
        delete campaigns[key];
      }
    });
    
    return campaigns;
  }

  // Get specific prospect details
  async getProspectDetails(prospectId) {
    // Would fetch from database
    return {
      id: prospectId,
      fullProfile: true,
      socialMedia: {},
      propertyHistory: [],
      marketActivity: []
    };
  }

  // Track prospect interaction
  async trackInteraction(prospectId, interaction) {
    // Log interaction
    const log = {
      prospectId,
      timestamp: new Date(),
      type: interaction.type,
      outcome: interaction.outcome,
      notes: interaction.notes,
      nextStep: interaction.nextStep,
      sentiment: interaction.sentiment
    };
    
    // Update prospect score based on outcome
    const scoreAdjustment = this.calculateScoreAdjustment(interaction);
    
    return {
      logged: true,
      scoreAdjustment,
      recommendedNextAction: this.getNextAction(interaction)
    };
  }

  // Helper functions
  generateProspectId() {
    return `prospect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  calculatePreferredTime(prospect) {
    // Based on demographics and behavior
    if (prospect.demographic === 'retiree') return '10:00-12:00';
    if (prospect.demographic === 'young_professional') return '18:00-20:00';
    if (prospect.demographic === 'family') return '19:00-20:00';
    return '10:00-12:00';
  }

  calculateUrgency(prospect) {
    if (prospect.reason?.includes('lease ending')) return 'high';
    if (prospect.reason?.includes('job relocation')) return 'high';
    if (prospect.reason?.includes('downsizing')) return 'medium';
    if (prospect.reason?.includes('investment')) return 'low';
    return 'medium';
  }

  getBestContactWindow(prospect) {
    const windows = {
      morning: '09:00-12:00',
      lunch: '12:00-13:00',
      afternoon: '14:00-17:00',
      evening: '17:00-20:00'
    };
    
    // Logic based on prospect type
    if (prospect.occupation === 'retired') return windows.morning;
    if (prospect.occupation === 'shift_worker') return windows.afternoon;
    return windows.evening;
  }

  getSeasonalFactor() {
    const month = new Date().getMonth();
    // Australian seasons (reversed)
    if ([8, 9, 10].includes(month)) return 'spring_peak'; // Sep-Nov
    if ([2, 3, 4].includes(month)) return 'autumn_strong'; // Mar-May
    if ([11, 0, 1].includes(month)) return 'summer_slow'; // Dec-Feb
    return 'winter_moderate'; // Jun-Aug
  }

  extractSection(content, section) {
    const regex = new RegExp(`${section}[:\s]+([^\\n]+)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  extractObjections(content) {
    const objections = [];
    const lines = content.split('\n');
    let inObjections = false;
    
    lines.forEach(line => {
      if (line.toLowerCase().includes('objection')) {
        inObjections = true;
      } else if (inObjections && line.trim()) {
        objections.push(line.trim());
      }
    });
    
    return objections.slice(0, 3);
  }

  getFallbackScript(prospect) {
    return {
      opening: `Hi ${prospect.contact?.name || 'there'}, this is [Agent] from our real estate team. How are you today?`,
      value: `I'm reaching out because ${prospect.reason || 'I have some exciting updates about the local market that might interest you'}.`,
      close: 'Would you have a few minutes this week to discuss your property goals?',
      objections: [
        'Not interested: I understand, may I ask what your timeline looks like for any property decisions?',
        'Too busy: No problem at all. Would it be better if I sent you some information via email first?',
        'Happy where I am: That\'s great to hear! I\'d love to stay in touch in case anything changes.'
      ]
    };
  }

  getBasicScript(prospect) {
    return {
      opening: `Hi, this is [Agent] calling about real estate`,
      value: 'I have some valuable market information for your area',
      close: 'Can we schedule a brief chat?',
      objections: ['Handle with care and empathy']
    };
  }

  calculateScoreAdjustment(interaction) {
    const adjustments = {
      positive_response: 10,
      appointment_set: 20,
      referral_received: 15,
      neutral_response: 0,
      negative_response: -10,
      do_not_contact: -100
    };
    
    return adjustments[interaction.outcome] || 0;
  }

  getNextAction(interaction) {
    const actions = {
      positive_response: 'Schedule follow-up within 24 hours',
      appointment_set: 'Send confirmation and prepare materials',
      referral_received: 'Contact referral within 2 hours',
      neutral_response: 'Add to nurture campaign',
      negative_response: 'Move to long-term follow-up (3 months)',
      do_not_contact: 'Remove from all campaigns'
    };
    
    return actions[interaction.outcome] || 'Review and determine next step';
  }

  getFallbackProspects(agentData) {
    // Basic prospects if AI fails
    return {
      date: new Date(),
      agentId: agentData.agentId,
      agentName: agentData.agentName,
      totalSuggestions: 5,
      prospects: [
        {
          id: this.generateProspectId(),
          contact: { name: 'Past Client Follow-up' },
          strategy: 'past_client',
          priority: 'medium',
          score: 60,
          reason: 'Quarterly check-in for referrals'
        },
        {
          id: this.generateProspectId(),
          contact: { name: 'Geographic Farm Area' },
          strategy: 'geographic_farming',
          priority: 'medium',
          score: 50,
          reason: 'Monthly market update distribution'
        }
      ],
      summary: {
        total: 2,
        byPriority: { high: 0, medium: 2, low: 0 }
      },
      bestTimes: [],
      campaigns: {}
    };
  }
}

// Singleton instance
let prospectingInstance = null;

export const getAIProspecting = () => {
  if (!prospectingInstance) {
    prospectingInstance = new AIProspecting();
  }
  return prospectingInstance;
};

export default AIProspecting;