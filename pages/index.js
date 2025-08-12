import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  'https://didmparfeydjbcuzgaif.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZG1wYXJmZXlkamJjdXpnYWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MzQ4MjMsImV4cCI6MjA2OTUxMDgyM30.3pQvnFHqjLJwEZhDkFsVs6-SPqe87DNf2m0YuVbEuvw'
);

export default function Home() {
  const [contacts, setContacts] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState('Ready to record voice commands');
  const recognitionRef = useRef(null);

  useEffect(() => {
    loadContacts();
    setupSpeechRecognition();
  }, []);

  const loadContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error loading contacts:', error);
        setStatus('Error loading contacts');
      } else {
        setContacts(data || []);
        setStatus(`Loaded ${data?.length || 0} contacts`);
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
      setStatus('Failed to connect to database');
    }
  };

  const setupSpeechRecognition = () => {
    if (typeof window === 'undefined') return;
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-AU';

      recognitionRef.current.onresult = handleSpeechResult;
      recognitionRef.current.onerror = handleSpeechError;
      recognitionRef.current.onend = () => {
        setIsRecording(false);
        setStatus('Recording stopped');
      };
    } else {
      setStatus('Speech recognition not supported in this browser');
    }
  };

  const handleSpeechResult = async (event) => {
    const text = event.results[0][0].transcript;
    setTranscript(text);
    setStatus(`Heard: "${text}"`);
    await parseAndSaveContact(text);
  };

  const handleSpeechError = (event) => {
    console.error('Speech recognition error:', event.error);
    setStatus(`Error: ${event.error}`);
    setIsRecording(false);
  };

  const parseAndSaveContact = async (text) => {
    const phoneMatch = text.match(/\b04\d{8}\b/);
    const phone = phoneMatch ? phoneMatch[0] : null;
    
    let name = text;
    if (phone) {
      name = text.substring(0, text.indexOf(phone)).trim();
    }
    
    name = name.replace(/^(add|create|new|contact|save)/gi, '').trim();
    name = name.replace(/\s*phone\s*/gi, ' ').trim();
    
    if (name && phone) {
      await saveContact(name, phone);
    } else if (name) {
      setStatus(`Got name "${name}" but no phone number. Say: "Name phone 04XXXXXXXX"`);
    } else {
      setStatus('Could not understand. Try: "John Smith phone 0412345678"');
    }
  };

  const saveContact = async (name, phone) => {
    try {
      setStatus(`Saving ${name}...`);
      
      const { data, error } = await supabase
        .from('contacts')
        .insert([
          { 
            name: name,
            phone_number: phone,
            status: 'lead',
            source: 'Voice Command',
            created_at: new Date().toISOString(),
            notes: `Added via voice command on ${new Date().toLocaleString('en-AU')}`
          }
        ])
        .select();
      
      if (error) {
        console.error('Save error:', error);
        setStatus(`Error saving: ${error.message}`);
      } else {
        setStatus(`✅ Saved ${name} - ${phone}`);
        loadContacts();
        setTranscript('');
      }
    } catch (err) {
      console.error('Failed to save:', err);
      setStatus('Failed to save contact');
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      setStatus('Stopped recording');
    } else {
      setTranscript('');
      setStatus('Listening... Say: "Name phone number"');
      setIsRecording(true);
      recognitionRef.current?.start();
    }
  };

  const addTestContact = async () => {
    const testName = `Test Contact ${Math.floor(Math.random() * 1000)}`;
    const testPhone = `04${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
    await saveContact(testName, testPhone);
  };

  return (
    <div style={{ 
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto',
      minHeight: '100vh',
      background: '#f5f5f5'
    }}>
      <h1 style={{ color: '#636B56' }}>🏠 VoiCRM - Oakmont Realty</h1>
      <p style={{ color: '#666' }}>Voice-Powered CRM System</p>
      
      <div style={{
        padding: '15px',
        background: status.includes('Error') ? '#ffe6e6' : status.includes('✅') ? '#e6ffe6' : '#e6f7ff',
        borderRadius: '8px',
        marginBottom: '20px',
        border: `1px solid ${status.includes('Error') ? '#ffb3b3' : status.includes('✅') ? '#b3ffb3' : '#91d5ff'}`
      }}>
        📊 Status: {status}
      </div>

      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '10px',
        marginBottom: '30px',
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <button 
          onClick={toggleRecording}
          style={{
            padding: '25px 50px',
            fontSize: '20px',
            background: isRecording ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'all 0.3s'
          }}
        >
          {isRecording ? '⏹️ Stop Recording' : '🎤 Start Voice Command'}
        </button>
        
        <div style={{ marginTop: '20px' }}>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Say: "John Smith phone 0412345678" or "Add contact Sarah 0498765432"
          </p>
        </div>

        {transcript && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <strong>You said:</strong> "{transcript}"
          </div>
        )}

        <button 
          onClick={addTestContact}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            fontSize: '14px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Add Test Contact (for testing)
        </button>
      </div>

      <div>
        <h2>📋 Recent Contacts ({contacts.length})</h2>
        <button 
          onClick={loadContacts}
          style={{
            marginBottom: '15px',
            padding: '8px 16px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh Contacts
        </button>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '15px'
        }}>
          {contacts.length === 0 ? (
            <p style={{ color: '#666' }}>No contacts yet. Use voice command to add one!</p>
          ) : (
            contacts.map(contact => (
              <div key={contact.id} style={{
                padding: '20px',
                background: 'white',
                borderRadius: '10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #e0e0e0'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>
                  {contact.name || 'Unnamed Contact'}
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>
                  📞 {contact.phone_number || 'No phone'}<br />
                  📧 {contact.email || 'No email'}<br />
                  🏢 {contact.company || 'No company'}<br />
                  📍 Status: <span style={{
                    background: contact.status === 'lead' ? '#ffc107' : '#28a745',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>{contact.status || 'lead'}</span><br />
                  📝 {contact.notes || 'No notes'}<br />
                  🕒 Added: {new Date(contact.created_at).toLocaleString('en-AU')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}