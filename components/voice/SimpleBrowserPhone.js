import { useState, useEffect, useRef } from 'react';
import { Device } from '@twilio/voice-sdk';

export default function SimpleBrowserPhone({ contact, onCallEnd }) {
  const [device, setDevice] = useState(null);
  const [call, setCall] = useState(null);
  const [callState, setCallState] = useState('initializing');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  const timerRef = useRef(null);

  useEffect(() => {
    initializeTwilioDevice();
    return () => {
      if (device) {
        device.destroy();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const initializeTwilioDevice = async () => {
    try {
      setCallState('fetching-token');
      
      // Get access token from API
      const response = await fetch('/api/twilio/token');
      const data = await response.json();
      
      if (!response.ok || !data.token) {
        console.error('Token fetch failed:', data);
        setCallState('error');
        return;
      }

      setCallState('connecting-device');
      
      // Initialize Twilio Device
      const twilioDevice = new Device(data.token, {
        logLevel: 1,
        edge: 'sydney', // Use Sydney edge for Australia
        codecPreferences: ['opus', 'pcmu'],
      });

      // Set up event handlers
      twilioDevice.on('ready', () => {
        console.log('✅ Twilio Device ready');
        setCallState('ready');
        setDevice(twilioDevice);
        
        // Auto-start call when device is ready
        setTimeout(() => makeCall(twilioDevice), 500);
      });

      twilioDevice.on('error', (error) => {
        console.error('❌ Twilio Device error:', error);
        setCallState(`error: ${error.message || error.code || 'Unknown error'}`);
      });

      twilioDevice.on('connect', (conn) => {
        console.log('📞 Call connected');
        setCall(conn);
        setCallState('connected');
        startTimer();
      });

      twilioDevice.on('disconnect', () => {
        console.log('📞 Call disconnected');
        endCall();
      });

      // Register the device
      await twilioDevice.register();
      
    } catch (error) {
      console.error('Failed to initialize:', error);
      setCallState('error');
    }
  };

  const makeCall = async (twilioDevice = device) => {
    if (!twilioDevice) {
      console.error('Device not ready');
      return;
    }

    try {
      setCallState('dialing');
      
      // Format phone number
      let phoneNumber = contact.phone;
      if (!phoneNumber.startsWith('+')) {
        // Assume Australian number if no country code
        if (phoneNumber.startsWith('0')) {
          phoneNumber = '+61' + phoneNumber.substring(1);
        } else {
          phoneNumber = '+' + phoneNumber;
        }
      }

      console.log('📞 Calling:', phoneNumber);

      // Make the call
      const params = {
        To: phoneNumber,
        From: process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || '+61482080888'
      };

      const outgoingCall = await twilioDevice.connect({ params });
      setCall(outgoingCall);
      
    } catch (error) {
      console.error('Call failed:', error);
      setCallState('error');
    }
  };

  const endCall = () => {
    if (call) {
      call.disconnect();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setCallState('ended');
    setCall(null);
    
    if (onCallEnd) {
      onCallEnd(duration);
    }
  };

  const toggleMute = () => {
    if (call) {
      call.mute(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setDuration(d => d + 1);
    }, 1000);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusMessage = () => {
    switch (callState) {
      case 'initializing': return 'Initializing phone system...';
      case 'fetching-token': return 'Getting access token...';
      case 'connecting-device': return 'Connecting to Twilio...';
      case 'ready': return 'Phone ready';
      case 'dialing': return `Dialing ${contact.phone}...`;
      case 'connected': return 'Call connected';
      case 'ended': return 'Call ended';
      case 'error': return 'Connection failed - Check console';
      default: return 'Unknown state';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center">
          {/* Contact Info */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">
                {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{contact.name}</h2>
            <p className="text-gray-600">{contact.phone}</p>
          </div>

          {/* Call Status */}
          <div className="mb-6">
            <p className="text-lg font-medium text-gray-700">
              {getStatusMessage()}
            </p>
            {callState === 'connected' && (
              <p className="text-3xl font-mono text-indigo-600 mt-2">
                {formatDuration(duration)}
              </p>
            )}
          </div>

          {/* Debug Info */}
          <div className="mb-4 p-3 bg-gray-100 rounded text-xs text-left">
            <p><strong>State:</strong> {callState}</p>
            <p><strong>Device:</strong> {device ? 'Ready' : 'Not ready'}</p>
            <p><strong>Call:</strong> {call ? 'Active' : 'None'}</p>
          </div>

          {/* Call Controls */}
          <div className="flex justify-center space-x-4">
            {callState === 'connected' && (
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full ${
                  isMuted ? 'bg-red-500' : 'bg-gray-500'
                } text-white hover:opacity-80`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14a3 3 0 100-6 3 3 0 000 6z" />
                  <path fillRule="evenodd" d="M5 11a7 7 0 1114 0v3.17c0 .955-.284 1.887-.817 2.682l-2.09 3.135A2 2 0 0114.434 21H9.566a2 2 0 01-1.658-1.013l-2.09-3.135A4.414 4.414 0 015 14.17V11zm7-6a1 1 0 011 1v3a1 1 0 11-2 0V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            
            <button
              onClick={endCall}
              className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600"
              title="End Call"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M3.5 3.5A.5.5 0 014 3h2.153a.5.5 0 01.493.418l1.187 7.121a.5.5 0 01-.27.53l-2.194 1.097a12.037 12.037 0 006.642 6.642l1.097-2.194a.5.5 0 01.53-.27l7.121 1.187a.5.5 0 01.418.493V20a.5.5 0 01-.5.5h-2C9.716 20.5 3.5 14.284 3.5 6V3.5zM19.97 4.97a.75.75 0 011.06 0l2 2a.75.75 0 11-1.06 1.06L20 6.06l-1.97 1.97a.75.75 0 11-1.06-1.06l1.97-1.97-1.97-1.97a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Instructions */}
          {callState === 'connected' && (
            <div className="mt-6 p-3 bg-green-50 rounded text-sm text-green-800">
              <p>✓ Two-way audio active</p>
              <p>✓ Speak through your computer mic</p>
              <p>✓ Audio plays through speakers</p>
            </div>
          )}

          {callState === 'error' && (
            <div className="mt-6 p-3 bg-red-50 rounded text-sm text-red-800">
              <p>Check browser console for errors</p>
              <p>Verify Twilio credentials in .env.local</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}