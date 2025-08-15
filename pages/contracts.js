import { useState } from 'react';
import Layout from '../components/Layout';

export default function Contracts() {
  const [contracts] = useState([
    {
      id: 1,
      property: '123 Oak Street, Downtown',
      client: 'John Smith',
      type: 'Purchase Agreement',
      status: 'pending_signatures',
      value: 485000,
      createdDate: '2025-08-10',
      expiryDate: '2025-08-20',
      signaturesRequired: 2,
      signaturesCompleted: 1,
      attorney: 'Williams & Associates'
    },
    {
      id: 2,
      property: '456 Pine Avenue, Suburbs',
      client: 'Sarah Johnson',
      type: 'Listing Agreement',
      status: 'executed',
      value: 625000,
      createdDate: '2025-08-05',
      expiryDate: '2026-02-05',
      signaturesRequired: 2,
      signaturesCompleted: 2,
      attorney: 'Property Law Group'
    },
    {
      id: 3,
      property: '789 Elm Street, Westside',
      client: 'Mike Chen',
      type: 'Purchase Agreement',
      status: 'under_review',
      value: 750000,
      createdDate: '2025-08-12',
      expiryDate: '2025-08-25',
      signaturesRequired: 3,
      signaturesCompleted: 0,
      attorney: 'Elite Legal Services'
    },
    {
      id: 4,
      property: '321 Maple Drive, Eastview',
      client: 'Anna Walsh',
      type: 'Commercial Lease',
      status: 'draft',
      value: 1200000,
      createdDate: '2025-08-13',
      expiryDate: '2025-08-30',
      signaturesRequired: 4,
      signaturesCompleted: 0,
      attorney: 'Commercial Law Partners'
    }
  ]);

  const [contractTemplates] = useState([
    { id: 1, name: 'Residential Purchase Agreement', type: 'purchase', uses: 245 },
    { id: 2, name: 'Residential Listing Agreement', type: 'listing', uses: 189 },
    { id: 3, name: 'Commercial Purchase Agreement', type: 'commercial', uses: 67 },
    { id: 4, name: 'Rental Agreement', type: 'rental', uses: 134 },
    { id: 5, name: 'Property Management Agreement', type: 'management', uses: 89 },
    { id: 6, name: 'Non-Disclosure Agreement', type: 'nda', uses: 156 }
  ]);

  const [recentActivity] = useState([
    { id: 1, action: 'Contract signed', contract: 'Purchase Agreement - 456 Pine Ave', time: '2 hours ago' },
    { id: 2, action: 'Contract created', contract: 'Commercial Lease - 321 Maple Dr', time: '4 hours ago' },
    { id: 3, action: 'Signature requested', contract: 'Purchase Agreement - 123 Oak St', time: '1 day ago' },
    { id: 4, action: 'Contract reviewed', contract: 'Purchase Agreement - 789 Elm St', time: '2 days ago' }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'pending_signatures': return 'bg-blue-100 text-blue-800';
      case 'executed': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Purchase Agreement': return 'bg-blue-100 text-blue-800';
      case 'Listing Agreement': return 'bg-green-100 text-green-800';
      case 'Commercial Lease': return 'bg-purple-100 text-purple-800';
      case 'Rental Agreement': return 'bg-orange-100 text-orange-800';
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
                Contract Management
              </h1>
              <p className="text-[#7a7a7a] mt-2">Create, manage, and track real estate contracts</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-[#864936] text-white px-4 py-2 rounded-lg hover:bg-[#9a5441] transition-colors">
                Template Library
              </button>
              <button className="bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#7a8365] transition-colors">
                + New Contract
              </button>
            </div>
          </div>
        </div>

        {/* Contract Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Contracts</p>
            <p className="text-2xl font-bold text-[#636B56]">{contracts.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Pending Signatures</p>
            <p className="text-2xl font-bold text-[#636B56]">
              {contracts.filter(c => c.status === 'pending_signatures').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Under Review</p>
            <p className="text-2xl font-bold text-[#636B56]">
              {contracts.filter(c => c.status === 'under_review').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Executed</p>
            <p className="text-2xl font-bold text-[#636B56]">
              {contracts.filter(c => c.status === 'executed').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-[#636B56]">
              ${(contracts.reduce((sum, c) => sum + c.value, 0) / 1000000).toFixed(1)}M
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Contracts */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-[#636B56] mb-4">Active Contracts</h2>
              <div className="space-y-4">
                {contracts.map(contract => (
                  <div key={contract.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{contract.property}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(contract.status)}`}>
                            {contract.status.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(contract.type)}`}>
                            {contract.type}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Client:</p>
                            <p className="font-medium">{contract.client}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Attorney:</p>
                            <p className="font-medium">{contract.attorney}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Created:</p>
                            <p className="font-medium">{contract.createdDate}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Expires:</p>
                            <p className="font-medium">{contract.expiryDate}</p>
                          </div>
                        </div>

                        {/* Signature Progress */}
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Signatures</span>
                            <span>{contract.signaturesCompleted} of {contract.signaturesRequired}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-[#636B56] h-2 rounded-full" 
                              style={{ width: `${(contract.signaturesCompleted / contract.signaturesRequired) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-[#636B56]">
                          ${contract.value.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">Contract Value</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t">
                      <button className="text-sm px-3 py-1 bg-[#636B56] text-white rounded hover:bg-[#7a8365] transition-colors">
                        View Contract
                      </button>
                      <button className="text-sm px-3 py-1 border border-[#636B56] text-[#636B56] rounded hover:bg-[#636B56] hover:text-white transition-colors">
                        Edit
                      </button>
                      {contract.status === 'pending_signatures' && (
                        <button className="text-sm px-3 py-1 border border-blue-300 text-blue-600 rounded hover:bg-blue-50 transition-colors">
                          Send Reminder
                        </button>
                      )}
                      <button className="text-sm px-3 py-1 border border-gray-300 text-gray-600 rounded hover:bg-gray-100 transition-colors">
                        Download PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Create */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#636B56] mb-4">Quick Create</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 border rounded-lg hover:border-[#636B56] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      📄
                    </div>
                    <div>
                      <p className="font-medium text-sm">Purchase Agreement</p>
                      <p className="text-xs text-gray-600">Standard residential purchase</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 border rounded-lg hover:border-[#636B56] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      📋
                    </div>
                    <div>
                      <p className="font-medium text-sm">Listing Agreement</p>
                      <p className="text-xs text-gray-600">Property listing contract</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 border rounded-lg hover:border-[#636B56] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      🏢
                    </div>
                    <div>
                      <p className="font-medium text-sm">Commercial Lease</p>
                      <p className="text-xs text-gray-600">Commercial property lease</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#636B56] mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.map(activity => (
                  <div key={activity.id} className="p-3 border-l-2 border-[#636B56] bg-gray-50 rounded-r">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-gray-600">{activity.contract}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Templates */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#636B56] mb-4">Popular Templates</h3>
              <div className="space-y-2">
                {contractTemplates.slice(0, 4).map(template => (
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
              <button className="w-full mt-3 text-sm text-[#636B56] hover:underline">
                View All Templates
              </button>
            </div>

            {/* Contract Status Legend */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#636B56] mb-4">Status Legend</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-gray-100 rounded-full"></span>
                  <span className="text-sm">Draft - Being prepared</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-100 rounded-full"></span>
                  <span className="text-sm">Under Review - Legal review</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-100 rounded-full"></span>
                  <span className="text-sm">Pending - Awaiting signatures</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-100 rounded-full"></span>
                  <span className="text-sm">Executed - Fully signed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}