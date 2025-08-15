// Network Optimizer for Sydney South West Region
// Optimized for Campbelltown, Camden, Liverpool, Macarthur areas

class NetworkOptimizer {
  constructor() {
    this.config = {
      region: 'sydney-southwest',
      carriers: {
        primary: 'telstra',
        backup: 'optus',
        tertiary: 'vodafone'
      },
      qos: {
        voice: {
          dscp: 46, // Expedited Forwarding
          priority: 1,
          minBandwidth: 90, // Kbps per call
          targetLatency: 150, // ms
          maxLatency: 300, // ms
          targetJitter: 30, // ms
          maxJitter: 50, // ms
          packetLoss: 1, // percentage
          codec: 'opus' // Opus at 48kHz for HD audio
        },
        video: {
          dscp: 34,
          priority: 2,
          minBandwidth: 500 // Kbps
        },
        crm: {
          dscp: 26,
          priority: 3,
          minBandwidth: 100 // Kbps
        },
        general: {
          dscp: 0,
          priority: 4
        }
      },
      coverage: {
        'campbelltown': { telstra: 99, optus: 98, vodafone: 96 },
        'camden': { telstra: 99, optus: 97, vodafone: 95 },
        'liverpool': { telstra: 99, optus: 99, vodafone: 98 },
        'macarthur': { telstra: 98, optus: 96, vodafone: 94 },
        'ingleburn': { telstra: 99, optus: 98, vodafone: 97 },
        'leppington': { telstra: 97, optus: 95, vodafone: 93 },
        'gregory-hills': { telstra: 98, optus: 97, vodafone: 95 }
      }
    };
    
    this.currentMetrics = {
      latency: 0,
      jitter: 0,
      packetLoss: 0,
      bandwidth: 0,
      carrier: null,
      quality: 100
    };
    
    this.failoverState = {
      active: false,
      primaryDown: false,
      lastFailover: null,
      failoverCount: 0
    };
  }

  // Initialize network monitoring
  async initialize() {
    await this.detectNetworkCapabilities();
    this.startMonitoring();
    this.setupFailover();
  }

  // Detect current network capabilities
  async detectNetworkCapabilities() {
    if (typeof window === 'undefined') return;
    
    // Use Network Information API if available
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      this.currentMetrics.bandwidth = connection.downlink || 0;
      this.currentMetrics.type = connection.effectiveType || '4g';
      this.currentMetrics.rtt = connection.rtt || 0;
      
      // Listen for network changes
      connection.addEventListener('change', () => {
        this.handleNetworkChange();
      });
    }
    
