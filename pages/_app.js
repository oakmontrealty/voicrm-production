import '../styles/globals.css'
import Layout from '../components/Layout'
import { AuthProvider } from '../components/auth/AuthProvider'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import { initPerformanceOptimizations, reportWebVitals as reportMetrics } from '../lib/performance'
import { initializeMonitoring, reportWebVitals as reportToMonitoring } from '../lib/monitoring'
import Script from 'next/script'

export function reportWebVitals(metric) {
  reportMetrics(metric);
  reportToMonitoring(metric);
}

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const [isOffline, setIsOffline] = useState(false)
  const [navigationError, setNavigationError] = useState(false)
  
  useEffect(() => {
    // Check authentication
    const publicPaths = ['/login', '/api'];
    const isPublicPath = publicPaths.some(path => router.pathname.startsWith(path));
    
    if (!isPublicPath && typeof window !== 'undefined') {
      const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='));
      if (!token && router.pathname !== '/login') {
        router.push('/login?from=' + encodeURIComponent(router.pathname));
        return;
      }
    }
    // Initialize performance optimizations
    initPerformanceOptimizations();
    
    // Initialize monitoring
    initializeMonitoring();
    
    // Network status monitoring for mobile reliability
    const handleOnline = () => {
      setIsOffline(false)
      console.log('Connection restored')
    }
    
    const handleOffline = () => {
      setIsOffline(true)
      console.log('Connection lost - entering offline mode')
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Fix browser back/forward navigation
    const handleRouteChangeStart = (url) => {
      setNavigationError(false)
      // Save current scroll position
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`scroll-${router.asPath}`, window.scrollY.toString())
      }
    }
    
    const handleRouteChangeComplete = (url) => {
      // Restore scroll position
      const savedPosition = sessionStorage.getItem(`scroll-${url}`)
      if (savedPosition) {
        setTimeout(() => {
          window.scrollTo(0, parseInt(savedPosition))
        }, 100)
      }
    }
    
    const handleRouteChangeError = (err, url) => {
      setNavigationError(true)
      console.error('Navigation error:', err)
      // Attempt recovery
      if (err.cancelled) {
        console.log('Route change cancelled')
      } else {
        // Fallback to home page if navigation fails
        setTimeout(() => {
          router.push('/')
        }, 2000)
      }
    }
    
    router.events.on('routeChangeStart', handleRouteChangeStart)
    router.events.on('routeChangeComplete', handleRouteChangeComplete)
    router.events.on('routeChangeError', handleRouteChangeError)
    
    // Handle browser navigation (back/forward buttons)
    const handlePopState = () => {
      // Ensure the router stays in sync with browser history
      router.replace(router.asPath, undefined, { shallow: true })
    }
    
    window.addEventListener('popstate', handlePopState)
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('popstate', handlePopState)
      router.events.off('routeChangeStart', handleRouteChangeStart)
      router.events.off('routeChangeComplete', handleRouteChangeComplete)
      router.events.off('routeChangeError', handleRouteChangeError)
    }
  }, [router])
  
  // Service worker for offline functionality
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').then(
        registration => console.log('Service Worker registered'),
        error => console.log('Service Worker registration failed:', error)
      )
    }
  }, [])
  
  return (
    <>
      <Head>
        <title>VoiCRM - Every Second Counts</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="description" content="VoiCRM - Professional Real Estate CRM with AI-powered calling" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#636B56" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="VoiCRM" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.twilio.com" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
      </Head>
      
      {/* Load third-party scripts with proper strategy */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'GA_MEASUREMENT_ID');
        `}
      </Script>
      
      <AuthProvider>
        {/* Offline Banner */}
        {isOffline && (
          <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 z-[9999] animate-pulse">
            <span className="text-sm font-medium">📡 Offline Mode - Data will sync when connection returns</span>
          </div>
        )}
        
        {/* Navigation Error Banner */}
        {navigationError && (
          <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 z-[9999]">
            <span className="text-sm font-medium">Navigation error - Redirecting to dashboard...</span>
          </div>
        )}
        
        {Component.getLayout ? (
          Component.getLayout(<Component {...pageProps} />)
        ) : (
          <Layout>
            <Component {...pageProps} />
          </Layout>
        )}
      </AuthProvider>
    </>
  )
}