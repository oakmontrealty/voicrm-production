import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        
        {/* DNS Prefetch for additional performance */}
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
        
        {/* Fonts with display swap for better performance */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Forum&family=Inter:wght@400;500;600;700&display=swap" 
          rel="stylesheet"
        />
        
        {/* Meta tags for security and performance */}
        <meta name="format-detection" content="telephone=no" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        
        {/* External scripts with SRI (Subresource Integrity) */}
        {/* Add any CDN scripts here with integrity attributes */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}