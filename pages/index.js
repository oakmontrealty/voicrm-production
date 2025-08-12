import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

export default function Home() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDialerOpen, setIsDialerOpen] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  const [callStatus, setCallStatus] = useState('');
  const [callTimer, setCallTimer] = useState(0);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '', company: '', status: 'New Lead' });
  const [contacts, setContacts] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const recognitionRef = useRef(null);

  // Load data on mount
  useEffect(() => {
    loadContacts();
    loadCallHistory();
    initializeSpeechRecognition();
  }, []);

  // Call timer
  useEffect(() => {
    let interval;
    if (currentCall && callStatus === 'connected') {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentCall, callStatus]);

  const initializeSpeechRecognition = () => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'en-AU';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event) => {
        const spoken = event.results[0][0].transcript.trim();
        setTranscript(`Heard: "${spoken}"`);
        processVoiceCommand(spoken);
      };
      
      recognitionRef.current.onerror = (event) => {
        setIsListening(false);
        setTranscript(`Error: ${event.error}`);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  };

  const processVoiceCommand = (text) => {
    const parts = text.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      const name = parts[0];
      const phone = parts[1];
      addContactByVoice(name, phone);
    } else if (text.toLowerCase().includes('call')) {
      const phoneMatch = text.match(/[0-9\s]+/);
      if (phoneMatch) {
        setPhoneNumber(phoneMatch[0].replace(/\s/g, ''));
        setIsDialerOpen(true);
      }
    } else {
      setTranscript(`Say: "Name, Phone Number" or "Call 0400123456"`);
    }
  };

  const startVoiceLogging = () => {
    if (!recognitionRef.current) {
      alert('Voice recognition not supported. Use Chrome or Edge.');
      return;
    }
    setIsListening(true);
    setTranscript('Listening...');
    recognitionRef.current.start();
  };

  const loadContacts = () => {
    const saved = localStorage.getItem('voicrm_contacts');
    if (saved) {
      setContacts(JSON.parse(saved));
    } else {
      // Demo contacts
      const demoContacts = [
        { id: 1, name: 'Sarah Wilson', phone: '0400123456', email: 'sarah@example.com', company: 'Wilson Properties', status: 'Hot Lead', value: 450000, lastContact: new Date().toISOString() },
        { id: 2, name: 'Michael Chen', phone: '0412987654', email: 'michael@example.com', company: 'Chen Investments', status: 'Follow Up', value: 320000, lastContact: new Date().toISOString() }
      ];
      setContacts(demoContacts);
      localStorage.setItem('voicrm_contacts', JSON.stringify(demoContacts));
    }
  };

  const loadCallHistory = () => {
    const saved = localStorage.getItem('voicrm_calls');
    if (saved) {
      setCallHistory(JSON.parse(saved));
    }
  };

  const saveContacts = (contactsList) => {
    localStorage.setItem('voicrm_contacts', JSON.stringify(contactsList));
    setContacts(contactsList);
  };

  const saveCallHistory = (history) => {
    localStorage.setItem('voicrm_calls', JSON.stringify(history));
    setCallHistory(history);
  };

  const addContact = () => {
    if (!newContact.name || !newContact.phone) {
      alert('Name and phone are required');
      return;
    }
    
    const contact = {
      ...newContact,
      id: Date.now(),
      value: Math.floor(Math.random() * 500000 + 100000),
      lastContact: new Date().toISOString()
    };
    
    const updated = [contact, ...contacts];
    saveContacts(updated);
    setNewContact({ name: '', phone: '', email: '', company: '', status: 'New Lead' });
    setShowAddContact(false);
    
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance(`Added ${contact.name} to contacts`);
      speechSynthesis.speak(msg);
    }
  };

  const addContactByVoice = (name, phone) => {
    const contact = {
      id: Date.now(),
      name,
      phone: phone.replace(/\s/g, ''),
      email: '',
      company: '',
      status: 'New Lead',
      value: Math.floor(Math.random() * 500000 + 100000),
      lastContact: new Date().toISOString()
    };
    
    const updated = [contact, ...contacts];
    saveContacts(updated);
    setTranscript(`✅ Added ${name} - ${phone}`);
    
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance(`Added ${name} to contacts`);
      speechSynthesis.speak(msg);
    }
  };

  const deleteContact = (id) => {
    if (confirm('Delete this contact?')) {
      const updated = contacts.filter(c => c.id !== id);
      saveContacts(updated);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const dialNumber = (digit) => {
    if (phoneNumber.length < 15) {
      setPhoneNumber(prev => prev + digit);
    }
  };

  const clearNumber = () => {
    setPhoneNumber('');
  };

  const formatPhoneDisplay = (number) => {
    if (!number) return '';
    if (number.startsWith('04') && number.length <= 10) {
      return number.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    return number;
  };

  const makeCall = async (number = phoneNumber) => {
    if (!number) {
      alert('Please enter a phone number');
      return;
    }

    let formattedNumber = number.replace(/\s/g, '');
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '+61' + formattedNumber.substring(1);
    }

    setCallStatus('connecting');
    setCurrentCall({ number: formattedNumber, startTime: Date.now() });
    setCallTimer(0);

    try {
      const response = await fetch('/api/make-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: formattedNumber })
      });

      const data = await response.json();
      
      if (data.success) {
        setCallStatus('connected');
      } else {
        throw new Error(data.error || 'Call failed');
      }
    } catch (error) {
      console.error('Call error:', error);
      setCallStatus('failed');
      alert(`Call error: ${error.message}`);
      setTimeout(() => {
        setCurrentCall(null);
        setCallStatus('');
      }, 3000);
    }
  };

  const endCall = () => {
    if (currentCall) {
      const duration = callTimer;
      const callRecord = {
        id: Date.now(),
        number: currentCall.number,
        duration: duration,
        timestamp: new Date().toISOString(),
        type: 'outbound'
      };
      
      const history = [callRecord, ...callHistory];
      saveCallHistory(history);
    }
    
    setCurrentCall(null);
    setCallStatus('');
    setCallTimer(0);
    setIsDialerOpen(false);
  };

  const quickDial = (number) => {
    setPhoneNumber(number);
    setIsDialerOpen(true);
    setTimeout(() => makeCall(number), 500);
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalContacts: contacts.length,
    totalValue: contacts.reduce((sum, c) => sum + (c.value || 0), 0),
    callsToday: callHistory.filter(c => 
      new Date(c.timestamp).toDateString() === new Date().toDateString()
    ).length,
    hotLeads: contacts.filter(c => c.status === 'Hot Lead').length
  };

  return (
    <>
      <Head>
        <title>VoiCRM - Professional CRM</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F8F2E7 0%, #f5f0e8 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #636B56, #7a8365)',
          color: 'white',
          padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '2rem' }}>VoiCRM</h1>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>Oakmont Realty</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setActiveTab('dashboard')}
                style={{
                  padding: '8px 16px',
                  background: activeTab === 'dashboard' ? 'rgba(255,255,255,0.2)' : 'transparent',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => setActiveTab('contacts')}
                style={{
                  padding: '8px 16px',
                  background: activeTab === 'contacts' ? 'rgba(255,255,255,0.2)' : 'transparent',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                👥 Contacts
              </button>
              <button
                onClick={() => setActiveTab('calls')}
                style={{
                  padding: '8px 16px',
                  background: activeTab === 'calls' ? 'rgba(255,255,255,0.2)' : 'transparent',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                📞 Calls
              </button>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
          
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '2.5rem' }}>👥</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#636B56' }}>{stats.totalContacts}</div>
                  <div style={{ color: '#666' }}>Total Contacts</div>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '2.5rem' }}>💰</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#636B56' }}>
                    ${(stats.totalValue / 1000000).toFixed(1)}M
                  </div>
                  <div style={{ color: '#666' }}>Pipeline Value</div>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '2.5rem' }}>📞</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#636B56' }}>{stats.callsToday}</div>
                  <div style={{ color: '#666' }}>Calls Today</div>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '2.5rem' }}>🔥</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#636B56' }}>{stats.hotLeads}</div>
                  <div style={{ color: '#666' }}>Hot Leads</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {/* Voice Logger */}
                <div style={{ background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
                  <h3 style={{ color: '#636B56', marginBottom: '15px' }}>🎤 Voice Commands</h3>
                  <button
                    onClick={startVoiceLogging}
                    disabled={isListening}
                    style={{
                      width: '100%',
                      padding: '15px',
                      background: isListening ? 'linear-gradient(135deg, #636B56, #7a8365)' : 'linear-gradient(135deg, #B28354, #c4956b)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      cursor: isListening ? 'not-allowed' : 'pointer',
                      marginBottom: '10px'
                    }}
                  >
                    {isListening ? '🎙️ Listening...' : '🎙️ Start Voice Command'}
                  </button>
                  <div style={{ padding: '10px', background: '#F8F2E7', borderRadius: '8px', fontSize: '0.9rem', color: '#666' }}>
                    {transcript || 'Say: "Sarah Wilson, 0400123456" or "Call 0400123456"'}
                  </div>
                </div>

                {/* Quick Dialer */}
                <div style={{ background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
                  <h3 style={{ color: '#636B56', marginBottom: '15px' }}>📞 Quick Dial</h3>
                  <button
                    onClick={() => setIsDialerOpen(true)}
                    style={{
                      width: '100%',
                      padding: '15px',
                      background: 'linear-gradient(135deg, #636B56, #7a8365)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      marginBottom: '10px'
                    }}
                  >
                    🔢 Open Dialer
                  </button>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="tel"
                      placeholder="Quick dial number..."
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                    <button
                      onClick={() => makeCall()}
                      style={{
                        padding: '10px 20px',
                        background: '#636B56',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      📞
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contacts View */}
          {activeTab === 'contacts' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#636B56' }}>Contacts ({contacts.length})</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      width: '250px'
                    }}
                  />
                  <button
                    onClick={() => setShowAddContact(true)}
                    style={{
                      padding: '10px 20px',
                      background: '#636B56',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    + Add Contact
                  </button>
                </div>
              </div>

              <div style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F8F2E7' }}>
                      <th style={{ padding: '15px', textAlign: 'left', color: '#636B56' }}>Name</th>
                      <th style={{ padding: '15px', textAlign: 'left', color: '#636B56' }}>Phone</th>
                      <th style={{ padding: '15px', textAlign: 'left', color: '#636B56' }}>Company</th>
                      <th style={{ padding: '15px', textAlign: 'left', color: '#636B56' }}>Status</th>
                      <th style={{ padding: '15px', textAlign: 'left', color: '#636B56' }}>Value</th>
                      <th style={{ padding: '15px', textAlign: 'left', color: '#636B56' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map(contact => (
                      <tr key={contact.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '15px' }}>
                          <div style={{ fontWeight: '600' }}>{contact.name}</div>
                          <div style={{ fontSize: '0.85rem', color: '#666' }}>{contact.email}</div>
                        </td>
                        <td style={{ padding: '15px' }}>{contact.phone}</td>
                        <td style={{ padding: '15px' }}>{contact.company || '-'}</td>
                        <td style={{ padding: '15px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            background: contact.status === 'Hot Lead' ? '#ffd4d4' : 
                                       contact.status === 'Follow Up' ? '#ffe4b5' : '#d4ffd4',
                            color: '#333'
                          }}>
                            {contact.status}
                          </span>
                        </td>
                        <td style={{ padding: '15px' }}>${(contact.value / 1000).toFixed(0)}k</td>
                        <td style={{ padding: '15px' }}>
                          <button
                            onClick={() => quickDial(contact.phone)}
                            style={{
                              padding: '6px 12px',
                              background: '#636B56',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              marginRight: '5px'
                            }}
                          >
                            📞
                          </button>
                          <button
                            onClick={() => deleteContact(contact.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Calls View */}
          {activeTab === 'calls' && (
            <div>
              <h2 style={{ color: '#636B56', marginBottom: '20px' }}>Call History</h2>
              <div style={{ background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
                {callHistory.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#999' }}>No calls yet. Make your first call!</p>
                ) : (
                  <div>
                    {callHistory.map(call => (
                      <div key={call.id} style={{
                        padding: '15px',
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: '600' }}>{call.number}</div>
                          <div style={{ fontSize: '0.85rem', color: '#666' }}>
                            {new Date(call.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '600', color: '#636B56' }}>
                            {formatTime(call.duration)}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#666' }}>
                            {call.type}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dialer Modal */}
        {isDialerOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '25px',
              padding: '30px',
              width: '90%',
              maxWidth: '400px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
            }}>
              <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                <button
                  onClick={() => !currentCall && setIsDialerOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: currentCall ? 'not-allowed' : 'pointer',
                    opacity: currentCall ? 0.3 : 1
                  }}
                >
                  ✕
                </button>
              </div>

              {currentCall && (
                <div style={{
                  textAlign: 'center',
                  marginBottom: '20px',
                  padding: '20px',
                  background: 'linear-gradient(135deg, rgba(99, 107, 86, 0.1), rgba(122, 131, 101, 0.05))',
                  borderRadius: '15px'
                }}>
                  <div style={{ fontSize: '1.1rem', color: '#636B56', marginBottom: '10px' }}>
                    {callStatus === 'connecting' ? '📞 Connecting...' : '📞 Connected'}
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '600', color: '#000' }}>
                    {currentCall.number}
                  </div>
                  <div style={{ fontSize: '2rem', color: '#636B56', marginTop: '10px', fontFamily: 'monospace' }}>
                    {formatTime(callTimer)}
                  </div>
                </div>
              )}

              {!currentCall && (
                <>
                  <div style={{
                    background: '#F8F2E7',
                    padding: '20px',
                    borderRadius: '15px',
                    marginBottom: '20px',
                    textAlign: 'center'
                  }}>
                    <input
                      type="tel"
                      value={formatPhoneDisplay(phoneNumber)}
                      placeholder="Enter phone number"
                      readOnly
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        fontSize: '1.8rem',
                        textAlign: 'center',
                        outline: 'none',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px',
                    marginBottom: '20px'
                  }}>
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(digit => (
                      <button
                        key={digit}
                        onClick={() => dialNumber(digit)}
                        style={{
                          padding: '20px',
                          fontSize: '1.5rem',
                          background: 'linear-gradient(135deg, #F8F2E7, #fff)',
                          border: '1px solid #ddd',
                          borderRadius: '10px',
                          cursor: 'pointer'
                        }}
                      >
                        {digit}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                {!currentCall ? (
                  <>
                    <button
                      onClick={clearNumber}
                      style={{
                        flex: 1,
                        padding: '15px',
                        background: '#f0f0f0',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '1rem',
                        cursor: 'pointer'
                      }}
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => makeCall()}
                      style={{
                        flex: 2,
                        padding: '15px',
                        background: 'linear-gradient(135deg, #636B56, #7a8365)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      📞 Call
                    </button>
                  </>
                ) : (
                  <button
                    onClick={endCall}
                    style={{
                      width: '100%',
                      padding: '15px',
                      background: 'linear-gradient(135deg, #864936, #9a5741)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    📞 End Call
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Contact Modal */}
        {showAddContact && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '15px',
              padding: '30px',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
            }}>
              <h3 style={{ color: '#636B56', marginBottom: '20px' }}>Add New Contact</h3>
              
              <input
                type="text"
                placeholder="Name *"
                value={newContact.name}
                onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
              
              <input
                type="tel"
                placeholder="Phone *"
                value={newContact.phone}
                onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
              
              <input
                type="email"
                placeholder="Email"
                value={newContact.email}
                onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
              
              <input
                type="text"
                placeholder="Company"
                value={newContact.company}
                onChange={(e) => setNewContact({...newContact, company: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
              
              <select
                value={newContact.status}
                onChange={(e) => setNewContact({...newContact, status: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '20px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              >
                <option>New Lead</option>
                <option>Hot Lead</option>
                <option>Follow Up</option>
                <option>Customer</option>
                <option>Not Interested</option>
              </select>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowAddContact(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#f0f0f0',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={addContact}
                  style={{
                    flex: 2,
                    padding: '12px',
                    background: '#636B56',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Add Contact
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}