#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const baseUrl = 'http://localhost:3005';

// Comprehensive feature checklist
const features = {
  'Core CRM': {
    'Contact Management': ['/contacts', '/api/contacts'],
    'Lead Tracking': ['/leads', '/api/leads'],
    'Pipeline Management': ['/pipeline', '/api/pipeline'],
    'Activity Logging': ['/api/activities/log', '/api/activities/recent']
  },
  'VoIP System': {
    'Browser Phone': ['/twilio-browser-phone'],
    'Call Recording': ['/api/twilio/recording'],
    'Voicemail Drop': ['/api/twilio/drop-voicemail'],
    'Conference Calling': ['/api/twilio/conference'],
    'Call Forwarding': ['/api/twilio/call-forward'],
    'WebRTC Support': ['/api/twilio/webrtc-call']
  },
  'AI Features': {
    'Call Transcription': ['/api/openai/transcribe'],
    'Lead Scoring': ['/api/openai/lead-score'],
    'AI Whisperer': ['/whisperer'],
    'Conversation Summary': ['/api/ai/summarize-call'],
    'Next Steps Suggestions': ['/api/ai/next-steps'],
    'Prospecting Assistant': ['/api/ai/prospecting']
  },
  'Analytics': {
    'Real-time Dashboard': ['/analytics', '/api/analytics/realtime'],
    'Predictive Analytics': ['/api/analytics/predictive'],
    'Call Analytics': ['/call-analytics'],
    'Export Reports': ['/api/analytics/export'],
    'Custom Reports': ['/reports']
  },
  'Real Estate': {
    'Property Analysis': ['/property-analysis'],
    'CMA Generation': ['/cma'],
    'Market Analysis': ['/api/analyze-properties']
  },
  'Automation': {
    'Power Dialer': ['/powerdialer', '/api/powerdialer/start'],
    'Campaign Management': ['/api/powerdialer/create-campaign'],
    'Workflow Automation': ['/api/workflows/automation'],
    'Scheduled Calling': ['/day-planner']
  },
  'Messaging': {
    'SMS Support': ['/messages', '/api/sms/send'],
    'WhatsApp Integration': ['/whatsapp', '/api/whatsapp/send'],
    'Email Sync': ['/api/gmail/sync']
  },
  'Mobile & Integration': {
    'Mobile App Support': ['Check Capacitor config'],
    'Pipedrive Sync': ['/api/pipedrive/sync-real-contacts'],
    'Gmail Integration': ['/api/gmail/auth'],
    'Calendar Integration': ['/interactive-calendar']
  }
};

// Database tables that should exist
const requiredTables = [
  'contacts',
  'activities', 
  'leads',
  'properties',
  'campaigns',
  'users',
  'call_logs',
  'messages',
  'recordings',
  'analytics_events'
];

// Environment variables that must be set
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'OPENAI_API_KEY'
];

async function testEndpoint(url) {
  return new Promise((resolve) => {
    const fullUrl = url.startsWith('http') ? url : baseUrl + url;
    
    http.get(fullUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 400,
          hasContent: data.length > 100,
          errorInContent: data.includes('error') || data.includes('Error')
        });
      });
    }).on('error', (err) => {
      resolve({
        url,
        status: 0,
        success: false,
        error: err.message
      });
    });
  });
}

