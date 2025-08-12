import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function VoiCRM() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callActive, setCallActive] = useState(false);
  const [metrics, setMetrics] = useState({
    calls: 47, leads: 23, conversion: 31, revenue: 2.4
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        calls: prev.calls + Math.floor(Math.random() * 3),
        leads: prev.leads + Math.floor(Math.random() * 2),
        conversion: Math.min(100, prev.conversion + Math.random() * 2),
        revenue: +(prev.revenue + Math.random() * 0.1).toFixed(2)
      }));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const makeCall = async () => {
    if (!phoneNumber) return alert('Enter a phone number');
    setCallActive(true);
    try {
      const res = await fetch('/api/make-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phoneNumber })
      });
      console.log('Call initiated');
    } catch (error) {
      console.error('Call failed:', error);
      setCallActive(false);
    }
  };

  const dialNumber = (num) => setPhoneNumber(prev => prev + num);

  return (
    <>
      <Head>
        <title>VoiCRM - Oakmont Realty</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F8F2E7 0%, #f5f0e8 50%, #F8F2E7 100%)', fontFamily: 'system-ui' }}>
        <div style={{ background: 'linear-gradient(135deg, #636B56, #7a8365)', padding: '30px', color: 'white' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', margin: 0 }}>VoiCRM</h1>
              <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>Oakmont Realty - AI-Powered CRM</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '20px' }}>System Active</div>
          </div>
        </div>

        <div style={{ maxWidth: '1400px', margin: '30px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '250px 1fr 350px', gap: '25px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '25px' }}>
            <h3 style={{ color: '#636B56', marginBottom: '20px' }}>Navigation</h3>
            {['Dashboard', 'Contacts', 'Properties'].map(tab => (
              <div key={tab} onClick={() => setActiveTab(tab.toLowerCase())} style={{
                padding: '12px 16px', margin: '8px 0', borderRadius: '12px', cursor: 'pointer',
                background: activeTab === tab.toLowerCase() ? 'linear-gradient(135deg, #636B56, #7a8365)' : 'transparent',
                color: activeTab === tab.toLowerCase() ? 'white' : '#1B1B1B'
              }}>{tab}</div>
            ))}
          </div>

          <div style={{ background: 'white', borderRadius: '20px', padding: '30px' }}>
            {activeTab === 'dashboard' && (
              <>
                <h2 style={{ color: '#636B56', marginBottom: '30px' }}>Dashboard</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                  {[{ label: 'Calls', value: metrics.calls }, { label: 'Leads', value: metrics.leads },
                    { label: 'Conv %', value: metrics.conversion.toFixed(1) }, { label: 'Pipeline', value: '$' + metrics.revenue + 'M' }
                  ].map(stat => (
                    <div key={stat.label} style={{ background: 'linear-gradient(135deg, #F8F2E7, white)', borderRadius: '15px', padding: '20px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#636B56' }}>{stat.value}</div>
                      <div style={{ color: '#666', fontSize: '0.9rem' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'linear-gradient(135deg, rgba(99, 107, 86, 0.05), rgba(178, 131, 84, 0.05))', borderRadius: '15px', padding: '20px' }}>
                  <h3 style={{ color: '#636B56' }}>AI Insights</h3>
                  <div style={{ background: 'white', borderLeft: '4px solid #636B56', padding: '15px', margin: '10px 0', borderRadius: '8px' }}>
                    Lead Score Alert: Sarah Wilson 87% conversion probability
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={{ background: 'white', borderRadius: '20px', padding: '25px' }}>
            <h3 style={{ color: '#636B56', marginBottom: '20px' }}>Smart Dialer</h3>
            <div style={{ background: '#F8F2E7', border: '2px solid #636B56', borderRadius: '15px', padding: '15px', fontSize: '1.5rem', textAlign: 'center', marginBottom: '20px' }}>
              {phoneNumber || 'Enter number...'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
              {['1','2','3','4','5','6','7','8','9','*','0','#'].map(num => (
                <button key={num} onClick={() => dialNumber(num)} style={{
                  background: 'linear-gradient(135deg, #B28354, #c4956b)', color: 'white', border: 'none',
                  padding: '20px', borderRadius: '12px', fontSize: '1.2rem', cursor: 'pointer'
                }}>{num}</button>
              ))}
            </div>
            <button onClick={callActive ? () => setCallActive(false) : makeCall} style={{
              width: '100%', background: callActive ? '#864936' : '#636B56', color: 'white',
              border: 'none', padding: '15px', borderRadius: '12px', fontSize: '1.1rem', cursor: 'pointer'
            }}>{callActive ? 'End Call' : 'Call'}</button>
          </div>
        </div>
      </div>
    </>
  );
}