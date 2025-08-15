import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ContactDetailsModal({ contact, onClose, onEdit }) {
  const [contactData, setContactData] = useState(contact);
  const [callHistory, setCallHistory] = useState([]);
  const [dealHistory, setDealHistory] = useState([]);
  const [propertyInterests, setPropertyInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const supabase = createClientComponentClient();

  useEffect(() => {
    if (contact) {
      loadContactDetails();
    }
  }, [contact]);

  const loadContactDetails = async () => {
    try {
      setLoading(true);
      
      // Load enhanced contact data from our database
      const { data: enhancedContact } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contact.id)
        .single();

      if (enhancedContact) {
        setContactData(enhancedContact);
      }

      // Load call history
      const { data: calls } = await supabase
        .from('call_logs')
        .select('*')
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setCallHistory(calls || []);

      // Load deal history
      const { data: deals } = await supabase
        .from('deals')
        .select('*')
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false });

      setDealHistory(deals || []);

      // Load property interests
      const { data: properties } = await supabase
        .from('property_interests')
        .select(`
          *,
          properties (
            address, price, bedrooms, bathrooms, sqft
          )
        `)
        .eq('contact_id', contact.id);

      setPropertyInterests(properties || []);

    } catch (error) {
      console.error('Error loading contact details:', error);
    } finally {
      setLoading(false);
    }
  };

  const initiateCall = async () => {
    if (!contactData.phone) return;
    
    try {
      const response = await fetch('/api/twilio/make-browser-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: contactData.phone,
          contactId: contactData.id
        })
      });

      if (response.ok) {
        // Log the call attempt
        await supabase
          .from('call_logs')
          .insert({
            contact_id: contactData.id,
            phone_number: contactData.phone,
            call_type: 'outbound',
            status: 'initiated',
            created_at: new Date().toISOString()
          });
        
        loadContactDetails(); // Refresh call history
      }
    } catch (error) {
      console.error('Error initiating call:', error);
    }
  };

  const sendText = async () => {
    if (!contactData.phone) return;
    
    // Open SMS composition modal or redirect to messaging
    window.open(`/messages?contact=${contactData.id}&phone=${contactData.phone}`, '_blank');
  };

  const formatPhoneNumber = (phone) => {
    const cleaned = phone?.replace(/\D/g, '');
    if (cleaned?.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getLeadScoreColor = (score) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    if (score >= 4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '👤' },
    { id: 'activity', label: 'Activity', icon: '📞' },
    { id: 'properties', label: 'Properties', icon: '🏠' },
    { id: 'deals', label: 'Deals', icon: '💰' }
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contact details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <div className="fixed inset-0 bg-black opacity-60" onClick={onClose}></div>
        
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden relative z-10">
          {/* Header with VoiCRM Branding */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="relative p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-4">
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl font-bold">
                    {contactData.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">{contactData.name || 'Unknown Contact'}</h1>
                    <div className="mt-2 flex items-center space-x-4 text-blue-100">
                      {contactData.company && (
                        <span className="flex items-center">
                          <span className="mr-1">🏢</span> {contactData.company}
                        </span>
                      )}
                      {contactData.title && (
                        <span className="flex items-center">
                          <span className="mr-1">💼</span> {contactData.title}
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        contactData.status === 'active' ? 'bg-green-500' :
                        contactData.status === 'lead' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`}>
                        {contactData.status?.toUpperCase() || 'CONTACT'}
                      </span>
                    </div>
                    
                    {contactData.lead_score && (
                      <div className="mt-3 flex items-center space-x-2">
                        <span className="text-sm">Lead Score:</span>
                        <div className="flex items-center space-x-1">
                          {[...Array(10)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-2 w-4 rounded ${
                                i < contactData.lead_score 
                                  ? getLeadScoreColor(contactData.lead_score)
                                  : 'bg-white bg-opacity-30'
                              }`}
                            />
                          ))}
                          <span className="ml-2 font-bold">{contactData.lead_score}/10</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right text-sm">
                    <div className="text-blue-100">VoiCRM Contact Profile</div>
                    <div className="text-xs opacity-75">ID: {contactData.id}</div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-colors"
                  >
                    <span className="text-xl">×</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="bg-gray-50 border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex space-x-3">
                {contactData.phone && (
                  <button
                    onClick={initiateCall}
                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <span className="mr-2">📞</span> Call Now
                  </button>
                )}
                {contactData.phone && (
                  <button
                    onClick={sendText}
                    className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <span className="mr-2">💬</span> Text
                  </button>
                )}
                {contactData.email && (
                  <button
                    onClick={() => window.open(`mailto:${contactData.email}`)}
                    className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    <span className="mr-2">✉️</span> Email
                  </button>
                )}
                <button
                  onClick={() => onEdit(contactData)}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <span className="mr-2">✏️</span> Edit
                </button>
              </div>
              
              <div className="text-sm text-gray-500">
                Last updated: {new Date(contactData.updated_at).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 max-h-[50vh] overflow-y-auto">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  {/* Contact Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                      <span className="mr-2">📋</span> Contact Information
                    </h3>
                    <div className="space-y-3">
                      {contactData.phone && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Phone:</span>
                          <a 
                            href={`tel:${contactData.phone}`}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {formatPhoneNumber(contactData.phone)}
                          </a>
                        </div>
                      )}
                      {contactData.email && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Email:</span>
                          <a 
                            href={`mailto:${contactData.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {contactData.email}
                          </a>
                        </div>
                      )}
                      {contactData.address && (
                        <div className="flex justify-between items-start">
                          <span className="text-gray-600">Address:</span>
                          <span className="text-right max-w-xs">{contactData.address}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Added:</span>
                        <span>{new Date(contactData.created_at).toLocaleDateString()}</span>
                      </div>
                      {contactData.source && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Source:</span>
                          <span className="font-medium">{contactData.source}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  {contactData.tags && contactData.tags.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                        <span className="mr-2">🏷️</span> Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {contactData.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Notes */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                      <span className="mr-2">📝</span> Notes
                    </h3>
                    <div className="text-gray-700 whitespace-pre-wrap">
                      {contactData.notes || 'No notes available for this contact.'}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-5">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                      <span className="mr-2">📊</span> Quick Stats
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">{callHistory.length}</div>
                        <div className="text-gray-600">Total Calls</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-600">{dealHistory.length}</div>
                        <div className="text-gray-600">Active Deals</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-purple-600">{propertyInterests.length}</div>
                        <div className="text-gray-600">Properties</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {contactData.last_contacted 
                            ? Math.floor((new Date() - new Date(contactData.last_contacted)) / (1000 * 60 * 60 * 24))
                            : '∞'
                          }
                        </div>
                        <div className="text-gray-600">Days Since Contact</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center">
                  <span className="mr-2">📞</span> Call History
                </h3>
                {callHistory.length > 0 ? (
                  <div className="space-y-3">
                    {callHistory.map(call => (
                      <div key={call.id} className="bg-white border rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <div className="font-medium">{call.call_type} call</div>
                          <div className="text-sm text-gray-500">
                            {new Date(call.created_at).toLocaleString()}
                          </div>
                          {call.duration && (
                            <div className="text-sm text-blue-600">Duration: {call.duration}s</div>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          call.status === 'completed' ? 'bg-green-100 text-green-800' :
                          call.status === 'missed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {call.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No call history available
                  </div>
                )}
              </div>
            )}

            {activeTab === 'properties' && (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center">
                  <span className="mr-2">🏠</span> Property Interests
                </h3>
                {propertyInterests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {propertyInterests.map(interest => (
                      <div key={interest.id} className="bg-white border rounded-lg p-4">
                        <div className="font-medium">{interest.properties?.address}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {interest.properties?.bedrooms}br/{interest.properties?.bathrooms}ba • {interest.properties?.sqft} sqft
                        </div>
                        <div className="text-lg font-bold text-green-600 mt-2">
                          ${interest.properties?.price?.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Interest level: {interest.interest_level}/10
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No property interests recorded
                  </div>
                )}
              </div>
            )}

            {activeTab === 'deals' && (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center">
                  <span className="mr-2">💰</span> Deal History
                </h3>
                {dealHistory.length > 0 ? (
                  <div className="space-y-3">
                    {dealHistory.map(deal => (
                      <div key={deal.id} className="bg-white border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{deal.title}</div>
                            <div className="text-sm text-gray-500">{deal.property_address}</div>
                            <div className="text-sm text-gray-500">
                              Created: {new Date(deal.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              ${deal.value?.toLocaleString()}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              deal.stage === 'won' ? 'bg-green-100 text-green-800' :
                              deal.stage === 'lost' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {deal.stage}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No deals found for this contact
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer with VoiCRM Branding */}
          <div className="border-t bg-gray-50 px-6 py-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Powered by <span className="font-bold text-blue-600">VoiCRM</span> • 
              Advanced Real Estate CRM
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}