import { useState } from 'react';
import FullBrowserPhone from '../components/voice/FullBrowserPhone';

export default function PhonePage() {
  const [callHistory, setCallHistory] = useState([]);

  const handleCallEnd = (duration) => {
    const callRecord = {
      timestamp: new Date().toLocaleString(),
      duration: Math.floor(duration / 60) + 'm ' + (duration % 60) + 's',
      status: 'completed'
    };
    
    setCallHistory(prev => [callRecord, ...prev.slice(0, 9)]); // Keep last 10 calls
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            VoiCRM Browser Phone
          </h1>
          <p className="text-gray-600 text-lg">
            High-quality browser-to-phone calling with noise suppression
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Phone Interface */}
          <div className="lg:col-span-2 flex justify-center">
            <FullBrowserPhone onCallEnd={handleCallEnd} />
          </div>

          {/* Sidebar with Call History and Features */}
          <div className="space-y-6">
            
            {/* Features */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>HD Audio (48kHz Opus Codec)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Professional Noise Suppression</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Echo Cancellation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Two-way Conversation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>DTMF Tones (keypad during calls)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Real-time Quality Monitoring</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>No ngrok Required</span>
                </div>
              </div>
            </div>

            {/* Setup Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Quick Setup</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p>1. Visit <a href="/browser-calling-setup" className="underline font-medium">Setup Page</a></p>
                <p>2. Click "Set Up Browser Calling"</p>
                <p>3. Add the TwiML App SID to your .env.local</p>
                <p>4. Restart your server</p>
                <p>5. Start making HD calls!</p>
              </div>
            </div>

            {/* Call History */}
            {callHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Calls</h3>
                <div className="space-y-3">
                  {callHistory.map((call, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                      <div>
                        <div className="text-sm text-gray-600">{call.timestamp}</div>
                        <div className="text-xs text-gray-500">Duration: {call.duration}</div>
                      </div>
                      <div className="text-xs text-green-600 font-medium">
                        {call.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Info */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Details</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Protocol:</strong> WebRTC</p>
                <p><strong>Audio Codec:</strong> Opus (preferred), PCMU fallback</p>
                <p><strong>Sample Rate:</strong> 48kHz</p>
                <p><strong>Channels:</strong> Mono (optimized for voice)</p>
                <p><strong>Latency:</strong> ~10ms (real-time)</p>
                <p><strong>Connection:</strong> STUN/TURN with fallbacks</p>
                <p><strong>Quality:</strong> Adaptive based on network</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Professional Browser Calling
            </h3>
            <p className="text-gray-700 mb-4">
              This browser phone provides professional-grade calling directly from your web browser. 
              It uses WebRTC technology to establish high-quality voice connections, with advanced 
              noise suppression and echo cancellation for crystal-clear conversations.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-600">
              <div>
                <strong className="text-gray-900">For Sales Teams</strong>
                <p>Make calls directly from contact records without switching between apps.</p>
              </div>
              <div>
                <strong className="text-gray-900">For Support</strong>
                <p>Handle customer calls with automatic recording and transcription.</p>
              </div>
              <div>
                <strong className="text-gray-900">For Remote Work</strong>
                <p>Professional calling from anywhere with just a browser and internet connection.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}