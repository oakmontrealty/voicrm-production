import { useState } from 'react';
import Layout from '../components/Layout';

export default function Workflows() {
  const [workflows] = useState([
    {
      id: 1,
      name: 'New Lead Follow-up',
      description: 'Automated follow-up sequence for new leads',
      status: 'active',
      trigger: 'New lead created',
      steps: 5,
      completedRuns: 127,
      successRate: 84.2,
      lastRun: '2025-08-13 10:30 AM',
      category: 'Lead Management'
    },
    {
      id: 2,
      name: 'Property Listing Process',
      description: 'Complete workflow for new property listings',
      status: 'active',
      trigger: 'Listing agreement signed',
      steps: 8,
      completedRuns: 89,
      successRate: 92.1,
      lastRun: '2025-08-12 3:45 PM',
      category: 'Listings'
    },
    {
      id: 3,
      name: 'Contract to Closing',
      description: 'Manage tasks from contract to closing',
      status: 'active',
      trigger: 'Purchase agreement executed',
      steps: 12,
      completedRuns: 34,
      successRate: 88.9,
      lastRun: '2025-08-11 9:15 AM',
      category: 'Transactions'
    },
    {
      id: 4,
      name: 'Open House Preparation',
      description: 'Checklist and tasks for open house events',
      status: 'draft',
      trigger: 'Open house scheduled',
      steps: 6,
      completedRuns: 0,
      successRate: 0,
      lastRun: 'Never',
      category: 'Marketing'
    },
    {
      id: 5,
      name: 'Client Onboarding',
      description: 'Welcome and setup process for new clients',
      status: 'paused',
      trigger: 'New client created',
      steps: 7,
      completedRuns: 156,
      successRate: 76.8,
      lastRun: '2025-08-05 2:20 PM',
      category: 'Client Management'
    }
  ]);

  const [workflowTemplates] = useState([
    { id: 1, name: 'Buyer Journey', category: 'Sales', uses: 245, description: 'Complete buyer process from inquiry to closing' },
    { id: 2, name: 'Seller Onboarding', category: 'Listings', uses: 189, description: 'Onboard sellers and prepare listings' },
    { id: 3, name: 'Referral Management', category: 'Networking', uses: 134, description: 'Track and nurture referral relationships' },
    { id: 4, name: 'Market Analysis', category: 'Research', uses: 98, description: 'Regular market analysis and reporting' },
    { id: 5, name: 'Maintenance Requests', category: 'Property Management', uses: 67, description: 'Handle property maintenance workflows' }
  ]);

  const [recentActivity] = useState([
    { id: 1, workflow: 'New Lead Follow-up', action: 'Workflow completed', status: 'success', time: '2 hours ago' },
    { id: 2, workflow: 'Property Listing Process', action: 'Step 3 completed', status: 'in_progress', time: '4 hours ago' },
    { id: 3, workflow: 'Contract to Closing', action: 'Workflow started', status: 'started', time: '6 hours ago' },
    { id: 4, workflow: 'New Lead Follow-up', action: 'Step failed - retry scheduled', status: 'warning', time: '1 day ago' }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Lead Management': return 'bg-blue-100 text-blue-800';
      case 'Listings': return 'bg-green-100 text-green-800';
      case 'Transactions': return 'bg-purple-100 text-purple-800';
      case 'Marketing': return 'bg-orange-100 text-orange-800';
      case 'Client Management': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
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
                Workflow Automation
              </h1>
              <p className="text-[#7a7a7a] mt-2">Automate processes and manage business workflows</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-[#864936] text-white px-4 py-2 rounded-lg hover:bg-[#9a5441] transition-colors">
                Template Library
              </button>
              <button className="bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#7a8365] transition-colors">
                + Create Workflow
              </button>
            </div>
          </div>
        </div>

        {/* Workflow Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Workflows</p>
            <p className="text-2xl font-bold text-[#636B56]">{workflows.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {workflows.filter(w => w.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Runs</p>
            <p className="text-2xl font-bold text-[#636B56]">
              {workflows.reduce((sum, w) => sum + w.completedRuns, 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Avg Success Rate</p>
            <p className="text-2xl font-bold text-[#636B56]">
              {(workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length).toFixed(1)}%
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Time Saved</p>
            <p className="text-2xl font-bold text-[#636B56]">156h</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Workflows */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-[#636B56] mb-4">Active Workflows</h2>
              <div className="space-y-4">
                {workflows.map(workflow => (
                  <div key={workflow.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{workflow.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(workflow.status)}`}>
                            {workflow.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(workflow.category)}`}>
                            {workflow.category}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{workflow.description}</p>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Trigger:</p>
                            <p className="font-medium">{workflow.trigger}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Steps:</p>
                            <p className="font-medium">{workflow.steps}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Last Run:</p>
                            <p className="font-medium">{workflow.lastRun}</p>
                          </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="mt-3 grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Success Rate</span>
                              <span>{workflow.successRate}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-[#636B56] h-2 rounded-full" 
                                style={{ width: `${workflow.successRate}%` }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Completed Runs</p>
                            <p className="text-lg font-bold text-[#636B56]">{workflow.completedRuns}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t">
                      <button className="text-sm px-3 py-1 bg-[#636B56] text-white rounded hover:bg-[#7a8365] transition-colors">
                        View Workflow
                      </button>
                      <button className="text-sm px-3 py-1 border border-[#636B56] text-[#636B56] rounded hover:bg-[#636B56] hover:text-white transition-colors">
                        Edit
                      </button>
                      {workflow.status === 'active' && (
                        <button className="text-sm px-3 py-1 border border-yellow-300 text-yellow-600 rounded hover:bg-yellow-50 transition-colors">
                          Pause
                        </button>
                      )}
                      {workflow.status === 'paused' && (
                        <button className="text-sm px-3 py-1 border border-green-300 text-green-600 rounded hover:bg-green-50 transition-colors">
                          Resume
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
            {/* Workflow Builder */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#636B56] mb-4">Quick Builder</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 border rounded-lg hover:border-[#636B56] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      🎯
                    </div>
                    <div>
                      <p className="font-medium text-sm">Lead Nurture</p>
                      <p className="text-xs text-gray-600">Auto-follow up new leads</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 border rounded-lg hover:border-[#636B56] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      🏠
                    </div>
                    <div>
                      <p className="font-medium text-sm">Listing Process</p>
                      <p className="text-xs text-gray-600">New listing workflow</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 border rounded-lg hover:border-[#636B56] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      📝
                    </div>
                    <div>
                      <p className="font-medium text-sm">Transaction</p>
                      <p className="text-xs text-gray-600">Contract to closing</p>
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
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-gray-600">{activity.workflow}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${getActivityStatusColor(activity.status)}`}>
                        {activity.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Templates */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#636B56] mb-4">Popular Templates</h3>
              <div className="space-y-2">
                {workflowTemplates.slice(0, 4).map(template => (
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
                Browse All Templates
              </button>
            </div>
          </div>
        </div>

        {/* Workflow Analytics */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Workflow Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">Top Performing Workflows</h3>
              {workflows
                .sort((a, b) => b.successRate - a.successRate)
                .slice(0, 3)
                .map((workflow, index) => (
                  <div key={workflow.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">{workflow.name}</p>
                      <p className="text-sm text-gray-600">{workflow.completedRuns} runs</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#636B56]">{workflow.successRate}%</p>
                      <p className="text-xs text-gray-600">success rate</p>
                    </div>
                  </div>
                ))}
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">Most Used Workflows</h3>
              {workflows
                .sort((a, b) => b.completedRuns - a.completedRuns)
                .slice(0, 3)
                .map((workflow, index) => (
                  <div key={workflow.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">{workflow.name}</p>
                      <p className="text-sm text-gray-600">{workflow.successRate}% success</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#636B56]">{workflow.completedRuns}</p>
                      <p className="text-xs text-gray-600">runs</p>
                    </div>
                  </div>
                ))}
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">Workflow Categories</h3>
              {['Lead Management', 'Transactions', 'Listings'].map(category => {
                const categoryWorkflows = workflows.filter(w => w.category === category);
                const totalRuns = categoryWorkflows.reduce((sum, w) => sum + w.completedRuns, 0);
                return (
                  <div key={category} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">{category}</p>
                      <p className="text-sm text-gray-600">{categoryWorkflows.length} workflows</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#636B56]">{totalRuns}</p>
                      <p className="text-xs text-gray-600">total runs</p>
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