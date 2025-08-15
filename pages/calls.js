import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  PhoneIcon, 
  PhoneArrowDownLeftIcon,
  PhoneArrowUpRightIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  MicrophoneIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function Calls() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState('today');

  useEffect(() => {
    fetchCalls();
  }, [dateRange, filterType]);

  const fetchCalls = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/calls/get-logs');
      const data = await response.json();
      
      if (data.success) {
        setCalls(data.calls);
      }
    } catch (error) {
      console.error('Error fetching calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return date.toLocaleDateString('en-AU', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getSentimentColor = (sentiment) => {
    switch(sentiment?.toLowerCase()) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch(urgency?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Call Logs</h1>
              <p className="text-sm text-gray-500 mt-1">
                View all calls with AI-powered summaries and insights
              </p>
            </div>
            
            <div className="flex gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#636B56]"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#636B56]"
              >
                <option value="all">All Calls</option>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
                <option value="missed">Missed</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-[#636B56]/5 to-transparent p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <PhoneIcon className="h-8 w-8 text-[#636B56]" />
                <span className="text-2xl font-bold text-gray-900">{calls.length}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Total Calls</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-transparent p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <PhoneArrowDownLeftIcon className="h-8 w-8 text-green-600" />
                <span className="text-2xl font-bold text-gray-900">
                  {calls.filter(c => c.direction === 'inbound').length}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Inbound</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-transparent p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <PhoneArrowUpRightIcon className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">
                  {calls.filter(c => c.direction === 'outbound').length}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Outbound</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-transparent p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <ClockIcon className="h-8 w-8 text-purple-600" />
                <span className="text-2xl font-bold text-gray-900">
                  {calls.reduce((acc, c) => acc + (c.duration || 0), 0) > 0 
                    ? formatDuration(calls.reduce((acc, c) => acc + (c.duration || 0), 0))
                    : '0:00'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Total Duration</p>
            </div>
          </div>
        </div>

        {/* Call List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#636B56] mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading calls...</p>
            </div>
          ) : calls.length === 0 ? (
            <div className="p-12 text-center">
              <PhoneIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No calls found</p>
              <p className="text-sm text-gray-400 mt-2">Make your first call to see it here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {calls.map((call) => (
                <div
                  key={call.id}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedCall(selectedCall?.id === call.id ? null : call)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-full ${
                        call.direction === 'inbound' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {call.direction === 'inbound' 
                          ? <PhoneArrowDownLeftIcon className="h-5 w-5" />
                          : <PhoneArrowUpRightIcon className="h-5 w-5" />
                        }
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">
                            {call.phoneNumber}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            call.status === 'completed' 
                              ? 'bg-green-100 text-green-700'
                              : call.status === 'missed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {call.status}
                          </span>
                          {call.summary && (
                            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                              <SparklesIcon className="h-3 w-3" />
                              AI Summary
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {formatTimestamp(call.timestamp)}
                          </span>
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            {formatDuration(call.duration || 0)}
                          </span>
                        </div>

                        {/* AI Summary Preview */}
                        {call.summary && (
                          <div className="mt-3 p-3 bg-gradient-to-r from-[#F8F2E7]/50 to-white rounded-lg border border-[#B28354]/20">
                            <p className="text-sm text-gray-700 line-clamp-2">
                              {call.summary.overview}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className={`text-xs px-2 py-1 rounded ${getSentimentColor(call.summary.sentiment)}`}>
                                {call.summary.sentiment}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${getUrgencyColor(call.summary.urgency)}`}>
                                {call.summary.urgency} Priority
                              </span>
                              {call.summary.nextSteps && (
                                <span className="text-xs text-[#636B56] font-medium">
                                  Next: {call.summary.nextSteps.substring(0, 50)}...
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <ChevronRightIcon className={`h-5 w-5 text-gray-400 transition-transform ${
                      selectedCall?.id === call.id ? 'rotate-90' : ''
                    }`} />
                  </div>

                  {/* Expanded Summary */}
                  {selectedCall?.id === call.id && call.summary && (
                    <div className="mt-6 ml-14 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-2">Key Points</h4>
                          <ul className="space-y-1">
                            {call.summary.keyPoints?.map((point, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-start">
                                <span className="text-[#864936] mr-2">•</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="bg-[#636B56]/5 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-2">Action Items</h4>
                          <div className="space-y-2">
                            {call.summary.actionItems?.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <CheckCircleIcon className="h-4 w-4 text-[#636B56] mt-0.5" />
                                <span className="text-sm text-gray-600">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#864936]/5 p-4 rounded-lg">
                        <h4 className="font-semibold text-[#864936] mb-1">Next Steps</h4>
                        <p className="text-sm text-gray-700">{call.summary.nextSteps}</p>
                      </div>

                      <div className="flex gap-3">
                        <button className="px-4 py-2 bg-[#636B56] text-white rounded-lg hover:bg-[#525a48] transition-colors">
                          View Full Recording
                        </button>
                        <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                          Edit Summary
                        </button>
                        <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                          Add to Contact
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}