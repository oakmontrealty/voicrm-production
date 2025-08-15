import { useState } from 'react';
import Layout from '../components/Layout';

export default function ConnectCall() {
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [status, setStatus] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const connectCall = async () => {
    if (!phone1 || !phone2) {
      setStatus('Please enter both phone numbers');
      return;
    }

    setIsConnecting(true);
    setStatus('Connecting call...');

    try {
      const response = await fetch('/api/twilio/call-forward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phone1,      // First person to call
          callTo: phone2   // Second person to connect to
        })
      });

      const data = await response.json();

      if (data.success) {
        setStatus(`Call connected! Calling ${phone1} and connecting to ${phone2}`);
      } else {
        setStatus(`Failed: ${data.message}`);
      }
    } catch (error) {
      setStatus('Connection error');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-[#F8F2E7] to-[#636B56]/10 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
              Connect Two Phones
            </h1>
            <p className="text-[#7a7a7a] mt-2">Bridge a call between two phone numbers</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="space-y-6">
              {/* Phone 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number 1 (Will receive the call)
                </label>
                <input
                  type="tel"
                  value={phone1}
                  onChange={(e) => setPhone1(e.target.value)}
                  placeholder="e.g., 0456789012"
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                />
              </div>

              {/* Phone 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number 2 (Will be connected to)
                </label>
                <input
                  type="tel"
                  value={phone2}
                  onChange={(e) => setPhone2(e.target.value)}
                  placeholder="e.g., 0456789013"
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                />
              </div>

              {/* Status */}
              {status && (
                <div className={`p-4 rounded-lg text-center ${
                  status.includes('Failed') ? 'bg-red-100 text-red-700' :
                  status.includes('connected') ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {status}
                </div>
              )}

              {/* Connect Button */}
              <button
                onClick={connectCall}
                disabled={isConnecting || !phone1 || !phone2}
                className={`w-full py-4 rounded-lg font-medium transition-all ${
                  isConnecting || !phone1 || !phone2
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#636B56] hover:bg-[#525a48] text-white'
                }`}
              >
                {isConnecting ? 'Connecting...' : 'Connect Call'}
              </button>
            </div>

            {/* How it works */}
            <div className="mt-8 pt-8 border-t">
              <h3 className="font-semibold text-gray-900 mb-3">How it works:</h3>
              <ol className="space-y-2 text-sm text-gray-600">
                <li>1. Twilio calls Phone Number 1</li>
                <li>2. When they answer, it immediately connects them to Phone Number 2</li>
                <li>3. Both parties can talk to each other</li>
                <li>4. The call shows as coming from +61482080888</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}