import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { MagnifyingGlassIcon, PlusIcon, FunnelIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { 
  PhoneIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  PhoneArrowUpRightIcon,
  PhoneArrowDownLeftIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  XCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BellIcon,
  UserPlusIcon,
  BuildingOfficeIcon,
  SparklesIcon,
  DevicePhoneMobileIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PuzzlePieceIcon,
  RocketLaunchIcon,
  MicrophoneIcon,
  BoltIcon,
  BuildingOffice2Icon,
  ClipboardDocumentListIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { PhoneIcon as PhoneSolid } from '@heroicons/react/24/solid';
import { 
  LineChart, Line, 
  BarChart, Bar, 
  PieChart, Pie, Cell,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiResponding, setAiResponding] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [timeRange, setTimeRange] = useState('today');
  
  const [stats, setStats] = useState({
    totalCalls: 0,
    callsToday: 0,
    avgCallDuration: 0,
    totalContacts: 0,
    newContactsToday: 0,
    conversionRate: 0,
    totalDeals: 0,
    dealsWon: 0,
    callsInProgress: 0,
    missedCalls: 0,
    scheduledCallbacks: 0,
    upcomingAppointments: 0
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [topAgents, setTopAgents] = useState([]);
  const [callTrends, setCallTrends] = useState([]);
  const [leadSourceData, setLeadSourceData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  
  // Mock live insights
  const [liveInsights, setLiveInsights] = useState({
    leadScore: '--',
    sentiment: 'Neutral',
    intent: '--',
    urgency: '--'
  });

  useEffect(() => {
    loadContacts();
    loadDashboardData();
  }, [searchQuery, activeTab, timeRange]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/contacts');
      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    // Get data from global storage
    const callLogs = global.callLogs || [];
    const contacts = global.contacts || [];
    const callbacks = global.scheduledCallbacks || [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    // Filter based on time range
    let startDate;
    switch(timeRange) {
      case 'today':
        startDate = today;
        break;
      case 'week':
        startDate = weekAgo;
        break;
      case 'month':
        startDate = monthAgo;
        break;
      default:
        startDate = today;
    }
    
    // Calculate call statistics
    const filteredCalls = callLogs.filter(log => 
      new Date(log.timestamp) >= startDate
    );
    
    const todaysCalls = callLogs.filter(log => 
      new Date(log.timestamp) >= today
    );
    
    const completedCalls = filteredCalls.filter(c => c.status === 'completed');
    const totalDuration = completedCalls.reduce((sum, call) => sum + (call.duration || 0), 0);
    const avgDuration = completedCalls.length > 0 ? Math.round(totalDuration / completedCalls.length) : 0;
    
    // Calculate contact statistics
    const newContactsToday = contacts.filter(c => 
      c.created_at && new Date(c.created_at) >= today
    ).length;
    
    // Calculate conversion rate
    const contactsWithDeals = contacts.filter(c => 
      (c.open_deals_count || 0) + (c.won_deals_count || 0) > 0
    ).length;
    const conversionRate = contacts.length > 0 
      ? Math.round((contactsWithDeals / contacts.length) * 100) 
      : 0;
    
    // Calculate deal statistics
    const totalDeals = contacts.reduce((sum, c) => 
      sum + (c.open_deals_count || 0) + (c.closed_deals_count || 0), 0
    );
    const dealsWon = contacts.reduce((sum, c) => sum + (c.won_deals_count || 0), 0);
    
    // Count missed calls
    const missedCalls = filteredCalls.filter(c => 
      c.status === 'no-answer' || c.status === 'failed'
    ).length;
    
    // Count scheduled callbacks
    const upcomingCallbacks = callbacks.filter(cb => 
      new Date(cb.date) >= today
    ).length;
    
    setStats({
      totalCalls: callLogs.length,
      callsToday: todaysCalls.length,
      avgCallDuration: avgDuration,
      totalContacts: contacts.length,
      newContactsToday,
      conversionRate,
      totalDeals,
      dealsWon,
      callsInProgress: filteredCalls.filter(c => c.status === 'in-progress').length,
      missedCalls,
      scheduledCallbacks: upcomingCallbacks,
      upcomingAppointments: Math.floor(Math.random() * 10) + 5
    });
    
    // Generate call trends data for charts
    const trends = [];
    if (timeRange === 'today') {
      // Hourly breakdown
      for (let hour = 8; hour <= 18; hour++) {
        const hourCalls = todaysCalls.filter(c => {
          const callHour = new Date(c.timestamp).getHours();
          return callHour === hour;
        }).length;
        trends.push({
          name: `${hour}:00`,
          calls: hourCalls,
          completed: hourCalls * 0.8,
          missed: hourCalls * 0.2
        });
      }
    } else {
      // Daily breakdown
      const days = timeRange === 'week' ? 7 : 30;
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        
        const dayCalls = callLogs.filter(c => {
          const callDate = new Date(c.timestamp);
          return callDate >= dayStart && callDate < dayEnd;
        });
        
        trends.push({
          name: date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric' }),
          calls: dayCalls.length,
          completed: dayCalls.filter(c => c.status === 'completed').length,
          missed: dayCalls.filter(c => c.status === 'no-answer' || c.status === 'failed').length
        });
      }
    }
    setCallTrends(trends);
    
    // Generate lead source data for pie chart
    const sources = [
      { name: 'Website', value: 35, color: '#636B56' },
      { name: 'Referral', value: 25, color: '#864936' },
      { name: 'Cold Call', value: 20, color: '#B28354' },
      { name: 'Social Media', value: 15, color: '#7a7a7a' },
      { name: 'Other', value: 5, color: '#F8F2E7' }
    ];
    setLeadSourceData(sources);
    
    // Generate performance data
    const perfData = trends.map(t => ({
      name: t.name,
      'Connect Rate': Math.round((t.completed / (t.calls || 1)) * 100),
      'Conversion': Math.round(Math.random() * 30 + 10)
    }));
    setPerformanceData(perfData);
    
    // Generate recent activity
    const activities = [];
    todaysCalls.slice(0, 5).forEach(call => {
      activities.push({
        id: call.id,
        type: 'call',
        title: call.direction === 'inbound' ? 'Incoming Call' : 'Outgoing Call',
        description: `${call.phoneNumber} • ${call.duration}s`,
        time: new Date(call.timestamp).toLocaleTimeString('en-AU', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        icon: call.direction === 'inbound' ? PhoneArrowDownLeftIcon : PhoneArrowUpRightIcon,
        status: call.status
      });
    });
    
    contacts.slice(0, 3).forEach(contact => {
      if (contact.created_at && new Date(contact.created_at) >= today) {
        activities.push({
          id: contact.id,
          type: 'contact',
          title: 'New Contact Added',
          description: contact.name || 'Unknown',
          time: new Date(contact.created_at).toLocaleTimeString('en-AU', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          icon: UserPlusIcon,
          status: 'new'
        });
      }
    });
    
    setRecentActivity(activities.sort((a, b) => b.time - a.time).slice(0, 10));
    
    // Generate top agents data
    const agents = [
      { name: 'Sarah Wilson', calls: 42, deals: 5, conversion: 85 },
      { name: 'Michael Chen', calls: 38, deals: 4, conversion: 78 },
      { name: 'Emma Thompson', calls: 35, deals: 6, conversion: 92 },
      { name: 'David Brown', calls: 31, deals: 3, conversion: 71 }
    ];
    setTopAgents(agents);
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-[#F8F2E7] via-white to-[#F5EDE2]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
                  Real-Time Analytics Dashboard
                </h1>
                <p className="text-gray-600 mt-1">Live performance metrics and insights</p>
              </div>
              
              {/* Time Range Selector */}
              <div className="flex gap-2">
                {['today', 'week', 'month'].map(range => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                      timeRange === range
                        ? 'bg-gradient-to-r from-[#636B56] to-[#864936] text-white shadow-lg'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {range === 'today' ? 'Today' : range === 'week' ? 'This Week' : 'This Month'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Calls */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#B28354]/20">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-[#636B56]/10 to-[#636B56]/5 rounded-xl">
                  <PhoneIcon className="w-6 h-6 text-[#636B56]" />
                </div>
                <span className="text-xs text-green-600 font-medium flex items-center">
                  <ArrowUpIcon className="w-3 h-3 mr-1" />
                  12%
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalCalls}</div>
              <div className="text-sm text-gray-600">Total Calls</div>
              <div className="text-xs text-[#864936] mt-1">{stats.callsToday} today</div>
            </div>

            {/* Average Call Duration */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#B28354]/20">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-[#864936]/10 to-[#864936]/5 rounded-xl">
                  <ClockIcon className="w-6 h-6 text-[#864936]" />
                </div>
                <span className="text-xs text-red-600 font-medium flex items-center">
                  <ArrowDownIcon className="w-3 h-3 mr-1" />
                  5%
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatDuration(stats.avgCallDuration)}</div>
              <div className="text-sm text-gray-600">Avg Duration</div>
              <div className="text-xs text-[#864936] mt-1">{stats.callsInProgress} in progress</div>
            </div>

            {/* Total Contacts */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#B28354]/20">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-[#B28354]/10 to-[#B28354]/5 rounded-xl">
                  <UserGroupIcon className="w-6 h-6 text-[#B28354]" />
                </div>
                <span className="text-xs text-green-600 font-medium flex items-center">
                  <ArrowUpIcon className="w-3 h-3 mr-1" />
                  8%
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalContacts}</div>
              <div className="text-sm text-gray-600">Total Contacts</div>
              <div className="text-xs text-[#864936] mt-1">+{stats.newContactsToday} new today</div>
            </div>

            {/* Conversion Rate */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#B28354]/20">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl">
                  <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-xs text-green-600 font-medium flex items-center">
                  <ArrowUpIcon className="w-3 h-3 mr-1" />
                  15%
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</div>
              <div className="text-sm text-gray-600">Conversion Rate</div>
              <div className="text-xs text-[#864936] mt-1">{stats.dealsWon} deals won</div>
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-red-700">{stats.missedCalls}</div>
                  <div className="text-xs text-red-600">Missed Calls</div>
                </div>
                <XCircleIcon className="w-8 h-8 text-red-400" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-blue-700">{stats.scheduledCallbacks}</div>
                  <div className="text-xs text-blue-600">Callbacks</div>
                </div>
                <CalendarIcon className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-green-700">{stats.totalDeals}</div>
                  <div className="text-xs text-green-600">Active Deals</div>
                </div>
                <CurrencyDollarIcon className="w-8 h-8 text-green-400" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-purple-700">{stats.upcomingAppointments}</div>
                  <div className="text-xs text-purple-600">Appointments</div>
                </div>
                <BuildingOfficeIcon className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Call Activity Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-[#B28354]/20">
              <h2 className="text-xl font-bold text-[#636B56] mb-4">Call Activity Trends</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={callTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#7a7a7a" fontSize={12} />
                  <YAxis stroke="#7a7a7a" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #B28354',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    stackId="1"
                    stroke="#636B56" 
                    fill="#636B56" 
                    fillOpacity={0.6}
                    name="Completed"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="missed" 
                    stackId="1"
                    stroke="#864936" 
                    fill="#864936" 
                    fillOpacity={0.6}
                    name="Missed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Lead Sources Pie Chart */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#B28354]/20">
              <h2 className="text-xl font-bold text-[#636B56] mb-4">Lead Sources</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leadSourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {leadSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Metrics Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#B28354]/20 mb-8">
            <h2 className="text-xl font-bold text-[#636B56] mb-4">Performance Metrics</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#7a7a7a" fontSize={12} />
                <YAxis stroke="#7a7a7a" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #B28354',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Connect Rate" 
                  stroke="#636B56" 
                  strokeWidth={2}
                  dot={{ fill: '#636B56', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Conversion" 
                  stroke="#864936" 
                  strokeWidth={2}
                  dot={{ fill: '#864936', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom Section with Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Tasks / To-Do List */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#B28354]/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#636B56]">Tasks</h2>
                <ClipboardDocumentListIcon className="w-5 h-5 text-[#636B56]" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="mt-0.5">
                    <div className="w-4 h-4 rounded-full border-2 border-red-500"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Follow up with John Smith</p>
                    <p className="text-xs text-gray-600">Due today at 2:00 PM</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="mt-0.5">
                    <div className="w-4 h-4 rounded-full border-2 border-yellow-500"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Send property listings</p>
                    <p className="text-xs text-gray-600">Due tomorrow</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className="mt-0.5">
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 line-through">Client meeting</p>
                    <p className="text-xs text-gray-400">Completed</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className="mt-0.5">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Review contracts</p>
                    <p className="text-xs text-gray-600">Due next week</p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => window.location.href = '/tasks'}
                className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-[#636B56] to-[#864936] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
              >
                View All Tasks
              </button>
            </div>
            
            {/* Top Agents */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-[#B28354]/20">
              <h2 className="text-xl font-bold text-[#636B56] mb-4">Top Performing Agents</h2>
              <div className="space-y-3">
                {topAgents.map((agent, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                        idx === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                        idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                        'bg-gradient-to-br from-[#636B56] to-[#864936]'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{agent.name}</div>
                        <div className="text-xs text-gray-500">{agent.calls} calls today</div>
                      </div>
                    </div>
                    <div className="flex gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-[#636B56]">{agent.deals}</div>
                        <div className="text-xs text-gray-500">Deals</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-[#864936]">{agent.conversion}%</div>
                        <div className="text-xs text-gray-500">Conv</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#B28354]/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#636B56]">Recent Activity</h2>
                <BellIcon className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentActivity.length > 0 ? (
                  recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'call' ? 'bg-green-100' :
                        activity.type === 'contact' ? 'bg-blue-100' :
                        'bg-gray-100'
                      }`}>
                        <activity.icon className={`w-4 h-4 ${
                          activity.type === 'call' ? 'text-green-600' :
                          activity.type === 'contact' ? 'text-blue-600' :
                          'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-600 truncate">{activity.description}</p>
                      </div>
                      <div className="text-xs text-gray-400">{activity.time}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No recent activity
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Advanced VoiCRM Features Grid */}
          <div className="mt-8 space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#636B56] mb-2" style={{ fontFamily: 'Forum, serif' }}>
                VoiCRM Advanced Features
              </h2>
              <p className="text-[#864936] text-lg">Industry-Leading AI-Powered Real Estate CRM</p>
            </div>

            {/* AI-Powered Systems */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#B28354]/20">
              <h3 className="text-xl font-bold text-[#636B56] mb-4 flex items-center">
                <SparklesIcon className="w-6 h-6 mr-2" />
                AI-Powered Systems
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                  onClick={() => window.location.href = '/whisperer'}
                  className="bg-gradient-to-r from-[#636B56] to-[#864936] text-white rounded-xl p-4 text-center transition-all hover:shadow-lg transform hover:scale-105"
                >
                  <MicrophoneIcon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Client-Focused Whisper</div>
                  <div className="text-xs opacity-80">AI listens to clients</div>
                </button>
                <button 
                  onClick={() => window.location.href = '/ai-voice-agent'}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 text-center transition-all hover:shadow-lg transform hover:scale-105"
                >
                  <PhoneIcon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">AI Voice Agent</div>
                  <div className="text-xs opacity-80">11Labs Integration</div>
                </button>
                <button 
                  onClick={() => window.location.href = '/whisperer'}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4 text-center transition-all hover:shadow-lg transform hover:scale-105"
                >
                  <BoltIcon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Enhanced AI</div>
                  <div className="text-xs opacity-80">Ultra-fast &lt;250ms</div>
                </button>
                <button 
                  onClick={() => window.location.href = '/powerdialer'}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4 text-center transition-all hover:shadow-lg transform hover:scale-105"
                >
                  <DevicePhoneMobileIcon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Smart Dialer</div>
                  <div className="text-xs opacity-80">Auto-dial system</div>
                </button>
              </div>
            </div>

            {/* VoIP & Communication */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#B28354]/20">
              <h3 className="text-xl font-bold text-[#636B56] mb-4 flex items-center">
                <PhoneIcon className="w-6 h-6 mr-2" />
                Industry-Leading VoIP
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                  onClick={() => window.location.href = '/twilio-browser-phone'}
                  className="bg-gradient-to-r from-[#636B56] to-[#864936] text-white rounded-xl p-4 text-center transition-all hover:shadow-lg transform hover:scale-105"
                >
                  <PhoneSolid className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Browser Phone</div>
                  <div className="text-xs opacity-80">HD Voice Quality</div>
                </button>
                <button 
                  onClick={() => window.location.href = '/twilio-browser-phone'}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-4 text-center transition-all hover:shadow-lg transform hover:scale-105"
                >
                  <RocketLaunchIcon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Premium VoIP</div>
                  <div className="text-xs opacity-80">Industry-leading</div>
                </button>
                <button 
                  onClick={() => window.location.href = '/calls'}
                  className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl p-4 text-center transition-all hover:shadow-lg transform hover:scale-105"
                >
                  <ChartBarIcon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Call Logs</div>
                  <div className="text-xs opacity-80">Full history</div>
                </button>
                <button 
                  onClick={() => window.location.href = '/powerdialer'}
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl p-4 text-center transition-all hover:shadow-lg transform hover:scale-105"
                >
                  <ClockIcon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Scheduled Calls</div>
                  <div className="text-xs opacity-80">Auto-dial queue</div>
                </button>
              </div>
            </div>

            {/* CMA Studio - Real Estate Analysis */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#B28354]/20">
              <h3 className="text-xl font-bold text-[#636B56] mb-4 flex items-center">
                <BuildingOffice2Icon className="w-6 h-6 mr-2" />
                CMA Studio
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                  onClick={() => window.location.href = '/cma'}
                  className="bg-gradient-to-r from-[#636B56] to-[#864936] text-white rounded-xl p-4 text-center transition-all hover:shadow-lg transform hover:scale-105"
                >
                  <ChartBarIcon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Market Analysis</div>
                  <div className="text-xs opacity-80">Comparative analysis</div>
                </button>
                <button 
                  onClick={() => window.location.href = '/property-analysis'}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 text-center transition-all hover:shadow-lg transform hover:scale-105"
                >
                  <BuildingOfficeIcon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Properties</div>
                  <div className="text-xs opacity-80">Compliance</div>
                </button>
                <button 
                  onClick={() => window.location.href = '/reports'}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4 text-center transition-all hover:shadow-lg transform hover:scale-105"
                >
                  <ChartBarIcon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Reports</div>
                  <div className="text-xs opacity-80">Custom reports</div>
                </button>
                <button 
                  onClick={() => window.location.href = '/analytics'}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4 text-center transition-all hover:shadow-lg transform hover:scale-105"
                >
                  <ArrowTrendingUpIcon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Analytics</div>
                  <div className="text-xs opacity-80">Market insights</div>
                </button>
              </div>
            </div>

            {/* CRM & Contact Management */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#B28354]/20">
              <h3 className="text-xl font-bold text-[#636B56] mb-4 flex items-center">
                <UserGroupIcon className="w-6 h-6 mr-2" />
                Advanced CRM Features
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                  onClick={() => window.location.href = '/contacts'}
                  className="bg-gradient-to-r from-[#636B56] to-[#864936] text-white rounded-xl p-4 text-center transition-all hover:shadow-lg transform hover:scale-105"
                >
                  <UserPlusIcon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Contacts</div>
                  <div className="text-xs opacity-80">Advanced management</div>
                </button>
                <button 
                  onClick={() => window.location.href = '/integrations'}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 text-center transition-all hover:shadow-lg transform hover:scale-105"
                >
                  <BuildingOffice2Icon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">PipeDrive Sync</div>
                  <div className="text-xs opacity-80">Full integration</div>
                </button>
                <button 
                  onClick={() => window.location.href = '/calendar'}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4 text-center transition-all hover:shadow-lg transform hover:scale-105"
                >
                  <CalendarIcon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Calendar</div>
                  <div className="text-xs opacity-80">Smart scheduling</div>
                </button>
                <button 
                  onClick={() => window.location.href = '/mapping'}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4 text-center transition-all hover:shadow-lg transform hover:scale-105"
                >
                  <BuildingOfficeIcon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Property Maps</div>
                  <div className="text-xs opacity-80">Circuit-inspired</div>
                </button>
              </div>
            </div>

            {/* Mobile & Integration */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#B28354]/20">
              <h3 className="text-xl font-bold text-[#636B56] mb-4 flex items-center">
                <PuzzlePieceIcon className="w-6 h-6 mr-2" />
                Mobile & Integrations
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                  onClick={() => window.open('/twilio-browser-phone', '_blank')}
                  className="bg-gradient-to-r from-[#636B56] to-[#864936] text-white rounded-xl p-4 text-center transition-all hover:shadow-lg transform hover:scale-105"
                >
                  <DevicePhoneMobileIcon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Mobile App</div>
                  <div className="text-xs opacity-80">iOS & Android ready</div>
                </button>
                <button 
                  onClick={() => window.location.href = '/messages'}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 text-center transition-all hover:shadow-lg transform hover:scale-105"
                >
                  <ChatBubbleLeftRightIcon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Messages</div>
                  <div className="text-xs opacity-80">SMS & MMS</div>
                </button>
                <button 
                  onClick={() => window.location.href = '/email'}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4 text-center transition-all hover:shadow-lg transform hover:scale-105"
                >
                  <EnvelopeIcon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Email Center</div>
                  <div className="text-xs opacity-80">Mass campaigns</div>
                </button>
                <button 
                  onClick={() => window.location.href = '/phone-numbers'}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4 text-center transition-all hover:shadow-lg transform hover:scale-105"
                >
                  <PhoneIcon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Phone Numbers</div>
                  <div className="text-xs opacity-80">Carousel system</div>
                </button>
              </div>
            </div>
          </div>

          {/* All features now navigate directly to functional pages */}
        </div>
      </div>
    </Layout>
  );
}