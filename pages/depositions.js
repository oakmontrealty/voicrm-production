import { useState } from 'react';
import Layout from '../components/Layout';

export default function Depositions() {
  const [depositions, setDepositions] = useState([
    {
      id: 1,
      title: 'Property Disclosure - 123 Main St',
      type: 'Vendor Statement',
      date: '2024-08-10',
      status: 'Completed',
      parties: ['John Smith', 'Sarah Wilson'],
      property: '123 Main St, Parramatta'
    },
    {
      id: 2,
      title: 'Boundary Dispute Resolution',
      type: 'Legal Deposition',
      date: '2024-08-08',
      status: 'In Progress',
      parties: ['Michael Chen', 'David Brown'],
      property: '456 Oak Ave, Liverpool'
    },
    {
      id: 3,
      title: 'Building Inspection Report',
      type: 'Inspection',
      date: '2024-08-05',
      status: 'Under Review',
      parties: ['Emma Thompson'],
      property: '789 Elm Dr, Bankstown'
    }
  ]);

  const [showNewDeposition, setShowNewDeposition] = useState(false);
  const [selectedDeposition, setSelectedDeposition] = useState(null);

  const depositionTypes = [
    'Vendor Statement',
    'Legal Deposition',
    'Inspection Report',
    'Title Search',
    'Contract Review',
    'Dispute Resolution',
    'Compliance Certificate',
    'Development Application'
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
                Depositions
              </h1>
              <p className="text-[#7a7a7a] mt-2">Legal documents and property statements</p>
            </div>
            <button 
              onClick={() => setShowNewDeposition(true)}
              className="bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#7a8365] transition-colors"
            >
              + New Deposition
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Depositions</p>
            <p className="text-2xl font-bold text-[#636B56]">{depositions.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {depositions.filter(d => d.status === 'Completed').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-2xl font-bold text-yellow-600">
              {depositions.filter(d => d.status === 'In Progress').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Under Review</p>
            <p className="text-2xl font-bold text-blue-600">
              {depositions.filter(d => d.status === 'Under Review').length}
            </p>
          </div>
        </div>

        {/* Depositions List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Recent Depositions</h2>
          <div className="space-y-4">
            {depositions.map(deposition => (
              <div 
                key={deposition.id} 
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedDeposition(deposition)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{deposition.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{deposition.property}</p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-gray-600">Type: <span className="font-medium">{deposition.type}</span></span>
                      <span className="text-gray-600">Date: <span className="font-medium">{deposition.date}</span></span>
                      <span className="text-gray-600">Parties: <span className="font-medium">{deposition.parties.join(', ')}</span></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      deposition.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      deposition.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {deposition.status}
                    </span>
                    <div className="mt-3 flex gap-2">
                      <button className="text-sm text-[#636B56] hover:underline">View</button>
                      <button className="text-sm text-[#636B56] hover:underline">Edit</button>
                      <button className="text-sm text-[#636B56] hover:underline">Download</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Templates */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Document Templates</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {depositionTypes.map((type, index) => (
              <div 
                key={index}
                className="border rounded-lg p-4 hover:border-[#636B56] transition-colors cursor-pointer text-center"
              >
                <div className="text-3xl mb-2">📄</div>
                <p className="text-sm font-medium">{type}</p>
              </div>
            ))}
          </div>
        </div>

        {/* New Deposition Modal */}
        {showNewDeposition && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-[#636B56] mb-4">Create New Deposition</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                    placeholder="Enter deposition title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent">
                    {depositionTypes.map((type, index) => (
                      <option key={index} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                    placeholder="Enter property address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parties Involved</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                    placeholder="Enter names separated by commas"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                    placeholder="Enter deposition details"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Documents</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <button className="bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#7a8365] transition-colors">
                      Choose Files
                    </button>
                    <p className="text-sm text-gray-600 mt-2">or drag and drop files here</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowNewDeposition(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365] transition-colors">
                  Create Deposition
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selected Deposition Detail */}
        {selectedDeposition && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-[#636B56]">{selectedDeposition.title}</h2>
                  <p className="text-gray-600">{selectedDeposition.property}</p>
                </div>
                <button
                  onClick={() => setSelectedDeposition(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-medium">{selectedDeposition.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">{selectedDeposition.date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-medium">{selectedDeposition.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Parties</p>
                    <p className="font-medium">{selectedDeposition.parties.join(', ')}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Document Content</h3>
                  <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
                    <p className="text-gray-700">
                      [Document content would be displayed here]
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3">
                  <button className="px-4 py-2 border border-[#636B56] text-[#636B56] rounded-lg hover:bg-[#636B56]/5 transition-colors">
                    Edit
                  </button>
                  <button className="px-4 py-2 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365] transition-colors">
                    Download PDF
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