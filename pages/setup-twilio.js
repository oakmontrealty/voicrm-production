import { useState } from 'react';

export default function SetupTwilio() {
  const [credentials, setCredentials] = useState({
    accountSid: '',
    authToken: '',
    phoneNumber: '+61482080888'
  });
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  const testCredentials = async () => {
    setTesting(true);
    setResult(null);

    try {
      // Test the credentials
      const response = await fetch('/api/twilio/verify-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setTesting(false);
    }
  };

  const saveCredentials = async () => {
    // In production, you'd save these securely
    // For now, just show them for manual .env.local update
    const envContent = `
# Twilio Configuration
TWILIO_ACCOUNT_SID=${credentials.accountSid}
TWILIO_AUTH_TOKEN=${credentials.authToken}
TWILIO_PHONE_NUMBER=${credentials.phoneNumber}
`;
    
    setResult({
      success: true,
      message: 'Copy these to your .env.local file:',
      env: envContent
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6">Setup Twilio Credentials</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account SID
            </label>
            <input
              type="text"
              value={credentials.accountSid}
              onChange={(e) => setCredentials({...credentials, accountSid: e.target.value})}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Find this in your Twilio Console dashboard
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Auth Token
            </label>
            <input
              type="password"
              value={credentials.authToken}
              onChange={(e) => setCredentials({...credentials, authToken: e.target.value})}
              placeholder="********************************"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Keep this secret! Found in Twilio Console
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Twilio Phone Number
            </label>
            <input
              type="text"
              value={credentials.phoneNumber}
              onChange={(e) => setCredentials({...credentials, phoneNumber: e.target.value})}
              placeholder="+61482080888"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your Twilio phone number (with country code)
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={testCredentials}
              disabled={testing || !credentials.accountSid || !credentials.authToken}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Test Credentials'}
            </button>
            
            <button
              onClick={saveCredentials}
              disabled={!credentials.accountSid || !credentials.authToken}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Generate .env
            </button>
          </div>
        </div>

        {result && (
          <div className={`mt-6 p-4 rounded-lg ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {result.success ? (
              <div>
                <p className="text-green-800 font-medium">{result.message || 'Success!'}</p>
                {result.env && (
                  <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                    {result.env}
                  </pre>
                )}
                {result.account && (
                  <div className="mt-2 text-sm text-green-700">
                    <p>Account: {result.account.friendly_name}</p>
                    <p>Status: {result.account.status}</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-sm text-red-600 mt-1">{result.error || result.message}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 font-medium mb-2">How to get your credentials:</p>
          <ol className="text-xs text-blue-700 space-y-1">
            <li>1. Go to <a href="https://console.twilio.com" target="_blank" className="underline">console.twilio.com</a></li>
            <li>2. Log in to your account</li>
            <li>3. Find Account SID and Auth Token on the dashboard</li>
            <li>4. Get your phone number from Phone Numbers → Manage</li>
          </ol>
        </div>
      </div>
    </div>
  );
}