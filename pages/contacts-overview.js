// Contacts Overview Dashboard
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  UserGroupIcon,
  PhoneIcon,
  CalendarIcon,
  BriefcaseIcon,
  TagIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function ContactsOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/migrate/direct-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status' })
      });
      const result = await response.json();
      setData(result);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#636B56]"></div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-[#7a7a7a]">No data available</p>
        </div>
      </Layout>
    );
  }

  // Calculate percentages
  const withActivityPercent = Math.round((data.withNextActivity / data.totalImported) * 100);
  const withDealsPercent = Math.round((data.withOpenDeals / data.totalImported) * 100);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
            PipeDrive Import Complete! 🎉
          </h1>
          <p className="text-xl text-[#864936] mt-2" style={{ fontFamily: 'Avenir, sans-serif' }}>
            Successfully imported all contacts with complete data
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Contacts */}
          <div className="bg-white rounded-xl p-6 border-2 border-[#636B56]/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <UserGroupIcon className="h-10 w-10 text-[#636B56]" />
              <span className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
                {data.totalImported.toLocaleString()}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-[#1a1a1a]">Total Contacts</h3>
            <p className="text-sm text-[#7a7a7a] mt-1">All successfully imported</p>
          </div>

          {/* With Next Activity */}
          <div className="bg-white rounded-xl p-6 border-2 border-[#B28354]/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <CalendarIcon className="h-10 w-10 text-[#B28354]" />
              <span className="text-3xl font-bold text-[#B28354]" style={{ fontFamily: 'Forum, serif' }}>
                {data.withNextActivity.toLocaleString()}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-[#1a1a1a]">Scheduled Activities</h3>
            <p className="text-sm text-[#7a7a7a] mt-1">{withActivityPercent}% have follow-ups</p>
          </div>

          {/* Open Deals */}
          <div className="bg-white rounded-xl p-6 border-2 border-[#864936]/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <BriefcaseIcon className="h-10 w-10 text-[#864936]" />
              <span className="text-3xl font-bold text-[#864936]" style={{ fontFamily: 'Forum, serif' }}>
                {data.withOpenDeals}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-[#1a1a1a]">Active Deals</h3>
            <p className="text-sm text-[#7a7a7a] mt-1">{withDealsPercent}% have open deals</p>
          </div>

          {/* Unique Labels */}
          <div className="bg-white rounded-xl p-6 border-2 border-[#636B56]/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <TagIcon className="h-10 w-10 text-[#636B56]" />
              <span className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
                {data.labels.length}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-[#1a1a1a]">Unique Labels</h3>
            <p className="text-sm text-[#7a7a7a] mt-1">For categorization</p>
          </div>
        </div>

        {/* Agent Distribution */}
        <div className="bg-white rounded-xl p-8 border border-[#B28354]/20 shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-[#636B56] mb-6" style={{ fontFamily: 'Forum, serif' }}>
            Agent Ownership Distribution
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(data.agents).map(([agent, count]) => {
              const percentage = Math.round((count / data.totalImported) * 100);
              return (
                <div key={agent} className="bg-[#F8F2E7] rounded-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[#1a1a1a]">{agent}</h3>
                    <span className="text-2xl font-bold text-[#636B56]">{percentage}%</span>
                  </div>
                  <div className="text-3xl font-bold text-[#864936]" style={{ fontFamily: 'Forum, serif' }}>
                    {count.toLocaleString()}
                  </div>
                  <div className="mt-3 h-2 bg-[#F8F2E7] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#636B56] to-[#864936] rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#7a7a7a] mt-2">contacts owned</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sample Contacts */}
        <div className="bg-white rounded-xl p-8 border border-[#B28354]/20 shadow-lg">
          <h2 className="text-2xl font-bold text-[#636B56] mb-6" style={{ fontFamily: 'Forum, serif' }}>
            Sample Imported Contacts
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#636B56]/20">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#4a4a4a]">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#4a4a4a]">Owner</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#4a4a4a]">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#4a4a4a]">Next Activity</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#4a4a4a]">Activities</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#4a4a4a]">Deals</th>
                </tr>
              </thead>
              <tbody>
                {data.sample.slice(0, 10).map((contact, index) => (
                  <tr key={contact.id} className="border-b border-[#F8F2E7] hover:bg-[#F8F2E7]/50 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-[#1a1a1a]">{contact.name}</p>
                        {contact.organization && (
                          <p className="text-xs text-[#7a7a7a]">{contact.organization}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-[#636B56] font-medium">{contact.owner_name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-[#4a4a4a]">{contact.phone || '-'}</span>
                    </td>
                    <td className="py-3 px-4">
                      {contact.next_activity?.date ? (
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-[#B28354]" />
                          <span className="text-sm text-[#864936] font-medium">
                            {new Date(contact.next_activity.date).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-[#7a7a7a]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <CheckCircleIcon className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{contact.done_activities}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm">{contact.undone_activities}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {contact.open_deals > 0 ? (
                        <span className="px-2 py-1 bg-[#636B56]/10 text-[#636B56] rounded-full text-xs font-medium">
                          {contact.open_deals} open
                        </span>
                      ) : (
                        <span className="text-sm text-[#7a7a7a]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button 
            onClick={() => window.location.href = '/contacts'}
            className="px-6 py-3 bg-gradient-to-r from-[#636B56] to-[#864936] text-[#F8F2E7] rounded-lg font-medium hover:shadow-lg transition-all"
          >
            View All Contacts
          </button>
          <button 
            onClick={() => window.location.href = '/phone'}
            className="px-6 py-3 bg-[#B28354] text-[#F8F2E7] rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Start Calling
          </button>
          <button 
            onClick={() => fetchData()}
            className="px-6 py-3 bg-white border-2 border-[#636B56] text-[#636B56] rounded-lg font-medium hover:bg-[#636B56]/5 transition-all"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </Layout>
  );
}