import { useState } from 'react';
import Layout from '../components/Layout';

export default function Whisperer() {
  const [isActive, setIsActive] = useState(true);
  const [suggestions, setSuggestions] = useState([
    "Mention the property's proximity to schools",
    "Ask about their timeline for moving",
    "Offer to schedule a viewing this weekend",
    "Highlight the recent renovations"
  ]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
            AI Whisperer
          </h1>
          <p className="text-[#7a7a7a] mt-2">Real-time AI assistance during live calls</p>
        </div>

        {/* Whisperer Status */}
        <div className="bg-gradient-to-r from-[#636B56] to-[#864936] rounded-xl shadow-sm p-6 text-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <span className="inline-block w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></span>
              Whisperer Active
            </h2>
            <button 
              onClick={() => setIsActive(!isActive)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-gray-500 hover:bg-gray-600'
              }`}
            >
              {isActive ? '✓ Enabled' : 'Disabled'}
            </button>
          </div>
          <p className="text-sm opacity-90">
            AI listens to your calls and provides real-time suggestions and insights to help close deals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Live Suggestions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-[#636B56] mb-4">Live Suggestions</h2>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-blue-500 mr-2">💡</span>
                  <p className="text-sm text-gray-700">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Call Context */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-[#636B56] mb-4">Call Context</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Current Topic</p>
                <p className="font-medium">Property Features</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Customer Sentiment</p>
                <div className="flex items-center mt-1">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <span className="ml-2 text-sm">Positive</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Key Points Mentioned</p>
                <ul className="mt-1 text-sm space-y-1">
                  <li>• Budget: $800,000 - $900,000</li>
                  <li>• Looking for 4 bedrooms</li>
                  <li>• Prefers quiet neighborhood</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Whisperer Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-2 border-[#636B56] bg-gradient-to-br from-[#636B56]/5 to-[#864936]/5 rounded-lg p-4">
              <h3 className="font-medium mb-2 text-[#636B56]">🎯 Objection Handling</h3>
              <p className="text-sm text-gray-700">Real-time suggestions to overcome customer objections</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">📊 Sentiment Analysis</h3>
              <p className="text-sm text-gray-600">Track customer mood and engagement throughout the call</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">📝 Auto Notes</h3>
              <p className="text-sm text-gray-600">Automatically captures key points and action items</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">💬 Script Suggestions</h3>
              <p className="text-sm text-gray-600">Dynamic script recommendations based on conversation flow</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">🔍 Property Matching</h3>
              <p className="text-sm text-gray-600">Instantly suggests properties based on customer preferences</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">⏰ Next Steps</h3>
              <p className="text-sm text-gray-600">Recommends follow-up actions and timing</p>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Whisperer Settings</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span>Show suggestions during calls</span>
              <input type="checkbox" defaultChecked className="toggle" />
            </label>
            <label className="flex items-center justify-between">
              <span>Auto-capture call notes</span>
              <input type="checkbox" defaultChecked className="toggle" />
            </label>
            <label className="flex items-center justify-between">
              <span>Sentiment analysis overlay</span>
              <input type="checkbox" defaultChecked className="toggle" />
            </label>
            <label className="flex items-center justify-between">
              <span>Property recommendations</span>
              <input type="checkbox" defaultChecked className="toggle" />
            </label>
          </div>
        </div>
      </div>
    </Layout>
  );
}