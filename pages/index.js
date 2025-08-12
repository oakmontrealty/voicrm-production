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
          <h1 style={{ fontSize: '3rem', margin: '0 0 10px 0' }}>VoiCRM</h1>
          <p style={{ fontSize: '1.2rem', margin: '0' }}>Voice-Powered Real Estate CRM</p>
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
            <h2 style={{ color: '#636B56' }}>Voice Commands</h2>
            <button 
              onClick={() => alert('Voice logging ready!')}
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
              Start Voice Logging
            </button>
          </div>

          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ color: '#636B56' }}>Recent Contacts</h2>
            <div style={{
              background: '#F8F2E7',
              padding: '20px',
              borderRadius: '10px',
              marginTop: '20px'
            }}>
              <p style={{ margin: '0', fontWeight: 'bold' }}>Demo Contact</p>
              <p style={{ margin: '5px 0', color: '#666' }}>0400-123-456</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
