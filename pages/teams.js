import { useState } from 'react';
import Layout from '../components/Layout';

export default function Teams() {
  const [teams] = useState([
    {
      id: 1,
      name: 'Sales Team Alpha',
      lead: 'Sarah Johnson',
      members: 8,
      activeDeals: 23,
      monthlyGoal: 50,
      performance: 84.2,
      region: 'Downtown'
    },
    {
      id: 2,
      name: 'Listing Specialists',
      lead: 'Mike Chen',
      members: 5,
      activeDeals: 15,
      monthlyGoal: 30,
      performance: 76.8,
      region: 'Suburbs'
    },
    {
      id: 3,
      name: 'Investment Team',
      lead: 'Elena Rodriguez',
      members: 6,
      activeDeals: 18,
      monthlyGoal: 25,
      performance: 92.1,
      region: 'Commercial'
    }
  ]);

  const [teamMembers] = useState([
    { id: 1, name: 'Sarah Johnson', role: 'Team Lead', team: 'Sales Team Alpha', deals: 8, status: 'active' },
    { id: 2, name: 'David Park', role: 'Senior Agent', team: 'Sales Team Alpha', deals: 5, status: 'active' },
    { id: 3, name: 'Mike Chen', role: 'Team Lead', team: 'Listing Specialists', deals: 6, status: 'active' },
    { id: 4, name: 'Anna Walsh', role: 'Agent', team: 'Listing Specialists', deals: 3, status: 'active' },
    { id: 5, name: 'Elena Rodriguez', role: 'Team Lead', team: 'Investment Team', deals: 7, status: 'active' }
  ]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
                Team Management
              </h1>
              <p className="text-[#7a7a7a] mt-2">Manage teams, track performance, and assign territories</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-[#864936] text-white px-4 py-2 rounded-lg hover:bg-[#9a5441] transition-colors">
                + Add Member
              </button>
              <button className="bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#7a8365] transition-colors">
                + Create Team
              </button>
            </div>
          </div>
        </div>

        {/* Team Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Teams</p>
            <p className="text-2xl font-bold text-[#636B56]">{teams.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Members</p>
            <p className="text-2xl font-bold text-[#636B56]">{teamMembers.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Active Deals</p>
            <p className="text-2xl font-bold text-[#636B56]">{teams.reduce((sum, team) => sum + team.activeDeals, 0)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Avg Performance</p>
            <p className="text-2xl font-bold text-[#636B56]">
              {(teams.reduce((sum, team) => sum + team.performance, 0) / teams.length).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Teams Grid */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Teams Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map(team => (
              <div key={team.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg text-[#636B56]">{team.name}</h3>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">{team.region}</span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Team Lead:</span>
                    <span className="text-sm font-medium">{team.lead}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Members:</span>
                    <span className="text-sm font-medium">{team.members}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Deals:</span>
                    <span className="text-sm font-medium">{team.activeDeals}</span>
                  </div>
                </div>

                {/* Performance Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Monthly Goal Progress</span>
                    <span>{team.performance}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#636B56] h-2 rounded-full" 
                      style={{ width: `${Math.min(team.performance, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {team.activeDeals} of {team.monthlyGoal} deals
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 text-sm px-3 py-1 border border-[#636B56] text-[#636B56] rounded hover:bg-[#636B56] hover:text-white transition-colors">
                    View Details
                  </button>
                  <button className="text-sm px-3 py-1 border border-gray-300 text-gray-600 rounded hover:bg-gray-100 transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Members Table */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Team Members</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Team</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Active Deals</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map(member => (
                  <tr key={member.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{member.name}</td>
                    <td className="py-3 px-4 text-gray-600">{member.role}</td>
                    <td className="py-3 px-4 text-gray-600">{member.team}</td>
                    <td className="py-3 px-4 text-center">{member.deals}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        {member.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button className="text-xs px-2 py-1 border border-[#636B56] text-[#636B56] rounded hover:bg-[#636B56] hover:text-white transition-colors">
                          Edit
                        </button>
                        <button className="text-xs px-2 py-1 border border-gray-300 text-gray-600 rounded hover:bg-gray-100 transition-colors">
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}