import { useState, useEffect, useRef } from 'react';
import { Device } from '@twilio/voice-sdk';
import { 
  PhoneIcon, 
  PhoneXMarkIcon, 
  MicrophoneIcon,
  SpeakerWaveIcon,
  BackspaceIcon
} from '@heroicons/react/24/solid';
import { getNoiseSuppressor } from '../../lib/ai-noise-suppression';

export default function FullBrowserPhone({ onCallEnd, initialNumber = '' }) {
  const [device, setDevice] = useState(null);
  const [call, setCall] = useState(null);
  const [callState, setCallState] = useState('idle'); // idle, connecting, ringing, connected, disconnected
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [phoneNumber, setPhoneNumber] = useState(initialNumber);
  const [audioQuality, setAudioQuality] = useState(100);
  const [deviceReady, setDeviceReady] = useState(false);
  
  const timerRef = useRef(null);
  const noiseSuppressor = useRef(null);
  const audioRef = useRef(null);
  const qualityMonitorRef = useRef(null);

  useEffect(() => {
    initializeTwilioDevice();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (device) {
      device.destroy();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (qualityMonitorRef.current) {
      clearInterval(qualityMonitorRef.current);
    }
  };

  const initializeTwilioDevice = async () => {
    try {
      console.log('🔄 Initializing browser phone...');
      
      // Get access token from API
      const response = await fetch('/api/twilio/token');
      const data = await response.json();
      
      if (!data.success || !data.token) {
        console.error('❌ Failed to get access token:', data);
        alert('Failed to initialize phone. Check your Twilio setup.');
        return;
      }
      
      const { token } = data;
      console.log('✅ Access token received');

      // Initialize Twilio Device for high-quality calling
      const twilioDevice = new Device(token, {
        // Maximum quality audio settings
        audioConstraints: {
          echoCancellation: true,
          noiseSuppression: true,  // Built-in browser noise suppression
          autoGainControl: true,
          highpassFilter: false,   // Preserve full frequency range
          sampleRate: 48000,       // High quality sampling
          sampleSize: 16,          // 16-bit audio
          channelCount: 1,         // Mono for voice calls
        },
        codecPreferences: ['opus', 'pcmu'], // Prefer Opus for HD audio
        enableDscp: true,           // Quality of Service
        enableIceRestart: true,     // Better connection stability
        enableRingingState: true,   // Better call state management
        allowIncomingWhileBusy: false,
        logLevel: 'warn',          // Reduce console noise
      });

      // Set up device event handlers
      twilioDevice.on('ready', () => {
        console.log('📞 Twilio Device ready for calling');
        setDevice(twilioDevice);
        setDeviceReady(true);
      });

      twilioDevice.on('error', (error) => {
        console.error('❌ Twilio Device error:', error);
        alert(`Phone error: ${error.message}`);
        setDeviceReady(false);
      });

      twilioDevice.on('incoming', (incomingCall) => {
        console.log('📞 Incoming call from', incomingCall.parameters.From);
        handleIncomingCall(incomingCall);
      });

      // Register the device
      await twilioDevice.register();
      
      // Initialize professional noise suppression
      try {
        noiseSuppressor.current = await getNoiseSuppressor();
        console.log('🎵 Professional noise suppression initialized');
      } catch (error) {
        console.warn('⚠️ Noise suppression unavailable:', error.message);
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize phone:', error);
      alert('Failed to initialize phone system. Please check your connection and try again.');
      setDeviceReady(false);
    }
  };

  const handleIncomingCall = (incomingCall) => {
    setCall(incomingCall);
    setCallState('ringing');
    
    // Auto-answer after user confirmation
    const accept = window.confirm(`Incoming call from ${incomingCall.parameters.From}. Accept?`);
    
    if (accept) {
      incomingCall.accept();
      setupCallHandlers(incomingCall);
      setCallState('connected');
      startTimer();
      startQualityMonitoring(incomingCall);
    } else {
      incomingCall.reject();
      setCall(null);
      setCallState('idle');
    }
  };

  const makeCall = async () => {
    if (!device || !deviceReady) {
      alert('Phone system not ready. Please wait a moment and try again.');
      return;
    }

    if (!phoneNumber.trim()) {
      alert('Please enter a phone number');
      return;
    }

    // Format the phone number
    let formattedNumber = phoneNumber.trim();
    if (!formattedNumber.startsWith('+')) {
      // Assume Australian number if no country code
      formattedNumber = formattedNumber.replace(/^0/, '+61');
      if (!formattedNumber.startsWith('+61')) {
        formattedNumber = '+61' + formattedNumber;
      }
    }

    console.log('📞 Initiating call to:', formattedNumber);
    setCallState('connecting');

    try {
      // Get enhanced audio stream with maximum quality
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,        // High quality sampling
          sampleSize: 16,           // 16-bit audio
          channelCount: 1,          // Mono for voice
          latency: 0.01,            // Low latency
          volume: 1.0,
        }
      });

      console.log('🎤 Microphone access granted');

      // Apply professional noise suppression if available
      let enhancedStream = stream;
      if (noiseSuppressor.current) {
        try {
          enhancedStream = await noiseSuppressor.current.processAudioStream(stream);
          console.log('🔧 Professional noise suppression applied');
        } catch (error) {
          console.warn('⚠️ Noise suppression failed, using original stream:', error);
        }
      }

      // Make the call
      const outgoingCall = await device.connect({
        params: {
          To: formattedNumber,
          ContactName: 'Manual Dial',
        },
        rtcConfiguration: {
          iceServers: [
            { urls: 'stun:global.stun.twilio.com:3478' },
            { urls: 'turn:global.turn.twilio.com:3478?transport=udp' },
            { urls: 'turn:global.turn.twilio.com:3478?transport=tcp' },
            { urls: 'turn:global.turn.twilio.com:443?transport=tcp' },
          ],
          iceTransportPolicy: 'all',
          bundlePolicy: 'max-bundle',
          rtcpMuxPolicy: 'require',
        },
      });

      console.log('🔄 Call initiated, waiting for connection...');

      // Replace the audio track with enhanced one for better quality
      if (enhancedStream.getAudioTracks()[0] && outgoingCall.peerConnection) {
        const senders = outgoingCall.peerConnection.getSenders();
        const audioSender = senders.find(sender => 
          sender.track && sender.track.kind === 'audio'
        );
        
        if (audioSender) {
          await audioSender.replaceTrack(enhancedStream.getAudioTracks()[0]);
          console.log('🎵 Enhanced audio track applied');
        }
      }

      setCall(outgoingCall);
      setupCallHandlers(outgoingCall);

    } catch (error) {
      console.error('❌ Failed to make call:', error);
      setCallState('idle');
      
      if (error.name === 'NotAllowedError') {
        alert('Microphone access denied. Please allow microphone permissions and try again.');
      } else {
        alert(`Failed to connect call: ${error.message}`);
      }
    }
  };

  const setupCallHandlers = (activeCall) => {
    activeCall.on('accept', () => {
      console.log('✅ Call connected');
      setCallState('connected');
      startTimer();
      startQualityMonitoring(activeCall);
    });

    activeCall.on('disconnect', () => {
      console.log('📴 Call ended');
      handleCallEnd();
    });

    activeCall.on('cancel', () => {
      console.log('❌ Call cancelled');
      setCallState('idle');
      setCall(null);
    });

    activeCall.on('reject', () => {
      console.log('📵 Call rejected');
      setCallState('idle');
      setCall(null);
    });

    // Handle audio events
    activeCall.on('audio', (remoteAudio) => {
      console.log('🔊 Audio stream received');
      if (audioRef.current) {
        audioRef.current.srcObject = new MediaStream([remoteAudio]);
        audioRef.current.volume = volume / 100;
        audioRef.current.play();
      }
    });
  };

  const startQualityMonitoring = (activeCall) => {
    qualityMonitorRef.current = setInterval(async () => {
      if (activeCall.peerConnection) {
        try {
          const stats = await activeCall.peerConnection.getStats();
          let totalPacketsLost = 0;
          let totalPackets = 0;
          
          stats.forEach(report => {
            if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
              totalPacketsLost += report.packetsLost || 0;
              totalPackets += report.packetsReceived || 0;
            }
          });
          
          if (totalPackets > 0) {
            const lossRate = (totalPacketsLost / totalPackets) * 100;
            const quality = Math.max(0, 100 - (lossRate * 10));
            setAudioQuality(Math.round(quality));
          }
        } catch (error) {
          // Ignore stats errors
        }
      }
    }, 2000);
  };

  const hangUp = () => {
    console.log('📴 Hanging up call');
    if (call) {
      call.disconnect();
    }
    handleCallEnd();
  };

  const handleCallEnd = () => {
    setCallState('idle');
    setCall(null);
    stopTimer();
    stopQualityMonitoring();
    
    if (onCallEnd) {
      onCallEnd(duration);
    }
    
    setDuration(0);
    setAudioQuality(100);
  };

  const toggleMute = () => {
    if (call) {
      call.mute(!isMuted);
      setIsMuted(!isMuted);
      console.log(isMuted ? '🔊 Unmuted' : '🔇 Muted');
    }
  };

  const adjustVolume = (newVolume) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopQualityMonitoring = () => {
    if (qualityMonitorRef.current) {
      clearInterval(qualityMonitorRef.current);
      qualityMonitorRef.current = null;
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Dialer functions
  const addDigit = (digit) => {
    if (callState === 'connected' && call) {
      // Send DTMF tone during call
      call.sendDigits(digit);
      console.log('📞 Sent DTMF:', digit);
    } else {
      // Add to phone number
      setPhoneNumber(prev => prev + digit);
    }
  };

  const clearLastDigit = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const clearAll = () => {
    setPhoneNumber('');
  };

  const dialPad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#']
  ];

  return (
    <div className="bg-white rounded-lg shadow-2xl p-6 w-96 mx-auto">
      {/* Hidden audio element for call audio */}
      <audio ref={audioRef} autoPlay />
      
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <PhoneIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Browser Phone</h2>
        </div>
        
        {/* Status indicator */}
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          deviceReady 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            deviceReady ? 'bg-green-500' : 'bg-yellow-500'
          }`} />
          {deviceReady ? 'Ready' : 'Initializing...'}
        </div>
      </div>

      {/* Phone Number Display */}
      <div className="mb-6">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter phone number..."
            className="text-2xl font-mono bg-transparent border-none outline-none text-center w-full text-gray-800"
          />
          {phoneNumber && (
            <button
              onClick={clearAll}
              className="mt-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Call Status */}
      {callState !== 'idle' && (
        <div className="mb-4 text-center">
          <div className={`text-lg font-semibold ${
            callState === 'connected' ? 'text-green-600' :
            callState === 'connecting' ? 'text-yellow-600' :
            callState === 'ringing' ? 'text-blue-600' :
            'text-gray-600'
          }`}>
            {callState === 'connecting' && '🔄 Connecting...'}
            {callState === 'ringing' && '📞 Ringing...'}
            {callState === 'connected' && '✅ Connected'}
          </div>
          
          {callState === 'connected' && (
            <div className="mt-2">
              <div className="text-3xl font-mono font-bold text-gray-800">
                {formatDuration(duration)}
              </div>
              <div className={`text-sm ${
                audioQuality > 80 ? 'text-green-600' :
                audioQuality > 50 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                Quality: {audioQuality}% • HD Audio
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dial Pad */}
      <div className="mb-6">
        <div className="grid grid-cols-3 gap-3">
          {dialPad.flat().map((digit) => (
            <button
              key={digit}
              onClick={() => addDigit(digit)}
              className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg p-4 text-xl font-bold text-gray-800 transition-colors"
            >
              {digit}
            </button>
          ))}
        </div>
        
        <div className="flex justify-center mt-3 space-x-3">
          <button
            onClick={clearLastDigit}
            disabled={!phoneNumber}
            className="bg-red-100 hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg p-3 text-red-600"
          >
            <BackspaceIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Call Controls */}
      <div className="space-y-4">
        {callState === 'idle' && (
          <button
            onClick={makeCall}
            disabled={!deviceReady || !phoneNumber.trim()}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg py-4 font-semibold text-lg flex items-center justify-center space-x-2"
          >
            <PhoneIcon className="h-6 w-6" />
            <span>Call</span>
          </button>
        )}

        {(callState === 'connecting' || callState === 'ringing' || callState === 'connected') && (
          <div className="flex space-x-3">
            {callState === 'connected' && (
              <>
                <button
                  onClick={toggleMute}
                  className={`flex-1 ${
                    isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-500 hover:bg-gray-600'
                  } text-white rounded-lg py-3 flex items-center justify-center space-x-2`}
                >
                  <MicrophoneIcon className="h-5 w-5" />
                  <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                </button>
                
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-3"
                  title={`Volume: ${volume}%`}
                >
                  <SpeakerWaveIcon className="h-5 w-5" />
                </button>
              </>
            )}
            
            <button
              onClick={hangUp}
              className="bg-red-500 hover:bg-red-600 text-white rounded-lg py-3 px-6 flex items-center justify-center space-x-2 font-semibold"
            >
              <PhoneXMarkIcon className="h-6 w-6" />
              <span>End</span>
            </button>
          </div>
        )}

        {/* Volume Control for Connected Calls */}
        {callState === 'connected' && (
          <div className="bg-gray-50 rounded-lg p-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Volume: {volume}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => adjustVolume(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* Noise Suppression Status */}
      {noiseSuppressor.current && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-xs text-green-800 space-y-1">
            <p>✅ Professional Noise Suppression Active</p>
            <p>✅ HD Audio (48kHz Opus Codec)</p>
            <p>✅ Echo Cancellation Enabled</p>
          </div>
        </div>
      )}

      {/* Tech Info */}
      <div className="mt-4 text-xs text-gray-500 text-center space-y-1">
        <p>WebRTC Browser Calling • Real-time audio</p>
        <p>Quality optimized • Two-way conversation</p>
      </div>
    </div>
  );
}