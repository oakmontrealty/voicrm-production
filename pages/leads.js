import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'New',
    priority: 'Medium',
    source: '',
    value: '',
    notes: '',
    tags: []
  });
  
  // const { user } = useAuth(); // Disabled auth for demo

  const leadStatuses = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
  const priorities = ['Low', 'Medium', 'High', 'Urgent'];
  const sources = ['Website', 'Referral', 'Cold Call', 'Email', 'Social Media', 'Event', 'Other'];

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      // Using mock data for demo
      setLeads(getMockLeads());
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads(getMockLeads());
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingLead) {
        const updatedLead = {
          ...editingLead,
          ...formData,
          value: formData.value ? parseFloat(formData.value) : null,
          updated_at: new Date().toISOString()
        };
        
        setLeads(leads.map(l => l.id === editingLead.id ? updatedLead : l));
        setEditingLead(null);
      } else {
        const newLead = {
          id: Date.now().toString(),
          ...formData,
          value: formData.value ? parseFloat(formData.value) : null,
          user_id: '1',
          assigned_to: '1',
          created_at: new Date().toISOString()
        };
        
        setLeads([newLead, ...leads]);
      }
      
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving lead:', error);
      alert('Error saving lead. Please try again.');
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      const lead = leads.find(l => l.id === leadId);
      const updateData = {
        ...lead,
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      if (newStatus === 'Won' || newStatus === 'Lost') {
        updateData.converted_at = new Date().toISOString();
      }
      
      setLeads(leads.map(l => l.id === leadId ? updateData : l));
      
      if (newStatus === 'Won') {
        alert('Congratulations! Lead converted successfully!');
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      alert('Error updating lead status. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    
    try {
      setLeads(leads.filter(l => l.id !== id));
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Error deleting lead. Please try again.');
    }
  };

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || '',
      status: lead.status || 'New',
      priority: lead.priority || 'Medium',
      source: lead.source || '',
      value: lead.value || '',
      notes: lead.notes || '',
      tags: lead.tags || []
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      status: 'New',
      priority: 'Medium',
      source: '',
      value: '',
      notes: '',
      tags: []
    });
    setEditingLead(null);
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || lead.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getLeadsByStatus = (status) => {
    return filteredLeads.filter(lead => lead.status === status);
  };

  const getTotalValue = () => {
    return filteredLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
  };

  const getMockLeads = () => [
    {
      id: '1',
      name: 'Alice Thompson',
      email: 'alice@example.com',
      phone: '(555) 111-2222',
      company: 'Thompson Enterprises',
      status: 'New',
      priority: 'High',
      source: 'Website',
      value: 250000,
      notes: 'Interested in luxury condos',
      tags: ['luxury', 'condo'],
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Bob Wilson',
      email: 'bob@example.com',
      phone: '(555) 333-4444',
      company: 'Wilson & Co',
      status: 'Qualified',
      priority: 'Medium',
      source: 'Referral',
      value: 180000,
      notes: 'Looking for office space',
      tags: ['commercial', 'office'],
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Carol Davis',
      email: 'carol@example.com',
      phone: '(555) 555-6666',
      company: '',
      status: 'Proposal',
      priority: 'Urgent',
      source: 'Cold Call',
      value: 320000,
      notes: 'Ready to buy this month',
      tags: ['urgent', 'residential'],
      created_at: new Date().toISOString()
    }
  ];

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Urgent': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#864936]">Leads Pipeline</h1>
            <p className="mt-1 text-sm text-gray-600">
              Track and manage your sales opportunities
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'kanban' : 'table')}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {viewMode === 'table' ? 'Kanban View' : 'Table View'}
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#864936] transition-colors"
            >
              Add Lead
            </button>
          </div>
        </div>

        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-[#864936]">{filteredLeads.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pipeline Value</p>
              <p className="text-2xl font-bold text-[#636B56]">${getTotalValue().toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Won This Month</p>
              <p className="text-2xl font-bold text-green-600">{getLeadsByStatus('Won').length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-[#B28354]">
                {filteredLeads.length > 0 
                  ? Math.round((getLeadsByStatus('Won').length / filteredLeads.length) * 100) 
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
              style={{ color: '#636B56' }}  // Green font color for search input
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
          >
            <option value="all">All Status</option>
            {leadStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
          >
            <option value="all">All Priority</option>
            {priorities.map(priority => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#636B56]"></div>
          </div>
        ) : viewMode === 'table' ? (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#F8F2E7]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lead
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                        <div className="text-sm text-gray-500">{lead.company}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lead.email}</div>
                        <div className="text-sm text-gray-500">{lead.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          className="text-sm border-gray-300 rounded focus:ring-[#636B56] focus:border-[#636B56]"
                        >
                          {leadStatuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(lead.priority)}`}>
                          {lead.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${lead.value?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.source}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(lead)}
                          className="text-[#636B56] hover:text-[#864936] mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLeads.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No leads found
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-4">
            {leadStatuses.map(status => (
              <div key={status} className="bg-gray-100 rounded-lg p-3">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm">
                  {status} ({getLeadsByStatus(status).length})
                </h3>
                <div className="space-y-2">
                  {getLeadsByStatus(status).map(lead => (
                    <div
                      key={lead.id}
                      className="bg-white rounded-lg p-3 shadow cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleEdit(lead)}
                    >
                      <div className="font-medium text-sm text-gray-900">{lead.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{lead.company}</div>
                      <div className="mt-2 flex justify-between items-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${getPriorityColor(lead.priority)}`}>
                          {lead.priority}
                        </span>
                        <span className="text-xs font-semibold text-[#636B56]">
                          ${lead.value?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editingLead ? 'Edit Lead' : 'Add New Lead'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                    >
                      {leadStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                    >
                      {priorities.map(priority => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Source</label>
                    <select
                      value={formData.source}
                      onChange={(e) => setFormData({...formData, source: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                    >
                      <option value="">Select Source</option>
                      {sources.map(source => (
                        <option key={source} value={source}>{source}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Value ($)</label>
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({...formData, value: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tags (comma separated)</label>
                    <input
                      type="text"
                      value={formData.tags.join(', ')}
                      onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                      placeholder="hot, investor, commercial"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#636B56] text-white rounded-md hover:bg-[#864936]"
                  >
                    {editingLead ? 'Update' : 'Add'} Lead
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}