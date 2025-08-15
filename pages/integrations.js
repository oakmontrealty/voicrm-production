import { useState } from 'react';
import Layout from '../components/Layout';

export default function Integrations() {
  const [gmailConnected, setGmailConnected] = useState(false);
  const [aiMonitoring, setAiMonitoring] = useState(false);
  const [emailStats, setEmailStats] = useState({
    totalEmails: 1247,
    unread: 23,
    pendingReply: 15,
    autoResponded: 89,
    flaggedUrgent: 5
  });

  const handleGmailConnect = () => {
    // In production, this would initiate OAuth flow
    window.open('https://accounts.google.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=https://www.googleapis.com/auth/gmail.readonly+https://www.googleapis.com/auth/gmail.send&response_type=code', '_blank');
    // Simulate connection for demo
    setTimeout(() => {
      setGmailConnected(true);
      setAiMonitoring(true);
    }, 2000);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
            Integrations
          </h1>
          <p className="text-[#7a7a7a] mt-2">Connect your favorite tools and services</p>
        </div>

        {/* Gmail AI Integration */}
        <div className="bg-gradient-to-r from-[#636B56] to-[#864936] rounded-xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold mb-2 flex items-center">
                <span className="mr-3">📧</span>
                Gmail AI Monitor
              </h2>
              <p className="text-sm opacity-90 mb-4">
                AI automatically monitors your Gmail inbox, responds to inquiries, and ensures no email goes unanswered
              </p>
              
              {gmailConnected && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                  <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                    <p className="text-2xl font-bold">{emailStats.totalEmails}</p>
                    <p className="text-xs opacity-90">Total Emails</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                    <p className="text-2xl font-bold">{emailStats.unread}</p>
                    <p className="text-xs opacity-90">Unread</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                    <p className="text-2xl font-bold">{emailStats.pendingReply}</p>
                    <p className="text-xs opacity-90">Pending Reply</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                    <p className="text-2xl font-bold">{emailStats.autoResponded}</p>
                    <p className="text-xs opacity-90">Auto-Responded</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                    <p className="text-2xl font-bold text-yellow-300">{emailStats.flaggedUrgent}</p>
                    <p className="text-xs opacity-90">Urgent</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-right">
              {gmailConnected ? (
                <div>
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                    ✓ Connected
                  </span>
                  <div className="mt-4">
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={aiMonitoring}
                        onChange={(e) => setAiMonitoring(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">AI Monitoring Active</span>
                    </label>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleGmailConnect}
                  className="bg-white text-[#636B56] px-4 py-2 rounded-lg hover:bg-white/90 transition-colors font-medium"
                >
                  Connect Gmail
                </button>
              )}
            </div>
          </div>

          {gmailConnected && aiMonitoring && (
            <div className="mt-6 p-4 bg-white/10 backdrop-blur rounded-lg">
              <h3 className="font-medium mb-3">AI Monitoring Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-300">✓</span>
                  Auto-categorize property inquiries
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-300">✓</span>
                  Instant response to common questions
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-300">✓</span>
                  Flag urgent client emails
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-300">✓</span>
                  Schedule viewing appointments
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-300">✓</span>
                  Extract contact information
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-300">✓</span>
                  Create follow-up reminders
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Other Integrations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Twilio */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  📞
                </div>
                <div>
                  <h3 className="font-semibold">Twilio</h3>
                  <p className="text-sm text-gray-600">Voice & SMS</p>
                </div>
              </div>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Connected</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">Powering all voice calls and text messaging</p>
            <button className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
              Configure
            </button>
          </div>

          {/* Pipedrive */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  💼
                </div>
                <div>
                  <h3 className="font-semibold">Pipedrive</h3>
                  <p className="text-sm text-gray-600">CRM Sync</p>
                </div>
              </div>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Connected</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">1,247 contacts imported and syncing</p>
            <button className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
              Sync Now
            </button>
          </div>

          {/* Zapier */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  ⚡
                </div>
                <div>
                  <h3 className="font-semibold">Zapier</h3>
                  <p className="text-sm text-gray-600">Automation</p>
                </div>
              </div>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Setup Required</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">Connect to 5,000+ apps</p>
            <button className="w-full bg-[#636B56] text-white px-3 py-2 rounded-lg hover:bg-[#7a8365] transition-colors text-sm">
              Connect
            </button>
          </div>

          {/* Google Calendar */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  📅
                </div>
                <div>
                  <h3 className="font-semibold">Google Calendar</h3>
                  <p className="text-sm text-gray-600">Scheduling</p>
                </div>
              </div>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">Not Connected</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">Sync appointments and viewings</p>
            <button className="w-full bg-[#636B56] text-white px-3 py-2 rounded-lg hover:bg-[#7a8365] transition-colors text-sm">
              Connect
            </button>
          </div>

          {/* Slack */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  💬
                </div>
                <div>
                  <h3 className="font-semibold">Slack</h3>
                  <p className="text-sm text-gray-600">Team Chat</p>
                </div>
              </div>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">Not Connected</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">Get notifications in Slack</p>
            <button className="w-full bg-[#636B56] text-white px-3 py-2 rounded-lg hover:bg-[#7a8365] transition-colors text-sm">
              Connect
            </button>
          </div>

          {/* Domain.com.au */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  🏠
                </div>
                <div>
                  <h3 className="font-semibold">Domain.com.au</h3>
                  <p className="text-sm text-gray-600">Property Portal</p>
                </div>
              </div>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Setup Required</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">Sync property listings</p>
            <button className="w-full bg-[#636B56] text-white px-3 py-2 rounded-lg hover:bg-[#7a8365] transition-colors text-sm">
              Configure
            </button>
          </div>
        </div>

        {/* AI Email Monitor Settings */}
        {gmailConnected && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-[#636B56] mb-4">AI Email Monitor Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-respond to inquiries</p>
                  <p className="text-sm text-gray-600">AI responds to property inquiries automatically</p>
                </div>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Flag urgent emails</p>
                  <p className="text-sm text-gray-600">Identify and prioritize time-sensitive emails</p>
                </div>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Extract contact information</p>
                  <p className="text-sm text-gray-600">Automatically add new contacts from emails</p>
                </div>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Schedule appointments</p>
                  <p className="text-sm text-gray-600">AI can schedule viewings based on email requests</p>
                </div>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Response time</p>
                  <p className="text-sm text-gray-600">Maximum time before AI responds</p>
                </div>
                <select className="px-3 py-1 border border-gray-300 rounded-lg">
                  <option>Instant</option>
                  <option>5 minutes</option>
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                  <option>1 hour</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}