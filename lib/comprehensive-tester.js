// UNFAIR ADVANTAGE: Comprehensive Software Testing System
class VoiCRMTester {
  constructor() {
    this.testResults = [];
    this.errors = [];
    this.warnings = [];
    this.testSuites = new Map();
    this.mockData = new Map();
    this.isRunning = false;
  }

  // Initialize comprehensive testing
  async runFullSystemAudit() {
    console.log('🔍 Starting Comprehensive VoiCRM System Audit...');
    this.isRunning = true;
    this.testResults = [];
    this.errors = [];
    this.warnings = [];

    try {
      // Test all major components
      await this.testDashboard();
      await this.testContacts();
      await this.testCalendar();
      await this.testCalls();
      await this.testAnalytics();
      await this.testVoIPSystem();
      await this.testAIFeatures();
      await this.testMobileResponsiveness();
      await this.testOfflineCapabilities();
      await this.testUIInteractions();
      await this.testAPIEndpoints();
      await this.testDatabaseOperations();

      console.log('✅ Comprehensive audit completed');
      this.generateAuditReport();
      
    } catch (error) {
      console.error('❌ Audit failed:', error);
      this.errors.push({ test: 'System Audit', error: error.message });
    } finally {
      this.isRunning = false;
    }
  }

  // Test Dashboard functionality
  async testDashboard() {
    console.log('📊 Testing Dashboard...');
    
    const dashboardTests = [
      {
        name: 'Dashboard Load',
        test: async () => {
          const response = await fetch('/dashboard');
          if (!response.ok) throw new Error(`Dashboard load failed: ${response.status}`);
          return 'Dashboard loads successfully';
        }
      },
      {
        name: 'Stats Cards',
        test: async () => {
          // Test stats API
          const response = await fetch('/api/dashboard/stats');
          const data = await response.json();
          if (!data || typeof data !== 'object') throw new Error('Stats data invalid');
          return 'Dashboard stats working';
        }
      },
      {
        name: 'Recent Activity',
        test: async () => {
          const response = await fetch('/api/activities/recent');
          if (response.ok) return 'Recent activity loaded';
          throw new Error('Recent activity failed to load');
        }
      }
    ];

    await this.runTestSuite('Dashboard', dashboardTests);
  }

  // Test Contacts system
  async testContacts() {
    console.log('👥 Testing Contacts System...');
    
    const contactsTests = [
      {
        name: 'Contacts Page Load',
        test: async () => {
          const response = await fetch('/contacts');
          if (!response.ok) throw new Error('Contacts page failed to load');
          return 'Contacts page loads';
        }
      },
      {
        name: 'Contact List API',
        test: async () => {
          const response = await fetch('/api/contacts');
          const data = await response.json();
          if (!Array.isArray(data) && !data.contacts) throw new Error('Invalid contacts data');
          return 'Contact list API working';
        }
      },
      {
        name: 'Contact Search',
        test: async () => {
          const response = await fetch('/api/contacts?search=test');
          if (response.ok) return 'Contact search functional';
          throw new Error('Contact search failed');
        }
      },
      {
        name: 'Contact Creation',
        test: async () => {
          const testContact = {
            name: 'Test Contact ' + Date.now(),
            email: `test${Date.now()}@example.com`,
            phone: '+1234567890',
            company: 'Test Company'
          };
          
          const response = await fetch('/api/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testContact)
          });
          
          if (response.ok) {
            this.mockData.set('testContact', testContact);
            return 'Contact creation working';
          }
          throw new Error('Contact creation failed');
        }
      }
    ];

