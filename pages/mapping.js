import { useState } from 'react';
import Layout from '../components/Layout';

export default function Mapping() {
  const [selectedSuburb, setSelectedSuburb] = useState('Parramatta');
  const [mapView, setMapView] = useState('contacts');
  
  // Sample data for properties with contact info
  const [properties] = useState([
    { id: 1, address: '123 Main St', hasContact: true, contactName: 'John Smith', phone: '0412345678', lat: -33.8151, lng: 151.0011 },
    { id: 2, address: '456 Church St', hasContact: true, contactName: 'Sarah Wilson', phone: '0423456789', lat: -33.8161, lng: 151.0021 },
    { id: 3, address: '789 George St', hasContact: false, contactName: null, phone: null, lat: -33.8141, lng: 151.0031 },
    { id: 4, address: '321 Macquarie St', hasContact: true, contactName: 'Michael Chen', phone: '0434567890', lat: -33.8171, lng: 151.0041 },
    { id: 5, address: '654 Victoria Rd', hasContact: false, contactName: null, phone: null, lat: -33.8131, lng: 151.0051 },
    { id: 6, address: '987 Smith St', hasContact: true, contactName: 'Emma Thompson', phone: '0445678901', lat: -33.8181, lng: 151.0061 },
  ]);

  const suburbs = [
    'Parramatta', 'Westmead', 'Harris Park', 'Granville', 
    'Liverpool', 'Bankstown', 'Blacktown', 'Penrith',
    'Castle Hill', 'Baulkham Hills', 'Ryde', 'Chatswood'
  ];

  const stats = {
    totalProperties: properties.length,
    withContacts: properties.filter(p => p.hasContact).length,
    withoutContacts: properties.filter(p => !p.hasContact).length,
    contactRate: Math.round((properties.filter(p => p.hasContact).length / properties.length) * 100)
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
                Property Mapping
              </h1>
              <p className="text-[#7a7a7a] mt-2">Interactive suburb map showing properties with contact information</p>
            </div>
            <select 
              value={selectedSuburb}
              onChange={(e) => setSelectedSuburb(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
            >
              {suburbs.map(suburb => (
                <option key={suburb} value={suburb}>{suburb}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Map Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Properties</p>
            <p className="text-2xl font-bold text-[#636B56]">{stats.totalProperties}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">With Contacts</p>
            <p className="text-2xl font-bold text-green-600">{stats.withContacts}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Without Contacts</p>
            <p className="text-2xl font-bold text-red-600">{stats.withoutContacts}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Contact Rate</p>
            <p className="text-2xl font-bold text-[#636B56]">{stats.contactRate}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Interactive Map */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#636B56]">{selectedSuburb} Map</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setMapView('contacts')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    mapView === 'contacts' 
                      ? 'bg-[#636B56] text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Contact Status
                </button>
                <button
                  onClick={() => setMapView('heat')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    mapView === 'heat' 
                      ? 'bg-[#636B56] text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Heat Map
                </button>
              </div>
            </div>
            
            {/* Map Container */}
            <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-lg h-96 overflow-hidden">
              {/* Simulated Map */}
              <div className="absolute inset-0 p-4">
                <div className="relative h-full">
                  {/* Property Markers */}
                  {properties.map((property, index) => (
                    <div
                      key={property.id}
                      className="absolute cursor-pointer group"
                      style={{
                        top: `${20 + (index * 15) % 70}%`,
                        left: `${10 + (index * 25) % 80}%`
                      }}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg transition-transform hover:scale-150 ${
                        property.hasContact ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        <p className="font-medium text-sm">{property.address}</p>
                        {property.hasContact ? (
                          <>
                            <p className="text-xs text-gray-600">{property.contactName}</p>
                            <p className="text-xs text-gray-600">{property.phone}</p>
                          </>
                        ) : (
                          <p className="text-xs text-red-600">No contact info</p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Map Legend */}
                  <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3">
                    <p className="text-xs font-medium mb-2">Legend</p>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-xs">Has Contact Info</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-xs">No Contact Info</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Map Overlay Message */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded-lg px-3 py-2">
                <p className="text-sm font-medium">Interactive Map</p>
                <p className="text-xs text-gray-600">Hover over markers for details</p>
              </div>
            </div>
          </div>

          {/* Property List */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-[#636B56] mb-4">Properties in {selectedSuburb}</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {properties.map(property => (
                <div 
                  key={property.id} 
                  className={`border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow ${
                    property.hasContact ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <p className="font-medium">{property.address}</p>
                  {property.hasContact ? (
                    <div className="mt-1">
                      <p className="text-sm text-gray-600">{property.contactName}</p>
                      <p className="text-sm text-gray-600">{property.phone}</p>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <p className="text-sm text-red-600">No contact information</p>
                      <button className="text-xs bg-[#636B56] text-white px-2 py-1 rounded mt-1 hover:bg-[#7a8365] transition-colors">
                        Add Contact
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#7a8365] transition-colors">
              Export Contact List
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Start Door Knocking Campaign
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
              Import Property Data
            </button>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
              Generate Heat Report
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}