const axios = require('axios');

// App-Cloning Protection Test Suite
async function testAppCloning() {
    const baseURL = 'http://localhost:3000';
    
    console.log('🔒 Testing App-Cloning Protection...\n');
    
    // Valid headers for legitimate requests
    const validHeaders = {
        'X-App-Signature': 'SchoolMgmt-Auth-Token',
        'X-App-Version': '1.0.0',
        'X-App-Build': 'prod-2025-001',
        'X-Client-Type': 'official-client',
        'User-Agent': 'SchoolManagement/1.0 OfficialClient/1.0'
    };
    
    // Test 1: Valid request with proper headers (should pass)
    console.log('1. Testing valid request with proper app signature...');
    try {
        const response = await axios.get(`${baseURL}/`, {
            headers: validHeaders
        });
        console.log('✅ Valid request with proper signature passed');
        console.log(`   Response headers include: X-App-Response-Signature: ${response.headers['x-app-response-signature']}`);
    } catch (error) {
        if (error.response?.status === 403) {
            console.log('❌ Valid request was blocked by app-cloning protection');
            console.log(`   Response: ${error.response.data.message}`);
        } else {
            console.log(`ℹ️  Request result: ${error.response?.status || error.message}`);
        }
    }
    
    // Test 2: Missing required headers
    console.log('\n2. Testing request with missing app signature headers...');
    try {
        await axios.get(`${baseURL}/`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        console.log('❌ Request with missing headers was NOT blocked');
    } catch (error) {
        if (error.response?.status === 403 && error.response.data.code?.includes('APP_CLONING')) {
            console.log('✅ Request with missing headers BLOCKED by app-cloning protection');
            console.log(`   Response: ${error.response.data.message}`);
        } else {
            console.log(`ℹ️  Unexpected response: ${error.response?.status || error.message}`);
        }
    }
    
    // Test 3: Invalid app signature
    console.log('\n3. Testing request with invalid app signature...');
    try {
        await axios.get(`${baseURL}/`, {
            headers: {
                'X-App-Signature': 'FakeApp-Clone-Token',
                'X-App-Version': '1.0.0',
                'X-App-Build': 'prod-2025-001',
                'User-Agent': 'SchoolManagement/1.0'
            }
        });
        console.log('❌ Request with invalid signature was NOT blocked');
    } catch (error) {
        if (error.response?.status === 403 && error.response.data.code?.includes('APP_CLONING')) {
            console.log('✅ Request with invalid signature BLOCKED by app-cloning protection');
            console.log(`   Response: ${error.response.data.message}`);
        } else {
            console.log(`ℹ️  Unexpected response: ${error.response?.status || error.message}`);
        }
    }
    
    // Test 4: Suspicious User-Agent
    console.log('\n4. Testing request with suspicious User-Agent...');
    try {
        await axios.get(`${baseURL}/`, {
            headers: {
                ...validHeaders,
                'User-Agent': 'CloneBot/1.0 (Unauthorized Copy)'
            }
        });
        console.log('❌ Request with suspicious User-Agent was NOT blocked');
    } catch (error) {
        if (error.response?.status === 403 && error.response.data.code?.includes('APP_CLONING')) {
            console.log('✅ Request with suspicious User-Agent BLOCKED by app-cloning protection');
            console.log(`   Response: ${error.response.data.message}`);
        } else {
            console.log(`ℹ️  Unexpected response: ${error.response?.status || error.message}`);
        }
    }
    
    // Test 5: Rate limiting (rapid requests)
    console.log('\n5. Testing rapid request rate limiting...');
    try {
        const promises = [];
        for (let i = 0; i < 65; i++) { // Exceed the 60 requests per minute limit
            promises.push(
                axios.get(`${baseURL}/`, {
                    headers: validHeaders,
                    timeout: 1000
                }).catch(err => err.response || err)
            );
        }
        
        const results = await Promise.all(promises);
        const blocked = results.filter(r => r.status === 429).length;
        const passed = results.filter(r => r.status === 200).length;
        
        if (blocked > 0) {
            console.log(`✅ Rate limiting ACTIVE: ${blocked} requests blocked, ${passed} passed`);
        } else {
            console.log('❌ Rate limiting NOT working - all requests passed');
        }
    } catch (error) {
        console.log(`ℹ️  Rate limiting test error: ${error.message}`);
    }
    
    // Test 6: Invalid version numbers
    console.log('\n6. Testing request with invalid version numbers...');
    try {
        await axios.get(`${baseURL}/`, {
            headers: {
                'X-App-Signature': 'SchoolMgmt-Auth-Token',
                'X-App-Version': '2.0.0', // Wrong version
                'X-App-Build': 'prod-2025-001',
                'User-Agent': 'SchoolManagement/1.0'
            }
        });
        console.log('❌ Request with invalid version was NOT blocked');
    } catch (error) {
        if (error.response?.status === 403 && error.response.data.code?.includes('APP_CLONING')) {
            console.log('✅ Request with invalid version BLOCKED by app-cloning protection');
            console.log(`   Response: ${error.response.data.message}`);
        } else {
            console.log(`ℹ️  Unexpected response: ${error.response?.status || error.message}`);
        }
    }
    
    // Test 7: Test login endpoint with cloning protection
    console.log('\n7. Testing login endpoint with app-cloning protection...');
    try {
        await axios.post(`${baseURL}/api/login`, {
            username: 'admin',
            password: '1234',
            role: 'admin'
        }, {
            headers: {
                'X-App-Signature': 'FakeClone-Token',
                'X-App-Version': '1.0.0',
                'X-App-Build': 'prod-2025-001',
                'User-Agent': 'UnauthorizedClone/1.0'
            }
        });
        console.log('❌ Cloned app login was NOT blocked');
    } catch (error) {
        if (error.response?.status === 403 && error.response.data.code?.includes('APP_CLONING')) {
            console.log('✅ Cloned app login BLOCKED by app-cloning protection');
            console.log(`   Response: ${error.response.data.message}`);
        } else {
            console.log(`ℹ️  Login test result: ${error.response?.status || error.message}`);
        }
    }
    
    console.log('\n🔒 App-Cloning Protection Test Complete!');
    console.log('Check ./logs/app_cloning_alerts.log for detailed cloning attempt logs');
}

// Run tests if server is running
testAppCloning().catch(error => {
    if (error.code === 'ECONNREFUSED') {
        console.log('❌ Server not running. Start with: node app.js');
    } else {
        console.error('Test error:', error.message);
    }
});
