import { useState } from 'react';
import Layout from '../components/Layout';

export default function PropertyCampaigns() {
  const [campaigns] = useState([
    {
      id: 1,
      property: '123 Oak Street, Downtown',
      type: 'Open House',
      status: 'active',
      startDate: '2025-08-15',
      endDate: '2025-08-30',
      budget: 2500,
      spent: 1890,
      leads: 23,
      showings: 8,
      offers: 2,
      channels: ['Social Media', 'Email', 'Print', 'Online Ads']
    },
    {
      id: 2,
      property: '456 Pine Avenue, Suburbs',
      type: 'Listing Launch',
      status: 'completed',
      startDate: '2025-07-20',
      endDate: '2025-08-10',
      budget: 3000,
      spent: 2850,
      leads: 45,
      showings: 18,
      offers: 4,
      channels: ['Social Media', 'MLS', 'Email', 'Direct Mail']
    },
    {
      id: 3,
      property: '789 Elm Street, Westside',
      type: 'Price Reduction',
      status: 'active',
      startDate: '2025-08-12',
      endDate: '2025-09-12',
      budget: 1500,
      spent: 450,
      leads: 12,
      showings: 5,
      offers: 1,
      channels: ['Social Media', 'Email', 'Online Ads']
    },
    {
      id: 4,
      property: '321 Maple Drive, Eastview',
      type: 'Luxury Showcase',
      status: 'scheduled',
      startDate: '2025-08-20',
      endDate: '2025-09-20',
      budget: 5000,
      spent: 0,
      leads: 0,
      showings: 0,
      offers: 0,
      channels: ['Print', 'Social Media', 'Email', 'Video Marketing']
    }
  ]);

  const [campaignTemplates] = useState([
    { id: 1, name: 'New Listing Launch', type: 'Launch', duration: '30 days', avgBudget: 2500 },
    { id: 2, name: 'Open House Promotion', type: 'Event', duration: '14 days', avgBudget: 1500 },
    { id: 3, name: 'Price Reduction Alert', type: 'Update', duration: '21 days', avgBudget: 1200 },
    { id: 4, name: 'Luxury Property Showcase', type: 'Premium', duration: '45 days', avgBudget: 4500 },
    { id: 5, name: 'Quick Sale Campaign', type: 'Urgent', duration: '10 days', avgBudget: 800 }
  ]);

  const [marketingChannels] = useState([
    { channel: 'Social Media', cost: 450, leads: 28, conversion: 12.5 },
    { channel: 'Online Ads', cost: 680, leads: 19, conversion: 15.8 },
    { channel: 'Email Marketing', cost: 120, leads: 15, conversion: 20.0 },
    { channel: 'Print Advertising', cost: 890, leads: 8, conversion: 8.9 },
    { channel: 'Direct Mail', cost: 340, leads: 12, conversion: 16.7 }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Open House': return 'bg-blue-100 text-blue-800';
      case 'Listing Launch': return 'bg-green-100 text-green-800';
      case 'Price Reduction': return 'bg-orange-100 text-orange-800';
      case 'Luxury Showcase': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
                Property Marketing Campaigns
              </h1>
              <p className="text-[#7a7a7a] mt-2">Promote properties with targeted marketing campaigns</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-[#864936] text-white px-4 py-2 rounded-lg hover:bg-[#9a5441] transition-colors">
                Campaign Analytics
              </button>
              <button className="bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#7a8365] transition-colors">
                + New Campaign
              </button>
            </div>
          </div>
        </div>

        {/* Campaign Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Active Campaigns</p>
            <p className="text-2xl font-bold text-[#636B56]">
              {campaigns.filter(c => c.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Leads</p>
            <p className="text-2xl font-bold text-[#636B56]">
              {campaigns.reduce((sum, c) => sum + c.leads, 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Showings</p>
            <p className="text-2xl font-bold text-[#636B56]">
              {campaigns.reduce((sum, c) => sum + c.showings, 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Offers</p>
            <p className="text-2xl font-bold text-[#636B56]">
              {campaigns.reduce((sum, c) => sum + c.offers, 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Spend</p>
            <p className="text-2xl font-bold text-[#636B56]">
              ${campaigns.reduce((sum, c) => sum + c.spent, 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Campaigns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-[#636B56] mb-4">Property Campaigns</h2>
              <div className="space-y-4">
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{campaign.property}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(campaign.status)}`}>
                            {campaign.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(campaign.type)}`}>
                            {campaign.type}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-gray-600">Leads:</p>
                            <p className="font-medium text-lg text-[#636B56]">{campaign.leads}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Showings:</p>
                            <p className="font-medium text-lg text-[#636B56]">{campaign.showings}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Offers:</p>
                            <p className="font-medium text-lg text-[#636B56]">{campaign.offers}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Duration:</p>
                            <p className="font-medium">{campaign.startDate} - {campaign.endDate}</p>
                          </div>
                        </div>

                        {/* Budget Progress */}
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Budget Usage</span>
                            <span>${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-[#636B56] h-2 rounded-full" 
                              style={{ width: `${Math.min((campaign.spent / campaign.budget) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {((campaign.spent / campaign.budget) * 100).toFixed(1)}% spent
                          </p>
                        </div>

                        {/* Marketing Channels */}
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Marketing Channels:</p>
                          <div className="flex flex-wrap gap-2">
                            {campaign.channels.map(channel => (
                              <span key={channel} className="px-2 py-1 bg-gray-100 rounded text-xs">
                                {channel}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t">
                      <button className="text-sm px-3 py-1 bg-[#636B56] text-white rounded hover:bg-[#7a8365] transition-colors">
                        View Analytics
                      </button>
                      <button className="text-sm px-3 py-1 border border-[#636B56] text-[#636B56] rounded hover:bg-[#636B56] hover:text-white transition-colors">
                        Edit Campaign
                      </button>
                      {campaign.status === 'active' && (
                        <button className="text-sm px-3 py-1 border border-yellow-300 text-yellow-600 rounded hover:bg-yellow-50 transition-colors">
                          Pause
                        </button>
                      )}
                      <button className="text-sm px-3 py-1 border border-gray-300 text-gray-600 rounded hover:bg-gray-100 transition-colors">
                        Duplicate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Campaign Creator */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#636B56] mb-4">Quick Campaign</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Address</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                    placeholder="Enter property address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Type</label>
                  <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent">
                    <option>New Listing Launch</option>
                    <option>Open House Promotion</option>
                    <option>Price Reduction Alert</option>
                    <option>Luxury Showcase</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                  <input 
                    type="number" 
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                    placeholder="Enter budget amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent">
                    <option>2 weeks</option>
                    <option>1 month</option>
                    <option>6 weeks</option>
                    <option>2 months</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-[#636B56] text-white py-2 rounded-lg hover:bg-[#7a8365] transition-colors"
                >
                  Create Campaign
                </button>
              </form>
            </div>

            {/* Campaign Templates */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#636B56] mb-4">Campaign Templates</h3>
              <div className="space-y-3">
                {campaignTemplates.map(template => (
                  <div key={template.id} className="p-3 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        <p className="text-xs text-gray-600 mt-1">{template.duration}</p>
                        <p className="text-xs text-gray-600">Avg. budget: ${template.avgBudget.toLocaleString()}</p>
                      </div>
                      <button className="text-xs px-2 py-1 border border-[#636B56] text-[#636B56] rounded hover:bg-[#636B56] hover:text-white transition-colors">
                        Use
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Channel Performance */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#636B56] mb-4">Channel Performance</h3>
              <div className="space-y-3">
                {marketingChannels.map(channel => (
                  <div key={channel.channel} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-sm">{channel.channel}</h4>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {channel.conversion}% conversion
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-600">Cost: ${channel.cost}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Leads: {channel.leads}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Performance Analytics */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Campaign Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-3">Best Performing Campaigns</h3>
              {campaigns
                .filter(c => c.leads > 0)
                .sort((a, b) => (b.leads / (b.spent || 1)) - (a.leads / (a.spent || 1)))
                .slice(0, 3)
                .map(campaign => (
                  <div key={campaign.id} className="flex justify-between items-center p-3 border rounded mb-2">
                    <div>
                      <p className="font-medium text-sm">{campaign.property.split(',')[0]}</p>
                      <p className="text-xs text-gray-600">{campaign.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#636B56]">
                        {campaign.spent > 0 ? (campaign.leads / campaign.spent * 1000).toFixed(1) : 0}
                      </p>
                      <p className="text-xs text-gray-600">leads per $1k</p>
                    </div>
                  </div>
                ))}
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-3">Most Engaging</h3>
              {campaigns
                .filter(c => c.showings > 0)
                .sort((a, b) => (b.showings / (b.leads || 1)) - (a.showings / (a.leads || 1)))
                .slice(0, 3)
                .map(campaign => (
                  <div key={campaign.id} className="flex justify-between items-center p-3 border rounded mb-2">
                    <div>
                      <p className="font-medium text-sm">{campaign.property.split(',')[0]}</p>
                      <p className="text-xs text-gray-600">{campaign.showings} showings</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#636B56]">
                        {campaign.leads > 0 ? ((campaign.showings / campaign.leads) * 100).toFixed(1) : 0}%
                      </p>
                      <p className="text-xs text-gray-600">conversion rate</p>
                    </div>
                  </div>
                ))}
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-3">Campaign ROI</h3>
              {campaigns
                .filter(c => c.offers > 0)
                .sort((a, b) => b.offers - a.offers)
                .slice(0, 3)
                .map(campaign => (
                  <div key={campaign.id} className="flex justify-between items-center p-3 border rounded mb-2">
                    <div>
                      <p className="font-medium text-sm">{campaign.property.split(',')[0]}</p>
                      <p className="text-xs text-gray-600">{campaign.offers} offers received</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#636B56]">
                        {campaign.spent > 0 ? ((campaign.offers / campaign.spent) * 10000).toFixed(1) : 0}
                      </p>
                      <p className="text-xs text-gray-600">offers per $10k</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}