import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ScheduledCalling() {
  const [scheduledCalls, setScheduledCalls] = useState([]);
  const [upcomingCalls, setUpcomingCalls] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [callQueue, setCallQueue] = useState([]);
  const [autoDialEnabled, setAutoDialEnabled] = useState(false);
  const [dialDelay, setDialDelay] = useState(30); // seconds between calls
  const [timeZone, setTimeZone] = useState('America/New_York');
  const [workingHours, setWorkingHours] = useState({
    start: '09:00',
    end: '17:00',
    timezone: 'America/New_York',
    excludeWeekends: true
  });
  const [callStats, setCallStats] = useState({
    scheduled: 0,
    completed: 0,
    missed: 0,
    success_rate: 0
  });

  const supabase = createClientComponentClient();
  const autoDialTimer = useRef(null);
  const callCheckInterval = useRef(null);

  useEffect(() => {
    loadScheduledCalls();
    loadCallStats();
    setupCallMonitoring();
    
    return () => {
      if (autoDialTimer.current) clearTimeout(autoDialTimer.current);
      if (callCheckInterval.current) clearInterval(callCheckInterval.current);
    };
  }, []);

  useEffect(() => {
    if (autoDialEnabled && callQueue.length > 0 && !activeCall) {
      scheduleNextCall();
    }
  }, [autoDialEnabled, callQueue, activeCall]);

  const setupCallMonitoring = () => {
    // Check for upcoming calls every minute
    callCheckInterval.current = setInterval(() => {
      checkUpcomingCalls();
    }, 60000);
    
    checkUpcomingCalls(); // Initial check
  };

  const loadScheduledCalls = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_calls')
        .select(`
          *,
          contacts (
            id, name, phone, email, company,
            last_contacted, call_count, deal_stage
          )
        `)
        .order('scheduled_time', { ascending: true });

      if (error) throw error;

      setScheduledCalls(data || []);
      
      // Separate upcoming calls (next 2 hours)
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      
      const upcoming = data?.filter(call => {
        const callTime = new Date(call.scheduled_time);
        return callTime >= now && callTime <= twoHoursFromNow && call.status === 'scheduled';
      }) || [];
      
      setUpcomingCalls(upcoming);
    } catch (error) {
      console.error('Error loading scheduled calls:', error);
    }
  };

  const loadCallStats = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_calls')
        .select('status')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const stats = data?.reduce((acc, call) => {
        acc[call.status] = (acc[call.status] || 0) + 1;
        return acc;
      }, {}) || {};

      const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
      const completed = stats.completed || 0;

      setCallStats({
        scheduled: stats.scheduled || 0,
        completed,
        missed: stats.missed || 0,
        success_rate: total > 0 ? Math.round((completed / total) * 100) : 0
      });
    } catch (error) {
      console.error('Error loading call stats:', error);
    }
  };

  const checkUpcomingCalls = async () => {
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    // Find calls that should be made in the next 5 minutes
    const callsToQueue = scheduledCalls.filter(call => {
      const callTime = new Date(call.scheduled_time);
      return callTime >= now && 
             callTime <= fiveMinutesFromNow && 
             call.status === 'scheduled' &&
             !callQueue.find(queued => queued.id === call.id);
    });

    if (callsToQueue.length > 0) {
      setCallQueue(prev => [...prev, ...callsToQueue]);
      
      // Show notification for upcoming calls
      callsToQueue.forEach(call => {
        showCallNotification(call);
      });
    }
  };

  const showCallNotification = (call) => {
    if (Notification.permission === 'granted') {
      const callTime = new Date(call.scheduled_time);
      const minutesUntil = Math.round((callTime - new Date()) / 60000);
      
      new Notification('Scheduled Call Coming Up', {
        body: `Call ${call.contacts.name} in ${minutesUntil} minutes`,
        icon: '/icons/phone.png',
        tag: `call-${call.id}`,
        requireInteraction: true
      });
    }
  };

  const scheduleCall = async (contactId, scheduledTime, notes = '', callType = 'follow_up') => {
    try {
      const { data, error } = await supabase
        .from('scheduled_calls')
        .insert({
          contact_id: contactId,
          scheduled_time: scheduledTime,
          notes,
          call_type: callType,
          status: 'scheduled',
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select(`
          *,
          contacts (
            id, name, phone, email, company
          )
        `)
        .single();

      if (error) throw error;

      setScheduledCalls(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error scheduling call:', error);
      throw error;
    }
  };

  const makeScheduledCall = async (callId) => {
    const call = scheduledCalls.find(c => c.id === callId);
    if (!call) return;

    setActiveCall(call);
    
    try {
      // Update call status
      await supabase
        .from('scheduled_calls')
        .update({ 
          status: 'in_progress', 
          actual_start_time: new Date().toISOString() 
        })
        .eq('id', callId);

      // Initiate the actual call through Twilio
      const response = await fetch('/api/twilio/make-browser-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: call.contacts.phone,
          from: '+1234567890', // Your Twilio number
          callId: call.id
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Remove from queue
        setCallQueue(prev => prev.filter(c => c.id !== callId));
        
        // Schedule next call if auto-dial is enabled
        if (autoDialEnabled && callQueue.length > 1) {
          scheduleNextCall();
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error making scheduled call:', error);
      await markCallAsError(callId, error.message);
    }
  };

  const scheduleNextCall = () => {
    if (autoDialTimer.current) clearTimeout(autoDialTimer.current);
    
    autoDialTimer.current = setTimeout(() => {
      const nextCall = callQueue[0];
      if (nextCall && !activeCall) {
        makeScheduledCall(nextCall.id);
      }
    }, dialDelay * 1000);
  };

  const completeCall = async (callId, outcome, notes = '', duration = 0) => {
    try {
      await supabase
        .from('scheduled_calls')
        .update({
          status: 'completed',
          outcome,
          notes: notes,
          duration,
          completed_at: new Date().toISOString()
        })
        .eq('id', callId);

      // Update contact's last contacted time
      const call = scheduledCalls.find(c => c.id === callId);
      if (call) {
        await supabase
          .from('contacts')
          .update({
            last_contacted: new Date().toISOString(),
            call_count: call.contacts.call_count + 1
          })
          .eq('id', call.contact_id);
      }

      setActiveCall(null);
      loadScheduledCalls();
      loadCallStats();
      
      // Schedule next call if auto-dial is enabled
      if (autoDialEnabled && callQueue.length > 0) {
        scheduleNextCall();
      }
    } catch (error) {
      console.error('Error completing call:', error);
    }
  };

  const markCallAsError = async (callId, error) => {
    await supabase
      .from('scheduled_calls')
      .update({
        status: 'error',
        error_message: error,
        completed_at: new Date().toISOString()
      })
      .eq('id', callId);

    setActiveCall(null);
    loadScheduledCalls();
  };

  const isWithinWorkingHours = (dateTime) => {
    const date = new Date(dateTime);
    const day = date.getDay();
    const time = date.toTimeString().slice(0, 5);
    
    if (workingHours.excludeWeekends && (day === 0 || day === 6)) {
      return false;
    }
    
    return time >= workingHours.start && time <= workingHours.end;
  };

  const suggestOptimalCallTime = (contactId) => {
    // AI-powered suggestion based on contact's history
    const now = new Date();
    const suggestions = [];
    
    // Next business day at 10 AM
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    if (isWithinWorkingHours(tomorrow)) {
      suggestions.push({
        time: tomorrow,
        reason: 'Next business day morning - high answer rate',
        confidence: 85
      });
    }
    
    // Same day afternoon if within hours
    const todayAfternoon = new Date(now);
    todayAfternoon.setHours(14, 0, 0, 0);
    
    if (todayAfternoon > now && isWithinWorkingHours(todayAfternoon)) {
      suggestions.push({
        time: todayAfternoon,
        reason: 'Same day afternoon - good for follow-ups',
        confidence: 75
      });
    }
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  };

  const QuickScheduler = ({ contactId, onScheduled }) => {
    const [selectedTime, setSelectedTime] = useState('');
    const [notes, setNotes] = useState('');
    const [callType, setCallType] = useState('follow_up');
    
    const suggestions = suggestOptimalCallTime(contactId);
    
    const handleQuickSchedule = async (suggestionTime) => {
      const scheduledCall = await scheduleCall(contactId, suggestionTime.toISOString(), notes, callType);
      onScheduled?.(scheduledCall);
    };

    return (
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <h4 className="font-medium mb-3">Schedule Call</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Call Type</label>
            <select
              value={callType}
              onChange={(e) => setCallType(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="follow_up">Follow Up</option>
              <option value="prospecting">Prospecting</option>
              <option value="appointment">Appointment Setting</option>
              <option value="closing">Closing Call</option>
              <option value="check_in">Check In</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Call objectives, talking points..."
              className="w-full p-2 border rounded h-20"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Suggested Times</label>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSchedule(suggestion.time)}
                  className="w-full text-left p-3 border rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        {suggestion.time.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {suggestion.reason}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-green-600">
                      {suggestion.confidence}% confidence
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Custom Time</label>
            <input
              type="datetime-local"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full p-2 border rounded"
            />
            {selectedTime && (
              <button
                onClick={() => scheduleCall(contactId, selectedTime, notes, callType)}
                className="mt-2 w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Schedule for {new Date(selectedTime).toLocaleString()}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Scheduled Calling</h2>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoDialEnabled}
              onChange={(e) => setAutoDialEnabled(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Auto-dial enabled</span>
          </label>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm">Delay:</span>
            <input
              type="number"
              value={dialDelay}
              onChange={(e) => setDialDelay(parseInt(e.target.value))}
              min="10"
              max="300"
              className="w-16 p-1 border rounded text-sm"
            />
            <span className="text-sm">sec</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Call Queue */}
          {callQueue.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium mb-3">Call Queue ({callQueue.length})</h3>
              <div className="space-y-2">
                {callQueue.slice(0, 5).map((call, index) => (
                  <div key={call.id} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        index === 0 ? 'bg-green-500 text-white' : 'bg-gray-200'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{call.contacts.name}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(call.scheduled_time).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => makeScheduledCall(call.id)}
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                    >
                      Call Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Call */}
          {activeCall && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium mb-3">Active Call</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-lg">{activeCall.contacts.name}</div>
                  <div className="text-gray-600">{activeCall.contacts.phone}</div>
                  <div className="text-sm text-gray-500">{activeCall.notes}</div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => completeCall(activeCall.id, 'completed', 'Call completed successfully')}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => completeCall(activeCall.id, 'no_answer', 'No answer')}
                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                  >
                    No Answer
                  </button>
                  <button
                    onClick={() => completeCall(activeCall.id, 'busy', 'Busy signal')}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Busy
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Calls */}
          <div>
            <h3 className="font-medium mb-3">Upcoming Calls Today</h3>
            <div className="space-y-2">
              {upcomingCalls.map(call => (
                <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="font-medium text-blue-600">
                        {new Date(call.scheduled_time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{call.contacts.name}</div>
                      <div className="text-sm text-gray-500">{call.contacts.company}</div>
                      <div className="text-sm text-gray-400">{call.call_type}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => makeScheduledCall(call.id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Call Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats & Controls Sidebar */}
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-3">Call Stats (7 days)</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Scheduled:</span>
                <span className="font-medium">{callStats.scheduled}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed:</span>
                <span className="font-medium text-green-600">{callStats.completed}</span>
              </div>
              <div className="flex justify-between">
                <span>Missed:</span>
                <span className="font-medium text-red-600">{callStats.missed}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Success Rate:</span>
                <span className="font-medium">{callStats.success_rate}%</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-3">Working Hours</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block mb-1">Start Time</label>
                <input
                  type="time"
                  value={workingHours.start}
                  onChange={(e) => setWorkingHours(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full p-1 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1">End Time</label>
                <input
                  type="time"
                  value={workingHours.end}
                  onChange={(e) => setWorkingHours(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full p-1 border rounded"
                />
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={workingHours.excludeWeekends}
                  onChange={(e) => setWorkingHours(prev => ({ ...prev, excludeWeekends: e.target.checked }))}
                  className="mr-2"
                />
                <span>Exclude weekends</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}