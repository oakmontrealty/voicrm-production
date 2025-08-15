import { useState } from 'react';
import Layout from '../components/Layout';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

export default function QuickSMS() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const sendSMS = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/twilio/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          to: phoneNumber,
          message: message
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setMessage(''); // Clear message on success
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
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Quick SMS Sender</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+61412345678"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#636B56]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Include country code (e.g., +61 for Australia, +1 for USA)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#636B56]"
              />
              <p className="text-xs text-gray-500 mt-1">
                {message.length}/160 characters (1 SMS)
              </p>
            </div>

            <button
              onClick={sendSMS}
              disabled={!phoneNumber || !message || loading}
              className="w-full py-3 px-4 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                'Sending...'
              ) : (
                <>
                  <PaperAirplaneIcon className="h-5 w-5" />
                  Send SMS
                </>
              )}
            </button>
          </div>

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800">✅ SMS Sent Successfully!</h3>
              <div className="mt-2 text-sm text-green-600">
                <p>Message ID: {result.messageId}</p>
                <p>To: {result.to}</p>
                <p>Status: {result.status}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800">❌ Error Sending SMS</h3>
              <p className="text-red-700 mt-1">{error.error}</p>
              <p className="text-sm text-red-600 mt-1">{error.details}</p>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Quick Templates</h3>
            <div className="space-y-2">
              <button
                onClick={() => setMessage('Hi! This is a test message from VoiCRM.')}
                className="text-sm text-blue-700 hover:underline block text-left"
              >
                → Test message
              </button>
              <button
                onClick={() => setMessage('Thank you for your inquiry. I\'ll get back to you shortly.')}
                className="text-sm text-blue-700 hover:underline block text-left"
              >
                → Thank you response
              </button>
              <button
                onClick={() => setMessage('Your appointment is confirmed for tomorrow. Looking forward to meeting you!')}
                className="text-sm text-blue-700 hover:underline block text-left"
              >
                → Appointment confirmation
              </button>
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg">
            <h3 className="font-semibold text-amber-900 mb-2">Phone Format Examples</h3>
            <div className="text-sm text-amber-700 space-y-1">
              <p>🇦🇺 Australia: +614XXXXXXXX</p>
              <p>🇺🇸 USA: +1XXXXXXXXXX</p>
              <p>🇬🇧 UK: +447XXXXXXXXX</p>
              <p>🇳🇿 NZ: +642XXXXXXXX</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}