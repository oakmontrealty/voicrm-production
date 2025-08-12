import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';

export default function VoiCRM() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [speedDialerActive, setSpeedDialerActive] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [callbackScheduled, setCallbackScheduled] = useState(null);
  const [lastCallData, setLastCallData] = useState(null);
  const [nextSteps, setNextSteps] = useState([]);
  const [callQueue, setCallQueue] = useState([]);
  const [currentCallDuration, setCurrentCallDuration] = useState(0);
  const [showSmartActions, setShowSmartActions] = useState(false);
  const recognitionRef = useRef(null);
  const callTimerRef = useRef(null);
  const speedDialerRef = useRef(null);
  
  const [contacts, setContacts] = useState([
    { id: 1, name: 'Sarah Wilson', phone: '0412345678', email: 'sarah@example.com', status: 'Hot Lead', value: '$850K', score: 87, lastCall: '2 hours ago', timezone: 'AEST', bestCallTime: '10:00 AM', notes: 'Interested in 4BR properties' },
    { id: 2, name: 'Michael Chen', phone: '0423456789', email: 'michael@example.com', status: 'Qualified', value: '$1.2M', score: 72, lastCall: '1 day ago', timezone: 'AEST', bestCallTime: '2:00 PM', notes: 'Looking for investment' },
    { id: 3, name: 'Emma Johnson', phone: '0434567890', email: 'emma@example.com', status: 'New', value: '$650K', score: 45, lastCall: '3 days ago', timezone: 'AEST', bestCallTime: '11:00 AM', notes: 'First home buyer' },
    { id: 4, name: 'David Brown', phone: '0445678901', email: 'david@example.com', status: 'Callback', value: '$920K', score: 68, lastCall: '5 hours ago', timezone: 'AEST', bestCallTime: '3:00 PM', notes: 'Wants property valuation' },
    { id: 5, name: 'Lisa Anderson', phone: '0456789012', email: 'lisa@example.com', status: 'Meeting Set', value: '$1.5M', score: 92, lastCall: '1 hour ago', timezone: 'AEST', bestCallTime: '9:00 AM', notes: 'Viewing tomorrow 2PM' },
    { id: 6, name: 'James Smith', phone: '0467890123', email: 'james@example.com', status: 'Follow-up', value: '$780K', score: 55, lastCall: '2 days ago', timezone: 'AEST', bestCallTime: '4:00 PM', notes: 'Waiting for finance approval' },
    { id: 7, name: 'Sophie Taylor', phone: '0478901234', email: 'sophie@example.com', status: 'Hot Lead', value: '$1.1M', score: 83, lastCall: '4 hours ago', timezone: 'AEST', bestCallTime: '10:30 AM', notes: 'Urgent - relocating next month' }
  ]);

  const [scheduledCallbacks, setScheduledCallbacks] = useState([
    { id: 1, contactId: 4, name: 'David Brown', time: '3:00 PM', date: 'Today', reason: 'Property valuation discussion' },
    { id: 2, contactId: 1, name: 'Sarah Wilson', time: '10:00 AM', date: 'Tomorrow', reason: 'Show new listings' },
    { id: 3, contactId: 6, name: 'James Smith', time: '4:00 PM', date: 'Today', reason: 'Finance update' }
  ]);

  const [metrics, setMetrics] = useState({
    calls: 47, leads: 23, conversion: 31, revenue: 2.4,
    avgCallDuration: '4:32', responseTime: '2.3 min',
    callbacksToday: 8, speedDialerCalls: 127,
    voiceActions: 34
  });

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-AU';
      recognitionRef.current = recognition;

      recognition.onresult = handleVoiceCommand;
      recognition.onerror = (e) => console.error('Speech recognition error:', e);
    }

    // Auto-update metrics
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        calls: prev.calls + Math.floor(Math.random() * 3),
        speedDialerCalls: prev.speedDialerCalls + Math.floor(Math.random() * 5),
        voiceActions: prev.voiceActions + Math.floor(Math.random() * 2)
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // VOICE TO ACTION - Enhanced voice command handler
  const handleVoiceCommand = (event) => {
    const results = event.results;
    const transcript = Array.from(results)
      .map(result => result[0].transcript)
      .join('')
      .toLowerCase();

    setTranscription(transcript);

    // ADD CONTACT via voice
    if (transcript.includes('add contact') || transcript.includes('new contact')) {
      const parts = transcript.split(',');
      if (parts.length >= 2) {
        const nameMatch = transcript.match(/(?:add contact|new contact)\s+([^,]+)/i);
        const phoneMatch = transcript.match(/(\d{10}|\d{4}\s?\d{3}\s?\d{3})/g);
        
        if (nameMatch && phoneMatch) {
          const name = nameMatch[1].trim();
          const phone = phoneMatch[0].replace(/\s/g, '');
          addContactVoice(name, phone);
          speak(`Contact ${name} added successfully with phone ${phone}`);
        }
      }
    }
    
    // SCHEDULE CALLBACK via voice
    else if (transcript.includes('schedule callback') || transcript.includes('call back')) {
      const timeMatch = transcript.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
      const nameMatch = transcript.match(/(?:with|for)\s+([a-z\s]+?)(?:\s+at|$)/i);
      
      if (timeMatch && nameMatch) {
        scheduleCallbackVoice(nameMatch[1].trim(), timeMatch[1]);
        speak(`Callback scheduled with ${nameMatch[1]} at ${timeMatch[1]}`);
      }
    }
    
    // START SPEED DIALER via voice
    else if (transcript.includes('start speed dialer') || transcript.includes('auto dial')) {
      startSpeedDialer();
      speak('Speed dialer activated. Starting automatic dialing.');
    }
    
    // CALL CONTACT via voice
    else if (transcript.includes('call')) {
      const nameMatch = transcript.match(/call\s+([a-z\s]+?)(?:\s+now|$)/i);
      if (nameMatch) {
        const contact = contacts.find(c => 
          c.name.toLowerCase().includes(nameMatch[1].trim())
        );
        if (contact) {
          setPhoneNumber(contact.phone);
          makeCall();
          speak(`Calling ${contact.name}`);
        }
      }
    }
    
    // ADD NOTE via voice
    else if (transcript.includes('add note') || transcript.includes('make note')) {
      const noteMatch = transcript.match(/(?:add note|make note)\s+(.+)/i);
      if (noteMatch && lastCallData) {
        addNoteToLastCall(noteMatch[1]);
        speak('Note added to last call');
      }
    }
  };

  // Text-to-speech helper
  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  // SPEED DIALER - Automatic sequential dialing
  const startSpeedDialer = () => {
    setSpeedDialerActive(true);
    const availableContacts = contacts.filter(c => 
      c.status === 'Hot Lead' || c.status === 'Follow-up' || c.status === 'Callback'
    );
    
    setCallQueue(availableContacts);
    
    // Start dialing first contact
    if (availableContacts.length > 0) {
      speedDialNext(availableContacts);
    }
  };

  const speedDialNext = (queue) => {
    if (queue.length === 0) {
      setSpeedDialerActive(false);
      speak('Speed dialer completed all calls');
      return;
    }

    const nextContact = queue[0];
    setPhoneNumber(nextContact.phone);
    
    // Auto-dial with delay
    setTimeout(() => {
      makeCall();
      setCallQueue(queue.slice(1));
    }, 3000); // 3 second delay between calls
  };

  // CALL CAROUSEL - Random number selection
  const startCallCarousel = () => {
    const shuffled = [...contacts].sort(() => Math.random() - 0.5);
    setCallQueue(shuffled);
    setCarouselIndex(0);
  };

  const carouselNext = () => {
    setCarouselIndex((prev) => (prev + 1) % callQueue.length);
  };

  const carouselPrevious = () => {
    setCarouselIndex((prev) => (prev - 1 + callQueue.length) % callQueue.length);
  };

  const selectFromCarousel = () => {
    if (callQueue[carouselIndex]) {
      setPhoneNumber(callQueue[carouselIndex].phone);
      makeCall();
    }
  };

  // SMART NEXT STEPS - AI-powered post-call actions
  const generateSmartNextSteps = (callData) => {
    const duration = callData.duration || currentCallDuration;
    const contact = contacts.find(c => c.phone === phoneNumber);
    
    const steps = [];
    
    // Based on call duration
    if (duration < 60) {
      steps.push({
        action: 'Send follow-up SMS',
        reason: 'Short call - may need more info',
        priority: 'high',
        icon: '📱'
      });
    } else if (duration > 300) {
      steps.push({
        action: 'Schedule property viewing',
        reason: 'Long conversation indicates high interest',
        priority: 'high',
        icon: '🏠'
      });
    }
    
    // Based on contact status
    if (contact?.status === 'Hot Lead') {
      steps.push({
        action: 'Send contract template',
        reason: 'Hot lead ready for next step',
        priority: 'high',
        icon: '📄'
      });
      steps.push({
        action: 'Schedule callback tomorrow',
        reason: 'Maintain momentum with hot lead',
        priority: 'medium',
        icon: '📅'
      });
    }
    
    // Based on lead score
    if (contact?.score > 80) {
      steps.push({
        action: 'Add to VIP campaign',
        reason: 'High-value prospect',
        priority: 'medium',
        icon: '⭐'
      });
    }
    
    // Standard follow-ups
    steps.push({
      action: 'Log call notes',
      reason: 'Document conversation details',
      priority: 'low',
      icon: '📝'
    });
    
    steps.push({
      action: 'Update CRM status',
      reason: 'Keep pipeline current',
      priority: 'low',
      icon: '🔄'
    });
    
    setNextSteps(steps);
    setShowSmartActions(true);
  };

  // Enhanced call functions
  const makeCall = async () => {
    if (!phoneNumber) {
      alert('Enter a phone number');
      return;
    }
    
    setCallActive(true);
    setCurrentCallDuration(0);
    setTranscription('Call connected... Recording and transcribing...');
    
    // Start call timer
    callTimerRef.current = setInterval(() => {
      setCurrentCallDuration(prev => prev + 1);
    }, 1000);
    
    // Simulate call to API
    try {
      await fetch('/api/make-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phoneNumber })
      });
    } catch (error) {
      console.error('Call failed:', error);
    }
  };

  const endCall = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    
    const callData = {
      phone: phoneNumber,
      duration: currentCallDuration,
      timestamp: new Date().toISOString(),
      transcription: transcription
    };
    
    setLastCallData(callData);
    setCallActive(false);
    
    // Generate smart next steps based on call
    generateSmartNextSteps(callData);
    
    // Continue speed dialer if active
    if (speedDialerActive && callQueue.length > 0) {
      setTimeout(() => speedDialNext(callQueue), 5000);
    }
  };

  // Voice command functions
  const startVoiceCommand = () => {
    if (!recognitionRef.current) {
      alert('Voice recognition not supported');
      return;
    }
    
    setIsRecording(true);
    recognitionRef.current.start();
    speak('Listening for your command');
    
    setTimeout(() => {
      if (isRecording) {
        recognitionRef.current.stop();
        setIsRecording(false);
      }
    }, 10000);
  };

  const addContactVoice = (name, phone) => {
    const newContact = {
      id: contacts.length + 1,
      name,
      phone,
      email: '',
      status: 'New',
      value: '$0',
      score: 50,
      lastCall: 'Never',
      timezone: 'AEST',
      bestCallTime: '10:00 AM',
      notes: 'Added via voice command'
    };
    
    setContacts(prev => [newContact, ...prev]);
    setMetrics(prev => ({ ...prev, voiceActions: prev.voiceActions + 1 }));
  };

  const scheduleCallbackVoice = (contactName, time) => {
    const contact = contacts.find(c => 
      c.name.toLowerCase().includes(contactName.toLowerCase())
    );
    
    if (contact) {
      const callback = {
        id: scheduledCallbacks.length + 1,
        contactId: contact.id,
        name: contact.name,
        time: time,
        date: 'Today',
        reason: 'Scheduled via voice command'
      };
      
      setScheduledCallbacks(prev => [...prev, callback]);
      setMetrics(prev => ({ ...prev, callbacksToday: prev.callbacksToday + 1 }));
    }
  };

  const addNoteToLastCall = (note) => {
    if (lastCallData) {
      const contact = contacts.find(c => c.phone === lastCallData.phone);
      if (contact) {
        setContacts(prev => prev.map(c => 
          c.id === contact.id 
            ? { ...c, notes: `${c.notes}\n${new Date().toLocaleString()}: ${note}` }
            : c
        ));
      }
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const dialNumber = (num) => setPhoneNumber(prev => prev + num);
  const clearNumber = () => setPhoneNumber('');

  return (
    <>
      <Head>
        <title>VoiCRM - Advanced Real Estate CRM</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F8F2E7 0%, #f5f0e8 50%, #F8F2E7 100%)', fontFamily: 'system-ui' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #636B56, #7a8365)', padding: '20px', color: 'white' }}>
          <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '2rem', margin: 0 }}>VoiCRM</h1>
              <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>Advanced AI-Powered Real Estate CRM</p>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '20px' }}>
                <span>🟢 All Systems Active</span>
              </div>
              <div style={{ fontSize: '0.9rem' }}>Speed Dialer: {speedDialerActive ? '🔴 Active' : '⚪ Ready'}</div>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div style={{ maxWidth: '1600px', margin: '20px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '200px 1fr 350px', gap: '20px' }}>
          {/* Sidebar */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', height: 'fit-content' }}>
            <h3 style={{ fontSize: '0.9rem', color: '#636B56', marginBottom: '15px' }}>Navigation</h3>
            {['Dashboard', 'Contacts', 'Speed Dialer', 'Callbacks', 'Carousel'].map(tab => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                style={{
                  padding: '10px',
                  margin: '5px 0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: activeTab === tab.toLowerCase() ? '#636B56' : 'transparent',
                  color: activeTab === tab.toLowerCase() ? 'white' : '#333',
                  fontSize: '0.85rem'
                }}
              >
                {tab === 'Speed Dialer' && '⚡ '}
                {tab === 'Callbacks' && '📅 '}
                {tab === 'Carousel' && '🎰 '}
                {tab}
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '25px' }}>
            {activeTab === 'dashboard' && (
              <div>
                <h2 style={{ color: '#636B56', marginBottom: '20px' }}>Dashboard</h2>
                
                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '25px' }}>
                  <div style={{ background: '#F8F2E7', borderRadius: '10px', padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#636B56' }}>{metrics.calls}</div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>Total Calls</div>
                  </div>
                  <div style={{ background: '#F8F2E7', borderRadius: '10px', padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#B28354' }}>{metrics.speedDialerCalls}</div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>Speed Dialer</div>
                  </div>
                  <div style={{ background: '#F8F2E7', borderRadius: '10px', padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#864936' }}>{metrics.callbacksToday}</div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>Callbacks</div>
                  </div>
                  <div style={{ background: '#F8F2E7', borderRadius: '10px', padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#636B56' }}>{metrics.voiceActions}</div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>Voice Actions</div>
                  </div>
                  <div style={{ background: '#F8F2E7', borderRadius: '10px', padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#B28354' }}>{metrics.conversion}%</div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>Conversion</div>
                  </div>
                </div>

                {/* Smart Actions Panel */}
                {showSmartActions && nextSteps.length > 0 && (
                  <div style={{ background: 'linear-gradient(135deg, rgba(99, 107, 86, 0.05), rgba(178, 131, 84, 0.05))', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
                    <h3 style={{ color: '#636B56', marginBottom: '15px' }}>🤖 Smart Next Steps (Post-Call AI)</h3>
                    {nextSteps.map((step, i) => (
                      <div key={i} style={{
                        background: 'white',
                        borderLeft: `4px solid ${
                          step.priority === 'high' ? '#864936' :
                          step.priority === 'medium' ? '#B28354' : '#636B56'
                        }`,
                        padding: '12px',
                        margin: '8px 0',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span style={{ fontSize: '1.2rem' }}>{step.icon}</span>
                          <div>
                            <div style={{ fontWeight: '500' }}>{step.action}</div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{step.reason}</div>
                          </div>
                        </div>
                        <button style={{
                          background: '#636B56',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}>Execute</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Scheduled Callbacks */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: '#636B56', marginBottom: '15px' }}>📅 Today's Callbacks</h3>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {scheduledCallbacks.map(callback => (
                      <div key={callback.id} style={{
                        background: '#F8F2E7',
                        padding: '12px',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: '500' }}>{callback.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>{callback.time} - {callback.reason}</div>
                        </div>
                        <button onClick={() => {
                          const contact = contacts.find(c => c.id === callback.contactId);
                          if (contact) {
                            setPhoneNumber(contact.phone);
                            makeCall();
                          }
                        }} style={{
                          background: '#636B56',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}>Call Now</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'speed dialer' && (
              <div>
                <h2 style={{ color: '#636B56', marginBottom: '20px' }}>⚡ Speed Dialer</h2>
                
                <div style={{ background: '#F8F2E7', borderRadius: '10px', padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
                  <h3 style={{ marginBottom: '15px' }}>Automatic Sequential Dialing</h3>
                  <p style={{ marginBottom: '20px', color: '#666' }}>Automatically dial through hot leads and callbacks</p>
                  
                  {!speedDialerActive ? (
                    <button onClick={startSpeedDialer} style={{
                      background: 'linear-gradient(135deg, #636B56, #7a8365)',
                      color: 'white',
                      border: 'none',
                      padding: '15px 30px',
                      borderRadius: '10px',
                      fontSize: '1.1rem',
                      cursor: 'pointer'
                    }}>🚀 Start Speed Dialer</button>
                  ) : (
                    <div>
                      <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>🔴 Speed Dialer Active</div>
                      <div style={{ marginBottom: '15px' }}>Queue: {callQueue.length} contacts remaining</div>
                      {callQueue[0] && (
                        <div style={{ background: 'white', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                          <div style={{ fontWeight: '600' }}>Next: {callQueue[0].name}</div>
                          <div style={{ color: '#666' }}>{callQueue[0].phone}</div>
                        </div>
                      )}
                      <button onClick={() => setSpeedDialerActive(false)} style={{
                        background: '#864936',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}>Stop Speed Dialer</button>
                    </div>
                  )}
                </div>

                <div>
                  <h3 style={{ color: '#636B56', marginBottom: '15px' }}>Speed Dialer Stats</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                    <div style={{ background: '#F8F2E7', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#636B56' }}>{metrics.speedDialerCalls}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>Total Calls</div>
                    </div>
                    <div style={{ background: '#F8F2E7', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#B28354' }}>3.5</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>Calls/Minute</div>
                    </div>
                    <div style={{ background: '#F8F2E7', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#864936' }}>67%</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>Connect Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'carousel' && (
              <div>
                <h2 style={{ color: '#636B56', marginBottom: '20px' }}>🎰 Call Carousel</h2>
                
                <div style={{ background: '#F8F2E7', borderRadius: '10px', padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
                  <h3 style={{ marginBottom: '15px' }}>Random Contact Selection</h3>
                  <button onClick={startCallCarousel} style={{
                    background: '#636B56',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginBottom: '20px'
                  }}>🔀 Shuffle Contacts</button>
                  
                  {callQueue.length > 0 && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
                        <button onClick={carouselPrevious} style={{
                          background: '#B28354',
                          color: 'white',
                          border: 'none',
                          padding: '10px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          width: '40px',
                          height: '40px'
                        }}>←</button>
                        
                        <div style={{
                          background: 'white',
                          padding: '20px',
                          borderRadius: '10px',
                          minWidth: '250px',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                        }}>
                          {callQueue[carouselIndex] && (
                            <>
                              <div style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '10px' }}>
                                {callQueue[carouselIndex].name}
                              </div>
                              <div style={{ color: '#666', marginBottom: '5px' }}>{callQueue[carouselIndex].phone}</div>
                              <div style={{ fontSize: '0.8rem', color: '#999' }}>
                                Status: {callQueue[carouselIndex].status} | Score: {callQueue[carouselIndex].score}%
                              </div>
                            </>
                          )}
                        </div>
                        
                        <button onClick={carouselNext} style={{
                          background: '#B28354',
                          color: 'white',
                          border: 'none',
                          padding: '10px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          width: '40px',
                          height: '40px'
                        }}>→</button>
                      </div>
                      
                      <button onClick={selectFromCarousel} style={{
                        background: 'linear-gradient(135deg, #636B56, #7a8365)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 30px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '1rem'
                      }}>📞 Call Selected Contact</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'callbacks' && (
              <div>
                <h2 style={{ color: '#636B56', marginBottom: '20px' }}>📅 Scheduled Callbacks</h2>
                
                <div style={{ marginBottom: '20px' }}>
                  <button onClick={() => {
                    const now = new Date();
                    const hour = now.getHours();
                    const period = hour >= 12 ? 'PM' : 'AM';
                    const displayHour = hour > 12 ? hour - 12 : hour;
                    speak(`You can schedule a callback by saying: Schedule callback with contact name at time`);
                  }} style={{
                    background: '#636B56',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}>🎤 Voice Schedule Tip</button>
                </div>
                
                <div style={{ display: 'grid', gap: '15px' }}>
                  {scheduledCallbacks.map(callback => (
                    <div key={callback.id} style={{
                      background: 'linear-gradient(135deg, #F8F2E7, white)',
                      padding: '20px',
                      borderRadius: '10px',
                      border: '1px solid #e0e0e0'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <h3 style={{ margin: '0 0 10px 0' }}>{callback.name}</h3>
                          <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                            <span style={{ color: '#666' }}>📅 {callback.date}</span>
                            <span style={{ color: '#666' }}>⏰ {callback.time}</span>
                          </div>
                          <div style={{ color: '#666', fontSize: '0.9rem' }}>Reason: {callback.reason}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={() => {
                            const contact = contacts.find(c => c.id === callback.contactId);
                            if (contact) {
                              setPhoneNumber(contact.phone);
                              makeCall();
                            }
                          }} style={{
                            background: '#636B56',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}>Call Now</button>
                          <button style={{
                            background: '#864936',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}>Cancel</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'contacts' && (
              <div>
                <h2 style={{ color: '#636B56', marginBottom: '20px' }}>Contacts</h2>
                <div style={{ marginBottom: '20px' }}>
                  <button onClick={() => speak('Say: Add contact, then the name, comma, then the phone number')} style={{
                    background: '#B28354',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}>🎤 Voice Add Contact Tip</button>
                </div>
                
                <div style={{ display: 'grid', gap: '15px' }}>
                  {contacts.slice(0, 5).map(contact => (
                    <div key={contact.id} style={{
                      background: '#F8F2E7',
                      padding: '15px',
                      borderRadius: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600' }}>{contact.name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{contact.phone} | Score: {contact.score}%</div>
                        <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '5px' }}>{contact.notes}</div>
                      </div>
                      <button onClick={() => {
                        setPhoneNumber(contact.phone);
                        makeCall();
                      }} style={{
                        background: '#636B56',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}>Call</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Dialer & Voice */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ color: '#636B56', marginBottom: '15px', fontSize: '1rem' }}>📞 Smart Dialer</h3>
            
            {/* Phone Display */}
            <div style={{
              background: '#F8F2E7',
              border: '2px solid #636B56',
              borderRadius: '10px',
              padding: '15px',
              fontSize: '1.3rem',
              fontFamily: 'monospace',
              marginBottom: '15px',
              textAlign: 'center',
              minHeight: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {callActive ? (
                <div>
                  <div>Connected</div>
                  <div style={{ fontSize: '1.5rem', color: '#636B56', marginTop: '5px' }}>
                    {formatDuration(currentCallDuration)}
                  </div>
                </div>
              ) : (
                phoneNumber || 'Enter number...'
              )}
            </div>

            {/* Dialpad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '15px' }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(num => (
                <button
                  key={num}
                  onClick={() => dialNumber(num)}
                  style={{
                    background: 'linear-gradient(135deg, #B28354, #c4956b)',
                    color: 'white',
                    border: 'none',
                    padding: '15px',
                    borderRadius: '8px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Call Actions */}
            {!callActive ? (
              <button onClick={makeCall} style={{
                width: '100%',
                background: 'linear-gradient(135deg, #636B56, #7a8365)',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
                marginBottom: '10px'
              }}>📞 Call</button>
            ) : (
              <button onClick={endCall} style={{
                width: '100%',
                background: 'linear-gradient(135deg, #864936, #9a5741)',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
                marginBottom: '10px'
              }}>📞 End Call</button>
            )}

            <button onClick={clearNumber} style={{
              width: '100%',
              background: '#333',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              marginBottom: '15px'
            }}>Clear</button>

            {/* Voice Command Button */}
            <button onClick={startVoiceCommand} style={{
              width: '100%',
              background: isRecording
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : 'linear-gradient(135deg, #864936, #B28354)',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              marginBottom: '15px'
            }}>
              {isRecording ? '🔴 Recording...' : '🎤 Voice Command'}
            </button>

            {/* Transcription Display */}
            <div style={{
              background: '#F8F2E7',
              border: '1px solid #636B56',
              borderRadius: '8px',
              padding: '12px',
              minHeight: '100px',
              maxHeight: '200px',
              overflow: 'auto',
              marginBottom: '15px'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '5px' }}>Transcription:</div>
              <div style={{ fontSize: '0.9rem' }}>
                {transcription || 'Voice transcription will appear here...'}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h4 style={{ color: '#636B56', marginBottom: '10px', fontSize: '0.9rem' }}>⚡ Quick Actions</h4>
              <div style={{ display: 'grid', gap: '8px' }}>
                <button onClick={startSpeedDialer} style={{
                  background: '#636B56',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}>⚡ Start Speed Dialer</button>
                <button onClick={startCallCarousel} style={{
                  background: '#B28354',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}>🎰 Call Carousel</button>
                <button onClick={() => speak('Voice commands: Add contact, Schedule callback, Call contact name, Start speed dialer')} style={{
                  background: '#864936',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}>🎤 Voice Help</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}