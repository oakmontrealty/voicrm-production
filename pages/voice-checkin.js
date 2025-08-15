import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { 
  MicrophoneIcon, 
  MapPinIcon, 
  UserGroupIcon,
  DocumentTextIcon,
  BellIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  SpeakerWaveIcon,
  StopIcon
} from '@heroicons/react/24/solid';

export default function VoiceCheckIn() {
  // State management
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [matchedProperty, setMatchedProperty] = useState(null);
  const [checkedInVisitors, setCheckedInVisitors] = useState([]);
  const [processingCommand, setProcessingCommand] = useState(false);
  const [voiceMode, setVoiceMode] = useState('checkin'); // checkin, priceupdate, reminder
  const [priceUpdates, setPriceUpdates] = useState([]);
  const [reminders, setReminders] = useState([]);
  
  // Speech recognition setup
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);

  // Property database (in production, fetch from API)
  const properties = [
    {
      id: 1,
      address: '123 Oak Street, Parramatta NSW 2150',
      price: 850000,
      bedrooms: 3,
      bathrooms: 2,
      coordinates: { lat: -33.8151, lng: 151.0011 },
      brochureUrl: '/brochures/123-oak-street.pdf',
      virtualTourUrl: 'https://tour.example.com/123-oak'
    },
    {
      id: 2,
      address: '456 Pine Avenue, Westmead NSW 2145',
      price: 1200000,
      bedrooms: 4,
      bathrooms: 3,
      coordinates: { lat: -33.8073, lng: 150.9877 },
      brochureUrl: '/brochures/456-pine-avenue.pdf',
      virtualTourUrl: 'https://tour.example.com/456-pine'
    }
  ];

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-AU';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
          processVoiceCommand(finalTranscript);
        } else {
          setTranscript(prev => prev + interimTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }

    // Get current location on mount
    getCurrentLocation();
    
    // Load saved data
    loadSavedData();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Get current GPS location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setCurrentLocation(location);
          matchPropertyToLocation(location);
        },
        (error) => {
          console.error('Location error:', error);
          speak('Unable to get your location. Please enable GPS.');
        }
      );
    }
  };

  // Match current location to nearest property
  const matchPropertyToLocation = (location) => {
    if (!location) return;

    // Calculate distance to each property
    const propertyDistances = properties.map(property => {
      const distance = calculateDistance(
        location.lat,
        location.lng,
        property.coordinates.lat,
        property.coordinates.lng
      );
      return { ...property, distance };
    });

    // Find closest property within 100 meters
    const closest = propertyDistances
      .filter(p => p.distance < 0.1) // 100 meters in km
      .sort((a, b) => a.distance - b.distance)[0];

    if (closest) {
      setMatchedProperty(closest);
      speak(`You are at ${closest.address}. Ready for voice check-ins.`);
    }
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Process voice commands
  const processVoiceCommand = async (command) => {
    const lowerCommand = command.toLowerCase().trim();
    setProcessingCommand(true);

    try {
      if (voiceMode === 'checkin') {
        await processCheckInCommand(lowerCommand);
      } else if (voiceMode === 'priceupdate') {
        await processPriceUpdateCommand(lowerCommand);
      } else if (voiceMode === 'reminder') {
        await processReminderCommand(lowerCommand);
      }
    } catch (error) {
      console.error('Command processing error:', error);
      speak('Sorry, I couldn\'t process that command. Please try again.');
    } finally {
      setProcessingCommand(false);
    }
  };

  // Process check-in commands
  const processCheckInCommand = async (command) => {
    // Extract name and phone number using regex
    const phoneRegex = /\b(\d{10}|\d{4}\s?\d{3}\s?\d{3})\b/g;
    const phoneMatch = command.match(phoneRegex);
    
    if (!phoneMatch) {
      speak('Please say the visitor\'s name and phone number clearly.');
      return;
    }

    const phone = phoneMatch[0].replace(/\s/g, '');
    const name = command.replace(phoneMatch[0], '').trim()
      .replace(/check in/gi, '')
      .replace(/checking in/gi, '')
      .trim();

    if (!name) {
      speak('I didn\'t catch the name. Please try again.');
      return;
    }

    // Create check-in record
    const checkIn = {
      id: Date.now(),
      name: name,
      phone: phone,
      property: matchedProperty?.address || 'Unknown Property',
      propertyId: matchedProperty?.id,
      timestamp: new Date().toISOString(),
      location: currentLocation,
      method: 'voice'
    };

    // Add to checked-in visitors
    setCheckedInVisitors(prev => [...prev, checkIn]);

    // Save to database
    await saveCheckIn(checkIn);

    // Send welcome message and brochure
    await sendWelcomeMessage(checkIn);

    // Voice confirmation
    speak(`Checked in ${name} at ${matchedProperty?.address}. Welcome message and digital brochure sent to ${phone}.`);
  };

  // Process price update commands
  const processPriceUpdateCommand = async (command) => {
    // Parse price updates like "123 oak street now 900000" or "price reduced to 850k"
    const priceRegex = /(\d+(?:,\d{3})*(?:\.\d+)?)\s?(?:k|thousand|million|m)?/gi;
    const priceMatch = command.match(priceRegex);
    
    if (!priceMatch) {
      speak('Please mention the new price clearly.');
      return;
    }

    // Convert price to number
    let price = priceMatch[0].replace(/,/g, '');
    if (price.includes('k')) {
      price = parseFloat(price.replace('k', '')) * 1000;
    } else if (price.includes('m')) {
      price = parseFloat(price.replace('m', '')) * 1000000;
    } else {
      price = parseFloat(price);
    }

    // Find property in command
    const propertyKeywords = command.match(/\d+\s+\w+\s+(?:street|avenue|road|drive|court)/gi);
    const property = propertyKeywords ? 
      properties.find(p => p.address.toLowerCase().includes(propertyKeywords[0].toLowerCase())) :
      matchedProperty;

    if (!property) {
      speak('Could not identify the property. Please be more specific.');
      return;
    }

    const priceUpdate = {
      id: Date.now(),
      propertyId: property.id,
      propertyAddress: property.address,
      oldPrice: property.price,
      newPrice: price,
      change: price - property.price,
      changePercent: ((price - property.price) / property.price * 100).toFixed(2),
      timestamp: new Date().toISOString(),
      notes: command,
      recordedBy: 'Voice Command'
    };

    setPriceUpdates(prev => [...prev, priceUpdate]);
    
    // Generate AI summary
    const summary = generatePriceUpdateSummary([...priceUpdates, priceUpdate]);
    
    speak(`Price updated for ${property.address}. ${price > property.price ? 'Increased' : 'Decreased'} by ${Math.abs(priceUpdate.changePercent)}%.`);
  };

  // Process reminder commands
  const processReminderCommand = async (command) => {
    // Parse reminders like "call john tomorrow at 2pm" or "follow up with sarah in 3 days"
    const timeKeywords = {
      'tomorrow': 1,
      'today': 0,
      'monday': 'monday',
      'tuesday': 'tuesday',
      'wednesday': 'wednesday',
      'thursday': 'thursday',
      'friday': 'friday',
      'saturday': 'saturday',
      'sunday': 'sunday'
    };

    let reminderText = command;
    let reminderTime = new Date();

    // Extract time information
    Object.keys(timeKeywords).forEach(keyword => {
      if (command.includes(keyword)) {
        if (typeof timeKeywords[keyword] === 'number') {
          reminderTime.setDate(reminderTime.getDate() + timeKeywords[keyword]);
        }
        reminderText = reminderText.replace(keyword, '').trim();
      }
    });

    // Extract specific time if mentioned
    const timeMatch = command.match(/(\d{1,2})(?::(\d{2}))?\s?(am|pm)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      if (timeMatch[3].toLowerCase() === 'pm' && hours !== 12) hours += 12;
      if (timeMatch[3].toLowerCase() === 'am' && hours === 12) hours = 0;
      reminderTime.setHours(hours, timeMatch[2] ? parseInt(timeMatch[2]) : 0);
    }

    const reminder = {
      id: Date.now(),
      text: reminderText,
      scheduledFor: reminderTime.toISOString(),
      createdAt: new Date().toISOString(),
      status: 'pending',
      method: 'voice'
    };

    setReminders(prev => [...prev, reminder]);
    
    // Schedule notification
    scheduleReminder(reminder);
    
    speak(`Reminder set: ${reminderText} for ${reminderTime.toLocaleString()}`);
  };

  // Save check-in to database
  const saveCheckIn = async (checkIn) => {
    try {
      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkIn)
      });
      
      if (!response.ok) throw new Error('Failed to save check-in');
      
      // Save to local storage as backup
      const savedCheckIns = JSON.parse(localStorage.getItem('voice_checkins') || '[]');
      savedCheckIns.push(checkIn);
      localStorage.setItem('voice_checkins', JSON.stringify(savedCheckIns));
      
    } catch (error) {
      console.error('Save check-in error:', error);
    }
  };

  // Send welcome message with digital brochure
  const sendWelcomeMessage = async (checkIn) => {
    const welcomeMessage = `
Welcome to ${checkIn.property}!

Thank you for visiting our open home today. 

Property Details:
- ${matchedProperty?.bedrooms} Bedrooms, ${matchedProperty?.bathrooms} Bathrooms
- Guide Price: $${matchedProperty?.price?.toLocaleString()}

Digital Brochure: ${matchedProperty?.brochureUrl}
Virtual Tour: ${matchedProperty?.virtualTourUrl}

For more information, call Terence on 0494 102 414.

Oakmont Realty - Your trusted real estate partner.
    `.trim();

    try {
      // Send SMS via Twilio
      await fetch('/api/twilio/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: checkIn.phone,
          message: welcomeMessage
        })
      });

      // Send email if available
      if (checkIn.email) {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: checkIn.email,
            subject: `Welcome to ${checkIn.property}`,
            html: generateWelcomeEmail(checkIn)
          })
        });
      }
    } catch (error) {
      console.error('Failed to send welcome message:', error);
    }
  };

  // Generate welcome email HTML
  const generateWelcomeEmail = (checkIn) => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #636B56;">Welcome to ${checkIn.property}</h1>
        <p>Dear ${checkIn.name},</p>
        <p>Thank you for visiting our open home today. We hope you enjoyed viewing the property.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h2 style="color: #864936;">Property Highlights</h2>
          <ul>
            <li>${matchedProperty?.bedrooms} Bedrooms, ${matchedProperty?.bathrooms} Bathrooms</li>
            <li>Guide Price: $${matchedProperty?.price?.toLocaleString()}</li>
            <li>Premium location in ${matchedProperty?.address?.split(',')[1]}</li>
          </ul>
        </div>
        
        <div style="margin: 30px 0;">
          <a href="${matchedProperty?.brochureUrl}" style="background: #636B56; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
            Download Brochure
          </a>
          <a href="${matchedProperty?.virtualTourUrl}" style="background: #864936; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Virtual Tour
          </a>
        </div>
        
        <p>If you have any questions or would like to schedule a private viewing, please don't hesitate to contact us.</p>
        
        <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px;">
          <p><strong>Terence Houhoutas</strong><br>
          Senior Sales Agent<br>
          Phone: 0494 102 414<br>
          Email: terence@oakmontrealty.com.au</p>
        </div>
      </div>
    `;
  };

  // Generate price update summary
  const generatePriceUpdateSummary = (updates) => {
    const summary = {
      totalUpdates: updates.length,
      averageChange: updates.reduce((sum, u) => sum + u.changePercent, 0) / updates.length,
      increases: updates.filter(u => u.change > 0).length,
      decreases: updates.filter(u => u.change < 0).length,
      largestIncrease: Math.max(...updates.map(u => u.change)),
      largestDecrease: Math.min(...updates.map(u => u.change))
    };

    return `
      Price Update Summary:
      - Total Updates: ${summary.totalUpdates}
      - Average Change: ${summary.averageChange.toFixed(2)}%
      - Increases: ${summary.increases}
      - Decreases: ${summary.decreases}
      - Market Trend: ${summary.averageChange > 0 ? 'Rising' : 'Falling'}
    `;
  };

  // Schedule reminder notification
  const scheduleReminder = (reminder) => {
    const timeUntilReminder = new Date(reminder.scheduledFor) - new Date();
    
    if (timeUntilReminder > 0) {
      setTimeout(() => {
        // Show notification
        if (Notification.permission === 'granted') {
          new Notification('VoiCRM Reminder', {
            body: reminder.text,
            icon: '/icons/icon-192x192.png',
            vibrate: [200, 100, 200]
          });
        }
        
        // Speak reminder
        speak(`Reminder: ${reminder.text}`);
        
        // Update status
        setReminders(prev => prev.map(r => 
          r.id === reminder.id ? { ...r, status: 'completed' } : r
        ));
      }, timeUntilReminder);
    }
  };

  // Text-to-speech
  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    synthesisRef.current.speak(utterance);
  };

  // Toggle voice recording
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
      speak(`${voiceMode} mode activated. Listening...`);
    }
  };

  // Load saved data
  const loadSavedData = () => {
    const savedCheckIns = JSON.parse(localStorage.getItem('voice_checkins') || '[]');
    const savedPriceUpdates = JSON.parse(localStorage.getItem('price_updates') || '[]');
    const savedReminders = JSON.parse(localStorage.getItem('voice_reminders') || '[]');
    
    setCheckedInVisitors(savedCheckIns);
    setPriceUpdates(savedPriceUpdates);
    setReminders(savedReminders);
  };

  // Save data when it changes
  useEffect(() => {
    localStorage.setItem('voice_checkins', JSON.stringify(checkedInVisitors));
  }, [checkedInVisitors]);

  useEffect(() => {
    localStorage.setItem('price_updates', JSON.stringify(priceUpdates));
  }, [priceUpdates]);

  useEffect(() => {
    localStorage.setItem('voice_reminders', JSON.stringify(reminders));
  }, [reminders]);

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-[#636B56] mb-2">Voice Command Center</h1>
          <p className="text-gray-600">Voice-activated check-ins, price updates, and reminders</p>
          
          {/* Current Location & Property */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-5 w-5 text-green-600" />
              <span className="text-sm">
                {currentLocation ? 
                  `Location: ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` :
                  'Getting location...'}
              </span>
            </div>
            {matchedProperty && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800 font-medium">
                  At: {matchedProperty.address}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Mode Selection */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setVoiceMode('checkin')}
            className={`p-4 rounded-xl border-2 transition-all ${
              voiceMode === 'checkin' 
                ? 'border-[#636B56] bg-green-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <UserGroupIcon className="h-8 w-8 mx-auto mb-2 text-[#636B56]" />
            <p className="font-semibold">Check-In Mode</p>
            <p className="text-xs text-gray-600 mt-1">Voice check-in visitors</p>
          </button>
          
          <button
            onClick={() => setVoiceMode('priceupdate')}
            className={`p-4 rounded-xl border-2 transition-all ${
              voiceMode === 'priceupdate' 
                ? 'border-[#636B56] bg-green-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <DocumentTextIcon className="h-8 w-8 mx-auto mb-2 text-[#864936]" />
            <p className="font-semibold">Price Updates</p>
            <p className="text-xs text-gray-600 mt-1">Record price changes</p>
          </button>
          
          <button
            onClick={() => setVoiceMode('reminder')}
            className={`p-4 rounded-xl border-2 transition-all ${
              voiceMode === 'reminder' 
                ? 'border-[#636B56] bg-green-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <BellIcon className="h-8 w-8 mx-auto mb-2 text-[#B28354]" />
            <p className="font-semibold">Reminders</p>
            <p className="text-xs text-gray-600 mt-1">Set voice reminders</p>
          </button>
        </div>

        {/* Voice Control */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col items-center">
            <button
              onClick={toggleListening}
              className={`p-8 rounded-full transition-all ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-[#636B56] hover:bg-[#7a8365]'
              }`}
            >
              {isListening ? (
                <StopIcon className="h-12 w-12 text-white" />
              ) : (
                <MicrophoneIcon className="h-12 w-12 text-white" />
              )}
            </button>
            
            <p className="mt-4 text-lg font-semibold">
              {isListening ? 'Listening...' : `Tap to start ${voiceMode} mode`}
            </p>
            
            {/* Voice commands help */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg w-full max-w-md">
              <p className="text-sm font-semibold text-gray-700 mb-2">Voice Commands:</p>
              {voiceMode === 'checkin' && (
                <p className="text-xs text-gray-600">
                  Say: "Check in [Name] [Phone Number]"<br/>
                  Example: "Check in John Smith 0412345678"
                </p>
              )}
              {voiceMode === 'priceupdate' && (
                <p className="text-xs text-gray-600">
                  Say: "[Property] price is now [Amount]"<br/>
                  Example: "123 Oak Street price is now 900k"
                </p>
              )}
              {voiceMode === 'reminder' && (
                <p className="text-xs text-gray-600">
                  Say: "Remind me to [Task] [When]"<br/>
                  Example: "Remind me to call Sarah tomorrow at 2pm"
                </p>
              )}
            </div>
            
            {/* Transcript */}
            {transcript && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg w-full max-w-md">
                <p className="text-sm font-semibold text-blue-800 mb-1">Transcript:</p>
                <p className="text-sm text-blue-600">{transcript}</p>
              </div>
            )}
            
            {processingCommand && (
              <div className="mt-4 flex items-center gap-2 text-yellow-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                <span className="text-sm">Processing command...</span>
              </div>
            )}
          </div>
        </div>

        {/* Check-In List */}
        {voiceMode === 'checkin' && checkedInVisitors.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-[#636B56] mb-4">Today's Check-Ins</h2>
            <div className="space-y-3">
              {checkedInVisitors.slice(-5).reverse().map(visitor => (
                <div key={visitor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{visitor.name}</p>
                    <p className="text-sm text-gray-600">{visitor.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{visitor.property}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(visitor.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    <PaperAirplaneIcon className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price Updates */}
        {voiceMode === 'priceupdate' && priceUpdates.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-[#864936] mb-4">Recent Price Updates</h2>
            <div className="space-y-3">
              {priceUpdates.slice(-5).reverse().map(update => (
                <div key={update.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{update.propertyAddress}</p>
                      <p className="text-sm text-gray-600">
                        ${update.oldPrice.toLocaleString()} → ${update.newPrice.toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      update.change > 0 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {update.change > 0 ? '+' : ''}{update.changePercent}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(update.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reminders */}
        {voiceMode === 'reminder' && reminders.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-[#B28354] mb-4">Voice Reminders</h2>
            <div className="space-y-3">
              {reminders.filter(r => r.status === 'pending').map(reminder => (
                <div key={reminder.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium">{reminder.text}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(reminder.scheduledFor).toLocaleString()}
                    </p>
                  </div>
                  <BellIcon className="h-5 w-5 text-yellow-600" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}