import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  MagnifyingGlassIcon,
  PaperClipIcon,
  CheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function WhatsApp() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    try {
      // Try to fetch contacts
      const contactsRes = await fetch('/api/contacts');
      let contacts = [];
      
      if (contactsRes.ok) {
        const data = await contactsRes.json();
        contacts = data.contacts || data || [];
      }
      
      // If no contacts, create some demo conversations
      if (!contacts.length) {
        contacts = [
          { id: 1, name: 'John Smith', phone_number: '+61412345678', status: 'active', company: 'ABC Corp' },
          { id: 2, name: 'Sarah Johnson', phone_number: '+61423456789', status: 'lead', company: 'XYZ Ltd' },
          { id: 3, name: 'Mike Wilson', phone_number: '+61434567890', status: 'active', company: 'Tech Inc' }
        ];
      }
      
      // Create WhatsApp conversations from contacts with phone numbers
      const whatsappConversations = contacts
        .filter(c => c.phone_number || c.phone)
        .slice(0, 20)
        .map(contact => ({
          id: contact.id,
          name: contact.name,
          phone: contact.phone_number || contact.phone,
          lastMessage: generateLastMessage(contact),
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          unreadCount: Math.floor(Math.random() * 5),
          status: contact.status,
          company: contact.company,
          avatar: (contact.name || 'U').charAt(0).toUpperCase()
        }));
      
      setConversations(whatsappConversations.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateLastMessage = (contact) => {
    const messages = [
      'Hi, I am interested in viewing properties',
      'Can we schedule a property viewing?',
      'Thanks for the property details',
      'What time works for the inspection?',
      'I would like more information',
      'The property looks great!',
      'Can you send me the contract?',
      'Ready to make an offer'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const loadMessages = (conversation) => {
    // Generate conversation history
    const messageHistory = [];
    const now = Date.now();
    
    // Generate 10-15 messages
    const messageCount = 10 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < messageCount; i++) {
      const isIncoming = Math.random() > 0.4;
      const hoursAgo = (messageCount - i) * 2;
      
      messageHistory.push({
        id: `msg_${i}`,
        text: generateMessageText(isIncoming, i),
        timestamp: new Date(now - hoursAgo * 60 * 60 * 1000),
        isIncoming,
        status: isIncoming ? 'received' : 'read',
        sender: isIncoming ? conversation.name : 'You'
      });
    }
    
    setMessages(messageHistory);
    setSelectedConversation(conversation);
  };

  const generateMessageText = (isIncoming, index) => {
    const incomingMessages = [
      'Hi, I saw your listing for the property in Parramatta',
      'Is the property still available?',
      'Can we arrange a viewing this weekend?',
      'What is the asking price?',
      'Are there any other similar properties?',
      'I am pre-approved for a loan',
      'The location is perfect for us',
      'We are very interested',
      'Can you send more photos?',
      'What are the contract terms?'
    ];
    
    const outgoingMessages = [
      'Hello! Yes, the property is still available',
      'I can arrange a viewing for you',
      'The asking price is $850,000',
      'Saturday at 2pm works well',
      'I will send you the details shortly',
      'Great! Let me know if you have questions',
      'I have sent you the contract',
      'Looking forward to showing you the property',
      'Here are some additional photos',
      'The property has been well maintained'
    ];
    
    const messages = isIncoming ? incomingMessages : outgoingMessages;
    return messages[index % messages.length];
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    setSendingMessage(true);
    
    try {
      // Send WhatsApp message via API
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedConversation.phone,
          message: newMessage
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add message to conversation
        const newMsg = {
          id: `msg_${Date.now()}`,
          text: newMessage,
          timestamp: new Date(),
          isIncoming: false,
          status: 'sent',
          sender: 'You'
        };
        
        setMessages([...messages, newMsg]);
        setNewMessage('');
        
        // Update last message in conversation
        setConversations(conversations.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, lastMessage: newMessage, timestamp: new Date() }
            : conv
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.phone.includes(searchTerm) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="h-[calc(100vh-200px)] flex gap-4">
        {/* Conversations List */}
        <div className="w-96 bg-white rounded-xl shadow-sm" style={{ backgroundColor: '#F8F2E7' }}>
          {/* Header */}
          <div className="p-4 border-b" style={{ borderColor: '#B28354' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: '#864936' }}>
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp Business
              </h2>
              <span className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded">
                Connected
              </span>
            </div>
            
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white"
                style={{ 
                  borderColor: '#B28354',
                  color: '#636B56'  // Green font color for search input
                }}
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100% - 120px)' }}>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" 
                     style={{ borderColor: '#636B56' }}></div>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => loadMessages(conv)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedConversation?.id === conv.id ? 'bg-gray-50' : ''
                  }`}
                  style={{ borderColor: '#F8F2E7' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                         style={{ backgroundColor: '#636B56' }}>
                      {conv.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{conv.name}</h3>
                          {conv.company && (
                            <p className="text-xs text-gray-500">{conv.company}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(conv.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 truncate">{conv.lastMessage}</p>
                      {conv.unreadCount > 0 && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-white rounded-xl shadow-sm flex flex-col" style={{ backgroundColor: '#F8F2E7' }}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#B28354' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                       style={{ backgroundColor: '#864936' }}>
                    {selectedConversation.avatar}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedConversation.name}</h3>
                    <p className="text-sm text-gray-500">{selectedConversation.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <PhoneIcon className="h-5 w-5" style={{ color: '#636B56' }} />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <PaperClipIcon className="h-5 w-5" style={{ color: '#636B56' }} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isIncoming ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.isIncoming 
                          ? 'bg-white text-gray-900' 
                          : 'bg-green-500 text-white'
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <div className={`flex items-center gap-1 mt-1 ${
                        msg.isIncoming ? 'text-gray-500' : 'text-green-100'
                      }`}>
                        <span className="text-xs">
                          {msg.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        {!msg.isIncoming && (
                          msg.status === 'read' ? (
                            <div className="flex">
                              <CheckIcon className="h-3 w-3" />
                              <CheckIcon className="h-3 w-3 -ml-1" />
                            </div>
                          ) : msg.status === 'sent' ? (
                            <CheckIcon className="h-3 w-3" />
                          ) : (
                            <ClockIcon className="h-3 w-3" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t" style={{ borderColor: '#B28354' }}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border rounded-lg bg-white"
                    style={{ 
                      borderColor: '#B28354',
                      color: '#636B56'  // Green font color for message input
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sendingMessage || !newMessage.trim()}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                  >
                    {sendingMessage ? (
                      <ClockIcon className="h-5 w-5" />
                    ) : (
                      <PaperAirplaneIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-4" style={{ color: '#B28354' }} />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>

        {/* Summary Panel */}
        <div className="w-80 bg-white rounded-xl shadow-sm p-4" style={{ backgroundColor: '#F8F2E7' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#864936' }}>
            WhatsApp Summary
          </h3>
          
          <div className="space-y-4">
            <div className="p-3 bg-white rounded-lg border" style={{ borderColor: '#B28354' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Total Conversations</span>
                <span className="font-semibold">{conversations.length}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Unread Messages</span>
                <span className="font-semibold text-green-600">
                  {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Today</span>
                <span className="font-semibold">
                  {conversations.filter(c => 
                    new Date(c.timestamp).toDateString() === new Date().toDateString()
                  ).length}
                </span>
              </div>
            </div>

            {selectedConversation && (
              <div className="p-3 bg-white rounded-lg border" style={{ borderColor: '#B28354' }}>
                <h4 className="font-semibold mb-2">Contact Info</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">Name:</span> {selectedConversation.name}</p>
                  <p><span className="text-gray-600">Phone:</span> {selectedConversation.phone}</p>
                  {selectedConversation.company && (
                    <p><span className="text-gray-600">Company:</span> {selectedConversation.company}</p>
                  )}
                  <p><span className="text-gray-600">Status:</span> {selectedConversation.status}</p>
                </div>
              </div>
            )}

            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Quick Actions</h4>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 bg-white rounded hover:bg-gray-50 text-sm">
                  📄 Send Property Details
                </button>
                <button className="w-full text-left px-3 py-2 bg-white rounded hover:bg-gray-50 text-sm">
                  📅 Schedule Viewing
                </button>
                <button className="w-full text-left px-3 py-2 bg-white rounded hover:bg-gray-50 text-sm">
                  📸 Share Photos
                </button>
                <button className="w-full text-left px-3 py-2 bg-white rounded hover:bg-gray-50 text-sm">
                  📝 Send Contract
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}