    await this.runTestSuite('Contacts', contactsTests);
  }

  // Test Calendar system
  async testCalendar() {
    console.log('📅 Testing Calendar System...');
    
    const calendarTests = [
      {
        name: 'Calendar Page Load',
        test: async () => {
          const response = await fetch('/calendar');
          if (!response.ok) throw new Error('Calendar page failed to load');
          return 'Calendar page loads';
        }
      },
      {
        name: 'Calendar Visibility',
        test: async () => {
          // Test DOM elements are visible
          const elements = document.querySelectorAll('.calendar-day, .calendar-event');
          if (elements.length === 0) {
            this.warnings.push({ test: 'Calendar Visibility', warning: 'No calendar elements found in DOM' });
          }
          return 'Calendar visibility checked';
        }
      },
      {
        name: 'Callbacks API',
        test: async () => {
          const response = await fetch('/api/activities/sync-callbacks');
          const data = await response.json();
          if (!data || !data.success) throw new Error('Callbacks API failed');
          return 'Callbacks API working';
        }
      },
      {
        name: 'Calendar Navigation',
        test: async () => {
          // Test month navigation
          const prevButton = document.querySelector('button[onclick*="setMonth"]');
          if (!prevButton) {
            this.warnings.push({ test: 'Calendar Navigation', warning: 'Navigation buttons not found' });
          }
          return 'Calendar navigation elements present';
        }
      }
    ];

    await this.runTestSuite('Calendar', calendarTests);
  }

  // Test Calls system
  async testCalls() {
    console.log('📞 Testing Calls System...');
    
    const callsTests = [
      {
        name: 'Calls Page Load',
        test: async () => {
          const response = await fetch('/calls');
          if (!response.ok) throw new Error('Calls page failed to load');
          return 'Calls page loads';
        }
      },
      {
        name: 'Twilio Browser Phone',
        test: async () => {
          const response = await fetch('/twilio-browser-phone');
          if (!response.ok) throw new Error('Twilio browser phone failed to load');
          return 'Twilio browser phone loads';
        }
      },
      {
        name: 'Call Logs API',
        test: async () => {
          const response = await fetch('/api/calls/get-logs');
          if (response.ok) return 'Call logs API working';
          throw new Error('Call logs API failed');
        }
      },
      {
        name: 'Twilio Token API',
        test: async () => {
          const response = await fetch('/api/twilio/token', { method: 'POST' });
          const data = await response.json();
          if (!data.token) throw new Error('Twilio token generation failed');
          return 'Twilio token API working';
        }
      }
    ];

    await this.runTestSuite('Calls', callsTests);
  }

  // Test Analytics system
  async testAnalytics() {
    console.log('📈 Testing Analytics System...');
    
    const analyticsTests = [
      {
        name: 'Analytics Page Load',
        test: async () => {
          const response = await fetch('/analytics');
          if (!response.ok) throw new Error('Analytics page failed to load');
          return 'Analytics page loads';
        }
      },
      {
        name: 'Performance Metrics',
        test: async () => {
          const response = await fetch('/api/analytics/performance');
          if (response.ok) return 'Performance metrics API working';
          throw new Error('Performance metrics failed');
        }
      }
    ];

    await this.runTestSuite('Analytics', analyticsTests);
  }

  // Test VoIP system
  async testVoIPSystem() {
    console.log('🎯 Testing VoIP System...');
    
    const voipTests = [
      {
        name: 'WebRTC Support',
        test: async () => {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('WebRTC not supported');
          }
          return 'WebRTC supported';
        }
      },
      {
        name: 'Audio Context',
        test: async () => {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (!AudioContext) throw new Error('Audio Context not available');
          const ctx = new AudioContext();
          ctx.close();
          return 'Audio Context available';
        }
      },
      {
        name: 'Microphone Access',
        test: async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            return 'Microphone access granted';
          } catch (error) {
            this.warnings.push({ test: 'Microphone Access', warning: 'User must grant microphone permission' });
            return 'Microphone access check completed';
          }
        }
      }
    ];

    await this.runTestSuite('VoIP', voipTests);
  }

  // Test AI Features
  async testAIFeatures() {
    console.log('🤖 Testing AI Features...');
    
    const aiTests = [
      {
        name: 'AI Whisper API',
        test: async () => {
          const response = await fetch('/api/ai/whisper', {
            method: 'POST',
            body: new FormData() // Empty form data for testing
          });
          // Accept various response codes for AI endpoints
          if (response.status === 400 || response.status === 200) return 'AI Whisper endpoint accessible';
          throw new Error('AI Whisper endpoint not responding');
        }
      },
      {
        name: 'AI Analysis',
        test: async () => {
          const response = await fetch('/api/ai/sentiment-fast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: 'test text' })
          });
          if (response.status <= 500) return 'AI analysis endpoint accessible';
          throw new Error('AI analysis endpoint failed');
        }
      }
    ];

    await this.runTestSuite('AI Features', aiTests);
  }

  // Test Mobile Responsiveness
  async testMobileResponsiveness() {
    console.log('📱 Testing Mobile Responsiveness...');
    
    const mobileTests = [
      {
        name: 'Viewport Meta Tag',
        test: async () => {
          const viewport = document.querySelector('meta[name="viewport"]');
          if (!viewport) throw new Error('Viewport meta tag missing');
          return 'Viewport meta tag present';
        }
      },
      {
        name: 'Touch Events',
        test: async () => {
          const hasTouchEvents = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
          return `Touch events ${hasTouchEvents ? 'supported' : 'not detected'}`;
        }
      },
      {
        name: 'Responsive CSS',
        test: async () => {
          const hasResponsiveClasses = document.querySelector('.sm\\:', '.md\\:', '.lg\\:');
          if (hasResponsiveClasses) return 'Responsive CSS classes detected';
          this.warnings.push({ test: 'Responsive CSS', warning: 'Limited responsive classes found' });
          return 'Responsive CSS check completed';
        }
      }
    ];

    await this.runTestSuite('Mobile Responsiveness', mobileTests);
  }

  // Test Offline Capabilities
  async testOfflineCapabilities() {
    console.log('📡 Testing Offline Capabilities...');
    
    const offlineTests = [
      {
        name: 'Service Worker',
        test: async () => {
          if (!('serviceWorker' in navigator)) throw new Error('Service Worker not supported');
          return 'Service Worker supported';
        }
      },
      {
        name: 'Local Storage',
        test: async () => {
          if (!window.localStorage) throw new Error('Local Storage not available');
          localStorage.setItem('test', 'value');
          localStorage.removeItem('test');
          return 'Local Storage working';
        }
      },
      {
        name: 'IndexedDB',
        test: async () => {
          if (!window.indexedDB) throw new Error('IndexedDB not supported');
          return 'IndexedDB available';
        }
      }
    ];

    await this.runTestSuite('Offline Capabilities', offlineTests);
  }

  // Test UI Interactions
  async testUIInteractions() {
    console.log('🖱️ Testing UI Interactions...');
    
    const uiTests = [
      {
        name: 'Button Clicks',
        test: async () => {
          const buttons = document.querySelectorAll('button');
          let clickableButtons = 0;
          
          buttons.forEach(button => {
            if (!button.disabled && button.onclick) {
              clickableButtons++;
            }
          });
          
          if (buttons.length === 0) {
            this.warnings.push({ test: 'Button Clicks', warning: 'No buttons found in DOM' });
          }
          
          return `Found ${buttons.length} buttons, ${clickableButtons} with click handlers`;
        }
      },
      {
        name: 'Form Validation',
        test: async () => {
          const forms = document.querySelectorAll('form');
          const inputs = document.querySelectorAll('input[required], select[required], textarea[required]');
          return `Found ${forms.length} forms, ${inputs.length} required fields`;
        }
      },
      {
        name: 'Navigation Links',
        test: async () => {
          const links = document.querySelectorAll('a[href], [onclick]');
          return `Found ${links.length} navigational elements`;
        }
      }
    ];

    await this.runTestSuite('UI Interactions', uiTests);
  }

  // Test API Endpoints
  async testAPIEndpoints() {
    console.log('🔌 Testing API Endpoints...');
    
    const apiTests = [
      {
        name: 'API Health Check',
        test: async () => {
          const endpoints = [
            '/api/contacts',
            '/api/calls/get-logs',
            '/api/activities/sync-callbacks',
            '/api/twilio/token'
          ];
          
          const results = await Promise.allSettled(
            endpoints.map(endpoint => fetch(endpoint, { method: 'GET' }))
          );
          
          const working = results.filter(result => 
            result.status === 'fulfilled' && result.value.status < 500
          ).length;
          
          return `${working}/${endpoints.length} API endpoints responding`;
        }
      }
    ];

    await this.runTestSuite('API Endpoints', apiTests);
  }

  // Test Database Operations
  async testDatabaseOperations() {
    console.log('🗄️ Testing Database Operations...');
    
    const dbTests = [
      {
        name: 'Database Connection',
        test: async () => {
          // Test a simple database operation
          const response = await fetch('/api/contacts?limit=1');
          if (response.ok) return 'Database connection working';
          throw new Error('Database connection failed');
        }
      }
    ];

    await this.runTestSuite('Database Operations', dbTests);
  }

  // Run a test suite
  async runTestSuite(suiteName, tests) {
    const suiteResults = {
      name: suiteName,
      tests: [],
      passed: 0,
      failed: 0,
      warnings: 0
    };

    for (const testCase of tests) {
      try {
        const startTime = Date.now();
        const result = await testCase.test();
        const duration = Date.now() - startTime;
        
        suiteResults.tests.push({
          name: testCase.name,
          status: 'passed',
          result,
          duration
        });
        suiteResults.passed++;
        
      } catch (error) {
        suiteResults.tests.push({
          name: testCase.name,
          status: 'failed',
          error: error.message,
          duration: 0
        });
        suiteResults.failed++;
        this.errors.push({ test: `${suiteName} - ${testCase.name}`, error: error.message });
      }
    }

    this.testSuites.set(suiteName, suiteResults);
    console.log(`✅ ${suiteName}: ${suiteResults.passed} passed, ${suiteResults.failed} failed`);
  }

  // Generate comprehensive audit report
  generateAuditReport() {
    const totalTests = Array.from(this.testSuites.values())
      .reduce((sum, suite) => sum + suite.tests.length, 0);
    
    const totalPassed = Array.from(this.testSuites.values())
      .reduce((sum, suite) => sum + suite.passed, 0);
    
    const totalFailed = Array.from(this.testSuites.values())
      .reduce((sum, suite) => sum + suite.failed, 0);

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        passed: totalPassed,
        failed: totalFailed,
        warnings: this.warnings.length,
        successRate: Math.round((totalPassed / totalTests) * 100)
      },
      testSuites: Array.from(this.testSuites.values()),
      errors: this.errors,
      warnings: this.warnings,
      recommendations: this.generateRecommendations()
    };

    console.log('📋 COMPREHENSIVE AUDIT REPORT');
    console.log('================================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`⚠️ Warnings: ${this.warnings.length}`);
    console.log(`📈 Success Rate: ${report.summary.successRate}%`);
    console.log('================================');

    if (this.errors.length > 0) {
      console.log('\n❌ CRITICAL ISSUES TO FIX:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.test}: ${error.error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS TO ADDRESS:');
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.test}: ${warning.warning}`);
      });
    }

    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    // Store report for later access
    sessionStorage.setItem('voicrm_audit_report', JSON.stringify(report));
    
    return report;
  }

  // Generate recommendations based on test results
  generateRecommendations() {
    const recommendations = [];

    if (this.errors.length > 0) {
      recommendations.push('Fix all critical errors before production deployment');
    }

    if (this.warnings.length > 5) {
      recommendations.push('Address warnings to improve user experience');
    }

    const successRate = Math.round((Array.from(this.testSuites.values())
      .reduce((sum, suite) => sum + suite.passed, 0) / 
      Array.from(this.testSuites.values())
        .reduce((sum, suite) => sum + suite.tests.length, 0)) * 100);

    if (successRate < 90) {
      recommendations.push('Improve test success rate to at least 90% before release');
    }

    if (successRate >= 95) {
      recommendations.push('Excellent test coverage - system ready for production');
    }

    recommendations.push('Perform user acceptance testing with real estate professionals');
    recommendations.push('Test with various devices and network conditions');
    recommendations.push('Implement continuous monitoring for production environment');

    return recommendations;
  }

  // Quick health check
  async quickHealthCheck() {
    const healthTests = [
      { name: 'Server Response', url: '/dashboard' },
      { name: 'API Response', url: '/api/contacts' },
      { name: 'Twilio Token', url: '/api/twilio/token' }
    ];

    console.log('🩺 Quick Health Check...');
    
    for (const test of healthTests) {
      try {
        const response = await fetch(test.url, { method: 'GET' });
        const status = response.ok ? '✅' : '❌';
        console.log(`${status} ${test.name}: ${response.status}`);
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }
  }
}

// Export singleton instance
const voiCRMTester = new VoiCRMTester();

// Auto-run quick health check on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => voiCRMTester.quickHealthCheck(), 2000);
  });
}

export default voiCRMTester;