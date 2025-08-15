import { useState, useEffect, useRef } from 'react';
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function SMSInterface({ contact, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [optInStatus, setOptInStatus] = useState('pending');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && contact) {
      loadMessages();
      checkOptInStatus();
      loadTemplates();
    }
  }, [isOpen, contact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/sms/history?contactId=${contact.id}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const checkOptInStatus = async () => {
    try {
      const response = await fetch(`/api/sms/opt-status?phone=${contact.phone}`);
      const data = await response.json();
      setOptInStatus(data.status || 'pending');
    } catch (error) {
      console.error('Error checking opt-in status:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/sms/templates');
      const data = await response.json();
      setTemplates(data.templates || getDefaultTemplates());
    } catch (error) {
      setTemplates(getDefaultTemplates());
    }
  };

  const getDefaultTemplates = () => [
    {
      id: 1,
      name: 'Property Viewing Confirmation',
      text: 'Hi {name}, this is {agent} from our real estate team. Confirming your property viewing at {property} on {date} at {time}. Reply YES to confirm or CALL to reschedule.',
    },
    {
      id: 2,
      name: 'New Listing Alert',
      text: 'Hi {name}! A new property matching your criteria just listed: {property}. {bedrooms} bed, {bathrooms} bath at ${price}. Interested? Reply INFO for details.',
    },
    {
      id: 3,
      name: 'Follow Up',
      text: 'Hi {name}, following up on the property you viewed at {property}. Any questions or would you like to make an offer? - {agent}',
    },
    {
      id: 4,
      name: 'Opt-In Request',
      text: 'Hi {name}! Would you like to receive property updates via text? Reply YES to opt-in or STOP to opt-out. Msg & data rates may apply.',
    },
    {
      id: 5,
      name: 'Thank You',
      text: 'Thank you for choosing us, {name}! We appreciate your business. Please leave us a review: [review_link]. - {agent}',
    },
  ];

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    // Check compliance
    if (optInStatus !== 'opted_in' && !newMessage.includes('opt-in')) {
      if (!confirm('This contact has not opted in to SMS. Send opt-in request first?')) {
        return;
      }
      // Auto-send opt-in template
      const optInTemplate = templates.find(t => t.name === 'Opt-In Request');
      if (optInTemplate) {
        setNewMessage(personalizeTemplate(optInTemplate.text));
        return;
      }
    }

    setSending(true);
    const messageToSend = newMessage;
    
    // Add message to UI immediately (optimistic update)
    const tempMessage = {
      id: Date.now(),
      direction: 'outbound',
      body: messageToSend,
      timestamp: new Date().toISOString(),
      status: 'sending',
      from: 'You',
      to: contact.phone,
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: contact.phone,
          message: messageToSend,
          contactId: contact.id,
          contactName: contact.name,
        }),
      });

      const data = await response.json();
      
      // Update message status
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id 
          ? { ...msg, id: data.messageId, status: 'delivered' }
          : msg
      ));

      // Track engagement
      trackEngagement('sms_sent', contact.id);
      
    } catch (error) {
      console.error('Error sending SMS:', error);
      // Update message status to failed
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id 
          ? { ...msg, status: 'failed' }
          : msg
      ));
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const personalizeTemplate = (template) => {
    return template
      .replace('{name}', contact.name.split(' ')[0])
      .replace('{agent}', 'Your Agent')
      .replace('{property}', '123 Main St')
      .replace('{date}', format(new Date(), 'MMM dd'))
      .replace('{time}', '2:00 PM')
      .replace('{bedrooms}', '3')
      .replace('{bathrooms}', '2')
      .replace('{price}', '450,000');
  };

  const useTemplate = (template) => {
    setNewMessage(personalizeTemplate(template.text));
    setShowTemplates(false);
  };

  const trackEngagement = async (event, contactId) => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, contactId, channel: 'sms' }),
      });
    } catch (error) {
      console.error('Error tracking engagement:', error);
    }
  };

  const scheduleMessage = () => {
    // TODO: Implement scheduling UI
    alert('Message scheduling coming soon!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-indigo-600" />
            <div>
              <h3 className="font-semibold">{contact.name}</h3>
              <p className="text-sm text-gray-500">{contact.phone}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {optInStatus === 'opted_in' ? (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Opted In</span>
            ) : optInStatus === 'opted_out' ? (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Opted Out</span>
            ) : (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending Opt-In</span>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No messages yet</p>
              <p className="text-sm mt-2">Start a conversation with {contact.name.split(' ')[0]}</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.direction === 'outbound'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.body}</p>
                  <p className={`text-xs mt-1 ${
                    message.direction === 'outbound' ? 'text-indigo-200' : 'text-gray-500'
                  }`}>
                    {format(new Date(message.timestamp), 'h:mm a')}
                    {message.status === 'sending' && ' • Sending...'}
                    {message.status === 'failed' && ' • Failed'}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Templates */}
        {showTemplates && (
          <div className="border-t p-3 bg-gray-50 max-h-48 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-600 mb-2">Message Templates:</p>
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => useTemplate(template)}
                  className="w-full text-left p-2 hover:bg-white rounded border border-gray-200 transition"
                >
                  <p className="text-sm font-medium">{template.name}</p>
                  <p className="text-xs text-gray-500 truncate">{template.text}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={optInStatus !== 'opted_in' ? 'Send opt-in request first...' : 'Type a message...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="2"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                title="Use template"
              >
                Templates
              </button>
              <button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">
              {160 - newMessage.length} characters remaining
            </p>
            <button
              onClick={scheduleMessage}
              className="text-xs text-indigo-600 hover:text-indigo-700"
            >
              Schedule message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}