// Property Valuation Analyzer
// Searches multiple property sites and provides detailed analysis

import axios from 'axios';
import * as cheerio from 'cheerio';

class PropertyValuationAnalyzer {
  constructor() {
    this.sources = {
      realestate: {
        name: 'realestate.com.au',
        searchUrl: 'https://www.realestate.com.au/property/',
        weight: 0.35
      },
      domain: {
        name: 'domain.com.au', 
        searchUrl: 'https://www.domain.com.au/property-profile/',
        weight: 0.35
      },
      homely: {
        name: 'homely.com.au',
        searchUrl: 'https://www.homely.com.au/homes/',
        weight: 0.15
      },
      onthehouse: {
        name: 'onthehouse.com.au',
        searchUrl: 'https://www.onthehouse.com.au/property/',
        weight: 0.15
      }
    };
    
    this.cache = new Map();
    this.rateLimiter = {
      lastRequest: {},
      minDelay: 1000 // 1 second between requests per domain
    };
  }

  // Main analysis function
  async analyzeContactProperties(contacts) {
    console.log(`🏠 Starting property analysis for ${contacts.length} contacts...`);
    
    // Filter valid contacts
    const validContacts = this.filterValidContacts(contacts);
    console.log(`✅ Found ${validContacts.length} contacts with valid addresses`);
    
    const results = [];
    let processed = 0;
    
    for (const contact of validContacts) {
      try {
        processed++;
        console.log(`\n[${processed}/${validContacts.length}] Analyzing: ${contact.name} - ${contact.address}`);
        
        // Check cache first
        const cacheKey = this.generateCacheKey(contact.address);
        if (this.cache.has(cacheKey)) {
          console.log('📦 Using cached data');
          results.push({
            contact,
            analysis: this.cache.get(cacheKey),
            cached: true
          });
          continue;
        }
        
        // Perform analysis
        const analysis = await this.analyzeProperty(contact.address);
        
        // Cache result
        this.cache.set(cacheKey, analysis);
        
        results.push({
          contact,
          analysis,
          cached: false
        });
        
        // Progress update
        if (processed % 10 === 0) {
          console.log(`\n📊 Progress: ${Math.round((processed/validContacts.length)*100)}% complete`);
        }
        
      } catch (error) {
        console.error(`❌ Error analyzing ${contact.name}:`, error.message);
        results.push({
          contact,
          analysis: null,
          error: error.message
        });
      }
      
      // Rate limiting
      await this.delay(500);
    }
    
    return this.generateReport(results);
  }

  // Filter contacts with valid addresses
  filterValidContacts(contacts) {
    return contacts.filter(contact => {
      // Skip if name contains "inquiry"
      if (contact.name?.toLowerCase().includes('inquiry')) {
        return false;
      }
      
      // Must have an address
      if (!contact.address && !contact.property_address && !contact.custom_fields?.address) {
        return false;
      }
      
      // Get the address
      const address = contact.address || contact.property_address || contact.custom_fields?.address;
      
      // Basic address validation (must have street number and name)
      const addressPattern = /\d+\s+\w+/;
      if (!addressPattern.test(address)) {
        return false;
      }
      
      // Add normalized address to contact
      contact.normalizedAddress = this.normalizeAddress(address);
      
      return true;
    });
  }

  // Analyze a single property
  async analyzeProperty(address) {
    const normalizedAddress = this.normalizeAddress(address);
    const searchResults = {};
    const valuations = [];
    
    // Search each source
    for (const [key, source] of Object.entries(this.sources)) {
      try {
        await this.respectRateLimit(key);
        const result = await this.searchSource(key, normalizedAddress, source);
        searchResults[key] = result;
        
        if (result.valuation) {
          valuations.push({
            source: source.name,
            value: result.valuation,
            weight: source.weight
          });
        }
      } catch (error) {
        console.error(`Error searching ${source.name}:`, error.message);
        searchResults[key] = { error: error.message };
      }
    }
    
    // Calculate weighted average valuation
    const estimatedValue = this.calculateWeightedValue(valuations);
    
    // Compile property details
    const propertyDetails = this.compilePropertyDetails(searchResults);
    
    // Generate insights
    const insights = this.generateInsights(propertyDetails, estimatedValue);
    
    return {
      address: normalizedAddress,
      estimatedValue,
      valuationRange: this.calculateValueRange(valuations),
      propertyDetails,
      searchResults,
      insights,
      lastUpdated: new Date(),
      confidence: this.calculateConfidence(valuations)
    };
  }

