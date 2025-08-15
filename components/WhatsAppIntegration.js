import { useState, useEffect, useRef } from 'react';
import { 
  PhoneIcon,
  PaperAirplaneIcon,
  DocumentArrowUpIcon,
  PhotoIcon,
  MicrophoneIcon,
  CheckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon
} from '@heroicons/react/24/solid';

export default function WhatsAppIntegration({ contact, onMessageSent }) {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isTyping, setIsTyping] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const wsRef = useRef(null);

  // WhatsApp Business API Templates
  const messageTemplates = [
    {
      id: 'property_inquiry_response',
      name: 'Property Inquiry Response',
      category: 'real_estate',
      template: `Hi {{name}}, thanks for your interest in {{property_address}}! 

I'd be happy to arrange a viewing for you. The property features:
- {{bedrooms}} bedrooms, {{bathrooms}} bathrooms
- Price: ${{price}}
- Available: {{availability}}

When would be a good time for you to view the property?

Best regards,
Terence Houhoutas
Oakmont Realty
0494 102 414`,
      variables: ['name', 'property_address', 'bedrooms', 'bathrooms', 'price', 'availability']
    },
    {
      id: 'follow_up_viewing',
      name: 'Post-Viewing Follow Up',
      category: 'follow_up',
      template: `Hi {{name}}, I hope you enjoyed viewing {{property_address}} yesterday.

I'd love to hear your thoughts! If you're interested, I can:
- Arrange a second viewing
- Provide additional property details
- Discuss financing options
- Answer any questions

Please let me know how you'd like to proceed.

Terence Houhoutas
Oakmont Realty`,
      variables: ['name', 'property_address']
    },
    {
      id: 'market_update',
      name: 'Market Update',
      category: 'marketing',
      template: `Hi {{name}}, 

Quick market update for {{suburb}}:
- {{new_listings}} new properties listed this week
- Average price: ${{avg_price}}
- Days on market: {{dom}} days
- {{sold_count}} properties sold recently

{{call_to_action}}

Terence Houhoutas - Your Local Property Expert`,
      variables: ['name', 'suburb', 'new_listings', 'avg_price', 'dom', 'sold_count', 'call_to_action']
    }
  ];

  useEffect(() => {
    initializeWhatsApp();
    loadMessageHistory();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [contact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize WhatsApp Web connection
  const initializeWhatsApp = async () => {
    try {
      setConnectionStatus('connecting');
      
      // Check if already connected
      const statusResponse = await fetch('/api/whatsapp/status');
      const statusData = await statusResponse.json();
      
      if (statusData.connected) {
        setIsConnected(true);
        setConnectionStatus('connected');
        connectWebSocket();
      } else {
        // Get QR code for authentication
        const qrResponse = await fetch('/api/whatsapp/qr');
        const qrData = await qrResponse.json();
        setQrCode(qrData.qr);
        setConnectionStatus('waiting_for_scan');
        
        // Poll for connection status
        const pollConnection = setInterval(async () => {
          const response = await fetch('/api/whatsapp/status');
          const data = await response.json();
          
          if (data.connected) {
            setIsConnected(true);
            setConnectionStatus('connected');
            setQrCode(null);
            connectWebSocket();
            clearInterval(pollConnection);
          }
        }, 2000);
        
        // Clear polling after 5 minutes
        setTimeout(() => clearInterval(pollConnection), 300000);
      }
    } catch (error) {
      console.error('WhatsApp initialization failed:', error);
      setConnectionStatus('error');
    }
  };

  // Connect WebSocket for real-time messages
  const connectWebSocket = () => {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/whatsapp/ws`;
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('WhatsApp WebSocket connected');
    };
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'message':
          handleIncomingMessage(data.message);
          break;
        case 'status':
          updateMessageStatus(data.messageId, data.status);
          break;
        case 'typing':
          setIsTyping(data.isTyping);
          break;
        case 'presence':
          setLastSeen(data.lastSeen);
          break;
      }
    };
    
    wsRef.current.onerror = (error) => {
      console.error('WhatsApp WebSocket error:', error);
    };
  };

  // Load message history
  const loadMessageHistory = async () => {
    if (!contact?.phone) return;
    
    try {
      const response = await fetch(`/api/whatsapp/messages?phone=${contact.phone}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load WhatsApp messages:', error);
    }
  };

  // Handle incoming messages
  const handleIncomingMessage = (message) => {
    if (message.from === contact?.phone) {
      setMessages(prev => [...prev, {
        id: message.id,
        text: message.body,
        type: message.type,
        media: message.media,
        timestamp: message.timestamp,
        sender: 'contact',
        status: 'received'
      }]);
      
      // Mark as read
      markAsRead(message.id);
      
      // Auto-respond if enabled
      checkAutoResponse(message);
    }
  };

  // Send text message
  const sendMessage = async () => {
    if (!messageText.trim() || !isConnected) return;
    
    const messageId = Date.now().toString();
    const newMessage = {
      id: messageId,
      text: messageText,
      timestamp: new Date().toISOString(),
      sender: 'me',
      status: 'sending'
    };
    
    // Add to messages immediately (optimistic update)
    setMessages(prev => [...prev, newMessage]);
    setMessageText('');
    
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: contact.phone,
          message: messageText,
          messageId: messageId
        })
      });
      
      if (response.ok) {
        updateMessageStatus(messageId, 'sent');
        onMessageSent?.({ ...newMessage, status: 'sent' });
      } else {
        updateMessageStatus(messageId, 'failed');
      }
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      updateMessageStatus(messageId, 'failed');
    }
  };

  // Send media message
  const sendMedia = async (file, caption = '') => {
    if (!file || !isConnected) return;
    
    const messageId = Date.now().toString();
    const newMessage = {
      id: messageId,
      text: caption,
      media: {
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('video/') ? 'video' :
              file.type.startsWith('audio/') ? 'audio' : 'document',
        url: URL.createObjectURL(file),
        filename: file.name,
        size: file.size
      },
      timestamp: new Date().toISOString(),
      sender: 'me',
      status: 'sending'
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMediaPreview(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('to', contact.phone);
      formData.append('caption', caption);
      formData.append('messageId', messageId);
      
      const response = await fetch('/api/whatsapp/send-media', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        updateMessageStatus(messageId, 'sent');
      } else {
        updateMessageStatus(messageId, 'failed');
      }
    } catch (error) {
      console.error('Failed to send media:', error);
      updateMessageStatus(messageId, 'failed');
    }
  };

  // Send template message
  const sendTemplate = async (template, variables = {}) => {
    if (!isConnected) return;
    
    let message = template.template;
    
    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    
    const messageId = Date.now().toString();
    const newMessage = {
      id: messageId,
      text: message,
      timestamp: new Date().toISOString(),
      sender: 'me',
      status: 'sending',
      template: template.id
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    try {
      const response = await fetch('/api/whatsapp/send-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: contact.phone,
          templateId: template.id,
          variables: variables,
          messageId: messageId
        })
      });
      
      if (response.ok) {
        updateMessageStatus(messageId, 'sent');
      } else {
        updateMessageStatus(messageId, 'failed');
      }
    } catch (error) {
      console.error('Failed to send template:', error);
      updateMessageStatus(messageId, 'failed');
    }
    
    setSelectedTemplate(null);
  };

  // Update message status
  const updateMessageStatus = (messageId, status) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status } : msg
    ));
  };

  // Mark message as read
  const markAsRead = async (messageId) => {
    try {
      await fetch('/api/whatsapp/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId })
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Check for auto-response triggers
  const checkAutoResponse = async (message) => {
    const text = message.body.toLowerCase();
    
    // Common auto-responses
    const autoResponses = {
      'hello': 'Hi! Thanks for contacting Oakmont Realty. How can I help you today?',
      'hi': 'Hello! How can I assist you with your property needs?',
      'price': 'I\'d be happy to discuss pricing. Let me get you the latest information.',
      'viewing': 'I can arrange a viewing for you. What times work best this week?',
      'available': 'Let me check availability and get back to you shortly.',
      'thanks': 'You\'re welcome! Feel free to ask if you need anything else.'
    };
    
    // Simple keyword matching
    for (const [keyword, response] of Object.entries(autoResponses)) {
      if (text.includes(keyword)) {
        // Delay auto-response to seem natural
        setTimeout(() => {
          setMessageText(response);
        }, 2000);
        break;
      }
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setMediaPreview({
        file,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        url: URL.createObjectURL(file),
        name: file.name
      });
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'sending':
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
      case 'sent':
        return <CheckIcon className="h-4 w-4 text-gray-500" />;
      case 'delivered':
        return <CheckCircleIcon className="h-4 w-4 text-blue-500" />;
      case 'read':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <ExclamationCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (!isConnected && connectionStatus !== 'connected') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-white rounded-xl">
        {connectionStatus === 'connecting' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-lg font-semibold">Connecting to WhatsApp...</p>
          </div>
        )}
        
        {connectionStatus === 'waiting_for_scan' && qrCode && (
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 mb-4">
              <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48 mx-auto" />
            </div>
            <p className="text-lg font-semibold mb-2">Scan QR Code with WhatsApp</p>
            <p className="text-gray-600 text-sm">
              Open WhatsApp on your phone → Menu → WhatsApp Web → Scan this QR code
            </p>
          </div>
        )}
        
        {connectionStatus === 'error' && (
          <div className="text-center">
            <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-red-600">Connection Failed</p>
            <button 
              onClick={initializeWhatsApp}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Retry Connection
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-green-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{contact?.name || 'WhatsApp Chat'}</h3>
            <p className="text-sm opacity-90">
              {contact?.phone}
              {lastSeen && (
                <span className="ml-2">• Last seen {formatTime(lastSeen)}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PhoneIcon className="h-6 w-6 cursor-pointer hover:bg-green-700 p-1 rounded" />
            <div className="w-2 h-2 bg-green-300 rounded-full"></div>
          </div>
        </div>
        {isTyping && (
          <p className="text-sm opacity-75 mt-1">typing...</p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] ${message.sender === 'me' ? 'bg-green-500 text-white' : 'bg-white text-gray-800'} rounded-lg p-3 shadow-sm`}>
              {message.media && (
                <div className="mb-2">
                  {message.media.type === 'image' && (
                    <img src={message.media.url} alt="" className="rounded-lg max-w-full h-auto" />
                  )}
                  {message.media.type === 'video' && (
                    <video controls className="rounded-lg max-w-full h-auto">
                      <source src={message.media.url} type="video/mp4" />
                    </video>
                  )}
                  {message.media.type === 'document' && (
                    <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                      <DocumentArrowUpIcon className="h-6 w-6 text-gray-600" />
                      <span className="text-sm">{message.media.filename}</span>
                    </div>
                  )}
                </div>
              )}
              
              {message.text && (
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              )}
              
              <div className={`flex items-center justify-between mt-2 ${message.sender === 'me' ? 'text-green-100' : 'text-gray-500'}`}>
                <span className="text-xs">{formatTime(message.timestamp)}</span>
                {message.sender === 'me' && (
                  <div className="ml-2">
                    {getStatusIcon(message.status)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Templates */}
      {selectedTemplate && (
        <div className="p-4 bg-blue-50 border-t">
          <p className="text-sm font-semibold text-blue-800 mb-2">Template: {selectedTemplate.name}</p>
          <div className="flex gap-2">
            <button
              onClick={() => sendTemplate(selectedTemplate, { 
                name: contact.name,
                property_address: '123 Oak Street',
                bedrooms: '3',
                bathrooms: '2',
                price: '850,000',
                availability: 'This weekend'
              })}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Send Template
            </button>
            <button
              onClick={() => setSelectedTemplate(null)}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Media Preview */}
      {mediaPreview && (
        <div className="p-4 bg-yellow-50 border-t">
          <div className="flex items-center gap-3">
            {mediaPreview.type === 'image' ? (
              <img src={mediaPreview.url} alt="Preview" className="w-16 h-16 object-cover rounded" />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                <DocumentArrowUpIcon className="h-8 w-8 text-gray-600" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">{mediaPreview.name}</p>
              <input
                type="text"
                placeholder="Add a caption..."
                className="w-full mt-1 px-2 py-1 border rounded text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    sendMedia(mediaPreview.file, e.target.value);
                  }
                }}
              />
            </div>
            <button
              onClick={() => sendMedia(mediaPreview.file)}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Send
            </button>
            <button
              onClick={() => setMediaPreview(null)}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        {/* Quick Templates */}
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {messageTemplates.map(template => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 whitespace-nowrap"
            >
              {template.name}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <DocumentArrowUpIcon className="h-6 w-6" />
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <PhotoIcon className="h-6 w-6" />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!messageText.trim()}
            className={`p-2 rounded-full transition-all ${
              messageText.trim() 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}