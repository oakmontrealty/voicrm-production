import { useState } from 'react';
import Layout from '../components/Layout';

export default function EmailCampaigns() {
  const [campaigns] = useState([
    {
      id: 1,
      name: 'Summer Market Update',
      type: 'Newsletter',
      status: 'sent',
      recipients: 1247,
      openRate: 34.2,
      clickRate: 8.7,
      sentDate: '2025-08-10',
      subject: 'Your Local Market Report - August 2025',
      template: 'Market Update'
    },
    {
      id: 2,
      name: 'New Listing Announcement',
      type: 'Promotion',
      status: 'scheduled',
      recipients: 892,
      openRate: 0,
      clickRate: 0,
      sentDate: '2025-08-15',
      subject: 'Exclusive New Listing - Downtown Luxury Condo',
      template: 'Property Showcase'
    },
    {
      id: 3,
      name: 'Open House Invitations',
      type: 'Event',
      status: 'sending',
      recipients: 634,
      openRate: 28.9,
      clickRate: 12.3,
      sentDate: '2025-08-13',
      subject: 'This Weekend: Open Houses You Can\'t Miss',
      template: 'Event Invitation'
    },
    {
      id: 4,
      name: 'Client Testimonials',
      type: 'Social Proof',
      status: 'draft',
      recipients: 0,
      openRate: 0,
      clickRate: 0,
      sentDate: null,
      subject: 'What Our Clients Are Saying',
      template: 'Testimonial'
    },
    {
      id: 5,
      name: 'First-Time Buyer Guide',
      type: 'Educational',
      status: 'sent',
      recipients: 543,
      openRate: 42.1,
      clickRate: 15.6,
      sentDate: '2025-08-08',
      subject: 'Your Complete Guide to Buying Your First Home',
      template: 'Educational'
    }
  ]);

  const [templates] = useState([
    { id: 1, name: 'Market Update', category: 'Newsletter', uses: 156, lastUsed: '2025-08-10' },
    { id: 2, name: 'Property Showcase', category: 'Promotion', uses: 89, lastUsed: '2025-08-12' },
    { id: 3, name: 'Event Invitation', category: 'Event', uses: 134, lastUsed: '2025-08-13' },
    { id: 4, name: 'Client Welcome', category: 'Onboarding', uses: 245, lastUsed: '2025-08-09' },
    { id: 5, name: 'Follow-up', category: 'Nurture', uses: 198, lastUsed: '2025-08-11' }
  ]);

  const [subscriberSegments] = useState([
    { id: 1, name: 'Active Buyers', count: 342, description: 'Currently looking to purchase' },
    { id: 2, name: 'Potential Sellers', count: 189, description: 'Considering selling in next 12 months' },
    { id: 3, name: 'Past Clients', count: 567, description: 'Previous buyers and sellers' },
    { id: 4, name: 'Investors', count: 123, description: 'Investment property buyers' },
    { id: 5, name: 'Newsletter Subscribers', count: 1024, description: 'General market updates' }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'sending': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Newsletter': return 'bg-blue-100 text-blue-800';
      case 'Promotion': return 'bg-green-100 text-green-800';
      case 'Event': return 'bg-purple-100 text-purple-800';
      case 'Educational': return 'bg-orange-100 text-orange-800';
      case 'Social Proof': return 'bg-pink-100 text-pink-800';
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
                Email Campaigns
              </h1>
              <p className="text-[#7a7a7a] mt-2">Create and manage email marketing campaigns</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-[#864936] text-white px-4 py-2 rounded-lg hover:bg-[#9a5441] transition-colors">
                Email Templates
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
            <p className="text-sm text-gray-600">Total Campaigns</p>
            <p className="text-2xl font-bold text-[#636B56]">{campaigns.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Subscribers</p>
            <p className="text-2xl font-bold text-[#636B56]">
              {subscriberSegments.reduce((sum, segment) => sum + segment.count, 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Avg Open Rate</p>
            <p className="text-2xl font-bold text-[#636B56]">
              {(campaigns.filter(c => c.openRate > 0).reduce((sum, c) => sum + c.openRate, 0) / 
                campaigns.filter(c => c.openRate > 0).length).toFixed(1)}%
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Avg Click Rate</p>
            <p className="text-2xl font-bold text-[#636B56]">
              {(campaigns.filter(c => c.clickRate > 0).reduce((sum, c) => sum + c.clickRate, 0) / 
                campaigns.filter(c => c.clickRate > 0).length).toFixed(1)}%
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">This Month</p>
            <p className="text-2xl font-bold text-[#636B56]">
              {campaigns.filter(c => c.status === 'sent').length}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaigns List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-[#636B56] mb-4">Email Campaigns</h2>
              <div className="space-y-4">
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{campaign.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(campaign.status)}`}>
                            {campaign.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(campaign.type)}`}>
                            {campaign.type}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 font-medium">{campaign.subject}</p>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Recipients:</p>
                            <p className="font-medium">{campaign.recipients.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Template:</p>
                            <p className="font-medium">{campaign.template}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Send Date:</p>
                            <p className="font-medium">{campaign.sentDate || 'Not scheduled'}</p>
                          </div>
                        </div>

                        {/* Performance Metrics */}
                        {campaign.status === 'sent' && (
                          <div className="mt-3 grid grid-cols-2 gap-4">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Open Rate</span>
                                <span>{campaign.openRate}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-[#636B56] h-2 rounded-full" 
                                  style={{ width: `${campaign.openRate}%` }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Click Rate</span>
                                <span>{campaign.clickRate}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-[#864936] h-2 rounded-full" 
                                  style={{ width: `${campaign.clickRate * 3}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t">
                      {campaign.status === 'draft' && (
                        <button className="text-sm px-3 py-1 bg-[#636B56] text-white rounded hover:bg-[#7a8365] transition-colors">
                          Edit & Send
                        </button>
                      )}
                      {campaign.status === 'sent' && (
                        <button className="text-sm px-3 py-1 bg-[#636B56] text-white rounded hover:bg-[#7a8365] transition-colors">
                          View Report
                        </button>
                      )}
                      <button className="text-sm px-3 py-1 border border-[#636B56] text-[#636B56] rounded hover:bg-[#636B56] hover:text-white transition-colors">
                        Preview
                      </button>
                      <button className="text-sm px-3 py-1 border border-gray-300 text-gray-600 rounded hover:bg-gray-100 transition-colors">
                        Duplicate
                      </button>
                      {campaign.status === 'scheduled' && (
                        <button className="text-sm px-3 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Campaign Builder */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#636B56] mb-4">Quick Builder</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                    placeholder="Enter campaign name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                  <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent">
                    <option>Market Update</option>
                    <option>Property Showcase</option>
                    <option>Event Invitation</option>
                    <option>Educational</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                  <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent">
                    <option>All Subscribers</option>
                    <option>Active Buyers</option>
                    <option>Potential Sellers</option>
                    <option>Past Clients</option>
                    <option>Investors</option>
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

            {/* Subscriber Segments */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#636B56] mb-4">Subscriber Segments</h3>
              <div className="space-y-3">
                {subscriberSegments.map(segment => (
                  <div key={segment.id} className="p-3 border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{segment.name}</h4>
                        <p className="text-xs text-gray-600 mt-1">{segment.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#636B56]">{segment.count}</p>
                        <p className="text-xs text-gray-600">subscribers</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-3 text-sm text-[#636B56] hover:underline">
                Manage Segments
              </button>
            </div>

            {/* Popular Templates */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#636B56] mb-4">Popular Templates</h3>
              <div className="space-y-2">
                {templates.map(template => (
                  <div key={template.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium">{template.name}</p>
                      <p className="text-xs text-gray-600">{template.uses} uses</p>
                    </div>
                    <button className="text-xs px-2 py-1 border border-[#636B56] text-[#636B56] rounded hover:bg-[#636B56] hover:text-white transition-colors">
                      Use
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Email Tips */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#636B56] mb-4">Best Practices</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <p>Personalize subject lines for better open rates</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <p>Include clear call-to-action buttons</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <p>Test send times for your audience</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <p>Segment lists for relevant content</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <p>A/B test subject lines and content</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Performance */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Campaign Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-3">Best Performing Campaigns</h3>
              {campaigns
                .filter(c => c.status === 'sent')
                .sort((a, b) => b.openRate - a.openRate)
                .slice(0, 3)
                .map(campaign => (
                  <div key={campaign.id} className="flex justify-between items-center p-3 border rounded mb-2">
                    <div>
                      <p className="font-medium text-sm">{campaign.name}</p>
                      <p className="text-xs text-gray-600">{campaign.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#636B56]">{campaign.openRate}%</p>
                      <p className="text-xs text-gray-600">open rate</p>
                    </div>
                  </div>
                ))}
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-3">Highest Engagement</h3>
              {campaigns
                .filter(c => c.status === 'sent')
                .sort((a, b) => b.clickRate - a.clickRate)
                .slice(0, 3)
                .map(campaign => (
                  <div key={campaign.id} className="flex justify-between items-center p-3 border rounded mb-2">
                    <div>
                      <p className="font-medium text-sm">{campaign.name}</p>
                      <p className="text-xs text-gray-600">{campaign.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#636B56]">{campaign.clickRate}%</p>
                      <p className="text-xs text-gray-600">click rate</p>
                    </div>
                  </div>
                ))}
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-3">Campaign Types</h3>
              {['Newsletter', 'Promotion', 'Educational'].map(type => {
                const typeCampaigns = campaigns.filter(c => c.type === type);
                return (
                  <div key={type} className="flex justify-between items-center p-3 border rounded mb-2">
                    <div>
                      <p className="font-medium text-sm">{type}</p>
                      <p className="text-xs text-gray-600">{typeCampaigns.length} campaigns</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#636B56]">
                        {typeCampaigns.filter(c => c.status === 'sent').length}
                      </p>
                      <p className="text-xs text-gray-600">sent</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}