  // Search a specific source (simulated - would need proper API or scraping)
  async searchSource(source, address, config) {
    // In production, this would make actual API calls or web scraping
    // For now, we'll simulate with realistic data patterns
    
    const mockData = this.generateMockData(source, address);
    
    // Simulate network delay
    await this.delay(Math.random() * 1000 + 500);
    
    return mockData;
  }

  // Generate mock data for demonstration
  generateMockData(source, address) {
    // Parse address components
    const components = this.parseAddress(address);
    const baseValue = this.estimateBaseValue(components);
    
    // Add source-specific variation
    const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
    const sourceValue = Math.round(baseValue * (1 + variation));
    
    return {
      found: true,
      url: `${this.sources[source].searchUrl}${encodeURIComponent(address)}`,
      valuation: sourceValue,
      lastSold: this.generateLastSold(),
      propertyType: this.determinePropertyType(address),
      bedrooms: this.estimateBedrooms(address),
      bathrooms: this.estimateBathrooms(address),
      carSpaces: Math.floor(Math.random() * 3) + 1,
      landSize: Math.floor(Math.random() * 400) + 300,
      features: this.generateFeatures(),
      comparableSales: this.generateComparableSales(baseValue),
      priceHistory: this.generatePriceHistory(sourceValue),
      marketTrends: {
        monthlyGrowth: (Math.random() * 2 - 0.5).toFixed(2) + '%',
        yearlyGrowth: (Math.random() * 10 + 2).toFixed(2) + '%',
        medianPrice: sourceValue,
        daysOnMarket: Math.floor(Math.random() * 30) + 15
      }
    };
  }

  // Parse address into components
  parseAddress(address) {
    const parts = address.split(',').map(p => p.trim());
    const streetParts = (parts[0] || '').split(' ');
    
    return {
      streetNumber: streetParts[0],
      streetName: streetParts.slice(1).join(' '),
      suburb: parts[1] || 'Unknown',
      state: parts[2] || 'NSW',
      postcode: address.match(/\d{4}/) ? address.match(/\d{4}/)[0] : '2000'
    };
  }

  // Estimate base property value based on location
  estimateBaseValue(components) {
    const suburbValues = {
      'Gregory Hills': 950000,
      'Oran Park': 920000,
      'Harrington Park': 1100000,
      'Camden': 850000,
      'Narellan': 880000,
      'Mount Annan': 820000,
      'Currans Hill': 900000,
      'Elderslie': 950000,
      'Spring Farm': 980000,
      'Catherine Field': 1050000
    };
    
    const baseValue = suburbValues[components.suburb] || 850000;
    
    // Adjust for street type
    if (components.streetName?.includes('Avenue') || components.streetName?.includes('Boulevard')) {
      return baseValue * 1.1;
    }
    if (components.streetName?.includes('Court') || components.streetName?.includes('Place')) {
      return baseValue * 1.05;
    }
    
    return baseValue;
  }

  // Calculate weighted average value
  calculateWeightedValue(valuations) {
    if (valuations.length === 0) return null;
    
    let totalWeight = 0;
    let weightedSum = 0;
    
    valuations.forEach(v => {
      weightedSum += v.value * v.weight;
      totalWeight += v.weight;
    });
    
    return Math.round(weightedSum / totalWeight);
  }

  // Calculate value range
  calculateValueRange(valuations) {
    if (valuations.length === 0) return { min: null, max: null };
    
    const values = valuations.map(v => v.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      spread: Math.max(...values) - Math.min(...values)
    };
  }

  // Compile property details from all sources
  compilePropertyDetails(searchResults) {
    const details = {
      propertyType: null,
      bedrooms: null,
      bathrooms: null,
      carSpaces: null,
      landSize: null,
      features: [],
      lastSold: null
    };
    
    // Aggregate data from all sources
    Object.values(searchResults).forEach(result => {
      if (result.error) return;
      
      // Use most common or average values
      details.propertyType = details.propertyType || result.propertyType;
      details.bedrooms = details.bedrooms || result.bedrooms;
      details.bathrooms = details.bathrooms || result.bathrooms;
      details.carSpaces = details.carSpaces || result.carSpaces;
      details.landSize = details.landSize || result.landSize;
      
      if (result.features) {
        details.features = [...new Set([...details.features, ...result.features])];
      }
      
      if (result.lastSold && (!details.lastSold || new Date(result.lastSold.date) > new Date(details.lastSold.date))) {
        details.lastSold = result.lastSold;
      }
    });
    
    return details;
  }

