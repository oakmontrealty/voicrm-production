import { useState, useEffect, useRef } from 'react';
import { 
  PhoneIcon,
  SparklesIcon,
  MapPinIcon,
  HomeIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BoltIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
  DocumentTextIcon,
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  CheckCircleIcon,
  XMarkIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/solid';

export default function SmartDialer() {
  const [propertyInsights, setPropertyInsights] = useState([]);
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [dialerQueue, setDialerQueue] = useState([]);
  const [isDialing, setIsDialing] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  const [callStats, setCallStats] = useState({
    attempted: 0,
    connected: 0,
    interested: 0,
    appointments: 0
  });
  const [filters, setFilters] = useState({
    area: 'all',
    priceRange: 'all',
    propertyType: 'all',
    priority: 'all',
    lastContact: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [massTextMode, setMassTextMode] = useState(false);
  const [textTemplate, setTextTemplate] = useState('');
  const [aiMode, setAiMode] = useState('opportunity'); // opportunity, follow_up, market_update

  // AI insight types
  const insightTypes = {
    opportunity: {
      name: 'New Opportunities',
      color: 'green',
      icon: SparklesIcon,
      description: 'Fresh listings and price changes'
    },
    follow_up: {
      name: 'Follow-up Required',
      color: 'blue', 
      icon: ClockIcon,
      description: 'Contacts needing attention'
    },
    market_update: {
      name: 'Market Updates',
      color: 'purple',
      icon: ChartBarIcon,
      description: 'Relevant market changes'
    },
    hot_leads: {
      name: 'Hot Leads',
      color: 'red',
      icon: BoltIcon,
      description: 'High-priority prospects'
    }
  };

  useEffect(() => {
    loadPropertyInsights();
    generateSmartSuggestions();
    
    // Auto-refresh insights every 5 minutes
    const interval = setInterval(() => {
      loadPropertyInsights();
      generateSmartSuggestions();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [aiMode, filters]);

  // Load real-time property insights from MLS and internal data
  const loadPropertyInsights = async () => {
    try {
      const response = await fetch(`/api/property-insights?mode=${aiMode}&filters=${JSON.stringify(filters)}`);
      const data = await response.json();
      setPropertyInsights(data.insights || getMockInsights());
    } catch (error) {
      console.error('Failed to load property insights:', error);
      setPropertyInsights(getMockInsights());
    }
  };

  // Mock property insights for demo
  const getMockInsights = () => {
    return [
      {
        id: 'insight_001',
        type: 'new_listing',
        priority: 'high',
        property: {
          address: '789 Elm Court, Parramatta NSW 2150',
          price: 950000,
          bedrooms: 4,
          bathrooms: 2,
          landSize: 650,
          listingDate: '2024-01-15',
          agent: 'External Agent'
        },
        insight: 'Just listed - premium location, underpriced by 8% vs market',
        action: 'Contact nearby homeowners for potential sellers',
        contacts: [
          {
            id: 'contact_001',
            name: 'David Wilson',
            phone: '+61412345678',
            address: '785 Elm Court, Parramatta',
            lastContact: '2023-11-15',
            interest: 'selling',
            value: 920000,
            priority: 'high'
          },
          {
            id: 'contact_002', 
            name: 'Lisa Brown',
            phone: '+61423456789',
            address: '791 Elm Court, Parramatta',
            lastContact: '2023-12-02',
            interest: 'market_value',
            value: 930000,
            priority: 'medium'
          }
        ],
        suggestedMessage: "Hi {name}, I noticed a property just sold on your street for $950k. Given the current market, your home could be worth significantly more. Would you like a free market appraisal?",
        callScript: "Hi {name}, this is Terence from Oakmont Realty. I hope you're well. I'm calling because there's been some exciting activity on Elm Court with a new listing at $950k. Based on current market trends, properties in your area have increased by 12% this year. I'd love to provide you with a complimentary market assessment. Would you be interested in knowing what your home is worth in today's market?"
      },
      {
        id: 'insight_002',
        type: 'price_reduction',
        priority: 'high',
        property: {
          address: '456 Pine Avenue, Westmead NSW 2145',
          oldPrice: 1300000,
          newPrice: 1200000,
          reduction: 100000,
          daysOnMarket: 45,
          reductionDate: '2024-01-14'
        },
        insight: 'Major price reduction - seller motivated, excellent buyer opportunity',
        action: 'Contact all buyers in this price range',
        contacts: [
          {
            id: 'contact_003',
            name: 'John Anderson',
            phone: '+61434567890',
            address: 'Renting in Westmead',
            lastContact: '2023-10-20',
            interest: 'buying',
            budget: 1150000,
            priority: 'high'
          },
          {
            id: 'contact_004',
            name: 'Sarah Mitchell',
            phone: '+61445678901',
            address: 'Current buyer',
            lastContact: '2024-01-10',
            interest: 'buying',
            budget: 1250000,
            priority: 'high'
          }
        ],
        suggestedMessage: "Great news {name}! The Pine Avenue property you were interested in just dropped $100k to $1.2M. Perfect timing for your budget. Want to view it this week?",
        callScript: "Hi {name}, it's Terence from Oakmont Realty. I have fantastic news! Remember the Pine Avenue property we discussed? The seller just reduced the price by $100,000 to $1.2 million. This brings it right into your budget range and represents excellent value. Given your timeline, I'd recommend viewing it as soon as possible. Are you available this week for a viewing?"
      },
      {
        id: 'insight_003',
        type: 'market_trend',
        priority: 'medium',
        area: 'Parramatta',
        trend: {
          direction: 'up',
          percentage: 8.5,
          timeframe: '3 months',
          medianPrice: 985000,
          salesVolume: 156,
          daysOnMarket: 28
        },
        insight: 'Parramatta market up 8.5% - time to contact past clients',
        action: 'Reach out to previous sellers for repeat business',
        contacts: [
          {
            id: 'contact_005',
            name: 'Robert Chen',
            phone: '+61456789012',
            address: 'Sold 2022 - now renting',
            lastContact: '2023-08-15',
            interest: 'investment',
            value: 850000,
            priority: 'medium'
          }
        ],
        suggestedMessage: "Hi {name}, great news! Parramatta property values are up 8.5% since you sold. Your investment timing could be perfect right now. Want to discuss opportunities?",
        callScript: "Hi {name}, it's Terence from Oakmont Realty. I hope you're doing well since we sold your property. I'm calling with some exciting market news - Parramatta has seen an 8.5% increase in property values over the last three months. Given your previous interest in the area and the current market conditions, this could be an excellent time to consider your next investment. Would you like to discuss some opportunities I'm seeing?"
      }
    ];
  };

  // Generate smart suggestions based on insights
  const generateSmartSuggestions = () => {
    if (!propertyInsights.length) return;

    const suggestions = [];

    propertyInsights.forEach(insight => {
      insight.contacts?.forEach(contact => {
        suggestions.push({
          id: `suggestion_${insight.id}_${contact.id}`,
          type: insight.type,
          priority: contact.priority,
          contact: contact,
          insight: insight,
          action: insight.type === 'new_listing' ? 'call_for_listing' :
                  insight.type === 'price_reduction' ? 'call_buyer' :
                  insight.type === 'market_trend' ? 'call_past_client' : 'follow_up',
          estimatedValue: contact.value,
          probability: contact.priority === 'high' ? 85 : 
                      contact.priority === 'medium' ? 65 : 45,
          suggestedMessage: insight.suggestedMessage.replace('{name}', contact.name),
          callScript: insight.callScript.replace('{name}', contact.name),
          tags: [insight.type, contact.interest, contact.priority]
        });
      });
    });

    // Sort by priority and probability
    suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.probability - a.probability;
    });

    setSmartSuggestions(suggestions);
  };

  // Toggle suggestion selection
  const toggleSuggestion = (suggestionId) => {
    setSelectedSuggestions(prev => 
      prev.includes(suggestionId)
        ? prev.filter(id => id !== suggestionId)
        : [...prev, suggestionId]
    );
  };

  // Add selected suggestions to dialer queue
  const addToDialerQueue = () => {
    const selectedItems = smartSuggestions.filter(s => 
      selectedSuggestions.includes(s.id)
    );
    
    setDialerQueue(prev => [...prev, ...selectedItems]);
    setSelectedSuggestions([]);
  };

  // Start smart dialing
  const startSmartDialing = async () => {
    if (dialerQueue.length === 0) return;
    
    setIsDialing(true);
    setCallStats({ attempted: 0, connected: 0, interested: 0, appointments: 0 });
    
    for (const suggestion of dialerQueue) {
      setCurrentCall(suggestion);
      
      try {
        // Make call via Twilio
        const response = await fetch('/api/smart-dialer/call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: suggestion.contact.phone,
            suggestion: suggestion,
            script: suggestion.callScript
          })
        });
        
        if (response.ok) {
          setCallStats(prev => ({ ...prev, attempted: prev.attempted + 1 }));
          
          // Wait for call completion (mock - in real implementation, this would be event-driven)
          await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second mock call
          
          // Simulate call outcome
          const outcomes = ['connected', 'voicemail', 'busy', 'no_answer'];
          const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
          
          if (outcome === 'connected') {
            setCallStats(prev => ({ ...prev, connected: prev.connected + 1 }));
            
            // Simulate interest level
            if (Math.random() > 0.6) {
              setCallStats(prev => ({ ...prev, interested: prev.interested + 1 }));
              
              if (Math.random() > 0.7) {
                setCallStats(prev => ({ ...prev, appointments: prev.appointments + 1 }));
              }
            }
          }
          
          // Log call result
          await logCallResult(suggestion, outcome);
          
        }
      } catch (error) {
        console.error('Smart dialer call failed:', error);
      }
      
      // Break if user stops dialing
      if (!isDialing) break;
    }
    
    setIsDialing(false);
    setCurrentCall(null);
    setDialerQueue([]);
  };

  // Stop dialing
  const stopDialing = () => {
    setIsDialing(false);
  };

  // Send mass text messages
  const sendMassText = async () => {
    const selectedItems = smartSuggestions.filter(s => 
      selectedSuggestions.includes(s.id)
    );
    
    if (!textTemplate.trim() || selectedItems.length === 0) return;
    
    try {
      const response = await fetch('/api/smart-dialer/mass-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts: selectedItems.map(s => s.contact),
          template: textTemplate,
          insights: selectedItems.map(s => s.insight)
        })
      });
      
      if (response.ok) {
        alert(`Mass text sent to ${selectedItems.length} contacts`);
        setSelectedSuggestions([]);
        setTextTemplate('');
        setMassTextMode(false);
      }
    } catch (error) {
      console.error('Mass text failed:', error);
    }
  };

  // Log call result
  const logCallResult = async (suggestion, outcome) => {
    try {
      await fetch('/api/smart-dialer/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: suggestion.contact.id,
          insightId: suggestion.insight.id,
          outcome: outcome,
          timestamp: new Date().toISOString(),
          script: suggestion.callScript
        })
      });
    } catch (error) {
      console.error('Failed to log call result:', error);
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-gray-200 bg-gray-50';
      default: return 'border-gray-200 bg-white';
    }
  };

  // Get insight type color
  const getInsightColor = (type) => {
    switch (type) {
      case 'new_listing': return 'text-green-600 bg-green-100';
      case 'price_reduction': return 'text-blue-600 bg-blue-100';
      case 'market_trend': return 'text-purple-600 bg-purple-100';
      case 'sold': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#636B56] flex items-center gap-3">
              <SparklesIcon className="h-8 w-8" />
              Smart Dialer AI
            </h1>
            <p className="text-gray-600 mt-1">AI-powered property insights and intelligent calling system</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* AI Mode Selector */}
            <select
              value={aiMode}
              onChange={(e) => setAiMode(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#636B56]"
            >
              {Object.entries(insightTypes).map(([key, type]) => (
                <option key={key} value={key}>{type.name}</option>
              ))}
            </select>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <FunnelIcon className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-5 gap-3 p-4 bg-gray-50 rounded-lg">
            <select 
              value={filters.area}
              onChange={(e) => setFilters({...filters, area: e.target.value})}
              className="px-3 py-2 border rounded"
            >
              <option value="all">All Areas</option>
              <option value="parramatta">Parramatta</option>
              <option value="westmead">Westmead</option>
              <option value="harris_park">Harris Park</option>
            </select>

            <select 
              value={filters.priceRange}
              onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
              className="px-3 py-2 border rounded"
            >
              <option value="all">All Prices</option>
              <option value="0-800000">Under $800k</option>
              <option value="800000-1200000">$800k - $1.2M</option>
              <option value="1200000+">Above $1.2M</option>
            </select>

            <select 
              value={filters.propertyType}
              onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
              className="px-3 py-2 border rounded"
            >
              <option value="all">All Types</option>
              <option value="house">House</option>
              <option value="unit">Unit</option>
              <option value="townhouse">Townhouse</option>
            </select>

            <select 
              value={filters.priority}
              onChange={(e) => setFilters({...filters, priority: e.target.value})}
              className="px-3 py-2 border rounded"
            >
              <option value="all">All Priority</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            <button
              onClick={() => setFilters({
                area: 'all',
                priceRange: 'all', 
                propertyType: 'all',
                priority: 'all',
                lastContact: 'all'
              })}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Smart Suggestions</p>
              <p className="text-2xl font-bold text-[#636B56]">{smartSuggestions.length}</p>
            </div>
            <SparklesIcon className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Queue Size</p>
              <p className="text-2xl font-bold text-blue-600">{dialerQueue.length}</p>
            </div>
            <PhoneIcon className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Connected Today</p>
              <p className="text-2xl font-bold text-green-600">{callStats.connected}</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-200" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Appointments</p>
              <p className="text-2xl font-bold text-purple-600">{callStats.appointments}</p>
            </div>
            <ClockIcon className="h-8 w-8 text-purple-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Smart Suggestions */}
        <div className="col-span-2">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-[#636B56]">AI-Generated Opportunities</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMassTextMode(!massTextMode)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      massTextMode ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                    Mass Text
                  </button>
                  
                  <button
                    onClick={addToDialerQueue}
                    disabled={selectedSuggestions.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <PhoneIcon className="h-4 w-4" />
                    Add to Queue ({selectedSuggestions.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Mass Text Mode */}
            {massTextMode && (
              <div className="p-4 bg-green-50 border-b">
                <textarea
                  value={textTemplate}
                  onChange={(e) => setTextTemplate(e.target.value)}
                  placeholder="Enter your message template..."
                  className="w-full p-3 border rounded-lg resize-none"
                  rows="3"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-600">
                    Will send to {selectedSuggestions.length} selected contacts
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMassTextMode(false)}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={sendMassText}
                      disabled={!textTemplate.trim() || selectedSuggestions.length === 0}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Send Messages
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="divide-y max-h-96 overflow-y-auto">
              {smartSuggestions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <SparklesIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No AI suggestions available</p>
                  <p className="text-sm">Adjust filters or check back later</p>
                </div>
              ) : (
                smartSuggestions.map(suggestion => (
                  <div
                    key={suggestion.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedSuggestions.includes(suggestion.id) ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleSuggestion(suggestion.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={selectedSuggestions.includes(suggestion.id)}
                            onChange={() => toggleSuggestion(suggestion.id)}
                            className="rounded"
                          />
                          <span className={`px-2 py-1 text-xs rounded-full ${getInsightColor(suggestion.type)}`}>
                            {suggestion.type.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            suggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
                            suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {suggestion.priority} priority
                          </span>
                        </div>
                        
                        <p className="font-medium text-gray-900">{suggestion.contact.name}</p>
                        <p className="text-sm text-gray-600">{suggestion.contact.phone}</p>
                        
                        {suggestion.insight.property && (
                          <p className="text-sm text-blue-600 mt-1">
                            {suggestion.insight.property.address}
                          </p>
                        )}
                        
                        <p className="text-sm text-gray-700 mt-2">{suggestion.insight.insight}</p>
                        
                        {massTextMode ? (
                          <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                            <p className="font-medium">Suggested Message:</p>
                            <p className="text-gray-700">{suggestion.suggestedMessage}</p>
                          </div>
                        ) : (
                          <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                            <p className="font-medium">Call Script:</p>
                            <p className="text-gray-700">{suggestion.callScript.substring(0, 150)}...</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-green-600">
                          ${suggestion.estimatedValue?.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {suggestion.probability}% probability
                        </p>
                        <div className="w-16 h-2 bg-gray-200 rounded-full mt-1">
                          <div 
                            className="h-2 bg-green-600 rounded-full"
                            style={{ width: `${suggestion.probability}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Dialer Queue & Controls */}
        <div className="space-y-6">
          {/* Current Call */}
          {isDialing && currentCall && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Currently Calling</h3>
              <p className="font-medium">{currentCall.contact.name}</p>
              <p className="text-sm text-gray-600">{currentCall.contact.phone}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm text-blue-700">Dialing...</span>
              </div>
            </div>
          )}

          {/* Dialer Controls */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#636B56] mb-4">Smart Dialer</h3>
            
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{dialerQueue.length}</p>
                <p className="text-sm text-gray-600">contacts in queue</p>
              </div>
              
              {!isDialing ? (
                <button
                  onClick={startSmartDialing}
                  disabled={dialerQueue.length === 0}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <PlayIcon className="h-5 w-5" />
                  Start Smart Dialing
                </button>
              ) : (
                <button
                  onClick={stopDialing}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  <PauseIcon className="h-5 w-5" />
                  Stop Dialing
                </button>
              )}
              
              {dialerQueue.length > 0 && (
                <button
                  onClick={() => setDialerQueue([])}
                  className="w-full px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Clear Queue
                </button>
              )}
            </div>
          </div>

          {/* Call Statistics */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#636B56] mb-4">Today's Results</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Attempted</span>
                <span className="font-medium">{callStats.attempted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Connected</span>
                <span className="font-medium text-green-600">{callStats.connected}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Interested</span>
                <span className="font-medium text-blue-600">{callStats.interested}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Appointments</span>
                <span className="font-medium text-purple-600">{callStats.appointments}</span>
              </div>
              
              {callStats.attempted > 0 && (
                <>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Connect Rate</span>
                      <span className="font-medium">
                        {Math.round((callStats.connected / callStats.attempted) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Interest Rate</span>
                      <span className="font-medium">
                        {callStats.connected > 0 ? Math.round((callStats.interested / callStats.connected) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Property Insights Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#636B56] mb-4">Market Insights</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">New Listings</span>
                <span className="font-medium text-green-600">
                  {propertyInsights.filter(i => i.type === 'new_listing').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Price Reductions</span>
                <span className="font-medium text-blue-600">
                  {propertyInsights.filter(i => i.type === 'price_reduction').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Market Trends</span>
                <span className="font-medium text-purple-600">
                  {propertyInsights.filter(i => i.type === 'market_trend').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}