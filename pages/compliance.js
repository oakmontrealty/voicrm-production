import { useState } from 'react';
import Layout from '../components/Layout';

export default function Compliance() {
  const [complianceItems] = useState([
    {
      id: 1,
      category: 'Licensing',
      item: 'Real Estate License Renewal',
      status: 'current',
      dueDate: '2025-12-31',
      assignee: 'Sarah Johnson',
      priority: 'high',
      description: 'Annual license renewal for state real estate board'
    },
    {
      id: 2,
      category: 'Education',
      item: 'Continuing Education Credits',
      status: 'in_progress',
      dueDate: '2025-11-15',
      assignee: 'Mike Chen',
      priority: 'medium',
      description: '24 hours of CE credits required for license renewal'
    },
    {
      id: 3,
      category: 'Documentation',
      item: 'Fair Housing Training Certificate',
      status: 'overdue',
      dueDate: '2025-08-01',
      assignee: 'Anna Walsh',
      priority: 'high',
      description: 'Annual fair housing compliance training'
    },
    {
      id: 4,
      category: 'Insurance',
      item: 'Professional Liability Insurance',
      status: 'current',
      dueDate: '2026-01-15',
      assignee: 'David Park',
      priority: 'high',
      description: 'Errors and omissions insurance policy'
    },
    {
      id: 5,
      category: 'Financial',
      item: 'Trust Account Reconciliation',
      status: 'due_soon',
      dueDate: '2025-08-31',
      assignee: 'Elena Rodriguez',
      priority: 'high',
      description: 'Monthly trust account reconciliation and reporting'
    }
  ]);

  const [auditLogs] = useState([
    { id: 1, action: 'License renewed', user: 'Sarah Johnson', timestamp: '2025-08-12 10:30 AM' },
    { id: 2, action: 'Fair housing training completed', user: 'Mike Chen', timestamp: '2025-08-11 2:15 PM' },
    { id: 3, action: 'Insurance policy updated', user: 'David Park', timestamp: '2025-08-10 9:45 AM' },
    { id: 4, action: 'CE credits submitted', user: 'Anna Walsh', timestamp: '2025-08-09 4:20 PM' }
  ]);

  const [regulations] = useState([
    {
      id: 1,
      title: 'Fair Housing Act Compliance',
      category: 'Federal',
      lastUpdated: '2025-07-15',
      description: 'Federal fair housing regulations and requirements',
      status: 'active'
    },
    {
      id: 2,
      title: 'State Licensing Requirements',
      category: 'State',
      lastUpdated: '2025-06-30',
      description: 'Real estate license maintenance and renewal requirements',
      status: 'active'
    },
    {
      id: 3,
      title: 'RESPA Guidelines',
      category: 'Federal',
      lastUpdated: '2025-08-01',
      description: 'Real Estate Settlement Procedures Act compliance',
      status: 'active'
    },
    {
      id: 4,
      title: 'Anti-Money Laundering (AML)',
      category: 'Federal',
      lastUpdated: '2025-07-20',
      description: 'AML compliance for real estate transactions',
      status: 'active'
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'current': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'due_soon': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Licensing': return 'bg-blue-100 text-blue-800';
      case 'Education': return 'bg-green-100 text-green-800';
      case 'Documentation': return 'bg-purple-100 text-purple-800';
      case 'Insurance': return 'bg-orange-100 text-orange-800';
      case 'Financial': return 'bg-yellow-100 text-yellow-800';
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
                Compliance Management
              </h1>
              <p className="text-[#7a7a7a] mt-2">Track licensing, education, and regulatory compliance</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-[#864936] text-white px-4 py-2 rounded-lg hover:bg-[#9a5441] transition-colors">
                Generate Report
              </button>
              <button className="bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#7a8365] transition-colors">
                + Add Requirement
              </button>
            </div>
          </div>
        </div>

        {/* Compliance Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Items</p>
            <p className="text-2xl font-bold text-[#636B56]">{complianceItems.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Current</p>
            <p className="text-2xl font-bold text-green-600">
              {complianceItems.filter(item => item.status === 'current').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Due Soon</p>
            <p className="text-2xl font-bold text-yellow-600">
              {complianceItems.filter(item => item.status === 'due_soon').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Overdue</p>
            <p className="text-2xl font-bold text-red-600">
              {complianceItems.filter(item => item.status === 'overdue').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">
              {complianceItems.filter(item => item.status === 'in_progress').length}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Compliance Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-[#636B56] mb-4">Compliance Requirements</h2>
              <div className="space-y-4">
                {complianceItems.map(item => (
                  <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{item.item}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                            {item.status.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(item.category)}`}>
                            {item.category}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Assigned to:</p>
                            <p className="font-medium">{item.assignee}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Due Date:</p>
                            <p className="font-medium">{item.dueDate}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t">
                      <button className="text-sm px-3 py-1 bg-[#636B56] text-white rounded hover:bg-[#7a8365] transition-colors">
                        View Details
                      </button>
                      <button className="text-sm px-3 py-1 border border-[#636B56] text-[#636B56] rounded hover:bg-[#636B56] hover:text-white transition-colors">
                        Update Status
                      </button>
                      <button className="text-sm px-3 py-1 border border-gray-300 text-gray-600 rounded hover:bg-gray-100 transition-colors">
                        Set Reminder
                      </button>
                      {item.status === 'overdue' && (
                        <button className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                          Urgent Action
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
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#636B56] mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 border rounded-lg hover:border-[#636B56] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      📄
                    </div>
                    <div>
                      <p className="font-medium text-sm">Upload Certificate</p>
                      <p className="text-xs text-gray-600">Add compliance documents</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 border rounded-lg hover:border-[#636B56] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      📚
                    </div>
                    <div>
                      <p className="font-medium text-sm">Training Calendar</p>
                      <p className="text-xs text-gray-600">View upcoming training</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 border rounded-lg hover:border-[#636B56] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      ⚠️
                    </div>
                    <div>
                      <p className="font-medium text-sm">Risk Assessment</p>
                      <p className="text-xs text-gray-600">Identify compliance gaps</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#636B56] mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {auditLogs.map(log => (
                  <div key={log.id} className="p-3 border-l-2 border-[#636B56] bg-gray-50 rounded-r">
                    <p className="text-sm font-medium">{log.action}</p>
                    <p className="text-xs text-gray-600">{log.user}</p>
                    <p className="text-xs text-gray-500 mt-1">{log.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#636B56] mb-4">Upcoming Deadlines</h3>
              <div className="space-y-3">
                {complianceItems
                  .filter(item => item.status === 'due_soon' || item.status === 'overdue')
                  .map(item => (
                    <div key={item.id} className="p-3 border rounded-lg">
                      <p className="text-sm font-medium">{item.item}</p>
                      <p className="text-xs text-gray-600">{item.assignee}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">{item.dueDate}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Regulatory Updates */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Regulatory Framework</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {regulations.map(regulation => (
              <div key={regulation.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{regulation.title}</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {regulation.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{regulation.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Updated: {regulation.lastUpdated}
                  </span>
                  <button className="text-xs px-2 py-1 border border-[#636B56] text-[#636B56] rounded hover:bg-[#636B56] hover:text-white transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}