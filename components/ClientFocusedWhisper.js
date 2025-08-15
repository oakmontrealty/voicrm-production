import { useState, useEffect, useRef, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ClientFocusedWhisper() {
  const [clientSpeech, setClientSpeech] = useState('');
  const [agentSpeech, setAgentSpeech] = useState('');
  const [realTimeResponses, setRealTimeResponses] = useState([]);
  const [clientEmotion, setClientEmotion] = useState({});
  const [buyingSignals, setBuyingSignals] = useState([]);
  const [objectionHandling, setObjectionHandling] = useState([]);
  const [urgencyLevel, setUrgencyLevel] = useState(0);
  const [nextBestAction, setNextBestAction] = useState('');
  const [competitiveIntel, setCompetitiveIntel] = useState({});
  const [persuasionTactics, setPersuasionTactics] = useState([]);
  
  const supabase = createClientComponentClient();
  const clientAudioRef = useRef(null);
  const speakerSeparationRef = useRef(null);
  const clientAnalysisRef = useRef(null);
  const responseEngineRef = useRef(null);

  // UNFAIR ADVANTAGE: Real-time client psychology analysis
  const psychologyPatterns = {
    buying_signals: [
      { pattern: /when can we move forward|ready to proceed|sounds good/i, confidence: 0.9, action: 'close_now' },
      { pattern: /what's the next step|how do we do this|tell me more/i, confidence: 0.8, action: 'provide_process' },
      { pattern: /my spouse|partner|family/i, confidence: 0.7, action: 'involve_decision_makers' },
      { pattern: /budget|afford|price|cost/i, confidence: 0.6, action: 'address_financial' }
    ],
    objections: [
      { pattern: /too expensive|can't afford/i, objection: 'price', script: 'I understand price is important. Let me show you the value breakdown...' },
      { pattern: /need to think|not sure/i, objection: 'uncertainty', script: 'What specific concerns can I address to help you feel confident?' },
      { pattern: /other options|comparing/i, objection: 'competition', script: 'I appreciate you being thorough. What criteria matter most to you?' },
      { pattern: /not the right time|timing/i, objection: 'timing', script: 'I understand timing is crucial. What would make this the right time?' }
    ],
    emotional_states: [
      { pattern: /excited|love it|perfect/i, emotion: 'enthusiasm', response: 'match_energy' },
      { pattern: /worried|concerned|nervous/i, emotion: 'anxiety', response: 'reassure' },
      { pattern: /frustrated|annoyed|difficult/i, emotion: 'frustration', response: 'empathize' },
      { pattern: /confused|don't understand/i, emotion: 'confusion', response: 'clarify' }
    ],
    urgency_indicators: [
      { pattern: /need it now|urgent|asap/i, urgency: 10, action: 'immediate_action' },
      { pattern: /soon|quickly|fast/i, urgency: 7, action: 'expedite_process' },
      { pattern: /no rush|take time/i, urgency: 3, action: 'nurture_relationship' }
    ]
  };

  // UNFAIR ADVANTAGE: Competitor intelligence from speech
  const competitorAnalysis = {
    mentions: [
      { company: /coldwell banker|cb/i, weakness: 'technology', strength: 'brand' },
      { company: /re\/max|remax/i, weakness: 'fees', strength: 'network' },
      { company: /keller williams|kw/i, weakness: 'training_overload', strength: 'culture' },
      { company: /century 21/i, weakness: 'outdated', strength: 'recognition' }
    ],
    responses: {
      'technology': 'You mentioned [competitor]. While they have good brand recognition, our AI-powered system gives you advantages they simply can\'t match...',
      'fees': 'I understand [competitor] might seem cheaper upfront, but let me show you the hidden costs and how we actually save you money...',
      'network': 'Their network is large, but what matters is results. Our targeted approach often outperforms volume-based strategies...'
    }
  };

  useEffect(() => {
    setupClientFocusedListening();
    initializeUnfairAdvantages();
    return () => cleanup();
  }, []);

  const setupClientFocusedListening = async () => {
    try {
      // Advanced dual-channel audio processing
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 2, // Stereo for speaker separation
          advanced: [{
            googExperimentalNoiseSuppression: true,
            googExperimentalEchoCancellation: true,
            googExperimentalAutoGainControl: true
          }]
        }
      });

      // Separate client audio channel (assuming client is on right channel)
      const audioContext = new AudioContext({ sampleRate: 48000 });
      const source = audioContext.createMediaStreamSource(stream);
      
      // Advanced speaker separation using ML
      speakerSeparationRef.current = await createSpeakerSeparator(source);
      
      // Client-focused processing pipeline
      clientAudioRef.current = speakerSeparationRef.current.clientChannel;
      
      startClientAnalysis();

    } catch (error) {
      console.error('Failed to setup client-focused listening:', error);
    }
  };

  const createSpeakerSeparator = async (audioSource) => {
    // UNFAIR ADVANTAGE: AI-powered speaker separation
    const response = await fetch('/api/ai/speaker-separation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'advanced_separation',
        real_time: true,
        focus: 'client_only'
      })
    });

    const separatorConfig = await response.json();
    
    // Create virtual channels for client vs agent
    const clientProcessor = audioSource.context.createScriptProcessor(4096, 2, 1);
    const agentProcessor = audioSource.context.createScriptProcessor(4096, 2, 1);
    
    clientProcessor.onaudioprocess = (event) => {
      const leftChannel = event.inputBuffer.getChannelData(0);
      const rightChannel = event.inputBuffer.getChannelData(1);
      
      // AI determines which channel is client based on voice characteristics
      const clientAudio = identifyClientChannel(leftChannel, rightChannel);
      processClientAudio(clientAudio);
    };

    audioSource.connect(clientProcessor);
    audioSource.connect(agentProcessor);

    return {
      clientChannel: clientProcessor,
      agentChannel: agentProcessor
    };
  };

  const identifyClientChannel = (leftChannel, rightChannel) => {
    // UNFAIR ADVANTAGE: Real-time voice fingerprinting
    // This would use AI to identify which speaker is the client vs agent
    // For now, assuming client is typically on the right channel in phone calls
    return rightChannel;
  };

  const processClientAudio = async (audioData) => {
    try {
      // Convert audio to text focusing ONLY on client speech
      const transcript = await transcribeClientSpeech(audioData);
      if (transcript && transcript.length > 0) {
        setClientSpeech(prev => prev + ' ' + transcript);
        
        // Immediate real-time analysis of client speech
        await analyzeClientSpeechRealTime(transcript);
      }
    } catch (error) {
      console.error('Client audio processing error:', error);
    }
  };

  const transcribeClientSpeech = async (audioData) => {
    // UNFAIR ADVANTAGE: Ultra-fast client-only transcription
    const response = await fetch('/api/ai/client-whisper', {
      method: 'POST',
      body: createAudioBlob(audioData),
      headers: {
        'Content-Type': 'audio/wav',
        'X-Focus': 'client-only',
        'X-Priority': 'high',
        'X-Speed': 'ultra-fast'
      }
    });

    const result = await response.json();
    return result.transcript;
  };

  const analyzeClientSpeechRealTime = async (transcript) => {
    const startTime = performance.now();
    
    // Parallel analysis for maximum speed
    const analyses = await Promise.allSettled([
      detectBuyingSignals(transcript),
      identifyObjections(transcript),
      analyzeEmotionalState(transcript),
      assessUrgency(transcript),
      scanForCompetitors(transcript),
      generateInstantResponse(transcript)
    ]);

    // Process all results
    const [buyingSignalsResult, objectionsResult, emotionResult, urgencyResult, competitorResult, responseResult] = analyses;

    if (buyingSignalsResult.status === 'fulfilled') {
      setBuyingSignals(prev => [...prev, ...buyingSignalsResult.value]);
    }
    
    if (objectionsResult.status === 'fulfilled') {
      setObjectionHandling(prev => [...prev, ...objectionsResult.value]);
    }
    
    if (emotionResult.status === 'fulfilled') {
      setClientEmotion(emotionResult.value);
    }
    
    if (urgencyResult.status === 'fulfilled') {
      setUrgencyLevel(urgencyResult.value);
    }
    
    if (competitorResult.status === 'fulfilled') {
      setCompetitiveIntel(competitorResult.value);
    }
    
    if (responseResult.status === 'fulfilled') {
      setRealTimeResponses(prev => [responseResult.value, ...prev.slice(0, 4)]); // Keep last 5
    }

    console.log(`Client analysis completed in ${performance.now() - startTime}ms`);
  };

  const detectBuyingSignals = (transcript) => {
    const signals = [];
    const text = transcript.toLowerCase();
    
    for (const signal of psychologyPatterns.buying_signals) {
      if (signal.pattern.test(text)) {
        signals.push({
          signal: signal.pattern.source,
          confidence: signal.confidence,
          action: signal.action,
          timestamp: Date.now(),
          urgency: signal.confidence > 0.8 ? 'immediate' : 'soon'
        });
      }
    }
    
    return signals;
  };

  const identifyObjections = (transcript) => {
    const objections = [];
    const text = transcript.toLowerCase();
    
    for (const objection of psychologyPatterns.objections) {
      if (objection.pattern.test(text)) {
        objections.push({
          type: objection.objection,
          script: objection.script,
          confidence: 0.9,
          timestamp: Date.now()
        });
      }
    }
    
    return objections;
  };

  const analyzeEmotionalState = async (transcript) => {
    // UNFAIR ADVANTAGE: Real-time emotional intelligence
    const response = await fetch('/api/ai/emotion-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: transcript,
        mode: 'real_estate_optimized',
        focus: 'buying_psychology'
      })
    });

    const emotion = await response.json();
    
    // Add our proprietary patterns
    for (const pattern of psychologyPatterns.emotional_states) {
      if (pattern.pattern.test(transcript.toLowerCase())) {
        emotion.detected_emotion = pattern.emotion;
        emotion.response_strategy = pattern.response;
        emotion.confidence = Math.min((emotion.confidence || 0) + 0.2, 1.0);
      }
    }
    
    return emotion;
  };

  const assessUrgency = (transcript) => {
    let urgencyScore = 0;
    const text = transcript.toLowerCase();
    
    for (const indicator of psychologyPatterns.urgency_indicators) {
      if (indicator.pattern.test(text)) {
        urgencyScore = Math.max(urgencyScore, indicator.urgency);
      }
    }
    
    // Additional urgency indicators
    const urgentWords = ['now', 'today', 'immediately', 'urgent', 'asap', 'quick'];
    const urgentCount = urgentWords.filter(word => text.includes(word)).length;
    
    return Math.min(urgencyScore + urgentCount, 10);
  };

  const scanForCompetitors = (transcript) => {
    const intel = { competitors_mentioned: [], strategies: [] };
    const text = transcript.toLowerCase();
    
    for (const competitor of competitorAnalysis.mentions) {
      if (competitor.company.test(text)) {
        intel.competitors_mentioned.push({
          name: competitor.company.source.replace(/[\/\\|]/g, '').split('|')[0],
          weakness: competitor.weakness,
          strength: competitor.strength,
          counter_strategy: competitorAnalysis.responses[competitor.weakness]
        });
      }
    }
    
    return intel;
  };

  const generateInstantResponse = async (transcript) => {
    // UNFAIR ADVANTAGE: Real-time response generation
    const response = await fetch('/api/ai/instant-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_statement: transcript,
        context: {
          buying_signals: buyingSignals,
          emotions: clientEmotion,
          objections: objectionHandling,
          urgency: urgencyLevel,
          competitors: competitiveIntel
        },
        mode: 'real_estate_sales',
        personality: 'consultative_closer',
        speed: 'instant'
      })
    });

    const result = await response.json();
    
    return {
      text: result.response,
      confidence: result.confidence,
      type: result.response_type,
      priority: result.priority,
      timestamp: Date.now()
    };
  };

  const createAudioBlob = (audioData) => {
    const buffer = new ArrayBuffer(audioData.length * 2);
    const view = new DataView(buffer);
    
    for (let i = 0; i < audioData.length; i++) {
      view.setInt16(i * 2, audioData[i] * 0x7FFF, true);
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  };

  const initializeUnfairAdvantages = () => {
    // Load proprietary competitor database
    loadCompetitorIntelligence();
    
    // Initialize psychological profiling
    initializePsychologyEngine();
    
    // Setup market advantage algorithms
    setupMarketDominance();
  };

  const loadCompetitorIntelligence = async () => {
    // UNFAIR ADVANTAGE: Real-time competitor intelligence
    try {
      const response = await fetch('/api/intelligence/competitors');
      const intel = await response.json();
      
      // Merge with our patterns
      competitorAnalysis.mentions = [...competitorAnalysis.mentions, ...intel.competitors];
      competitorAnalysis.responses = {...competitorAnalysis.responses, ...intel.responses};
    } catch (error) {
      console.error('Failed to load competitor intelligence:', error);
    }
  };

  const initializePsychologyEngine = () => {
    // UNFAIR ADVANTAGE: Behavioral psychology patterns
    clientAnalysisRef.current = {
      personality_type: 'unknown',
      decision_style: 'unknown',
      pressure_points: [],
      motivation_factors: [],
      trust_level: 0
    };
  };

  const setupMarketDominance = () => {
    // UNFAIR ADVANTAGE: Market domination algorithms
    responseEngineRef.current = {
      closing_techniques: [],
      objection_breakers: [],
      urgency_creators: [],
      value_amplifiers: []
    };
  };

  const startClientAnalysis = () => {
    if (clientAudioRef.current) {
      console.log('🎯 Client-focused whisper system activated');
      console.log('🚀 UNFAIR ADVANTAGE MODE ENABLED');
    }
  };

  const cleanup = () => {
    if (clientAudioRef.current) {
      clientAudioRef.current.disconnect();
    }
    if (speakerSeparationRef.current) {
      speakerSeparationRef.current.clientChannel?.disconnect();
      speakerSeparationRef.current.agentChannel?.disconnect();
    }
  };

  const applyResponse = (response) => {
    navigator.clipboard.writeText(response.text);
    
    // Log successful response usage for ML improvement
    fetch('/api/ai/response-success', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response: response,
        context: {
          client_speech: clientSpeech,
          emotion: clientEmotion,
          urgency: urgencyLevel
        }
      })
    });
  };

  return (
    <div className="bg-gradient-to-r from-red-900 to-black text-white rounded-xl shadow-2xl border-4 border-red-500 overflow-hidden">
      {/* UNFAIR ADVANTAGE Header */}
      <div className="bg-black bg-opacity-50 p-4 border-b border-red-500">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center">
            <span className="mr-2">🎯</span>
            CLIENT DOMINATION SYSTEM
            <span className="ml-3 text-xs bg-red-500 px-3 py-1 rounded-full animate-pulse">
              UNFAIR ADVANTAGE ACTIVE
            </span>
          </h3>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="bg-red-500 bg-opacity-30 px-3 py-1 rounded">
              Urgency: {urgencyLevel}/10
            </div>
            <div className="bg-green-500 bg-opacity-30 px-3 py-1 rounded">
              Buying Signals: {buyingSignals.length}
            </div>
            <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Client Speech Analysis */}
        <div className="bg-black bg-opacity-30 rounded-lg p-4">
          <h4 className="font-bold text-red-400 mb-3 flex items-center">
            <span className="mr-2">🎤</span>
            CLIENT SPEECH ANALYSIS
          </h4>
          <div className="text-gray-100 leading-relaxed min-h-20">
            {clientSpeech || 'Listening for client speech only...'}
          </div>
          
          {clientEmotion.detected_emotion && (
            <div className="mt-3 flex items-center space-x-4">
              <div className={`px-3 py-1 rounded text-sm font-bold ${
                clientEmotion.detected_emotion === 'enthusiasm' ? 'bg-green-500' :
                clientEmotion.detected_emotion === 'anxiety' ? 'bg-yellow-500' :
                clientEmotion.detected_emotion === 'frustration' ? 'bg-red-500' :
                'bg-blue-500'
              }`}>
                Emotion: {clientEmotion.detected_emotion} ({(clientEmotion.confidence * 100).toFixed(0)}%)
              </div>
              <div className="text-sm text-gray-300">
                Strategy: {clientEmotion.response_strategy}
              </div>
            </div>
          )}
        </div>

        {/* UNFAIR ADVANTAGE: Real-time Response Engine */}
        {realTimeResponses.length > 0 && (
          <div className="bg-red-900 bg-opacity-50 rounded-lg p-4 border-2 border-red-400">
            <h4 className="font-bold text-red-300 mb-3 flex items-center">
              <span className="mr-2">⚡</span>
              INSTANT RESPONSE ENGINE
              <span className="ml-3 text-xs bg-red-400 text-black px-2 py-1 rounded">
                COMPETITIVE ADVANTAGE
              </span>
            </h4>
            
            <div className="space-y-3">
              {realTimeResponses.slice(0, 2).map((response, index) => (
                <div key={index} className="bg-black bg-opacity-40 rounded-lg p-4 border border-red-300">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          response.priority === 'critical' ? 'bg-red-500' :
                          response.priority === 'high' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}>
                          {response.type?.toUpperCase()} • {response.priority?.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400">
                          {(response.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                      <div className="text-gray-100">
                        {response.text}
                      </div>
                    </div>
                    <button
                      onClick={() => applyResponse(response)}
                      className="ml-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition-colors"
                    >
                      USE NOW
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buying Signals Detection */}
        {buyingSignals.length > 0 && (
          <div className="bg-green-900 bg-opacity-50 rounded-lg p-4 border-2 border-green-400">
            <h4 className="font-bold text-green-300 mb-3 flex items-center">
              <span className="mr-2">💰</span>
              BUYING SIGNALS DETECTED
              <span className="ml-3 text-xs bg-green-400 text-black px-2 py-1 rounded animate-bounce">
                CLOSE NOW!
              </span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {buyingSignals.slice(-4).map((signal, index) => (
                <div key={index} className="bg-black bg-opacity-40 p-3 rounded border border-green-300">
                  <div className="font-bold text-green-300">
                    Action: {signal.action.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-300 mt-1">
                    Confidence: {(signal.confidence * 100).toFixed(0)}% • {signal.urgency}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Objection Handling */}
        {objectionHandling.length > 0 && (
          <div className="bg-yellow-900 bg-opacity-50 rounded-lg p-4 border-2 border-yellow-400">
            <h4 className="font-bold text-yellow-300 mb-3 flex items-center">
              <span className="mr-2">🛡️</span>
              OBJECTION BREAKERS
            </h4>
            
            <div className="space-y-3">
              {objectionHandling.slice(-2).map((objection, index) => (
                <div key={index} className="bg-black bg-opacity-40 p-4 rounded border border-yellow-300">
                  <div className="font-bold text-yellow-300 mb-2">
                    {objection.type.replace(/_/g, ' ').toUpperCase()} OBJECTION
                  </div>
                  <div className="text-gray-100 italic">
                    "{objection.script}"
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(objection.script)}
                    className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded font-bold"
                  >
                    COPY SCRIPT
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Competitive Intelligence */}
        {competitiveIntel.competitors_mentioned?.length > 0 && (
          <div className="bg-purple-900 bg-opacity-50 rounded-lg p-4 border-2 border-purple-400">
            <h4 className="font-bold text-purple-300 mb-3 flex items-center">
              <span className="mr-2">🕵️</span>
              COMPETITIVE INTELLIGENCE
              <span className="ml-3 text-xs bg-purple-400 text-black px-2 py-1 rounded">
                DESTROY COMPETITION
              </span>
            </h4>
            
            <div className="space-y-3">
              {competitiveIntel.competitors_mentioned.map((competitor, index) => (
                <div key={index} className="bg-black bg-opacity-40 p-4 rounded border border-purple-300">
                  <div className="font-bold text-purple-300 mb-2">
                    {competitor.name.toUpperCase()} MENTIONED
                  </div>
                  <div className="text-sm mb-2">
                    <span className="text-red-300">Weakness:</span> {competitor.weakness} •{' '}
                    <span className="text-green-300">Strength:</span> {competitor.strength}
                  </div>
                  <div className="text-gray-100 italic text-sm">
                    "{competitor.counter_strategy?.replace('[competitor]', competitor.name)}"
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}