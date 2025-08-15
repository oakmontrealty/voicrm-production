// Performance monitoring utilities
export const measureWebVitals = () => {
  if (typeof window === 'undefined') return;
  
  // Measure Core Web Vitals
  if ('PerformanceObserver' in window) {
    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      console.error('LCP measurement failed:', e);
    }

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    let clsEntries = [];
    try {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            clsEntries.push(entry);
          }
        }
        console.log('CLS:', clsValue);
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.error('CLS measurement failed:', e);
    }

    // First Input Delay (FID) / Interaction to Next Paint (INP)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('FID:', entry.processingStart - entry.startTime);
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      console.error('FID measurement failed:', e);
    }
  }

  // Time to First Byte (TTFB)
  if (window.performance && window.performance.timing) {
    const timing = window.performance.timing;
    const ttfb = timing.responseStart - timing.navigationStart;
    console.log('TTFB:', ttfb);
  }
};

// Prefetch critical resources
export const prefetchCriticalResources = () => {
  if (typeof window === 'undefined') return;
  
  // Prefetch DNS for external domains
  const domains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://cdn.jsdelivr.net',
    'https://api.twilio.com',
  ];
  
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
    
    // Also preconnect for critical domains
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = domain;
    preconnect.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect);
  });
};

// Lazy load non-critical scripts
export const lazyLoadScript = (src, onLoad) => {
  if (typeof window === 'undefined') return;
  
  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  script.defer = true;
  
  if (onLoad) {
    script.onload = onLoad;
  }
  
  // Load after page is idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      document.body.appendChild(script);
    });
  } else {
    setTimeout(() => {
      document.body.appendChild(script);
    }, 2000);
  }
};

// Optimize images on the fly
export const optimizeImageSrc = (src, width, quality = 85) => {
  if (!src) return src;
  
  // If it's already an optimized Next.js image URL, return as is
  if (src.includes('/_next/image')) return src;
  
  // For external images, you might want to use a service like Cloudinary
  // For now, return the original source
  return src;
};

// Resource hints for better performance
export const addResourceHints = () => {
  if (typeof window === 'undefined') return;
  
  // Preload critical fonts
  const fonts = [
    '/fonts/Forum-Regular.woff2',
    '/fonts/Avenir-Regular.woff2',
  ];
  
  fonts.forEach(font => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.href = font;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

// Monitor and report performance metrics
export const reportWebVitals = (metric) => {
  // Report to analytics service
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(metric);
  }
};

// Initialize all performance optimizations
export const initPerformanceOptimizations = () => {
  if (typeof window === 'undefined') return;
  
  // Run optimizations when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      prefetchCriticalResources();
      addResourceHints();
      measureWebVitals();
    });
  } else {
    prefetchCriticalResources();
    addResourceHints();
    measureWebVitals();
  }
};