import { useState } from 'react';
import Layout from '../../components/Layout';

export default function UserManagement() {
  const [users, setUsers] = useState([
    { id: 1, name: 'John Smith', email: 'john@company.com', role: 'Admin', status: 'Active', lastLogin: '2 hours ago' },
    { id: 2, name: 'Sarah Wilson', email: 'sarah@company.com', role: 'Agent', status: 'Active', lastLogin: '5 minutes ago' },
    { id: 3, name: 'Michael Chen', email: 'michael@company.com', role: 'Agent', status: 'Active', lastLogin: 'Yesterday' },
    { id: 4, name: 'Emma Thompson', email: 'emma@company.com', role: 'Manager', status: 'Active', lastLogin: '3 days ago' },
    { id: 5, name: 'David Brown', email: 'david@company.com', role: 'Agent', status: 'Inactive', lastLogin: '1 week ago' },
  ]);

  const [showNewUserModal, setShowNewUserModal] = useState(false);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
                User Management
              </h1>
              <p className="text-[#7a7a7a] mt-2">Manage team members and their access levels</p>
            </div>
            <button 
              onClick={() => setShowNewUserModal(true)}
              className="bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#7a8365] transition-colors"
            >
              + Add User
            </button>
          </div>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold text-[#636B56]">5</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Active Users</p>
            <p className="text-2xl font-bold text-[#636B56]">4</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Managers</p>
            <p className="text-2xl font-bold text-[#636B56]">2</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Agents</p>
            <p className="text-2xl font-bold text-[#636B56]">3</p>
          </div>
        </div>

        {/* User List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Team Members</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Name</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Role</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Last Login</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-[#636B56] text-white flex items-center justify-center text-sm mr-3">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600">{user.email}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'Manager' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600">{user.lastLogin}</td>
                    <td className="py-3 px-2">
                      <div className="flex gap-2">
                        <button className="text-sm text-[#636B56] hover:underline">Edit</button>
                        <button className="text-sm text-gray-600 hover:underline">Reset Password</button>
                        <button className="text-sm text-red-600 hover:underline">Remove</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Permissions Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Role Permissions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3 text-purple-800">Admin</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Full system access</li>
                <li>✓ User management</li>
                <li>✓ Company settings</li>
                <li>✓ Billing & payments</li>
                <li>✓ All reports</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3 text-blue-800">Manager</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Team management</li>
                <li>✓ Create user profiles</li>
                <li>✓ View all team data</li>
                <li>✓ Assign leads</li>
                <li>✓ Performance reports</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3 text-gray-800">Agent</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Own contacts & leads</li>
                <li>✓ Make calls & send messages</li>
                <li>✓ View assigned properties</li>
                <li>✓ Personal reports</li>
                <li>✗ Cannot manage users</li>
              </ul>
            </div>
          </div>
        </div>

        {/* New User Modal */}
        {showNewUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-[#636B56] mb-4">Add New User</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent">
                    <option>Agent</option>
                    <option>Manager</option>
                    <option>Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="send-invite" className="mr-2" />
                  <label htmlFor="send-invite" className="text-sm text-gray-700">
                    Send invitation email to set up account
                  </label>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setShowNewUserModal(false)}
                    className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button className="flex-1 bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#7a8365] transition-colors">
                    Create User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}