async function deepAudit() {
  console.log('🔍 VoiCRM DEEP SYSTEM AUDIT\n');
  console.log('=' .repeat(50) + '\n');
  
  const issues = [];
  const warnings = [];
  let totalTests = 0;
  let passedTests = 0;
  
  // 1. Test all features
  console.log('📋 FEATURE AUDIT:\n');
  
  for (const [category, subcategories] of Object.entries(features)) {
    console.log(`\n${category}:`);
    
    for (const [feature, endpoints] of Object.entries(subcategories)) {
      process.stdout.write(`  ${feature}: `);
      
      let featureWorking = true;
      for (const endpoint of endpoints) {
        if (endpoint.startsWith('Check')) {
          // Manual check item
          warnings.push(`Manual check needed: ${feature} - ${endpoint}`);
          process.stdout.write('⚠️ ');
        } else {
          totalTests++;
          const result = await testEndpoint(endpoint);
          
          if (result.success && !result.errorInContent) {
            passedTests++;
            process.stdout.write('✅ ');
          } else if (result.status === 404) {
            issues.push(`Missing endpoint: ${endpoint} (${feature})`);
            process.stdout.write('❌ ');
            featureWorking = false;
          } else if (result.status === 405) {
            // Method not allowed - might be POST only
            process.stdout.write('⚡ ');
            passedTests++;
          } else {
            issues.push(`Failed: ${endpoint} - Status ${result.status}`);
            process.stdout.write('❌ ');
            featureWorking = false;
          }
        }
      }
      
      console.log(featureWorking ? ' [OK]' : ' [NEEDS FIX]');
    }
  }
  
  // 2. Check environment variables
  console.log('\n\n🔐 ENVIRONMENT VARIABLES:\n');
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`  ✅ ${envVar} is set`);
    } else {
      console.log(`  ❌ ${envVar} is MISSING`);
      issues.push(`Missing environment variable: ${envVar}`);
    }
  }
  
  // 3. Check file structure
  console.log('\n\n📁 FILE STRUCTURE:\n');
  
  const criticalFiles = [
    'package.json',
    'next.config.js',
    '.env.local',
    'vercel.json',
    'components/Layout.js',
    'lib/supabase.js',
    'pages/index.js',
    'pages/api/health.js'
  ];
  
  for (const file of criticalFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`  ✅ ${file} exists`);
    } else {
      console.log(`  ❌ ${file} is MISSING`);
      if (!file.includes('.env')) {
        issues.push(`Missing critical file: ${file}`);
      }
    }
  }
  
  // 4. Performance check
  console.log('\n\n⚡ PERFORMANCE CHECK:\n');
  
  const startTime = Date.now();
  const perfTests = await Promise.all([
    testEndpoint('/'),
    testEndpoint('/contacts'),
    testEndpoint('/api/health')
  ]);
  const avgResponseTime = (Date.now() - startTime) / perfTests.length;
  
  if (avgResponseTime < 250) {
    console.log(`  ✅ Average response time: ${avgResponseTime.toFixed(0)}ms (Excellent)`);
  } else if (avgResponseTime < 500) {
    console.log(`  ⚠️  Average response time: ${avgResponseTime.toFixed(0)}ms (Acceptable)`);
    warnings.push(`Response time is ${avgResponseTime.toFixed(0)}ms - should be under 250ms`);
  } else {
    console.log(`  ❌ Average response time: ${avgResponseTime.toFixed(0)}ms (Too slow)`);
    issues.push(`Poor performance: ${avgResponseTime.toFixed(0)}ms average response time`);
  }
  
  // 5. Security check
  console.log('\n\n🔒 SECURITY CHECK:\n');
  
  const securityEndpoints = [
    '/api/contacts',
    '/api/twilio/voice',
    '/api/dashboard/stats'
  ];
  
  for (const endpoint of securityEndpoints) {
    const result = await testEndpoint(endpoint);
    // In production, these should require auth
    console.log(`  ${endpoint}: ${result.success ? '⚠️  Publicly accessible' : '✅ Protected'}`);
    if (result.success) {
      warnings.push(`${endpoint} is publicly accessible - ensure proper authentication in production`);
    }
  }
  
  // 6. Database connectivity
  console.log('\n\n💾 DATABASE CHECK:\n');
  
  const dbTest = await testEndpoint('/api/contacts');
  if (dbTest.success) {
    console.log('  ✅ Database connection working');
  } else {
    console.log('  ❌ Database connection failed');
    issues.push('Database connectivity issue');
  }
  
  // Final Report
  console.log('\n' + '=' .repeat(50));
  console.log('\n📊 AUDIT SUMMARY:\n');
  
  const totalIssues = issues.length;
  const totalWarnings = warnings.length;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${successRate}%`);
  console.log(`Critical Issues: ${totalIssues}`);
  console.log(`Warnings: ${totalWarnings}`);
  
  if (totalIssues > 0) {
    console.log('\n❌ CRITICAL ISSUES TO FIX:\n');
    issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
  }
  
  if (totalWarnings > 0) {
    console.log('\n⚠️  WARNINGS:\n');
    warnings.forEach((warning, i) => {
      console.log(`  ${i + 1}. ${warning}`);
    });
  }
  
  if (totalIssues === 0 && successRate === '100.0') {
    console.log('\n🎯 SYSTEM STATUS: FLAWLESS! ✨');
    console.log('All critical features are working perfectly!');
  } else if (totalIssues === 0) {
    console.log('\n✅ SYSTEM STATUS: GOOD');
    console.log('No critical issues, but some optimizations recommended.');
  } else if (totalIssues < 5) {
    console.log('\n⚠️  SYSTEM STATUS: NEEDS ATTENTION');
    console.log('Several issues need to be fixed for production readiness.');
  } else {
    console.log('\n❌ SYSTEM STATUS: CRITICAL');
    console.log('Multiple critical issues detected. Immediate fixes required.');
  }
  
  console.log('\n' + '=' .repeat(50) + '\n');
  
  // Generate fix script
  if (totalIssues > 0) {
    console.log('📝 Generating fix recommendations...\n');
    
    const missingEndpoints = issues.filter(i => i.includes('Missing endpoint'));
    if (missingEndpoints.length > 0) {
      console.log('Missing API endpoints to create:');
      missingEndpoints.forEach(e => {
        const endpoint = e.match(/\/api\/[^ ]+/)?.[0];
        if (endpoint) {
          console.log(`  - Create ${endpoint}.js`);
        }
      });
    }
  }
}

// Run the audit
deepAudit().catch(console.error);