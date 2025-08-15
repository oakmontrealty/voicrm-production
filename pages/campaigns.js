import { useState } from 'react';
import Layout from '../components/Layout';

export default function Campaigns() {
  const [activeCampaigns] = useState([
    {
      id: 1,
      name: 'Summer Property Showcase',
      type: 'Multi-channel',
      status: 'Active',
      leads: 234,
      conversion: 12.3,
      channels: ['SMS', 'Email', 'Call']
    },
    {
      id: 2,
      name: 'First Home Buyers',
      type: 'Email',
      status: 'Active',
      leads: 156,
      conversion: 8.7,
      channels: ['Email']
    },
    {
      id: 3,
      name: 'Investment Properties',
      type: 'SMS',
      status: 'Scheduled',
      leads: 0,
      conversion: 0,
      channels: ['SMS', 'MMS']
    }
  ]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
                Marketing Campaigns
              </h1>
              <p className="text-[#7a7a7a] mt-2">Create and manage multi-channel marketing campaigns</p>
            </div>
            <button className="bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#7a8365] transition-colors">
              + New Campaign
            </button>
          </div>
        </div>

        {/* Campaign Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Active Campaigns</p>
            <p className="text-2xl font-bold text-[#636B56]">3</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Reach</p>
            <p className="text-2xl font-bold text-[#636B56]">1,245</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Avg. Open Rate</p>
            <p className="text-2xl font-bold text-[#636B56]">34.2%</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Conversions</p>
            <p className="text-2xl font-bold text-[#636B56]">89</p>
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Active Campaigns</h2>
          <div className="space-y-4">
            {activeCampaigns.map(campaign => (
              <div key={campaign.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-lg">{campaign.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        campaign.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {campaign.channels.map(channel => (
                        <span key={channel} className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {channel}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#636B56]">{campaign.leads}</p>
                    <p className="text-sm text-gray-600">Leads Generated</p>
                    <p className="text-sm mt-1">
                      <span className="text-green-600 font-medium">{campaign.conversion}%</span> conversion
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="text-sm px-3 py-1 border border-[#636B56] text-[#636B56] rounded hover:bg-[#636B56] hover:text-white transition-colors">
                    View Details
                  </button>
                  <button className="text-sm px-3 py-1 border border-gray-300 text-gray-600 rounded hover:bg-gray-100 transition-colors">
                    Edit
                  </button>
                  <button className="text-sm px-3 py-1 border border-gray-300 text-gray-600 rounded hover:bg-gray-100 transition-colors">
                    Duplicate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Templates */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Quick Start Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 hover:border-[#636B56] transition-colors cursor-pointer">
              <h3 className="font-medium mb-2">Open House Invitation</h3>
              <p className="text-sm text-gray-600 mb-3">Multi-channel campaign for property viewings</p>
              <div className="flex gap-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">SMS</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Email</span>
              </div>
            </div>
            <div className="border rounded-lg p-4 hover:border-[#636B56] transition-colors cursor-pointer">
              <h3 className="font-medium mb-2">New Listing Alert</h3>
              <p className="text-sm text-gray-600 mb-3">Notify prospects about new properties</p>
              <div className="flex gap-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Email</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Push</span>
              </div>
            </div>
            <div className="border rounded-lg p-4 hover:border-[#636B56] transition-colors cursor-pointer">
              <h3 className="font-medium mb-2">Follow-up Sequence</h3>
              <p className="text-sm text-gray-600 mb-3">Automated follow-ups after property viewing</p>
              <div className="flex gap-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Call</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">SMS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}