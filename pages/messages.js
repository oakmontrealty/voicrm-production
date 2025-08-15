import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { PaperAirplaneIcon, PhotoIcon, PaperClipIcon, MicrophoneIcon, FaceSmileIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';

export default function Messages() {
  const router = useRouter();
  const { type } = router.query;
  const messageEndRef = useRef(null);
  
  const [conversations, setConversations] = useState([]);

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [newMessage, setNewMessage] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showMassTexter, setShowMassTexter] = useState(type === 'mass');
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedImage, setAttachedImage] = useState(null);
  const [showMMS, setShowMMS] = useState(type === 'mms');
  const [activeTab, setActiveTab] = useState('sms'); // 'sms', 'whatsapp', 'mass'
  const [massTextCampaign, setMassTextCampaign] = useState({
    name: '',
    message: '',
    recipients: [],
    selectedGroup: 'all',
    preview: '',
    showApprovalDialog: false,
    genericContacts: [],
    allowGenericOverride: false
  });

  const messageTemplates = [
    { id: 1, name: 'Property Inquiry Response', text: 'Thank you for your interest in [PROPERTY]. I\'d be happy to arrange a viewing. When would be a convenient time for you?' },
    { id: 2, name: 'Viewing Confirmation', text: 'Hi [NAME], confirming your property viewing at [PROPERTY] on [DATE] at [TIME]. Looking forward to seeing you!' },
    { id: 3, name: 'Follow-up', text: 'Hi [NAME], just following up on your property viewing yesterday. Do you have any questions I can help with?' },
    { id: 4, name: 'New Listing Alert', text: 'Hi [NAME], a new property matching your criteria just came on the market at [ADDRESS]. Would you like more details?' },
    { id: 5, name: 'Open House Invite', text: 'You\'re invited to our open house at [PROPERTY] this Saturday from 1-3 PM. Hope to see you there!' }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachedImage(file);
      // Auto-send as MMS when image is selected
      sendMMS(file, 'image');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachedFile(file);
      // Auto-send as MMS when file is selected
      sendMMS(file, 'file');
    }
  };

  const sendMMS = async (file, type) => {
    if (!selectedConversation) return;
    
    const message = {
      id: messages.length + 1,
      conversationId: selectedConversation.id,
      text: type === 'image' ? `📷 Image: ${file.name}` : `📎 File: ${file.name}`,
      sender: 'agent',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
      type: 'mms',
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(1)} KB`,
      fileType: type
    };

    setMessages([...messages, message]);
    setAttachedImage(null);
    setAttachedFile(null);

    // For MMS, you'd need to upload the file first, then send with mediaUrl
    // This is a simplified version - in production you'd upload to S3/Cloudinary first
    try {
      const response = await fetch('/api/twilio/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedConversation.phone,
          message: `Sent ${type}: ${file.name}`,
          mediaUrl: null // Would be actual URL after upload
        })
      });

      if (response.ok) {
        setMessages(prev => prev.map(m => 
          m.id === message.id ? { ...m, status: 'delivered' } : m
        ));
      } else {
        setMessages(prev => prev.map(m => 
          m.id === message.id ? { ...m, status: 'failed' } : m
        ));
      }
    } catch (error) {
      console.error('Failed to send MMS:', error);
      setMessages(prev => prev.map(m => 
        m.id === message.id ? { ...m, status: 'failed' } : m
      ));
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message = {
      id: messages.length + 1,
      conversationId: selectedConversation.id,
      text: newMessage,
      sender: 'agent',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
      type: 'text'
    };

    setMessages([...messages, message]);
    setNewMessage('');

    // Send via Twilio API (SMS or WhatsApp based on active tab)
    try {
      const endpoint = activeTab === 'whatsapp' ? '/api/twilio/whatsapp' : '/api/twilio/send-sms';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedConversation.phone,
          message: newMessage
        })
      });

      if (response.ok) {
        setMessages(prev => prev.map(m => 
          m.id === message.id ? { ...m, status: 'delivered' } : m
        ));
      } else {
        setMessages(prev => prev.map(m => 
          m.id === message.id ? { ...m, status: 'failed' } : m
        ));
      }
    } catch (error) {
      console.error('Failed to send SMS:', error);
      setMessages(prev => prev.map(m => 
        m.id === message.id ? { ...m, status: 'failed' } : m
      ));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectTemplate = (template) => {
    setNewMessage(template.text);
    setShowTemplates(false);
  };

  const conversationMessages = messages.filter(m => m.conversationId === selectedConversation?.id);

  if (showMassTexter) {
    return (
      <Layout>
        <div className="space-y-6">
          {/* Generic Names Approval Dialog */}
          {massTextCampaign.showApprovalDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
                <h3 className="text-xl font-semibold text-[#636B56] mb-4">
                  ⚠️ Generic Names Detected
                </h3>
                
                <p className="text-gray-600 mb-4">
                  The following contacts have generic names (inquiry, owner, vendor, tenant). 
                  They will receive a generic greeting without personalization.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-2">Contact Name</th>
                        <th className="text-left pb-2">Phone</th>
                        <th className="text-left pb-2">Will Receive</th>
                      </tr>
                    </thead>
                    <tbody>
                      {massTextCampaign.genericContacts.map((contact, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-2">
                            <span className="text-orange-600 font-medium">{contact.fullName}</span>
                          </td>
                          <td className="py-2 text-gray-600">{contact.phone}</td>
                          <td className="py-2 text-gray-500 text-xs">
                            {contact.personalizedMessage.substring(0, 50)}...
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Generic names like "Inquiry" or "Owner" will receive the message 
                    without name personalization to avoid awkward greetings like "Hi Inquiry".
                  </p>
                </div>
                
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setMassTextCampaign({...massTextCampaign, showApprovalDialog: false})}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setMassTextCampaign({...massTextCampaign, showApprovalDialog: false, allowGenericOverride: true});
                      // Continue with sending
                      const response = await fetch('/api/twilio/send-mass-sms', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          recipients: massTextCampaign.recipients,
                          message: massTextCampaign.message,
                          campaignName: massTextCampaign.name,
                          includeOptOut: false,
                          allowGenericOverride: true
                        })
                      });
                      
                      if (response.ok) {
                        const result = await response.json();
                        alert(`Campaign sent! ${result.statistics.successful} successful, ${result.statistics.failed} failed.`);
                        setShowMassTexter(false);
                      }
                    }}
                    className="px-4 py-2 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365]"
                  >
                    Approve & Send
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
                  Mass Text
                </h1>
                <p className="text-[#7a7a7a] mt-2">Send bulk SMS campaigns to multiple recipients</p>
              </div>
              <button 
                onClick={() => { setShowMassTexter(false); router.push('/messages'); }}
                className="text-[#636B56] hover:underline"
              >
                Back to Texts
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-[#636B56] mb-4">Campaign Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                  <input
                    type="text"
                    value={massTextCampaign.name}
                    onChange={(e) => setMassTextCampaign({...massTextCampaign, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                    placeholder="Enter campaign name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message 
                    <span className="text-xs text-[#636B56] ml-2">
                      (Use [NAME] to auto-insert each recipient's name)
                    </span>
                  </label>
                  <textarea
                    rows="5"
                    value={massTextCampaign.message}
                    onChange={(e) => {
                      const msg = e.target.value;
                      setMassTextCampaign({
                        ...massTextCampaign, 
                        message: msg,
                        preview: msg.replace('[NAME]', 'John Smith')
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                    placeholder="Hi [NAME], just wanted to reach out about..."
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">
                      {160 - massTextCampaign.message.length} characters remaining
                    </p>
                    {massTextCampaign.message.includes('[NAME]') && (
                      <p className="text-xs text-green-600">✓ Name personalization active</p>
                    )}
                  </div>
                  
                  {/* Preview */}
                  {massTextCampaign.preview && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Preview (for John Smith):</p>
                      <p className="text-sm">{massTextCampaign.preview}</p>
                    </div>
                  )}
                  
                  {/* Warning about name validation */}
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs font-medium text-yellow-800">⚠️ Name Processing</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Only first names will be used. Names like "inquiry", "owner", "vendor" will be skipped.
                      Full addresses will be automatically removed.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent">
                    <option>Send Now</option>
                    <option>Schedule for Later</option>
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600">ℹ️</span>
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Smart Sending Mode</p>
                      <p className="text-blue-700 mt-1">
                        Messages will be sent individually with 10-second intervals to avoid carrier blocking.
                      </p>
                      <p className="text-blue-600 text-xs mt-1">
                        Estimated time: {Math.ceil((parseInt(massTextCampaign.selectedGroup === 'all' ? 1247 : 100) * 10) / 60)} minutes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-[#636B56] mb-4">Recipients</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Recipients</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent">
                    <option>All Contacts (1,247)</option>
                    <option>Active Leads (89)</option>
                    <option>Hot Prospects (23)</option>
                    <option>Past Clients (456)</option>
                    <option>Custom List</option>
                  </select>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Selected Recipients</span>
                    <span className="text-[#636B56] font-bold">1,247</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Estimated Cost:</span>
                      <span>$62.35</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Time:</span>
                      <span>~5 minutes</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Recent Campaigns</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Open House Invite</span>
                      <span className="text-gray-500">Sent to 234 • 92% delivered</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Market Update</span>
                      <span className="text-gray-500">Sent to 567 • 89% delivered</span>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={async () => {
                  if (!massTextCampaign.message) {
                    alert('Please enter a message');
                    return;
                  }
                  
                  // Get contacts based on selected group
                  // This would fetch from your contacts API
                  const contacts = [
                    { name: 'John Smith', phone: '+1234567890' },
                    { name: 'Inquiry - 123 Main St', phone: '+1234567891' },
                    { name: 'Owner', phone: '+1234567892' },
                    { name: 'Sarah Wilson', phone: '+1234567893' },
                    { name: 'Vendor Property ABC', phone: '+1234567894' }
                  ]; // Example contacts for testing
                  
                  // Pre-process contacts to check for generic names
                  const { processContactsForMassText } = await import('../lib/name-utils');
                  const { processed, summary } = processContactsForMassText(
                    contacts, 
                    massTextCampaign.message
                  );
                  
                  // Check if any contacts need approval
                  const genericContacts = processed.filter(p => p.isGeneric);
                  
                  if (genericContacts.length > 0) {
                    // Show approval dialog
                    setMassTextCampaign({
                      ...massTextCampaign,
                      showApprovalDialog: true,
                      genericContacts: genericContacts,
                      recipients: contacts
                    });
                    return;
                  }
                  
                  // No generic names, send directly
                  try {
                    const response = await fetch('/api/twilio/send-mass-sms', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        recipients: contacts,
                        message: massTextCampaign.message,
                        campaignName: massTextCampaign.name,
                        includeOptOut: false
                      })
                    });
                    
                    if (response.ok) {
                      const result = await response.json();
                      alert(`Campaign sent! ${result.statistics.successful} successful, ${result.statistics.failed} failed.`);
                      setShowMassTexter(false);
                    }
                  } catch (error) {
                    console.error('Failed to send mass SMS:', error);
                    alert('Failed to send campaign');
                  }
                }}
                className="w-full mt-6 bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#7a8365] transition-colors"
              >
                Review & Send Campaign
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Communication Header with Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h1 className="text-2xl font-bold text-[#636B56] mb-3" style={{ fontFamily: 'Forum, serif' }}>Communications</h1>
        <div className="flex gap-4 border-b">
          <button 
            onClick={() => { setActiveTab('sms'); setShowMassTexter(false); }}
            className={`pb-2 px-1 border-b-2 ${activeTab === 'sms' ? 'border-[#636B56] text-[#636B56]' : 'border-transparent text-gray-500 hover:text-[#636B56]'} font-medium`}
          >
            📱 SMS/MMS
          </button>
          <button 
            onClick={() => { setActiveTab('whatsapp'); setShowMassTexter(false); }}
            className={`pb-2 px-1 border-b-2 ${activeTab === 'whatsapp' ? 'border-[#636B56] text-[#636B56]' : 'border-transparent text-gray-500 hover:text-[#636B56]'} font-medium`}
          >
            💬 WhatsApp
          </button>
          <button 
            onClick={() => { setActiveTab('mass'); setShowMassTexter(true); }}
            className={`pb-2 px-1 border-b-2 ${activeTab === 'mass' ? 'border-[#636B56] text-[#636B56]' : 'border-transparent text-gray-500 hover:text-[#636B56]'} font-medium`}
          >
            📢 Mass Text
          </button>
        </div>
      </div>
      
      <div className="h-[calc(100vh-280px)] flex">
        {/* Conversations List */}
        <div className="w-1/3 bg-white rounded-l-xl shadow-sm border-r">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold text-[#636B56]">Texts</h2>
              <button 
                onClick={() => {
                  // Create new conversation
                  const phoneNumber = prompt('Enter phone number to message:');
                  if (phoneNumber) {
                    const newConvo = {
                      id: conversations.length + 1,
                      contact: 'New Contact',
                      phone: phoneNumber,
                      lastMessage: '',
                      timestamp: 'Now',
                      unread: 0,
                      avatar: 'NC',
                      status: 'new'
                    };
                    setConversations([newConvo, ...conversations]);
                    setSelectedConversation(newConvo);
                  }
                }}
                className="bg-[#636B56] text-white px-3 py-1.5 rounded-lg text-sm hover:bg-[#7a8365] flex items-center gap-1"
              >
                <span className="text-lg">+</span> Compose
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search contacts..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#636B56]/20 focus:border-[#636B56]/50"
                onChange={(e) => {
                  // Filter conversations based on search
                  const search = e.target.value.toLowerCase();
                  // This would filter the conversations list
                }}
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <div className="flex gap-2">
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-medium">
                ✓ SMS Active
              </div>
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium">
                💬 WhatsApp Ready
              </div>
            </div>
          </div>
          
          <div className="overflow-y-auto h-[calc(100%-120px)]">
            {conversations.map(conversation => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                  selectedConversation?.id === conversation.id ? 'bg-[#636B56]/5' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#636B56] text-white flex items-center justify-center font-bold">
                    {conversation.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-black text-base">{conversation.contact}</h3>
                        <p className="text-sm text-gray-500">{conversation.phone}</p>
                      </div>
                      <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 truncate">{conversation.lastMessage}</p>
                  </div>
                  {conversation.unread > 0 && (
                    <span className="bg-[#636B56] text-white text-xs rounded-full px-2 py-1">
                      {conversation.unread}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 bg-white rounded-r-xl shadow-sm flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#636B56] text-white flex items-center justify-center font-bold">
                    {selectedConversation.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-black text-lg">{selectedConversation.contact}</h3>
                    <p className="text-sm text-gray-500">{selectedConversation.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">📞</button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">ℹ️</button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {conversationMessages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${
                      message.sender === 'agent' 
                        ? 'bg-[#636B56] text-white' 
                        : 'bg-gray-100 text-gray-900'
                    } rounded-lg p-3`}>
                      {message.type === 'mms' ? (
                        <div className="flex items-center gap-2">
                          {message.fileType === 'image' ? (
                            <PhotoIcon className="h-5 w-5" />
                          ) : (
                            <PaperClipIcon className="h-5 w-5" />
                          )}
                          <div>
                            <p className="font-medium">{message.fileName}</p>
                            <p className="text-xs opacity-75">{message.fileSize} • MMS</p>
                          </div>
                        </div>
                      ) : message.type === 'file' ? (
                        <div className="flex items-center gap-2">
                          <PaperClipIcon className="h-5 w-5" />
                          <div>
                            <p className="font-medium">{message.fileName}</p>
                            <p className="text-xs opacity-75">{message.fileSize}</p>
                          </div>
                        </div>
                      ) : (
                        <p>{message.text}</p>
                      )}
                      <div className={`text-xs mt-1 ${
                        message.sender === 'agent' ? 'text-white/70' : 'text-gray-500'
                      }`}>
                        {message.timestamp}
                        {message.sender === 'agent' && (
                          <span className="ml-2">
                            {message.status === 'sending' && '⏳'}
                            {message.status === 'delivered' && '✓'}
                            {message.status === 'read' && '✓✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messageEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                {showTemplates && (
                  <div className="mb-4 bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                    <p className="text-sm font-medium text-gray-700 mb-2">Quick Templates:</p>
                    <div className="space-y-2">
                      {messageTemplates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => selectTemplate(template)}
                          className="w-full text-left p-2 hover:bg-white rounded text-sm"
                        >
                          <span className="font-medium">{template.name}</span>
                          <p className="text-gray-500 text-xs mt-1">{template.text.substring(0, 50)}...</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-end gap-2">
                  <button 
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    title="Templates"
                  >
                    📋
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                    title="Add Photo (sends as MMS)"
                  >
                    <PhotoIcon className="h-5 w-5 text-gray-600" />
                  </label>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                    title="Add File (sends as MMS)"
                  >
                    <PaperClipIcon className="h-5 w-5 text-gray-600" />
                  </label>
                  <button className="p-2 hover:bg-gray-100 rounded-lg" title="Voice Message">
                    <MicrophoneIcon className="h-5 w-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg" title="Emoji">
                    <FaceSmileIcon className="h-5 w-5 text-gray-600" />
                  </button>
                  
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent resize-none"
                      rows="1"
                    />
                  </div>
                  
                  <button
                    onClick={sendMessage}
                    className="p-2 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365] transition-colors"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}