import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [viewingContact, setViewingContact] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [contactsPerPage] = useState(50); // Show 50 contacts per page
  const [totalContacts, setTotalContacts] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    status: 'Active',
    notes: '',
    tags: []
  });
  
  // Authentication disabled for demo
  const user = { id: '1', email: 'demo@voicrm.com' };

  useEffect(() => {
    fetchContacts(currentPage, searchTerm, filterStatus);
  }, [currentPage, filterStatus, sortField, sortOrder]);

  // Debounced search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        setCurrentPage(1); // Reset to first page on search
        fetchContacts(1, searchTerm, filterStatus);
      }
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchContacts = async (page = 1, search = '', status = 'all') => {
    try {
      setLoading(true);
      
      // Build query params for pagination and filtering
      const params = new URLSearchParams({
        page: page.toString(),
        limit: contactsPerPage.toString(),
        search: search,
        status: status,
        sortField: sortField,
        sortOrder: sortOrder
      });
      
      const response = await fetch(`/api/contacts?${params}`);
      const data = await response.json();
      
      if (data) {
        console.log(`Loaded ${data.contacts?.length || 0} contacts (page ${page} of ${Math.ceil(data.total / contactsPerPage)})`);
        setContacts(data.contacts || []);
        setTotalContacts(data.total || 0);
        setLoading(false);
        return;
      }
      
      // Use mock data as fallback
      setContacts(getMockContacts());
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setContacts(getMockContacts());
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingContact) {
        const updatedContact = {
          ...editingContact,
          ...formData,
          updated_at: new Date().toISOString()
        };
        
        setContacts(contacts.map(c => c.id === editingContact.id ? updatedContact : c));
        setEditingContact(null);
      } else {
        const newContact = {
          id: Date.now().toString(),
          ...formData,
          user_id: user.id,
          created_at: new Date().toISOString()
        };
        
        setContacts([newContact, ...contacts]);
      }
      
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Error saving contact. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      setContacts(contacts.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Error deleting contact. Please try again.');
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      address: contact.address || '',
      status: contact.status || 'Active',
      notes: contact.notes || '',
      tags: contact.tags || []
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      status: 'Active',
      notes: '',
      tags: []
    });
    setEditingContact(null);
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalContacts / contactsPerPage);
  const startIndex = (currentPage - 1) * contactsPerPage;
  const endIndex = startIndex + contactsPerPage;
  
  // Client-side filtering is now handled by the API
  const displayContacts = contacts;

  // Pagination component
  const Pagination = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="flex justify-between flex-1 sm:hidden">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(endIndex, totalContacts)}</span> of{' '}
              <span className="font-medium">{totalContacts}</span> contacts
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                Prev
              </button>
              {pageNumbers.map(number => (
                <button
                  key={number}
                  onClick={() => setCurrentPage(number)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                    currentPage === number
                      ? 'z-10 bg-[#636B56] text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {number}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50"
              >
                Last
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  const getMockContacts = () => [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '(555) 123-4567',
      company: 'Tech Corp',
      address: '123 Main St, New York, NY',
      status: 'Active',
      notes: 'Interested in downtown properties',
      tags: ['buyer', 'investor'],
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.j@example.com',
      phone: '(555) 234-5678',
      company: 'Design Studio',
      address: '456 Oak Ave, Los Angeles, CA',
      status: 'Active',
      notes: 'Looking for commercial space',
      tags: ['commercial', 'tenant'],
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Michael Brown',
      email: 'mbrown@example.com',
      phone: '(555) 345-6789',
      company: 'Brown Industries',
      address: '789 Pine Rd, Chicago, IL',
      status: 'Prospect',
      notes: 'Potential investor',
      tags: ['investor', 'high-value'],
      created_at: new Date().toISOString()
    }
  ];

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#864936]">Contacts</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your contacts and customer relationships • Includes Pipedrive imported data
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                ✓ Pipedrive Synced
              </span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                {totalContacts} Total Contacts
              </span>
              {contacts.filter(c => c.needs_attention).length > 0 && (
                <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs">
                  ⚠ {contacts.filter(c => c.needs_attention).length} Need Attention
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#864936] transition-colors"
          >
            Add Contact
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search contacts..."
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
            <option value="all">All Contacts</option>
            <option value="needs_attention">⚠ Needs Attention</option>
            <option value="Active">Active</option>
            <option value="Prospect">Prospect</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#636B56]"></div>
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#F8F2E7]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayContacts.map((contact) => (
                    <tr 
                      key={contact.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setViewingContact(contact)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900 hover:text-blue-600">{contact.name}</div>
                          {contact.needs_attention && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                              ⚠ Needs Attention
                            </span>
                          )}
                        </div>
                        {contact.needs_attention && contact.attention_reasons && (
                          <div className="text-xs text-amber-600 mt-1">
                            {contact.attention_reasons.join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{contact.email}</div>
                        <div className="text-sm text-gray-500">{contact.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{contact.company}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          contact.status === 'Active' ? 'bg-green-100 text-green-800' :
                          contact.status === 'Prospect' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {contact.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {contact.tags?.map((tag, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-[#B28354] text-white rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(contact)}
                          className="text-[#636B56] hover:text-[#864936] mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Improved Pagination Controls */}
              {totalContacts > contactsPerPage && (
                <div className="mt-6 flex justify-between items-center">
                  <div className="text-sm text-gray-700">
                    Showing {(currentPage - 1) * contactsPerPage + 1} to {Math.min(currentPage * contactsPerPage, totalContacts)} of {totalContacts} contacts
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">
                      {currentPage} of {Math.ceil(totalContacts / contactsPerPage)}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalContacts / contactsPerPage)))}
                      disabled={currentPage === Math.ceil(totalContacts / contactsPerPage)}
                      className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
              
              {displayContacts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No contacts found
                </div>
              )}
            </div>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editingContact ? 'Edit Contact' : 'Add New Contact'}
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
                    <label className="block text-sm font-medium text-gray-700">Company</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
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
                      <option value="Active">Active</option>
                      <option value="Prospect">Prospect</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tags (comma separated)</label>
                    <input
                      type="text"
                      value={formData.tags.join(', ')}
                      onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                      placeholder="buyer, investor, commercial"
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
                    {editingContact ? 'Update' : 'Add'} Contact
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Contact Profile Modal - Full Pipedrive-style View */}
        {viewingContact && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-black opacity-50" onClick={() => setViewingContact(null)}></div>
              
              <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative z-10">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-3xl font-bold">{viewingContact.name}</h2>
                      <div className="mt-2 flex items-center gap-4 text-blue-100">
                        {viewingContact.company && <span>🏢 {viewingContact.company}</span>}
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          viewingContact.status === 'lead' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                        }`}>
                          {viewingContact.status?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setViewingContact(null)}
                      className="text-white hover:text-gray-200"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content Grid */}
                <div className="p-6 grid grid-cols-2 gap-6">
                  {/* Left Column - Contact Details */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        📞 Contact Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        {viewingContact.phone_number && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Phone:</span>
                            <a href={`tel:${viewingContact.phone_number}`} className="text-blue-600 hover:underline font-medium">
                              {viewingContact.phone_number}
                            </a>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `/twilio-browser-phone?number=${viewingContact.phone_number}`;
                              }}
                              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                            >
                              Call Now
                            </button>
                          </div>
                        )}
                        {viewingContact.email && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Email:</span>
                            <a href={`mailto:${viewingContact.email}`} className="text-blue-600 hover:underline">
                              {viewingContact.email}
                            </a>
                          </div>
                        )}
                        {viewingContact.first_name && (
                          <div><span className="text-gray-600">First Name:</span> {viewingContact.first_name}</div>
                        )}
                        {viewingContact.last_name && (
                          <div><span className="text-gray-600">Last Name:</span> {viewingContact.last_name}</div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-3">📊 Activity & Engagement</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-gray-600">Source:</span> {viewingContact.source}</div>
                        <div><span className="text-gray-600">Added:</span> {new Date(viewingContact.created_at).toLocaleDateString()}</div>
                        {viewingContact.last_contact_date && (
                          <div><span className="text-gray-600">Last Contact:</span> {new Date(viewingContact.last_contact_date).toLocaleDateString()}</div>
                        )}
                        {viewingContact.next_follow_up && (
                          <div className="text-orange-600 font-medium">
                            ⏰ Next Follow-up: {new Date(viewingContact.next_follow_up).toLocaleDateString()}
                          </div>
                        )}
                        {viewingContact.lead_score && (
                          <div className="mt-2">
                            <span className="text-gray-600">Lead Score:</span>
                            <div className="mt-1 flex items-center gap-1">
                              {[...Array(10)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`h-2 w-6 rounded ${
                                    i < viewingContact.lead_score ? 'bg-green-500' : 'bg-gray-300'
                                  }`}
                                ></div>
                              ))}
                              <span className="ml-2 text-sm font-medium">{viewingContact.lead_score}/10</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Notes & Properties */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-3">📝 Notes & Details</h3>
                      <div className="text-sm text-gray-700">
                        {viewingContact.notes || 'No notes available'}
                      </div>
                      {viewingContact.property_interests && viewingContact.property_interests.length > 0 && (
                        <div className="mt-3">
                          <span className="text-gray-600 text-sm">Property Interests:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {viewingContact.property_interests.map((interest, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Deal Information */}
                    {(viewingContact.open_deals_count > 0 || viewingContact.won_deals_count > 0) && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h3 className="font-semibold text-green-800 mb-3">💰 Deal Information</h3>
                        <div className="space-y-2 text-sm">
                          {viewingContact.open_deals_count > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Open Deals:</span>
                              <span className="font-semibold text-green-600">{viewingContact.open_deals_count}</span>
                            </div>
                          )}
                          {viewingContact.won_deals_count > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Won Deals:</span>
                              <span className="font-semibold text-green-700">{viewingContact.won_deals_count}</span>
                            </div>
                          )}
                          {viewingContact.lost_deals_count > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Lost Deals:</span>
                              <span className="text-gray-500">{viewingContact.lost_deals_count}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Activity Stats */}
                    {viewingContact.activities_count > 0 && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="font-semibold text-blue-800 mb-3">📊 Activity Statistics</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Activities:</span>
                            <span className="font-semibold">{viewingContact.activities_count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Completed:</span>
                            <span className="text-green-600">{viewingContact.done_activities_count || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Pending:</span>
                            <span className="text-orange-600">{viewingContact.undone_activities_count || 0}</span>
                          </div>
                          {viewingContact.email_messages_count > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Email Messages:</span>
                              <span>{viewingContact.email_messages_count}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-3">🎯 Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <button className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
                          📧 Send Email
                        </button>
                        <button className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm">
                          📅 Schedule Meeting
                        </button>
                        <button className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm">
                          🏠 Show Properties
                        </button>
                        <button className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm">
                          📝 Add Note
                        </button>
                      </div>
                    </div>

                    {/* Pipedrive Integration */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-800 mb-2">🔗 Pipedrive Integration</h3>
                      <div className="text-sm text-blue-700">
                        {viewingContact.notes?.includes('Pipedrive ID:') && (
                          <div>
                            {viewingContact.notes.match(/Pipedrive ID: (\d+)/)?.[1] && (
                              <a
                                href={`https://oakmontrealty.pipedrive.com/person/${viewingContact.notes.match(/Pipedrive ID: (\d+)/)?.[1]}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline font-medium"
                              >
                                View in Pipedrive →
                              </a>
                            )}
                          </div>
                        )}
                        <div className="mt-2 text-xs text-gray-600">
                          Last synced: {new Date(viewingContact.updated_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="border-t bg-gray-50 px-6 py-4 flex justify-between">
                  <button
                    onClick={() => {
                      setEditingContact(viewingContact);
                      setViewingContact(null);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Edit Contact
                  </button>
                  <button
                    onClick={() => setViewingContact(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}