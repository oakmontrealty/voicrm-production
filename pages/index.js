import React from 'react'

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8F2E7 0%, #f5f0e8 50%, #F8F2E7 100%)',
      fontFamily: 'Avenir, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #636B56, #7a8365)',
          borderRadius: '25px',
          padding: '3rem',
          marginBottom: '2rem',
          boxShadow: '0 20px 60px rgba(99, 107, 86, 0.15)'
        }}>
          <h1 style={{
            color: 'white',
            fontSize: '3rem',
            fontWeight: '700',
            marginBottom: '1rem',
            letterSpacing: '2px'
          }}>
            VoiCRM
          </h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.95)',
            fontSize: '1.3rem',
            fontWeight: '400'
          }}>
            Voice-Powered Real Estate CRM Platform
          </p>
          <div style={{
            display: 'inline-block',
            background: 'linear-gradient(45deg, #864936, #B28354)',
            color: 'white',
            padding: '12px 25px',
            borderRadius: '30px',
            fontWeight: '600',
            fontSize: '1.1rem',
            marginTop: '1.5rem',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}>
            🚀 Launching Soon
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          marginTop: '3rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 15px 40px rgba(99, 107, 86, 0.08)',
            border: '1px solid rgba(99, 107, 86, 0.1)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎤</div>
            <h3 style={{ color: '#636B56', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Voice Commands</h3>
            <p style={{ color: '#666', fontSize: '0.95rem' }}>Create contacts and log calls using natural speech</p>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 15px 40px rgba(99, 107, 86, 0.08)',
            border: '1px solid rgba(99, 107, 86, 0.1)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📞</div>
            <h3 style={{ color: '#636B56', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Smart Calling</h3>
            <p style={{ color: '#666', fontSize: '0.95rem' }}>Automated call logging with AI transcription</p>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 15px 40px rgba(99, 107, 86, 0.08)',
            border: '1px solid rgba(99, 107, 86, 0.1)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🤖</div>
            <h3 style={{ color: '#636B56', fontSize: '1.2rem', marginBottom: '0.5rem' }}>AI Intelligence</h3>
            <p style={{ color: '#666', fontSize: '0.95rem' }}>GPT-4 powered insights and lead scoring</p>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 15px 40px rgba(99, 107, 86, 0.08)',
            border: '1px solid rgba(99, 107, 86, 0.1)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏠</div>
            <h3 style={{ color: '#636B56', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Real Estate Focus</h3>
            <p style={{ color: '#666', fontSize: '0.95rem' }}>Built specifically for Australian agents</p>
          </div>
        </div>

        <div style={{
          marginTop: '3rem',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '15px',
          border: '1px solid rgba(99, 107, 86, 0.1)'
        }}>
          <h2 style={{ color: '#636B56', marginBottom: '1rem' }}>System Status</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div>
              <span style={{ color: '#4CAF50', marginRight: '0.5rem' }}>✅</span>
              Database Connected
            </div>
            <div>
              <span style={{ color: '#4CAF50', marginRight: '0.5rem' }}>✅</span>
              AI Services Ready
            </div>
            <div>
              <span style={{ color: '#FF9800', marginRight: '0.5rem' }}>⚠️</span>
              Voice Setup Pending
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '3rem',
          padding: '1rem',
          color: '#666',
          fontSize: '0.9rem'
        }}>
          <p>© 2025 Oakmont Realty. VoiCRM - Professional Communication Platform</p>
          <p style={{ marginTop: '0.5rem' }}>
            Contact: hello@oakmontrealty.com.au | Phone: 1300 501 399
          </p>
        </div>
      </div>
    </div>
  )
}