#!/usr/bin/env node

const http = require('http');
const https = require('https');

// Test configuration
const LOCAL_URL = 'http://localhost:3005';
const PROD_URL = 'https://voicrm-production.vercel.app';

// Pages to test
const pages = [
  '/',
  '/contacts',
  '/calls', 
  '/messages',
  '/whisperer',
  '/powerdialer',
  '/twilio-browser-phone',
  '/property-analysis',
  '/reports',
  '/cma',
  '/analytics',
  '/call-analytics',
  '/day-planner',
  '/voice-checkin',
  '/whatsapp',
  '/interactive-calendar',
  '/test-analytics',
  '/agent-management'
];

// API endpoints to test
const apis = [
  '/api/health',
  '/api/contacts',
  '/api/twilio/status',
  '/api/dashboard/stats',
  '/api/analytics',
  '/api/activities/recent',
  '/api/system/audit'
];

// Test a single URL
async function testUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 400,
          contentLength: data.length
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

// Run all tests
async function runTests() {
  console.log('🚀 VoiCRM Comprehensive System Test\n');
  console.log('====================================\n');
  
  // Test local environment
  console.log('📍 Testing Local Environment...\n');
  
  let localResults = [];
  for (const page of pages) {
    const result = await testUrl(LOCAL_URL + page);
    localResults.push(result);
    console.log(`${result.success ? '✅' : '❌'} ${page} - Status: ${result.status}`);
  }
  
  console.log('\n📡 Testing API Endpoints...\n');
  
  for (const api of apis) {
    const result = await testUrl(LOCAL_URL + api);
    localResults.push(result);
    console.log(`${result.success ? '✅' : '❌'} ${api} - Status: ${result.status}`);
  }
  
  // Calculate success rate
  const successCount = localResults.filter(r => r.success).length;
  const totalCount = localResults.length;
  const successRate = ((successCount / totalCount) * 100).toFixed(1);
  
  console.log('\n====================================');
  console.log('📊 Test Results Summary\n');
  console.log(`Total Tests: ${totalCount}`);
  console.log(`Passed: ${successCount}`);
  console.log(`Failed: ${totalCount - successCount}`);
  console.log(`Success Rate: ${successRate}%`);
  
  if (successRate === '100.0') {
    console.log('\n🎉 SYSTEM IS FLAWLESS! All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    
    // Show failed tests
    const failed = localResults.filter(r => !r.success);
    if (failed.length > 0) {
      console.log('\nFailed Tests:');
      failed.forEach(f => {
        console.log(`  - ${f.url}: ${f.error || `Status ${f.status}`}`);
      });
    }
  }
  
  // Test production (may fail due to auth)
  console.log('\n\n🌐 Testing Production Deployment...\n');
  const prodHealth = await testUrl(PROD_URL);
  if (prodHealth.status === 401) {
    console.log('⚠️  Production requires authentication (Vercel protection enabled)');
    console.log('   To disable: Go to Vercel Dashboard > Settings > General > Password Protection');
  } else if (prodHealth.success) {
    console.log('✅ Production is publicly accessible!');
  } else {
    console.log(`❌ Production error: ${prodHealth.error || `Status ${prodHealth.status}`}`);
  }
  
  console.log('\n====================================\n');
  
  // Performance metrics
  console.log('⚡ Performance Metrics:\n');
  const avgResponseSize = localResults.reduce((sum, r) => sum + (r.contentLength || 0), 0) / localResults.length;
  console.log(`Average Response Size: ${(avgResponseSize / 1024).toFixed(2)} KB`);
  console.log(`Total Pages Tested: ${pages.length}`);
  console.log(`Total APIs Tested: ${apis.length}`);
  
  console.log('\n✨ Test Complete!\n');
}

// Run the tests
runTests().catch(console.error);