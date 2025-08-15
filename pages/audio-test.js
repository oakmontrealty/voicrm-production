import { useState } from 'react';
import Layout from '../components/Layout';

export default function AudioTest() {
  const [status, setStatus] = useState('');
  const [testResults, setTestResults] = useState({});

  const testMicrophone = async () => {
    try {
      setStatus('Testing microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create audio context to analyze input
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let maxLevel = 0;
      const checkLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        maxLevel = Math.max(maxLevel, average);
      };
      
      // Check levels for 3 seconds
      const interval = setInterval(checkLevel, 100);
      
      setTimeout(() => {
        clearInterval(interval);
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        
        setTestResults(prev => ({
          ...prev,
          microphone: maxLevel > 10 ? '✅ Working' : '❌ No audio detected'
        }));
      }, 3000);
      
      setStatus('Speak now to test microphone (3 seconds)...');
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        microphone: '❌ Permission denied'
      }));
    }
  };

  const testTwilioConnection = async () => {
    setStatus('Testing Twilio connection...');
    try {
      const response = await fetch('/api/twilio/token');
      const data = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        twilioToken: data.token ? '✅ Token generated' : '❌ No token'
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        twilioToken: '❌ Connection failed'
      }));
    }
  };

  const makeTestCall = async () => {
    setStatus('Making test call...');
    try {
      const response = await fetch('/api/twilio/outbound-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: '+61456789012' }) // Test number
      });
      
      const data = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        outboundCall: data.success ? '✅ Call initiated' : '❌ Call failed'
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        outboundCall: '❌ API error'
      }));
    }
  };

  const runAllTests = async () => {
    setTestResults({});
    await testMicrophone();
    await testTwilioConnection();
    await makeTestCall();
    setStatus('All tests complete');
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-[#F8F2E7] to-[#636B56]/10 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
              Audio System Test
            </h1>
            <p className="text-[#7a7a7a] mt-2">Test your audio setup and Twilio connection</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Status */}
            {status && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg text-blue-700 text-center">
                {status}
              </div>
            )}

            {/* Test Results */}
            {Object.keys(testResults).length > 0 && (
              <div className="mb-6 space-y-3">
                <h3 className="font-semibold text-lg mb-3">Test Results:</h3>
                {Object.entries(testResults).map(([test, result]) => (
                  <div key={test} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="capitalize">{test.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className={result.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                      {result}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Test Buttons */}
            <div className="space-y-3">
              <button
                onClick={testMicrophone}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
              >
                Test Microphone
              </button>
              
              <button
                onClick={testTwilioConnection}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium"
              >
                Test Twilio Connection
              </button>
              
              <button
                onClick={makeTestCall}
                className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium"
              >
                Make Test Call
              </button>
              
              <button
                onClick={runAllTests}
                className="w-full py-3 bg-[#636B56] hover:bg-[#525a48] text-white rounded-lg font-medium"
              >
                Run All Tests
              </button>
            </div>

            {/* Info Box */}
            <div className="mt-8 p-6 bg-yellow-50 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">Audio Issue Diagnosis</h3>
              <div className="text-sm text-yellow-700 space-y-2">
                <p><strong>Current Problem:</strong> You can hear your own voice (888 number) but not the recipient's voice.</p>
                <p><strong>This means:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>✅ Your microphone is working</li>
                  <li>✅ Browser-to-Twilio connection works</li>
                  <li>✅ Twilio-to-phone connection works</li>
                  <li>❌ Phone-to-browser audio return path is broken</li>
                </ul>
                <p className="mt-3"><strong>Likely cause:</strong> The WebRTC audio stream isn't properly receiving the return audio from Twilio.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}