import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

export default function PhoneManagement() {
  const [numbers, setNumbers] = useState([]);
  const [availableNumbers, setAvailableNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([
    { id: 1, name: 'John Smith', role: 'Senior Agent', number: null },
    { id: 2, name: 'Sarah Wilson', role: 'Agent', number: null },
    { id: 3, name: 'Michael Chen', role: 'Agent', number: null },
    { id: 4, name: 'Emma Thompson', role: 'Junior Agent', number: null },
    { id: 5, name: 'Carousel Line 1', role: 'Carousel', number: null },
    { id: 6, name: 'Carousel Line 2', role: 'Carousel', number: null },
    { id: 7, name: 'Carousel Line 3', role: 'Carousel', number: null },
  ]);

  useEffect(() => {
    fetchNumbers();
  }, []);

  const fetchNumbers = async () => {
    try {
      const response = await fetch('/api/twilio/manage-numbers');
      const data = await response.json();
      setNumbers(data.current);
      setAvailableNumbers(data.available);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching numbers:', error);
      setLoading(false);
    }
  };

  const purchaseNumber = async (phoneNumber, assignTo) => {
    if (!confirm(`Purchase ${phoneNumber} for ${assignTo}? This will charge your Twilio account ~$3 AUD/month.`)) {
      return;
    }

    try {
      const response = await fetch('/api/twilio/manage-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'purchase',
          phoneNumber,
          assignTo
        })
      });

      if (response.ok) {
        alert(`Successfully purchased ${phoneNumber}`);
        fetchNumbers();
      }
    } catch (error) {
      alert('Failed to purchase number: ' + error.message);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
            Phone Number Management
          </h1>
          <p className="text-gray-600 mt-2">Manage Australian phone numbers for staff and carousel</p>
        </div>

        {/* Current Numbers */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Your Numbers</h2>
          <div className="space-y-3">
            {numbers.length > 0 ? (
              numbers.map(num => (
                <div key={num.sid} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{num.phoneNumber}</p>
                    <p className="text-sm text-gray-600">{num.friendlyName}</p>
                  </div>
                  <div className="flex gap-2">
                    {num.capabilities.voice && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Voice</span>
                    )}
                    {num.capabilities.SMS && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">SMS</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">You currently have 1 number: +61482080888</p>
            )}
          </div>
        </div>

        {/* Staff Assignment */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Staff & Carousel Numbers</h2>
          <div className="text-sm text-gray-600 mb-4">
            Each staff member and carousel line needs their own Australian number
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staff.map(member => (
              <div key={member.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-sm text-gray-600">{member.role}</p>
                  </div>
                  {member.number ? (
                    <div className="text-right">
                      <p className="text-sm font-medium">{member.number}</p>
                      <p className="text-xs text-green-600">Active</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        // Show available numbers to purchase
                        const selectedNumber = prompt(
                          'Enter an Australian number to purchase (e.g., +61412345678):'
                        );
                        if (selectedNumber) {
                          purchaseNumber(selectedNumber, member.name);
                        }
                      }}
                      className="px-3 py-1 bg-[#636B56] text-white rounded text-sm hover:bg-[#7a8365]"
                    >
                      Get Number
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">How to Add Australian Numbers:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Go to <a href="https://console.twilio.com/us1/develop/phone-numbers/manage/search" target="_blank" className="underline">Twilio Console</a></li>
            <li>Click "Buy a Number"</li>
            <li>Select Country: <strong>Australia</strong></li>
            <li>Choose Number Type: <strong>Local</strong> or <strong>Mobile</strong></li>
            <li>Select capabilities: <strong>Voice</strong> and <strong>SMS</strong></li>
            <li>Choose from available numbers (typically $3-5 AUD/month each)</li>
            <li>Purchase and configure webhook URLs to: <code>https://voicrm.com/api/twilio/voice</code></li>
          </ol>
          
          <div className="mt-4 p-3 bg-white rounded">
            <p className="text-sm font-medium text-gray-700">Recommended Setup:</p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>• <strong>4 Staff Numbers:</strong> Individual direct lines for each agent</li>
              <li>• <strong>3 Carousel Numbers:</strong> Rotating numbers for campaigns</li>
              <li>• <strong>1 Main Number:</strong> You already have +61482080888</li>
              <li className="font-semibold">Total: 8 numbers × $3 = ~$24 AUD/month</li>
            </ul>
          </div>
        </div>

        {/* Available Numbers Preview */}
        {availableNumbers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#636B56] mb-3">Available Australian Numbers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableNumbers.slice(0, 6).map((num, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-mono">{num.phoneNumber}</p>
                    <p className="text-xs text-gray-600">{num.locality}, {num.region}</p>
                  </div>
                  <button
                    onClick={() => purchaseNumber(num.phoneNumber, 'Unassigned')}
                    className="text-[#636B56] hover:underline text-sm"
                  >
                    Purchase
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}