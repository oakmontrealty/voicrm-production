import { useState } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, PhoneIcon } from '@heroicons/react/24/solid';

export default function BrowserCallingSetup() {
  const [setupStatus, setSetupStatus] = useState('idle'); // idle, loading, success, error
  const [setupResult, setSetupResult] = useState(null);
  const [error, setError] = useState(null);
  const [testCallStatus, setTestCallStatus] = useState('');

  const setupTwilioApp = async () => {
    setSetupStatus('loading');
    setError(null);
    
    try {
      const response = await fetch('/api/twilio/setup-app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setSetupResult(data);
        setSetupStatus('success');
      } else {
        throw new Error(data.message || 'Setup failed');
      }
    } catch (err) {
      setError(err.message);
      setSetupStatus('error');
    }
  };

  const testBrowserCall = async () => {
    const phoneNumber = prompt('Enter a phone number to test call (e.g., +61412345678):');
    if (!phoneNumber) return;
    
    setTestCallStatus('Initiating browser call...');
    
    try {
      // For this demo, we'll simulate opening the browser phone
      setTestCallStatus('✅ Browser phone component would open here! Check the BrowserPhone component in your app.');
      
      setTimeout(() => {
        setTestCallStatus('');
      }, 5000);
    } catch (error) {
      setTestCallStatus('❌ Test call failed: ' + error.message);
      setTimeout(() => {
        setTestCallStatus('');
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <PhoneIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Browser Calling Setup
            </h1>
            <p className="text-gray-600">
              Set up high-quality browser-to-phone calling without ngrok or external webhooks
            </p>
          </div>

          {/* Current Status */}
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">How It Works</h2>
            <div className="space-y-2 text-sm text-blue-800">
              <p>• Creates TwiML application automatically via Twilio API</p>
              <p>• Uses localhost:3003 for webhook URLs (no ngrok needed!)</p>
              <p>• Configures HD audio with Opus codec and noise suppression</p>
              <p>• Enables browser-to-phone calling through WebRTC</p>
              <p>• Includes call recording and status callbacks</p>
            </div>
          </div>

          {/* Setup Button */}
          <div className="text-center mb-8">
            <button
              onClick={setupTwilioApp}
              disabled={setupStatus === 'loading'}
              className={`px-8 py-3 rounded-lg font-semibold text-white text-lg ${
                setupStatus === 'loading'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {setupStatus === 'loading' ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Setting up...
                </span>
              ) : (
                'Set Up Browser Calling'
              )}
            </button>
          </div>

          {/* Success Result */}
          {setupStatus === 'success' && setupResult && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start">
                <CheckCircleIcon className="h-6 w-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    ✅ Setup Complete!
                  </h3>
                  <div className="text-sm text-green-800 space-y-2">
                    <p><strong>TwiML App SID:</strong> {setupResult.application.sid}</p>
                    <p><strong>Voice URL:</strong> {setupResult.application.voiceUrl}</p>
                    <p><strong>Status Callback:</strong> {setupResult.application.statusCallback}</p>
                  </div>
                  
                  <div className="mt-4 p-3 bg-green-100 rounded border">
                    <p className="text-sm font-medium text-green-900 mb-1">Environment Variable:</p>
                    <code className="text-xs bg-white px-2 py-1 rounded text-green-800">
                      {setupResult.instructions.envVariable}
                    </code>
                    <p className="text-xs text-green-700 mt-1">
                      Add this to your .env.local file
                    </p>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={testBrowserCall}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Test Browser Call
                    </button>
                    {testCallStatus && (
                      <p className="mt-2 text-sm text-green-700">{testCallStatus}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Result */}
          {setupStatus === 'error' && error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">
                    Setup Failed
                  </h3>
                  <p className="text-red-800 text-sm">{error}</p>
                  
                  <div className="mt-4 text-sm text-red-700">
                    <p><strong>Common solutions:</strong></p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Check your Twilio credentials in environment variables</li>
                      <li>Ensure your Twilio account is active and not suspended</li>
                      <li>Verify you have the correct Account SID and Auth Token</li>
                      <li>Make sure your server is running on localhost:3003</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Next Steps */}
          {setupStatus === 'success' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">Next Steps</h3>
              <div className="space-y-2 text-sm text-purple-800">
                <p>1. Add the environment variable above to your .env.local file</p>
                <p>2. Restart your development server</p>
                <p>3. Use the BrowserPhone component in your contacts/leads pages</p>
                <p>4. Test calls will work immediately on localhost:3003</p>
                <p>5. Deploy to production for external access</p>
              </div>
            </div>
          )}

          {/* Technical Details */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Features</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Audio Quality</h4>
                <ul className="space-y-1">
                  <li>• Opus codec for HD voice</li>
                  <li>• 48kHz sampling rate</li>
                  <li>• Professional noise suppression</li>
                  <li>• Echo cancellation</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Connection</h4>
                <ul className="space-y-1">
                  <li>• WebRTC peer-to-peer</li>
                  <li>• STUN/TURN fallbacks</li>
                  <li>• ICE restart capability</li>
                  <li>• Quality of Service marking</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Local Development Note */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p><strong>Local Development:</strong> This setup works for localhost:3003. 
                For production deployment, update the webhook URLs in your TwiML application 
                to use your production domain.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}