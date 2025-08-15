import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  PhoneIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  PhoneArrowUpRightIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

export default function AgencyDashboard() {
  const [timeRange, setTimeRange] = useState('day');
  const [liveMetrics, setLiveMetrics] = useState({
    totalCalls: 0,
    activeAgents: 0,
    callsInProgress: 0,
    appointmentsToday: 0,
    avgCallScore: 0,
    connectRate: 0
  });
  
  const [agentMetrics, setAgentMetrics] = useState([]);
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    // Load initial data
    loadDashboardData();
    
    // Set up real-time refresh every 5 seconds
    const interval = setInterval(() => {
      loadDashboardData();
      updateLiveMetrics();
    }, 5000);
    
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      // In production, this would fetch from your API
      const mockAgentData = [
        {
          id: 1,
          name: 'Sarah Johnson',
          status: 'on-call',
          metrics: {
            calls: 45,
            connects: 32,
            appointments: 8,
            score: 92,
            avgDuration: '4:32'
          }
        },
        {
          id: 2,
          name: 'Mike Chen',
          status: 'available',
          metrics: {
            calls: 38,
            connects: 28,
            appointments: 6,
            score: 88,
            avgDuration: '5:15'
          }
        },
        {
          id: 3,
          name: 'Emma Wilson',
          status: 'on-call',
          metrics: {
            calls: 52,
            connects: 41,
            appointments: 12,
            score: 95,
            avgDuration: '3:48'
          }
        },
        {
          id: 4,
          name: 'James Brown',
          status: 'break',
          metrics: {
            calls: 29,
            connects: 20,
            appointments: 4,
            score: 85,
            avgDuration: '6:02'
          }
        }
      ];
      
      setAgentMetrics(mockAgentData);
      
      // Calculate agency totals
      const totals = mockAgentData.reduce((acc, agent) => ({
        calls: acc.calls + agent.metrics.calls,
        connects: acc.connects + agent.metrics.connects,
        appointments: acc.appointments + agent.metrics.appointments,
        scoreSum: acc.scoreSum + agent.metrics.score,
        activeAgents: acc.activeAgents + (agent.status === 'on-call' ? 1 : 0)
      }), { calls: 0, connects: 0, appointments: 0, scoreSum: 0, activeAgents: 0 });
      
      setLiveMetrics({
        totalCalls: totals.calls,
        activeAgents: totals.activeAgents,
        callsInProgress: totals.activeAgents, // Simplified for demo
        appointmentsToday: totals.appointments,
        avgCallScore: Math.round(totals.scoreSum / mockAgentData.length),
        connectRate: Math.round((totals.connects / totals.calls) * 100)
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const updateLiveMetrics = () => {
    // Simulate live updates with small random changes
    setLiveMetrics(prev => ({
      ...prev,
      totalCalls: prev.totalCalls + Math.floor(Math.random() * 3),
      callsInProgress: Math.floor(Math.random() * 5)
    }));
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'on-call': return 'bg-green-100 text-green-800';
      case 'available': return 'bg-blue-100 text-blue-800';
      case 'break': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
                Live Agency Dashboard
              </h1>
              <p className="text-[#7a7a7a] mt-1" style={{ fontFamily: 'Avenir, sans-serif' }}>
                Real-time performance metrics across all agents
              </p>
            </div>
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-[#B28354]/20">
              <span className="text-sm text-[#7a7a7a]">Auto-refresh</span>
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {['hour', 'day', 'week', 'fortnight', 'month'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg capitalize transition-all ${
                  timeRange === range
                    ? 'bg-gradient-to-r from-[#636B56] to-[#864936] text-white'
                    : 'bg-white text-[#4a4a4a] hover:bg-[#636B56]/10 border border-[#B28354]/20'
                }`}
                style={{ fontFamily: 'Avenir, sans-serif' }}
              >
                {range === 'fortnight' ? '2 Weeks' : range}
              </button>
            ))}
          </div>
        </div>

        {/* Live Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-lg border border-[#B28354]/20 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <PhoneIcon className="h-8 w-8 text-[#636B56]" />
              <span className="text-xs text-green-600">↑ 12%</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Forum, serif' }}>{liveMetrics.totalCalls}</p>
            <p className="text-sm text-[#7a7a7a]" style={{ fontFamily: 'Avenir, sans-serif' }}>Total Calls</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-lg border border-[#B28354]/20 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <UserGroupIcon className="h-8 w-8 text-[#864936]" />
              <div className={`h-2 w-2 ${liveMetrics.activeAgents > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'} rounded-full`}></div>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Forum, serif' }}>{liveMetrics.activeAgents}</p>
            <p className="text-sm text-[#7a7a7a]" style={{ fontFamily: 'Avenir, sans-serif' }}>Active Agents</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <PhoneArrowUpRightIcon className="h-8 w-8 text-yellow-600" />
              <div className="flex space-x-1">
                {[...Array(liveMetrics.callsInProgress)].map((_, i) => (
                  <div key={i} className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse"></div>
                ))}
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold">{liveMetrics.callsInProgress}</p>
            <p className="text-sm text-gray-500">Calls Now</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <CalendarDaysIcon className="h-8 w-8 text-purple-600" />
              <span className="text-xs text-green-600">↑ 5</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{liveMetrics.appointmentsToday}</p>
            <p className="text-sm text-gray-500">Appointments</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
              <span className={`text-xs ${liveMetrics.avgCallScore >= 90 ? 'text-green-600' : 'text-yellow-600'}`}>
                {liveMetrics.avgCallScore >= 90 ? '↑' : '→'} Good
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold">{liveMetrics.avgCallScore}</p>
            <p className="text-sm text-gray-500">Avg Score</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
              <span className="text-xs text-green-600">↑ 8%</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{liveMetrics.connectRate}%</p>
            <p className="text-sm text-gray-500">Connect Rate</p>
          </div>
        </div>
      </div>

        {/* Agent Performance Table */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-lg border border-[#B28354]/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#B28354]/20 bg-[#F8F2E7]">
              <h2 className="text-xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>Agent Performance</h2>
            </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[#F8F2E7]/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Calls</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Connects</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Appointments</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Duration</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {agentMetrics.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#636B56] to-[#864936] flex items-center justify-center">
                          <span className="text-white font-medium" style={{ fontFamily: 'Forum, serif' }}>
                            {agent.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(agent.status)}`}>
                        {agent.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <span className="font-medium">{agent.metrics.calls}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <span className="font-medium">{agent.metrics.connects}</span>
                      <span className="text-gray-500 ml-1">
                        ({Math.round((agent.metrics.connects / agent.metrics.calls) * 100)}%)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <span className="font-medium">{agent.metrics.appointments}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <span className={`font-bold ${getScoreColor(agent.metrics.score)}`}>
                        {agent.metrics.score}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {agent.metrics.avgDuration}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              agent.metrics.score >= 90 ? 'bg-green-500' : 
                              agent.metrics.score >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${agent.metrics.score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

        {/* Real-time Activity Feed */}
        <div className="mt-8 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-[#B28354]/20">
            <div className="px-6 py-4 border-b border-[#B28354]/20 bg-[#F8F2E7]">
              <h2 className="text-xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>Live Activity Feed</h2>
            </div>
          <div className="p-6 space-y-3 max-h-64 overflow-y-auto">
            <div className="flex items-start space-x-3">
              <div className="h-2 w-2 bg-green-500 rounded-full mt-1.5 animate-pulse"></div>
              <div className="flex-1">
                <p className="text-sm"><span className="font-medium">Emma Wilson</span> connected with John Smith</p>
                <p className="text-xs text-gray-500">Just now</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="h-2 w-2 bg-purple-500 rounded-full mt-1.5"></div>
              <div className="flex-1">
                <p className="text-sm"><span className="font-medium">Mike Chen</span> booked appointment - 42 Oak Street</p>
                <p className="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="h-2 w-2 bg-blue-500 rounded-full mt-1.5"></div>
              <div className="flex-1">
                <p className="text-sm"><span className="font-medium">Sarah Johnson</span> started call carousel campaign</p>
                <p className="text-xs text-gray-500">5 minutes ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}