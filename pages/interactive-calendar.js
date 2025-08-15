import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { 
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhoneIcon,
  VideoCameraIcon,
  HomeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';

export default function InteractiveCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // day, week, month
  const [appointments, setAppointments] = useState([]);
  const [availability, setAvailability] = useState({});
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [isPhoneBooking, setIsPhoneBooking] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  
  // Business hours configuration
  const businessHours = {
    monday: { start: '09:00', end: '18:00', enabled: true },
    tuesday: { start: '09:00', end: '18:00', enabled: true },
    wednesday: { start: '09:00', end: '18:00', enabled: true },
    thursday: { start: '09:00', end: '18:00', enabled: true },
    friday: { start: '09:00', end: '18:00', enabled: true },
    saturday: { start: '10:00', end: '16:00', enabled: true },
    sunday: { start: '11:00', end: '15:00', enabled: false }
  };

  // Time slot duration (in minutes)
  const slotDuration = 30;

  // Load appointments and calculate availability
  useEffect(() => {
    loadAppointments();
    calculateAvailability();
  }, [selectedDate, viewMode]);

  // Load appointments from API
  const loadAppointments = async () => {
    try {
      const response = await fetch(`/api/appointments?date=${selectedDate.toISOString()}`);
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error('Failed to load appointments:', error);
      // Use sample data for demo
      setAppointments(getSampleAppointments());
    }
  };

  // Get sample appointments
  const getSampleAppointments = () => {
    const today = new Date();
    return [
      {
        id: 1,
        title: 'Property Viewing - 123 Oak St',
        date: today.toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '11:00',
        type: 'viewing',
        client: 'John Smith',
        phone: '0412 345 678',
        location: '123 Oak Street, Parramatta',
        status: 'confirmed',
        notes: 'First time buyer, interested in 3BR homes'
      },
      {
        id: 2,
        title: 'Listing Presentation',
        date: today.toISOString().split('T')[0],
        startTime: '14:00',
        endTime: '15:00',
        type: 'listing',
        client: 'Sarah Johnson',
        phone: '0423 456 789',
        location: '456 Pine Avenue, Westmead',
        status: 'confirmed',
        notes: 'Vendor looking to sell investment property'
      },
      {
        id: 3,
        title: 'Contract Signing',
        date: today.toISOString().split('T')[0],
        startTime: '16:00',
        endTime: '16:30',
        type: 'contract',
        client: 'Mike Chen',
        phone: '0434 567 890',
        location: 'Office',
        status: 'confirmed',
        notes: 'Bring contract documents'
      }
    ];
  };

  // Calculate available time slots
  const calculateAvailability = () => {
    const availability = {};
    const startDate = new Date(selectedDate);
    const endDate = new Date(selectedDate);
    
    if (viewMode === 'week') {
      startDate.setDate(startDate.getDate() - startDate.getDay());
      endDate.setDate(startDate.getDate() + 6);
    } else if (viewMode === 'month') {
      startDate.setDate(1);
      endDate.setMonth(endDate.getMonth() + 1, 0);
    }

    // Calculate availability for each day
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const dayConfig = businessHours[dayName];
      
      if (!dayConfig?.enabled) {
        availability[d.toISOString().split('T')[0]] = [];
        continue;
      }

      const slots = [];
      const [startHour, startMin] = dayConfig.start.split(':').map(Number);
      const [endHour, endMin] = dayConfig.end.split(':').map(Number);
      
      const startTime = new Date(d);
      startTime.setHours(startHour, startMin, 0, 0);
      
      const endTime = new Date(d);
      endTime.setHours(endHour, endMin, 0, 0);

      // Generate time slots
      for (let time = new Date(startTime); time < endTime; time.setMinutes(time.getMinutes() + slotDuration)) {
        const slotStart = time.toTimeString().slice(0, 5);
        const slotEnd = new Date(time.getTime() + slotDuration * 60000).toTimeString().slice(0, 5);
        
        // Check if slot is available (not booked)
        const isBooked = appointments.some(apt => 
          apt.date === d.toISOString().split('T')[0] &&
          apt.startTime <= slotStart &&
          apt.endTime > slotStart
        );

        slots.push({
          date: d.toISOString().split('T')[0],
          startTime: slotStart,
          endTime: slotEnd,
          available: !isBooked,
          type: isBooked ? 'booked' : 'available'
        });
      }

      availability[d.toISOString().split('T')[0]] = slots;
    }

    setAvailability(availability);
  };

  // Check for booking conflicts
  const checkConflicts = (date, startTime, endTime) => {
    const conflicts = appointments.filter(apt => {
      if (apt.date !== date) return false;
      
      // Check for time overlap
      const aptStart = timeToMinutes(apt.startTime);
      const aptEnd = timeToMinutes(apt.endTime);
      const newStart = timeToMinutes(startTime);
      const newEnd = timeToMinutes(endTime);
      
      return (newStart < aptEnd && newEnd > aptStart);
    });

    setConflicts(conflicts);
    return conflicts;
  };

  // Convert time string to minutes
  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Real-time availability check for phone bookings
  const checkAvailabilityRealtime = async (date, time) => {
    setIsPhoneBooking(true);
    
    // Check local availability first
    const dateStr = date.toISOString().split('T')[0];
    const daySlots = availability[dateStr] || [];
    const requestedSlot = daySlots.find(s => s.startTime === time);
    
    if (!requestedSlot || !requestedSlot.available) {
      // Suggest alternative times
      const alternatives = daySlots
        .filter(s => s.available)
        .slice(0, 3)
        .map(s => s.startTime);
      
      return {
        available: false,
        message: `${time} is not available on ${dateStr}`,
        alternatives: alternatives,
        suggestedMessage: alternatives.length > 0 
          ? `Available times: ${alternatives.join(', ')}`
          : 'No availability on this date'
      };
    }

    // Double-check with server for real-time accuracy
    try {
      const response = await fetch('/api/appointments/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, time })
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      return { available: true, message: 'Time slot available' };
    }
  };

  // Quick book function for phone bookings
  const quickBook = async (appointmentData) => {
    const conflicts = checkConflicts(
      appointmentData.date,
      appointmentData.startTime,
      appointmentData.endTime
    );

    if (conflicts.length > 0) {
      alert('Conflict detected! Please choose another time.');
      return false;
    }

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...appointmentData,
          bookedVia: 'phone',
          bookedBy: 'agent',
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const newAppointment = await response.json();
        setAppointments([...appointments, newAppointment]);
        calculateAvailability();
        return true;
      }
    } catch (error) {
      console.error('Booking failed:', error);
      return false;
    }
  };

  // Calendar grid component
  const CalendarGrid = () => {
    const getDaysInMonth = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();
      
      const days = [];
      
      // Add empty cells for days before month starts
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
      }
      
      // Add days of month
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
      }
      
      return days;
    };

    if (viewMode === 'month') {
      const days = getDaysInMonth();
      
      return (
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-semibold text-sm text-gray-600 p-2">
              {day}
            </div>
          ))}
          {days.map((day, idx) => {
            if (!day) return <div key={idx} className="p-2"></div>;
            
            const dateStr = day.toISOString().split('T')[0];
            const dayAppointments = appointments.filter(a => a.date === dateStr);
            const daySlots = availability[dateStr] || [];
            const availableSlots = daySlots.filter(s => s.available).length;
            
            return (
              <div
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={`border rounded-lg p-2 min-h-[100px] cursor-pointer hover:bg-gray-50 ${
                  selectedDate.toDateString() === day.toDateString() ? 'bg-blue-50 border-blue-500' : ''
                }`}
              >
                <div className="font-semibold text-sm">{day.getDate()}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {availableSlots > 0 && (
                    <span className="text-green-600">{availableSlots} slots</span>
                  )}
                </div>
                <div className="mt-1 space-y-1">
                  {dayAppointments.slice(0, 2).map(apt => (
                    <div key={apt.id} className="text-xs bg-blue-100 rounded px-1 truncate">
                      {apt.startTime} {apt.title}
                    </div>
                  ))}
                  {dayAppointments.length > 2 && (
                    <div className="text-xs text-gray-500">+{dayAppointments.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Week view
    if (viewMode === 'week') {
      const weekStart = new Date(selectedDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      
      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        weekDays.push(day);
      }

      const hours = [];
      for (let h = 8; h <= 20; h++) {
        hours.push(h);
      }

      return (
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header with days */}
            <div className="grid grid-cols-8 border-b">
              <div className="p-2 text-xs font-semibold text-gray-600">Time</div>
              {weekDays.map(day => (
                <div key={day.toISOString()} className="p-2 text-center border-l">
                  <div className="text-xs text-gray-600">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-lg font-semibold ${
                    day.toDateString() === new Date().toDateString() ? 'text-blue-600' : ''
                  }`}>
                    {day.getDate()}
                  </div>
                </div>
              ))}
            </div>

            {/* Time grid */}
            <div className="relative">
              {hours.map(hour => (
                <div key={hour} className="grid grid-cols-8 border-b" style={{ height: '60px' }}>
                  <div className="p-2 text-xs text-gray-600">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  {weekDays.map(day => {
                    const dateStr = day.toISOString().split('T')[0];
                    const hourAppointments = appointments.filter(apt => {
                      if (apt.date !== dateStr) return false;
                      const startHour = parseInt(apt.startTime.split(':')[0]);
                      return startHour === hour;
                    });

                    return (
                      <div
                        key={day.toISOString()}
                        className="border-l p-1 relative hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedDate(day);
                          setSelectedTimeSlot(`${hour.toString().padStart(2, '0')}:00`);
                          setShowBookingModal(true);
                        }}
                      >
                        {hourAppointments.map(apt => (
                          <div
                            key={apt.id}
                            className={`absolute left-0 right-0 p-1 text-xs rounded ${
                              apt.type === 'viewing' ? 'bg-blue-200' :
                              apt.type === 'listing' ? 'bg-green-200' :
                              'bg-yellow-200'
                            }`}
                            style={{
                              top: `${(parseInt(apt.startTime.split(':')[1]) / 60) * 60}px`,
                              height: `${((timeToMinutes(apt.endTime) - timeToMinutes(apt.startTime)) / 60) * 60}px`
                            }}
                          >
                            <div className="font-semibold truncate">{apt.client}</div>
                            <div className="truncate">{apt.title}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Day view
    const hours = [];
    for (let h = 8; h <= 20; h++) {
      hours.push(h);
    }

    const dateStr = selectedDate.toISOString().split('T')[0];
    const daySlots = availability[dateStr] || [];

    return (
      <div className="space-y-2">
        {hours.map(hour => {
          const hourSlots = daySlots.filter(s => parseInt(s.startTime.split(':')[0]) === hour);
          const hourAppointments = appointments.filter(apt => {
            if (apt.date !== dateStr) return false;
            const startHour = parseInt(apt.startTime.split(':')[0]);
            return startHour === hour;
          });

          return (
            <div key={hour} className="border rounded-lg p-3">
              <div className="font-semibold text-sm text-gray-700 mb-2">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div className="grid grid-cols-2 gap-2">
                {hourSlots.map(slot => (
                  <div
                    key={slot.startTime}
                    onClick={() => {
                      if (slot.available) {
                        setSelectedTimeSlot(slot.startTime);
                        setShowBookingModal(true);
                      }
                    }}
                    className={`p-2 rounded-lg text-sm cursor-pointer transition-colors ${
                      slot.available 
                        ? 'bg-green-50 hover:bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{slot.startTime} - {slot.endTime}</span>
                      {slot.available ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    {!slot.available && (
                      <div className="text-xs mt-1">
                        {hourAppointments.find(a => a.startTime <= slot.startTime && a.endTime > slot.startTime)?.client}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Phone booking assistant component
  const PhoneBookingAssistant = () => {
    const [searchDate, setSearchDate] = useState('');
    const [searchTime, setSearchTime] = useState('');
    const [availabilityResult, setAvailabilityResult] = useState(null);

    const handleCheckAvailability = async () => {
      const result = await checkAvailabilityRealtime(
        new Date(searchDate),
        searchTime
      );
      setAvailabilityResult(result);
    };

    return (
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <PhoneIcon className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-blue-800">Phone Booking Assistant</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
          <input
            type="time"
            value={searchTime}
            onChange={(e) => setSearchTime(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
          <button
            onClick={handleCheckAvailability}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Check Availability
          </button>
        </div>

        {availabilityResult && (
          <div className={`mt-3 p-3 rounded-lg ${
            availabilityResult.available ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <p className={`text-sm font-semibold ${
              availabilityResult.available ? 'text-green-800' : 'text-red-800'
            }`}>
              {availabilityResult.message}
            </p>
            {availabilityResult.alternatives && availabilityResult.alternatives.length > 0 && (
              <p className="text-sm mt-1">
                {availabilityResult.suggestedMessage}
              </p>
            )}
            {availabilityResult.available && (
              <button
                onClick={() => {
                  setSelectedDate(new Date(searchDate));
                  setSelectedTimeSlot(searchTime);
                  setShowBookingModal(true);
                }}
                className="mt-2 px-4 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Book Now
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#636B56]">Interactive Calendar</h1>
              <p className="text-gray-600 mt-1">Real-time availability and booking management</p>
            </div>
            <div className="flex gap-2">
              {['day', 'week', 'month'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-lg capitalize ${
                    viewMode === mode 
                      ? 'bg-[#636B56] text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Phone Booking Assistant */}
        {isPhoneBooking && <PhoneBookingAssistant />}

        {/* Conflict Warnings */}
        {conflicts.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              <p className="font-semibold text-red-800">Booking Conflicts Detected</p>
            </div>
            {conflicts.map(conflict => (
              <p key={conflict.id} className="text-sm text-red-700 mt-1">
                {conflict.startTime} - {conflict.endTime}: {conflict.client} ({conflict.title})
              </p>
            ))}
          </div>
        )}

        {/* Main Calendar */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <CalendarGrid />
        </div>

        {/* Booking Modal */}
        {showBookingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-[#636B56] mb-4">Book Appointment</h2>
              <p className="text-gray-600 mb-4">
                {selectedDate.toLocaleDateString()} at {selectedTimeSlot}
              </p>
              <form onSubmit={(e) => {
                e.preventDefault();
                // Handle booking
                setShowBookingModal(false);
              }}>
                <input
                  type="text"
                  placeholder="Client Name"
                  className="w-full px-3 py-2 border rounded-lg mb-3"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full px-3 py-2 border rounded-lg mb-3"
                  required
                />
                <select className="w-full px-3 py-2 border rounded-lg mb-3" required>
                  <option value="">Appointment Type</option>
                  <option value="viewing">Property Viewing</option>
                  <option value="listing">Listing Presentation</option>
                  <option value="contract">Contract Signing</option>
                  <option value="consultation">Consultation</option>
                </select>
                <textarea
                  placeholder="Notes"
                  className="w-full px-3 py-2 border rounded-lg mb-4"
                  rows="3"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365]"
                  >
                    Book Appointment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}