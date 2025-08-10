const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test function
async function testRoute(method, endpoint, data = null, description = '') {
  try {
    console.log(`\n🧪 Testing: ${description || `${method} ${endpoint}`}`);
    console.log(`📍 URL: ${BASE_URL}${endpoint}`);
    
    const config = {
      method: method.toLowerCase(),
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Response:`, JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status || 'Network Error'}`);
    console.log(`📝 Message:`, error.response?.data || error.message);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting API Route Tests\n');
  console.log('=' .repeat(50));
  
  // Test basic health check
  await testRoute('GET', '/', null, 'Health Check (Root)');
  
  // Test reviews endpoints (these will fail due to auth, but we can see the structure)
  await testRoute('GET', '/reviews', null, 'Get All Reviews');
  await testRoute('GET', '/reviews/recent', null, 'Get Recent Reviews');
  
  // Test stats endpoints
  await testRoute('GET', '/stats', null, 'Get Dashboard Stats');
  await testRoute('GET', '/stats/profile', null, 'Get Profile Stats');
  await testRoute('GET', '/stats/filtered', null, 'Get Filtered Stats');
  
  // Test trends endpoints
  await testRoute('GET', '/review-trends', null, 'Get Review Trends');
  await testRoute('GET', '/response-trends', null, 'Get Response Trends');
  
  // Test auth endpoints
  await testRoute('POST', '/auth/register', {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  }, 'User Registration');
  
  await testRoute('POST', '/auth/login', {
    email: 'test@example.com',
    password: 'password123'
  }, 'User Login');
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 API Route Tests Completed');
}

// Run the tests
runTests().catch(console.error);