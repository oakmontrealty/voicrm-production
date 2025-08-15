import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  UserGroupIcon,
  DocumentCheckIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentArrowUpIcon,
  KeyIcon,
  BriefcaseIcon
} from '@heroicons/react/24/solid';

export default function AgentManagement() {
  const [agents, setAgents] = useState([]);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [complianceAlerts, setComplianceAlerts] = useState([]);

  // Role definitions with required compliance documents
  const agentRoles = {
    'sales_agent': {
      title: 'Sales Agent',
      permissions: ['view_contacts', 'make_calls', 'send_messages', 'view_properties'],
      requiredDocs: [
        { id: 'real_estate_license', name: 'Real Estate License', expiry: true, critical: true },
        { id: 'police_check', name: 'National Police Check', expiry: true, renewalMonths: 12 },
        { id: 'professional_indemnity', name: 'Professional Indemnity Insurance', expiry: true, critical: true },
        { id: 'trust_account_auth', name: 'Trust Account Authorization', expiry: false },
        { id: 'code_of_conduct', name: 'Code of Conduct Agreement', expiry: false }
      ]
    },
    'senior_agent': {
      title: 'Senior Sales Agent',
      permissions: ['all_sales_agent', 'approve_listings', 'access_reports', 'manage_team'],
      requiredDocs: [
        { id: 'real_estate_license', name: 'Real Estate License', expiry: true, critical: true },
        { id: 'police_check', name: 'National Police Check', expiry: true, renewalMonths: 12 },
        { id: 'professional_indemnity', name: 'Professional Indemnity Insurance', expiry: true, critical: true },
        { id: 'trust_account_auth', name: 'Trust Account Authorization', expiry: false },
        { id: 'auctioneer_license', name: 'Auctioneer License', expiry: true },
        { id: 'management_training', name: 'Management Training Certificate', expiry: false }
      ]
    },
    'property_manager': {
      title: 'Property Manager',
      permissions: ['manage_rentals', 'tenant_screening', 'maintenance_requests', 'trust_accounting'],
      requiredDocs: [
        { id: 'real_estate_license', name: 'Real Estate License', expiry: true, critical: true },
        { id: 'property_mgmt_cert', name: 'Property Management Certificate', expiry: false },
        { id: 'trust_accounting_cert', name: 'Trust Accounting Certificate', expiry: true },
        { id: 'tenancy_law_training', name: 'Tenancy Law Training', expiry: true, renewalMonths: 24 }
      ]
    },
    'admin_staff': {
      title: 'Administrative Staff',
      permissions: ['view_contacts', 'manage_calendar', 'basic_reporting'],
      requiredDocs: [
        { id: 'police_check', name: 'National Police Check', expiry: true, renewalMonths: 12 },
        { id: 'confidentiality_agreement', name: 'Confidentiality Agreement', expiry: false },
        { id: 'data_protection_training', name: 'Data Protection Training', expiry: true, renewalMonths: 12 }
      ]
    },
    'broker': {
      title: 'Principal/Broker',
      permissions: ['full_access', 'financial_access', 'compliance_override', 'system_admin'],
      requiredDocs: [
        { id: 'real_estate_license', name: 'Real Estate License (Class 1)', expiry: true, critical: true },
        { id: 'business_license', name: 'Business Operating License', expiry: true, critical: true },
        { id: 'professional_indemnity', name: 'Professional Indemnity Insurance', expiry: true, critical: true },
        { id: 'trust_account_license', name: 'Trust Account License', expiry: true, critical: true },
        { id: 'auctioneer_license', name: 'Auctioneer License', expiry: true },
        { id: 'fair_trading_cert', name: 'Fair Trading Certificate', expiry: true }
      ]
    }
  };

  // Sample agents data
  useEffect(() => {
    const sampleAgents = [
      {
        id: 1,
        name: 'Terence Houhoutas',
        role: 'broker',
        email: 'terence@oakmontrealty.com',
        phone: '0494 102 414',
        startDate: '2020-01-15',
        status: 'active',
        complianceStatus: 'compliant',
        documents: [
          { 
            docId: 'real_estate_license', 
            uploaded: true, 
            expiryDate: '2025-12-31', 
            status: 'valid',
            uploadDate: '2024-01-15',
            fileUrl: '/docs/license_terence.pdf'
          },
          { 
            docId: 'professional_indemnity', 
            uploaded: true, 
            expiryDate: '2025-06-30', 
            status: 'valid',
            uploadDate: '2024-01-15',
            fileUrl: '/docs/insurance_terence.pdf'
          }
        ],
        permissions: agentRoles.broker.permissions,
        performance: {
          salesThisMonth: 5,
          listingsActive: 12,
          clientSatisfaction: 4.8
        }
      },
      {
        id: 2,
        name: 'Sarah Johnson',
        role: 'senior_agent',
        email: 'sarah@oakmontrealty.com',
        phone: '0412 345 678',
        startDate: '2021-03-20',
        status: 'active',
        complianceStatus: 'warning',
        documents: [
          { 
            docId: 'real_estate_license', 
            uploaded: true, 
            expiryDate: '2025-02-28', 
            status: 'expiring_soon',
            uploadDate: '2024-02-01'
          },
          { 
            docId: 'police_check', 
            uploaded: false, 
            status: 'missing',
            required: true
          }
        ],
        permissions: agentRoles.senior_agent.permissions,
        performance: {
          salesThisMonth: 3,
          listingsActive: 8,
          clientSatisfaction: 4.6
        }
      }
    ];

    setAgents(sampleAgents);
    checkComplianceAlerts(sampleAgents);
  }, []);

  // Check for compliance alerts
  const checkComplianceAlerts = (agentsList) => {
    const alerts = [];
    const today = new Date();
    const warningDays = 30; // Alert 30 days before expiry

    agentsList.forEach(agent => {
      const role = agentRoles[agent.role];
      
      role.requiredDocs.forEach(requiredDoc => {
        const agentDoc = agent.documents?.find(d => d.docId === requiredDoc.id);
        
        // Check for missing critical documents
        if (requiredDoc.critical && (!agentDoc || !agentDoc.uploaded)) {
          alerts.push({
            agentId: agent.id,
            agentName: agent.name,
            type: 'critical',
            message: `Missing critical document: ${requiredDoc.name}`,
            docId: requiredDoc.id
          });
        }
        
        // Check for expiring documents
        if (agentDoc?.expiryDate) {
          const expiryDate = new Date(agentDoc.expiryDate);
          const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry < 0) {
            alerts.push({
              agentId: agent.id,
              agentName: agent.name,
              type: 'expired',
              message: `${requiredDoc.name} has expired`,
              docId: requiredDoc.id,
              daysOverdue: Math.abs(daysUntilExpiry)
            });
          } else if (daysUntilExpiry <= warningDays) {
            alerts.push({
              agentId: agent.id,
              agentName: agent.name,
              type: 'warning',
              message: `${requiredDoc.name} expires in ${daysUntilExpiry} days`,
              docId: requiredDoc.id,
              daysRemaining: daysUntilExpiry
            });
          }
        }
      });
    });

    setComplianceAlerts(alerts);
  };

  // Get compliance status color
  const getComplianceColor = (status) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'non_compliant': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Add new agent form component
  const AddAgentForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      phone: '',
      role: 'sales_agent',
      startDate: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      
      const newAgent = {
        id: Date.now(),
        ...formData,
        status: 'pending',
        complianceStatus: 'non_compliant',
        documents: [],
        permissions: agentRoles[formData.role].permissions,
        performance: {
          salesThisMonth: 0,
          listingsActive: 0,
          clientSatisfaction: 0
        }
      };

      setAgents([...agents, newAgent]);
      setShowAddAgent(false);
      
      // Send onboarding email
      sendOnboardingEmail(newAgent);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-[#636B56] mb-4">Add New Agent</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#636B56]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#636B56]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#636B56]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#636B56]"
                >
                  {Object.entries(agentRoles).map(([key, role]) => (
                    <option key={key} value={key}>{role.title}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#636B56]"
                />
              </div>
            </div>

            {/* Required Documents Preview */}
            <div className="mt-6">
              <h3 className="font-semibold text-gray-800 mb-3">Required Compliance Documents</h3>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800 mb-3">
                  The following documents must be provided before agent can be activated:
                </p>
                <ul className="space-y-2">
                  {agentRoles[formData.role].requiredDocs.map(doc => (
                    <li key={doc.id} className="flex items-center gap-2 text-sm">
                      <DocumentCheckIcon className={`h-4 w-4 ${doc.critical ? 'text-red-600' : 'text-gray-600'}`} />
                      <span className={doc.critical ? 'font-semibold' : ''}>
                        {doc.name}
                        {doc.critical && <span className="text-red-600 ml-1">*</span>}
                      </span>
                      {doc.expiry && <span className="text-gray-500">(Expires)</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Permissions Preview */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Role Permissions</h3>
              <div className="flex flex-wrap gap-2">
                {agentRoles[formData.role].permissions.map(permission => (
                  <span key={permission} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    {permission.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowAddAgent(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365]"
              >
                Add Agent & Send Onboarding
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Send onboarding email
  const sendOnboardingEmail = async (agent) => {
    // In production, this would send actual email
    console.log('Sending onboarding email to:', agent.email);
    
    const onboardingLink = `${window.location.origin}/onboarding/${agent.id}`;
    const requiredDocs = agentRoles[agent.role].requiredDocs;
    
    // Email template would include:
    // - Welcome message
    // - Link to onboarding portal
    // - List of required documents
    // - Deadline for submission
    // - Contact information for help
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#636B56]">Agent Management</h1>
              <p className="text-gray-600 mt-1">Manage agents, permissions, and compliance</p>
            </div>
            <button
              onClick={() => setShowAddAgent(true)}
              className="px-6 py-3 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365] flex items-center gap-2"
            >
              <UserGroupIcon className="h-5 w-5" />
              Add New Agent
            </button>
          </div>
        </div>

        {/* Compliance Alerts */}
        {complianceAlerts.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6 rounded-lg">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 mb-3">Compliance Alerts</h3>
                <div className="space-y-2">
                  {complianceAlerts.slice(0, 5).map((alert, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <p className="text-sm text-red-700">
                        <strong>{alert.agentName}:</strong> {alert.message}
                      </p>
                      {alert.type === 'expired' && (
                        <span className="text-xs text-red-600 font-semibold">
                          {alert.daysOverdue} days overdue
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Agents</p>
                <p className="text-2xl font-bold text-[#636B56]">{agents.length}</p>
              </div>
              <UserGroupIcon className="h-10 w-10 text-gray-300" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compliant</p>
                <p className="text-2xl font-bold text-green-600">
                  {agents.filter(a => a.complianceStatus === 'compliant').length}
                </p>
              </div>
              <CheckCircleIcon className="h-10 w-10 text-green-200" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {agents.filter(a => a.complianceStatus === 'warning').length}
                </p>
              </div>
              <ExclamationTriangleIcon className="h-10 w-10 text-yellow-200" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Documents Due</p>
                <p className="text-2xl font-bold text-red-600">{complianceAlerts.length}</p>
              </div>
              <DocumentCheckIcon className="h-10 w-10 text-red-200" />
            </div>
          </div>
        </div>

        {/* Agents List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-[#636B56]">Active Agents</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compliance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documents</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {agents.map(agent => (
                  <tr key={agent.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{agent.name}</p>
                        <p className="text-sm text-gray-500">{agent.email}</p>
                        <p className="text-sm text-gray-500">{agent.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{agentRoles[agent.role].title}</p>
                        <p className="text-xs text-gray-500">Since {agent.startDate}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getComplianceColor(agent.complianceStatus)}`}>
                        {agent.complianceStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p>Sales: {agent.performance.salesThisMonth}</p>
                        <p>Listings: {agent.performance.listingsActive}</p>
                        <p>Rating: ⭐ {agent.performance.clientSatisfaction}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {agentRoles[agent.role].requiredDocs.map(doc => {
                          const agentDoc = agent.documents?.find(d => d.docId === doc.id);
                          return (
                            <div key={doc.id} className="relative group">
                              <DocumentCheckIcon 
                                className={`h-5 w-5 cursor-pointer ${
                                  agentDoc?.uploaded 
                                    ? agentDoc.status === 'valid' ? 'text-green-600' 
                                    : agentDoc.status === 'expiring_soon' ? 'text-yellow-600'
                                    : 'text-red-600'
                                  : 'text-gray-300'
                                }`}
                              />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                                {doc.name}
                                {agentDoc?.expiryDate && ` (Exp: ${agentDoc.expiryDate})`}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedAgent(agent)}
                          className="text-[#636B56] hover:text-[#7a8365]"
                        >
                          View
                        </button>
                        <button className="text-blue-600 hover:text-blue-700">
                          Documents
                        </button>
                        <button className="text-gray-600 hover:text-gray-700">
                          Permissions
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Agent Modal */}
        {showAddAgent && <AddAgentForm />}
      </div>
    </Layout>
  );
}