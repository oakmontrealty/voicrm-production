// Automated Performance Monitoring Setup
// This integrates with various monitoring services

export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      lcp: [],
      fid: [],
      cls: [],
      ttfb: [],
      inp: [],
      fcp: []
    };
    
    this.thresholds = {
      lcp: 2500, // 2.5s
      fid: 100,  // 100ms
      cls: 0.1,  // 0.1
      ttfb: 800, // 800ms
      inp: 200,  // 200ms
      fcp: 1800  // 1.8s
    };
  }

  // Collect Web Vitals
  collectWebVitals(metric) {
    const { name, value, id } = metric;
    
    // Store metric
    if (this.metrics[name.toLowerCase()]) {
      this.metrics[name.toLowerCase()].push({
        value,
        timestamp: Date.now(),
        id
      });
    }
    
    // Check threshold
    this.checkThreshold(name, value);
    
    // Send to monitoring service
    this.sendToMonitoring(metric);
  }

  // Check if metric exceeds threshold
  checkThreshold(name, value) {
    const threshold = this.thresholds[name.toLowerCase()];
    if (threshold && value > threshold) {
      console.warn(`Performance Alert: ${name} (${value}ms) exceeds threshold (${threshold}ms)`);
      
      // Send alert
      this.sendAlert({
        metric: name,
        value,
        threshold,
        severity: this.getSeverity(name, value)
      });
    }
  }

  // Determine severity level
  getSeverity(name, value) {
    const threshold = this.thresholds[name.toLowerCase()];
    if (!threshold) return 'info';
    
    const ratio = value / threshold;
    if (ratio > 2) return 'critical';
    if (ratio > 1.5) return 'warning';
    if (ratio > 1) return 'minor';
    return 'info';
  }

  // Send metrics to monitoring service
  async sendToMonitoring(metric) {
    try {
      // For Google Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', metric.name, {
          value: Math.round(metric.value),
          metric_id: metric.id,
          metric_value: metric.value,
          metric_delta: metric.delta,
          non_interaction: true
        });
      }

      // For custom monitoring endpoint
      if (process.env.NEXT_PUBLIC_MONITORING_ENDPOINT) {
        await fetch(process.env.NEXT_PUBLIC_MONITORING_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metric: metric.name,
            value: metric.value,
            timestamp: Date.now(),
            page: window.location.pathname,
            userAgent: navigator.userAgent
          })
        });
      }
    } catch (error) {
      console.error('Failed to send monitoring data:', error);
    }
  }

  // Send performance alerts
  async sendAlert(alert) {
    try {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.table(alert);
      }

      // Send to alert endpoint in production
      if (process.env.NEXT_PUBLIC_ALERT_ENDPOINT) {
        await fetch(process.env.NEXT_PUBLIC_ALERT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...alert,
            timestamp: Date.now(),
            url: window.location.href
          })
        });
      }
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  // Generate performance report
  generateReport() {
    const report = {
      timestamp: Date.now(),
      url: window.location.href,
      metrics: {}
    };

    // Calculate averages and percentiles
    Object.keys(this.metrics).forEach(key => {
      const values = this.metrics[key].map(m => m.value);
      if (values.length > 0) {
        report.metrics[key] = {
          count: values.length,
          average: this.average(values),
          median: this.median(values),
          p75: this.percentile(values, 75),
          p95: this.percentile(values, 95),
          min: Math.min(...values),
          max: Math.max(...values)
        };
      }
    });

    return report;
  }

  // Helper functions for statistics
  average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  median(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  percentile(arr, p) {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  // Clear old metrics (keep last 100)
  pruneMetrics() {
    Object.keys(this.metrics).forEach(key => {
      if (this.metrics[key].length > 100) {
        this.metrics[key] = this.metrics[key].slice(-100);
      }
    });
  }
}

// Resource timing monitor
export class ResourceMonitor {
  constructor() {
    this.slowResources = [];
    this.threshold = 1000; // 1 second
  }

  checkResourceTiming() {
    if (!window.performance || !window.performance.getEntriesByType) return;

    const resources = window.performance.getEntriesByType('resource');
    
    resources.forEach(resource => {
      const duration = resource.responseEnd - resource.startTime;
      
      if (duration > this.threshold) {
        this.slowResources.push({
          name: resource.name,
          duration: Math.round(duration),
          type: resource.initiatorType,
          size: resource.transferSize || 0
        });

        console.warn(`Slow resource detected: ${resource.name} (${Math.round(duration)}ms)`);
      }
    });

    return this.slowResources;
  }

  getReport() {
    return {
      slowResources: this.slowResources,
      totalSlowResources: this.slowResources.length,
      averageSlowDuration: this.slowResources.length > 0 
        ? Math.round(this.slowResources.reduce((sum, r) => sum + r.duration, 0) / this.slowResources.length)
        : 0
    };
  }
}

// Error tracking
export class ErrorMonitor {
  constructor() {
    this.errors = [];
    this.setupErrorHandlers();
  }

  setupErrorHandlers() {
    if (typeof window === 'undefined') return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'javascript',
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'unhandled_promise',
        message: event.reason?.message || event.reason,
        stack: event.reason?.stack
      });
    });
  }

  logError(error) {
    const errorData = {
      ...error,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.errors.push(errorData);
    
    // Send to monitoring service
    this.sendError(errorData);
  }

  async sendError(error) {
    try {
      if (process.env.NEXT_PUBLIC_ERROR_ENDPOINT) {
        await fetch(process.env.NEXT_PUBLIC_ERROR_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(error)
        });
      }
    } catch (err) {
      console.error('Failed to send error report:', err);
    }
  }
}

// Initialize monitoring
let performanceMonitor;
let resourceMonitor;
let errorMonitor;

export function initializeMonitoring() {
  if (typeof window === 'undefined') return;

  performanceMonitor = new PerformanceMonitor();
  resourceMonitor = new ResourceMonitor();
  errorMonitor = new ErrorMonitor();

  // Check resource timing every 10 seconds
  setInterval(() => {
    resourceMonitor.checkResourceTiming();
  }, 10000);

  // Prune old metrics every minute
  setInterval(() => {
    performanceMonitor.pruneMetrics();
  }, 60000);

  // Generate and log report every 5 minutes
  setInterval(() => {
    const report = {
      performance: performanceMonitor.generateReport(),
      resources: resourceMonitor.getReport(),
      errors: errorMonitor.errors.slice(-10) // Last 10 errors
    };
    
    console.log('Performance Report:', report);
  }, 300000);

  return { performanceMonitor, resourceMonitor, errorMonitor };
}

// Export for use in _app.js
export function reportWebVitals(metric) {
  if (performanceMonitor) {
    performanceMonitor.collectWebVitals(metric);
  }
}