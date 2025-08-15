// AI Whisper Live Demo Page
import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { 
  MicrophoneIcon,
  SpeakerWaveIcon,
  SparklesIcon,
  LightBulbIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function AIWhisperDemo() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [agentScore, setAgentScore] = useState(0);
  const suggestionRef = useRef(null);

  // Simulate a live call with AI Whisper
  const startDemo = () => {
    setIsCallActive(true);
    setAgentScore(0);
    setConversationHistory([]);
    simulateConversation();
  };

  const simulateConversation = () => {
    const conversation = [
      {
        speaker: 'customer',
        text: "Hi, I saw your listing online for the property in Gregory Hills?",
        timestamp: '0:02',
        suggestion: {
          type: 'greeting',
          title: '💡 Opening Opportunity',
          points: [
            'Acknowledge their interest warmly',
            'Ask which specific property (builds engagement)',
            'Mention you have updated information'
          ],
          response: "Great to hear from you! Yes, I have several properties in Gregory Hills. Which address were you looking at? I actually have some updated information that's not online yet...",
          confidence: 95
        }
      },
      {
        speaker: 'agent',
        text: "Hello! Yes, I'd be happy to help you with our Gregory Hills properties. Which specific property caught your eye?",
        timestamp: '0:08',
        score: 85
      },
      {
        speaker: 'customer',
        text: "The one on Hartley Road. Is it still available? And what's the price?",
        timestamp: '0:15',
        suggestion: {
          type: 'qualifying',
          title: '🎯 Qualification Moment',
          points: [
            'Confirm availability enthusiastically',
            'Ask about their timeline (urgency)',
            'Probe for motivation before giving price'
          ],
          response: "Yes, it's still available and there's been strong interest! Before I share the price, may I ask - are you looking to move soon? And is this for your family or as an investment?",
          confidence: 92
        }
      },
      {
        speaker: 'agent',
        text: "Yes, it's definitely still available! That's a beautiful 4-bedroom home. Are you looking for yourself or as an investment?",
        timestamp: '0:23',
        score: 75
      },
      {
        speaker: 'customer',
        text: "For my family. We're currently renting and our lease ends in 2 months.",
        timestamp: '0:30',
        suggestion: {
          type: 'urgency',
          title: '🔥 High Priority Lead!',
          points: [
            'Acknowledge time pressure',
            'Create urgency about market',
            'Suggest immediate viewing'
          ],
          response: "Perfect timing! With your lease ending soon, we should move quickly. The market in Gregory Hills is very competitive. I actually have time this afternoon or tomorrow morning to show you through - which works better?",
          confidence: 98,
          priority: 'high'
        }
      },
      {
        speaker: 'agent',
        text: "Oh that's perfect timing! The market is moving quickly. When would you like to view the property?",
        timestamp: '0:38',
        score: 90
      },
      {
        speaker: 'customer',
        text: "Well, I need to check with my partner first. Can you just email me the details?",
        timestamp: '0:45',
        suggestion: {
          type: 'objection',
          title: '⚠️ Commitment Hesitation',
          points: [
            'Acknowledge partner involvement',
            'Maintain momentum',
            'Get tentative commitment'
          ],
          response: "Of course! I'll send you everything right away. What if we pencil in Saturday morning at 10am? You can confirm with your partner tonight, and if it doesn't work, we'll reschedule. This way we secure your spot as I have other viewings booking up.",
          confidence: 88,
          priority: 'medium'
        }
      },
      {
        speaker: 'agent',
        text: "Absolutely! I'll email you all the details. How about we tentatively book Saturday at 10am, and you can confirm after speaking with your partner?",
        timestamp: '0:55',
        score: 95
      },
      {
        speaker: 'customer',
        text: "That sounds good. My email is sarah.chen@gmail.com",
        timestamp: '1:02',
        suggestion: {
          type: 'closing',
          title: '✅ Closing Strong',
          points: [
            'Confirm email and appointment',
            'Set follow-up expectation',
            'End with enthusiasm'
          ],
          response: "Perfect, Sarah! I've got sarah.chen@gmail.com and Saturday 10am penciled in. I'll send the details within the hour, and I'll give you a quick call Friday afternoon to confirm. You're going to love this home - it's perfect for families!",
          confidence: 96
        }
      }
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < conversation.length) {
        const entry = conversation[index];
        
        // Add to conversation history
        setConversationHistory(prev => [...prev, {
          speaker: entry.speaker,
          text: entry.text,
          timestamp: entry.timestamp
        }]);

        // Show AI suggestion if customer is speaking
        if (entry.speaker === 'customer' && entry.suggestion) {
          setCurrentSuggestion(entry.suggestion);
          // Auto-scroll to suggestion
          setTimeout(() => {
            suggestionRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }

        // Update score if agent is speaking
        if (entry.speaker === 'agent' && entry.score) {
          setAgentScore(entry.score);
        }

        index++;
      } else {
        clearInterval(interval);
        setIsCallActive(false);
        // Show final score
        setCurrentSuggestion({
          type: 'summary',
          title: '📊 Call Complete!',
          points: [
            'Secured tentative appointment ✅',
            'Captured contact information ✅',
            'Maintained control of conversation ✅',
            'Created urgency effectively ✅'
          ],
          response: 'Final Score: 88/100 - Grade: A',
          confidence: 100,
          priority: 'success'
        });
      }
    }, 3500); // New message every 3.5 seconds

    return () => clearInterval(interval);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'success': return 'border-green-500 bg-green-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <SparklesIcon className="h-10 w-10 text-[#636B56]" />
            <div>
              <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
                AI Call Whisper - Live Demo
              </h1>
              <p className="text-[#7a7a7a]">Real-time AI assistance during customer calls</p>
            </div>
          </div>
        </div>

        {/* Demo Control */}
        {!isCallActive && conversationHistory.length === 0 && (
          <div className="bg-gradient-to-r from-[#636B56] to-[#864936] rounded-xl p-12 text-white text-center mb-8">
            <SpeakerWaveIcon className="h-20 w-20 mx-auto mb-6 animate-pulse" />
            <h2 className="text-2xl font-bold mb-4">Experience AI Whisper in Action</h2>
            <p className="text-lg mb-8 opacity-90">
              Watch how AI provides real-time suggestions during a live property inquiry call
            </p>
            <button
              onClick={startDemo}
              className="px-8 py-4 bg-white text-[#636B56] rounded-lg font-bold text-lg hover:shadow-lg transition-all"
            >
              Start Live Demo
            </button>
          </div>
        )}

        {/* Live Call Interface */}
        {(isCallActive || conversationHistory.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Conversation */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-[#B28354]/20 shadow-lg">
                {/* Call Header */}
                <div className="p-4 border-b border-[#B28354]/20 bg-[#F8F2E7]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${isCallActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                      <span className="font-semibold text-[#1a1a1a]">
                        {isCallActive ? 'Call in Progress' : 'Call Ended'}
                      </span>
                      <span className="text-sm text-[#7a7a7a]">Gregory Hills Property Inquiry</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#7a7a7a]">Agent Score:</span>
                      <span className="text-2xl font-bold text-[#636B56]">{agentScore}%</span>
                    </div>
                  </div>
                </div>

                {/* Conversation */}
                <div className="p-6 max-h-[600px] overflow-y-auto">
                  {conversationHistory.map((entry, index) => (
                    <div key={index} className={`mb-6 ${entry.speaker === 'agent' ? 'ml-12' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          entry.speaker === 'customer' 
                            ? 'bg-gray-200 text-gray-600' 
                            : 'bg-[#636B56] text-white'
                        }`}>
                          {entry.speaker === 'customer' ? 'C' : 'A'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-[#1a1a1a]">
                              {entry.speaker === 'customer' ? 'Customer' : 'Agent (You)'}
                            </span>
                            <span className="text-xs text-[#7a7a7a]">{entry.timestamp}</span>
                          </div>
                          <div className={`p-3 rounded-lg ${
                            entry.speaker === 'customer'
                              ? 'bg-gray-100 text-[#1a1a1a]'
                              : 'bg-[#636B56]/10 text-[#1a1a1a] border border-[#636B56]/20'
                          }`}>
                            {entry.text}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isCallActive && (
                    <div className="flex items-center justify-center py-4">
                      <ArrowPathIcon className="h-6 w-6 text-[#636B56] animate-spin" />
                      <span className="ml-2 text-[#7a7a7a]">Listening...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: AI Suggestions */}
            <div ref={suggestionRef}>
              {currentSuggestion && (
                <div className={`bg-white rounded-xl border-2 shadow-lg p-6 ${getPriorityColor(currentSuggestion.priority)}`}>
                  <div className="flex items-start gap-3 mb-4">
                    <LightBulbIcon className="h-6 w-6 text-yellow-500 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-[#1a1a1a]">{currentSuggestion.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-[#636B56] text-white px-2 py-1 rounded">
                          {currentSuggestion.confidence}% confidence
                        </span>
                        {currentSuggestion.priority === 'high' && (
                          <span className="text-xs bg-red-500 text-white px-2 py-1 rounded animate-pulse">
                            HIGH PRIORITY
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Key Points */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-[#4a4a4a] mb-2">Key Points:</h4>
                    <ul className="space-y-2">
                      {currentSuggestion.points.map((point, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <ChevronRightIcon className="h-4 w-4 text-[#636B56] flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-[#1a1a1a]">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Suggested Response */}
                  <div className="bg-white rounded-lg p-4 border border-[#636B56]/20">
                    <h4 className="text-sm font-semibold text-[#636B56] mb-2">Suggested Response:</h4>
                    <p className="text-sm text-[#1a1a1a] italic">"{currentSuggestion.response}"</p>
                  </div>

                  {/* Quick Actions */}
                  {currentSuggestion.type !== 'summary' && (
                    <div className="mt-4 flex gap-2">
                      <button className="flex-1 py-2 px-3 bg-[#636B56] text-white rounded text-sm font-medium hover:bg-[#636B56]/90 transition-colors">
                        Use Suggestion
                      </button>
                      <button className="flex-1 py-2 px-3 bg-white border border-[#636B56] text-[#636B56] rounded text-sm font-medium hover:bg-[#636B56]/5 transition-colors">
                        Modify
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* AI Capabilities */}
              <div className="mt-6 bg-[#F8F2E7] rounded-xl p-6">
                <h3 className="font-bold text-[#1a1a1a] mb-4">AI Whisper Capabilities</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-[#4a4a4a]">Real-time conversation analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-[#4a4a4a]">Objection handling suggestions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-[#4a4a4a]">Closing technique recommendations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-[#4a4a4a]">Compliance monitoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-[#4a4a4a]">Sentiment detection</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Restart Demo Button */}
        {!isCallActive && conversationHistory.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={startDemo}
              className="px-6 py-3 bg-gradient-to-r from-[#636B56] to-[#864936] text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Restart Demo
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}