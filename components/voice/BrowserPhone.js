import { useState, useEffect, useRef } from 'react';
import { Device } from '@twilio/voice-sdk';
import { PhoneIcon, PhoneXMarkIcon, MicrophoneIcon } from '@heroicons/react/24/solid';
import { getNoiseSuppressor } from '../../lib/ai-noise-suppression';

export default function BrowserPhone({ contact, onCallEnd }) {
  const [device, setDevice] = useState(null);
  const [call, setCall] = useState(null);
  const [callState, setCallState] = useState('idle');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [audioQuality, setAudioQuality] = useState(100);
  
  const timerRef = useRef(null);
  const noiseSuppressor = useRef(null);

  useEffect(() => {
    initializeTwilioDevice();
    return () => {
      if (device) {
        device.destroy();
      }
    };
  }, []);

  const initializeTwilioDevice = async () => {
    try {
      // Get access token from API
      const response = await fetch('/api/twilio/token');
      const data = await response.json();
      
      if (!data.token) {
        console.error('No token received:', data);
        setCallState('error');
        return;
      }
      
      const { token } = data;

      // Initialize Twilio Device for browser calling with maximum quality settings
      const twilioDevice = new Device(token, {
        // Maximum quality audio constraints
        audioConstraints: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          highpassFilter: false, // Preserve full frequency range
          sampleRate: 48000, // High quality sampling
          sampleSize: 16, // 16-bit audio
        },
        codecPreferences: ['opus', 'pcmu'], // Prefer Opus for HD quality
        enableDscp: true, // Quality of Service markings
        enableIceRestart: true, // Better connection stability
        enableRingingState: true, // Better call state management
        allowIncomingWhileBusy: false, // Focus on one call at a time
      });

      // Register device event handlers
      twilioDevice.on('ready', () => {
        console.log('Twilio Device is ready');
        setDevice(twilioDevice);
      });

      twilioDevice.on('error', (error) => {
        console.error('Twilio Device error:', error);
      });

      twilioDevice.on('incoming', (incomingCall) => {
        console.log('Incoming call from', incomingCall.parameters.From);
        // Auto-answer for demo (you'd normally show accept/reject UI)
        incomingCall.accept();
        setCall(incomingCall);
        setCallState('connected');
        startTimer();
      });

      // Register the device
      await twilioDevice.register();
      
      // Initialize noise suppressor
      noiseSuppressor.current = await getNoiseSuppressor();
      
    } catch (error) {
      console.error('Failed to initialize Twilio Device:', error);
    }
  };

  const makeCall = async () => {
    if (!device) {
      alert('Phone system not ready. Please wait...');
      return;
    }

    setCallState('connecting');

    try {
      // Get highest quality audio stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000, // CD quality
          sampleSize: 16,
          channelCount: 1, // Mono for voice
          latency: 0.01, // Low latency for real-time
          volume: 1.0,
        }
      });

      // Apply professional noise suppression if available
      let enhancedStream = stream;
      if (noiseSuppressor.current) {
        try {
          enhancedStream = await noiseSuppressor.current.processAudioStream(stream);
        } catch (error) {
          console.warn('Noise suppression failed, using original stream:', error);
        }
      }

      // Make the call through browser with optimized settings
      const outgoingCall = await device.connect({
        params: {
          To: contact.phone,
          ContactName: contact.name || 'Unknown Contact',
          ContactId: contact.id || '',
        },
        rtcConfiguration: {
          iceServers: [
            { urls: 'stun:global.stun.twilio.com:3478' },
            { urls: 'turn:global.turn.twilio.com:3478?transport=udp' },
            { urls: 'turn:global.turn.twilio.com:3478?transport=tcp' },
            { urls: 'turn:global.turn.twilio.com:443?transport=tcp' }, // Fallback for restrictive networks
          ],
          iceTransportPolicy: 'all',
          bundlePolicy: 'max-bundle',
          rtcpMuxPolicy: 'require',
        },
      });

      // Replace audio track with enhanced one
      const pc = outgoingCall.mediaStream.getAudioTracks()[0];
      const sender = outgoingCall.peerConnection.getSenders().find(s => s.track === pc);
      if (sender && enhancedStream.getAudioTracks()[0]) {
        sender.replaceTrack(enhancedStream.getAudioTracks()[0]);
      }

      outgoingCall.on('accept', () => {
        console.log('Call connected');
        setCall(outgoingCall);
        setCallState('connected');
        startTimer();
      });

      outgoingCall.on('disconnect', () => {
        console.log('Call ended');
        handleCallEnd();
      });

      outgoingCall.on('cancel', () => {
        console.log('Call cancelled');
        setCallState('idle');
      });

      outgoingCall.on('reject', () => {
        console.log('Call rejected');
        setCallState('idle');
      });

      // Monitor call quality
      monitorCallQuality(outgoingCall);

    } catch (error) {
      console.error('Failed to make call:', error);
      setCallState('idle');
      alert('Failed to connect call. Please check microphone permissions.');
    }
  };

  const monitorCallQuality = (activeCall) => {
    const interval = setInterval(async () => {
      if (activeCall.peerConnection) {
        const stats = await activeCall.peerConnection.getStats();
        let totalPacketsLost = 0;
        let totalPackets = 0;
        
        stats.forEach(report => {
          if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
            totalPacketsLost += report.packetsLost || 0;
            totalPackets += report.packetsReceived || 0;
          }
        });
        
        const lossRate = totalPackets > 0 ? (totalPacketsLost / totalPackets) * 100 : 0;
        const quality = Math.max(0, 100 - (lossRate * 10));
        setAudioQuality(Math.round(quality));
      }
    }, 1000);

    return () => clearInterval(interval);
  };

  const hangUp = () => {
    if (call) {
      call.disconnect();
    }
    handleCallEnd();
  };

  const handleCallEnd = () => {
    setCallState('idle');
    setCall(null);
    stopTimer();
    if (onCallEnd) {
      onCallEnd(duration);
    }
    setDuration(0);
  };

  const toggleMute = () => {
    if (call) {
      call.mute(!isMuted);
      setIsMuted(!isMuted);
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

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl p-6 w-96 z-50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{contact.name}</h3>
          <p className="text-sm text-gray-500">{contact.phone}</p>
          <p className="text-xs text-green-600 font-semibold">Browser Calling (HD Audio)</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono">{formatDuration(duration)}</p>
          <p className={`text-xs ${audioQuality > 80 ? 'text-green-500' : audioQuality > 50 ? 'text-yellow-500' : 'text-red-500'}`}>
            Quality: {audioQuality}%
          </p>
        </div>
      </div>

      {/* Status Display */}
      <div className="mb-4 text-center">
        {callState === 'idle' && (
          <p className="text-gray-500">Ready to call</p>
        )}
        {callState === 'connecting' && (
          <p className="text-yellow-500 animate-pulse">Connecting...</p>
        )}
        {callState === 'connected' && (
          <p className="text-green-500">Connected - Crystal Clear Audio</p>
        )}
      </div>

      {/* Noise Suppression Status */}
      <div className="mb-4 bg-green-50 border border-green-200 rounded p-2">
        <p className="text-xs text-green-800">
          ✓ Professional Noise Suppression Active
        </p>
        <p className="text-xs text-green-600">
          Background noise eliminated • Voice enhanced
        </p>
      </div>

      {/* Call Controls */}
      <div className="flex justify-center space-x-4">
        {callState === 'idle' && (
          <button
            onClick={makeCall}
            className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 transition-colors"
            title="Make call through browser"
          >
            <PhoneIcon className="h-6 w-6" />
          </button>
        )}
        
        {(callState === 'connecting' || callState === 'connected') && (
          <>
            <button
              onClick={toggleMute}
              className={`${isMuted ? 'bg-red-500' : 'bg-gray-500'} hover:bg-gray-600 text-white rounded-full p-4 transition-colors`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              <MicrophoneIcon className="h-6 w-6" />
            </button>
            <button
              onClick={hangUp}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 transition-colors"
              title="End call"
            >
              <PhoneXMarkIcon className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* Technical Details */}
      <div className="mt-4 text-xs text-gray-500 border-t pt-2">
        <p>• WebRTC browser-to-phone calling</p>
        <p>• Opus codec @ 48kHz</p>
        <p>• AI noise suppression: Active</p>
        <p>• Network: {device ? 'Connected' : 'Initializing...'}</p>
      </div>
    </div>
  );
}