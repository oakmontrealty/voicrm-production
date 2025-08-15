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
  const [sortOrder, setSortOrder] = useState('asc');
  const [syncingPipedrive, setSyncingPipedrive] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null)
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
    // Check last sync time from localStorage
    const savedSyncTime = localStorage.getItem('pipedriveLastSync');
    if (savedSyncTime) {
      setLastSyncTime(new Date(savedSyncTime));
    }
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

  const syncWithPipedrive = async () => {
    setSyncingPipedrive(true);
    try {
      const response = await fetch('/api/pipedrive/sync-to-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('pipedriveLastSync', data.sync_time);
        setLastSyncTime(new Date(data.sync_time));
        
        // Refresh contacts display
        await fetchContacts(currentPage, searchTerm, filterStatus);
        
        alert(`${data.message}\n\nSynced: ${data.stats.synced}\nErrors: ${data.stats.errors}`);
      } else {
        alert('Failed to sync with Pipedrive: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Pipedrive sync error:', error);
      alert('Error syncing with Pipedrive. Please check your configuration.');
    } finally {
      setSyncingPipedrive(false);
    }
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
              Manage your contacts and customer relationships • Full Pipedrive integration
            </p>
            <div className="mt-2 flex items-center gap-2">
              {lastSyncTime ? (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  ✓ Last synced: {lastSyncTime.toLocaleString()}
                </span>
              ) : (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                  ⚠ Not synced with Pipedrive
                </span>
              )}
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
          <div className="flex gap-2">
            <button
              onClick={syncWithPipedrive}
              disabled={syncingPipedrive}
              className="bg-[#25D366] text-white px-4 py-2 rounded-lg hover:bg-[#22c55e] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {syncingPipedrive ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Syncing...
                </>
              ) : (
                <>🔄 Sync Pipedrive</>
              )}
            </button>
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

        {/* Premium Contact Profile Modal - Full Pipedrive Integration */}
        {viewingContact && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setViewingContact(null)}></div>
            
            <div className="fixed inset-y-0 right-0 flex max-w-7xl">
              <div className="w-screen max-w-7xl">
                <div className="h-full flex flex-col bg-white shadow-2xl">
                  {/* Premium Header with Gradient */}
                  <div className="relative bg-gradient-to-br from-[#636B56] via-[#7a8365] to-[#864936] text-white">
                    <div className="absolute inset-0 bg-black opacity-20"></div>
                    <div className="relative px-8 py-6">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-6">
                          {/* Avatar */}
                          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl font-bold border-2 border-white/30">
                            {viewingContact.picture_url ? (
                              <img src={viewingContact.picture_url} alt={viewingContact.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              viewingContact.name?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <h2 className="text-3xl font-bold mb-2">{viewingContact.name}</h2>
                            <div className="flex flex-wrap items-center gap-3 text-white/90">
                              {viewingContact.company && (
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4z" clipRule="evenodd" />
                                  </svg>
                                  {viewingContact.company}
                                </span>
                              )}
                              {viewingContact.owner_name && (
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                  </svg>
                                  {viewingContact.owner_name}
                                </span>
                              )}
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                viewingContact.status === 'Active' || viewingContact.status === 'hot' ? 'bg-green-500/80 text-white' : 
                                viewingContact.status === 'Prospect' || viewingContact.status === 'warm' ? 'bg-yellow-500/80 text-white' :
                                'bg-gray-500/80 text-white'
                              }`}>
                                {viewingContact.status?.toUpperCase()}
                              </span>
                              {viewingContact.lead_score && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs">Lead Score:</span>
                                  <div className="flex gap-0.5">
                                    {[...Array(10)].map((_, i) => (
                                      <div key={i} className={`w-1.5 h-3 rounded-sm ${
                                        i < viewingContact.lead_score ? 'bg-yellow-400' : 'bg-white/30'
                                      }`}></div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setViewingContact(null)}
                          className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Quick Stats Bar */}
                    <div className="mt-6 grid grid-cols-5 gap-4 pb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{viewingContact.open_deals_count || 0}</div>
                        <div className="text-xs text-white/70">Open Deals</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{viewingContact.won_deals_count || 0}</div>
                        <div className="text-xs text-white/70">Won Deals</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{viewingContact.activities_count || 0}</div>
                        <div className="text-xs text-white/70">Activities</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{viewingContact.notes_count || 0}</div>
                        <div className="text-xs text-white/70">Notes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          ${((viewingContact.total_deal_value || 0) / 1000).toFixed(0)}K
                        </div>
                        <div className="text-xs text-white/70">Deal Value</div>
                      </div>
                    </div>
                  </div>

                  {/* Tab Navigation */}
                  <div className="border-b border-gray-200 bg-gray-50">
                    <nav className="flex px-8 -mb-px">
                      {['Overview', 'Activities', 'Notes', 'Deals', 'Communications'].map((tab, idx) => (
                        <button
                          key={tab}
                          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                            idx === 0 
                              ? 'border-[#636B56] text-[#636B56]' 
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </nav>
                  </div>

                  {/* Scrollable Content Area */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-8 grid grid-cols-3 gap-8">
                      {/* Left Column - Contact & Activity Details */}
                      <div className="space-y-6">
                        {/* Contact Card */}
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                              <svg className="w-5 h-5 text-[#636B56]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              Contact Information
                            </h3>
                          </div>
                          <div className="p-5 space-y-3">
                            {viewingContact.phone_number && (
                              <div className="flex items-center justify-between group">
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Primary Phone</div>
                                  <a href={`tel:${viewingContact.phone_number}`} className="text-gray-900 font-medium hover:text-[#636B56] transition-colors">
                                    {viewingContact.phone_number}
                                  </a>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/twilio-browser-phone?number=${viewingContact.phone_number}`;
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600 flex items-center gap-1"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                  </svg>
                                  Call
                                </button>
                              </div>
                            )}
                            {viewingContact.all_phones?.slice(1).map((phone, idx) => (
                              <div key={idx}>
                                <div className="text-xs text-gray-500 mb-1">{phone.label || 'Other'}</div>
                                <a href={`tel:${phone.value}`} className="text-gray-700 hover:text-[#636B56]">
                                  {phone.value}
                                </a>
                              </div>
                            ))}
                            {viewingContact.email && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Primary Email</div>
                                <a href={`mailto:${viewingContact.email}`} className="text-gray-900 font-medium hover:text-[#636B56] transition-colors">
                                  {viewingContact.email}
                                </a>
                              </div>
                            )}
                            {viewingContact.all_emails?.slice(1).map((email, idx) => (
                              <div key={idx}>
                                <div className="text-xs text-gray-500 mb-1">{email.label || 'Other'}</div>
                                <a href={`mailto:${email.value}`} className="text-gray-700 hover:text-[#636B56]">
                                  {email.value}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Activity Timeline */}
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                              <svg className="w-5 h-5 text-[#636B56]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Activity Timeline
                            </h3>
                          </div>
                          <div className="p-5 space-y-4">
                            {viewingContact.next_activity_date && (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <div className="flex items-start gap-3">
                                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 animate-pulse"></div>
                                  <div className="flex-1">
                                    <div className="text-xs text-amber-600 font-semibold mb-1">NEXT ACTIVITY</div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {viewingContact.next_activity_subject || viewingContact.next_activity_type || 'Follow-up'}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                      {new Date(viewingContact.next_activity_date).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            {viewingContact.last_activity_date && (
                              <div>
                                <div className="flex items-start gap-3">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-1.5"></div>
                                  <div className="flex-1">
                                    <div className="text-xs text-gray-500 font-semibold mb-1">LAST ACTIVITY</div>
                                    <div className="text-sm text-gray-700">
                                      {viewingContact.last_activity_subject || viewingContact.last_activity_type || 'Activity'}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {new Date(viewingContact.last_activity_date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="pt-3 border-t border-gray-100">
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <span className="text-gray-500">Done:</span>
                                  <span className="ml-1 font-semibold text-gray-900">{viewingContact.done_activities_count || 0}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Pending:</span>
                                  <span className="ml-1 font-semibold text-amber-600">{viewingContact.undone_activities_count || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Middle Column - Notes & Communications */}
                      <div className="space-y-6">
                        {/* Notes Section */}
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                              <svg className="w-5 h-5 text-[#636B56]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Notes & History
                            </h3>
                            <span className="text-xs text-gray-500">{viewingContact.notes_count || 0} notes</span>
                          </div>
                          <div className="p-5">
                            {viewingContact.recent_notes && viewingContact.recent_notes.length > 0 ? (
                              <div className="space-y-3 max-h-96 overflow-y-auto">
                                {viewingContact.recent_notes.map((note, idx) => (
                                  <div key={idx} className="border-l-2 border-gray-200 pl-4 hover:border-[#636B56] transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="text-xs font-medium text-gray-600">{note.user}</span>
                                      <span className="text-xs text-gray-400">
                                        {new Date(note.add_time).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-800 whitespace-pre-wrap">
                                      {note.content}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : viewingContact.notes ? (
                              <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
                                {viewingContact.notes}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 italic">No notes available</div>
                            )}
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                              <svg className="w-5 h-5 text-[#636B56]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              Quick Actions
                            </h3>
                          </div>
                          <div className="p-5 grid grid-cols-2 gap-3">
                            <button className="px-4 py-2.5 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365] text-sm font-medium transition-colors flex items-center justify-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                              </svg>
                              Send Email
                            </button>
                            <button className="px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                              Schedule
                            </button>
                            <button className="px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                              </svg>
                              Call Now
                            </button>
                            <button className="px-4 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                              </svg>
                              Add Deal
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Deals & Metadata */}
                      <div className="space-y-6">
                        {/* Deals Section */}
                        {viewingContact.deals && viewingContact.deals.length > 0 ? (
                          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b border-gray-200">
                              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#636B56]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Deals Pipeline
                              </h3>
                            </div>
                            <div className="p-5 space-y-3 max-h-96 overflow-y-auto">
                              {viewingContact.deals.map((deal, idx) => (
                                <div key={idx} className={`border rounded-lg p-3 ${
                                  deal.status === 'open' ? 'border-blue-200 bg-blue-50' :
                                  deal.status === 'won' ? 'border-green-200 bg-green-50' :
                                  'border-gray-200 bg-gray-50'
                                }`}>
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <div className="font-medium text-gray-900">{deal.title}</div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        Created: {new Date(deal.add_time).toLocaleDateString()}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-semibold text-gray-900">
                                        ${(deal.value || 0).toLocaleString()}
                                      </div>
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        deal.status === 'open' ? 'bg-blue-200 text-blue-800' :
                                        deal.status === 'won' ? 'bg-green-200 text-green-800' :
                                        'bg-gray-200 text-gray-800'
                                      }`}>
                                        {deal.status?.toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                  {deal.probability && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500">Probability:</span>
                                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                        <div 
                                          className="bg-[#636B56] h-1.5 rounded-full"
                                          style={{ width: `${deal.probability}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs font-medium">{deal.probability}%</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b border-gray-200">
                              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#636B56]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Deal Summary
                              </h3>
                            </div>
                            <div className="p-5">
                              <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                  <div className="text-2xl font-bold text-blue-600">{viewingContact.open_deals_count || 0}</div>
                                  <div className="text-xs text-gray-500">Open</div>
                                </div>
                                <div>
                                  <div className="text-2xl font-bold text-green-600">{viewingContact.won_deals_count || 0}</div>
                                  <div className="text-xs text-gray-500">Won</div>
                                </div>
                                <div>
                                  <div className="text-2xl font-bold text-gray-400">{viewingContact.lost_deals_count || 0}</div>
                                  <div className="text-xs text-gray-500">Lost</div>
                                </div>
                              </div>
                              {viewingContact.total_deal_value > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                                  <div className="text-xs text-gray-500 mb-1">Total Value</div>
                                  <div className="text-xl font-bold text-[#636B56]">
                                    ${viewingContact.total_deal_value.toLocaleString()}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Metadata & Integration */}
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                              <svg className="w-5 h-5 text-[#636B56]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Details & Integration
                            </h3>
                          </div>
                          <div className="p-5 space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Source:</span>
                              <span className="font-medium">{viewingContact.source || 'Direct'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Added:</span>
                              <span className="font-medium">{new Date(viewingContact.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Updated:</span>
                              <span className="font-medium">{new Date(viewingContact.updated_at).toLocaleDateString()}</span>
                            </div>
                            {viewingContact.owner_name && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Owner:</span>
                                <span className="font-medium">{viewingContact.owner_name}</span>
                              </div>
                            )}
                            {viewingContact.pipedrive_id && (
                              <div className="pt-3 border-t border-gray-100">
                                <a
                                  href={`https://app.pipedrive.com/person/${viewingContact.pipedrive_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365] transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                  </svg>
                                  View in Pipedrive
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions Bar */}
                  <div className="border-t bg-gray-50 px-8 py-4">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setEditingContact(viewingContact);
                            setViewingContact(null);
                            setShowAddModal(true);
                          }}
                          className="px-4 py-2 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365] transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          Edit Contact
                        </button>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          Export
                        </button>
                      </div>
                      <div className="text-xs text-gray-500">
                        Contact ID: {viewingContact.id} • Last sync: {viewingContact.sync_time ? new Date(viewingContact.sync_time).toLocaleString() : 'Never'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}