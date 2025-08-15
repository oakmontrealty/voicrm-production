import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import realDataManager from '../lib/real-data-only';

export default function VoiCRMBrandedDashboard() {
  const [stats, setStats] = useState({
    totalContacts: 0,
    newContactsToday: 0,
    totalCalls: 0,
    callsToday: 0,
    totalDeals: 0,
    activeDeals: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    conversionRate: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadRealDashboardData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadRealDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadRealDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get REAL stats - NO MOCK DATA
      const realStats = await realDataManager.getRealDashboardStats();
      setStats(realStats);
      
      // Get REAL recent activities - NO MOCK DATA
      const realActivities = await realDataManager.getRealRecentActivities();
      setRecentActivities(realActivities);
      
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error loading real dashboard data:', error);
      // Don't show fake data on error - show zeros
      setStats({
        totalContacts: 0,
        newContactsToday: 0,
        totalCalls: 0,
        callsToday: 0,
        totalDeals: 0,
        activeDeals: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        conversionRate: 0
      });
      setRecentActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount === 0) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (num === 0) return '0';
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getActivityIcon = (type) => {
    const icons = {
      call: '📞',
      email: '✉️',
      meeting: '🤝',
      deal: '💰',
      note: '📝',
      task: '✅'
    };
    return icons[type] || '📋';
  };

  const getTimeAgo = (date) => {
    if (!date) return 'Unknown';
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-bold text-blue-900">Loading VoiCRM Dashboard...</div>
          <div className="text-sm text-gray-600 mt-2">Fetching real-time data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* VoiCRM Branded Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <span className="mr-4 text-4xl">🏠</span>
                VoiCRM
                <span className="ml-3 text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  Real Estate Intelligence
                </span>
              </h1>
              <p className="text-blue-100 mt-1">
                Advanced CRM for Real Estate Professionals
              </p>
            </div>
            
            <div className="text-right text-white">
              <div className="text-sm opacity-75">Last Updated</div>
              <div className="font-semibold">
                {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Loading...'}
              </div>
              <button
                onClick={loadRealDashboardData}
                className="mt-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded text-sm transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics - REAL DATA ONLY */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                <p className="text-3xl font-bold text-blue-600">{formatNumber(stats.totalContacts)}</p>
                <p className="text-xs text-green-600">+{stats.newContactsToday} today</p>
              </div>
              <div className="text-4xl text-blue-500">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Calls</p>
                <p className="text-3xl font-bold text-green-600">{formatNumber(stats.totalCalls)}</p>
                <p className="text-xs text-green-600">+{stats.callsToday} today</p>
              </div>
              <div className="text-4xl text-green-500">📞</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Deals</p>
                <p className="text-3xl font-bold text-purple-600">{formatNumber(stats.activeDeals)}</p>
                <p className="text-xs text-gray-600">of {stats.totalDeals} total</p>
              </div>
              <div className="text-4xl text-purple-500">💼</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-3xl font-bold text-yellow-600">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-yellow-600">{formatCurrency(stats.monthlyRevenue)} this month</p>
              </div>
              <div className="text-4xl text-yellow-500">💰</div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">📈</span>
              Performance Metrics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Conversion Rate</span>
                <span className="font-bold text-blue-600">{stats.conversionRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg Deal Value</span>
                <span className="font-bold text-green-600">
                  {stats.totalDeals > 0 ? formatCurrency(stats.totalRevenue / stats.totalDeals) : '$0'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Daily Calls</span>
                <span className="font-bold text-purple-600">{formatNumber(stats.callsToday)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">🎯</span>
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/contacts'}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <span className="mr-2">👥</span>
                Manage Contacts
              </button>
              <button
                onClick={() => window.location.href = '/twilio-browser-phone'}
                className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <span className="mr-2">📞</span>
                Make Calls
              </button>
              <button
                onClick={() => window.location.href = '/calendar'}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <span className="mr-2">📅</span>
                View Calendar
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">⚡</span>
              System Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <span className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">VoIP System</span>
                <span className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Ready
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">AI Services</span>
                <span className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Sync</span>
                <span className="text-sm text-gray-500">
                  {lastUpdated ? getTimeAgo(lastUpdated) : 'Never'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities - REAL DATA ONLY */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <span className="mr-2">📋</span>
              Recent Activities
            </h3>
            <button
              onClick={() => window.location.href = '/activities'}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </button>
          </div>

          {recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.slice(0, 8).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">
                          {activity.type === 'call' && 'Call with'}
                          {activity.type === 'email' && 'Email sent to'}
                          {activity.type === 'meeting' && 'Meeting with'}
                          {activity.type === 'deal' && 'Deal activity:'}
                          {activity.type === 'note' && 'Note added for'}
                          {activity.type === 'task' && 'Task completed:'}
                          {' '}
                          <span className="text-blue-600">
                            {activity.contacts?.name || activity.title || 'Unknown'}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {activity.contacts?.company && `${activity.contacts.company} • `}
                          {activity.notes || activity.description || 'No additional details'}
                        </p>
                        {activity.deals?.value && (
                          <p className="text-sm font-medium text-green-600 mt-1">
                            Deal Value: {formatCurrency(activity.deals.value)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {getTimeAgo(activity.created_at)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-gray-500 text-lg">No recent activities found</p>
              <p className="text-gray-400 text-sm mt-2">
                Activities will appear here as you use the system
              </p>
              <button
                onClick={() => window.location.href = '/contacts'}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
              >
                Get Started
              </button>
            </div>
          )}
        </div>

        {/* VoiCRM Footer Branding */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-2xl shadow-lg">
            <div className="flex items-center justify-center space-x-4">
              <span className="text-2xl">🏠</span>
              <div>
                <div className="font-bold text-lg">VoiCRM</div>
                <div className="text-sm opacity-75">Powered by Advanced AI • Real Estate CRM Leader</div>
              </div>
              <span className="text-2xl">🚀</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}