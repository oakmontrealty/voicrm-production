import Link from 'next/link'

export default function Custom404() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      backgroundColor: '#F8F2E7',
      fontFamily: 'Forum, serif'
    }}>
      <h1 style={{ fontSize: '72px', margin: '0', color: '#636B56' }}>404</h1>
      <h2 style={{ fontSize: '24px', color: '#864936', margin: '16px 0' }}>
        Page Not Found
      </h2>
      <p style={{ fontSize: '16px', color: '#666', marginBottom: '32px' }}>
        The page you're looking for doesn't exist.
      </p>
      <Link href="/" style={{ 
        padding: '12px 32px', 
        backgroundColor: '#636B56', 
        color: 'white', 
        textDecoration: 'none', 
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: 'bold'
      }}>
        Return to Dashboard
      </Link>
    </div>
  )
}