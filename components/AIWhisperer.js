import { useState, useEffect, useRef } from 'react';
import { SparklesIcon, MicrophoneIcon, SpeakerWaveIcon } from '@heroicons/react/24/solid';

export default function AIWhisperer({ isCallActive, onSuggestionSelect }) {
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [aiResponse, setAiResponse] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (isCallActive) {
      // Clear previous call transcript when starting new call
      sessionStorage.removeItem('call_transcript');
      setCurrentTranscript('');
      
      startListening();
      
      // Set up periodic suggestion refresh every 30 seconds to keep AI active
      const suggestionInterval = setInterval(() => {
        if (currentTranscript && currentTranscript.trim()) {
          console.log('Refreshing AI suggestions...');
          generateAISuggestions(currentTranscript.trim());
        }
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(suggestionInterval);
    } else {
      stopListening();
      setCurrentTranscript('');
      setSuggestions([]);
      setAiResponse('');
    }
  }, [isCallActive]);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const fullTranscript = finalTranscript || interimTranscript;
      
      // Keep building conversation context
      if (finalTranscript && finalTranscript.trim()) {
        setCurrentTranscript(prev => {
          const newContext = prev + ' ' + finalTranscript;
          // Store transcript for summary generation
          sessionStorage.setItem('call_transcript', newContext.trim());
          // Generate suggestions immediately when client finishes speaking
          generateAISuggestions(newContext.trim());
          return newContext;
        });
      } else {
        // Show interim results (what they're currently saying)
        setCurrentTranscript(prev => {
          const contextParts = prev.split(' ');
          const contextHistory = contextParts.slice(0, -10).join(' '); // Keep context history
          const currentFull = contextHistory + ' ' + fullTranscript;
          // Store even interim results for better summaries
          sessionStorage.setItem('call_transcript', currentFull.trim());
          return currentFull;
        });
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      // Restart recognition automatically to keep listening
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        console.log('Restarting speech recognition...');
        setTimeout(() => {
          if (recognitionRef.current && isCallActive) {
            recognitionRef.current.start();
          }
        }, 100);
      }
    };
    
    recognitionRef.current.onend = () => {
      console.log('Speech recognition ended, restarting...');
      // Automatically restart if call is still active
      if (isCallActive) {
        setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start();
              console.log('Speech recognition restarted');
            } catch (e) {
              console.log('Already listening');
            }
          }
        }, 100);
      }
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const generateAISuggestions = async (transcript) => {
    setIsThinking(true);
    
    try {
      const response = await fetch('/api/ai/generate-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.suggestions || []);
        setAiResponse(data.response || '');
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
      // Fallback suggestions for demo
      setSuggestions([
        "Ask about their budget range",
        "Inquire about preferred location", 
        "Discuss property features they want",
        "Schedule a viewing appointment"
      ]);
      setAiResponse("I'm analyzing the conversation to provide helpful suggestions...");
    }
    
    setIsThinking(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-[#B28354]/20 h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#636B56] to-[#864936] p-4 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <SparklesIcon className="h-6 w-6 text-white" />
          <h3 className="text-white font-bold text-lg" style={{ fontFamily: 'Forum, serif' }}>
            AI Whisperer
          </h3>
          {isListening && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <MicrophoneIcon className="h-4 w-4 text-white animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {!isCallActive ? (
          <div className="text-center text-gray-500 py-8">
            <SparklesIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Start a call to see AI suggestions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Transcript */}
            {currentTranscript && (
              <div className="bg-[#F8F2E7] p-3 rounded-lg border border-[#B28354]/20">
                <div className="flex items-center gap-2 mb-2">
                  <SpeakerWaveIcon className="h-4 w-4 text-[#636B56]" />
                  <span className="text-xs text-[#636B56] font-semibold">CLIENT SPEAKING</span>
                  {isListening && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
                </div>
                <p className="text-sm text-[#636B56] italic" data-transcript="true">"{currentTranscript}"</p>
              </div>
            )}

            {/* AI Response */}
            {aiResponse && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <SparklesIcon className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-blue-600 font-semibold">AI INSIGHT</span>
                </div>
                <p className="text-sm text-blue-700">{aiResponse}</p>
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#636B56] uppercase tracking-wide">
                  Suggested Responses
                </h4>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => onSuggestionSelect?.(suggestion)}
                    className="w-full text-left p-3 bg-gradient-to-r from-[#F8F2E7] to-[#F5EDE2] hover:from-[#636B56] hover:to-[#864936] text-[#636B56] hover:text-white rounded-lg border border-[#B28354]/20 hover:border-[#864936] transition-all transform hover:scale-102 shadow-sm hover:shadow-md text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Thinking Indicator */}
            {isThinking && (
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 text-[#636B56]">
                  <SparklesIcon className="h-4 w-4 animate-pulse" />
                  <span className="text-sm">AI is thinking...</span>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-[#636B56] rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-[#636B56] rounded-full animate-bounce delay-100"></div>
                    <div className="w-1 h-1 bg-[#636B56] rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-50 rounded-b-2xl border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isCallActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className="text-xs text-gray-500">
              {isCallActive ? 'Active' : 'Standby'}
            </span>
          </div>
          {isListening && (
            <span className="text-xs text-red-500 font-medium">Recording</span>
          )}
        </div>
      </div>
    </div>
  );
}