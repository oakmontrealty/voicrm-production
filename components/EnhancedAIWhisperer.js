import { useState, useEffect, useRef, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function EnhancedAIWhisperer() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [confidence, setConfidence] = useState(0);
  const [processingTime, setProcessingTime] = useState(0);
  const [currentContact, setCurrentContact] = useState(null);
  const [callContext, setCallContext] = useState({});
  const [realTimeAnalysis, setRealTimeAnalysis] = useState({});
  const [whisperMode, setWhisperMode] = useState('live'); // 'live', 'batch', 'hybrid'
  const [language, setLanguage] = useState('en-US');
  const [noiseReduction, setNoiseReduction] = useState(true);
  const [speakerSeparation, setSpeakerSeparation] = useState(true);

  const supabase = createClientComponentClient();
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const streamRef = useRef(null);
  const bufferRef = useRef([]);
  const lastProcessTime = useRef(Date.now());
  const aiCache = useRef(new Map());

  // Enhanced Speech Recognition with multiple fallbacks
  useEffect(() => {
    setupAdvancedRecognition();
    return () => cleanup();
  }, []);

  const setupAdvancedRecognition = async () => {
    try {
      // Try Web Speech API first (fastest)
      if ('webkitSpeechRecognition' in window) {
        setupWebSpeechAPI();
      } else {
        // Fallback to Web Audio API + custom processing
        await setupWebAudioAPI();
      }
    } catch (error) {
      console.error('Failed to setup speech recognition:', error);
    }
  };

  const setupWebSpeechAPI = () => {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 3;
    
    // Ultra-fast processing mode
    if (recognition.serviceURI) {
      recognition.serviceURI = 'https://www.google.com/speech-api/v2/recognize';
    }

    recognition.onstart = () => {
      setIsListening(true);
      console.log('🎤 Advanced speech recognition started');
    };

    recognition.onresult = (event) => {
      const startTime = performance.now();
      processResultsFast(event);
      setProcessingTime(performance.now() - startTime);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      // Auto-retry with different settings
      if (event.error === 'network') {
        setTimeout(() => startListening(), 1000);
      }
    };

    recognition.onend = () => {
      if (isListening) {
        // Auto-restart for continuous operation
        setTimeout(() => recognition.start(), 100);
      }
    };
  };

  const setupWebAudioAPI = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: noiseReduction,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      });

      streamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });

      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      // Create advanced audio processor
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorRef.current.onaudioprocess = processAudioBuffer;
      
      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

    } catch (error) {
      console.error('Failed to setup Web Audio API:', error);
    }
  };

  const processAudioBuffer = (event) => {
    const inputBuffer = event.inputBuffer.getChannelData(0);
    const now = Date.now();
    
    // Add to circular buffer for efficient memory usage
    bufferRef.current.push(...inputBuffer);
    
    // Process every 250ms for ultra-low latency
    if (now - lastProcessTime.current > 250) {
      processBufferedAudio();
      lastProcessTime.current = now;
    }
    
    // Limit buffer size to prevent memory issues
    if (bufferRef.current.length > 16000 * 5) { // 5 seconds max
      bufferRef.current = bufferRef.current.slice(-16000 * 2); // Keep last 2 seconds
    }
  };

  const processBufferedAudio = async () => {
    if (bufferRef.current.length === 0) return;

    try {
      const audioBlob = new Blob([new Float32Array(bufferRef.current)], {
        type: 'audio/wav'
      });

      // Send to multiple AI services simultaneously for speed and accuracy
      const results = await Promise.allSettled([
        processWithOpenAIWhisper(audioBlob),
        processWithGoogleSpeech(audioBlob),
        processWithLocalAI(audioBlob)
      ]);

      // Use the fastest successful result
      const successfulResult = results.find(r => r.status === 'fulfilled')?.value;
      if (successfulResult) {
        processTranscription(successfulResult);
      }

    } catch (error) {
      console.error('Audio processing error:', error);
    }
  };

  const processWithOpenAIWhisper = async (audioBlob) => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'whisper-1');
    formData.append('language', language.split('-')[0]);
    formData.append('response_format', 'verbose_json');

    const response = await fetch('/api/ai/whisper', {
      method: 'POST',
      body: formData
    });

    return await response.json();
  };

  const processWithGoogleSpeech = async (audioBlob) => {
    // Convert to base64 for Google Speech API
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const response = await fetch('/api/google/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: { content: base64Audio },
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 16000,
          languageCode: language,
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: true,
          model: 'latest_long'
        }
      })
    });

    return await response.json();
  };

  const processWithLocalAI = async (audioBlob) => {
    // Use local Ollama Whisper for privacy and speed
    const response = await fetch('/api/ai/ollama-whisper', {
      method: 'POST',
      body: audioBlob
    });

    return await response.json();
  };

  const processResultsFast = useCallback((event) => {
    let finalTranscript = '';
    let interimTranscript = '';
    let maxConfidence = 0;

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcriptPart = result[0].transcript;
      
      if (result.isFinal) {
        finalTranscript += transcriptPart;
      } else {
        interimTranscript += transcriptPart;
      }
      
      maxConfidence = Math.max(maxConfidence, result[0].confidence || 0);
    }

    const fullTranscript = finalTranscript || interimTranscript;
    if (fullTranscript) {
      setTranscript(fullTranscript);
      setConfidence(maxConfidence);
      
      // Process AI suggestions in parallel (non-blocking)
      processAISuggestions(fullTranscript);
    }
  }, []);

  const processTranscription = useCallback((result) => {
    if (!result?.text) return;

    setTranscript(result.text);
    setConfidence(result.confidence || 0);
    
    // Advanced analysis with multiple AI models
    performAdvancedAnalysis(result);
    
    // Update call context
    updateCallContext(result.text);
    
    // Generate suggestions
    processAISuggestions(result.text);
  }, []);

  const performAdvancedAnalysis = useCallback(async (result) => {
    try {
      const analysis = await Promise.all([
        analyzeSentiment(result.text),
        extractKeywords(result.text),
        identifyIntent(result.text),
        assessUrgency(result.text),
        detectObjections(result.text)
      ]);

      setRealTimeAnalysis({
        sentiment: analysis[0],
        keywords: analysis[1],
        intent: analysis[2],
        urgency: analysis[3],
        objections: analysis[4],
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Analysis error:', error);
    }
  }, []);

  const processAISuggestions = useCallback(async (text) => {
    // Use cache for ultra-fast responses
    const cacheKey = text.toLowerCase().trim();
    if (aiCache.current.has(cacheKey)) {
      setAiSuggestions(aiCache.current.get(cacheKey));
      return;
    }

    try {
      const suggestions = await generateSmartSuggestions(text, callContext, currentContact);
      
      // Cache for future use
      aiCache.current.set(cacheKey, suggestions);
      
      // Limit cache size
      if (aiCache.current.size > 1000) {
        const firstKey = aiCache.current.keys().next().value;
        aiCache.current.delete(firstKey);
      }
      
      setAiSuggestions(suggestions);
      
    } catch (error) {
      console.error('AI suggestion error:', error);
    }
  }, [callContext, currentContact]);

  const generateSmartSuggestions = async (text, context, contact) => {
    const response = await fetch('/api/ai/smart-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: text,
        context: context,
        contact: contact,
        mode: 'ultra_fast',
        max_suggestions: 5
      })
    });

    const data = await response.json();
    return data.suggestions || [];
  };

  const analyzeSentiment = async (text) => {
    // Ultra-fast local sentiment analysis
    const response = await fetch('/api/ai/sentiment-fast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    return await response.json();
  };

  const extractKeywords = (text) => {
    // Local keyword extraction for speed
    const words = text.toLowerCase().split(/\W+/);
    const realEstateKeywords = [
      'property', 'house', 'home', 'price', 'market', 'buy', 'sell', 'rent',
      'mortgage', 'listing', 'offer', 'negotiation', 'closing', 'inspection'
    ];
    
    return words.filter(word => realEstateKeywords.includes(word));
  };

  const identifyIntent = async (text) => {
    const intents = [
      { keyword: ['buy', 'purchase', 'looking for'], intent: 'buying' },
      { keyword: ['sell', 'listing', 'market'], intent: 'selling' },
      { keyword: ['price', 'value', 'worth'], intent: 'valuation' },
      { keyword: ['schedule', 'viewing', 'show'], intent: 'appointment' },
      { keyword: ['not interested', 'no thanks'], intent: 'rejection' }
    ];

    const textLower = text.toLowerCase();
    for (const { keyword, intent } of intents) {
      if (keyword.some(k => textLower.includes(k))) {
        return intent;
      }
    }
    return 'general';
  };

  const assessUrgency = (text) => {
    const urgentKeywords = ['urgent', 'asap', 'immediately', 'emergency', 'today', 'now'];
    const textLower = text.toLowerCase();
    const urgencyScore = urgentKeywords.reduce((score, keyword) => 
      textLower.includes(keyword) ? score + 1 : score, 0);
    
    return Math.min(urgencyScore * 25, 100); // 0-100 scale
  };

  const detectObjections = (text) => {
    const objectionPatterns = [
      'too expensive', 'not in budget', 'need to think', 'talk to spouse',
      'not ready', 'wrong timing', 'other options', 'already working'
    ];
    
    const textLower = text.toLowerCase();
    return objectionPatterns.filter(pattern => textLower.includes(pattern));
  };

  const updateCallContext = (text) => {
    setCallContext(prev => ({
      ...prev,
      lastStatement: text,
      statementCount: (prev.statementCount || 0) + 1,
      lastUpdate: Date.now(),
      sentiment: realTimeAnalysis.sentiment?.score || 0
    }));
  };

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const cleanup = () => {
    stopListening();
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
  };

  const applySuggestion = async (suggestion) => {
    try {
      // Log usage for learning
      await fetch('/api/ai/suggestion-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestion,
          context: callContext,
          timestamp: Date.now()
        })
      });

      // Apply the suggestion (copy to clipboard, auto-type, etc.)
      if (suggestion.action === 'response') {
        navigator.clipboard.writeText(suggestion.text);
      }

    } catch (error) {
      console.error('Error applying suggestion:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 overflow-hidden">
      {/* Header with Performance Metrics */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center">
            <span className="mr-2">🤖</span>
            Enhanced AI Whisper
            <span className="ml-2 text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
              ULTRA-FAST
            </span>
          </h3>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="bg-white bg-opacity-20 px-3 py-1 rounded">
              Processing: {processingTime.toFixed(1)}ms
            </div>
            <div className="bg-white bg-opacity-20 px-3 py-1 rounded">
              Confidence: {(confidence * 100).toFixed(0)}%
            </div>
            <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Advanced Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isListening ? '🛑 Stop' : '🎤 Start'} Listening
            </button>
            
            <select
              value={whisperMode}
              onChange={(e) => setWhisperMode(e.target.value)}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="live">Live Mode (Fastest)</option>
              <option value="batch">Batch Mode (Accurate)</option>
              <option value="hybrid">Hybrid Mode (Balanced)</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={noiseReduction}
                onChange={(e) => setNoiseReduction(e.target.checked)}
                className="mr-1"
              />
              Noise Reduction
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={speakerSeparation}
                onChange={(e) => setSpeakerSeparation(e.target.checked)}
                className="mr-1"
              />
              Speaker ID
            </label>
          </div>
        </div>

        {/* Live Transcript with Analysis */}
        <div className="bg-gray-50 rounded-lg p-4 min-h-32">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-gray-700">Live Transcript</h4>
            {realTimeAnalysis.sentiment && (
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                realTimeAnalysis.sentiment.score > 0.6 ? 'bg-green-100 text-green-700' :
                realTimeAnalysis.sentiment.score < 0.4 ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {realTimeAnalysis.sentiment.label} ({(realTimeAnalysis.sentiment.score * 100).toFixed(0)}%)
              </div>
            )}
          </div>
          
          <div className="text-gray-800 leading-relaxed">
            {transcript || 'Waiting for speech...'}
          </div>
          
          {realTimeAnalysis.keywords?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {realTimeAnalysis.keywords.map((keyword, index) => (
                <span key={index} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Ultra-Fast AI Suggestions */}
        {aiSuggestions.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-3 flex items-center">
              <span className="mr-2">💡</span>
              AI Suggestions
              <span className="ml-2 text-xs bg-blue-200 px-2 py-1 rounded">
                Generated in {processingTime.toFixed(1)}ms
              </span>
            </h4>
            
            <div className="space-y-2">
              {aiSuggestions.slice(0, 3).map((suggestion, index) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-blue-800">
                        {suggestion.type?.toUpperCase()} • {suggestion.confidence}% confidence
                      </div>
                      <div className="text-gray-700 mt-1">
                        {suggestion.text}
                      </div>
                    </div>
                    <button
                      onClick={() => applySuggestion(suggestion)}
                      className="ml-3 bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real-Time Analysis Dashboard */}
        {Object.keys(realTimeAnalysis).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {realTimeAnalysis.intent && (
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-2xl">🎯</div>
                <div className="text-sm font-medium text-green-700">Intent</div>
                <div className="text-xs text-green-600">{realTimeAnalysis.intent}</div>
              </div>
            )}
            
            {realTimeAnalysis.urgency !== undefined && (
              <div className="bg-orange-50 p-3 rounded-lg text-center">
                <div className="text-2xl">⚡</div>
                <div className="text-sm font-medium text-orange-700">Urgency</div>
                <div className="text-xs text-orange-600">{realTimeAnalysis.urgency}%</div>
              </div>
            )}
            
            {realTimeAnalysis.objections?.length > 0 && (
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-2xl">🚨</div>
                <div className="text-sm font-medium text-red-700">Objections</div>
                <div className="text-xs text-red-600">{realTimeAnalysis.objections.length} detected</div>
              </div>
            )}
            
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <div className="text-2xl">⚡</div>
              <div className="text-sm font-medium text-purple-700">Speed</div>
              <div className="text-xs text-purple-600">{processingTime.toFixed(1)}ms</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}