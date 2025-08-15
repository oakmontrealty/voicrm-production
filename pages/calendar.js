import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';

export default function Calendar() {
  const [callbacks, setCallbacks] = useState([]);
  const [todaysCallbacks, setTodaysCallbacks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, day
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCallbacks();
  }, [selectedDate, view]);

  const fetchCallbacks = async () => {
    try {
      // Use the sync endpoint to get ALL callbacks from database
      const response = await fetch('/api/activities/sync-callbacks');
      const data = await response.json();
      
      if (data.success) {
        setCallbacks(data.events || []);
        
        // Get today's callbacks
        const today = new Date();
        const todayCallbacks = (data.events || []).filter(cb => {
          const callbackDate = new Date(cb.date || cb.scheduled_date);
          return callbackDate.toDateString() === today.toDateString();
        });
        setTodaysCallbacks(todayCallbacks);
      } else {
        // Fallback to direct contact fetch if sync fails
        const contactsRes = await fetch('/api/contacts');
        const contactsData = await contactsRes.json();
        
        // Filter contacts that have next_follow_up dates - NO DEMO DATA
        const contactsWithCallbacks = (contactsData || []).filter(c => c.next_follow_up);
        
        const formattedCallbacks = contactsWithCallbacks.map(contact => ({
          id: contact.id,
          name: contact.name,
          phone_number: contact.phone_number,
          company: contact.company,
          scheduled_date: contact.next_follow_up,
          date: contact.next_follow_up,
          last_contact: contact.last_contact_date,
          notes: contact.notes,
          status: contact.status,
          lead_score: contact.lead_score,
          is_overdue: new Date(contact.next_follow_up) < new Date()
        }));
        
        setCallbacks(formattedCallbacks);
        
        // Filter today's callbacks
        const today = new Date();
        const todayCallbacks = formattedCallbacks.filter(cb => {
          const callbackDate = new Date(cb.scheduled_date);
          return callbackDate.toDateString() === today.toDateString();
        });
        setTodaysCallbacks(todayCallbacks);
      }
      
    } catch (error) {
      console.error('Error fetching callbacks:', error);
      setCallbacks([]); // Empty array, no demo data
    } finally {
      setLoading(false);
    }
  };

  const loadIntoSpeedDialer = () => {
    // Store today's callbacks in sessionStorage for speed dialer
    sessionStorage.setItem('speedDialerContacts', JSON.stringify(todaysCallbacks));
    window.location.href = '/powerdialer';
  };

  const makeCall = (phoneNumber) => {
    window.location.href = `/twilio-browser-phone?number=${phoneNumber}`;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getCallbacksForDate = (date) => {
    if (!date) return [];
    return callbacks.filter(cb => {
      const cbDate = new Date(cb.scheduled_date);
      return cbDate.toDateString() === date.toDateString();
    });
  };

  const isOverdue = (date) => {
    return new Date(date) < new Date() && new Date(date).toDateString() !== new Date().toDateString();
  };

  const filteredCallbacks = callbacks.filter(cb => 
    cb.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cb.phone_number?.includes(searchTerm) ||
    cb.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6" style={{ fontFamily: "'Forum', serif" }}>
        {/* Header with Search */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#864936' }}>
                Callback Calendar
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your scheduled callbacks and follow-ups
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setView('month')}
                className={`px-4 py-2 rounded-lg ${
                  view === 'month' 
                    ? 'bg-[#636B56] text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-4 py-2 rounded-lg ${
                  view === 'week' 
                    ? 'bg-[#636B56] text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setView('day')}
                className={`px-4 py-2 rounded-lg ${
                  view === 'day' 
                    ? 'bg-[#636B56] text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Day
              </button>
            </div>
          </div>
          
          {/* Universal Search Bar */}
          <div className="w-full">
            <input
              type="text"
              placeholder="Search callbacks, contacts, phone numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:outline-none bg-white"
              style={{ 
                borderColor: '#B28354',
                color: '#636B56',  // Green font color for search input
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {/* Calendar View - 3 columns */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow-lg p-4" style={{ backgroundColor: '#F8F2E7' }}>
              {/* Calendar Navigation */}
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setSelectedDate(newDate);
                  }}
                  className="p-2 hover:bg-gray-200 rounded"
                >
                  ←
                </button>
                <h2 className="text-xl font-bold" style={{ color: '#864936' }}>
                  {selectedDate.toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </h2>
                <button
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setSelectedDate(newDate);
                  }}
                  className="p-2 hover:bg-gray-200 rounded"
                >
                  →
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-96">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2" 
                       style={{ borderColor: '#636B56' }}></div>
                </div>
              ) : view === 'month' ? (
                /* Month View */
                <div className="grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-3 text-center font-bold text-lg" style={{ color: '#864936' }}>
                      {day}
                    </div>
                  ))}
                  {getDaysInMonth(selectedDate).map((date, index) => {
                    const dayCallbacks = date ? getCallbacksForDate(date) : [];
                    const isToday = date && date.toDateString() === new Date().toDateString();
                    
                    return (
                      <div
                        key={index}
                        className={`
                          min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors
                          ${!date ? 'bg-gray-100 opacity-50' : 'bg-white hover:bg-blue-50 shadow-sm hover:shadow-md'}
                          ${isToday ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                        `}
                        style={{ 
                          borderColor: isToday ? '#3B82F6' : '#B28354',
                          minHeight: '120px'
                        }}
                        onClick={() => date && setSelectedDate(date)}
                      >
                        {date && (
                          <>
                            <div className="font-bold text-lg mb-2" style={{ color: '#1F2937' }}>
                              {date.getDate()}
                            </div>
                            {dayCallbacks.slice(0, 3).map((cb, idx) => (
                              <div
                                key={idx}
                                className={`text-xs p-2 mb-1 rounded-lg truncate cursor-pointer font-medium transition-all hover:scale-105 ${
                                  isOverdue(cb.scheduled_date)
                                    ? 'bg-red-500 text-white shadow-md'
                                    : 'bg-blue-600 text-white shadow-md'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  makeCall(cb.phone_number);
                                }}
                                title={`Call ${cb.name} - ${cb.phone_number}`}
                              >
                                📞 {cb.name}
                              </div>
                            ))}
                            {dayCallbacks.length > 3 && (
                              <div className="text-xs font-semibold" style={{ color: '#6B7280' }}>
                                +{dayCallbacks.length - 3} more calls
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : view === 'week' ? (
                /* Week View */
                <div className="space-y-2">
                  {[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
                    const date = new Date(selectedDate);
                    const startOfWeek = date.getDate() - date.getDay();
                    date.setDate(startOfWeek + dayOffset);
                    
                    const dayCallbacks = getCallbacksForDate(date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    
                    return (
                      <div
                        key={dayOffset}
                        className={`p-4 border rounded-lg ${
                          isToday ? 'bg-blue-50 border-blue-500' : 'bg-white'
                        }`}
                        style={{ borderColor: isToday ? '' : '#B28354' }}
                      >
                        <h3 className="font-semibold mb-2">
                          {date.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {dayCallbacks.map((cb, idx) => (
                            <div
                              key={idx}
                              className={`p-2 rounded-lg text-sm ${
                                isOverdue(cb.scheduled_date)
                                  ? 'bg-red-100'
                                  : 'bg-gray-100'
                              }`}
                            >
                              <div className="font-medium">{cb.name}</div>
                              <div className="text-xs text-gray-600">{cb.phone_number}</div>
                              <button
                                onClick={() => makeCall(cb.phone_number)}
                                className="mt-1 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                              >
                                Call
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Day View */
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold mb-4">
                    {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </h3>
                  {getCallbacksForDate(selectedDate).map((cb, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        isOverdue(cb.scheduled_date)
                          ? 'bg-red-50 border-red-300'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-lg">{cb.name}</h4>
                          <p className="text-gray-600">{cb.company}</p>
                          <p className="text-sm text-gray-500 mt-1">{cb.phone_number}</p>
                          {cb.notes && (
                            <p className="text-sm text-gray-700 mt-2">{cb.notes}</p>
                          )}
                          {cb.last_contact && (
                            <p className="text-xs text-gray-500 mt-2">
                              Last contact: {cb.days_since_contact} days ago
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => makeCall(cb.phone_number)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                          >
                            📞 Call Now
                          </button>
                          <button
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                          >
                            📝 Add Note
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getCallbacksForDate(selectedDate).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No callbacks scheduled for this day
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Today's Callbacks Sidebar - 1 column */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-4" style={{ backgroundColor: '#F8F2E7' }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: '#864936' }}>
                Today's Callbacks ({todaysCallbacks.length})
              </h3>
              
              {todaysCallbacks.length > 0 && (
                <button
                  onClick={loadIntoSpeedDialer}
                  className="w-full mb-4 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#636B56' }}
                >
                  📞 Load into Speed Dialer
                </button>
              )}

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {todaysCallbacks.map((cb, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                      cb.is_overdue ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'
                    }`}
                    onClick={() => makeCall(cb.phone_number)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{cb.name}</h4>
                        <p className="text-xs text-gray-600">{cb.phone_number}</p>
                        {cb.company && (
                          <p className="text-xs text-gray-500">{cb.company}</p>
                        )}
                        {cb.is_overdue && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                            Overdue
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          makeCall(cb.phone_number);
                        }}
                        className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        📞
                      </button>
                    </div>
                  </div>
                ))}
                
                {todaysCallbacks.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No callbacks scheduled for today
                  </div>
                )}
              </div>

              {/* Overdue Callbacks Section */}
              <div className="mt-6 pt-4 border-t" style={{ borderColor: '#B28354' }}>
                <h4 className="text-sm font-semibold mb-2 text-red-600">
                  ⚠ Overdue Callbacks
                </h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {callbacks
                    .filter(cb => isOverdue(cb.scheduled_date))
                    .slice(0, 5)
                    .map((cb, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-red-50 rounded border border-red-200 cursor-pointer hover:bg-red-100"
                        onClick={() => makeCall(cb.phone_number)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs font-medium">{cb.name}</p>
                            <p className="text-xs text-gray-600">
                              {new Date(cb.scheduled_date).toLocaleDateString()}
                            </p>
                          </div>
                          <button className="text-xs px-2 py-1 bg-red-500 text-white rounded">
                            Call
                          </button>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}