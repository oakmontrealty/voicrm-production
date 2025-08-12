import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDialerOpen, setIsDialerOpen] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  const [callStatus, setCallStatus] = useState('');
  const [callTimer, setCallTimer] = useState(0);
  const [contacts, setContacts] = useState([
    { id: 1, name: 'Test Contact', phone: '+61400000000', status: 'Demo' }
  ]);

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

  const deleteDigit = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const clearNumber = () => {
    setPhoneNumber('');
  };

  const formatPhoneDisplay = (number) => {
    if (!number) return '';
    // Format as: 0400 000 000 for Australian numbers
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

    // Format number for Twilio (add country code if needed)
    let formattedNumber = number.replace(/\s/g, '');
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '+61' + formattedNumber.substring(1);
    }

    setCallStatus('connecting');
    setCurrentCall({ number: formattedNumber, startTime: Date.now() });
    setCallTimer(0);

    try {
      // Call your API endpoint to initiate Twilio call
      const response = await fetch('/api/make-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: formattedNumber })
      });

      const data = await response.json();
      
      if (data.success) {
        setCallStatus('connected');
        // In production, you'd get real call status from Twilio webhooks
      } else {
        throw new Error(data.error || 'Call failed');
      }
    } catch (error) {
      console.error('Call error:', error);
      setCallStatus('failed');
      alert(`Call failed: ${error.message}\n\nNote: To make real calls, add your Twilio credentials to environment variables.`);
      // For demo, simulate a call
      setTimeout(() => {
        setCallStatus('connected');
      }, 2000);
    }
  };

  const endCall = () => {
    if (currentCall) {
      const duration = Math.floor((Date.now() - currentCall.startTime) / 1000);
      console.log(`Call ended. Duration: ${formatTime(duration)}`);
      
      // Save call to history
      const callRecord = {
        number: currentCall.number,
        duration: duration,
        timestamp: new Date().toISOString()
      };
      
      // Save to localStorage for now
      const history = JSON.parse(localStorage.getItem('voicrm_calls') || '[]');
      history.unshift(callRecord);
      localStorage.setItem('voicrm_calls', JSON.stringify(history));
    }
    
    setCurrentCall(null);
    setCallStatus('');
    setCallTimer(0);
    setIsDialerOpen(false);
  };

  const quickDial = (number, name) => {
    setPhoneNumber(number);
    setIsDialerOpen(true);
    setTimeout(() => makeCall(number), 500);
  };

  return (
    <>
      <Head>
        <title>VoiCRM - Professional Dialer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F8F2E7 0%, #f5f0e8 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '20px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #636B56, #7a8365)',
            color: 'white',
            padding: '40px',
            borderRadius: '25px',
            textAlign: 'center',
            marginBottom: '30px',
            boxShadow: '0 20px 60px rgba(99, 107, 86, 0.15)'
          }}>
            <h1 style={{ fontSize: '3rem', margin: '0 0 10px 0', fontWeight: '700' }}>VoiCRM</h1>
            <p style={{ fontSize: '1.2rem', margin: '0', opacity: '0.95' }}>Professional Communication Platform</p>
          </div>

          {/* Main Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
            
            {/* Dialer Card */}
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '20px',
              boxShadow: '0 15px 40px rgba(0,0,0,0.08)'
            }}>
              <h2 style={{ color: '#636B56', marginBottom: '20px' }}>📞 Phone Dialer</h2>
              
              <button
                onClick={() => setIsDialerOpen(true)}
                style={{
                  width: '100%',
                  padding: '20px',
                  background: 'linear-gradient(135deg, #B28354, #c4956b)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '15px',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 10px 30px rgba(178, 131, 84, 0.25)'
                }}
              >
                🔢 Open Dialer
              </button>

              <div style={{ marginTop: '20px' }}>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>Quick Actions:</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0' }}>
                  <li style={{ margin: '5px 0', color: '#636B56' }}>• Click "Open Dialer" to start</li>
                  <li style={{ margin: '5px 0', color: '#636B56' }}>• Enter any phone number</li>
                  <li style={{ margin: '5px 0', color: '#636B56' }}>• Press call to connect</li>
                </ul>
              </div>
            </div>

            {/* Recent Contacts */}
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '20px',
              boxShadow: '0 15px 40px rgba(0,0,0,0.08)'
            }}>
              <h2 style={{ color: '#636B56', marginBottom: '20px' }}>👥 Quick Dial</h2>
              
              {contacts.map(contact => (
                <div key={contact.id} style={{
                  background: '#F8F2E7',
                  padding: '15px',
                  borderRadius: '10px',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#000' }}>{contact.name}</div>
                      <div style={{ color: '#666', fontSize: '0.9rem' }}>{contact.phone}</div>
                    </div>
                    <button
                      onClick={() => quickDial(contact.phone, contact.name)}
                      style={{
                        padding: '8px 16px',
                        background: '#636B56',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      📞 Call
                    </button>
                  </div>
                </div>
              ))}
              
              <div style={{
                marginTop: '20px',
                padding: '15px',
                background: 'linear-gradient(135deg, rgba(99, 107, 86, 0.1), rgba(122, 131, 101, 0.05))',
                borderRadius: '10px',
                border: '1px solid rgba(99, 107, 86, 0.2)'
              }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#636B56' }}>
                  💡 <strong>Tip:</strong> For test calls, use your mobile number
                </p>
              </div>
            </div>
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
                {/* Close button */}
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

                {/* Call Status */}
                {currentCall && (
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '20px',
                    padding: '20px',
                    background: callStatus === 'connected' ? 
                      'linear-gradient(135deg, rgba(99, 107, 86, 0.1), rgba(122, 131, 101, 0.05))' :
                      'linear-gradient(135deg, rgba(178, 131, 84, 0.1), rgba(196, 149, 107, 0.05))',
                    borderRadius: '15px'
                  }}>
                    <div style={{ fontSize: '1.1rem', color: '#636B56', marginBottom: '10px' }}>
                      {callStatus === 'connecting' ? '📞 Connecting...' : 
                       callStatus === 'connected' ? '📞 Connected' :
                       '📞 Call Status'}
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '600', color: '#000' }}>
                      {currentCall.number}
                    </div>
                    <div style={{ fontSize: '2rem', color: '#636B56', marginTop: '10px', fontFamily: 'monospace' }}>
                      {formatTime(callTimer)}
                    </div>
                  </div>
                )}

                {/* Phone Number Display */}
                {!currentCall && (
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
                )}

                {/* Dialpad */}
                {!currentCall && (
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
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
                        onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                      >
                        <div>{digit}</div>
                        <div style={{ fontSize: '0.6rem', color: '#999' }}>
                          {digit === '2' && 'ABC'}
                          {digit === '3' && 'DEF'}
                          {digit === '4' && 'GHI'}
                          {digit === '5' && 'JKL'}
                          {digit === '6' && 'MNO'}
                          {digit === '7' && 'PQRS'}
                          {digit === '8' && 'TUV'}
                          {digit === '9' && 'WXYZ'}
                          {digit === '0' && '+'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
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
                          cursor: 'pointer',
                          boxShadow: '0 10px 30px rgba(99, 107, 86, 0.25)'
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
                        cursor: 'pointer',
                        boxShadow: '0 10px 30px rgba(134, 73, 54, 0.25)'
                      }}
                    >
                      📞 End Call
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}