  // Generate insights
  generateInsights(details, estimatedValue) {
    const insights = [];
    
    // Value insights
    if (estimatedValue) {
      if (estimatedValue > 1000000) {
        insights.push({
          type: 'high_value',
          message: 'Premium property in high-demand area',
          importance: 'high'
        });
      }
      
      if (details.lastSold && details.lastSold.price) {
        const growth = ((estimatedValue - details.lastSold.price) / details.lastSold.price) * 100;
        if (growth > 20) {
          insights.push({
            type: 'strong_growth',
            message: `Property has appreciated ${growth.toFixed(1)}% since last sale`,
            importance: 'high'
          });
        }
      }
    }
    
    // Property insights
    if (details.bedrooms >= 4) {
      insights.push({
        type: 'family_home',
        message: 'Large family home suitable for growing families',
        importance: 'medium'
      });
    }
    
    if (details.landSize > 600) {
      insights.push({
        type: 'large_block',
        message: 'Generous land size with development potential',
        importance: 'medium'
      });
    }
    
    // Market insights
    insights.push({
      type: 'market_position',
      message: 'Property is well-positioned in growing Sydney SW corridor',
      importance: 'medium'
    });
    
    return insights;
  }

  // Calculate confidence score
  calculateConfidence(valuations) {
    if (valuations.length === 0) return 0;
    
    // Base confidence on number of sources
    let confidence = (valuations.length / Object.keys(this.sources).length) * 50;
    
    // Add confidence based on value consistency
    if (valuations.length > 1) {
      const values = valuations.map(v => v.value);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / avg; // Coefficient of variation
      
      // Lower variation = higher confidence
      if (cv < 0.1) confidence += 50;
      else if (cv < 0.2) confidence += 30;
      else if (cv < 0.3) confidence += 10;
    }
    
    return Math.min(100, Math.round(confidence));
  }

  // Generate comprehensive report
  generateReport(results) {
    const successful = results.filter(r => r.analysis !== null);
    const failed = results.filter(r => r.analysis === null);
    
    // Calculate statistics
    const stats = {
      totalAnalyzed: results.length,
      successful: successful.length,
      failed: failed.length,
      averageValue: 0,
      valueRange: { min: Infinity, max: 0 },
      bySuburb: {},
      byPropertyType: {},
      highValueProperties: [],
      growthOpportunities: []
    };
    
    // Process successful analyses
    successful.forEach(result => {
      const value = result.analysis.estimatedValue;
      if (value) {
        stats.averageValue += value;
        stats.valueRange.min = Math.min(stats.valueRange.min, value);
        stats.valueRange.max = Math.max(stats.valueRange.max, value);
        
        // High value properties
        if (value > 1000000) {
          stats.highValueProperties.push({
            contact: result.contact.name,
            address: result.analysis.address,
            value: value
          });
        }
        
        // By suburb
        const suburb = result.analysis.propertyDetails.suburb || 'Unknown';
        if (!stats.bySuburb[suburb]) {
          stats.bySuburb[suburb] = { count: 0, totalValue: 0 };
        }
        stats.bySuburb[suburb].count++;
        stats.bySuburb[suburb].totalValue += value;
        
        // Growth opportunities
        if (result.analysis.insights.some(i => i.type === 'strong_growth')) {
          stats.growthOpportunities.push({
            contact: result.contact.name,
            address: result.analysis.address,
            insights: result.analysis.insights
          });
        }
      }
    });
    
    // Calculate averages
    if (successful.length > 0) {
      stats.averageValue = Math.round(stats.averageValue / successful.length);
    }
    
    // Sort high value properties
    stats.highValueProperties.sort((a, b) => b.value - a.value);
    
    return {
      timestamp: new Date(),
      summary: stats,
      results: results.map(r => ({
        contactId: r.contact.id,
        contactName: r.contact.name,
        contactOwner: r.contact.owner_name,
        address: r.contact.normalizedAddress || r.contact.address,
        analysis: r.analysis,
        error: r.error
      })),
      recommendations: this.generateRecommendations(stats, successful),
      exportReady: true
    };
  }

