function Error({ statusCode }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ fontSize: '48px', margin: '0', color: '#636B56' }}>
        {statusCode || 'Error'}
      </h1>
      <p style={{ fontSize: '18px', color: '#666', marginTop: '16px' }}>
        {statusCode
          ? `An error ${statusCode} occurred on server`
          : 'An error occurred on client'}
      </p>
      <a href="/" style={{ 
        marginTop: '24px', 
        padding: '12px 24px', 
        backgroundColor: '#636B56', 
        color: 'white', 
        textDecoration: 'none', 
        borderRadius: '8px' 
      }}>
        Go Home
      </a>
    </div>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error