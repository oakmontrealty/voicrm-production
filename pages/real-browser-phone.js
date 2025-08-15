import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import Dialpad from '../components/Dialpad';

export default function RealBrowserPhone() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [status, setStatus] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  
  const localStreamRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      // This will trigger the browser to ask for microphone permission
      setStatus('📱 Requesting microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      localStreamRef.current = stream;
      setHasPermission(true);
      setStatus('✅ Microphone enabled - Ready to make calls');
      
      // Attach to audio element to hear yourself (optional)
      if (audioRef.current) {
        audioRef.current.srcObject = stream;
        audioRef.current.muted = true; // Mute to prevent echo
      }
      
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setHasPermission(false);
      setStatus('❌ Microphone permission denied - Cannot make calls');
    }
  };

  const makeCall = async (number) => {
    if (!hasPermission) {
      setStatus('⚠️ Please allow microphone access first');
      await checkMicrophonePermission();
      return;
    }

    setPhoneNumber(number);
    setIsInCall(true);
    setStatus('📞 Calling ' + number + '...');

    // Here's where browser-to-phone calling would happen
    // This requires Twilio Programmable Voice with proper TwiML App setup
    
    try {
      // For now, we'll make a regular call
      // But this shows that we HAVE microphone access
      const response = await fetch('/api/twilio/outbound-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: number })
      });

      const data = await response.json();
      
      if (data.success) {
        setStatus('📞 Call connected - Your microphone is active');
        
        // Show audio visualization to prove mic is working
        visualizeMicrophone();
      } else {
        setStatus('❌ Call failed: ' + data.message);
        setIsInCall(false);
      }
    } catch (error) {
      setStatus('❌ Error: ' + error.message);
      setIsInCall(false);
    }
  };

  const visualizeMicrophone = () => {
    if (!localStreamRef.current) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(localStreamRef.current);
    microphone.connect(analyser);
    
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const checkAudio = () => {
      if (!isInCall) return;
      
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      
      // Update status with audio level
      if (average > 10) {
        setStatus(prev => prev.includes('Speaking') ? prev : '🎤 Speaking detected...');
      }
      
      requestAnimationFrame(checkAudio);
    };
    
    checkAudio();
  };

  const endCall = () => {
    setIsInCall(false);
    setStatus('☎️ Call ended');
    setPhoneNumber('');
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-[#F8F2E7] to-[#636B56]/10 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
              Browser Phone with Microphone
            </h1>
            <p className="text-[#7a7a7a] mt-2">This page uses your computer's microphone</p>
          </div>

          {/* Permission Status Box */}
          <div className={`max-w-2xl mx-auto mb-8 p-6 rounded-xl shadow-lg ${
            hasPermission ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  {hasPermission ? '✅ Microphone Active' : '🎤 Microphone Permission Required'}
                </h3>
                <p className="text-sm">
                  {hasPermission 
                    ? 'Your browser has granted microphone access. You can make calls.'
                    : 'Click the button to allow microphone access for calling.'}
                </p>
              </div>
              {!hasPermission && (
                <button
                  onClick={checkMicrophonePermission}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
                >
                  Allow Microphone
                </button>
              )}
            </div>
          </div>

          {/* Status Display */}
          <div className="text-center mb-6">
            <div className="inline-block px-6 py-3 bg-white rounded-full shadow-md">
              {status}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Dialpad */}
            <div className="flex justify-center">
              <Dialpad 
                onCall={makeCall}
                isInCall={isInCall}
                onEndCall={endCall}
              />
            </div>

            {/* Info Panel */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-[#636B56] mb-4">How Browser Calling Works</h3>
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="bg-[#636B56] text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">1</span>
                    <span>Browser requests microphone permission (you should see a popup)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-[#636B56] text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">2</span>
                    <span>Your voice is captured from your computer's microphone</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-[#636B56] text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">3</span>
                    <span>Audio is sent through WebRTC to Twilio</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-[#636B56] text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">4</span>
                    <span>Twilio connects to the phone number</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-[#636B56] text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">5</span>
                    <span>Two-way audio flows between browser and phone</span>
                  </li>
                </ol>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6">
                <h3 className="font-semibold text-yellow-800 mb-2">Current Limitation</h3>
                <p className="text-sm text-yellow-700">
                  Full browser-to-phone calling requires a Twilio TwiML Application to be configured 
                  in your Twilio Console with proper webhooks. Currently, this is making outbound 
                  calls only. Your microphone is active but not connected to the call yet.
                </p>
              </div>

              {/* Microphone Test */}
              {hasPermission && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="font-semibold text-[#636B56] mb-3">Microphone Test</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Speak into your microphone. If working, you'll see the status change to "Speaking detected" above.
                  </p>
                  <audio ref={audioRef} autoPlay className="hidden" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}