import { useState, useEffect, useRef } from 'react';
import { 
  PhoneIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  CpuChipIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  DocumentTextIcon,
  BellIcon,
  AdjustmentsHorizontalIcon,
  GlobeAltIcon,
  LanguageIcon,
  ShieldCheckIcon,
  SparklesIcon,
  FireIcon,
  BookOpenIcon
} from '@heroicons/react/24/solid';

export default function AIInboundHandler() {
  const [isActive, setIsActive] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  const [callQueue, setCallQueue] = useState([]);
  const [aiResponses, setAiResponses] = useState([]);
  const [voiceSettings, setVoiceSettings] = useState({
    voiceId: 'terence_clone', // Your 11Labs voice ID
    stability: 0.75,
    similarityBoost: 0.8,
    style: 0.2,
    useSpeakerBoost: true
  });
  const [conversationFlow, setConversationFlow] = useState('greeting');
  const [detectedIntent, setDetectedIntent] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [transferSettings, setTransferSettings] = useState({
    autoTransfer: true,
    transferTriggers: ['human_agent', 'complex_query', 'complaint'],
    availableAgents: []
  });
  const [accentSettings, setAccentSettings] = useState({
    enabled: true,
    sourceAccent: 'filipino',
    targetAccent: 'australian',
    intensity: 0.8
  });
  const [callStats, setCallStats] = useState({
    totalCalls: 0,
    successfulHandled: 0,
    transferred: 0,
    averageRating: 0,
    responseTime: 0
  });
  const [knowledgeBase, setKnowledgeBase] = useState([]);
  const [learningMode, setLearningMode] = useState(true);
  const [multiLanguage, setMultiLanguage] = useState({
    enabled: true,
    primary: 'en-AU',
    supported: ['en-AU', 'en-PH', 'tl-PH', 'zh-CN']
  });

  // AI conversation flows
  const conversationFlows = {
    greeting: {
      prompts: [
        "Hello, thank you for calling Oakmont Realty. This is Terence's AI assistant. How can I help you today?",
        "Good morning! You've reached Oakmont Realty. I'm here to assist you with any property inquiries. What can I do for you?",
        "Hi there! Thanks for calling. I'm Terence's AI assistant and I'm here to help with all your real estate needs. How may I assist you?"
      ],
      nextSteps: ['property_inquiry', 'appointment_booking', 'general_info', 'transfer_request']
    },
    property_inquiry: {
      prompts: [
        "I'd be happy to help you with property information. Could you tell me what type of property you're looking for and in which area?",
        "Great! Let me help you find the perfect property. What's your budget range and preferred location?",
        "Excellent! I can provide detailed information about our current listings. What specific features are you looking for?"
      ],
      followUp: ['price_range', 'location_preference', 'property_features', 'viewing_arrangement']
    },
    appointment_booking: {
      prompts: [
        "I can help you schedule a viewing or consultation. What property are you interested in seeing?",
        "Perfect! Let me check Terence's availability for property viewings. Which property caught your attention?",
        "I'd be happy to arrange a meeting. Are you looking to view a specific property or have a general consultation?"
      ],
      requiresHuman: false,
      canComplete: true
    },
    complaint_handling: {
      prompts: [
        "I understand your concern and I want to make sure we address this properly. Could you please explain the issue in detail?",
        "I'm sorry to hear about this problem. Let me gather some information so we can resolve this for you quickly.",
        "I apologize for any inconvenience. Can you help me understand what happened so I can assist you better?"
      ],
      escalationTriggers: ['angry_tone', 'legal_threat', 'complex_issue'],
      requiresHuman: true
    },
    price_inquiry: {
      prompts: [
        "I can provide you with current market pricing. Which specific property or area are you interested in?",
        "Absolutely! Let me get you the latest price information. Are you looking at a particular listing?",
        "I have access to all our current pricing. What property or area would you like to know about?"
      ],
      dataRequired: ['property_address', 'property_type', 'area']
    }
  };

  // Knowledge base for AI responses
  const defaultKnowledgeBase = [
    {
      category: 'general',
      question: 'What areas do you service?',
      answer: 'We primarily service Parramatta, Westmead, Harris Park, and surrounding Western Sydney suburbs. We have extensive local knowledge of these markets.'
    },
    {
      category: 'pricing',
      question: 'What are your commission rates?',
      answer: 'Our commission rates are competitive and depend on the property type and marketing strategy. Terence can discuss specific rates during a consultation.'
    },
    {
      category: 'process',
      question: 'How long does it take to sell a property?',
      answer: 'On average, properties in our area sell within 28-45 days. However, this varies based on market conditions, pricing, and property condition.'
    },
    {
      category: 'services',
      question: 'Do you offer property management?',
      answer: 'Yes, we offer comprehensive property management services including tenant sourcing, rent collection, maintenance coordination, and regular inspections.'
    },
    {
      category: 'valuation',
      question: 'Can I get a free property valuation?',
      answer: 'Absolutely! We offer complimentary property valuations. I can schedule an appointment for Terence to visit your property and provide a detailed market assessment.'
    }
  ];

  // Accent changer solutions
  const accentChangerOptions = [
    {
      name: 'Real-time Voice Transformer',
      provider: 'Custom Solution',
      features: ['Filipino to Australian accent', 'Real-time processing', 'Adjustable intensity'],
      cost: '$2,000-5,000 setup',
      quality: 'High',
      latency: '<50ms'
    },
    {
      name: 'Respeecher Voice Conversion',
      provider: 'Respeecher',
      features: ['Professional accent changing', 'High quality output', 'Multiple accents'],
      cost: '$500-2,000/month',
      quality: 'Excellent',
      latency: '<100ms'
    },
    {
      name: 'Modulate Voice Skins',
      provider: 'Modulate.ai',
      features: ['Real-time voice modification', 'Multiple voice profiles', 'Low latency'],
      cost: '$1,000-3,000/month',
      quality: 'Very High',
      latency: '<30ms'
    },
    {
      name: 'Custom WebRTC Solution',
      provider: 'In-house',
      features: ['Integrated with VoiCRM', 'Trained on Filipino-Australian accents', 'Optimized for calls'],
      cost: '$10,000-25,000 development',
      quality: 'Customizable',
      latency: '<20ms'
    }
  ];

  useEffect(() => {
    initializeAI();
    loadKnowledgeBase();
    checkAvailableAgents();
    
    // Setup WebSocket for real-time call handling
    setupCallWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const wsRef = useRef(null);

  // Initialize AI systems
  const initializeAI = async () => {
    try {
      // Initialize 11Labs connection
      await fetch('/api/elevenlabs/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: voiceSettings.voiceId,
          settings: voiceSettings
        })
      });
      
      // Initialize accent changer if enabled
      if (accentSettings.enabled) {
        await initializeAccentChanger();
      }
      
      // Load conversation AI model
      await loadConversationModel();
      
      setIsActive(true);
    } catch (error) {
      console.error('Failed to initialize AI systems:', error);
    }
  };

  // Initialize accent changer
  const initializeAccentChanger = async () => {
    try {
      const response = await fetch('/api/accent-changer/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accentSettings)
      });
      
      if (response.ok) {
        console.log('Accent changer initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize accent changer:', error);
    }
  };

  // Load conversation AI model
  const loadConversationModel = async () => {
    // Load fine-tuned model for real estate conversations
    try {
      await fetch('/api/ai/load-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'real-estate-assistant',
          language: multiLanguage.primary,
          personality: 'professional-friendly',
          expertise: 'australian-real-estate'
        })
      });
    } catch (error) {
      console.error('Failed to load conversation model:', error);
    }
  };

  // Setup WebSocket for call handling
  const setupCallWebSocket = () => {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ai-calls/ws`;
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('AI Call Handler WebSocket connected');
    };
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleCallEvent(data);
    };
    
    wsRef.current.onerror = (error) => {
      console.error('AI Call Handler WebSocket error:', error);
    };
  };

  // Handle incoming call events
  const handleCallEvent = async (data) => {
    switch (data.type) {
      case 'incoming_call':
        await handleIncomingCall(data.call);
        break;
      case 'speech_detected':
        await processSpeech(data.speech);
        break;
      case 'call_ended':
        handleCallEnded(data.callId);
        break;
      case 'transfer_request':
        await handleTransferRequest(data);
        break;
    }
  };

  // Handle incoming call
  const handleIncomingCall = async (call) => {
    setCurrentCall(call);
    
    // Lookup caller information
    const callerInfo = await lookupCaller(call.from);
    setCustomerInfo(callerInfo);
    
    // Generate personalized greeting
    const greeting = generateGreeting(callerInfo);
    
    // Start AI conversation
    await startAIConversation(call.id, greeting);
    
    // Log call start
    logCallEvent('call_started', { callId: call.id, from: call.from });
  };

  // Lookup caller information
  const lookupCaller = async (phoneNumber) => {
    try {
      const response = await fetch(`/api/contacts/lookup?phone=${encodeURIComponent(phoneNumber)}`);
      const data = await response.json();
      
      return data.contact || {
        name: 'Unknown Caller',
        phone: phoneNumber,
        isNew: true,
        history: []
      };
    } catch (error) {
      console.error('Caller lookup failed:', error);
      return { name: 'Unknown Caller', phone: phoneNumber, isNew: true };
    }
  };

  // Generate personalized greeting
  const generateGreeting = (callerInfo) => {
    if (callerInfo.isNew) {
      return conversationFlows.greeting.prompts[0];
    } else {
      return `Hello ${callerInfo.name}, thank you for calling Oakmont Realty again. This is Terence's AI assistant. How can I help you today?`;
    }
  };

  // Start AI conversation
  const startAIConversation = async (callId, greeting) => {
    try {
      // Generate speech with 11Labs
      const audioResponse = await fetch('/api/elevenlabs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: greeting,
          voice_id: voiceSettings.voiceId,
          voice_settings: {
            stability: voiceSettings.stability,
            similarity_boost: voiceSettings.similarityBoost,
            style: voiceSettings.style,
            use_speaker_boost: voiceSettings.useSpeakerBoost
          }
        })
      });
      
      if (audioResponse.ok) {
        const audioBlob = await audioResponse.blob();
        
        // Apply accent changer if enabled
        let finalAudio = audioBlob;
        if (accentSettings.enabled) {
          finalAudio = await applyAccentChange(audioBlob);
        }
        
        // Play audio to caller
        await playAudioToCall(callId, finalAudio);
        
        // Log AI response
        setAiResponses(prev => [...prev, {
          id: Date.now(),
          type: 'ai_response',
          text: greeting,
          timestamp: new Date().toISOString(),
          flow: 'greeting'
        }]);
      }
    } catch (error) {
      console.error('Failed to start AI conversation:', error);
    }
  };

  // Apply accent change to audio
  const applyAccentChange = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('source_accent', accentSettings.sourceAccent);
      formData.append('target_accent', accentSettings.targetAccent);
      formData.append('intensity', accentSettings.intensity);
      
      const response = await fetch('/api/accent-changer/process', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        return await response.blob();
      } else {
        return audioBlob; // Return original if accent change fails
      }
    } catch (error) {
      console.error('Accent change failed:', error);
      return audioBlob;
    }
  };

  // Process incoming speech
  const processSpeech = async (speechData) => {
    try {
      // Transcribe speech
      const transcription = await transcribeSpeech(speechData.audio);
      
      // Detect language
      const language = await detectLanguage(transcription);
      
      // Process with conversation AI
      const aiResponse = await generateAIResponse(transcription, language);
      
      // Generate speech response
      await generateAndPlayResponse(aiResponse);
      
      // Update conversation flow
      updateConversationFlow(aiResponse.intent);
      
    } catch (error) {
      console.error('Speech processing failed:', error);
    }
  };

  // Transcribe speech to text
  const transcribeSpeech = async (audioData) => {
    try {
      const response = await fetch('/api/speech/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: audioData })
      });
      
      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error('Transcription failed:', error);
      return '';
    }
  };

  // Detect language
  const detectLanguage = async (text) => {
    try {
      const response = await fetch('/api/language/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      const data = await response.json();
      return data.language || 'en-AU';
    } catch (error) {
      console.error('Language detection failed:', error);
      return 'en-AU';
    }
  };

  // Generate AI response
  const generateAIResponse = async (transcription, language) => {
    try {
      const response = await fetch('/api/ai/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: transcription,
          language: language,
          context: {
            customerInfo: customerInfo,
            conversationFlow: conversationFlow,
            knowledgeBase: knowledgeBase
          },
          personality: 'terence_clone'
        })
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('AI response generation failed:', error);
      return { text: "I apologize, but I'm having technical difficulties. Let me transfer you to a human agent.", intent: 'transfer_request' };
    }
  };

  // Generate and play AI response
  const generateAndPlayResponse = async (aiResponse) => {
    try {
      // Generate speech with 11Labs
      const audioResponse = await fetch('/api/elevenlabs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: aiResponse.text,
          voice_id: voiceSettings.voiceId,
          voice_settings: voiceSettings
        })
      });
      
      if (audioResponse.ok) {
        const audioBlob = await audioResponse.blob();
        
        // Apply accent changer
        let finalAudio = audioBlob;
        if (accentSettings.enabled) {
          finalAudio = await applyAccentChange(audioBlob);
        }
        
        // Play to caller
        await playAudioToCall(currentCall.id, finalAudio);
        
        // Log response
        setAiResponses(prev => [...prev, {
          id: Date.now(),
          type: 'ai_response',
          text: aiResponse.text,
          intent: aiResponse.intent,
          timestamp: new Date().toISOString(),
          flow: conversationFlow
        }]);
      }
    } catch (error) {
      console.error('Failed to generate and play response:', error);
    }
  };

  // Play audio to call
  const playAudioToCall = async (callId, audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('callId', callId);
      
      await fetch('/api/calls/play-audio', {
        method: 'POST',
        body: formData
      });
    } catch (error) {
      console.error('Failed to play audio to call:', error);
    }
  };

  // Update conversation flow
  const updateConversationFlow = (intent) => {
    if (intent && conversationFlows[intent]) {
      setConversationFlow(intent);
      setDetectedIntent(intent);
    }
  };

  // Handle transfer request
  const handleTransferRequest = async (data) => {
    if (transferSettings.autoTransfer) {
      const availableAgent = await findAvailableAgent();
      
      if (availableAgent) {
        await transferCall(currentCall.id, availableAgent);
      } else {
        await handleNoAgentsAvailable();
      }
    }
  };

  // Find available agent
  const findAvailableAgent = async () => {
    try {
      const response = await fetch('/api/agents/available');
      const data = await response.json();
      return data.agents[0] || null;
    } catch (error) {
      console.error('Failed to find available agent:', error);
      return null;
    }
  };

  // Transfer call to human agent
  const transferCall = async (callId, agent) => {
    try {
      await fetch('/api/calls/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: callId,
          agentId: agent.id,
          transferReason: 'ai_escalation',
          callSummary: generateCallSummary()
        })
      });
      
      // Notify agent
      await notifyAgent(agent, currentCall);
      
      logCallEvent('call_transferred', { callId, agentId: agent.id });
    } catch (error) {
      console.error('Call transfer failed:', error);
    }
  };

  // Handle no agents available
  const handleNoAgentsAvailable = async () => {
    const message = "I understand you'd like to speak with a human agent. Unfortunately, all our agents are currently busy. Can I take a message or would you prefer to schedule a callback?";
    
    await generateAndPlayResponse({ text: message, intent: 'callback_offer' });
  };

  // Generate call summary
  const generateCallSummary = () => {
    return {
      caller: customerInfo,
      duration: Date.now() - new Date(currentCall.startTime).getTime(),
      intent: detectedIntent,
      responses: aiResponses.length,
      transferReason: 'Customer requested human agent',
      keyPoints: aiResponses.slice(-3).map(r => r.text)
    };
  };

  // Load knowledge base
  const loadKnowledgeBase = async () => {
    try {
      const response = await fetch('/api/knowledge-base');
      const data = await response.json();
      setKnowledgeBase(data.items || defaultKnowledgeBase);
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
      setKnowledgeBase(defaultKnowledgeBase);
    }
  };

  // Check available agents
  const checkAvailableAgents = async () => {
    try {
      const response = await fetch('/api/agents/status');
      const data = await response.json();
      setTransferSettings(prev => ({
        ...prev,
        availableAgents: data.agents || []
      }));
    } catch (error) {
      console.error('Failed to check available agents:', error);
    }
  };

  // Log call event
  const logCallEvent = async (event, data) => {
    try {
      await fetch('/api/calls/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: event,
          data: data,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to log call event:', error);
    }
  };

  // Handle call ended
  const handleCallEnded = (callId) => {
    setCurrentCall(null);
    setCustomerInfo(null);
    setConversationFlow('greeting');
    setDetectedIntent(null);
    setAiResponses([]);
    
    // Update call stats
    setCallStats(prev => ({
      ...prev,
      totalCalls: prev.totalCalls + 1
    }));
  };

  // Toggle AI system
  const toggleAI = () => {
    setIsActive(!isActive);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#636B56] flex items-center gap-3">
              <CpuChipIcon className="h-8 w-8" />
              AI Inbound Call Handler
            </h1>
            <p className="text-gray-600 mt-1">Intelligent call handling with 11Labs voice cloning and accent modification</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-600' : 'bg-gray-400'}`} />
              <span className="text-sm font-medium">
                {isActive ? 'AI Active' : 'AI Inactive'}
              </span>
            </div>
            
            <button
              onClick={toggleAI}
              className={`px-4 py-2 rounded-lg font-medium ${
                isActive 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isActive ? 'Deactivate AI' : 'Activate AI'}
            </button>
          </div>
        </div>
      </div>

      {/* Philippines Staff Optimization Panel */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6 border">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <GlobeAltIcon className="h-6 w-6 text-blue-600" />
          Philippines Staff Optimization
        </h2>
        
        <div className="grid grid-cols-3 gap-4">
          {/* Accent Changer */}
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <LanguageIcon className="h-5 w-5 text-purple-600" />
              Accent Changer
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Enabled:</span>
                <button
                  onClick={() => setAccentSettings(prev => ({...prev, enabled: !prev.enabled}))}
                  className={`px-2 py-1 text-xs rounded ${
                    accentSettings.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {accentSettings.enabled ? 'ON' : 'OFF'}
                </button>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Source Accent:</label>
                <select
                  value={accentSettings.sourceAccent}
                  onChange={(e) => setAccentSettings(prev => ({...prev, sourceAccent: e.target.value}))}
                  className="w-full px-2 py-1 border rounded text-sm"
                >
                  <option value="filipino">Filipino</option>
                  <option value="american">American</option>
                  <option value="british">British</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Target Accent:</label>
                <select
                  value={accentSettings.targetAccent}
                  onChange={(e) => setAccentSettings(prev => ({...prev, targetAccent: e.target.value}))}
                  className="w-full px-2 py-1 border rounded text-sm"
                >
                  <option value="australian">Australian</option>
                  <option value="american">American</option>
                  <option value="british">British</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Intensity: {accentSettings.intensity}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={accentSettings.intensity}
                  onChange={(e) => setAccentSettings(prev => ({...prev, intensity: parseFloat(e.target.value)}))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Multi-Language Support */}
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-600" />
              Multi-Language
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Primary Language:</label>
                <select
                  value={multiLanguage.primary}
                  onChange={(e) => setMultiLanguage(prev => ({...prev, primary: e.target.value}))}
                  className="w-full px-2 py-1 border rounded text-sm"
                >
                  <option value="en-AU">English (Australian)</option>
                  <option value="en-PH">English (Philippines)</option>
                  <option value="tl-PH">Tagalog</option>
                </select>
              </div>
              
              <div className="text-sm">
                <p className="text-gray-600 mb-1">Supported Languages:</p>
                <div className="flex flex-wrap gap-1">
                  {multiLanguage.supported.map(lang => (
                    <span key={lang} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Auto-Detect:</span>
                <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                  {multiLanguage.enabled ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>

          {/* Network Optimization */}
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-orange-600" />
              Network Optimization
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Latency:</span>
                <span className="font-medium text-green-600">45ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quality:</span>
                <span className="font-medium text-green-600">Excellent</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CDN:</span>
                <span className="font-medium text-blue-600">Singapore</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Voice Server:</span>
                <span className="font-medium text-purple-600">Manila</span>
              </div>
            </div>
            
            <button className="w-full mt-3 px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
              Optimize Connection
            </button>
          </div>
        </div>

        {/* Accent Changer Solutions */}
        <div className="mt-6">
          <h3 className="font-medium text-gray-800 mb-3">Available Accent Changer Solutions</h3>
          <div className="grid grid-cols-2 gap-4">
            {accentChangerOptions.map((option, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">{option.name}</h4>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    {option.quality}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{option.provider}</p>
                
                <div className="space-y-1 text-xs text-gray-600 mb-3">
                  {option.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <CheckCircleIcon className="h-3 w-3 text-green-600" />
                      {feature}
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{option.cost}</span>
                  <span className="text-green-600 font-medium">{option.latency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Current Call Status */}
        <div className="col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-[#636B56] mb-4">Call Status</h2>
            
            {currentCall ? (
              <div className="space-y-4">
                {/* Caller Info */}
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <PhoneIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {customerInfo?.name || 'Unknown Caller'}
                    </p>
                    <p className="text-sm text-gray-600">{currentCall.from}</p>
                    <p className="text-sm text-blue-600">
                      {customerInfo?.isNew ? 'First-time caller' : 'Returning customer'}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-sm text-gray-600">Current Flow:</p>
                    <p className="font-medium text-blue-600">{conversationFlow}</p>
                  </div>
                </div>

                {/* Detected Intent */}
                {detectedIntent && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      Detected Intent: {detectedIntent.replace('_', ' ')}
                    </p>
                  </div>
                )}

                {/* AI Responses */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {aiResponses.map(response => (
                    <div key={response.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <CpuChipIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{response.text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {new Date(response.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {response.flow}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <PhoneIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No active calls</p>
                <p className="text-sm">AI system is ready to handle incoming calls</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Configuration */}
        <div className="space-y-6">
          {/* Voice Settings */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#636B56] mb-4">11Labs Voice Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voice ID
                </label>
                <input
                  type="text"
                  value={voiceSettings.voiceId}
                  onChange={(e) => setVoiceSettings(prev => ({...prev, voiceId: e.target.value}))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Your 11Labs voice ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stability: {voiceSettings.stability}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={voiceSettings.stability}
                  onChange={(e) => setVoiceSettings(prev => ({...prev, stability: parseFloat(e.target.value)}))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Similarity Boost: {voiceSettings.similarityBoost}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={voiceSettings.similarityBoost}
                  onChange={(e) => setVoiceSettings(prev => ({...prev, similarityBoost: parseFloat(e.target.value)}))}
                  className="w-full"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Speaker Boost</span>
                <button
                  onClick={() => setVoiceSettings(prev => ({...prev, useSpeakerBoost: !prev.useSpeakerBoost}))}
                  className={`px-3 py-1 text-sm rounded ${
                    voiceSettings.useSpeakerBoost ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {voiceSettings.useSpeakerBoost ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>

          {/* Call Statistics */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#636B56] mb-4">Performance Stats</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Calls Today:</span>
                <span className="font-medium">{callStats.totalCalls}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Successfully Handled:</span>
                <span className="font-medium text-green-600">{callStats.successfulHandled}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Transferred:</span>
                <span className="font-medium text-blue-600">{callStats.transferred}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Response Time:</span>
                <span className="font-medium">{callStats.responseTime}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Customer Rating:</span>
                <span className="font-medium text-yellow-600">⭐ {callStats.averageRating}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#636B56] mb-4">Quick Actions</h3>
            
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                Test Voice Clone
              </button>
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                Update Knowledge Base
              </button>
              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                Train AI Model
              </button>
              <button className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm">
                Export Call Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}