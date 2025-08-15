import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

export default function Pipeline() {
  const [deals, setDeals] = useState([]);
  const [stages, setStages] = useState([
    { id: 'lead', name: 'Lead', color: 'bg-gray-500', deals: [], value: 0 },
    { id: 'qualified', name: 'Qualified', color: 'bg-blue-500', deals: [], value: 0 },
    { id: 'proposal', name: 'Proposal', color: 'bg-yellow-500', deals: [], value: 0 },
    { id: 'negotiation', name: 'Negotiation', color: 'bg-purple-500', deals: [], value: 0 },
    { id: 'closed', name: 'Closed Won', color: 'bg-green-500', deals: [], value: 0 }
  ]);
  const [draggedDeal, setDraggedDeal] = useState(null);
  const [stats, setStats] = useState({
    totalValue: 0,
    avgDealSize: 0,
    conversionRate: 0,
    avgCycleTime: 0
  });

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    try {
      const res = await fetch('/api/contacts');
      const contacts = await res.json();
      
      // Convert contacts to deals
      const dealData = contacts.slice(0, 30).map((contact, idx) => ({
        id: contact.id || idx,
        name: contact.name,
        company: contact.company || 'Unknown Company',
        value: Math.floor(Math.random() * 100000) + 5000,
        stage: ['lead', 'qualified', 'proposal', 'negotiation', 'closed'][Math.floor(Math.random() * 5)],
        probability: [20, 40, 60, 80, 100][Math.floor(Math.random() * 5)],
        owner: contact.owner || 'John Smith',
        daysInStage: Math.floor(Math.random() * 30),
        nextAction: ['Call', 'Email', 'Meeting', 'Proposal', 'Contract'][Math.floor(Math.random() * 5)],
        lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      }));
      
      setDeals(dealData);
      updateStages(dealData);
      calculateStats(dealData);
    } catch (error) {
      console.error('Error loading deals:', error);
      // Generate sample data if API fails
      generateSampleDeals();
    }
  };

  const generateSampleDeals = () => {
    const sampleDeals = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Deal ${i + 1}`,
      company: `Company ${String.fromCharCode(65 + i % 26)}`,
      value: Math.floor(Math.random() * 100000) + 5000,
      stage: ['lead', 'qualified', 'proposal', 'negotiation', 'closed'][Math.floor(Math.random() * 5)],
      probability: [20, 40, 60, 80, 100][Math.floor(Math.random() * 5)],
      owner: ['John Smith', 'Jane Doe', 'Mike Johnson'][Math.floor(Math.random() * 3)],
      daysInStage: Math.floor(Math.random() * 30),
      nextAction: ['Call', 'Email', 'Meeting', 'Proposal', 'Contract'][Math.floor(Math.random() * 5)],
      lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));
    
    setDeals(sampleDeals);
    updateStages(sampleDeals);
    calculateStats(sampleDeals);
  };

  const updateStages = (dealData) => {
    const updatedStages = stages.map(stage => {
      const stageDeals = dealData.filter(d => d.stage === stage.id);
      const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
      return { ...stage, deals: stageDeals, value: stageValue };
    });
    setStages(updatedStages);
  };

  const calculateStats = (dealData) => {
    const totalValue = dealData.reduce((sum, d) => sum + d.value, 0);
    const avgDealSize = dealData.length > 0 ? totalValue / dealData.length : 0;
    const closedDeals = dealData.filter(d => d.stage === 'closed').length;
    const conversionRate = dealData.length > 0 ? (closedDeals / dealData.length) * 100 : 0;
    const avgCycleTime = dealData.reduce((sum, d) => sum + d.daysInStage, 0) / (dealData.length || 1);
    
    setStats({
      totalValue,
      avgDealSize,
      conversionRate,
      avgCycleTime
    });
  };

  const handleDragStart = (e, deal) => {
    setDraggedDeal(deal);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newStage) => {
    e.preventDefault();
    if (draggedDeal) {
      const updatedDeals = deals.map(d => 
        d.id === draggedDeal.id ? { ...d, stage: newStage } : d
      );
      setDeals(updatedDeals);
      updateStages(updatedDeals);
      calculateStats(updatedDeals);
      setDraggedDeal(null);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case 'Call': return '📞';
      case 'Email': return '✉️';
      case 'Meeting': return '👥';
      case 'Proposal': return '📄';
      case 'Contract': return '📝';
      default: return '📋';
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Pipeline</h1>
          <p className="text-gray-600">Drag and drop deals to move them through stages</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Pipeline Value</span>
              <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
            <p className="text-xs text-gray-500 mt-1">Across all stages</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Avg Deal Size</span>
              <ChartBarIcon className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.avgDealSize)}</p>
            <p className="text-xs text-gray-500 mt-1">Per opportunity</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <ArrowUpIcon className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">Lead to close</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Avg Cycle Time</span>
              <ClockIcon className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{Math.round(stats.avgCycleTime)} days</p>
            <p className="text-xs text-gray-500 mt-1">Time in stage</p>
          </div>
        </div>

        {/* Pipeline Stages */}
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-4">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className="flex-1 min-w-[300px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {/* Stage Header */}
                <div className={`${stage.color} text-white rounded-t-lg p-3`}>
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{stage.name}</h3>
                    <span className="bg-white/20 px-2 py-1 rounded text-sm">
                      {stage.deals.length} deals
                    </span>
                  </div>
                  <p className="text-sm opacity-90 mt-1">
                    {formatCurrency(stage.value)}
                  </p>
                </div>

                {/* Stage Content */}
                <div className="bg-gray-100 min-h-[400px] p-2 space-y-2 rounded-b-lg">
                  {stage.deals.map((deal) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal)}
                      className="bg-white rounded-lg p-3 shadow hover:shadow-md transition-shadow cursor-move"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm">{deal.name}</h4>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {deal.probability}%
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-2">{deal.company}</p>
                      
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(deal.value)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {deal.daysInStage}d
                        </span>
                      </div>

                      <div className="border-t pt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{deal.owner}</span>
                          <span className="flex items-center gap-1">
                            {getActivityIcon(deal.nextAction)} {deal.nextAction}
                          </span>
                        </div>
                      </div>

                      {deal.daysInStage > 20 && (
                        <div className="mt-2 flex items-center text-xs text-orange-600">
                          <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                          Aging deal
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Add New Deal
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Export Pipeline
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Pipeline Settings
          </button>
        </div>
      </div>
    </Layout>
  );
}