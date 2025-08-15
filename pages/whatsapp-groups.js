import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  UserGroupIcon,
  HomeIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  CalendarIcon,
  CheckCircleIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  UserPlusIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

export default function WhatsAppGroups() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newGroup, setNewGroup] = useState({
    propertyAddress: '',
    saleType: 'standard',
    members: []
  });
  const [newMember, setNewMember] = useState({
    name: '',
    role: 'owner',
    phone: '',
    email: ''
  });
  const [groupMessage, setGroupMessage] = useState('');

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = () => {
    // Load saved groups from localStorage (in production, this would be from database)
    const savedGroups = localStorage.getItem('whatsappGroups');
    if (savedGroups) {
      setGroups(JSON.parse(savedGroups));
    } else {
      // Demo groups
      setGroups([
        {
          id: 1,
          propertyAddress: '123 Main St, Sydney',
          saleType: 'standard',
          status: 'active',
          created: new Date('2024-01-15'),
          members: [
            { name: 'John Smith', role: 'owner', phone: '+61412345678', email: 'john@email.com' },
            { name: 'Sarah Agent', role: 'agent', phone: '+61423456789', email: 'sarah@realty.com' },
            { name: 'Legal Team', role: 'solicitor', phone: '+61434567890', email: 'legal@law.com' }
          ],
          messages: [
            { sender: 'Sarah Agent', text: 'Welcome to the property sale group for 123 Main St!', time: '10:00 AM' },
            { sender: 'John Smith', text: 'Thanks Sarah, excited to get started', time: '10:05 AM' },
            { sender: 'Sarah Agent', text: 'Contract review scheduled for tomorrow at 2pm', time: '11:00 AM' }
          ],
          milestones: [
            { task: 'Property listed', completed: true, date: '2024-01-15' },
            { task: 'First open house', completed: true, date: '2024-01-20' },
            { task: 'Offer received', completed: false, date: null },
            { task: 'Contract signed', completed: false, date: null }
          ]
        },
        {
          id: 2,
          propertyAddress: '456 Beach Rd, Bondi',
          saleType: 'auction',
          status: 'pending',
          created: new Date('2024-02-01'),
          members: [
            { name: 'Mary Johnson', role: 'owner', phone: '+61445678901', email: 'mary@email.com' },
            { name: 'Tom Agent', role: 'agent', phone: '+61456789012', email: 'tom@realty.com' }
          ],
          messages: [],
          milestones: [
            { task: 'Property listed', completed: true, date: '2024-02-01' },
            { task: 'Marketing campaign launched', completed: false, date: null },
            { task: 'Auction date set', completed: false, date: null }
          ]
        }
      ]);
    }
  };

  const saveGroups = (updatedGroups) => {
    localStorage.setItem('whatsappGroups', JSON.stringify(updatedGroups));
    setGroups(updatedGroups);
  };

  const createGroup = () => {
    const group = {
      id: Date.now(),
      ...newGroup,
      status: 'active',
      created: new Date(),
      messages: [
        {
          sender: 'System',
          text: `Property sale group created for ${newGroup.propertyAddress}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      milestones: getSaleMilestones(newGroup.saleType)
    };

    const updatedGroups = [group, ...groups];
    saveGroups(updatedGroups);
    setSelectedGroup(group);
    setShowCreateModal(false);
    setNewGroup({ propertyAddress: '', saleType: 'standard', members: [] });
  };

  const getSaleMilestones = (saleType) => {
    if (saleType === 'auction') {
      return [
        { task: 'Property listed', completed: false, date: null },
        { task: 'Marketing campaign launched', completed: false, date: null },
        { task: 'First open house', completed: false, date: null },
        { task: 'Auction date set', completed: false, date: null },
        { task: 'Auction day', completed: false, date: null },
        { task: 'Contract signed', completed: false, date: null },
        { task: 'Settlement', completed: false, date: null }
      ];
    } else {
      return [
        { task: 'Property listed', completed: false, date: null },
        { task: 'First open house', completed: false, date: null },
        { task: 'Offer received', completed: false, date: null },
        { task: 'Negotiation completed', completed: false, date: null },
        { task: 'Contract signed', completed: false, date: null },
        { task: 'Building inspection', completed: false, date: null },
        { task: 'Settlement', completed: false, date: null }
      ];
    }
  };

  const addMemberToNewGroup = () => {
    setNewGroup({
      ...newGroup,
      members: [...newGroup.members, newMember]
    });
    setNewMember({ name: '', role: 'owner', phone: '', email: '' });
  };

  const addMemberToExistingGroup = () => {
    if (!selectedGroup) return;
    
    const updatedGroups = groups.map(g => {
      if (g.id === selectedGroup.id) {
        return {
          ...g,
          members: [...g.members, newMember],
          messages: [...g.messages, {
            sender: 'System',
            text: `${newMember.name} (${newMember.role}) added to the group`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]
        };
      }
      return g;
    });
    
    saveGroups(updatedGroups);
    setSelectedGroup(updatedGroups.find(g => g.id === selectedGroup.id));
    setShowAddMemberModal(false);
    setNewMember({ name: '', role: 'owner', phone: '', email: '' });
  };

  const sendGroupMessage = () => {
    if (!selectedGroup || !groupMessage.trim()) return;
    
    const updatedGroups = groups.map(g => {
      if (g.id === selectedGroup.id) {
        return {
          ...g,
          messages: [...g.messages, {
            sender: 'You',
            text: groupMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]
        };
      }
      return g;
    });
    
    saveGroups(updatedGroups);
    setSelectedGroup(updatedGroups.find(g => g.id === selectedGroup.id));
    setGroupMessage('');
  };

  const toggleMilestone = (milestoneIndex) => {
    if (!selectedGroup) return;
    
    const updatedGroups = groups.map(g => {
      if (g.id === selectedGroup.id) {
        const updatedMilestones = [...g.milestones];
        updatedMilestones[milestoneIndex] = {
          ...updatedMilestones[milestoneIndex],
          completed: !updatedMilestones[milestoneIndex].completed,
          date: !updatedMilestones[milestoneIndex].completed ? new Date().toISOString().split('T')[0] : null
        };
        
        return {
          ...g,
          milestones: updatedMilestones,
          messages: [...g.messages, {
            sender: 'System',
            text: `Milestone "${updatedMilestones[milestoneIndex].task}" marked as ${updatedMilestones[milestoneIndex].completed ? 'completed' : 'pending'}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]
        };
      }
      return g;
    });
    
    saveGroups(updatedGroups);
    setSelectedGroup(updatedGroups.find(g => g.id === selectedGroup.id));
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#636B56]">WhatsApp Property Groups</h1>
          <p className="text-gray-600 mt-2">Manage property sale communications with all stakeholders in one place</p>
        </div>

        <div className="flex gap-6">
          {/* Groups List */}
          <div className="w-1/3">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Property Groups</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-[#25D366] text-white px-3 py-1.5 rounded-lg text-sm hover:bg-[#22c55e] flex items-center gap-1"
                >
                  <PlusIcon className="h-4 w-4" />
                  New Group
                </button>
              </div>

              <div className="space-y-2">
                {groups.map(group => (
                  <div
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedGroup?.id === group.id ? 'bg-[#25D366]/10 border-l-4 border-[#25D366]' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <HomeIcon className="h-4 w-4 text-[#636B56]" />
                          <p className="font-semibold text-sm">{group.propertyAddress}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {group.members.length} members • {group.saleType}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            group.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {group.status}
                          </span>
                          <span className="text-xs text-gray-400">
                            {group.milestones.filter(m => m.completed).length}/{group.milestones.length} milestones
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Group Details */}
          {selectedGroup ? (
            <div className="flex-1 bg-white rounded-lg shadow-sm">
              <div className="border-b p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <HomeIcon className="h-5 w-5 text-[#636B56]" />
                      {selectedGroup.propertyAddress}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Created {new Date(selectedGroup.created).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="bg-[#636B56] text-white px-3 py-1.5 rounded-lg text-sm hover:bg-[#7a8365] flex items-center gap-1"
                  >
                    <UserPlusIcon className="h-4 w-4" />
                    Add Member
                  </button>
                </div>

                {/* Members */}
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Group Members</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedGroup.members.map((member, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full text-sm">
                        <div className="w-6 h-6 bg-[#25D366] text-white rounded-full flex items-center justify-center text-xs">
                          {member.name.charAt(0)}
                        </div>
                        <span>{member.name}</span>
                        <span className="text-xs text-gray-500">({member.role})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex h-[500px]">
                {/* Messages */}
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {selectedGroup.messages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] px-3 py-2 rounded-lg ${
                          msg.sender === 'You' 
                            ? 'bg-[#25D366] text-white' 
                            : msg.sender === 'System'
                            ? 'bg-gray-100 text-gray-600 italic text-sm'
                            : 'bg-gray-200 text-gray-800'
                        }`}>
                          {msg.sender !== 'You' && msg.sender !== 'System' && (
                            <p className="text-xs font-semibold mb-1">{msg.sender}</p>
                          )}
                          <p className="text-sm">{msg.text}</p>
                          <p className="text-xs mt-1 opacity-70">{msg.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Message Input */}
                  <div className="border-t p-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={groupMessage}
                        onChange={(e) => setGroupMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendGroupMessage()}
                        placeholder="Type a message to the group..."
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25D366]"
                      />
                      <button
                        onClick={sendGroupMessage}
                        className="bg-[#25D366] text-white p-2 rounded-lg hover:bg-[#22c55e]"
                      >
                        <PaperAirplaneIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Milestones */}
                <div className="w-80 border-l p-4 bg-gray-50">
                  <h3 className="font-semibold text-gray-700 mb-3">Sale Milestones</h3>
                  <div className="space-y-2">
                    {selectedGroup.milestones.map((milestone, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleMilestone(idx)}
                        className="flex items-center gap-3 p-2 bg-white rounded-lg cursor-pointer hover:shadow-sm transition-all"
                      >
                        {milestone.completed ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                        )}
                        <div className="flex-1">
                          <p className={`text-sm ${milestone.completed ? 'line-through text-gray-400' : ''}`}>
                            {milestone.task}
                          </p>
                          {milestone.date && (
                            <p className="text-xs text-gray-500">{milestone.date}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-700 mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                      <button className="w-full text-left px-3 py-2 bg-white rounded-lg hover:bg-gray-100 text-sm flex items-center gap-2">
                        <DocumentTextIcon className="h-4 w-4 text-[#636B56]" />
                        Send Contract
                      </button>
                      <button className="w-full text-left px-3 py-2 bg-white rounded-lg hover:bg-gray-100 text-sm flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-[#636B56]" />
                        Schedule Open House
                      </button>
                      <button className="w-full text-left px-3 py-2 bg-white rounded-lg hover:bg-gray-100 text-sm flex items-center gap-2">
                        <ChatBubbleLeftRightIcon className="h-4 w-4 text-[#636B56]" />
                        Request Update
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a property group to view details</p>
              </div>
            </div>
          )}
        </div>

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-[#636B56] mb-4">Create Property Sale Group</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newGroup.propertyAddress}
                    onChange={(e) => setNewGroup({ ...newGroup, propertyAddress: e.target.value })}
                    placeholder="123 Main St, Sydney"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#636B56]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sale Type
                  </label>
                  <select
                    value={newGroup.saleType}
                    onChange={(e) => setNewGroup({ ...newGroup, saleType: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#636B56]"
                  >
                    <option value="standard">Standard Sale</option>
                    <option value="auction">Auction</option>
                    <option value="offmarket">Off-Market</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Members
                  </label>
                  
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      value={newMember.name}
                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                      placeholder="Name"
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#636B56]"
                    />
                    <select
                      value={newMember.role}
                      onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#636B56]"
                    >
                      <option value="owner">Owner</option>
                      <option value="agent">Agent</option>
                      <option value="buyer">Buyer</option>
                      <option value="solicitor">Solicitor</option>
                      <option value="inspector">Inspector</option>
                      <option value="other">Other</option>
                    </select>
                    <input
                      type="tel"
                      value={newMember.phone}
                      onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                      placeholder="Phone (WhatsApp)"
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#636B56]"
                    />
                    <input
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      placeholder="Email (optional)"
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#636B56]"
                    />
                  </div>
                  
                  <button
                    onClick={addMemberToNewGroup}
                    disabled={!newMember.name || !newMember.phone}
                    className="bg-[#25D366] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#22c55e] disabled:opacity-50"
                  >
                    Add Member
                  </button>
                  
                  {newGroup.members.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {newGroup.members.map((member, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                          <span className="text-sm">
                            {member.name} ({member.role}) - {member.phone}
                          </span>
                          <button
                            onClick={() => setNewGroup({
                              ...newGroup,
                              members: newGroup.members.filter((_, i) => i !== idx)
                            })}
                            className="text-red-500 hover:text-red-700"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={createGroup}
                  disabled={!newGroup.propertyAddress || newGroup.members.length === 0}
                  className="flex-1 bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#7a8365] disabled:opacity-50"
                >
                  Create Group
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewGroup({ propertyAddress: '', saleType: 'standard', members: [] });
                    setNewMember({ name: '', role: 'owner', phone: '', email: '' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showAddMemberModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-[#636B56] mb-4">Add Member to Group</h2>
              
              <div className="space-y-3">
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="Name"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#636B56]"
                />
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#636B56]"
                >
                  <option value="owner">Owner</option>
                  <option value="agent">Agent</option>
                  <option value="buyer">Buyer</option>
                  <option value="solicitor">Solicitor</option>
                  <option value="inspector">Inspector</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="tel"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  placeholder="Phone (WhatsApp)"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#636B56]"
                />
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="Email (optional)"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#636B56]"
                />
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={addMemberToExistingGroup}
                  disabled={!newMember.name || !newMember.phone}
                  className="flex-1 bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#7a8365] disabled:opacity-50"
                >
                  Add Member
                </button>
                <button
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setNewMember({ name: '', role: 'owner', phone: '', email: '' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}