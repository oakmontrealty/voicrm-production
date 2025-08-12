export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#F8F2E7',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          background: '#636B56',
          color: 'white',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{ fontSize: '3rem', margin: '0 0 10px 0' }}>VoiCRM IS NOW LIVE</h1>
          <p style={{ fontSize: '1.2rem', margin: '0' }}>Voice-Powered Real Estate CRM</p>
          <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>Updated: {new Date().toLocaleString()}</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ color: '#636B56' }}>🎤 Voice Commands</h2>
            <button 
              onClick={() => alert('Voice logging is working! This is your VoiCRM app.')}
              style={{
                background: '#B28354',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '25px',
                fontSize: '1.1rem',
                cursor: 'pointer',
                width: '100%',
                marginTop: '20px'
              }}
            >
              Click Me - Start Voice Logging
            </button>
            <p style={{ textAlign: 'center', marginTop: '15px', color: '#666' }}>
              Say: "Name, Phone Number"
            </p>
          </div>

          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ color: '#636B56' }}>👥 Recent Contacts</h2>
            <div style={{
              background: '#F8F2E7',
              padding: '20px',
              borderRadius: '10px',
              marginTop: '20px'
            }}>
              <p style={{ margin: '0', fontWeight: 'bold' }}>Sarah Wilson</p>
              <p style={{ margin: '5px 0', color: '#666' }}>0400-123-456</p>
              <p style={{ margin: '0', fontSize: '0.9rem', color: '#B28354' }}>Added just now</p>
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#636B56' }}>📊 Dashboard</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
            marginTop: '20px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', color: '#636B56', fontWeight: 'bold' }}>12</div>
              <div style={{ color: '#666' }}>New Leads</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', color: '#B28354', fontWeight: 'bold' }}>8</div>
              <div style={{ color: '#666' }}>Calls Today</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', color: '#864936', fontWeight: 'bold' }}>5</div>
              <div style={{ color: '#666' }}>Properties</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', color: '#636B56', fontWeight: 'bold' }}>$2.4M</div>
              <div style={{ color: '#666' }}>Pipeline</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}