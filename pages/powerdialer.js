// PowerDialer Campaign Management Page
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  PhoneIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  CogIcon,
  SparklesIcon,
  BoltIcon,
  EyeIcon,
  ChartPieIcon,
  PhoneArrowDownLeftIcon
} from '@heroicons/react/24/outline';

export default function PowerDialer() {
  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [statistics, setStatistics] = useState(null);
  
  // Dialing modes
  const dialingModes = {
    preview: { name: 'Preview', icon: <EyeIcon className="h-5 w-5" />, description: 'Review contact before dialing' },
    progressive: { name: 'Progressive', icon: <ArrowPathIcon className="h-5 w-5" />, description: 'Auto-dial when agent ready' },
    predictive: { name: 'Predictive', icon: <SparklesIcon className="h-5 w-5" />, description: 'AI-optimized multi-line dialing' },
    power: { name: 'Power', icon: <BoltIcon className="h-5 w-5" />, description: 'Rapid sequential dialing' }
  };

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    mode: 'progressive',
    targetCalls: 100,
    targetConnects: 30,
    targetAppointments: 5,
    startTime: '09:00',
    endTime: '18:00',
    filters: {
      hasPhone: true,
      lastContactDays: 14,
      priority: 'all'
    }
  });

  useEffect(() => {
    fetchCampaigns();
    checkForCallbacksToLoad();
    const interval = setInterval(fetchCampaigns, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const checkForCallbacksToLoad = () => {
    // Check if we have callbacks from the calendar to load
    const callbacksFromCalendar = sessionStorage.getItem('speedDialerContacts');
    if (callbacksFromCalendar) {
      const callbacks = JSON.parse(callbacksFromCalendar);
      if (callbacks && callbacks.length > 0) {
        // Create a campaign from today's callbacks
        createCampaignFromCallbacks(callbacks);
        sessionStorage.removeItem('speedDialerContacts'); // Clear after loading
      }
    }
  };

  const createCampaignFromCallbacks = async (callbacks) => {
    try {
      const response = await fetch('/api/powerdialer/create-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Today's Callbacks - ${new Date().toLocaleDateString()}`,
          mode: 'preview',
          targetCalls: callbacks.length,
          targetConnects: Math.ceil(callbacks.length * 0.3),
          targetAppointments: Math.ceil(callbacks.length * 0.1),
          startTime: '09:00',
          endTime: '18:00',
          contacts: callbacks,
          agentId: 'agent_1',
          isCallbackCampaign: true
        })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchCampaigns();
        // Auto-start the campaign
        setTimeout(() => startCampaign(data.campaign.id), 1000);
      }
    } catch (error) {
      console.error('Error creating callback campaign:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/powerdialer/list');
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.campaigns);
        
        // Update active campaign stats
        const active = data.campaigns.find(c => c.status === 'active');
        if (active) {
          setActiveCampaign(active);
          setStatistics(active.statistics);
        }
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const createCampaign = async () => {
    setIsCreating(true);
    
    try {
      // Get contacts from imported data
      const contactsResponse = await fetch('/api/migrate/direct-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export' })
      });
      const contactsData = await contactsResponse.json();
      
      // Create campaign
      const response = await fetch('/api/powerdialer/create-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCampaign,
          contacts: contactsData.data?.slice(0, newCampaign.targetCalls) || [],
          agentId: 'agent_1'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setShowCreateModal(false);
        fetchCampaigns();
        setNewCampaign({
          name: '',
          mode: 'progressive',
          targetCalls: 100,
          targetConnects: 30,
          targetAppointments: 5,
          startTime: '09:00',
          endTime: '18:00',
          filters: { hasPhone: true, lastContactDays: 14, priority: 'all' }
        });
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const startCampaign = async (campaignId) => {
    try {
      const response = await fetch('/api/powerdialer/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          agentDevice: 'browser' // or actual device token
        })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Error starting campaign:', error);
    }
  };

  const pauseCampaign = async (campaignId) => {
    try {
      const response = await fetch('/api/powerdialer/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId })
      });
      
      if (response.ok) {
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Error pausing campaign:', error);
    }
  };

  const resumeCampaign = async (campaignId) => {
    try {
      const response = await fetch('/api/powerdialer/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId })
      });
      
      if (response.ok) {
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Error resuming campaign:', error);
    }
  };

  const completeCampaign = async (campaignId) => {
    try {
      const response = await fetch('/api/powerdialer/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId })
      });
      
      if (response.ok) {
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Error completing campaign:', error);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PhoneIcon className="h-10 w-10 text-[#636B56]" />
              <div>
                <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
                  PowerDialer
                </h1>
                <p className="text-[#7a7a7a]">Automated high-volume calling campaigns</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-[#636B56] to-[#864936] text-white rounded-lg font-bold hover:shadow-lg transition-all"
            >
              Create Campaign
            </button>
          </div>
        </div>

        {/* Active Campaign Dashboard */}
        {activeCampaign && (
          <div className="bg-white rounded-xl p-6 border border-[#B28354]/20 shadow-lg mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#636B56]">{activeCampaign.name}</h2>
                <div className="flex items-center gap-4 mt-2">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Active
                  </span>
                  <span className="text-sm text-[#7a7a7a]">
                    Mode: {dialingModes[activeCampaign.mode]?.name}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => pauseCampaign(activeCampaign.id)}
                  className="p-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  <PauseIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => completeCampaign(activeCampaign.id)}
                  className="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <StopIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Live Statistics */}
            {statistics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#F8F2E7] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#7a7a7a]">Total Dialed</span>
                    <PhoneIcon className="h-5 w-5 text-[#636B56]" />
                  </div>
                  <p className="text-2xl font-bold text-[#636B56]">{statistics.totalDialed}</p>
                  <div className="mt-2 h-2 bg-white rounded-full">
                    <div 
                      className="h-full bg-[#636B56] rounded-full transition-all"
                      style={{ width: `${(statistics.totalDialed / activeCampaign.goals?.target) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="bg-[#F8F2E7] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#7a7a7a]">Connected</span>
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{statistics.connected}</p>
                  <p className="text-xs text-[#7a7a7a] mt-1">
                    {statistics.conversionRate?.toFixed(1)}% connect rate
                  </p>
                </div>

                <div className="bg-[#F8F2E7] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#7a7a7a]">Voicemails</span>
                    <PhoneArrowDownLeftIcon className="h-5 w-5 text-[#864936]" />
                  </div>
                  <p className="text-2xl font-bold text-[#864936]">{statistics.voicemails}</p>
                </div>

                <div className="bg-[#F8F2E7] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#7a7a7a]">Avg Duration</span>
                    <ClockIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(statistics.avgCallDuration)}s
                  </p>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-[#7a7a7a] mb-2">
                <span>Campaign Progress</span>
                <span>{Math.round((statistics?.totalDialed / activeCampaign.goals?.target) * 100)}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-gradient-to-r from-[#636B56] to-[#864936] rounded-full transition-all"
                  style={{ width: `${(statistics?.totalDialed / activeCampaign.goals?.target) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Campaign List */}
        <div className="bg-white rounded-xl border border-[#B28354]/20 shadow-lg">
          <div className="p-6 border-b border-[#B28354]/20">
            <h2 className="text-xl font-bold text-[#636B56]">All Campaigns</h2>
          </div>
          
          <div className="p-6">
            {campaigns.length === 0 ? (
              <div className="text-center py-12">
                <UserGroupIcon className="h-16 w-16 text-[#7a7a7a] mx-auto mb-4" />
                <p className="text-[#7a7a7a]">No campaigns created yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-6 py-2 bg-[#636B56] text-white rounded-lg hover:bg-[#636B56]/90 transition-colors"
                >
                  Create Your First Campaign
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="border border-[#B28354]/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-[#1a1a1a]">{campaign.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                            campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                            campaign.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {campaign.status}
                          </span>
                          <div className="flex items-center gap-1 text-sm text-[#7a7a7a]">
                            {dialingModes[campaign.mode]?.icon}
                            <span>{dialingModes[campaign.mode]?.name}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 mt-2 text-sm text-[#7a7a7a]">
                          <span>📞 {campaign.statistics.totalDialed} dialed</span>
                          <span>✅ {campaign.statistics.connected} connected</span>
                          <span>📊 {campaign.statistics.conversionRate?.toFixed(1)}% rate</span>
                          <span>👥 {campaign.totalContacts} contacts</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {campaign.status === 'created' && (
                          <button
                            onClick={() => startCampaign(campaign.id)}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            <PlayIcon className="h-5 w-5" />
                          </button>
                        )}
                        {campaign.status === 'active' && (
                          <button
                            onClick={() => pauseCampaign(campaign.id)}
                            className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                          >
                            <PauseIcon className="h-5 w-5" />
                          </button>
                        )}
                        {campaign.status === 'paused' && (
                          <button
                            onClick={() => resumeCampaign(campaign.id)}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            <PlayIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button className="p-2 bg-[#636B56] text-white rounded-lg hover:bg-[#636B56]/90 transition-colors">
                          <ChartBarIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Campaign Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-[#636B56] mb-6">Create PowerDialer Campaign</h2>
              
              <div className="space-y-6">
                {/* Campaign Name */}
                <div>
                  <label className="block text-sm font-medium text-[#4a4a4a] mb-2">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                    className="w-full px-4 py-2 border border-[#B28354]/30 rounded-lg focus:outline-none focus:border-[#636B56]"
                    placeholder="e.g., Gregory Hills Follow-up"
                  />
                </div>

                {/* Dialing Mode */}
                <div>
                  <label className="block text-sm font-medium text-[#4a4a4a] mb-2">
                    Dialing Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(dialingModes).map(([key, mode]) => (
                      <button
                        key={key}
                        onClick={() => setNewCampaign({...newCampaign, mode: key})}
                        className={`p-3 border rounded-lg transition-all ${
                          newCampaign.mode === key 
                            ? 'border-[#636B56] bg-[#636B56]/10' 
                            : 'border-gray-200 hover:border-[#B28354]'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {mode.icon}
                          <span className="font-medium">{mode.name}</span>
                        </div>
                        <p className="text-xs text-[#7a7a7a] text-left">{mode.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Goals */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4a4a4a] mb-2">
                      Target Calls
                    </label>
                    <input
                      type="number"
                      value={newCampaign.targetCalls}
                      onChange={(e) => setNewCampaign({...newCampaign, targetCalls: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-[#B28354]/30 rounded-lg focus:outline-none focus:border-[#636B56]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4a4a4a] mb-2">
                      Target Connects
                    </label>
                    <input
                      type="number"
                      value={newCampaign.targetConnects}
                      onChange={(e) => setNewCampaign({...newCampaign, targetConnects: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-[#B28354]/30 rounded-lg focus:outline-none focus:border-[#636B56]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4a4a4a] mb-2">
                      Target Appointments
                    </label>
                    <input
                      type="number"
                      value={newCampaign.targetAppointments}
                      onChange={(e) => setNewCampaign({...newCampaign, targetAppointments: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-[#B28354]/30 rounded-lg focus:outline-none focus:border-[#636B56]"
                    />
                  </div>
                </div>

                {/* Schedule */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4a4a4a] mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={newCampaign.startTime}
                      onChange={(e) => setNewCampaign({...newCampaign, startTime: e.target.value})}
                      className="w-full px-4 py-2 border border-[#B28354]/30 rounded-lg focus:outline-none focus:border-[#636B56]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4a4a4a] mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={newCampaign.endTime}
                      onChange={(e) => setNewCampaign({...newCampaign, endTime: e.target.value})}
                      className="w-full px-4 py-2 border border-[#B28354]/30 rounded-lg focus:outline-none focus:border-[#636B56]"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div>
                  <label className="block text-sm font-medium text-[#4a4a4a] mb-2">
                    Contact Filters
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newCampaign.filters.hasPhone}
                        onChange={(e) => setNewCampaign({
                          ...newCampaign,
                          filters: {...newCampaign.filters, hasPhone: e.target.checked}
                        })}
                        className="rounded text-[#636B56]"
                      />
                      <span className="text-sm">Has phone number</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Last contact more than</span>
                      <input
                        type="number"
                        value={newCampaign.filters.lastContactDays}
                        onChange={(e) => setNewCampaign({
                          ...newCampaign,
                          filters: {...newCampaign.filters, lastContactDays: parseInt(e.target.value)}
                        })}
                        className="w-20 px-2 py-1 border border-[#B28354]/30 rounded"
                      />
                      <span className="text-sm">days ago</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 border border-[#636B56] text-[#636B56] rounded-lg hover:bg-[#636B56]/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createCampaign}
                  disabled={!newCampaign.name || isCreating}
                  className="px-6 py-2 bg-gradient-to-r from-[#636B56] to-[#864936] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}