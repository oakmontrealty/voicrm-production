import { useState } from 'react';
import Layout from '../components/Layout';

export default function Inspections() {
  const [inspections] = useState([
    {
      id: 1,
      property: '123 Oak Street, Downtown',
      client: 'John Smith',
      inspector: 'Professional Home Inspections Inc.',
      date: '2025-08-15',
      time: '10:00 AM',
      status: 'scheduled',
      type: 'General',
      cost: 450,
      estimatedDuration: '3-4 hours'
    },
    {
      id: 2,
      property: '456 Pine Avenue, Suburbs',
      client: 'Sarah Johnson',
      inspector: 'Elite Property Services',
      date: '2025-08-14',
      time: '2:00 PM',
      status: 'in_progress',
      type: 'Pre-listing',
      cost: 380,
      estimatedDuration: '2-3 hours'
    },
    {
      id: 3,
      property: '789 Elm Street, Westside',
      client: 'Mike Chen',
      inspector: 'Thorough Inspect Co.',
      date: '2025-08-12',
      time: '9:00 AM',
      status: 'completed',
      type: 'Buyer',
      cost: 520,
      estimatedDuration: '4-5 hours',
      reportUrl: '#'
    },
    {
      id: 4,
      property: '321 Maple Drive, Eastview',
      client: 'Anna Walsh',
      inspector: 'Certified Home Check',
      date: '2025-08-16',
      time: '11:00 AM',
      status: 'scheduled',
      type: 'Commercial',
      cost: 750,
      estimatedDuration: '6-8 hours'
    }
  ]);

  const [inspectors] = useState([
    { id: 1, name: 'Professional Home Inspections Inc.', rating: 4.8, completed: 245, phone: '(555) 123-4567' },
    { id: 2, name: 'Elite Property Services', rating: 4.9, completed: 189, phone: '(555) 234-5678' },
    { id: 3, name: 'Thorough Inspect Co.', rating: 4.7, completed: 312, phone: '(555) 345-6789' },
    { id: 4, name: 'Certified Home Check', rating: 4.6, completed: 198, phone: '(555) 456-7890' }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'General': return 'bg-gray-100 text-gray-800';
      case 'Pre-listing': return 'bg-purple-100 text-purple-800';
      case 'Buyer': return 'bg-green-100 text-green-800';
      case 'Commercial': return 'bg-blue-100 text-blue-800';
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
                Property Inspections
              </h1>
              <p className="text-[#7a7a7a] mt-2">Schedule and manage property inspections</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-[#864936] text-white px-4 py-2 rounded-lg hover:bg-[#9a5441] transition-colors">
                Find Inspector
              </button>
              <button className="bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#7a8365] transition-colors">
                + Schedule Inspection
              </button>
            </div>
          </div>
        </div>

        {/* Inspection Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Inspections</p>
            <p className="text-2xl font-bold text-[#636B56]">{inspections.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Scheduled</p>
            <p className="text-2xl font-bold text-[#636B56]">
              {inspections.filter(i => i.status === 'scheduled').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-2xl font-bold text-[#636B56]">
              {inspections.filter(i => i.status === 'in_progress').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Avg. Cost</p>
            <p className="text-2xl font-bold text-[#636B56]">
              ${Math.round(inspections.reduce((sum, i) => sum + i.cost, 0) / inspections.length)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inspections List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-[#636B56] mb-4">Scheduled Inspections</h2>
              <div className="space-y-4">
                {inspections.map(inspection => (
                  <div key={inspection.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{inspection.property}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(inspection.status)}`}>
                            {inspection.status.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(inspection.type)}`}>
                            {inspection.type}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Client:</p>
                            <p className="font-medium">{inspection.client}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Inspector:</p>
                            <p className="font-medium">{inspection.inspector}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Date & Time:</p>
                            <p className="font-medium">{inspection.date} at {inspection.time}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Duration:</p>
                            <p className="font-medium">{inspection.estimatedDuration}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#636B56]">${inspection.cost}</p>
                        <p className="text-sm text-gray-600">Inspection Fee</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t">
                      {inspection.status === 'completed' && inspection.reportUrl && (
                        <button className="text-sm px-3 py-1 bg-[#636B56] text-white rounded hover:bg-[#7a8365] transition-colors">
                          View Report
                        </button>
                      )}
                      <button className="text-sm px-3 py-1 border border-[#636B56] text-[#636B56] rounded hover:bg-[#636B56] hover:text-white transition-colors">
                        {inspection.status === 'scheduled' ? 'Reschedule' : 'View Details'}
                      </button>
                      <button className="text-sm px-3 py-1 border border-gray-300 text-gray-600 rounded hover:bg-gray-100 transition-colors">
                        Contact Inspector
                      </button>
                      {inspection.status === 'scheduled' && (
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
            {/* Quick Schedule */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#636B56] mb-4">Quick Schedule</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Address</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                    placeholder="Enter property address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Type</label>
                  <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent">
                    <option>General Inspection</option>
                    <option>Pre-listing Inspection</option>
                    <option>Buyer Inspection</option>
                    <option>Commercial Inspection</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-[#636B56] text-white py-2 rounded-lg hover:bg-[#7a8365] transition-colors"
                >
                  Request Quote
                </button>
              </form>
            </div>

            {/* Preferred Inspectors */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#636B56] mb-4">Preferred Inspectors</h3>
              <div className="space-y-3">
                {inspectors.map(inspector => (
                  <div key={inspector.id} className="p-3 border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{inspector.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center">
                            <span className="text-yellow-400 text-sm">★</span>
                            <span className="text-sm ml-1">{inspector.rating}</span>
                          </div>
                          <span className="text-xs text-gray-600">
                            {inspector.completed} inspections
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{inspector.phone}</p>
                      </div>
                      <button className="text-xs px-2 py-1 border border-[#636B56] text-[#636B56] rounded hover:bg-[#636B56] hover:text-white transition-colors">
                        Book
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inspection Checklist */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#636B56] mb-4">Pre-Inspection Checklist</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm">Utilities turned on</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm">Property accessible</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm">Clear access to all areas</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm">Remove personal items</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm">Inspector contact confirmed</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm">Client notified of timing</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}