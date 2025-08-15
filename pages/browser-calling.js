import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { 
  PhoneIcon, 
  PhoneXMarkIcon, 
  MicrophoneIcon, 
  SpeakerWaveIcon,
  SpeakerXMarkIcon 
} from '@heroicons/react/24/solid';
import Script from 'next/script';

export default function BrowserCalling() {
  const [device, setDevice] = useState(null);
  const [connection, setConnection] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callStatus, setCallStatus] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState('');
  
  const timerRef = useRef(null);
  const deviceRef = useRef(null);

  useEffect(() => {
    // Initialize on component mount
    initializeTwilio();
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (deviceRef.current) {
        deviceRef.current.destroy();
      }
    };
  }, []);

  const initializeTwilio = async () => {
    try {
      setCallStatus('Initializing...');
      setError('');
      
      // Get access token
      const response = await fetch('/api/twilio/token', {
        method: 'GET'
      });
      
      const data = await response.json();
      
      if (!data.success || !data.token) {
        throw new Error('Failed to get access token');
      }

      // Wait for Twilio SDK to load
      const checkTwilio = setInterval(() => {
        if (window.Twilio && window.Twilio.Device) {
          clearInterval(checkTwilio);
          
          console.log('Initializing Twilio Device with token');
          
          // Initialize Twilio Device  
          const twilioDevice = new window.Twilio.Device(data.token, {
            debug: true,
            answerOnBridge: true,
            codecPreferences: ['opus', 'pcmu'],
            edge: 'sydney', // Use Sydney edge for better latency in Australia
            enableRingingState: true
          });

          // Register event handlers
          twilioDevice.on('ready', (device) => {
            console.log('Twilio Device Ready!');
            setIsReady(true);
            setCallStatus('Ready to call');
            setError('');
          });

          twilioDevice.on('error', (error) => {
            console.error('Twilio Device Error:', error);
            setError(error.message || 'Device error');
            setCallStatus('Error: ' + (error.message || 'Unknown error'));
            
            // Try to reinitialize on certain errors
            if (error.code === 31003 || error.code === 31005) {
              setTimeout(() => initializeTwilio(), 3000);
            }
          });

          twilioDevice.on('connect', (conn) => {
            console.log('Call connected');
            setConnection(conn);
            setIsInCall(true);
            setCallStatus('Connected');
            startTimer();
          });

          twilioDevice.on('disconnect', (conn) => {
            console.log('Call disconnected');
            setConnection(null);
            setIsInCall(false);
            setCallStatus('Call ended');
            stopTimer();
            setTimeout(() => setCallStatus('Ready to call'), 2000);
          });

          twilioDevice.on('incoming', (conn) => {
            console.log('Incoming call from', conn.parameters.From);
            setCallStatus(`Incoming call from ${conn.parameters.From}`);
            
            // Auto-answer for demo
            conn.accept();
          });

          twilioDevice.on('cancel', () => {
            console.log('Call cancelled');
            setIsInCall(false);
            setCallStatus('Call cancelled');
          });

          setDevice(twilioDevice);
          deviceRef.current = twilioDevice;
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkTwilio);
        if (!isReady) {
          setError('Twilio SDK failed to load');
          setCallStatus('Failed to initialize - please refresh');
        }
      }, 10000);
      
    } catch (err) {
      console.error('Initialization error:', err);
      setError(err.message);
      setCallStatus('Failed to initialize');
    }
  };

  const makeCall = () => {
    if (!device || !phoneNumber) {
      console.log('Cannot make call - device not ready or no number');
      return;
    }

    try {
      setCallStatus('Connecting...');
      
      // Format the phone number
      let formattedNumber = phoneNumber.replace(/\D/g, '');
      if (!formattedNumber.startsWith('+')) {
        if (formattedNumber.startsWith('0')) {
          formattedNumber = '+61' + formattedNumber.substring(1);
        } else if (formattedNumber.length === 10) {
          formattedNumber = '+1' + formattedNumber;
        } else if (!formattedNumber.startsWith('61')) {
          formattedNumber = '+61' + formattedNumber;
        } else {
          formattedNumber = '+' + formattedNumber;
        }
      }
      
      const params = {
        To: formattedNumber
      };

      console.log('Making call to:', formattedNumber);
      device.connect(params);
    } catch (err) {
      console.error('Call error:', err);
      setError(err.message);
      setCallStatus('Call failed');
    }
  };

  const endCall = () => {
    if (connection) {
      connection.disconnect();
    } else if (device) {
      device.disconnectAll();
    }
  };

  const toggleMute = () => {
    if (connection) {
      const newMuteState = !isMuted;
      connection.mute(newMuteState);
      setIsMuted(newMuteState);
    }
  };

  const toggleSpeaker = () => {
    setSpeakerOn(!speakerOn);
    // Note: Speaker control would need native app integration
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
      timerRef.current = null;
    }
    setCallDuration(0);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhoneDisplay = (value) => {
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    if (cleaned.length <= 10) return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  };

  return (
    <>
      <Script 
        src="//sdk.twilio.com/js/client/v1.14/twilio.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Twilio SDK script loaded');
          // SDK is loaded, initialization will happen in useEffect
        }}
        onError={(e) => {
          console.error('Failed to load Twilio SDK:', e);
          setError('Failed to load Twilio SDK');
          setCallStatus('SDK load failed');
        }}
      />
      
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-[#F8F2E7] to-[#636B56]/10 py-8">
          <div className="max-w-4xl mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
                Browser-Based Calling
              </h1>
              <p className="text-[#7a7a7a] mt-2">True 2-way calling directly from your browser</p>
            </div>

            {/* Status Bar */}
            {callStatus && (
              <div className={`text-center mb-6 ${error ? 'text-red-600' : ''}`}>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                  isInCall ? 'bg-green-100 text-green-700' :
                  error ? 'bg-red-100 text-red-700' :
                  isReady ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {isInCall && <span className="animate-pulse">●</span>}
                  {callStatus}
                  {isInCall && callDuration > 0 && (
                    <span className="ml-2 font-mono">{formatDuration(callDuration)}</span>
                  )}
                </div>
              </div>
            )}

            {/* Main Call Interface */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {!isInCall ? (
                // Dial Screen
                <div className="space-y-6">
                  <div className="text-center">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter phone number"
                      className="text-3xl font-light text-center w-full border-b-2 border-gray-200 focus:border-[#636B56] outline-none pb-2 transition-colors"
                      disabled={!isReady}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Format: +61456789012 or 0456789012
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={makeCall}
                      disabled={!isReady || !phoneNumber}
                      className={`group relative flex items-center justify-center w-20 h-20 rounded-full transition-all ${
                        isReady && phoneNumber
                          ? 'bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-xl transform hover:scale-105'
                          : 'bg-gray-300 cursor-not-allowed'
                      }`}
                    >
                      <PhoneIcon className="w-8 h-8 text-white" />
                    </button>
                  </div>

                  {/* Quick Dial */}
                  <div className="border-t pt-6">
                    <h3 className="text-sm font-semibold text-gray-600 mb-3">Quick Dial</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {['+61456789012', '+61400000000', '+1234567890'].map((num) => (
                        <button
                          key={num}
                          onClick={() => setPhoneNumber(num)}
                          disabled={!isReady}
                          className="px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // In-Call Screen
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-3xl font-light">{formatPhoneDisplay(phoneNumber)}</h2>
                    <p className="text-lg text-gray-600 mt-2">
                      {formatDuration(callDuration)}
                    </p>
                  </div>

                  {/* Call Controls */}
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={toggleMute}
                      className={`p-4 rounded-full transition-all ${
                        isMuted 
                          ? 'bg-red-100 text-red-600' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {isMuted ? (
                        <div className="relative">
                          <MicrophoneIcon className="w-6 h-6" />
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="w-8 h-0.5 bg-red-600 rotate-45"></span>
                          </span>
                        </div>
                      ) : (
                        <MicrophoneIcon className="w-6 h-6" />
                      )}
                    </button>

                    <button
                      onClick={endCall}
                      className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all transform hover:scale-105"
                    >
                      <PhoneXMarkIcon className="w-8 h-8" />
                    </button>

                    <button
                      onClick={toggleSpeaker}
                      className={`p-4 rounded-full transition-all ${
                        speakerOn 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {speakerOn ? <SpeakerWaveIcon className="w-6 h-6" /> : <SpeakerXMarkIcon className="w-6 h-6" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Info Cards */}
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="font-semibold text-[#636B56] mb-3">Browser Calling Features</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    True 2-way audio communication
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Works on any modern browser
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    No app installation required
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Call any phone number globally
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Crystal clear WebRTC audio
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-[#636B56] to-[#864936] rounded-xl p-6 shadow-lg text-white">
                <h3 className="font-semibold mb-3">Setup Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Twilio Account</span>
                    <span className="text-green-300">✓ Connected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Phone Number</span>
                    <span className="text-green-300">+61482080888</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Voice SDK</span>
                    <span className={isReady ? 'text-green-300' : 'text-yellow-300'}>
                      {isReady ? '✓ Ready' : 'Loading...'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Browser Support</span>
                    <span className="text-green-300">✓ Compatible</span>
                  </div>
                </div>
                
                {/* Retry button if not ready */}
                {!isReady && (
                  <button
                    onClick={initializeTwilio}
                    className="mt-4 w-full bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                  >
                    Retry Initialization
                  </button>
                )}
              </div>
            </div>

            {/* Alternative Solution */}
            {error && (
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <h3 className="font-semibold text-yellow-800 mb-2">Alternative: Use Simple Dialer</h3>
                <p className="text-sm text-yellow-700 mb-3">
                  If browser calling isn't loading, you can use our Simple Dialer which works through standard phone calls.
                </p>
                <a 
                  href="/simple-dialer"
                  className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Go to Simple Dialer →
                </a>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}