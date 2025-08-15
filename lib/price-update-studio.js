// Price Update Studio with CMA (Comparative Market Analysis)
import { Configuration, OpenAIApi } from 'openai';

class PriceUpdateStudio {
  constructor() {
    this.openai = null;
    this.properties = new Map();
    this.marketData = new Map();
    this.cmaReports = new Map();
    this.priceHistory = new Map();
    this.suburbs = new Set([
      'Campbelltown', 'Camden', 'Liverpool', 'Macarthur',
      'Ingleburn', 'Leppington', 'Gregory Hills', 'Oran Park',
      'Harrington Park', 'Narellan', 'Mount Annan', 'Currans Hill'
    ]);
  }

  initialize() {
    if (process.env.OPENAI_API_KEY) {
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.openai = new OpenAIApi(configuration);
    }
    this.loadMarketData();
  }

  // Load market data for Sydney SW suburbs
  async loadMarketData() {
    // In production, this would fetch from Domain/CoreLogic APIs
    const marketData = {
      'Campbelltown': {
        medianHouse: 850000,
        medianUnit: 520000,
        growth12Months: 8.5,
        daysOnMarket: 32,
        clearanceRate: 78,
        rentalYield: 4.2
      },
      'Camden': {
        medianHouse: 1150000,
        medianUnit: 650000,
        growth12Months: 12.3,
        daysOnMarket: 28,
        clearanceRate: 82,
        rentalYield: 3.8
      },
      'Liverpool': {
        medianHouse: 920000,
        medianUnit: 580000,
        growth12Months: 9.7,
        daysOnMarket: 35,
        clearanceRate: 75,
        rentalYield: 4.5
      },
      'Gregory Hills': {
        medianHouse: 1050000,
        medianUnit: 620000,
        growth12Months: 14.2,
        daysOnMarket: 24,
        clearanceRate: 85,
        rentalYield: 3.9
      },
      'Oran Park': {
        medianHouse: 980000,
        medianUnit: 590000,
        growth12Months: 11.8,
        daysOnMarket: 26,
        clearanceRate: 83,
        rentalYield: 4.1
      }
    };
    
    Object.entries(marketData).forEach(([suburb, data]) => {
      this.marketData.set(suburb, data);
    });
  }

  // Create new property listing
  createProperty(propertyData) {
    const propertyId = `prop_${Date.now()}`;
    
    const property = {
      id: propertyId,
      address: propertyData.address,
      suburb: propertyData.suburb,
      type: propertyData.type || 'house', // house, unit, townhouse, land
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      parking: propertyData.parking,
      landSize: propertyData.landSize,
      buildingSize: propertyData.buildingSize,
      features: propertyData.features || [],
      currentPrice: propertyData.price,
      originalPrice: propertyData.price,
      priceHistory: [{
        price: propertyData.price,
        date: new Date(),
        reason: 'Initial listing'
      }],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.properties.set(propertyId, property);
    return property;
  }

  // Generate Comparative Market Analysis
  async generateCMA(propertyId, radius = 2) {
    const property = this.properties.get(propertyId);
    if (!property) throw new Error('Property not found');
    
    const cmaId = `cma_${Date.now()}`;
    
    // Get comparable properties
    const comparables = await this.findComparables(property, radius);
    
    // Calculate price metrics
    const priceAnalysis = this.analyzePricing(property, comparables);
    
    // Generate market insights
    const marketInsights = await this.generateMarketInsights(property, comparables);
    
    // Create pricing recommendation
    const recommendation = await this.generatePricingRecommendation(
      property,
      priceAnalysis,
      marketInsights
    );
    
    const cmaReport = {
      id: cmaId,
      propertyId,
      generatedAt: new Date(),
      property: {
        address: property.address,
        suburb: property.suburb,
        type: property.type,
        specs: `${property.bedrooms}BR ${property.bathrooms}BA ${property.parking}P`
      },
      marketData: this.marketData.get(property.suburb),
      comparables: comparables.slice(0, 6), // Top 6 comparables
      priceAnalysis,
      marketInsights,
      recommendation,
      confidenceScore: this.calculateConfidence(comparables.length),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Valid for 30 days
    };
    
    this.cmaReports.set(cmaId, cmaReport);
    return cmaReport;
  }

  // Find comparable properties
  async findComparables(property, radiusKm) {
    // In production, would query real estate APIs
    // Mock comparable properties for demo
    const comparables = [];
    
    const basePrice = property.currentPrice;
    const variations = [-0.15, -0.1, -0.05, 0, 0.05, 0.1, 0.15];
    
    for (let i = 0; i < 10; i++) {
      const variation = variations[Math.floor(Math.random() * variations.length)];
      const soldPrice = Math.round(basePrice * (1 + variation));
      
      comparables.push({
        address: `${Math.floor(Math.random() * 100)} Example Street, ${property.suburb}`,
        soldPrice,
        soldDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Last 90 days
        bedrooms: property.bedrooms + Math.floor(Math.random() * 2 - 0.5),
        bathrooms: property.bathrooms,
        parking: property.parking,
        landSize: property.landSize + Math.floor(Math.random() * 100 - 50),
        distance: (Math.random() * radiusKm).toFixed(1),
        similarity: 85 + Math.floor(Math.random() * 15) // 85-100% similarity
      });
    }
    
    // Sort by similarity and recency
    comparables.sort((a, b) => {
      const scoreA = a.similarity - (Date.now() - a.soldDate) / (1000 * 60 * 60 * 24) / 2;
      const scoreB = b.similarity - (Date.now() - b.soldDate) / (1000 * 60 * 60 * 24) / 2;
      return scoreB - scoreA;
    });
    
    return comparables;
  }

  // Analyze pricing based on comparables
  analyzePricing(property, comparables) {
    if (comparables.length === 0) {
      return {
        suggestedPrice: property.currentPrice,
        priceRange: { min: property.currentPrice * 0.95, max: property.currentPrice * 1.05 },
        pricePerSqm: 0,
        marketPosition: 'Unable to determine'
      };
    }
    
    const prices = comparables.map(c => c.soldPrice);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const medianPrice = prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)];
    
