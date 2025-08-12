export default function Home() {
  return (
    <div style={{ padding: '50px', textAlign: 'center', background: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', fontSize: '48px' }}>🏠 VoiCRM</h1>
      <p style={{ color: '#666', fontSize: '24px' }}>Oakmont Realty CRM System</p>
      <p style={{ marginTop: '40px', fontSize: '18px' }}>✅ Build Successful!</p>
      <button 
        onClick={() => alert('VoiCRM is working!')}
        style={{
          marginTop: '30px',
          padding: '15px 30px',
          fontSize: '18px',
          background: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Test Button
      </button>
    </div>
  );
}