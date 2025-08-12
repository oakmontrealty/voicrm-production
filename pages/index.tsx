                            <User className="h-4 w-4 text-white" />
                          </div>
                          <span className="ml-3 font-medium">{call.contacts?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`flex items-center space-x-1 ${
                          call.direction === 'inbound' ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          <Phone className="h-4 w-4" />
                          <span className="capitalize">{call.direction}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono">
                        {call.duration ? `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {new Date(call.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                          call.status === 'completed' ? 'bg-green-100 text-green-800' :
                          call.status === 'missed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {call.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {call.recording_url ? (
                          <button className="text-oakmont-sage hover:text-oakmont-brown">
                            <Volume2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Add Contact</h3>
              <button
                onClick={() => setShowAddContact(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Name *"
                value={newContact.name}
                onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-oakmont-sage focus:border-transparent"
              />
              <input
                type="tel"
                placeholder="Phone *"
                value={newContact.phone_number}
                onChange={(e) => setNewContact(prev => ({ ...prev, phone_number: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-oakmont-sage focus:border-transparent"
              />
              <input
                type="email"
                placeholder="Email"
                value={newContact.email}
                onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-oakmont-sage focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Company"
                value={newContact.company}
                onChange={(e) => setNewContact(prev => ({ ...prev, company: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-oakmont-sage focus:border-transparent"
              />
              <textarea
                placeholder="Notes"
                value={newContact.notes}
                onChange={(e) => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-oakmont-sage focus:border-transparent"
                rows="3"
              />
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddContact(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addContact}
                disabled={!newContact.name || !newContact.phone_number}
                className="flex-1 bg-oakmont-sage text-white py-2 px-4 rounded-lg hover:bg-oakmont-brown disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialpad Modal */}
      {isDialpadOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Dialpad</h3>
              <button
                onClick={() => setIsDialpadOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                value={dialNumber}
                onChange={(e) => setDialNumber(e.target.value)}
                placeholder="Enter number..."
                className="w-full p-3 text-center text-lg font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-oakmont-sage focus:border-transparent"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((button) => (
                <button
                  key={button}
                  onClick={() => setDialNumber(prev => prev + button)}
                  className="h-12 bg-gray-100 hover:bg-gray-200 rounded-lg text-lg font-medium transition-colors"
                >
                  {button}
                </button>
              ))}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setDialNumber('')}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  // Make call with dialNumber
                  console.log('Calling:', dialNumber)
                  setIsDialpadOpen(false)
                }}
                disabled={!dialNumber || currentCall !== null}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Phone className="h-4 w-4" />
                <span>Call</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsDialpadOpen(true)}
        className="fixed bottom-6 right-6 bg-oakmont-sage text-white p-4 rounded-full shadow-lg hover:bg-oakmont-brown transition-colors"
      >
        <Phone className="h-6 w-6" />
      </button>
    </div>
  )
}