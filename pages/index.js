import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [contacts, setContacts] = useState([]);
  const [status, setStatus] = useState({ type: 'info', message: '🎯 VoiCRM Professional System Ready' });
  
  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.recognition) {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        window.recognition = new SpeechRecognition();
        window.recognition.lang = 'en-AU';
        window.recognition.interimResults = false;
        window.recognition.maxAlternatives = 1;
        window.recognition.continuous = false;
        
        window.recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript.trim();
          setTranscript(`You said: "${transcript}"`);
          
          // Parse the input (expecting "Name, Phone" format)
          const parts = transcript.split(',').map(part => part.trim());
          
          if (parts.length >= 2) {
            const name = parts[0];
            const phone = parts[1];
            
            // Add to contacts
            const newContact = {
              id: Date.now(),
              name,
              phone,
              time: new Date().toLocaleTimeString()
            };
            
            setContacts(prev => [newContact, ...prev]);
            setStatus({ type: 'success', message: `✅ Successfully added: ${name} - ${phone}` });
            
            // Voice feedback
            if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(`Added ${name} to contacts`);
              utterance.rate = 0.9;
              speechSynthesis.speak(utterance);
            }
          } else {
            setStatus({ type: 'error', message: '❌ Please say "Name, Phone Number"' });
          }
        };
        
        window.recognition.onspeechend = () => {
          setIsListening(false);
        };
        
        window.recognition.onerror = (event) => {
          setIsListening(false);
          setStatus({ type: 'error', message: `❌ Error: ${event.error}` });
        };
      }
    }
  }, []);
  
  const startVoiceLogging = () => {
    if (!window.recognition) {
      alert('Voice recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }
    
    if (isListening) return;
    
    setIsListening(true);
    setStatus({ type: 'info', message: 'Listening... Say "Name, Phone Number"' });
    setTranscript('Listening for your voice...');
    window.recognition.start();
  };
  
  const statusColors = {
    success: { bg: 'rgba(99, 107, 86, 0.15)', border: 'rgba(99, 107, 86, 0.25)', text: '#636B56' },
    error: { bg: 'rgba(134, 73, 54, 0.15)', border: 'rgba(134, 73, 54, 0.25)', text: '#864936' },
    info: { bg: 'rgba(178, 131, 84, 0.15)', border: 'rgba(178, 131, 84, 0.25)', text: '#B28354' }
  };
  
  return (
    <>
      <Head>
        <title>VoiCRM - Professional Communication Platform</title>
        <meta name="description" content="Voice-Powered CRM for Real Estate Professionals" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F8F2E7 0%, #f5f0e8 50%, #F8F2E7 100%)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: '#000000'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #636B56, #7a8365)',
            borderRadius: '25px',
            padding: '40px',
            marginBottom: '30px',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(99, 107, 86, 0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <h1 style={{
              color: 'white',
              fontSize: '3rem',
              fontWeight: '700',
              marginBottom: '15px',
              textShadow: '0 4px 20px rgba(0,0,0,0.3)',
              letterSpacing: '2px'
            }}>VoiCRM</h1>
            <p style={{
              color: 'rgba(255, 255, 255, 0.95)',
              fontSize: '1.3rem',
              fontWeight: '400',
              marginBottom: '20px'
            }}>Professional Communication Platform</p>
            <div style={{
              display: 'inline-block',
              background: 'linear-gradient(45deg, #864936, #B28354)',
              color: 'white',
              padding: '12px 25px',
              borderRadius: '30px',
              fontWeight: '600',
              fontSize: '1.1rem',
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}>Voice-Powered Excellence</div>
          </div>
          
          {/* Main Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '30px',
            marginBottom: '30px'
          }}>
            {/* Voice Section */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.98)',
              borderRadius: '20px',
              padding: '30px',
              boxShadow: '0 15px 40px rgba(99, 107, 86, 0.08)',
              border: '1px solid rgba(99, 107, 86, 0.1)',
              textAlign: 'center'
            }}>
              <h2 style={{
                color: '#636B56',
                fontWeight: '700',
                fontSize: '1.4rem',
                marginBottom: '20px',
                letterSpacing: '1px'
              }}>🎤 Voice-Powered Communication</h2>
              
              <button
                onClick={startVoiceLogging}
                style={{
                  background: isListening 
                    ? 'linear-gradient(135deg, #636B56, #7a8365)'
                    : 'linear-gradient(135deg, #864936, #B28354)',
                  color: 'white',
                  border: 'none',
                  padding: '25px 50px',
                  borderRadius: '50px',
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 10px 30px rgba(134, 73, 54, 0.25)',
                  margin: '25px 0',
                  transition: 'all 0.4s ease'
                }}
              >
                {isListening ? '🎙️ Listening...' : '🎙️ Start Voice Logging'}
              </button>
              
              <p style={{ 
                color: '#1B1B1B', 
                marginTop: '12px', 
                fontSize: '0.95rem' 
              }}>
                Say: "Name, Phone Number" to create instant contacts
              </p>
              
              {/* Status */}
              <div style={{
                margin: '20px 0',
                padding: '20px',
                borderRadius: '15px',
                textAlign: 'center',
                fontWeight: '500',
                fontSize: '1rem',
                background: statusColors[status.type].bg,
                border: `2px solid ${statusColors[status.type].border}`,
                color: statusColors[status.type].text
              }}>
                {status.message}
              </div>
              
              {/* Transcript */}
              <div style={{
                margin: '15px 0',
                padding: '15px',
                background: 'rgba(248, 242, 231, 0.5)',
                borderRadius: '12px',
                minHeight: '30px',
                fontStyle: 'italic',
                color: '#1B1B1B',
                border: '1px solid rgba(99, 107, 86, 0.1)'
              }}>
                {transcript || 'Voice commands will appear here...'}
              </div>
            </div>
            
            {/* Contacts Section */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.98)',
              borderRadius: '20px',
              padding: '30px',
              boxShadow: '0 15px 40px rgba(99, 107, 86, 0.08)',
              border: '1px solid rgba(99, 107, 86, 0.1)'
            }}>
              <h2 style={{
                color: '#636B56',
                fontWeight: '700',
                fontSize: '1.4rem',
                marginBottom: '20px',
                letterSpacing: '1px'
              }}>👥 Recent Contacts</h2>
              
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {contacts.length === 0 ? (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(248, 242, 231, 0.9), rgba(255, 255, 255, 0.8))',
                    margin: '12px 0',
                    padding: '20px',
                    borderRadius: '15px',
                    borderLeft: '4px solid #B28354'
                  }}>
                    <div style={{ fontWeight: '600', color: '#000000', marginBottom: '5px' }}>
                      Demo Contact
                    </div>
                    <div style={{ color: '#1B1B1B', fontSize: '0.95rem' }}>
                      Click "Start Voice Logging" to add real contacts
                    </div>
                    <div style={{ color: '#B28354', fontSize: '0.85rem', marginTop: '4px' }}>
                      Ready for voice input
                    </div>
                  </div>
                ) : (
                  contacts.map(contact => (
                    <div key={contact.id} style={{
                      background: 'linear-gradient(135deg, rgba(248, 242, 231, 0.9), rgba(255, 255, 255, 0.8))',
                      margin: '12px 0',
                      padding: '20px',
                      borderRadius: '15px',
                      borderLeft: '4px solid #B28354'
                    }}>
                      <div style={{ fontWeight: '600', color: '#000000', marginBottom: '5px' }}>
                        {contact.name}
                      </div>
                      <div style={{ color: '#1B1B1B', fontSize: '0.95rem' }}>
                        {contact.phone}
                      </div>
                      <div style={{ color: '#B28354', fontSize: '0.85rem', marginTop: '4px' }}>
                        {contact.time}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          {/* Stats Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.98)',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 15px 40px rgba(99, 107, 86, 0.08)',
            border: '1px solid rgba(99, 107, 86, 0.1)'
          }}>
            <h2 style={{
              color: '#636B56',
              fontWeight: '700',
              fontSize: '1.4rem',
              marginBottom: '20px',
              letterSpacing: '1px'
            }}>📈 Performance Dashboard</h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '20px',
              marginTop: '25px'
            }}>
              <div style={{
                textAlign: 'center',
                padding: '25px',
                background: 'linear-gradient(135deg, rgba(248, 242, 231, 0.8), rgba(255, 255, 255, 0.6))',
                borderRadius: '15px',
                border: '1px solid rgba(99, 107, 86, 0.15)'
              }}>
                <div style={{ fontSize: '2.2rem', marginBottom: '12px' }}>👥</div>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#636B56', fontSize: '0.95rem' }}>
                  New Contacts
                </div>
                <div style={{ fontWeight: '700', fontSize: '1.2rem', color: '#B28354' }}>
                  {contacts.length}
                </div>
              </div>
              
              <div style={{
                textAlign: 'center',
                padding: '25px',
                background: 'linear-gradient(135deg, rgba(248, 242, 231, 0.8), rgba(255, 255, 255, 0.6))',
                borderRadius: '15px',
                border: '1px solid rgba(99, 107, 86, 0.15)'
              }}>
                <div style={{ fontSize: '2.2rem', marginBottom: '12px' }}>🎯</div>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#636B56', fontSize: '0.95rem' }}>
                  Conversion Rate
                </div>
                <div style={{ fontWeight: '700', fontSize: '1.2rem', color: '#864936' }}>
                  15.8%
                </div>
              </div>
              
              <div style={{
                textAlign: 'center',
                padding: '25px',
                background: 'linear-gradient(135deg, rgba(248, 242, 231, 0.8), rgba(255, 255, 255, 0.6))',
                borderRadius: '15px',
                border: '1px solid rgba(99, 107, 86, 0.15)'
              }}>
                <div style={{ fontSize: '2.2rem', marginBottom: '12px' }}>💰</div>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#636B56', fontSize: '0.95rem' }}>
                  Pipeline Value
                </div>
                <div style={{ fontWeight: '700', fontSize: '1.2rem', color: '#636B56' }}>
                  $2.4M
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}