// Test script for Vercel API endpoints
// Bangladesh dev style - comprehensive API testing

const axios = require('axios');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_API_KEY = 'api_key_john_123456789';
const TEST_ADMIN_KEY = 'admin_key_demo_store_123';

console.log('🚀 Starting Affiliate Boss Vercel API Tests...');
console.log(`Base URL: ${BASE_URL}`);

// Test endpoints
const tests = [
  {
    name: 'Health Check',
    method: 'GET',
    url: '/api/health',
    headers: {}
  },
  {
    name: 'User Authentication',
    method: 'GET',
    url: '/api/auth/me',
    headers: { 'X-API-Key': TEST_API_KEY }
  },
  {
    name: 'User Login',
    method: 'POST',
    url: '/api/auth/login',
    headers: {},
    data: {
      login: 'john@example.com',
      password: 'demo123'
    }
  },
  {
    name: 'Affiliate Links',
    method: 'GET',
    url: '/api/links',
    headers: { 'X-API-Key': TEST_API_KEY }
  },
  {
    name: 'Create Affiliate Link',
    method: 'POST',
    url: '/api/links',
    headers: { 'X-API-Key': TEST_API_KEY },
    data: {
      name: 'Test Product Link',
      original_url: 'https://example.com/product/123',
      description: 'Test affiliate link for product 123',
      category: 'Test',
      utm_source: 'affiliate-boss',
      utm_medium: 'affiliate',
      utm_campaign: 'test'
    }
  },
  {
    name: 'Products Catalog',
    method: 'GET',
    url: '/api/products',
    headers: { 'X-API-Key': TEST_API_KEY }
  },
  {
    name: 'Analytics Dashboard',
    method: 'GET',
    url: '/api/analytics/dashboard',
    headers: { 'X-API-Key': TEST_API_KEY }
  },
  {
    name: 'Commissions',
    method: 'GET',
    url: '/api/commissions',
    headers: { 'X-API-Key': TEST_API_KEY }
  },
  {
    name: 'Admin Overview',
    method: 'GET',
    url: '/api/admin/overview',
    headers: { 'X-Admin-Key': TEST_ADMIN_KEY }
  },
  {
    name: 'Admin Affiliates',
    method: 'GET',
    url: '/api/admin/affiliates',
    headers: { 'X-Admin-Key': TEST_ADMIN_KEY }
  },
  {
    name: 'Admin Applications',
    method: 'GET',
    url: '/api/admin/applications',
    headers: { 'X-Admin-Key': TEST_ADMIN_KEY }
  },
  {
    name: 'Submit Application',
    method: 'POST',
    url: '/api/admin/applications',
    headers: {},
    data: {
      first_name: 'Test',
      last_name: 'Applicant',
      email: `test${Date.now()}@example.com`,
      phone: '+1234567890',
      marketing_experience: 'intermediate',
      audience_size: 5000,
      primary_platforms: ['instagram', 'youtube'],
      business_type: 'individual',
      promotional_strategy: 'Social media marketing and content creation',
      expected_monthly_sales: 1000,
      why_join: 'Looking to monetize my content',
      terms_agreed: true
    }
  },
  {
    name: 'SMS Send OTP',
    method: 'POST',
    url: '/api/sms/send',
    headers: { 'X-API-Key': TEST_API_KEY },
    data: {
      type: 'otp',
      phone: '+1234567890',
      purpose: 'verification'
    }
  },
  {
    name: 'SMS Verify OTP',
    method: 'POST',
    url: '/api/sms/verify',
    headers: {},
    data: {
      phone: '+1234567890',
      code: '123456',
      purpose: 'verification'
    }
  },
  {
    name: 'AI Content Generation',
    method: 'POST',
    url: '/api/ai/generate',
    headers: { 'X-API-Key': TEST_API_KEY },
    data: {
      type: 'product_description',
      product_name: 'Wireless Headphones',
      product_description: 'High-quality wireless headphones',
      product_category: 'Electronics',
      product_price: 199.99,
      target_audience: 'music lovers',
      tone: 'professional',
      length: 'medium'
    }
  },
  {
    name: 'Shopify Connect',
    method: 'GET',
    url: '/api/shopify/connect',
    headers: { 'X-API-Key': TEST_API_KEY }
  }
];

// Run tests
async function runTests() {
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`\n📋 Testing: ${test.name}`);
      console.log(`   ${test.method} ${test.url}`);
      
      const config = {
        method: test.method,
        url: `${BASE_URL}${test.url}`,
        headers: {
          'Content-Type': 'application/json',
          ...test.headers
        },
        timeout: 10000
      };
      
      if (test.data) {
        config.data = test.data;
      }
      
      const response = await axios(config);
      
      console.log(`   ✅ Status: ${response.status}`);
      
      // Check for expected response structure
      if (response.data) {
        if (response.data.success !== undefined) {
          console.log(`   📊 Success: ${response.data.success}`);
        }
        if (response.data.message) {
          console.log(`   💬 Message: ${response.data.message}`);
        }
        if (response.data.data) {
          console.log(`   📦 Data keys: ${Object.keys(response.data.data).join(', ')}`);
        }
      }
      
      passed++;
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      
      if (error.response) {
        console.log(`   📊 Status: ${error.response.status}`);
        if (error.response.data && error.response.data.message) {
          console.log(`   💬 Error: ${error.response.data.message}`);
        }
      }
      
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${tests.length}`);
  console.log(`📈 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! API is ready for deployment.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
}

// Additional utility tests
async function testDatabaseConnection() {
  console.log('\n🔍 Testing Database Connection...');
  
  try {
    const { getDatabase } = require('../lib/database');
    const db = getDatabase();
    
    const result = db.prepare('SELECT COUNT(*) as count FROM users').get();
    console.log(`   ✅ Database connected - ${result.count} users found`);
    
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all();
    
    console.log(`   📋 Tables: ${tables.map(t => t.name).join(', ')}`);
    
  } catch (error) {
    console.log(`   ❌ Database error: ${error.message}`);
  }
}

// Main execution
async function main() {
  // Test database first
  await testDatabaseConnection();
  
  // Wait a moment for any initialization
  console.log('\n⏳ Waiting for system initialization...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Run API tests
  await runTests();
  
  console.log('\n🏁 Testing completed!');
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testDatabaseConnection };