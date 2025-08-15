import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';
import ProtectedRoute from '../components/auth/ProtectedRoute';

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    price: '',
    type: 'House',
    status: 'Available',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    lot_size: '',
    year_built: '',
    description: '',
    features: [],
    image_urls: []
  });
  
  const { user } = useAuth();

  const propertyTypes = ['House', 'Condo', 'Townhouse', 'Multi-Family', 'Land', 'Commercial'];
  const propertyStatuses = ['Available', 'Pending', 'Sold', 'Off Market'];

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties(getMockProperties());
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const propertyData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
        sqft: formData.sqft ? parseInt(formData.sqft) : null,
        lot_size: formData.lot_size ? parseFloat(formData.lot_size) : null,
        year_built: formData.year_built ? parseInt(formData.year_built) : null,
      };

      if (editingProperty) {
        const { data, error } = await supabase
          .from('properties')
          .update({
            ...propertyData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProperty.id)
          .select()
          .single();

        if (error) throw error;
        
        setProperties(properties.map(p => p.id === editingProperty.id ? data : p));
        setEditingProperty(null);
      } else {
        const { data, error } = await supabase
          .from('properties')
          .insert([{
            ...propertyData,
            user_id: user.id,
            agent_id: user.id
          }])
          .select()
          .single();

        if (error) throw error;
        
        setProperties([data, ...properties]);
      }
      
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving property:', error);
      alert('Error saving property. Please try again.');
    }
  };

  const handleStatusChange = async (propertyId, newStatus) => {
    try {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      if (newStatus === 'Sold') {
        updateData.sold_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', propertyId)
        .select()
        .single();

      if (error) throw error;
      
      setProperties(properties.map(p => p.id === propertyId ? data : p));
    } catch (error) {
      console.error('Error updating property status:', error);
      alert('Error updating property status. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setProperties(properties.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Error deleting property. Please try again.');
    }
  };

  const handleEdit = (property) => {
    setEditingProperty(property);
    setFormData({
      title: property.title || '',
      address: property.address || '',
      city: property.city || '',
      state: property.state || '',
      zip_code: property.zip_code || '',
      price: property.price || '',
      type: property.type || 'House',
      status: property.status || 'Available',
      bedrooms: property.bedrooms || '',
      bathrooms: property.bathrooms || '',
      sqft: property.sqft || '',
      lot_size: property.lot_size || '',
      year_built: property.year_built || '',
      description: property.description || '',
      features: property.features || [],
      image_urls: property.image_urls || []
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      price: '',
      type: 'House',
      status: 'Available',
      bedrooms: '',
      bathrooms: '',
      sqft: '',
      lot_size: '',
      year_built: '',
      description: '',
      features: [],
      image_urls: []
    });
    setEditingProperty(null);
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || property.status === filterStatus;
    const matchesType = filterType === 'all' || property.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getPropertyStats = () => {
    const available = filteredProperties.filter(p => p.status === 'Available').length;
    const pending = filteredProperties.filter(p => p.status === 'Pending').length;
    const sold = filteredProperties.filter(p => p.status === 'Sold').length;
    const totalValue = filteredProperties.reduce((sum, p) => sum + (p.price || 0), 0);
    
    return { available, pending, sold, totalValue };
  };

  const getMockProperties = () => [
    {
      id: '1',
      title: 'Modern Downtown Loft',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip_code: '10001',
      price: 850000,
      type: 'Condo',
      status: 'Available',
      bedrooms: 2,
      bathrooms: 2,
      sqft: 1200,
      lot_size: null,
      year_built: 2019,
      description: 'Stunning modern loft in the heart of downtown with city views',
      features: ['Gym', 'Doorman', 'Rooftop', 'Parking'],
      image_urls: [],
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Suburban Family Home',
      address: '456 Oak Ave',
      city: 'Westchester',
      state: 'NY',
      zip_code: '10583',
      price: 1250000,
      type: 'House',
      status: 'Pending',
      bedrooms: 4,
      bathrooms: 3.5,
      sqft: 2800,
      lot_size: 0.5,
      year_built: 2015,
      description: 'Beautiful family home with large backyard and modern amenities',
      features: ['Pool', 'Garage', 'Fireplace', 'Garden'],
      image_urls: [],
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      title: 'Luxury Penthouse',
      address: '789 Park Ave',
      city: 'Manhattan',
      state: 'NY',
      zip_code: '10021',
      price: 3500000,
      type: 'Condo',
      status: 'Available',
      bedrooms: 3,
      bathrooms: 3,
      sqft: 2500,
      lot_size: null,
      year_built: 2021,
      description: 'Ultra-luxury penthouse with panoramic city views',
      features: ['Concierge', 'Gym', 'Pool', 'Wine Cellar'],
      image_urls: [],
      created_at: new Date().toISOString()
    }
  ];

  const stats = getPropertyStats();

  return (
    <ProtectedRoute>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#864936]">Properties</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your real estate listings
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {viewMode === 'grid' ? 'List View' : 'Grid View'}
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#864936] transition-colors"
            >
              Add Property
            </button>
          </div>
        </div>

        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">{stats.available}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Sold</p>
              <p className="text-2xl font-bold text-[#864936]">{stats.sold}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-[#636B56]">${stats.totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search properties..."
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
            {propertyStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
          >
            <option value="all">All Types</option>
            {propertyTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#636B56]"></div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <div key={property.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="h-48 bg-gradient-to-br from-[#636B56] to-[#864936] flex items-center justify-center">
                  <svg className="h-24 w-24 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{property.title}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      property.status === 'Available' ? 'bg-green-100 text-green-800' :
                      property.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      property.status === 'Sold' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {property.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {property.address}, {property.city}, {property.state} {property.zip_code}
                  </p>
                  <p className="text-2xl font-bold text-[#636B56] mb-3">
                    ${property.price?.toLocaleString()}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      {property.bedrooms} BR
                    </div>
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {property.bathrooms} BA
                    </div>
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      {property.sqft?.toLocaleString()} sqft
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <button
                      onClick={() => setSelectedProperty(property)}
                      className="text-[#636B56] hover:text-[#864936] text-sm font-medium"
                    >
                      View Details
                    </button>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleEdit(property)}
                        className="text-[#636B56] hover:text-[#864936] text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(property.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#F8F2E7]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProperties.map((property) => (
                    <tr key={property.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{property.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{property.address}</div>
                        <div className="text-sm text-gray-500">{property.city}, {property.state} {property.zip_code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#B28354] text-white">
                          {property.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#636B56]">
                        ${property.price?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {property.bedrooms} BR | {property.bathrooms} BA | {property.sqft?.toLocaleString()} sqft
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={property.status}
                          onChange={(e) => handleStatusChange(property.id, e.target.value)}
                          className="text-sm border-gray-300 rounded focus:ring-[#636B56] focus:border-[#636B56]"
                        >
                          {propertyStatuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(property)}
                          className="text-[#636B56] hover:text-[#864936] mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(property.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProperties.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No properties found
                </div>
              )}
            </div>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-lg bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editingProperty ? 'Edit Property' : 'Add New Property'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Property Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address *</label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                    <input
                      type="text"
                      value={formData.zip_code}
                      onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Property Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                    >
                      {propertyTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                    >
                      {propertyStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
                    <input
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({...formData, bedrooms: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bathrooms</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({...formData, bathrooms: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Square Feet</label>
                    <input
                      type="number"
                      value={formData.sqft}
                      onChange={(e) => setFormData({...formData, sqft: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Lot Size (acres)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.lot_size}
                      onChange={(e) => setFormData({...formData, lot_size: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Year Built</label>
                    <input
                      type="number"
                      value={formData.year_built}
                      onChange={(e) => setFormData({...formData, year_built: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Features (comma separated)</label>
                    <input
                      type="text"
                      value={formData.features.join(', ')}
                      onChange={(e) => setFormData({...formData, features: e.target.value.split(',').map(f => f.trim()).filter(f => f)})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#636B56] focus:ring-[#636B56]"
                      placeholder="Pool, Garage, Garden"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                    {editingProperty ? 'Update' : 'Add'} Property
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {selectedProperty && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-lg bg-white">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-gray-900">{selectedProperty.title}</h3>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-3xl font-bold text-[#636B56]">${selectedProperty.price?.toLocaleString()}</span>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    selectedProperty.status === 'Available' ? 'bg-green-100 text-green-800' :
                    selectedProperty.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    selectedProperty.status === 'Sold' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedProperty.status}
                  </span>
                </div>
                <p className="text-gray-600">
                  {selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip_code}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y">
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-semibold">{selectedProperty.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bedrooms</p>
                    <p className="font-semibold">{selectedProperty.bedrooms}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bathrooms</p>
                    <p className="font-semibold">{selectedProperty.bathrooms}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Square Feet</p>
                    <p className="font-semibold">{selectedProperty.sqft?.toLocaleString()}</p>
                  </div>
                  {selectedProperty.lot_size && (
                    <div>
                      <p className="text-sm text-gray-500">Lot Size</p>
                      <p className="font-semibold">{selectedProperty.lot_size} acres</p>
                    </div>
                  )}
                  {selectedProperty.year_built && (
                    <div>
                      <p className="text-sm text-gray-500">Year Built</p>
                      <p className="font-semibold">{selectedProperty.year_built}</p>
                    </div>
                  )}
                </div>
                {selectedProperty.features && selectedProperty.features.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Features</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProperty.features.map((feature, index) => (
                        <span key={index} className="px-3 py-1 bg-[#F8F2E7] text-[#864936] rounded-full text-sm">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedProperty.description && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Description</p>
                    <p className="text-gray-700">{selectedProperty.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}