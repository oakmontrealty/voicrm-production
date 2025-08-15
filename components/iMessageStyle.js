import { useState, useEffect, useRef } from 'react';
import { 
  PaperAirplaneIcon,
  PhotoIcon,
  FaceSmileIcon,
  HandThumbUpIcon,
  HeartIcon,
  HandThumbDownIcon,
  ExclamationCircleIcon,
  QuestionMarkCircleIcon,
  FireIcon
} from '@heroicons/react/24/solid';

export default function iMessageStyle({ contact, onSend }) {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState(null);
  const [deviceType, setDeviceType] = useState('unknown');
  const [deliveryStatus, setDeliveryStatus] = useState({});
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // iPhone detection based on phone number patterns and carrier lookup
  useEffect(() => {
    detectDeviceType();
    loadMessageHistory();
  }, [contact]);

  // Detect if recipient likely has iPhone
  const detectDeviceType = async () => {
    try {
      // Check if number is registered with iMessage (via carrier lookup)
      const response = await fetch('/api/device-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: contact.phone })
      });
      
      const data = await response.json();
      setDeviceType(data.deviceType || 'unknown');
      
      // In practice, we can check:
      // 1. Previous message history for "Sent from iPhone" signatures
      // 2. Read receipts patterns
      // 3. Carrier data (AT&T, Verizon iPhone plans)
      // 4. Contact's email domain (@icloud.com, @me.com)
      
    } catch (error) {
      console.error('Device detection failed:', error);
    }
  };

  // Load message history
  const loadMessageHistory = async () => {
    try {
      const response = await fetch(`/api/messages?contactId=${contact.id}`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // Send message with iMessage-like features
  const sendMessage = async (effect = null) => {
    if (!messageText.trim() && !effect) return;

    const message = {
      id: Date.now(),
      text: messageText,
      sender: 'me',
      timestamp: new Date().toISOString(),
      effect: effect,
      status: 'sending',
      deviceType: deviceType
    };

    // Add to messages immediately (optimistic update)
    setMessages(prev => [...prev, message]);
    setMessageText('');
    setShowEffects(false);

    // Animate send
    animateSend();

    try {
      // Send via Twilio with rich features if iPhone detected
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: contact.phone,
          message: messageText,
          effect: effect,
          richMedia: deviceType === 'iphone',
          // If iPhone, we can send:
          // - High quality images
          // - Tapback reactions
          // - Screen effects
          // - Read receipts request
        })
      });

      if (response.ok) {
        updateMessageStatus(message.id, 'delivered');
        
        // Simulate read receipt for iPhone users
        if (deviceType === 'iphone') {
          setTimeout(() => {
            updateMessageStatus(message.id, 'read');
          }, 3000);
        }
      }
    } catch (error) {
      updateMessageStatus(message.id, 'failed');
    }
  };

  // Update message status
  const updateMessageStatus = (messageId, status) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status } : msg
    ));
    setDeliveryStatus(prev => ({ ...prev, [messageId]: status }));
  };

  // Animate send effect
  const animateSend = () => {
    // Add swoosh animation
    const button = document.querySelector('.send-button');
    button?.classList.add('send-animation');
    setTimeout(() => {
      button?.classList.remove('send-animation');
    }, 300);
  };

  // Message reactions (Tapback)
  const addReaction = async (messageId, reaction) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, reaction } 
        : msg
    ));

    // Send reaction notification
    await fetch('/api/messages/reaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageId,
        reaction,
        to: contact.phone
      })
    });
  };

  // Message effects
  const messageEffects = [
    { id: 'slam', name: 'Slam', icon: '💥' },
    { id: 'loud', name: 'Loud', icon: '📢' },
    { id: 'gentle', name: 'Gentle', icon: '🌸' },
    { id: 'invisible', name: 'Invisible Ink', icon: '🫥' },
    { id: 'echo', name: 'Echo', icon: '🔊' },
    { id: 'spotlight', name: 'Spotlight', icon: '🔦' }
  ];

  // Reactions (Tapback)
  const reactions = [
    { id: 'love', icon: HeartIcon, label: 'Love' },
    { id: 'like', icon: HandThumbUpIcon, label: 'Like' },
    { id: 'dislike', icon: HandThumbDownIcon, label: 'Dislike' },
    { id: 'laugh', icon: FaceSmileIcon, label: 'Haha' },
    { id: 'emphasis', icon: ExclamationCircleIcon, label: '!!' },
    { id: 'question', icon: QuestionMarkCircleIcon, label: '?' }
  ];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{contact.name}</h3>
            <p className="text-sm opacity-90">
              {contact.phone} 
              {deviceType === 'iphone' && (
                <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded">
                  iPhone
                </span>
              )}
            </p>
          </div>
          {isTyping && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50" style={{ 
        backgroundImage: 'linear-gradient(180deg, #f5f5f7 0%, #ffffff 100%)'
      }}>
        <div className="space-y-2">
          {messages.map((message, idx) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'} animate-slideIn`}
            >
              <div className="max-w-[70%] relative group">
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    message.sender === 'me'
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-gray-300 text-black rounded-bl-sm'
                  } ${message.effect ? `effect-${message.effect}` : ''}`}
                  onDoubleClick={() => setShowReactions(message.id)}
                >
                  <p className="text-sm">{message.text}</p>
                  
                  {/* Reaction */}
                  {message.reaction && (
                    <div className="absolute -bottom-3 right-0 bg-white rounded-full p-1 shadow-sm border">
                      {reactions.find(r => r.id === message.reaction)?.icon && (
                        <reactions.find(r => r.id === message.reaction).icon className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                  )}
                </div>
                
                {/* Timestamp & Status */}
                <div className={`flex items-center gap-1 mt-1 ${
                  message.sender === 'me' ? 'justify-end' : 'justify-start'
                }`}>
                  <span className="text-xs text-gray-500">
                    {formatTime(message.timestamp)}
                  </span>
                  {message.sender === 'me' && (
                    <span className="text-xs text-gray-500">
                      {message.status === 'delivered' && '✓'}
                      {message.status === 'read' && '✓✓'}
                      {message.status === 'sending' && '○'}
                      {message.status === 'failed' && '!'}
                    </span>
                  )}
                </div>

                {/* Reaction picker (on hover) */}
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white rounded-full shadow-lg p-1 flex gap-1">
                    {reactions.map(reaction => (
                      <button
                        key={reaction.id}
                        onClick={() => addReaction(message.id, reaction.id)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <reaction.icon className="h-4 w-4 text-gray-600" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Effects selector */}
      {showEffects && (
        <div className="p-3 bg-gray-100 border-t">
          <p className="text-xs text-gray-600 mb-2">Send with effect:</p>
          <div className="flex gap-2 overflow-x-auto">
            {messageEffects.map(effect => (
              <button
                key={effect.id}
                onClick={() => {
                  setSelectedEffect(effect.id);
                  sendMessage(effect.id);
                }}
                className="px-3 py-2 bg-white rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <span>{effect.icon}</span>
                <span className="text-sm">{effect.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 bg-white border-t">
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 hover:text-gray-700">
            <PhotoIcon className="h-6 w-6" />
          </button>
          
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={deviceType === 'iphone' ? 'iMessage' : 'Text Message'}
              className="w-full px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {messageText && (
              <button
                onClick={() => setShowEffects(!showEffects)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <FireIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          
          <button
            onClick={() => sendMessage()}
            disabled={!messageText.trim()}
            className={`send-button p-2 rounded-full transition-all ${
              messageText.trim() 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
        
        {deviceType === 'iphone' && (
          <p className="text-xs text-center text-gray-500 mt-2">
            Sending as iMessage to iPhone
          </p>
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }

        .send-animation {
          animation: swoosh 0.3s ease-out;
        }

        @keyframes swoosh {
          0% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(0.8) rotate(180deg);
          }
          100% {
            transform: scale(1) rotate(360deg);
          }
        }

        /* Message effects */
        .effect-slam {
          animation: slam 0.5s ease-out;
        }

        @keyframes slam {
          0% {
            transform: scale(2) rotate(-5deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(2deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        .effect-gentle {
          animation: gentle 1s ease-out;
        }

        @keyframes gentle {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

// Mac/iPhone integration script (for local use)
export const MacIntegration = `
-- AppleScript to send iMessage from Mac
-- Save this as SendiMessage.scpt and call from Node.js

on run {targetPhone, messageText}
    tell application "Messages"
        set targetService to 1st account whose service type = iMessage
        set targetBuddy to participant targetPhone of targetService
        send messageText to targetBuddy
    end tell
end run

-- Usage from Node.js:
-- exec('osascript SendiMessage.scpt "+1234567890" "Hello from VoiCRM"')
`;

// Shortcut integration for iOS
export const iOSShortcut = {
  name: "VoiCRM Send Message",
  description: "Send iMessage from VoiCRM",
  actions: [
    {
      type: "getText",
      parameters: {
        source: "clipboard"
      }
    },
    {
      type: "sendMessage",
      parameters: {
        recipient: "{{contact}}",
        message: "{{text}}"
      }
    }
  ],
  // This can be installed on iPhone and triggered via URL scheme:
  // shortcuts://run-shortcut?name=VoiCRM%20Send%20Message
};