import { useState, useEffect } from 'react';
import { 
  FunnelIcon, 
  BookmarkIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  CalendarIcon,
  UserGroupIcon,
  PhoneIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

export default function AnalyticsFilters({ onFilterChange, onSaveView }) {
  const [filters, setFilters] = useState({
    dateRange: 'week',
    metric: 'all',
    leadStatus: 'all',
    agent: 'all',
    source: 'all',
    minValue: 0,
    maxValue: null,
    conversionRate: 'all',
    customDateStart: null,
    customDateEnd: null
  });

  const [savedViews, setSavedViews] = useState([]);
  const [viewName, setViewName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    // Load saved views from localStorage
    const saved = localStorage.getItem('analyticsViews');
    if (saved) {
      setSavedViews(JSON.parse(saved));
    }
  }, []);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const saveCurrentView = () => {
    if (!viewName.trim()) return;

    const newView = {
      id: Date.now(),
      name: viewName,
      filters: { ...filters },
      createdAt: new Date().toISOString()
    };

    const updatedViews = [...savedViews, newView];
    setSavedViews(updatedViews);
    localStorage.setItem('analyticsViews', JSON.stringify(updatedViews));
    
    setViewName('');
    setShowSaveDialog(false);
    
    if (onSaveView) {
      onSaveView(newView);
    }
  };

  const loadSavedView = (view) => {
    setFilters(view.filters);
    onFilterChange(view.filters);
  };

  const deleteSavedView = (viewId) => {
    const updatedViews = savedViews.filter(v => v.id !== viewId);
    setSavedViews(updatedViews);
    localStorage.setItem('analyticsViews', JSON.stringify(updatedViews));
  };

  const resetFilters = () => {
    const defaultFilters = {
      dateRange: 'week',
      metric: 'all',
      leadStatus: 'all',
      agent: 'all',
      source: 'all',
      minValue: 0,
      maxValue: null,
      conversionRate: 'all',
      customDateStart: null,
      customDateEnd: null
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  // Predefined filter templates
  const filterTemplates = [
    {
      name: 'High Value Leads',
      icon: CurrencyDollarIcon,
      filters: {
        ...filters,
        leadStatus: 'hot',
        minValue: 100000,
        conversionRate: 'high'
      }
    },
    {
      name: 'Recent Activity',
      icon: CalendarIcon,
      filters: {
        ...filters,
        dateRange: 'today',
        metric: 'calls'
      }
    },
    {
      name: 'Team Performance',
      icon: UserGroupIcon,
      filters: {
        ...filters,
        metric: 'agents',
        dateRange: 'month'
      }
    },
    {
      name: 'Conversion Focus',
      icon: ChartBarIcon,
      filters: {
        ...filters,
        conversionRate: 'high',
        leadStatus: 'warm'
      }
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6" style={{ backgroundColor: '#F8F2E7' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5" style={{ color: '#636B56' }} />
          <h3 className="text-lg font-semibold" style={{ color: '#864936' }}>
            Analytics Filters
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSaveDialog(true)}
            className="px-3 py-1 bg-white border rounded-lg hover:bg-gray-50 flex items-center gap-2"
            style={{ borderColor: '#B28354' }}
          >
            <BookmarkIcon className="h-4 w-4" />
            Save View
          </button>
          <button
            onClick={resetFilters}
            className="px-3 py-1 text-gray-600 hover:text-gray-800"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Quick Templates */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-3">Quick Templates</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {filterTemplates.map((template, idx) => (
            <button
              key={idx}
              onClick={() => {
                setFilters(template.filters);
                onFilterChange(template.filters);
              }}
              className="p-3 border rounded-lg hover:bg-white transition-colors flex flex-col items-center gap-2"
              style={{ borderColor: '#B28354' }}
            >
              <template.icon className="h-5 w-5" style={{ color: '#636B56' }} />
              <span className="text-xs">{template.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date Range
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
            style={{ borderColor: '#B28354', focusRingColor: '#636B56' }}
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* Metric Focus */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Metric Focus
          </label>
          <select
            value={filters.metric}
            onChange={(e) => handleFilterChange('metric', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
            style={{ borderColor: '#B28354' }}
          >
            <option value="all">All Metrics</option>
            <option value="calls">Calls</option>
            <option value="conversions">Conversions</option>
            <option value="revenue">Revenue</option>
            <option value="activities">Activities</option>
            <option value="agents">Agent Performance</option>
          </select>
        </div>

        {/* Lead Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lead Status
          </label>
          <select
            value={filters.leadStatus}
            onChange={(e) => handleFilterChange('leadStatus', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
            style={{ borderColor: '#B28354' }}
          >
            <option value="all">All Leads</option>
            <option value="hot">Hot Leads</option>
            <option value="warm">Warm Leads</option>
            <option value="cold">Cold Leads</option>
            <option value="new">New Leads</option>
          </select>
        </div>

        {/* Lead Source */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lead Source
          </label>
          <select
            value={filters.source}
            onChange={(e) => handleFilterChange('source', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
            style={{ borderColor: '#B28354' }}
          >
            <option value="all">All Sources</option>
            <option value="website">Website</option>
            <option value="referral">Referral</option>
            <option value="cold-call">Cold Call</option>
            <option value="email">Email Campaign</option>
            <option value="social">Social Media</option>
            <option value="open-house">Open House</option>
          </select>
        </div>

        {/* Conversion Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Conversion Rate
          </label>
          <select
            value={filters.conversionRate}
            onChange={(e) => handleFilterChange('conversionRate', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
            style={{ borderColor: '#B28354' }}
          >
            <option value="all">All Rates</option>
            <option value="high">High (>70%)</option>
            <option value="medium">Medium (40-70%)</option>
            <option value="low">Low (<40%)</option>
          </select>
        </div>

        {/* Min Value */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Deal Value
          </label>
          <input
            type="number"
            value={filters.minValue}
            onChange={(e) => handleFilterChange('minValue', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
            style={{ borderColor: '#B28354' }}
            placeholder="$0"
          />
        </div>

        {/* Max Value */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Deal Value
          </label>
          <input
            type="number"
            value={filters.maxValue || ''}
            onChange={(e) => handleFilterChange('maxValue', parseInt(e.target.value) || null)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
            style={{ borderColor: '#B28354' }}
            placeholder="No limit"
          />
        </div>

        {/* Agent Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Agent
          </label>
          <select
            value={filters.agent}
            onChange={(e) => handleFilterChange('agent', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
            style={{ borderColor: '#B28354' }}
          >
            <option value="all">All Agents</option>
            <option value="me">Me</option>
            <option value="team">My Team</option>
          </select>
        </div>
      </div>

      {/* Custom Date Range */}
      {filters.dateRange === 'custom' && (
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-white rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.customDateStart || ''}
              onChange={(e) => handleFilterChange('customDateStart', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              style={{ borderColor: '#B28354' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.customDateEnd || ''}
              onChange={(e) => handleFilterChange('customDateEnd', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              style={{ borderColor: '#B28354' }}
            />
          </div>
        </div>
      )}

      {/* Saved Views */}
      {savedViews.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Saved Views</p>
          <div className="flex flex-wrap gap-2">
            {savedViews.map(view => (
              <div
                key={view.id}
                className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg group"
                style={{ borderColor: '#B28354' }}
              >
                <button
                  onClick={() => loadSavedView(view)}
                  className="text-sm hover:underline"
                  style={{ color: '#636B56' }}
                >
                  {view.name}
                </button>
                <button
                  onClick={() => deleteSavedView(view.id)}
                  className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save View Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#864936' }}>
              Save Current View
            </h3>
            <input
              type="text"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              placeholder="Enter view name..."
              className="w-full px-4 py-2 border rounded-lg mb-4"
              style={{ borderColor: '#B28354' }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={saveCurrentView}
                className="px-4 py-2 text-white rounded-lg"
                style={{ backgroundColor: '#636B56' }}
                disabled={!viewName.trim()}
              >
                Save View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}