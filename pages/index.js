// Simple working VoiCRM - August 12, 2025
import { useState, useEffect } from 'react';

export default function Home() {
  const [status, setStatus] = useState('VoiCRM is loading...');
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    setStatus('VoiCRM Ready - Voice CRM System for Oakmont Realty');
  }, []);

  const addTestContact = () => {
    const newContact = {
      id: Date.now(),
      name: `Test Contact ${Math.floor(Math.random() * 1000)}`,
      phone: `04${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      time: new Date().toLocaleString('en-AU')
    };
    setContacts([newContact, ...contacts]);
    setStatus('✅ Contact added!');
    setTimeout(() => setStatus('VoiCRM Ready'), 2000);
  };

  return (
    <div style={{ 
      padding: '40px',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ 
          color: '#333',
          fontSize: '48px',
          marginBottom: '10px',
          textAlign: 'center'
        }}>
          🏠 VoiCRM
        </h1>
        
        <p style={{ 
          color: '#666',
          fontSize: '20px',
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          Oakmont Realty - Voice-Powered CRM System
        </p>

        <div style={{
          padding: '20px',
          background: status.includes('✅') ? '#d4edda' : '#d1ecf1',
          borderRadius: '10px',
          marginBottom: '30px',
          textAlign: 'center',
          fontSize: '18px',
          color: status.includes('✅') ? '#155724' : '#0c5460',
          border: `2px solid ${status.includes('✅') ? '#c3e6cb' : '#bee5eb'}`
        }}>
          {status}
        </div>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <button 
            onClick={addTestContact}
            style={{
              padding: '20px 40px',
              fontSize: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
              transition: 'transform 0.3s'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-3px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            🎤 Add Test Contact
          </button>
          
          <p style={{ marginTop: '20px', color: '#666', fontSize: '14px' }}>
            Voice features coming soon! Click button to test database.
          </p>
        </div>

        <div>
          <h2 style={{ marginBottom: '20px', color: '#333' }}>
            📋 Contacts ({contacts.length})
          </h2>
          
          {contacts.length === 0 ? (
            <div style={{
              padding: '40px',
              background: '#f8f9fa',
              borderRadius: '10px',
              textAlign: 'center',
              color: '#666'
            }}>
              No contacts yet. Click the button above to add a test contact!
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {contacts.map(contact => (
                <div key={contact.id} style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                  borderRadius: '15px',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
                    {contact.name}
                  </div>
                  <div style={{ color: '#555' }}>
                    📞 {contact.phone}<br />
                    🕒 {contact.time}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}