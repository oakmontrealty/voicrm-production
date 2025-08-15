import { useState, useEffect, useRef, useCallback } from 'react';
import { PhoneIcon, XMarkIcon, PauseIcon, PlayIcon, ForwardIcon, MicrophoneIcon } from '@heroicons/react/24/solid';

export default function PowerDialer({ 
  contacts, 
  twilioDevice, 
  onCallComplete,
  onCallStart,
  aiWhisperer 
}) {
  // State management
  const [isDialing, setIsDialing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  const [callQueue, setCallQueue] = useState([]);
  const [completedCalls, setCompletedCalls] = useState([]);
  const [failedNumbers, setFailedNumbers] = useState([]);
  const [stats, setStats] = useState({
    totalCalls: 0,
    connected: 0,
    voicemails: 0,
    noAnswer: 0,
    failed: 0,
    avgCallDuration: 0,
    callsPerHour: 0
  });

  // Settings
  const [settings, setSettings] = useState({
    autoDialNext: true,
    waitTimeBetweenCalls: 3000, // 3 seconds
    maxRingTime: 30000, // 30 seconds
    simultaneousCalls: 1, // Can be increased to 3 for parallel dialing
    skipBadNumbers: true,
    autoLeaveVoicemail: true,
    voicemailDetection: true,
    callRecording: true,
    displayCallerID: 'main', // 'main' or 'alternate'
    priorityMode: 'sequential', // 'sequential', 'priority', 'random'
    workingHours: {
      enabled: false,
      start: '09:00',
      end: '17:00',
      timezone: 'local'
    }
  });

  // Refs
  const dialerRef = useRef(null);
  const queueIntervalRef = useRef(null);
  const callTimerRef = useRef(null);
  const currentCallStartTime = useRef(null);

  // Initialize call queue
  useEffect(() => {
    if (contacts && contacts.length > 0) {
      const phoneNumbers = contacts
        .filter(c => c.phone_number && !failedNumbers.includes(c.phone_number))
        .map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone_number,
          priority: c.lead_score || 50,
          attempts: 0,
          lastAttempt: null,
          status: 'pending'
        }));

      // Sort by priority if enabled
      if (settings.priorityMode === 'priority') {
        phoneNumbers.sort((a, b) => b.priority - a.priority);
      } else if (settings.priorityMode === 'random') {
        phoneNumbers.sort(() => Math.random() - 0.5);
      }

      setCallQueue(phoneNumbers);
    }
  }, [contacts, settings.priorityMode]);

  // Auto-dial next number
  const dialNext = useCallback(async () => {
    if (isPaused || !settings.autoDialNext || currentCall) return;

    const nextContact = callQueue.find(c => c.status === 'pending');
    if (!nextContact) {
      console.log('No more numbers to dial');
      stopDialing();
      return;
    }

    // Check working hours
    if (settings.workingHours.enabled) {
      const now = new Date();
      const [startHour, startMin] = settings.workingHours.start.split(':');
      const [endHour, endMin] = settings.workingHours.end.split(':');
      const start = new Date();
      start.setHours(startHour, startMin, 0);
      const end = new Date();
      end.setHours(endHour, endMin, 0);

      if (now < start || now > end) {
        console.log('Outside working hours, pausing dialer');
        setIsPaused(true);
        return;
      }
    }

    // Update queue status
    setCallQueue(prev => prev.map(c => 
      c.id === nextContact.id 
        ? { ...c, status: 'dialing', attempts: c.attempts + 1, lastAttempt: new Date() }
        : c
    ));

    // Make the call
    await makeCall(nextContact);
  }, [isPaused, settings, currentCall, callQueue]);

  // Make a call
  const makeCall = async (contact) => {
    if (!twilioDevice) {
      console.error('Twilio device not initialized');
      return;
    }

    try {
      setCurrentCall(contact);
      currentCallStartTime.current = Date.now();

      // Notify parent component
      if (onCallStart) {
        onCallStart(contact);
      }

      // Start AI whisperer if available
      if (aiWhisperer) {
        aiWhisperer.startListening(contact);
      }

      // Format phone number
      const formattedNumber = contact.phone.replace(/\D/g, '');
      
      // Make the call
      const call = await twilioDevice.connect({
        params: {
          To: formattedNumber,
          CallerID: settings.displayCallerID,
          Record: settings.callRecording
        }
      });

      // Handle call events
      call.on('accept', () => {
        console.log(`Call connected to ${contact.name}`);
        updateStats('connected');
      });

      call.on('disconnect', () => {
        handleCallEnd(contact, 'completed');
      });

      call.on('error', (error) => {
        console.error('Call error:', error);
        handleCallEnd(contact, 'failed');
      });

      // Auto-disconnect after max ring time
      callTimerRef.current = setTimeout(() => {
        if (call && call.status() === 'pending') {
          call.disconnect();
          handleCallEnd(contact, 'no_answer');
        }
      }, settings.maxRingTime);

    } catch (error) {
      console.error('Failed to make call:', error);
      handleCallEnd(contact, 'failed');
    }
  };

  // Handle call end
  const handleCallEnd = (contact, status) => {
    // Clear timer
    if (callTimerRef.current) {
      clearTimeout(callTimerRef.current);
    }

    // Calculate call duration
    const duration = currentCallStartTime.current 
      ? Math.floor((Date.now() - currentCallStartTime.current) / 1000)
      : 0;

    // Update contact status in queue
    setCallQueue(prev => prev.map(c => 
      c.id === contact.id 
        ? { ...c, status: status === 'completed' ? 'completed' : 'failed' }
        : c
    ));

    // Add to completed calls
    setCompletedCalls(prev => [...prev, {
      ...contact,
      status,
      duration,
      timestamp: new Date()
    }]);

    // Update stats
    updateStats(status, duration);

    // Notify parent
    if (onCallComplete) {
      onCallComplete({
        contact,
        status,
        duration
      });
    }

    // Stop AI whisperer
    if (aiWhisperer) {
      aiWhisperer.stopListening();
    }

    // Clear current call
    setCurrentCall(null);

    // Auto-dial next if enabled
    if (settings.autoDialNext && isDialing && !isPaused) {
      setTimeout(() => {
        dialNext();
      }, settings.waitTimeBetweenCalls);
    }
  };

  // Update statistics
  const updateStats = (status, duration = 0) => {
    setStats(prev => {
      const newStats = { ...prev };
      newStats.totalCalls++;

      switch (status) {
        case 'connected':
        case 'completed':
          newStats.connected++;
          break;
        case 'voicemail':
          newStats.voicemails++;
          break;
        case 'no_answer':
          newStats.noAnswer++;
          break;
        case 'failed':
          newStats.failed++;
          break;
      }

      // Calculate average call duration
      if (duration > 0) {
        newStats.avgCallDuration = Math.round(
          (newStats.avgCallDuration * (newStats.connected - 1) + duration) / newStats.connected
        );
      }

      // Calculate calls per hour
      const elapsedHours = (Date.now() - dialerRef.current) / (1000 * 60 * 60);
      newStats.callsPerHour = Math.round(newStats.totalCalls / elapsedHours);

      return newStats;
    });
  };

  // Start dialing
  const startDialing = () => {
    setIsDialing(true);
    setIsPaused(false);
    dialerRef.current = Date.now();
    dialNext();
  };

  // Stop dialing
  const stopDialing = () => {
    setIsDialing(false);
    setIsPaused(false);
    if (currentCall && twilioDevice) {
      twilioDevice.disconnectAll();
    }
  };

  // Pause/Resume
  const togglePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused && !currentCall) {
      dialNext();
    }
  };

  // Skip current call
  const skipCall = () => {
    if (currentCall && twilioDevice) {
      twilioDevice.disconnectAll();
    }
  };

  // UI Component
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#636B56]">Power Dialer 2.0</h2>
        <div className="flex gap-2">
          {!isDialing ? (
            <button
              onClick={startDialing}
              disabled={callQueue.length === 0}
              className="px-6 py-2 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365] disabled:opacity-50 flex items-center gap-2"
            >
              <PlayIcon className="h-5 w-5" />
              Start Dialing
            </button>
          ) : (
            <>
              <button
                onClick={togglePause}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2"
              >
                {isPaused ? <PlayIcon className="h-5 w-5" /> : <PauseIcon className="h-5 w-5" />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={stopDialing}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
              >
                <XMarkIcon className="h-5 w-5" />
                Stop
              </button>
            </>
          )}
        </div>
      </div>

      {/* Current Call */}
      {currentCall && (
        <div className="mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Currently calling:</p>
              <p className="text-xl font-bold text-gray-800">{currentCall.name}</p>
              <p className="text-lg text-gray-600">{currentCall.phone}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={skipCall}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
              >
                <ForwardIcon className="h-5 w-5" />
                Skip
              </button>
            </div>
          </div>
          
          {/* Call Timer */}
          <CallTimer startTime={currentCallStartTime.current} />
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Calls" value={stats.totalCalls} color="blue" />
        <StatCard title="Connected" value={stats.connected} color="green" />
        <StatCard title="No Answer" value={stats.noAnswer} color="yellow" />
        <StatCard title="Failed" value={stats.failed} color="red" />
        <StatCard 
          title="Avg Duration" 
          value={`${Math.floor(stats.avgCallDuration / 60)}:${(stats.avgCallDuration % 60).toString().padStart(2, '0')}`} 
          color="purple" 
        />
        <StatCard title="Calls/Hour" value={stats.callsPerHour} color="indigo" />
        <StatCard 
          title="Success Rate" 
          value={`${stats.totalCalls > 0 ? Math.round((stats.connected / stats.totalCalls) * 100) : 0}%`} 
          color="teal" 
        />
        <StatCard title="Queue" value={callQueue.filter(c => c.status === 'pending').length} color="gray" />
      </div>

      {/* Queue Preview */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Call Queue</h3>
        <div className="max-h-48 overflow-y-auto border rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm">Name</th>
                <th className="px-4 py-2 text-left text-sm">Phone</th>
                <th className="px-4 py-2 text-left text-sm">Priority</th>
                <th className="px-4 py-2 text-left text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {callQueue.slice(0, 10).map((contact, idx) => (
                <tr key={contact.id} className={idx === 0 && contact.status === 'dialing' ? 'bg-green-50' : ''}>
                  <td className="px-4 py-2 text-sm">{contact.name}</td>
                  <td className="px-4 py-2 text-sm">{contact.phone}</td>
                  <td className="px-4 py-2 text-sm">{contact.priority}</td>
                  <td className="px-4 py-2 text-sm">
                    <StatusBadge status={contact.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settings */}
      <DialerSettings settings={settings} onChange={setSettings} />
    </div>
  );
}

// Helper Components
function StatCard({ title, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    purple: 'bg-purple-100 text-purple-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    teal: 'bg-teal-100 text-teal-800',
    gray: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
      <p className="text-xs font-medium opacity-75">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const statusConfig = {
    pending: { color: 'gray', label: 'Pending' },
    dialing: { color: 'blue', label: 'Dialing...' },
    completed: { color: 'green', label: 'Completed' },
    failed: { color: 'red', label: 'Failed' }
  };

  const config = statusConfig[status] || statusConfig.pending;
  
  return (
    <span className={`px-2 py-1 text-xs rounded-full bg-${config.color}-100 text-${config.color}-800`}>
      {config.label}
    </span>
  );
}

function CallTimer({ startTime }) {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  return (
    <div className="mt-2 text-center">
      <p className="text-3xl font-mono font-bold text-green-600">
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </p>
    </div>
  );
}

function DialerSettings({ settings, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-t pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-gray-600 hover:text-gray-800"
      >
        {isOpen ? 'Hide' : 'Show'} Settings
      </button>
      
      {isOpen && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.autoDialNext}
              onChange={(e) => onChange({ ...settings, autoDialNext: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm">Auto-dial next</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.skipBadNumbers}
              onChange={(e) => onChange({ ...settings, skipBadNumbers: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm">Skip bad numbers</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.callRecording}
              onChange={(e) => onChange({ ...settings, callRecording: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm">Record calls</span>
          </label>
          
          <label className="flex flex-col">
            <span className="text-sm mb-1">Wait time (seconds)</span>
            <input
              type="number"
              value={settings.waitTimeBetweenCalls / 1000}
              onChange={(e) => onChange({ ...settings, waitTimeBetweenCalls: e.target.value * 1000 })}
              className="px-2 py-1 border rounded"
              min="0"
              max="30"
            />
          </label>
          
          <label className="flex flex-col">
            <span className="text-sm mb-1">Priority mode</span>
            <select
              value={settings.priorityMode}
              onChange={(e) => onChange({ ...settings, priorityMode: e.target.value })}
              className="px-2 py-1 border rounded"
            >
              <option value="sequential">Sequential</option>
              <option value="priority">By Priority</option>
              <option value="random">Random</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
}