  // Generate recommendations
  generateRecommendations(stats, results) {
    const recommendations = [];
    
    // High value properties
    if (stats.highValueProperties.length > 0) {
      recommendations.push({
        type: 'high_value',
        priority: 'high',
        title: 'Focus on High-Value Properties',
        description: `${stats.highValueProperties.length} properties valued over $1M identified`,
        contacts: stats.highValueProperties.slice(0, 5).map(p => p.contact)
      });
    }
    
    // Growth opportunities
    if (stats.growthOpportunities.length > 0) {
      recommendations.push({
        type: 'growth',
        priority: 'high',
        title: 'Properties with Strong Growth',
        description: `${stats.growthOpportunities.length} properties showing significant appreciation`,
        contacts: stats.growthOpportunities.slice(0, 5).map(p => p.contact)
      });
    }
    
    // Suburb focus
    const topSuburbs = Object.entries(stats.bySuburb)
      .sort((a, b) => b[1].totalValue - a[1].totalValue)
      .slice(0, 3);
    
    if (topSuburbs.length > 0) {
      recommendations.push({
        type: 'geographic',
        priority: 'medium',
        title: 'Geographic Concentration',
        description: `Focus on ${topSuburbs.map(s => s[0]).join(', ')} for highest value opportunities`,
        data: topSuburbs
      });
    }
    
    return recommendations;
  }

  // Helper functions
  normalizeAddress(address) {
    if (!address) return '';
    
    return address
      .replace(/\s+/g, ' ')
      .replace(/,\s*/g, ', ')
      .trim()
      .replace(/nsw/gi, 'NSW')
      .replace(/vic/gi, 'VIC')
      .replace(/qld/gi, 'QLD');
  }

  generateCacheKey(address) {
    return `property_${this.normalizeAddress(address).toLowerCase().replace(/\s/g, '_')}`;
  }

  async respectRateLimit(source) {
    const now = Date.now();
    const lastRequest = this.rateLimiter.lastRequest[source] || 0;
    const timeSinceLastRequest = now - lastRequest;
    
    if (timeSinceLastRequest < this.rateLimiter.minDelay) {
      await this.delay(this.rateLimiter.minDelay - timeSinceLastRequest);
    }
    
    this.rateLimiter.lastRequest[source] = Date.now();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  determinePropertyType(address) {
    if (address.toLowerCase().includes('unit') || address.toLowerCase().includes('apt')) {
      return 'Apartment';
    }
    if (address.toLowerCase().includes('villa')) {
      return 'Villa';
    }
    return 'House';
  }

  estimateBedrooms(address) {
    // Simple estimation - in production would use actual data
    return Math.floor(Math.random() * 3) + 2; // 2-5 bedrooms
  }

  estimateBathrooms(address) {
    return Math.floor(Math.random() * 2) + 1; // 1-3 bathrooms
  }

  generateFeatures() {
    const allFeatures = [
      'Air Conditioning',
      'Swimming Pool',
      'Garage',
      'Garden',
      'Balcony',
      'Built-in Wardrobes',
      'Dishwasher',
      'Ensuite',
      'Floorboards',
      'Outdoor Entertainment Area'
    ];
    
    const numFeatures = Math.floor(Math.random() * 5) + 3;
    return allFeatures.sort(() => Math.random() - 0.5).slice(0, numFeatures);
  }

  generateLastSold() {
    const yearsAgo = Math.floor(Math.random() * 10) + 1;
    const date = new Date();
    date.setFullYear(date.getFullYear() - yearsAgo);
    
    return {
      date: date.toISOString().split('T')[0],
      price: Math.floor(Math.random() * 300000) + 600000
    };
  }

  generateComparableSales(baseValue) {
    const sales = [];
    for (let i = 0; i < 3; i++) {
      const variation = (Math.random() - 0.5) * 0.2;
      sales.push({
        address: `Nearby Property ${i + 1}`,
        soldPrice: Math.round(baseValue * (1 + variation)),
        soldDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }
    return sales;
  }

  generatePriceHistory(currentValue) {
    const history = [];
    let value = currentValue;
    
    for (let i = 0; i < 5; i++) {
      const year = new Date().getFullYear() - i;
      history.unshift({
        year,
        value: Math.round(value),
        change: i === 0 ? 0 : Math.round((value / history[0].value - 1) * 100)
      });
      value = value * 0.92; // ~8% yearly growth backwards
    }
    
    return history;
  }
}

// Export singleton instance
let analyzerInstance = null;

export const getPropertyAnalyzer = () => {
  if (!analyzerInstance) {
    analyzerInstance = new PropertyValuationAnalyzer();
  }
  return analyzerInstance;
};

export default PropertyValuationAnalyzer;