import { useState, useEffect, useRef } from 'react';
import { 
  PhoneIcon,
  PhoneArrowUpRightIcon,
  PhoneArrowDownLeftIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  DocumentTextIcon,
  StarIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  MicrophoneIcon,
  ChatBubbleLeftRightIcon,
  EyeSlashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CalendarIcon
} from '@heroicons/react/24/solid';

export default function InternalCallLog({ isInternal = true }) {
  const [calls, setCalls] = useState([]);
  const [filteredCalls, setFilteredCalls] = useState([]);
  const [selectedCall, setSelectedCall] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    direction: 'all', // all, inbound, outbound, missed
    duration: 'all', // all, short, medium, long
    outcome: 'all', // all, connected, voicemail, busy, failed
    agent: 'all',
    dateRange: 'today' // today, week, month, custom
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  
  const audioRef = useRef(null);

  // Call log data structure
  useEffect(() => {
    loadCallLog();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadCallLog, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterCalls();
  }, [calls, searchTerm, filters]);

  // Load call log data
  const loadCallLog = async () => {
    try {
      const response = await fetch('/api/call-log?internal=true');
      const data = await response.json();
      setCalls(data.calls || getSampleCallData());
    } catch (error) {
      console.error('Failed to load call log:', error);
      setCalls(getSampleCallData());
    }
  };

  // Sample call data for demo
  const getSampleCallData = () => {
    return [
      {
        id: 'call_001',
        direction: 'outbound',
        contactName: 'John Smith',
        contactPhone: '+61412345678',
        agentName: 'Terence Houhoutas',
        agentId: 'agent_001',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString(), // 8 min call
        duration: 480, // seconds
        outcome: 'connected',
        recording: {
          url: '/recordings/call_001.mp3',
          duration: 480,
          transcription: 'Hi John, this is Terence from Oakmont Realty. I wanted to follow up on your interest in the Oak Street property...',
          sentiment: 'positive',
          keywords: ['viewing', 'price', 'interested', 'next week']
        },
        notes: 'Very interested buyer. Scheduled viewing for Saturday 2pm.',
        tags: ['hot_lead', 'property_inquiry'],
        property: {
          address: '123 Oak Street, Parramatta',
          price: 850000
        },
        isInternal: true,
        aiSummary: 'Positive conversation with interested buyer. Client wants to view the property this weekend and discussed financing options.',
        mood: 'excited',
        dealProbability: 85
      },
      {
        id: 'call_002',
        direction: 'inbound',
        contactName: 'Sarah Johnson',
        contactPhone: '+61423456789',
        agentName: 'Terence Houhoutas',
        agentId: 'agent_001',
        startTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 4 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
        duration: 900,
        outcome: 'connected',
        recording: {
          url: '/recordings/call_002.mp3',
          duration: 900,
          transcription: 'Hello, I saw your listing for the property on Pine Avenue and I\'m very interested...',
          sentiment: 'positive',
          keywords: ['listing', 'investment', 'cash_buyer', 'urgent']
        },
        notes: 'Cash buyer looking for investment property. Very motivated.',
        tags: ['cash_buyer', 'investment', 'urgent'],
        property: {
          address: '456 Pine Avenue, Westmead',
          price: 1200000
        },
        isInternal: true,
        aiSummary: 'Cash buyer for investment property. Highly motivated and ready to make offer.',
        mood: 'business_like',
        dealProbability: 95
      },
      {
        id: 'call_003',
        direction: 'outbound',
        contactName: 'Mike Chen',
        contactPhone: '+61434567890',
        agentName: 'Terence Houhoutas',
        agentId: 'agent_001',
        startTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        endTime: null,
        duration: 0,
        outcome: 'voicemail',
        recording: null,
        notes: 'Left voicemail about property valuation.',
        tags: ['follow_up', 'valuation'],
        isInternal: true,
        aiSummary: 'Voicemail left for property valuation follow-up.',
        mood: 'neutral',
        dealProbability: 30
      },
      {
        id: 'call_004',
        direction: 'missed',
        contactName: 'Unknown Caller',
        contactPhone: '+61445678901',
        agentName: null,
        agentId: null,
        startTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        endTime: null,
        duration: 0,
        outcome: 'missed',
        recording: null,
        notes: null,
        tags: ['missed', 'callback_required'],
        isInternal: true,
        aiSummary: 'Missed call - callback required.',
        mood: 'neutral',
        dealProbability: 0
      }
    ];
  };

  // Filter calls based on search and filters
  const filterCalls = () => {
    let filtered = [...calls];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(call => 
        call.contactName?.toLowerCase().includes(term) ||
        call.contactPhone?.includes(term) ||
        call.agentName?.toLowerCase().includes(term) ||
        call.notes?.toLowerCase().includes(term) ||
        call.property?.address?.toLowerCase().includes(term)
      );
    }

    // Direction filter
    if (filters.direction !== 'all') {
      filtered = filtered.filter(call => call.direction === filters.direction);
    }

    // Duration filter
    if (filters.duration !== 'all') {
      filtered = filtered.filter(call => {
        const duration = call.duration;
        switch (filters.duration) {
          case 'short': return duration <= 120; // 2 minutes
          case 'medium': return duration > 120 && duration <= 600; // 2-10 minutes
          case 'long': return duration > 600; // 10+ minutes
          default: return true;
        }
      });
    }

    // Outcome filter
    if (filters.outcome !== 'all') {
      filtered = filtered.filter(call => call.outcome === filters.outcome);
    }

    // Agent filter
    if (filters.agent !== 'all') {
      filtered = filtered.filter(call => call.agentId === filters.agent);
    }

    // Date range filter
    const now = new Date();
    filtered = filtered.filter(call => {
      const callDate = new Date(call.startTime);
      switch (filters.dateRange) {
        case 'today':
          return callDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return callDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return callDate >= monthAgo;
        default:
          return true;
      }
    });

    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    setFilteredCalls(filtered);
  };

  // Play/pause recording
  const togglePlayback = (call) => {
    if (!call.recording) return;

    if (currentlyPlaying === call.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentlyPlaying(call.id);
      setIsPlaying(true);
      setPlaybackTime(0);
      
      // In a real implementation, load and play the audio file
      console.log('Playing recording:', call.recording.url);
    }
  };

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  };

  // Get call direction icon
  const getDirectionIcon = (direction, outcome) => {
    const iconClass = "h-4 w-4";
    
    switch (direction) {
      case 'outbound':
        return <PhoneArrowUpRightIcon className={`${iconClass} text-blue-600`} />;
      case 'inbound':
        return <PhoneArrowDownLeftIcon className={`${iconClass} text-green-600`} />;
      case 'missed':
        return <PhoneIcon className={`${iconClass} text-red-600`} />;
      default:
        return <PhoneIcon className={`${iconClass} text-gray-600`} />;
    }
  };

  // Get outcome color
  const getOutcomeColor = (outcome) => {
    switch (outcome) {
      case 'connected': return 'text-green-600';
      case 'voicemail': return 'text-yellow-600';
      case 'busy': return 'text-orange-600';
      case 'missed': return 'text-red-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Add call note
  const addCallNote = async (callId, note) => {
    setCalls(prev => prev.map(call => 
      call.id === callId 
        ? { ...call, notes: call.notes ? `${call.notes}\n${note}` : note }
        : call
    ));

    try {
      await fetch('/api/call-log/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId, note })
      });
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-[#636B56]">
              {isInternal ? 'Internal Call Log' : 'Call History'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isInternal ? 'Private call records - visible only in app' : 'External call history'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isInternal && (
              <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full">
                <EyeSlashIcon className="h-4 w-4 text-gray-600" />
                <span className="text-xs text-gray-600">Internal Only</span>
              </div>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <FunnelIcon className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search calls, contacts, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-5 gap-3 p-4 bg-gray-50 rounded-lg">
              <select
                value={filters.direction}
                onChange={(e) => setFilters({...filters, direction: e.target.value})}
                className="px-3 py-2 border rounded focus:ring-2 focus:ring-[#636B56]"
              >
                <option value="all">All Directions</option>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
                <option value="missed">Missed</option>
              </select>

              <select
                value={filters.duration}
                onChange={(e) => setFilters({...filters, duration: e.target.value})}
                className="px-3 py-2 border rounded focus:ring-2 focus:ring-[#636B56]"
              >
                <option value="all">All Durations</option>
                <option value="short">Short (&lt; 2min)</option>
                <option value="medium">Medium (2-10min)</option>
                <option value="long">Long (&gt; 10min)</option>
              </select>

              <select
                value={filters.outcome}
                onChange={(e) => setFilters({...filters, outcome: e.target.value})}
                className="px-3 py-2 border rounded focus:ring-2 focus:ring-[#636B56]"
              >
                <option value="all">All Outcomes</option>
                <option value="connected">Connected</option>
                <option value="voicemail">Voicemail</option>
                <option value="busy">Busy</option>
                <option value="missed">Missed</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                className="px-3 py-2 border rounded focus:ring-2 focus:ring-[#636B56]"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>

              <button
                onClick={() => setFilters({
                  direction: 'all',
                  duration: 'all',
                  outcome: 'all',
                  agent: 'all',
                  dateRange: 'today'
                })}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Call List */}
      <div className="divide-y">
        {filteredCalls.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <PhoneIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No calls found matching your criteria</p>
          </div>
        ) : (
          filteredCalls.map((call) => (
            <div
              key={call.id}
              className="p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedCall(selectedCall?.id === call.id ? null : call)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {/* Direction Icon */}
                  <div className="flex-shrink-0">
                    {getDirectionIcon(call.direction, call.outcome)}
                  </div>

                  {/* Contact Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">
                        {call.contactName || 'Unknown'}
                      </p>
                      {call.isInternal && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          Internal
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{call.contactPhone}</p>
                    {call.property && (
                      <p className="text-xs text-blue-600 mt-1">{call.property.address}</p>
                    )}
                  </div>

                  {/* Call Details */}
                  <div className="text-right">
                    <p className="text-sm text-gray-900">{formatTimestamp(call.startTime)}</p>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      <span className={`text-xs ${getOutcomeColor(call.outcome)}`}>
                        {call.outcome}
                      </span>
                      {call.duration > 0 && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-600">
                            {formatDuration(call.duration)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Recording Controls */}
                  {call.recording && (
                    <div className="flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlayback(call);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                      >
                        {currentlyPlaying === call.id && isPlaying ? (
                          <PauseIcon className="h-4 w-4" />
                        ) : (
                          <PlayIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {selectedCall?.id === call.id && (
                <div className="mt-4 pl-7 space-y-4 border-t pt-4">
                  {/* AI Summary */}
                  {call.aiSummary && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-1">AI Summary</p>
                      <p className="text-sm text-blue-700">{call.aiSummary}</p>
                      {call.dealProbability > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-blue-600">Deal Probability:</span>
                          <div className="w-20 h-2 bg-blue-200 rounded-full">
                            <div 
                              className="h-2 bg-blue-600 rounded-full"
                              style={{ width: `${call.dealProbability}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-blue-800">
                            {call.dealProbability}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recording Details */}
                  {call.recording && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-800">Call Recording</p>
                        <div className="flex items-center gap-2">
                          <SpeakerWaveIcon className="h-4 w-4 text-gray-600" />
                          <span className="text-xs text-gray-600">
                            {formatDuration(call.recording.duration)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Transcription Preview */}
                      {call.recording.transcription && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600 mb-1">Transcription:</p>
                          <p className="text-sm text-gray-700 italic">
                            "{call.recording.transcription.substring(0, 200)}..."
                          </p>
                        </div>
                      )}

                      {/* Keywords */}
                      {call.recording.keywords && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {call.recording.keywords.map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-white text-gray-600 text-xs rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <p className="text-sm font-medium text-gray-800 mb-2">Notes</p>
                    <textarea
                      defaultValue={call.notes || ''}
                      placeholder="Add call notes..."
                      className="w-full px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-[#636B56]"
                      rows="3"
                      onBlur={(e) => {
                        if (e.target.value !== call.notes) {
                          addCallNote(call.id, e.target.value);
                        }
                      }}
                    />
                  </div>

                  {/* Tags */}
                  {call.tags && call.tags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-800 mb-2">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {call.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                          >
                            {tag.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                      Call Back
                    </button>
                    <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                      Send Message
                    </button>
                    <button className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">
                      Schedule Follow-up
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Hidden audio element for playback */}
      <audio ref={audioRef} />
    </div>
  );
}