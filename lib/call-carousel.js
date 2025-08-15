// Call Carousel - Rotating phone numbers for outbound calls
import twilio from 'twilio';

class CallCarousel {
  constructor() {
    this.client = null;
    this.carouselNumbers = [];
    this.currentIndex = 0;
    this.agentNumbers = new Map(); // Agent ID -> Personal Number
    this.callHistory = new Map(); // Contact ID -> Last Call Info
  }

  async initialize() {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      await this.loadCarouselNumbers();
    }
  }

  async loadCarouselNumbers() {
    try {
      // Load all available phone numbers from Twilio account
      const numbers = await this.client.incomingPhoneNumbers.list({ limit: 50 });
      
      // Filter for carousel numbers (tagged or in specific pattern)
      this.carouselNumbers = numbers
        .filter(n => n.friendlyName?.includes('Carousel') || n.capabilities.voice)
        .map(n => ({
          sid: n.sid,
          phoneNumber: n.phoneNumber,
          friendlyName: n.friendlyName,
          capabilities: n.capabilities,
          lastUsed: null,
          callCount: 0
        }));
      
      console.log(`Loaded ${this.carouselNumbers.length} carousel numbers`);
      return this.carouselNumbers;
    } catch (error) {
      console.error('Error loading carousel numbers:', error);
      return [];
    }
  }

  // Get next available number from carousel
  getNextCarouselNumber() {
    if (this.carouselNumbers.length === 0) {
      return process.env.TWILIO_PHONE_NUMBER; // Fallback to default
    }

    // Round-robin selection with least-recently-used prioritization
    const sortedNumbers = [...this.carouselNumbers].sort((a, b) => {
      // Prioritize never-used numbers
      if (!a.lastUsed && b.lastUsed) return -1;
      if (a.lastUsed && !b.lastUsed) return 1;
      
      // Then sort by last used time
      if (a.lastUsed && b.lastUsed) {
        return new Date(a.lastUsed) - new Date(b.lastUsed);
      }
      
      // Finally by call count
      return a.callCount - b.callCount;
    });

    const selectedNumber = sortedNumbers[0];
    selectedNumber.lastUsed = new Date();
    selectedNumber.callCount++;
    
    return selectedNumber.phoneNumber;
  }

  // Assign personal number to agent
  async assignAgentNumber(agentId, phoneNumber = null) {
    if (phoneNumber) {
      // Use provided number
      this.agentNumbers.set(agentId, phoneNumber);
    } else {
      // Provision new number from Twilio
      try {
        const availableNumbers = await this.client.availablePhoneNumbers('AU')
          .mobile.list({ limit: 1 });
        
        if (availableNumbers.length > 0) {
          const newNumber = await this.client.incomingPhoneNumbers.create({
            phoneNumber: availableNumbers[0].phoneNumber,
            friendlyName: `Agent ${agentId} Direct Line`,
            voiceUrl: process.env.NEXT_PUBLIC_APP_URL + '/api/voice',
            smsUrl: process.env.NEXT_PUBLIC_APP_URL + '/api/sms'
          });
          
          this.agentNumbers.set(agentId, newNumber.phoneNumber);
          return newNumber.phoneNumber;
        }
      } catch (error) {
        console.error('Error provisioning agent number:', error);
      }
    }
    
    return this.agentNumbers.get(agentId);
  }

  // Get agent's personal number
  getAgentNumber(agentId) {
    return this.agentNumbers.get(agentId) || process.env.TWILIO_PHONE_NUMBER;
  }

  // Check if contact was recently called (within 2 weeks)
  wasRecentlyCalled(contactId, daysThreshold = 14) {
    const lastCall = this.callHistory.get(contactId);
    if (!lastCall) return false;
    
    const daysSinceCall = (Date.now() - lastCall.timestamp) / (1000 * 60 * 60 * 24);
    return daysSinceCall < daysThreshold;
  }

  // Record call for history tracking
  recordCall(contactId, phoneNumber, agentId) {
    this.callHistory.set(contactId, {
      timestamp: Date.now(),
      phoneNumber,
      agentId,
      lastCallDate: new Date().toISOString()
    });
  }

  // Get call summary for pre-call briefing
  getContactCallSummary(contactId) {
    const lastCall = this.callHistory.get(contactId);
    if (!lastCall) {
      return { hasHistory: false };
    }

    const daysSinceCall = Math.floor((Date.now() - lastCall.timestamp) / (1000 * 60 * 60 * 24));
    
    return {
      hasHistory: true,
      lastCallDate: lastCall.lastCallDate,
      daysSinceCall,
      warning: daysSinceCall < 14 ? 'Contact was called recently' : null,
      recommendation: daysSinceCall < 7 ? 'Consider waiting before calling again' : 'OK to call'
    };
  }

  // Smart number selection based on contact history
  selectNumberForContact(contactId, agentId, useCarousel = true) {
    // Check call frequency safeguards
    const summary = this.getContactCallSummary(contactId);
    
    if (summary.warning) {
      return {
        number: null,
        blocked: true,
        reason: summary.warning,
        lastCallDays: summary.daysSinceCall
      };
    }

    // Select appropriate number
    const number = useCarousel 
      ? this.getNextCarouselNumber() 
      : this.getAgentNumber(agentId);

    return {
      number,
      blocked: false,
      type: useCarousel ? 'carousel' : 'personal',
      summary
    };
  }
}

// Singleton instance
let carouselInstance = null;

export const getCallCarousel = async () => {
  if (!carouselInstance) {
    carouselInstance = new CallCarousel();
    await carouselInstance.initialize();
  }
  return carouselInstance;
};

export default CallCarousel;