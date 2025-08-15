import { useState, useEffect, useRef, useCallback } from 'react';
import { SparklesIcon, LightBulbIcon, ChartBarIcon, BoltIcon } from '@heroicons/react/24/solid';

// Offline AI suggestion engine - no API calls needed
export default function AIWhispererOptimized({ 
  transcript, 
  contactInfo, 
  isCallActive,
  sentiment 
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState('aggressive'); // aggressive, moderate, passive
  const [cache, setCache] = useState({});
  
  // Pre-computed suggestion templates for instant responses
  const suggestionTemplates = useRef({
    greetings: {
      patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
      responses: [
        { text: "Introduce yourself warmly and ask how they're doing today", priority: 'high' },
        { text: "Mention you're calling about their property interests", priority: 'medium' },
        { text: "Reference any previous conversations if applicable", priority: 'low' }
      ]
    },
    
    objections: {
      price: {
        patterns: ['expensive', 'too much', 'cant afford', 'budget', 'price'],
        responses: [
          { text: "Acknowledge their concern and ask about their budget range", priority: 'high' },
          { text: "Mention flexible payment options and financing available", priority: 'high' },
          { text: "Focus on value and ROI rather than just price", priority: 'medium' },
          { text: "Compare with market averages to show competitive pricing", priority: 'medium' }
        ]
      },
      timing: {
        patterns: ['not now', 'busy', 'later', 'not ready', 'bad time'],
        responses: [
          { text: "Respect their time and ask when would be better to call", priority: 'high' },
          { text: "Offer to send information via email for review at their convenience", priority: 'medium' },
          { text: "Create urgency by mentioning limited availability", priority: 'low' }
        ]
      },
      trust: {
        patterns: ['dont know you', 'who are you', 'scam', 'legitimate'],
        responses: [
          { text: "Provide your credentials and company information", priority: 'high' },
          { text: "Offer to send company verification via email", priority: 'high' },
          { text: "Mention satisfied clients and success stories", priority: 'medium' }
        ]
      }
    },

    questions: {
      property: {
        patterns: ['what kind', 'location', 'size', 'bedrooms', 'price range'],
        responses: [
          { text: "Provide specific details about available properties", priority: 'high' },
          { text: "Ask clarifying questions about their preferences", priority: 'high' },
          { text: "Suggest scheduling a viewing for properties that match", priority: 'medium' }
        ]
      },
      process: {
        patterns: ['how does', 'what happens', 'next steps', 'process'],
        responses: [
          { text: "Explain the process step-by-step in simple terms", priority: 'high' },
          { text: "Emphasize how easy and supported they'll be throughout", priority: 'medium' },
          { text: "Offer to guide them personally through each step", priority: 'medium' }
        ]
      }
    },

    buying_signals: {
      patterns: ['interested', 'tell me more', 'sounds good', 'when can', 'how much'],
      responses: [
        { text: "Great! Move to schedule a viewing or meeting", priority: 'high', action: 'close' },
        { text: "Strike while iron is hot - get commitment now", priority: 'high', action: 'close' },
        { text: "Ask for their availability this week", priority: 'high', action: 'close' },
        { text: "Confirm their contact details for follow-up", priority: 'medium' }
      ]
    },

    closing: {
      soft: [
        { text: "Would you be interested in seeing this property this week?", priority: 'high' },
        { text: "What day works best for you to discuss this further?", priority: 'high' },
        { text: "Can I schedule a quick 15-minute consultation for you?", priority: 'medium' }
      ],
      hard: [
        { text: "Let's lock in a viewing for tomorrow at 2 PM. Does that work?", priority: 'high' },
        { text: "I can hold this property for you for 24 hours. Shall I do that?", priority: 'high' },
        { text: "This property won't last long. Can we move forward today?", priority: 'high' }
      ]
    },

    rapport: {
      patterns: ['family', 'kids', 'work', 'hobby', 'weekend'],
      responses: [
        { text: "Build rapport by showing genuine interest in what they shared", priority: 'medium' },
        { text: "Connect their personal situation to property benefits", priority: 'medium' },
        { text: "Share a brief relatable experience if appropriate", priority: 'low' }
      ]
    }
  }).current;

  // Fast pattern matching using pre-compiled regex
  const patternMatchers = useRef({});
  
  // Initialize pattern matchers for performance
  useEffect(() => {
    Object.entries(suggestionTemplates).forEach(([category, data]) => {
      if (data.patterns) {
        patternMatchers.current[category] = new RegExp(
          data.patterns.join('|'), 
          'gi'
        );
      } else if (category === 'objections') {
        Object.entries(data).forEach(([subCategory, subData]) => {
          patternMatchers.current[`objections_${subCategory}`] = new RegExp(
            subData.patterns.join('|'),
            'gi'
          );
        });
      }
    });
  }, []);

  // Ultra-fast suggestion generation (< 10ms)
  const generateSuggestions = useCallback((text, sentimentScore) => {
    const startTime = performance.now();
    const newSuggestions = [];
    const lowerText = text.toLowerCase();
    const lastSentence = text.split(/[.!?]/).slice(-1)[0] || '';
    
    // Check cache first for instant response
    const cacheKey = lastSentence.slice(-50); // Last 50 chars as key
    if (cache[cacheKey]) {
      setSuggestions(cache[cacheKey]);
      return;
    }

    // 1. Check for buying signals (highest priority)
    if (patternMatchers.current.buying_signals?.test(lastSentence)) {
      newSuggestions.push(...suggestionTemplates.buying_signals.responses);
      
      // Add aggressive closing if sentiment is positive
      if (sentimentScore > 20) {
        newSuggestions.push(...suggestionTemplates.closing.hard);
      } else {
        newSuggestions.push(...suggestionTemplates.closing.soft);
      }
    }

    // 2. Check for objections
    Object.entries(suggestionTemplates.objections).forEach(([type, data]) => {
      if (patternMatchers.current[`objections_${type}`]?.test(lastSentence)) {
        newSuggestions.push(...data.responses);
      }
    });

    // 3. Check for questions
    if (lastSentence.includes('?') || lowerText.includes('what') || lowerText.includes('how')) {
      Object.entries(suggestionTemplates.questions).forEach(([type, data]) => {
        if (data.patterns.some(p => lowerText.includes(p))) {
          newSuggestions.push(...data.responses);
        }
      });
    }

    // 4. Context-based suggestions
    if (newSuggestions.length === 0) {
      // Conversation stage detection
      const wordCount = text.split(/\s+/).length;
      
      if (wordCount < 20) {
        // Beginning of call
        newSuggestions.push(
          { text: "Build rapport - ask about their day", priority: 'medium' },
          { text: "State the purpose of your call clearly", priority: 'high' },
          { text: "Ask an open-ended question about their needs", priority: 'medium' }
        );
      } else if (wordCount < 100) {
        // Mid conversation
        newSuggestions.push(
          { text: "Ask discovery questions about their timeline", priority: 'high' },
          { text: "Probe deeper into their specific requirements", priority: 'medium' },
          { text: "Share a relevant success story or case study", priority: 'low' }
        );
      } else {
        // Later in conversation
        newSuggestions.push(
          { text: "Summarize what you've discussed so far", priority: 'medium' },
          { text: "Move towards scheduling next steps", priority: 'high' },
          { text: "Ask if they have any remaining questions", priority: 'medium' }
        );
      }
    }

    // 5. Sentiment-based adjustments
    if (sentimentScore < -20) {
      // Negative sentiment - add de-escalation
      newSuggestions.unshift(
        { text: "⚠️ Acknowledge their frustration and apologize if needed", priority: 'urgent' },
        { text: "⚠️ Ask: 'What would make this work better for you?'", priority: 'urgent' }
      );
    } else if (sentimentScore > 50) {
      // Very positive - push for close
      newSuggestions.unshift(
        { text: "🔥 They're ready! Ask for the commitment now!", priority: 'urgent', action: 'close' },
        { text: "🔥 Schedule the next step immediately", priority: 'urgent', action: 'close' }
      );
    }

    // 6. Smart follow-up based on silence
    const lastWordTime = performance.now();
    if (lastWordTime - window.lastSpeechTime > 3000) {
      newSuggestions.push(
        { text: "Break the silence with an engaging question", priority: 'high' },
        { text: "Check if they're still there: 'Are you still with me?'", priority: 'medium' }
      );
    }

    // Sort by priority and limit to top 5
    const sorted = newSuggestions
      .sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 5);

    // Cache the result
    setCache(prev => ({
      ...prev,
      [cacheKey]: sorted
    }));

    setSuggestions(sorted);
    
    const processingTime = performance.now() - startTime;
    console.log(`Suggestion generation took ${processingTime.toFixed(2)}ms`);
    
  }, [cache, mode]);

  // Process transcript changes with debouncing for performance
  useEffect(() => {
    if (!transcript || !isCallActive) return;

    // Update last speech time
    window.lastSpeechTime = performance.now();

    // Debounce for performance
    const timer = setTimeout(() => {
      generateSuggestions(transcript, sentiment?.score || 0);
    }, 100); // 100ms debounce

    return () => clearTimeout(timer);
  }, [transcript, isCallActive, sentiment, generateSuggestions]);

  // Quick action buttons
  const quickActions = [
    {
      label: 'Need to Close',
      icon: BoltIcon,
      action: () => setSuggestions(suggestionTemplates.closing.hard)
    },
    {
      label: 'Handle Objection',
      icon: LightBulbIcon,
      action: () => {
        const objectionSuggestions = [];
        Object.values(suggestionTemplates.objections).forEach(obj => {
          objectionSuggestions.push(...obj.responses);
        });
        setSuggestions(objectionSuggestions.slice(0, 5));
      }
    },
    {
      label: 'Build Rapport',
      icon: SparklesIcon,
      action: () => setSuggestions(suggestionTemplates.rapport.responses)
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-[#636B56]" />
          <h3 className="text-lg font-bold text-[#636B56]">AI Sales Coach</h3>
          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
            Offline Mode
          </span>
        </div>
        
        {/* Mode Selector */}
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="text-sm border rounded px-2 py-1"
        >
          <option value="aggressive">Aggressive</option>
          <option value="moderate">Moderate</option>
          <option value="passive">Passive</option>
        </select>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-3">
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.action}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </button>
        ))}
      </div>

      {/* Suggestions */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {suggestions.length > 0 ? (
          suggestions.map((suggestion, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border-l-4 transition-all ${
                suggestion.priority === 'urgent' 
                  ? 'bg-red-50 border-red-500 animate-pulse' 
                  : suggestion.priority === 'high'
                  ? 'bg-green-50 border-green-500'
                  : suggestion.priority === 'medium'
                  ? 'bg-blue-50 border-blue-500'
                  : 'bg-gray-50 border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <p className="text-sm text-gray-800 flex-1">{suggestion.text}</p>
                {suggestion.action === 'close' && (
                  <span className="ml-2 px-2 py-1 text-xs bg-green-500 text-white rounded">
                    CLOSE
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <SparklesIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Listening and analyzing...</p>
            <p className="text-xs mt-1">Suggestions appear instantly as customer speaks</p>
          </div>
        )}
      </div>

      {/* Performance Indicator */}
      <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-gray-500">
        <span>Response time: &lt;10ms</span>
        <span>100% Offline</span>
        <span>No API needed</span>
      </div>
    </div>
  );
}

// Pre-computed conversation scripts for common scenarios
export const ConversationScripts = {
  coldCall: {
    opening: "Hi [Name], this is [Your Name] from [Company]. I'm calling because we have some exciting properties in [Area] that match what buyers in your situation are looking for. Do you have 2 minutes?",
    
    overcome_initial_resistance: {
      "not_interested": "I completely understand. Before I let you go, can I ask - are you happy with your current living situation, or might you consider a change if the right opportunity came along?",
      "busy": "I appreciate you're busy. Would it be better if I called you this evening, or would tomorrow morning work better?",
      "already_have_agent": "That's great that you have someone you trust. I'm not looking to replace anyone - I just wanted to make sure you're aware of some off-market opportunities that haven't been widely advertised yet."
    },

    discovery_questions: [
      "What's most important to you in your next property?",
      "What's your ideal timeline for making a move?",
      "What would need to happen for you to seriously consider a new property?",
      "What's your current living situation like?"
    ],

    closing: "Based on what you've told me, I have 2-3 properties that could be perfect for you. Would you prefer to see them this Thursday afternoon or Saturday morning?"
  },

  followUp: {
    warm: "Hi [Name], it's [Your Name] following up on our conversation about [Property/Area]. I've found something I think you'll love...",
    cold: "Hi [Name], it's [Your Name] from [Company]. We spoke [timeframe] ago about [topic]. I wanted to reach out because...",
    voicemail: "Hi [Name], it's [Your Name] from [Company]. I have some exciting news about properties in [Area] that match exactly what you're looking for. Please call me back at [Number] - I think you'll be really interested in what I've found."
  },

  objectionHandling: {
    price: {
      response: "I hear you on the price. Let me ask you this - if we could make the numbers work with the right financing, would this be the right property for you?",
      follow_up: "What would need to happen with the price for this to make sense for you?"
    },
    
    timing: {
      response: "I understand timing is important. What would need to happen for the timing to be right?",
      follow_up: "If the perfect property came along, would you be open to adjusting your timeline?"
    },

    location: {
      response: "Location is definitely crucial. What specifically about the location doesn't work for you?",
      follow_up: "If we found something with [specific features] but in a slightly different area, would you consider it?"
    }
  }
};