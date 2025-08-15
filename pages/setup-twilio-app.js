import { useState } from 'react';

export default function SetupTwilioApp() {
  const [status, setStatus] = useState('');
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">Setup Two-Way Calling</h1>
          
          <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Option 1: Use Twilio Console (Easiest)</h2>
              <ol className="space-y-3 text-sm">
                <li className="flex">
                  <span className="font-bold mr-2">1.</span>
                  <div>
                    Go to <a href="https://console.twilio.com/console/voice/twiml/apps" target="_blank" className="text-blue-600 underline">
                      Twilio TwiML Apps
                    </a>
                  </div>
                </li>
                <li className="flex">
                  <span className="font-bold mr-2">2.</span>
                  <div>
                    Click "Create new TwiML App" or edit existing
                  </div>
                </li>
                <li className="flex">
                  <span className="font-bold mr-2">3.</span>
                  <div>
                    Set Voice URL to: <code className="bg-gray-100 px-2 py-1 rounded">http://demo.twilio.com/docs/voice.xml</code>
                    <br />
                    (This is temporary for testing)
                  </div>
                </li>
                <li className="flex">
                  <span className="font-bold mr-2">4.</span>
                  <div>
                    Copy the Application SID (starts with AP...)
                  </div>
                </li>
                <li className="flex">
                  <span className="font-bold mr-2">5.</span>
                  <div>
                    Add to your .env.local: <code className="bg-gray-100 px-2 py-1 rounded">TWILIO_APP_SID=APxxxxx</code>
                  </div>
                </li>
              </ol>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Option 2: Use Ngrok (For Local Development)</h2>
              <ol className="space-y-3 text-sm">
                <li className="flex">
                  <span className="font-bold mr-2">1.</span>
                  <div>
                    Install ngrok: <code className="bg-gray-100 px-2 py-1 rounded">npm install -g ngrok</code>
                  </div>
                </li>
                <li className="flex">
                  <span className="font-bold mr-2">2.</span>
                  <div>
                    Run: <code className="bg-gray-100 px-2 py-1 rounded">ngrok http 3003</code>
                  </div>
                </li>
                <li className="flex">
                  <span className="font-bold mr-2">3.</span>
                  <div>
                    Copy your ngrok URL (like https://abc123.ngrok.io)
                  </div>
                </li>
                <li className="flex">
                  <span className="font-bold mr-2">4.</span>
                  <div>
                    In Twilio Console, set Voice URL to:<br />
                    <code className="bg-gray-100 px-2 py-1 rounded">https://YOUR-NGROK-URL.ngrok.io/api/twilio/voice</code>
                  </div>
                </li>
              </ol>
            </div>

            <div className="bg-yellow-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Option 3: Deploy to Production</h2>
              <p className="text-sm mb-3">Deploy your app to Vercel/Netlify and use the production URL:</p>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                https://your-app.vercel.app/api/twilio/voice
              </code>
            </div>

            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">Why do I need this?</h3>
              <p className="text-sm text-gray-700">
                For browser-based calling, Twilio needs to know where to send the call instructions. 
                Since your app is running locally (localhost), Twilio can't reach it directly from the internet. 
                That's why we need either ngrok (to tunnel to your local server) or deploy it online.
              </p>
            </div>

            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold mb-2">Quick Alternative: Phone-to-Phone Calling</h3>
              <p className="text-sm text-gray-700 mb-3">
                If you just want to test making calls right now, you can use our direct calling API 
                which connects two phone numbers (without browser audio):
              </p>
              <button
                onClick={async () => {
                  const number = prompt('Enter phone number to call:');
                  if (number) {
                    setStatus('Calling...');
                    const res = await fetch('/api/twilio/make-direct-call', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ to: number })
                    });
                    const data = await res.json();
                    setStatus(data.success ? 'Call initiated!' : 'Call failed');
                  }
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Make Test Call (Phone-to-Phone)
              </button>
              {status && <p className="mt-2 text-sm">{status}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}