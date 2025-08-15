import { useState } from 'react';
import Layout from '../components/Layout';

export default function TestSMS() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const sendTestSMS = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/twilio/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data);
      }
    } catch (err) {
      setError({ error: 'Network error', details: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Test SMS Functionality</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number (with country code)
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+61482080888"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter your phone number with country code (e.g., +61 for Australia, +1 for USA)
            </p>
          </div>

          <button
            onClick={sendTestSMS}
            disabled={!phoneNumber || loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Test SMS'}
          </button>

          {result && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800">Success!</h3>
              <p className="text-green-700">{result.message}</p>
              <div className="mt-2 text-sm text-green-600">
                <p>Message SID: {result.details.messageSid}</p>
                <p>Status: {result.details.status}</p>
                <p>To: {result.details.to}</p>
                <p>From: {result.details.from}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-700">{error.error}</p>
              <p className="text-sm text-red-600 mt-1">{error.details}</p>
              {error.code && <p className="text-sm text-red-600">Code: {error.code}</p>}
              {error.moreInfo && (
                <a href={error.moreInfo} target="_blank" rel="noopener noreferrer" className="text-sm text-red-600 underline">
                  More information
                </a>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900">Troubleshooting Tips:</h3>
          <ul className="list-disc list-inside text-sm text-blue-800 mt-2">
            <li>Make sure the phone number includes the country code</li>
            <li>Australian numbers should start with +61</li>
            <li>Remove any spaces or dashes from the number</li>
            <li>For Australian mobiles, format should be +614XXXXXXXX</li>
            <li>Check that Twilio account has SMS credits</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}