import { useState, useEffect, useRef } from 'react';
import { 
  PhoneIcon,
  PhoneArrowDownLeftIcon,
  XMarkIcon,
  SpeakerWaveIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  UserIcon,
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  StarIcon,
  EllipsisHorizontalIcon,
  ArrowPathIcon,
  HandRaisedIcon,
  PauseIcon,
  PlayIcon
} from '@heroicons/react/24/solid';

export default function IncomingCallHandler() {
  const [incomingCall, setIncomingCall] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [callerInfo, setCallerInfo] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [showActions, setShowActions] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [callQuality, setCallQuality] = useState('excellent');
  
  const audioRef = useRef(null);
  const callStartTime = useRef(null);
  const timerRef = useRef(null);
  const wsRef = useRef(null);

  // Initialize WebSocket connection for incoming calls
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Call timer
  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isCallActive]);

  // Connect to WebSocket for real-time call events
  const connectWebSocket = () => {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/calls/ws`;
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('Call handler WebSocket connected');
      setConnectionStatus('connected');
    };
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };
    
    wsRef.current.onclose = () => {
      console.log('Call handler WebSocket disconnected');
      setConnectionStatus('disconnected');
      // Attempt to reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };
    
    wsRef.current.onerror = (error) => {
      console.error('Call handler WebSocket error:', error);
      setConnectionStatus('error');
    };
  };

  // Handle WebSocket messages
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'incoming_call':
        handleIncomingCall(data.call);
        break;
      case 'call_ended':
        handleCallEnded();
        break;
      case 'caller_info':
        setCallerInfo(data.info);
        break;
      case 'call_quality':
        setCallQuality(data.quality);
        break;
      case 'ai_suggestion':
        setAiSuggestions(prev => [...prev, data.suggestion]);
        break;
    }
  };

  // Handle incoming call
  const handleIncomingCall = async (call) => {
    setIncomingCall(call);
    
    // Play ringtone
    if (audioRef.current) {
      audioRef.current.src = '/sounds/ringtone.mp3';
      audioRef.current.loop = true;
      audioRef.current.play().catch(console.error);
    }
    
    // Fetch caller information
    await fetchCallerInfo(call.from);
    
    // Browser notification
    if (Notification.permission === 'granted') {
      new Notification('Incoming Call', {
        body: `Call from ${call.callerName || call.from}`,
        icon: '/icons/phone-call.png',
        requireInteraction: true
      });
    }
    
    // Flash tab title
    const originalTitle = document.title;
    const flashTitle = () => {
      document.title = document.title === originalTitle ? '📞 Incoming Call' : originalTitle;
    };
    const flashInterval = setInterval(flashTitle, 1000);
    
    // Clear flash after 30 seconds or when call is answered
    setTimeout(() => {
      clearInterval(flashInterval);
      document.title = originalTitle;
    }, 30000);
  };

  // Fetch caller information from CRM
  const fetchCallerInfo = async (phoneNumber) => {
    try {
      const response = await fetch(`/api/contacts/lookup?phone=${encodeURIComponent(phoneNumber)}`);
      const data = await response.json();
      
      if (data.contact) {
        setCallerInfo(data.contact);
        
        // Get call history
        const historyResponse = await fetch(`/api/call-history?phone=${encodeURIComponent(phoneNumber)}`);
        const historyData = await historyResponse.json();
        setCallHistory(historyData.calls || []);
        
        // Generate AI suggestions based on contact info
        generateAISuggestions(data.contact);
      } else {
        // Unknown caller
        setCallerInfo({
          name: 'Unknown Caller',
          phone: phoneNumber,
          isNew: true
        });
      }
    } catch (error) {
      console.error('Failed to fetch caller info:', error);
      setCallerInfo({
        name: 'Unknown Caller',
        phone: phoneNumber,
        isNew: true
      });
    }
  };

  // Generate AI suggestions for the call
  const generateAISuggestions = (contact) => {
    const suggestions = [];
    
    // Based on contact status
    if (contact.status === 'hot_lead') {
      suggestions.push({
        id: 'hot_lead_greeting',
        type: 'greeting',
        text: `Hi ${contact.name}, great to hear from you! Are you ready to move forward with the property viewing?`,
        confidence: 95
      });
    }
    
    // Based on last interaction
    if (contact.lastInteraction?.type === 'viewing') {
      suggestions.push({
        id: 'viewing_followup',
        type: 'follow_up',
        text: `How did you feel about the property you viewed last week? Do you have any questions?`,
        confidence: 90
      });
    }
    
    // Based on properties of interest
    if (contact.interestedProperties?.length > 0) {
      suggestions.push({
        id: 'property_update',
        type: 'opportunity',
        text: `I have updates on the properties you're interested in. The Oak Street property just had a price reduction.`,
        confidence: 85
      });
    }
    
    // General suggestions
    suggestions.push(
      {
        id: 'active_listening',
        type: 'technique',
        text: 'Listen actively and ask open-ended questions to understand their needs.',
        confidence: 100
      },
      {
        id: 'value_proposition',
        type: 'sales',
        text: 'Emphasize your local market expertise and recent successful sales.',
        confidence: 80
      }
    );
    
    setAiSuggestions(suggestions);
  };

  // Answer call
  const answerCall = async () => {
    try {
      // Stop ringtone
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      // Accept call via Twilio
      const response = await fetch('/api/calls/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          callSid: incomingCall.sid,
          action: 'accept'
        })
      });
      
      if (response.ok) {
        setIsCallActive(true);
        setIncomingCall(null);
        callStartTime.current = Date.now();
        
        // Start call recording
        await startCallRecording();
        
        // Show success notification
        showNotification('Call connected successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to answer call:', error);
      showNotification('Failed to answer call', 'error');
    }
  };

  // Reject call
  const rejectCall = async () => {
    try {
      // Stop ringtone
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      // Reject call via Twilio
      await fetch('/api/calls/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          callSid: incomingCall.sid,
          action: 'reject'
        })
      });
      
      setIncomingCall(null);
      
      // Show notification
      showNotification('Call declined', 'info');
    } catch (error) {
      console.error('Failed to reject call:', error);
    }
  };

  // End call
  const endCall = async () => {
    try {
      await fetch('/api/calls/hangup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          callSid: incomingCall?.sid || 'current_call'
        })
      });
      
      handleCallEnded();
      showNotification('Call ended', 'info');
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  };

  // Handle call ended
  const handleCallEnded = () => {
    setIsCallActive(false);
    setIncomingCall(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsOnHold(false);
    setShowActions(false);
    
    // Save call notes if any
    if (callNotes.trim()) {
      saveCallNotes();
    }
    
    setCallNotes('');
    setAiSuggestions([]);
  };

  // Toggle mute
  const toggleMute = async () => {
    try {
      await fetch('/api/calls/mute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          muted: !isMuted
        })
      });
      
      setIsMuted(!isMuted);
      showNotification(isMuted ? 'Unmuted' : 'Muted', 'info');
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  };

  // Toggle hold
  const toggleHold = async () => {
    try {
      await fetch('/api/calls/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          onHold: !isOnHold
        })
      });
      
      setIsOnHold(!isOnHold);
      showNotification(isOnHold ? 'Call resumed' : 'Call on hold', 'info');
    } catch (error) {
      console.error('Failed to toggle hold:', error);
    }
  };

  // Start call recording
  const startCallRecording = async () => {
    try {
      await fetch('/api/calls/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'start',
          recordingChannels: 'dual'
        })
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  // Save call notes
  const saveCallNotes = async () => {
    try {
      await fetch('/api/calls/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callSid: incomingCall?.sid,
          contactPhone: callerInfo?.phone,
          notes: callNotes,
          duration: callDuration,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to save call notes:', error);
    }
  };

  // Show notification
  const showNotification = (message, type = 'info') => {
    // In a real implementation, use a toast library
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  // Format call duration
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get connection status color
  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Incoming call overlay
  if (incomingCall && !isCallActive) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
          {/* Caller Info */}
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              {callerInfo?.avatar ? (
                <img 
                  src={callerInfo.avatar} 
                  alt={callerInfo.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              {callerInfo?.name || 'Unknown Caller'}
            </h3>
            <p className="text-gray-600">{incomingCall.from}</p>
            {callerInfo?.isNew && (
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full mt-2">
                New Contact
              </span>
            )}
          </div>

          {/* Quick Info */}
          {callerInfo && !callerInfo.isNew && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
              {callerInfo.lastContact && (
                <div className="flex items-center gap-2 text-sm">
                  <ClockIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    Last contact: {new Date(callerInfo.lastContact).toLocaleDateString()}
                  </span>
                </div>
              )}
              {callerInfo.status && (
                <div className="flex items-center gap-2 text-sm">
                  <StarIcon className="h-4 w-4 text-yellow-500" />
                  <span className="text-gray-600 capitalize">
                    Status: {callerInfo.status.replace('_', ' ')}
                  </span>
                </div>
              )}
              {callerInfo.interestedProperties?.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPinIcon className="h-4 w-4 text-red-500" />
                  <span className="text-gray-600">
                    Interested in {callerInfo.interestedProperties.length} properties
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Call Actions */}
          <div className="flex justify-center gap-6">
            <button
              onClick={rejectCall}
              className="w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <XMarkIcon className="w-8 h-8" />
            </button>
            
            <button
              onClick={answerCall}
              className="w-16 h-16 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center transition-colors animate-pulse"
            >
              <PhoneIcon className="w-8 h-8" />
            </button>
          </div>
          
          <p className="text-center text-sm text-gray-500 mt-4">
            Incoming call from {callerInfo?.name || incomingCall.from}
          </p>
        </div>
        
        <audio ref={audioRef} />
      </div>
    );
  }

  // Active call interface
  if (isCallActive) {
    return (
      <div className="fixed top-4 right-4 bg-white rounded-xl shadow-2xl border border-gray-200 w-96 z-50">
        {/* Call Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                {callerInfo?.avatar ? (
                  <img 
                    src={callerInfo.avatar} 
                    alt={callerInfo.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {callerInfo?.name || 'Unknown Caller'}
                </p>
                <p className="text-sm text-gray-600">{formatDuration(callDuration)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getConnectionColor().replace('text-', 'bg-')}`} />
              <span className={`text-xs ${getConnectionColor()}`}>
                {connectionStatus}
              </span>
            </div>
          </div>
          
          {isOnHold && (
            <div className="mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
              Call on hold
            </div>
          )}
        </div>

        {/* Call Controls */}
        <div className="p-4">
          <div className="flex justify-center gap-4 mb-4">
            <button
              onClick={toggleMute}
              className={`p-3 rounded-full transition-colors ${
                isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <MicrophoneIcon className="w-5 h-5" />
            </button>
            
            <button
              onClick={toggleHold}
              className={`p-3 rounded-full transition-colors ${
                isOnHold ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isOnHold ? <PlayIcon className="w-5 h-5" /> : <PauseIcon className="w-5 h-5" />}
            </button>
            
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-3 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
            >
              <EllipsisHorizontalIcon className="w-5 h-5" />
            </button>
            
            <button
              onClick={endCall}
              className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Additional Actions */}
          {showActions && (
            <div className="border-t pt-4 space-y-3">
              <button className="w-full px-3 py-2 text-left text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
                Transfer Call
              </button>
              <button className="w-full px-3 py-2 text-left text-sm bg-green-50 text-green-700 rounded hover:bg-green-100">
                Add to Conference
              </button>
              <button className="w-full px-3 py-2 text-left text-sm bg-purple-50 text-purple-700 rounded hover:bg-purple-100">
                Send SMS
              </button>
            </div>
          )}

          {/* AI Suggestions */}
          {aiSuggestions.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <p className="text-sm font-medium text-gray-800 mb-2">AI Suggestions</p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {aiSuggestions.slice(0, 3).map(suggestion => (
                  <div key={suggestion.id} className="p-2 bg-blue-50 rounded text-xs">
                    <p className="text-blue-800">{suggestion.text}</p>
                    <span className="text-blue-600">
                      {suggestion.confidence}% confidence
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Notes */}
          <div className="mt-4 border-t pt-4">
            <textarea
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              placeholder="Call notes..."
              className="w-full px-3 py-2 border rounded text-sm resize-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
          </div>
        </div>
      </div>
    );
  }

  // Connection status indicator (when no call)
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className={`px-3 py-2 rounded-full text-xs font-medium ${
        connectionStatus === 'connected' ? 'bg-green-100 text-green-700' :
        connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-700' :
        'bg-red-100 text-red-700'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-600' :
            connectionStatus === 'connecting' ? 'bg-yellow-600 animate-pulse' :
            'bg-red-600'
          }`} />
          Call Handler {connectionStatus}
        </div>
      </div>
    </div>
  );
}