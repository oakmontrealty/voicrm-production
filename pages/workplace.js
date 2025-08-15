import { useState } from 'react';
import Layout from '../components/Layout';

export default function Workplace() {
  const [teamMembers] = useState([
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Senior Real Estate Agent',
      status: 'online',
      location: 'Downtown Office',
      activeDeals: 5,
      lastActivity: '5 minutes ago',
      avatar: '👩‍💼'
    },
    {
      id: 2,
      name: 'Mike Chen',
      role: 'Listing Specialist',
      status: 'busy',
      location: 'Client Meeting',
      activeDeals: 3,
      lastActivity: '1 hour ago',
      avatar: '👨‍💼'
    },
    {
      id: 3,
      name: 'Anna Walsh',
      role: 'Buyer Agent',
      status: 'away',
      location: 'Property Showing',
      activeDeals: 7,
      lastActivity: '2 hours ago',
      avatar: '👩‍💻'
    },
    {
      id: 4,
      name: 'David Park',
      role: 'Commercial Agent',
      status: 'online',
      location: 'Home Office',
      activeDeals: 2,
      lastActivity: '10 minutes ago',
      avatar: '👨‍🏢'
    }
  ]);

  const [announcements] = useState([
    {
      id: 1,
      title: 'New MLS Integration Available',
      content: 'We\'ve added enhanced MLS integration with real-time updates and better search functionality.',
      author: 'IT Department',
      date: '2025-08-13',
      priority: 'high',
      type: 'feature'
    },
    {
      id: 2,
      title: 'Team Meeting - Friday 2 PM',
      content: 'Monthly team meeting to discuss Q3 goals and review recent market trends.',
      author: 'Management',
      date: '2025-08-12',
      priority: 'medium',
      type: 'meeting'
    },
    {
      id: 3,
      title: 'Client Appreciation Event',
      content: 'Save the date: September 15th for our annual client appreciation BBQ at Central Park.',
      author: 'Marketing Team',
      date: '2025-08-11',
      priority: 'low',
      type: 'event'
    }
  ]);

  const [recentActivity] = useState([
    { id: 1, user: 'Sarah Johnson', action: 'closed deal for 123 Oak Street', time: '30 minutes ago', type: 'success' },
    { id: 2, user: 'Mike Chen', action: 'uploaded new listing photos', time: '1 hour ago', type: 'update' },
    { id: 3, user: 'Anna Walsh', action: 'scheduled property inspection', time: '2 hours ago', type: 'schedule' },
    { id: 4, user: 'David Park', action: 'added new commercial client', time: '3 hours ago', type: 'new' },
    { id: 5, user: 'Sarah Johnson', action: 'updated client contact information', time: '4 hours ago', type: 'update' }
  ]);

  const [sharedResources] = useState([
    { id: 1, name: 'Market Analysis Template', type: 'document', category: 'Templates', downloads: 45 },
    { id: 2, name: 'Buyer Presentation Slides', type: 'presentation', category: 'Sales Materials', downloads: 78 },
    { id: 3, name: 'Contract Templates Library', type: 'folder', category: 'Legal', downloads: 134 },
    { id: 4, name: 'Photography Guidelines', type: 'document', category: 'Marketing', downloads: 23 },
    { id: 5, name: 'CRM Training Videos', type: 'video', category: 'Training', downloads: 89 }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-red-100 text-red-800';
      case 'away': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityTypeColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'schedule': return 'bg-purple-100 text-purple-800';
      case 'new': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'document': return '📄';
      case 'presentation': return '📊';
      case 'folder': return '📁';
      case 'video': return '🎥';
      case 'image': return '🖼️';
      default: return '📄';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
                Workplace Hub
              </h1>
              <p className="text-[#7a7a7a] mt-2">Team collaboration, announcements, and shared resources</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-[#864936] text-white px-4 py-2 rounded-lg hover:bg-[#9a5441] transition-colors">
                Share Resource
              </button>
              <button className="bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#7a8365] transition-colors">
                Post Announcement
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Team Members Online</p>
            <p className="text-2xl font-bold text-green-600">
              {teamMembers.filter(member => member.status === 'online').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Active Deals</p>
            <p className="text-2xl font-bold text-[#636B56]">
              {teamMembers.reduce((sum, member) => sum + member.activeDeals, 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Shared Resources</p>
            <p className="text-2xl font-bold text-[#636B56]">{sharedResources.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Recent Activities</p>
            <p className="text-2xl font-bold text-[#636B56]">{recentActivity.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Announcements */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-[#636B56] mb-4">Company Announcements</h2>
              <div className="space-y-4">
                {announcements.map(announcement => (
                  <div key={announcement.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{announcement.title}</h3>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(announcement.priority)}`}>
                          {announcement.priority}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                          {announcement.type}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-3">{announcement.content}</p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>By {announcement.author}</span>
                      <span>{announcement.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-[#636B56] mb-4">Recent Team Activity</h2>
              <div className="space-y-3">
                {recentActivity.map(activity => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                    <div className={`w-3 h-3 rounded-full ${getActivityTypeColor(activity.type).split(' ')[0]}`}></div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span> {activity.action}
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getActivityTypeColor(activity.type)}`}>
                      {activity.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shared Resources */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-[#636B56] mb-4">Shared Resources</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sharedResources.map(resource => (
                  <div key={resource.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">
                        {getFileIcon(resource.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{resource.name}</h3>
                        <p className="text-sm text-gray-600">{resource.category}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {resource.downloads} downloads
                        </p>
                      </div>
                      <button className="text-xs px-2 py-1 border border-[#636B56] text-[#636B56] rounded hover:bg-[#636B56] hover:text-white transition-colors">
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#636B56] mb-4">Team Status</h3>
              <div className="space-y-3">
                {teamMembers.map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="relative">
                      <div className="text-2xl">{member.avatar}</div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getStatusDot(member.status)}`}></div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{member.name}</h4>
                      <p className="text-xs text-gray-600">{member.role}</p>
                      <p className="text-xs text-gray-500">{member.location}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(member.status)}`}>
                        {member.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{member.activeDeals} deals</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#636B56] mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 border rounded-lg hover:border-[#636B56] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      💬
                    </div>
                    <div>
                      <p className="font-medium text-sm">Team Chat</p>
                      <p className="text-xs text-gray-600">Send message to team</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 border rounded-lg hover:border-[#636B56] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      📅
                    </div>
                    <div>
                      <p className="font-medium text-sm">Schedule Meeting</p>
                      <p className="text-xs text-gray-600">Book team meeting room</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 border rounded-lg hover:border-[#636B56] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      🎯
                    </div>
                    <div>
                      <p className="font-medium text-sm">Goal Tracking</p>
                      <p className="text-xs text-gray-600">View team goals</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#636B56] mb-4">Upcoming Events</h3>
              <div className="space-y-3">
                <div className="p-3 border-l-4 border-[#636B56] bg-gray-50 rounded-r">
                  <p className="font-medium text-sm">Team Meeting</p>
                  <p className="text-xs text-gray-600">Friday, August 16 at 2:00 PM</p>
                  <p className="text-xs text-gray-500">Conference Room A</p>
                </div>
                <div className="p-3 border-l-4 border-blue-500 bg-gray-50 rounded-r">
                  <p className="font-medium text-sm">Training Session</p>
                  <p className="text-xs text-gray-600">Monday, August 19 at 10:00 AM</p>
                  <p className="text-xs text-gray-500">CRM Advanced Features</p>
                </div>
                <div className="p-3 border-l-4 border-green-500 bg-gray-50 rounded-r">
                  <p className="font-medium text-sm">Client BBQ</p>
                  <p className="text-xs text-gray-600">September 15 at 5:00 PM</p>
                  <p className="text-xs text-gray-500">Central Park Pavilion</p>
                </div>
              </div>
            </div>

            {/* Knowledge Base */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#636B56] mb-4">Knowledge Base</h3>
              <div className="space-y-2">
                <button className="w-full text-left p-2 text-sm hover:bg-gray-50 rounded">
                  📚 CRM User Guide
                </button>
                <button className="w-full text-left p-2 text-sm hover:bg-gray-50 rounded">
                  🏠 Property Listing Best Practices
                </button>
                <button className="w-full text-left p-2 text-sm hover:bg-gray-50 rounded">
                  📝 Contract Templates
                </button>
                <button className="w-full text-left p-2 text-sm hover:bg-gray-50 rounded">
                  💰 Commission Calculator
                </button>
                <button className="w-full text-left p-2 text-sm hover:bg-gray-50 rounded">
                  📊 Market Analysis Tools
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}