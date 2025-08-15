import { useState, useEffect } from 'react';
import { 
  PhoneIcon, 
  ClockIcon, 
  UserGroupIcon, 
  ArrowTrendingUpIcon,
  ChartBarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export default function CallAnalytics() {
  const [dateRange, setDateRange] = useState('week');
  const [metrics, setMetrics] = useState({
    totalCalls: 342,
    avgDuration: '4:32',
    conversionRate: 24.5,
    missedCalls: 12,
    avgResponseTime: '1.2 min',
    callQuality: 94,
  });

  // Call volume by hour
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    calls: Math.floor(Math.random() * 20) + 5,
    answered: Math.floor(Math.random() * 15) + 3,
  }));

  // Call outcomes
  const outcomeData = [
    { name: 'Successful', value: 178, color: '#10b981' },
    { name: 'No Answer', value: 89, color: '#f59e0b' },
    { name: 'Busy', value: 45, color: '#ef4444' },
    { name: 'Voicemail', value: 30, color: '#6b7280' },
  ];

  // Agent performance
  const agentData = [
    { name: 'John Agent', calls: 89, duration: 5.2, conversion: 28, satisfaction: 4.8 },
    { name: 'Sarah Agent', calls: 76, duration: 4.8, conversion: 32, satisfaction: 4.9 },
    { name: 'Mike Agent', calls: 92, duration: 3.9, conversion: 22, satisfaction: 4.6 },
    { name: 'Emily Agent', calls: 85, duration: 4.5, conversion: 26, satisfaction: 4.7 },
  ];

  // Call quality metrics over time
  const qualityData = [
    { date: 'Mon', quality: 92, noise: 8, clarity: 94 },
    { date: 'Tue', quality: 94, noise: 6, clarity: 95 },
    { date: 'Wed', quality: 91, noise: 9, clarity: 93 },
    { date: 'Thu', quality: 95, noise: 5, clarity: 96 },
    { date: 'Fri', quality: 93, noise: 7, clarity: 94 },
    { date: 'Sat', quality: 96, noise: 4, clarity: 97 },
    { date: 'Sun', quality: 94, noise: 6, clarity: 95 },
  ];

  // Lead source by calls
  const sourceData = [
    { source: 'Website', calls: 120, converted: 28 },
    { source: 'Referral', calls: 89, converted: 35 },
    { source: 'Cold Call', calls: 67, converted: 12 },
    { source: 'Email', calls: 45, converted: 18 },
    { source: 'Social', calls: 21, converted: 8 },
  ];

  // AI insights
  const insights = [
    {
      type: 'success',
      title: 'Best Calling Time',
      description: 'Calls between 10-11 AM have 40% higher answer rate',
      action: 'Schedule more calls during this window',
    },
    {
      type: 'warning',
      title: 'High Abandon Rate',
      description: '15% of calls abandoned after 30 seconds hold time',
      action: 'Consider adding more agents during peak hours',
    },
    {
      type: 'info',
      title: 'Sentiment Trend',
      description: 'Customer sentiment improved 12% this week',
      action: 'Continue using current talk tracks',
    },
    {
      type: 'success',
      title: 'Top Performer',
      description: 'Sarah has 32% conversion rate, highest on team',
      action: 'Share her techniques in next team meeting',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Call Analytics</h1>
        <p className="mt-2 text-gray-600">Advanced insights into your calling performance</p>
      </div>

      {/* Date Range Selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        {['today', 'week', 'month', 'quarter', 'year'].map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-4 py-2 rounded-lg capitalize ${
              dateRange === range
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <PhoneIcon className="h-8 w-8 text-indigo-600" />
            <span className="text-xs text-green-600">+12%</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{metrics.totalCalls}</p>
          <p className="text-sm text-gray-500">Total Calls</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <ClockIcon className="h-8 w-8 text-blue-600" />
            <span className="text-xs text-green-600">+8%</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{metrics.avgDuration}</p>
          <p className="text-sm text-gray-500">Avg Duration</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
            <span className="text-xs text-green-600">+5%</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{metrics.conversionRate}%</p>
          <p className="text-sm text-gray-500">Conversion</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <PhoneIcon className="h-8 w-8 text-red-600" />
            <span className="text-xs text-red-600">-3</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{metrics.missedCalls}</p>
          <p className="text-sm text-gray-500">Missed Calls</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <ClockIcon className="h-8 w-8 text-yellow-600" />
            <span className="text-xs text-green-600">-15s</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{metrics.avgResponseTime}</p>
          <p className="text-sm text-gray-500">Response Time</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <ChartBarIcon className="h-8 w-8 text-purple-600" />
            <span className="text-xs text-green-600">+2%</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{metrics.callQuality}%</p>
          <p className="text-sm text-gray-500">Call Quality</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Call Volume by Hour */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Call Volume by Hour</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="calls" stackId="1" stroke="#6366f1" fill="#6366f1" />
              <Area type="monotone" dataKey="answered" stackId="1" stroke="#10b981" fill="#10b981" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Call Outcomes */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Call Outcomes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={outcomeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {outcomeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Call Quality Metrics */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Call Quality Metrics</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={qualityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="quality" stroke="#6366f1" strokeWidth={2} />
            <Line type="monotone" dataKey="clarity" stroke="#10b981" strokeWidth={2} />
            <Line type="monotone" dataKey="noise" stroke="#ef4444" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Agent Performance Table */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Agent Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calls</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversion</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Satisfaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {agentData.map((agent) => (
                <tr key={agent.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {agent.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agent.calls}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agent.duration} min</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900">{agent.conversion}%</span>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${agent.conversion * 2}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900">{agent.satisfaction}</span>
                      <span className="ml-1 text-yellow-400">★</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, idx) => (
            <div 
              key={idx} 
              className={`p-4 rounded-lg border-l-4 ${
                insight.type === 'success' ? 'border-green-500 bg-green-50' :
                insight.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
              }`}
            >
              <h4 className="font-semibold text-sm">{insight.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
              <p className="text-xs text-gray-500 mt-2">
                <span className="font-medium">Action:</span> {insight.action}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Lead Source Performance */}
      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <h3 className="text-lg font-semibold mb-4">Lead Source Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sourceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="source" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="calls" fill="#6366f1" />
            <Bar dataKey="converted" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}