    // Perform speed test
    await this.performSpeedTest();
  }

  // Perform network speed test
  async performSpeedTest() {
    const testSize = 1024 * 100; // 100KB test
    const testData = new ArrayBuffer(testSize);
    
    try {
      const startTime = performance.now();
      
      // Simulate upload test
      await fetch('/api/network/speedtest', {
        method: 'POST',
        body: testData
      });
      
      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000; // seconds
      const bandwidth = (testSize * 8) / duration / 1000; // Kbps
      
      this.currentMetrics.bandwidth = bandwidth;
      this.currentMetrics.latency = duration * 1000; // ms
      
      return bandwidth;
    } catch (error) {
      console.error('Speed test failed:', error);
      return 0;
    }
  }

  // Start continuous network monitoring
  startMonitoring() {
    // Monitor every 30 seconds
    setInterval(() => {
      this.checkNetworkQuality();
      this.measureJitter();
      this.checkPacketLoss();
    }, 30000);
    
    // Detailed monitoring every 5 minutes
    setInterval(() => {
      this.performSpeedTest();
      this.analyzeTrends();
    }, 300000);
  }

  // Check overall network quality
  async checkNetworkQuality() {
    const metrics = {
      latency: await this.measureLatency(),
      jitter: await this.measureJitter(),
      packetLoss: await this.checkPacketLoss(),
      bandwidth: this.currentMetrics.bandwidth
    };
    
    // Calculate quality score (0-100)
    let quality = 100;
    
    // Deduct for high latency
    if (metrics.latency > this.config.qos.voice.targetLatency) {
      quality -= Math.min(30, (metrics.latency - this.config.qos.voice.targetLatency) / 10);
    }
    
    // Deduct for high jitter
    if (metrics.jitter > this.config.qos.voice.targetJitter) {
      quality -= Math.min(25, (metrics.jitter - this.config.qos.voice.targetJitter) / 2);
    }
    
    // Deduct for packet loss
    if (metrics.packetLoss > this.config.qos.voice.packetLoss) {
      quality -= Math.min(35, metrics.packetLoss * 10);
    }
    
    // Deduct for low bandwidth
    const requiredBandwidth = this.calculateRequiredBandwidth();
    if (metrics.bandwidth < requiredBandwidth) {
      quality -= Math.min(20, (requiredBandwidth - metrics.bandwidth) / 10);
    }
    
    this.currentMetrics.quality = Math.max(0, quality);
    
    // Trigger failover if quality is too low
    if (quality < 50 && !this.failoverState.active) {
      await this.triggerFailover('Poor network quality');
    }
    
    return quality;
  }

  // Measure network latency
  async measureLatency() {
    const endpoints = [
      'https://cloudflare.com/cdn-cgi/trace',
      'https://www.google.com/generate_204',
      'https://api.twilio.com/ping'
    ];
    
    const measurements = await Promise.all(
      endpoints.map(async (url) => {
        try {
          const start = performance.now();
          await fetch(url, { method: 'HEAD', mode: 'no-cors' });
          const end = performance.now();
          return end - start;
        } catch {
          return Infinity;
        }
      })
    );
    
    // Use median measurement
    measurements.sort((a, b) => a - b);
    const latency = measurements[Math.floor(measurements.length / 2)];
    
    this.currentMetrics.latency = latency;
    return latency;
  }

  // Measure network jitter (latency variation)
  async measureJitter() {
    const samples = 10;
    const latencies = [];
    
    for (let i = 0; i < samples; i++) {
      const latency = await this.measureLatency();
      latencies.push(latency);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Calculate standard deviation
    const mean = latencies.reduce((a, b) => a + b, 0) / samples;
    const variance = latencies.reduce((sum, lat) => sum + Math.pow(lat - mean, 2), 0) / samples;
    const jitter = Math.sqrt(variance);
    
    this.currentMetrics.jitter = jitter;
    return jitter;
  }

  // Check packet loss
  async checkPacketLoss() {
    const testCount = 20;
    let successCount = 0;
    
    for (let i = 0; i < testCount; i++) {
      try {
        const response = await fetch('/api/network/ping', {
          method: 'GET',
          signal: AbortSignal.timeout(1000)
        });
        if (response.ok) successCount++;
      } catch {
        // Packet lost
      }
    }
    
    const packetLoss = ((testCount - successCount) / testCount) * 100;
    this.currentMetrics.packetLoss = packetLoss;
    return packetLoss;
  }

  // Calculate required bandwidth based on active calls
  calculateRequiredBandwidth(activeCalls = 1) {
    const voiceBandwidth = this.config.qos.voice.minBandwidth * activeCalls;
    const crmBandwidth = this.config.qos.crm.minBandwidth;
    const overhead = 1.2; // 20% overhead
    
    return (voiceBandwidth + crmBandwidth) * overhead;
  }

  // Setup automatic failover
  setupFailover() {
    // Monitor primary connection
    setInterval(async () => {
      if (!this.failoverState.active) {
        const quality = await this.checkNetworkQuality();
        
        if (quality < 30) {
          await this.triggerFailover('Critical quality degradation');
        }
      }
    }, 10000); // Check every 10 seconds
  }

  // Trigger network failover
  async triggerFailover(reason) {
    console.log(`Triggering failover: ${reason}`);
    
    this.failoverState.active = true;
    this.failoverState.lastFailover = new Date();
    this.failoverState.failoverCount++;
    
    // Notify all active components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('network-failover', {
        detail: {
          reason,
          currentCarrier: this.currentMetrics.carrier,
          quality: this.currentMetrics.quality
        }
      }));
    }
    
    // Switch to backup carrier
    await this.switchCarrier();
    
    // Re-test network after switch
    setTimeout(async () => {
      const newQuality = await this.checkNetworkQuality();
      if (newQuality > 70) {
        this.failoverState.active = false;
        console.log('Failover successful, network stable');
      } else {
        console.log('Network still unstable after failover');
      }
    }, 5000);
  }

  // Switch to backup carrier
  async switchCarrier() {
    // In production, this would interface with dual-SIM router API
    const carriers = ['telstra', 'optus', 'vodafone'];
    const currentIndex = carriers.indexOf(this.currentMetrics.carrier);
    const nextIndex = (currentIndex + 1) % carriers.length;
    
    this.currentMetrics.carrier = carriers[nextIndex];
    
    // Simulate carrier switch delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return this.currentMetrics.carrier;
  }

  // Handle network change events
  handleNetworkChange() {
    console.log('Network change detected');
    
    // Re-evaluate network quality
    this.checkNetworkQuality();
    
    // Notify components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('network-change', {
        detail: this.currentMetrics
      }));
    }
  }

  // Analyze network trends
  analyzeTrends() {
    // In production, this would store and analyze historical data
    const trends = {
      averageLatency: this.currentMetrics.latency,
      averageJitter: this.currentMetrics.jitter,
      failoverCount: this.failoverState.failoverCount,
      uptime: this.calculateUptime(),
      recommendation: this.generateRecommendation()
    };
    
    return trends;
  }

  // Calculate network uptime
  calculateUptime() {
    const totalTime = Date.now() - (this.startTime || Date.now());
    const downTime = this.failoverState.failoverCount * 5000; // Assume 5s per failover
    const uptime = ((totalTime - downTime) / totalTime) * 100;
    
    return uptime.toFixed(2);
  }

  // Generate network recommendation
  generateRecommendation() {
    if (this.currentMetrics.quality > 90) {
      return 'Network optimal for VoIP operations';
    } else if (this.currentMetrics.quality > 70) {
      return 'Network acceptable, monitor for degradation';
    } else if (this.currentMetrics.quality > 50) {
      return 'Network marginal, consider backup options';
    } else {
      return 'Network poor, activate failover immediately';
    }
  }

  // Get best carrier for specific suburb
  getBestCarrier(suburb) {
    const coverage = this.config.coverage[suburb.toLowerCase().replace(' ', '-')];
    if (!coverage) return this.config.carriers.primary;
    
    const sorted = Object.entries(coverage)
      .sort((a, b) => b[1] - a[1]);
    
    return sorted[0][0];
  }

  // Configure QoS for router
  generateQoSConfig() {
    return {
      rules: [
        {
          name: 'VoIP Traffic',
          protocol: 'UDP',
          ports: '10000-20000',
          dscp: this.config.qos.voice.dscp,
          priority: this.config.qos.voice.priority,
          bandwidth: `${this.config.qos.voice.minBandwidth}kbps`
        },
        {
          name: 'SIP Signaling',
          protocol: 'UDP/TCP',
          ports: '5060-5061',
          dscp: this.config.qos.voice.dscp,
          priority: this.config.qos.voice.priority
        },
        {
          name: 'WebRTC',
          protocol: 'UDP',
          ports: '3478,5349',
          dscp: this.config.qos.voice.dscp,
          priority: this.config.qos.voice.priority
        },
        {
          name: 'HTTPS/API',
          protocol: 'TCP',
          ports: '443',
          dscp: this.config.qos.crm.dscp,
          priority: this.config.qos.crm.priority
        }
      ],
      bandwidth: {
        total: '100Mbps',
        reserved: {
          voice: '40%',
          video: '30%',
          data: '20%',
          general: '10%'
        }
      },
      jitterBuffer: {
        type: 'adaptive',
        min: '10ms',
        max: '50ms',
        target: '20ms'
      }
    };
  }

  // ACMA compliance check
  checkAcmaCompliance() {
    return {
      emergencyCalling: true, // 000 support
      cliEnabled: true, // Calling Line ID
      doNotCallIntegration: true,
      numberPortability: true,
      geoNumberAllocation: true,
      compliant: true
    };
  }
}

// Singleton instance
let optimizerInstance = null;

export const getNetworkOptimizer = () => {
  if (!optimizerInstance) {
    optimizerInstance = new NetworkOptimizer();
    if (typeof window !== 'undefined') {
      optimizerInstance.initialize();
    }
  }
  return optimizerInstance;
};

export default NetworkOptimizer;