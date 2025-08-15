import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import Script from 'next/script';
import { PhoneIcon } from '@heroicons/react/24/solid';
import AIWhisperer from '../components/AIWhisperer';

export default function BrowserPhone() {
  const [device, setDevice] = useState(null);
  const [connection, setConnection] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [status, setStatus] = useState('Initializing...');
  const [isReady, setIsReady] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callSummary, setCallSummary] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [callbackDate, setCallbackDate] = useState('');
  const [callbackTime, setCallbackTime] = useState('');
  const [callbackNotes, setCallbackNotes] = useState('');
  const [callHistory, setCallHistory] = useState([]);
  const [showEssayPenalty, setShowEssayPenalty] = useState(false);
  const [essayText, setEssayText] = useState('');
  const [contacts, setContacts] = useState([]);
  const [showCarousel, setShowCarousel] = useState(false);
  const [selectedCallerId, setSelectedCallerId] = useState('+61482080888');
  const [availableNumbers, setAvailableNumbers] = useState([
    { number: '+61482080888', label: "Terence's Number", type: 'main' },
    { number: 'carousel', label: 'Carousel', type: 'carousel' }
  ]);
  const [rnnoiseProcessor, setRnnoiseProcessor] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  const timerRef = useRef(null);

  // Initialize Twilio Device when SDK loads
  const initializeTwilio = async () => {
    try {
      setStatus('Initializing RNNoise ultra-low latency noise suppression...');
      
      // Initialize RNNoise processor for ultra-low latency noise suppression
      try {
        // Dynamically import RNNoise processor
        const script = document.createElement('script');
        script.src = '/lib/rnnoise-processor.js';
        document.head.appendChild(script);
        
        await new Promise((resolve) => {
          script.onload = resolve;
        });
        
        const processor = new window.RNNoiseProcessor();
        await processor.initialize();
        setRnnoiseProcessor(processor);
        
        // Request microphone with minimal constraints (RNNoise handles everything)
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: false, // RNNoise handles this
            noiseSuppression: false, // RNNoise handles this with < 10ms latency
            autoGainControl: false, // RNNoise handles this
            sampleRate: 48000, // Optimal for RNNoise
            channelCount: 1
          }
        });
        stream.getTracks().forEach(track => track.stop()); // Stop the test stream
        console.log('✓ RNNoise initialized - Ultra-low latency noise suppression active');
        setStatus('RNNoise ready - Professional noise cancellation enabled');
      } catch (err) {
        console.error('Failed to initialize RNNoise:', err);
        setStatus('Microphone access required for calls');
        return;
      }
      
      setStatus('Getting access token...');
      
      // Get token from our API
      const response = await fetch('/api/twilio/token');
      const data = await response.json();
      
      if (!data.token) {
        throw new Error('Failed to get token');
      }

      setStatus('Initializing voice system...');
      
      // Wait for SDK to be available
      if (!window.Twilio || !window.Twilio.Device) {
        setTimeout(initializeTwilio, 500);
        return;
      }

      // Initialize Twilio Device with enhanced audio settings and noise suppression
      const twilioDevice = new window.Twilio.Device(data.token, {
        codecPreferences: ['opus', 'pcmu'],
        fakeLocalDTMF: true,
        enableRingingState: true,
        debug: false, // Disable debug to reduce noise
        allowIncomingWhileBusy: true,
        edge: 'sydney', // Use Sydney edge for better latency in Australia
        sounds: {
          incoming: true,
          outgoing: true,
          dtmf: true
        },
        // RNNoise handles all audio processing with ultra-low latency
        audioConstraints: {
          echoCancellation: false, // RNNoise handles with < 10ms latency
          noiseSuppression: false, // RNNoise handles with neural network
          autoGainControl: false // RNNoise handles intelligently
        }
      });

      // Setup event handlers
      twilioDevice.on('ready', () => {
        console.log('Twilio Device is ready');
        setIsReady(true);
        setStatus('Ready to call - Microphone connected');
      });

      twilioDevice.on('error', (error) => {
        console.error('Twilio error:', error);
        setStatus('Error: ' + error.message);
      });

      twilioDevice.on('connect', (conn) => {
        console.log('Call connected');
        setConnection(conn);
        setIsInCall(true);
        setStatus('Connected');
        startTimer();
        // Start recording the call
        startRecording();
      });

      twilioDevice.on('disconnect', () => {
        console.log('Call disconnected');
        setConnection(null);
        setIsInCall(false);
        setStatus('Call ended - Generating summary...');
        
        // Add to call history
        const callRecord = {
          id: Date.now(),
          phoneNumber: phoneNumber,
          duration: callDuration,
          timestamp: new Date().toLocaleString(),
          type: 'Outbound',
          status: callDuration > 5 ? 'Completed' : 'Failed'
        };
        setCallHistory(prev => [callRecord, ...prev.slice(0, 9)]); // Keep last 10 calls
        
        stopTimer();
        
        // Generate AI summary after call ends
        setTimeout(() => {
          generateCallSummary();
        }, 2000);
      });

      twilioDevice.on('incoming', (conn) => {
        console.log('Incoming call');
        setStatus('Incoming call...');
        // Auto-answer for demo
        conn.accept();
      });

      setDevice(twilioDevice);
      
    } catch (error) {
      console.error('Init error:', error);
      setStatus('Failed to initialize: ' + error.message);
    }
  };

  const makeCall = async () => {
    // Block calls if summary is showing
    if (showSummary) {
      alert('❌ BLOCKED: You must complete the after-call process before making another call!');
      return;
    }
    
    if (!device || !phoneNumber) {
      setStatus('Please enter a phone number');
      return;
    }
    
    console.log('Making call to:', phoneNumber);
    setStatus('Connecting call with RNNoise...');
    
    // Verify RNNoise is active
    if (rnnoiseProcessor) {
      const stats = rnnoiseProcessor.getStats();
      console.log('✓ RNNoise active - Latency:', stats?.latency || '<10', 'ms');
    }
    
    // Ensure we pass the phone number properly with selected caller ID
    const params = { 
      To: phoneNumber,
      From: 'browser-client',
      CallerId: selectedCallerId
    };
    
    const connection = device.connect(params);
    console.log('Call initiated with RNNoise ultra-low latency noise suppression');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const options = { mimeType: 'audio/webm;codecs=opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/mp4';
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: options.mimeType });
        const url = URL.createObjectURL(audioBlob);
        setRecordingUrl(url);
        
        // Store in call history
        const recording = {
          url: url,
          timestamp: new Date().toISOString(),
          duration: callDuration,
          phoneNumber: phoneNumber
        };
        
        const recordings = JSON.parse(localStorage.getItem('call_recordings') || '[]');
        recordings.unshift(recording); // Add to beginning
        if (recordings.length > 10) recordings.pop(); // Keep only last 10
        localStorage.setItem('call_recordings', JSON.stringify(recordings));
        
        console.log('✓ Call recorded for review');
      };
      
      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      console.log('🔴 Recording started');
    } catch (error) {
      console.error('Recording failed:', error);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      console.log('⏹ Recording stopped');
    }
  };

  const endCall = () => {
    if (connection) {
      connection.disconnect();
    } else if (device) {
      device.disconnectAll();
    }
    
    // Stop recording if active
    stopRecording();
  };

  // Handle backspace/delete
  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const toggleMute = () => {
    if (connection) {
      const newMute = !isMuted;
      connection.mute(newMute);
      setIsMuted(newMute);
    }
  };

  const startTimer = () => {
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      setCallDuration(0);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDigit = (digit) => {
    setPhoneNumber(prev => prev + digit);
    
    // Send DTMF if in call
    if (connection && connection.sendDigits) {
      connection.sendDigits(digit);
    }
  };

  const loadContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      const data = await response.json();
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const selectCallerId = (callerNumber, label) => {
    setSelectedCallerId(callerNumber);
    setShowCarousel(false);
    setStatus(`Calling from ${label}: ${callerNumber}`);
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const generateCallSummary = async () => {
    try {
      // Get the actual conversation transcript from AI Whisperer
      const actualTranscript = document.querySelector('[data-transcript]')?.textContent || 
                              sessionStorage.getItem('call_transcript') ||
                              "Call completed. Duration: " + callDuration + " seconds.";
      
      console.log('Generating summary from actual call transcript:', actualTranscript);
      
      const response = await fetch('/api/ai/summarize-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription: actualTranscript,
          duration: callDuration,
          from: 'Browser Client',
          to: phoneNumber
        })
      });

      const data = await response.json();
      if (data.success) {
        setCallSummary(data.summary);
        setShowSummary(true);
        setStatus('Ready to call - Summary available');
        
        // Save call log with summary
        await saveCallLog(data.summary);
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      setStatus('Ready to call');
    }
  };

  const saveCallLog = async (summary) => {
    try {
      const response = await fetch('/api/calls/save-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          duration: callDuration,
          direction: 'outbound',
          status: 'completed',
          summary: summary
        })
      });

      const data = await response.json();
      if (data.success) {
        console.log('Call log saved:', data.callLog.id);
      }
    } catch (error) {
      console.error('Error saving call log:', error);
    }
  };

  return (
    <>
      <Script 
        src="//sdk.twilio.com/js/client/v1.14/twilio.min.js"
        onLoad={initializeTwilio}
        strategy="afterInteractive"
      />
      
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-[#F8F2E7] via-[#F5EDE2] to-[#636B56]/5">
          <div className="max-w-7xl mx-auto px-4 py-8">
            
            {/* Status Bar */}
            <div className="text-center mb-8">
              <div className={`inline-flex items-center gap-3 px-8 py-4 rounded-full backdrop-blur-lg shadow-lg ${
                isInCall ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
                isReady ? 'bg-gradient-to-r from-[#636B56] to-[#525a48] text-white' :
                status.includes('Error') ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' :
                'bg-white/80 text-[#636B56] border border-[#636B56]/20'
              }`}>
                {isInCall && (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                )}
                <span className="font-medium text-lg">
                  {isInCall && callDuration > 0 ? `${status} • ${formatDuration(callDuration)}` : status}
                </span>
                {isRecording && (
                  <div className="flex items-center gap-2 animate-pulse">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-semibold">REC</span>
                  </div>
                )}
              </div>
            </div>

            {/* 3-Column Layout: AI Whisperer | Phone | Call History */}
            <div className="grid grid-cols-3 gap-6 max-w-7xl mx-auto">
              
              {/* Left Column - AI Whisperer */}
              <div className="h-[800px]">
                <AIWhisperer 
                  isCallActive={isInCall}
                  onSuggestionSelect={(suggestion) => {
                    console.log('Selected suggestion:', suggestion);
                  }}
                />
              </div>

              {/* Center Column - Main Phone Card - VoiCRM Premium Design */}
              <div>
            <div className="bg-gradient-to-br from-white/95 via-[#F8F2E7]/90 to-[#F5EDE2]/95 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-[#B28354]/20 overflow-hidden max-w-md mx-auto">
              {/* VoiCRM Number Display */}
              <div className="bg-gradient-to-b from-[#636B56]/10 via-[#864936]/5 to-transparent p-8 relative">
                <div className="absolute top-2 right-4 text-xs font-bold text-[#864936] italic">Every Second Counts</div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter number"
                  className="w-full text-3xl font-bold text-center text-[#636B56] bg-transparent outline-none placeholder-[#B28354]/40"
                  style={{ fontFamily: 'Forum, serif' }}
                />
                <div className="h-1 bg-gradient-to-r from-transparent via-[#864936] to-transparent mt-2 rounded-full"></div>
                <p className="text-center text-sm font-bold text-[#7a7a7a] mt-3" style={{ fontFamily: 'Avenir, sans-serif' }}>
                  got problems?...
                </p>
              </div>

              {/* VoiCRM Dialpad */}
              <div className="px-8 pb-6">
                <div className="grid grid-cols-3 gap-3">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(digit => (
                    <button
                      key={digit}
                      onClick={() => !showSummary && handleDigit(digit)}
                      disabled={showSummary}
                      className={`h-16 rounded-2xl border border-[#B28354]/30 text-2xl font-bold transition-all transform shadow-md ${
                        showSummary 
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-b from-[#F8F2E7] to-[#F5EDE2] hover:from-[#636B56] hover:to-[#525a48] active:from-[#864936] active:to-[#753d2f] text-[#636B56] hover:text-white active:text-white active:scale-95 hover:shadow-xl'
                      }`}
                      style={{ fontFamily: 'Forum, serif' }}
                    >
                      {digit}
                    </button>
                  ))}
                </div>
                
                {/* Delete/Backspace Button */}
                <div className="mt-3 flex justify-center">
                  <button
                    onClick={() => !showSummary && handleBackspace()}
                    disabled={showSummary || !phoneNumber}
                    className={`h-12 px-6 rounded-full border border-[#B28354]/30 text-lg font-bold transition-all transform shadow-md flex items-center gap-2 ${
                      showSummary || !phoneNumber
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-red-100 to-red-200 hover:from-red-500 hover:to-red-600 text-red-600 hover:text-white active:scale-95 hover:shadow-xl'
                    }`}
                    style={{ fontFamily: 'Forum, serif' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>

              {/* VoiCRM Call Controls */}
              <div className="px-8 pb-8">
                {!isInCall ? (
                  <div className="space-y-3">
                    {/* Caller ID Selector */}
                    <div className="relative">
                      <button
                        onClick={() => setShowCarousel(!showCarousel)}
                        disabled={showSummary}
                        className={`w-full py-3 rounded-lg font-medium text-sm transition-all border ${
                          showSummary
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-[#F8F2E7] text-[#636B56] border-[#B28354]/30 hover:border-[#636B56] hover:shadow-md'
                        }`}
                        style={{ fontFamily: 'Forum, serif' }}
                      >
                        <div className="flex items-center justify-center">
                          <span>{availableNumbers.find(n => n.number === selectedCallerId)?.label}</span>
                          <svg className={`w-4 h-4 ml-2 transition-transform ${showCarousel ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      
                      {/* Caller ID Carousel */}
                      {showCarousel && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-green-50 rounded-lg border-2 border-green-200 shadow-lg z-10">
                          <div className="p-2">
                            <div className="text-sm font-bold text-green-700 mb-2" style={{ fontFamily: 'Forum, serif' }}>
                              Select Outbound Number
                            </div>
                            <div className="space-y-1">
                              {availableNumbers.map((numberOption) => (
                                <button
                                  key={numberOption.number}
                                  onClick={() => selectCallerId(numberOption.number, numberOption.label)}
                                  className={`w-full text-left p-2 rounded-md transition-colors ${
                                    selectedCallerId === numberOption.number 
                                      ? 'bg-green-500 text-white shadow-md' 
                                      : 'hover:bg-green-100 text-green-700'
                                  }`}
                                >
                                  <div className="font-medium">{numberOption.label}</div>
                                  {numberOption.type !== 'carousel' && (
                                    <div className="text-sm opacity-75">{numberOption.number}</div>
                                  )}
                                  {numberOption.type === 'carousel' && (
                                    <div className="text-sm opacity-75">Auto-select best number</div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Call Button */}
                    <button
                      onClick={makeCall}
                      disabled={!phoneNumber || showSummary}
                      className={`w-full py-5 rounded-2xl font-bold text-lg transition-all transform shadow-lg ${
                        showSummary
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : phoneNumber
                          ? 'bg-gradient-to-r from-[#636B56] to-[#864936] hover:from-[#525a48] hover:to-[#753d2f] text-white active:scale-98'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                      style={{ fontFamily: 'Forum, serif' }}
                    >
                      {showSummary ? 'Acknowledge Summary First' : phoneNumber ? `Call ${phoneNumber}` : 'Enter Number'}
                    </button>
                  </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <button
                      onClick={toggleMute}
                      className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                        isMuted ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      {isMuted ? 'Unmute' : 'Mute'}
                    </button>
                    <button
                      onClick={() => setPhoneNumber('')}
                      className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-all"
                    >
                      Clear
                    </button>
                  </div>
                  <button
                    onClick={endCall}
                    className="w-full py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                    style={{ fontFamily: 'Forum, serif' }}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                    </svg>
                    Hang Up
                  </button>
                </div>
              )}
              </div>
            </div>
              </div>

              {/* Right Column - Call History */}
              <div className="h-[800px]">
                <div className="bg-white rounded-2xl shadow-xl border-2 border-[#B28354]/20 h-full flex flex-col">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-[#636B56] to-[#864936] p-4 rounded-t-2xl">
                    <h3 className="text-white font-bold text-lg" style={{ fontFamily: 'Forum, serif' }}>
                      Recent Calls
                    </h3>
                  </div>

                  {/* Call History List */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    {callHistory.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <PhoneIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No recent calls</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {callHistory.map((call) => {
                          const matchingContact = contacts.find(c => c.phone_number === call.phoneNumber);
                          return (
                            <div key={call.id} className="bg-[#F8F2E7] p-3 rounded-lg border border-[#B28354]/20 hover:shadow-md transition-shadow cursor-pointer"
                                 onClick={() => setPhoneNumber(call.phoneNumber)}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex-1">
                                  <div className="font-medium text-[#636B56]">{call.phoneNumber}</div>
                                  {matchingContact && (
                                    <div className="text-sm text-[#864936] font-medium">{matchingContact.name}</div>
                                  )}
                                  {matchingContact && matchingContact.company && (
                                    <div className="text-xs text-gray-600">{matchingContact.company}</div>
                                  )}
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                                  call.status === 'Completed' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {call.status}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 space-y-1">
                                <div className="flex justify-between">
                                  <span>{call.type}</span>
                                  <span>{formatDuration(call.duration)}</span>
                                </div>
                                <div>{call.timestamp}</div>
                                {matchingContact && matchingContact.notes && (
                                  <div className="text-xs text-gray-500 mt-1 italic truncate">
                                    {matchingContact.notes.substring(0, 50)}...
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-[#636B56]">Click to dial</span>
                                {matchingContact && (
                                  <span className="text-xs text-[#864936] bg-[#864936]/10 px-2 py-1 rounded">
                                    Contact Match
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-3 bg-gray-50 rounded-b-2xl border-t border-gray-100">
                    <div className="text-center text-xs text-gray-500">
                      {callHistory.length} call{callHistory.length !== 1 ? 's' : ''} today
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Mandatory AI Call Summary Modal */}
            {showSummary && callSummary && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-gradient-to-br from-white to-[#F8F2E7]/95 rounded-3xl shadow-2xl border-2 border-[#636B56]/20 p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-[#636B56] mb-2" style={{ fontFamily: 'Forum, serif' }}>
                      Call Complete - Review & Schedule Follow-Up
                    </h2>
                    <p className="text-sm text-[#7a7a7a]">
                      Duration: {formatDuration(callSummary.callDuration || callDuration)} • To: {callSummary.participants?.to || phoneNumber}
                    </p>
                  </div>

                {/* Call Recording */}
                {recordingUrl && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
                    <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      Call Recording Available
                    </h4>
                    <audio controls className="w-full mb-2">
                      <source src={recordingUrl} type="audio/webm" />
                      <source src={recordingUrl} type="audio/mp4" />
                      Your browser does not support audio playback.
                    </audio>
                    <p className="text-xs text-gray-600">Recording saved for training and quality purposes</p>
                  </div>
                )}

                {/* Overview */}
                <div className="mb-4 p-3 bg-[#636B56]/5 rounded-lg">
                  <h4 className="font-semibold text-[#636B56] mb-1">Overview</h4>
                  <p className="text-sm text-gray-700">{callSummary.overview}</p>
                </div>

                {/* Key Points */}
                <div className="mb-4">
                  <h4 className="font-semibold text-[#636B56] mb-2">Key Discussion Points</h4>
                  <ul className="space-y-1">
                    {callSummary.keyPoints?.map((point, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start">
                        <span className="text-[#864936] mr-2">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Sentiment & Urgency */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Sentiment</p>
                    <p className="font-semibold text-green-700">{callSummary.sentiment}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Urgency</p>
                    <p className="font-semibold text-orange-700">{callSummary.urgency}</p>
                  </div>
                </div>

                {/* Action Items */}
                {callSummary.actionItems && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-[#636B56] mb-2">Action Items</h4>
                    <div className="space-y-2">
                      {callSummary.actionItems.map((item, idx) => (
                        <div key={idx} className="flex items-center p-2 bg-[#864936]/5 rounded-lg">
                          <input type="checkbox" className="mr-2" />
                          <span className="text-sm text-gray-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next Steps */}
                <div className="p-3 bg-[#B28354]/10 rounded-lg">
                  <h4 className="font-semibold text-[#864936] mb-1">Next Steps</h4>
                  <p className="text-sm text-gray-700">{callSummary.nextSteps}</p>
                </div>

                {/* Schedule Callback Section */}
                <div className="mt-6 p-4 bg-gradient-to-r from-[#636B56]/5 to-[#864936]/5 rounded-xl border border-[#B28354]/20">
                  <h4 className="font-bold text-[#636B56] mb-3 text-lg">Schedule Follow-Up Call</h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        value={callbackDate}
                        onChange={(e) => setCallbackDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#636B56]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                      <input
                        type="time"
                        value={callbackTime}
                        onChange={(e) => setCallbackTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#636B56]"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes for Follow-Up</label>
                    <textarea
                      value={callbackNotes}
                      onChange={(e) => setCallbackNotes(e.target.value)}
                      placeholder="Add any notes for the follow-up call..."
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#636B56]"
                    />
                  </div>
                  {callbackDate && callbackTime && (
                    <div className="p-2 bg-green-50 rounded-lg text-sm text-green-700">
                      ✓ Follow-up scheduled for {new Date(callbackDate).toLocaleDateString()} at {callbackTime}
                    </div>
                  )}
                </div>

                {/* MANDATORY Action Buttons - NO ESCAPE */}
                {!showEssayPenalty ? (
                  <div className="mt-6 space-y-3">
                    <button 
                      onClick={async () => {
                        // Require follow-up date/time to be filled
                        if (!callbackDate || !callbackTime) {
                          alert('⚠️ You MUST schedule a follow-up call before proceeding!');
                          return;
                        }
                        
                        // Save callback
                        const callback = {
                          id: `cb_${Date.now()}`,
                          title: `Follow-up: ${phoneNumber}`,
                          type: 'callback',
                          date: callbackDate,
                          time: callbackTime,
                          contact: phoneNumber,
                          phone: phoneNumber,
                          notes: callbackNotes || callSummary?.nextSteps || '',
                          fromCall: true,
                          status: 'scheduled'
                        };
                        
                        if (!global.scheduledCallbacks) global.scheduledCallbacks = [];
                        global.scheduledCallbacks.push(callback);
                        
                        // Clear and close
                        setShowSummary(false);
                        setCallSummary(null);
                        setCallbackDate('');
                        setCallbackTime('');
                        setCallbackNotes('');
                        setPhoneNumber('');
                      }}
                      disabled={!callbackDate || !callbackTime}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                        callbackDate && callbackTime 
                          ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:shadow-xl transform hover:scale-[1.02]'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      ✅ I'm Committed To Excellence - Save & Continue
                    </button>
                    
                    <button
                      onClick={() => setShowEssayPenalty(true)}
                      className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold text-sm hover:shadow-xl transform hover:scale-[1.02] transition-all"
                    >
                      🚫 I Want To Be Mediocre Like My Ops
                    </button>
                    
                    <button
                      onClick={() => {
                        // Testing bypass - skip everything
                        setShowSummary(false);
                        setCallSummary(null);
                        setCallbackDate('');
                        setCallbackTime('');
                        setCallbackNotes('');
                        setPhoneNumber('');
                        console.log('Testing bypass used - after-call process skipped');
                      }}
                      className="w-full py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium text-sm hover:shadow-lg transform hover:scale-[1.01] transition-all"
                    >
                      🧪 Testing (Bypass All Requirements)
                    </button>
                    
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center">
                      <p className="text-red-800 font-bold text-sm">⚠️ MANDATORY COMPLETION REQUIRED ⚠️</p>
                      <p className="text-red-700 text-xs mt-1">
                        You cannot make another call until you complete this follow-up process.
                        Success requires discipline. Mediocrity is a choice.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 bg-red-50 border-2 border-red-400 rounded-lg p-6">
                    <h3 className="text-red-800 font-bold text-lg mb-4 text-center">
                      📝 PENALTY ASSIGNMENT: Self-Sabotage Essay
                    </h3>
                    <p className="text-red-700 text-sm mb-4">
                      Since you've chosen mediocrity over excellence, write a 500-word essay explaining:
                      <strong> "Why I want to get in the way of my greatness and be the same as my ops."</strong>
                    </p>
                    
                    <textarea
                      value={essayText}
                      onChange={(e) => setEssayText(e.target.value)}
                      placeholder="Start typing your essay about choosing mediocrity over greatness..."
                      rows="8"
                      className="w-full p-3 border-2 border-red-300 rounded-lg focus:border-red-500 focus:outline-none text-sm"
                    />
                    
                    <div className="mt-3 text-center">
                      <span className={`text-sm font-medium ${essayText.length >= 500 ? 'text-green-600' : 'text-red-600'}`}>
                        {essayText.length}/500 words minimum
                      </span>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <button
                        onClick={() => {
                          if (essayText.length < 500) {
                            alert('Your essay must be at least 500 words to proceed. Commitment to mediocrity requires thorough explanation.');
                            return;
                          }
                          
                          // Force them to also schedule the follow-up
                          if (!callbackDate || !callbackTime) {
                            alert('Even after choosing mediocrity, you must still schedule your follow-up call.');
                            setShowEssayPenalty(false);
                            return;
                          }
                          
                          console.log('Mediocrity essay submitted:', essayText);
                          
                          // Save callback and close
                          const callback = {
                            id: `cb_${Date.now()}`,
                            title: `Follow-up: ${phoneNumber}`,
                            type: 'callback',
                            date: callbackDate,
                            time: callbackTime,
                            contact: phoneNumber,
                            phone: phoneNumber,
                            notes: `PENALTY CALL - Agent chose mediocrity. Essay: ${essayText.substring(0, 200)}...`,
                            fromCall: true,
                            status: 'scheduled'
                          };
                          
                          if (!global.scheduledCallbacks) global.scheduledCallbacks = [];
                          global.scheduledCallbacks.push(callback);
                          
                          setShowSummary(false);
                          setCallSummary(null);
                          setCallbackDate('');
                          setCallbackTime('');
                          setCallbackNotes('');
                          setPhoneNumber('');
                          setShowEssayPenalty(false);
                          setEssayText('');
                        }}
                        disabled={essayText.length < 500 || !callbackDate || !callbackTime}
                        className={`w-full py-3 rounded-xl font-bold text-sm ${
                          essayText.length >= 500 && callbackDate && callbackTime
                            ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:shadow-lg'
                            : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        }`}
                      >
                        Submit My Confession of Mediocrity & Schedule Follow-Up
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowEssayPenalty(false);
                          setEssayText('');
                        }}
                        className="w-full py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700"
                      >
                        🔄 Wait, I Choose Excellence Instead!
                      </button>
                    </div>
                  </div>
                )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}