    // Calculate price per square meter
    const pricePerSqm = property.landSize > 0 
      ? Math.round(avgPrice / property.landSize)
      : 0;
    
    // Determine market position
    let marketPosition = 'Fairly priced';
    if (property.currentPrice > avgPrice * 1.1) {
      marketPosition = 'Above market';
    } else if (property.currentPrice < avgPrice * 0.9) {
      marketPosition = 'Below market';
    }
    
    return {
      suggestedPrice: Math.round(medianPrice),
      priceRange: {
        min: Math.round(Math.min(...prices)),
        max: Math.round(Math.max(...prices))
      },
      averagePrice: Math.round(avgPrice),
      medianPrice: Math.round(medianPrice),
      pricePerSqm,
      marketPosition,
      priceVariance: this.calculateVariance(prices),
      comparableCount: comparables.length
    };
  }

  // Generate market insights using AI
  async generateMarketInsights(property, comparables) {
    const suburbData = this.marketData.get(property.suburb);
    
    if (!this.openai) {
      return {
        trend: suburbData?.growth12Months > 10 ? 'Strong growth' : 'Moderate growth',
        demand: suburbData?.daysOnMarket < 30 ? 'High demand' : 'Normal demand',
        competition: comparables.length > 5 ? 'Moderate competition' : 'Low competition',
        timing: 'Good time to sell',
        keyFactors: [
          'Recent infrastructure developments',
          'Strong clearance rates',
          'Limited supply in area'
        ]
      };
    }
    
    try {
      const prompt = `Analyze the real estate market for ${property.suburb}, Sydney SW:
- Median house price: $${suburbData?.medianHouse || 'N/A'}
- 12-month growth: ${suburbData?.growth12Months || 'N/A'}%
- Days on market: ${suburbData?.daysOnMarket || 'N/A'}
- Clearance rate: ${suburbData?.clearanceRate || 'N/A'}%
- Comparable sales: ${comparables.length}

Provide brief market insights including trend, demand level, and 3 key factors affecting prices.`;

      const completion = await this.openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a real estate market analyst specializing in Sydney South West." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 200
      });
      
      const response = completion.data.choices[0].message.content;
      
      // Parse AI response
      return {
        trend: this.extractTrend(response),
        demand: this.extractDemand(response),
        competition: `${comparables.length} recent comparable sales`,
        timing: this.extractTiming(response),
        keyFactors: this.extractKeyFactors(response),
        aiSummary: response
      };
    } catch (error) {
      console.error('Error generating insights:', error);
      return {
        trend: 'Moderate growth',
        demand: 'Normal demand',
        competition: `${comparables.length} comparables`,
        timing: 'Stable market conditions',
        keyFactors: ['Market data analysis in progress']
      };
    }
  }

  // Generate pricing recommendation
  async generatePricingRecommendation(property, priceAnalysis, marketInsights) {
    const currentPrice = property.currentPrice;
    const suggestedPrice = priceAnalysis.suggestedPrice;
    const priceDifference = suggestedPrice - currentPrice;
    const percentDifference = (priceDifference / currentPrice) * 100;
    
    let strategy = 'maintain';
    let adjustmentAmount = 0;
    let reasoning = '';
    
    if (percentDifference > 5) {
      strategy = 'increase';
      adjustmentAmount = Math.round(priceDifference * 0.7); // Conservative increase
      reasoning = 'Property is underpriced compared to recent comparable sales';
    } else if (percentDifference < -5) {
      strategy = 'reduce';
      adjustmentAmount = Math.round(priceDifference * 0.5); // Gradual reduction
      reasoning = 'Price reduction recommended to align with market expectations';
    } else {
      reasoning = 'Current pricing is competitive with market conditions';
    }
    
    // Calculate optimal price points
    const pricePoints = {
      aggressive: Math.round(priceAnalysis.priceRange.max * 0.98),
      optimal: suggestedPrice,
      conservative: Math.round(priceAnalysis.priceRange.min * 1.02),
      quickSale: Math.round(priceAnalysis.priceRange.min * 0.95)
    };
    
    return {
      strategy,
      currentPrice,
      suggestedPrice,
      adjustmentAmount,
      percentDifference: percentDifference.toFixed(1),
      reasoning,
      pricePoints,
      marketPosition: priceAnalysis.marketPosition,
      confidenceLevel: this.calculateConfidence(priceAnalysis.comparableCount),
      timeToSell: this.estimateTimeToSell(percentDifference, marketInsights),
      nextReviewDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // Review in 2 weeks
    };
  }

  // Calculate confidence score
  calculateConfidence(comparableCount) {
    if (comparableCount >= 10) return 'High';
    if (comparableCount >= 5) return 'Medium';
    return 'Low';
  }

  // Calculate price variance
  calculateVariance(prices) {
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    return Math.sqrt(variance);
  }

  // Estimate time to sell
  estimateTimeToSell(priceDifference, marketInsights) {
    const baseDays = 30;
    let adjustedDays = baseDays;
    
    if (priceDifference > 10) {
      adjustedDays += 15; // Overpriced, longer to sell
    } else if (priceDifference < -10) {
      adjustedDays -= 10; // Underpriced, quicker sale
    }
    
    if (marketInsights.demand === 'High demand') {
      adjustedDays -= 5;
    }
    
    return {
      estimate: Math.max(7, adjustedDays),
      range: `${Math.max(7, adjustedDays - 7)} - ${adjustedDays + 7} days`
    };
  }

  // Update property price
  updatePrice(propertyId, newPrice, reason = 'Manual adjustment') {
    const property = this.properties.get(propertyId);
    if (!property) return null;
    
    const priceChange = {
      previousPrice: property.currentPrice,
      newPrice,
      changeAmount: newPrice - property.currentPrice,
      changePercent: ((newPrice - property.currentPrice) / property.currentPrice * 100).toFixed(1),
      date: new Date(),
      reason
    };
    
    property.priceHistory.push({
      price: newPrice,
      date: new Date(),
      reason
    });
    
    property.currentPrice = newPrice;
    property.updatedAt = new Date();
    
    return priceChange;
  }

  // Generate price update campaign
  generatePriceUpdateCampaign(propertyId, priceChange) {
    const property = this.properties.get(propertyId);
    if (!property) return null;
    
    const isReduction = priceChange.changeAmount < 0;
    
    return {
      subject: isReduction 
        ? `🏷️ Price Reduced! ${property.address}` 
        : `📈 New Price - ${property.address}`,
      headline: isReduction
        ? `PRICE REDUCED BY $${Math.abs(priceChange.changeAmount).toLocaleString()}`
        : `UPDATED PRICING - NOW $${priceChange.newPrice.toLocaleString()}`,
      message: {
        sms: isReduction
          ? `Great news! ${property.address} now $${priceChange.newPrice.toLocaleString()}. ${Math.abs(priceChange.changePercent)}% reduction! View: [link]`
          : `${property.address} - Updated price $${priceChange.newPrice.toLocaleString()}. Don't miss out! View: [link]`,
        email: this.generateEmailTemplate(property, priceChange, isReduction),
        social: isReduction
          ? `🔥 PRICE DROP ALERT! ${property.address} reduced by ${Math.abs(priceChange.changePercent)}%! Now only $${priceChange.newPrice.toLocaleString()} 🏡`
          : `NEW PRICE: ${property.address} - $${priceChange.newPrice.toLocaleString()} 🏡 ${property.bedrooms}BR ${property.bathrooms}BA`
      },
      targetAudience: this.identifyTargetAudience(property, priceChange),
      timing: {
        immediate: isReduction,
        bestTime: isReduction ? 'Now' : 'Thursday 10am',
        followUp: '3 days'
      }
    };
  }

  // Generate email template for price update
  generateEmailTemplate(property, priceChange, isReduction) {
    return `
      <h2>${isReduction ? 'Price Reduced!' : 'Price Update'} - ${property.address}</h2>
      <p>Dear [Name],</p>
      <p>${isReduction 
        ? `Exciting news! The property at ${property.address} has been reduced by $${Math.abs(priceChange.changeAmount).toLocaleString()}.`
        : `We've updated the pricing for ${property.address} to better reflect current market conditions.`
      }</p>
      <h3>New Price: $${priceChange.newPrice.toLocaleString()}</h3>
      <ul>
        <li>${property.bedrooms} Bedrooms</li>
        <li>${property.bathrooms} Bathrooms</li>
        <li>${property.parking} Parking Spaces</li>
        <li>${property.landSize}m² Land</li>
      </ul>
      <p>${isReduction 
        ? "This represents exceptional value in today's market. Properties at this price point are moving quickly."
        : "Based on recent comparable sales, this property offers excellent value in the current market."
      }</p>
      <p><a href="[property_link]">View Full Details</a> | <a href="[booking_link]">Schedule Inspection</a></p>
    `;
  }

  // Identify target audience for price update
  identifyTargetAudience(property, priceChange) {
    const audiences = [];
    
    // Previous inquirers
    audiences.push({
      segment: 'Previous Inquirers',
      priority: 'High',
      message: 'People who previously showed interest'
    });
    
    // Price range matches
    if (priceChange.newPrice < property.originalPrice * 0.9) {
      audiences.push({
        segment: 'Bargain Hunters',
        priority: 'High',
        message: 'Buyers looking for reduced properties'
      });
    }
    
    // Local buyers
    audiences.push({
      segment: 'Local Area Buyers',
      priority: 'Medium',
      message: `Active buyers in ${property.suburb}`
    });
    
    return audiences;
  }

  // Extract helpers for AI responses
  extractTrend(text) {
    if (text.includes('strong') || text.includes('growth')) return 'Strong growth';
    if (text.includes('declining') || text.includes('falling')) return 'Declining';
    return 'Stable';
  }

  extractDemand(text) {
    if (text.includes('high demand') || text.includes('strong demand')) return 'High demand';
    if (text.includes('low demand') || text.includes('weak')) return 'Low demand';
    return 'Normal demand';
  }

  extractTiming(text) {
    if (text.includes('good time') || text.includes('optimal')) return 'Good time to sell';
    if (text.includes('wait') || text.includes('hold')) return 'Consider waiting';
    return 'Neutral timing';
  }

  extractKeyFactors(text) {
    const factors = [];
    const lines = text.split('\n');
    lines.forEach(line => {
      if (line.includes('-') || line.includes('•') || /^\d\./.test(line)) {
        factors.push(line.replace(/^[-•\d.]\s*/, '').trim());
      }
    });
    return factors.slice(0, 3);
  }
}

// Singleton instance
let studioInstance = null;

export const getPriceUpdateStudio = () => {
  if (!studioInstance) {
    studioInstance = new PriceUpdateStudio();
    studioInstance.initialize();
  }
  return studioInstance;
};

export default PriceUpdateStudio;