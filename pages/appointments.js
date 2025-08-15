import { useState } from 'react';
import Layout from '../components/Layout';
import { CalendarIcon, ClockIcon, MapPinIcon, UserIcon, PhoneIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function Appointments() {
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      title: 'Property Viewing - 123 Main St',
      type: 'viewing',
      date: '2024-08-14',
      time: '10:00 AM',
      duration: 30,
      location: '123 Main St, Parramatta',
      client: 'John Smith',
      phone: '+61 456 789 012',
      status: 'confirmed',
      notes: 'First home buyer, interested in 3BR properties',
      reminder: true
    },
    {
      id: 2,
      title: 'Listing Presentation',
      type: 'listing',
      date: '2024-08-14',
      time: '2:00 PM',
      duration: 60,
      location: '456 Oak Ave, Liverpool',
      client: 'Sarah Wilson',
      phone: '+61 456 789 013',
      status: 'confirmed',
      notes: 'Selling investment property',
      reminder: true
    },
    {
      id: 3,
      title: 'Contract Signing',
      type: 'contract',
      date: '2024-08-15',
      time: '11:00 AM',
      duration: 45,
      location: 'Office',
      client: 'Michael Chen',
      phone: '+61 456 789 014',
      status: 'pending',
      notes: 'Bring contract documents',
      reminder: false
    },
    {
      id: 4,
      title: 'Open House',
      type: 'openhouse',
      date: '2024-08-17',
      time: '1:00 PM',
      duration: 120,
      location: '789 Elm Dr, Bankstown',
      client: 'Multiple',
      phone: 'N/A',
      status: 'scheduled',
      notes: 'Expected 20+ groups',
      reminder: true
    }
  ]);

  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('list'); // list, calendar, map

  const appointmentTypes = [
    { value: 'viewing', label: 'Property Viewing', icon: '🏠', color: 'bg-blue-100 text-blue-800' },
    { value: 'listing', label: 'Listing Presentation', icon: '📋', color: 'bg-green-100 text-green-800' },
    { value: 'contract', label: 'Contract Signing', icon: '📝', color: 'bg-purple-100 text-purple-800' },
    { value: 'openhouse', label: 'Open House', icon: '🚪', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'inspection', label: 'Property Inspection', icon: '🔍', color: 'bg-orange-100 text-orange-800' },
    { value: 'meeting', label: 'Client Meeting', icon: '🤝', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'valuation', label: 'Property Valuation', icon: '💰', color: 'bg-pink-100 text-pink-800' },
    { value: 'followup', label: 'Follow-up', icon: '📞', color: 'bg-gray-100 text-gray-800' }
  ];

  const timeSlots = [
    '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
    '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
    '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM'
  ];

  const getAppointmentType = (type) => {
    return appointmentTypes.find(t => t.value === type) || appointmentTypes[0];
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const upcomingAppointments = appointments
    .filter(apt => new Date(apt.date) >= new Date())
    .sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));

  const todayAppointments = appointments.filter(apt => apt.date === new Date().toISOString().split('T')[0]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
                Appointments
              </h1>
              <p className="text-[#7a7a7a] mt-2">Manage your appointments and bookings</p>
            </div>
            <div className="flex gap-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : ''
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    viewMode === 'calendar' ? 'bg-white shadow-sm' : ''
                  }`}
                >
                  Calendar
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    viewMode === 'map' ? 'bg-white shadow-sm' : ''
                  }`}
                >
                  Map
                </button>
              </div>
              <button 
                onClick={() => setShowNewAppointment(true)}
                className="bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#7a8365] transition-colors"
              >
                + New Appointment
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Today</p>
            <p className="text-2xl font-bold text-[#636B56]">{todayAppointments.length}</p>
            <p className="text-xs text-gray-500 mt-1">appointments</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">This Week</p>
            <p className="text-2xl font-bold text-[#864936]">12</p>
            <p className="text-xs text-gray-500 mt-1">scheduled</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Confirmed</p>
            <p className="text-2xl font-bold text-green-600">
              {appointments.filter(a => a.status === 'confirmed').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">bookings</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {appointments.filter(a => a.status === 'pending').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">to confirm</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Completion Rate</p>
            <p className="text-2xl font-bold text-blue-600">94%</p>
            <p className="text-xs text-gray-500 mt-1">this month</p>
          </div>
        </div>

        {viewMode === 'list' && (
          <>
            {/* Today's Schedule */}
            {todayAppointments.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-[#636B56] mb-4">Today's Schedule</h2>
                <div className="space-y-3">
                  {todayAppointments.map(appointment => {
                    const type = getAppointmentType(appointment.type);
                    return (
                      <div key={appointment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-4">
                            <div className="text-3xl">{type.icon}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-semibold">{appointment.title}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(appointment.status)}`}>
                                  {appointment.status}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <ClockIcon className="h-4 w-4" />
                                  {appointment.time} ({appointment.duration} min)
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPinIcon className="h-4 w-4" />
                                  {appointment.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <UserIcon className="h-4 w-4" />
                                  {appointment.client}
                                </span>
                                {appointment.phone !== 'N/A' && (
                                  <span className="flex items-center gap-1">
                                    <PhoneIcon className="h-4 w-4" />
                                    {appointment.phone}
                                  </span>
                                )}
                              </div>
                              {appointment.notes && (
                                <p className="text-sm text-gray-500 mt-2 italic">📝 {appointment.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button className="text-sm text-[#636B56] hover:underline">Edit</button>
                            <button className="text-sm text-[#636B56] hover:underline">Reschedule</button>
                            {appointment.reminder && (
                              <span className="text-xs text-green-600">🔔 Reminder set</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming Appointments */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-[#636B56] mb-4">Upcoming Appointments</h2>
              <div className="space-y-3">
                {upcomingAppointments.map(appointment => {
                  const type = getAppointmentType(appointment.type);
                  return (
                    <div key={appointment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                          <div className="text-3xl">{type.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold">{appointment.title}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(appointment.status)}`}>
                                {appointment.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="h-4 w-4" />
                                {new Date(appointment.date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <ClockIcon className="h-4 w-4" />
                                {appointment.time} ({appointment.duration} min)
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPinIcon className="h-4 w-4" />
                                {appointment.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <UserIcon className="h-4 w-4" />
                                {appointment.client}
                              </span>
                            </div>
                            {appointment.notes && (
                              <p className="text-sm text-gray-500 mt-2 italic">📝 {appointment.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button className="text-sm text-[#636B56] hover:underline">View Details</button>
                          <button className="text-sm text-[#636B56] hover:underline">Send Reminder</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {viewMode === 'calendar' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-[#636B56] mb-4">Calendar View</h2>
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-medium text-gray-600 py-2">
                  {day}
                </div>
              ))}
              {Array.from({ length: 35 }, (_, i) => {
                const dayNum = i - 3; // Start from previous month
                const isCurrentMonth = dayNum >= 0 && dayNum < 31;
                const hasAppointment = isCurrentMonth && Math.random() > 0.7;
                
                return (
                  <div
                    key={i}
                    className={`border rounded-lg p-2 min-h-[80px] ${
                      isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                    } ${hasAppointment ? 'border-[#636B56]' : ''}`}
                  >
                    <div className={`text-sm ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                      {isCurrentMonth ? dayNum + 1 : ''}
                    </div>
                    {hasAppointment && isCurrentMonth && (
                      <div className="mt-1">
                        <div className="text-xs bg-[#636B56] text-white rounded px-1 py-0.5">
                          2 appts
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'map' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-[#636B56] mb-4">Map View</h2>
            <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <MapPinIcon className="h-16 w-16 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Interactive map showing appointment locations</p>
                <p className="text-sm text-gray-500 mt-2">Integration with mapping service required</p>
              </div>
            </div>
          </div>
        )}

        {/* New Appointment Modal */}
        {showNewAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-[#636B56] mb-4">Schedule New Appointment</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Type</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent">
                    {appointmentTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                    placeholder="e.g., Property Viewing - 123 Main St"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent">
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent">
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="90">1.5 hours</option>
                      <option value="120">2 hours</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                      placeholder="Property address or meeting location"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                      placeholder="Client name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                      placeholder="+61 4XX XXX XXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                    placeholder="Add any notes or special instructions..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded text-[#636B56]" defaultChecked />
                    <span className="text-sm">Send confirmation to client</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded text-[#636B56]" defaultChecked />
                    <span className="text-sm">Set reminder (1 hour before)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded text-[#636B56]" />
                    <span className="text-sm">Add to team calendar</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowNewAppointment(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowNewAppointment(false)}
                  className="px-4 py-2 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365] transition-colors"
                >
                  Schedule Appointment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border rounded-lg hover:border-[#636B56] transition-colors text-center">
              <div className="text-2xl mb-2">📅</div>
              <p className="text-sm font-medium">Sync Calendar</p>
            </button>
            <button className="p-4 border rounded-lg hover:border-[#636B56] transition-colors text-center">
              <div className="text-2xl mb-2">📧</div>
              <p className="text-sm font-medium">Send Reminders</p>
            </button>
            <button className="p-4 border rounded-lg hover:border-[#636B56] transition-colors text-center">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-sm font-medium">View Reports</p>
            </button>
            <button className="p-4 border rounded-lg hover:border-[#636B56] transition-colors text-center">
              <div className="text-2xl mb-2">⚙️</div>
              <p className="text-sm font-medium">Settings</p>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}