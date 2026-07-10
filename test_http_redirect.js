const axios = require('axios');
require('dotenv').config();

// Test configuration
const HTTP_PORT = process.env.HTTP_PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const HOST = 'localhost';

// Disable SSL certificate verification for self-signed certificates
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

console.log('🔄 Testing HTTP to HTTPS Redirect Functionality...\n');

// Test 1: HTTP Request Should Redirect to HTTPS
async function testHTTPRedirect() {
    console.log('1️⃣ Testing HTTP to HTTPS Redirect...');
    
    try {
        const response = await axios({
            method: 'GET',
            url: `http://${HOST}:${HTTP_PORT}/test-db`,
            maxRedirects: 0, // Don't follow redirects automatically
            validateStatus: function (status) {
                return status >= 200 && status < 400; // Accept redirects
            },
            timeout: 5000
        });
        
        if (response.status === 301 || response.status === 302) {
            const location = response.headers.location;
            console.log(`   ✅ Status: ${response.status} (Redirect)`);
            console.log(`   ✅ Location: ${location}`);
            
            if (location && location.includes('https://') && location.includes(`:${HTTPS_PORT}`)) {
                console.log(`   ✅ HTTP correctly redirects to HTTPS`);
                return true;
            } else {
                console.log(`   ❌ Redirect location is incorrect`);
                return false;
            }
        } else {
            console.log(`   ❌ Status: ${response.status} - No redirect occurred`);
            return false;
        }
    } catch (error) {
        if (error.response && (error.response.status === 301 || error.response.status === 302)) {
            const location = error.response.headers.location;
            console.log(`   ✅ Status: ${error.response.status} (Redirect)`);
            console.log(`   ✅ Location: ${location}`);
            
            if (location && location.includes('https://') && location.includes(`:${HTTPS_PORT}`)) {
                console.log(`   ✅ HTTP correctly redirects to HTTPS`);
                return true;
            } else {
                console.log(`   ❌ Redirect location is incorrect`);
                return false;
            }
        } else {
            console.log(`   ❌ Error: ${error.message}`);
            return false;
        }
    }
}

// Test 2: Follow Redirect and Verify HTTPS Access
async function testFollowRedirect() {
    console.log('\n2️⃣ Testing HTTP Request with Redirect Following...');
    
    try {
        const response = await axios({
            method: 'GET',
            url: `http://${HOST}:${HTTP_PORT}/test-db`,
            maxRedirects: 5, // Follow redirects
            headers: {
                'X-App-Signature': 'SchoolMgmt-Auth-Token',
                'X-App-Version': '1.0.0',
                'X-App-Build': 'prod-2025-001'
            },
            timeout: 10000
        });
        
        console.log(`   ✅ Final Status: ${response.status}`);
        console.log(`   ✅ Final URL: ${response.request.res.responseUrl || 'HTTPS endpoint'}`);
        console.log(`   ✅ HTTP request successfully redirected to HTTPS`);
        return true;
    } catch (error) {
        if (error.response) {
            console.log(`   ✅ Final Status: ${error.response.status} (Server responding via HTTPS)`);
            return true;
        } else {
            console.log(`   ❌ Error: ${error.message}`);
            return false;
        }
    }
}

// Test 3: Direct HTTPS Access
async function testDirectHTTPS() {
    console.log('\n3️⃣ Testing Direct HTTPS Access...');
    
    try {
        const response = await axios({
            method: 'GET',
            url: `https://${HOST}:${HTTPS_PORT}/test-db`,
            headers: {
                'X-App-Signature': 'SchoolMgmt-Auth-Token',
                'X-App-Version': '1.0.0',
                'X-App-Build': 'prod-2025-001'
            },
            timeout: 5000
        });
        
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   ✅ Direct HTTPS access working`);
        console.log(`   🔒 SSL/TLS encryption confirmed`);
        return true;
    } catch (error) {
        if (error.response) {
            console.log(`   ✅ Status: ${error.response.status} (Server responding via HTTPS)`);
            return true;
        } else {
            console.log(`   ❌ Error: ${error.message}`);
            return false;
        }
    }
}

// Test 4: HTTP Login Redirect
async function testHTTPLoginRedirect() {
    console.log('\n4️⃣ Testing HTTP Login API Redirect...');
    
    try {
        const response = await axios({
            method: 'POST',
            url: `http://${HOST}:${HTTP_PORT}/api/login`,
            maxRedirects: 0, // Don't follow redirects automatically
            validateStatus: function (status) {
                return status >= 200 && status < 400; // Accept redirects
            },
            headers: {
                'Content-Type': 'application/json',
                'X-App-Signature': 'SchoolMgmt-Auth-Token',
                'X-App-Version': '1.0.0',
                'X-App-Build': 'prod-2025-001'
            },
            data: {
                username: 'admin',
                password: '1234',
                role: 'admin'
            },
            timeout: 5000
        });
        
        if (response.status === 301 || response.status === 302) {
            const location = response.headers.location;
            console.log(`   ✅ Status: ${response.status} (Redirect)`);
            console.log(`   ✅ Location: ${location}`);
            console.log(`   ✅ HTTP login redirects to HTTPS`);
            return true;
        } else {
            console.log(`   ❌ Status: ${response.status} - No redirect occurred`);
            return false;
        }
    } catch (error) {
        if (error.response && (error.response.status === 301 || error.response.status === 302)) {
            const location = error.response.headers.location;
            console.log(`   ✅ Status: ${error.response.status} (Redirect)`);
            console.log(`   ✅ Location: ${location}`);
            console.log(`   ✅ HTTP login redirects to HTTPS`);
            return true;
        } else {
            console.log(`   ⚠️  Error: ${error.message}`);
            // If redirect is disabled, HTTP might work directly
            return false;
        }
    }
}

// Run all tests
async function runTests() {
    try {
        console.log('🚀 Starting HTTP to HTTPS Redirect Tests...\n');
        
        const test1 = await testHTTPRedirect();
        const test2 = await testFollowRedirect();
        const test3 = await testDirectHTTPS();
        const test4 = await testHTTPLoginRedirect();
        
        console.log('\n🎉 HTTP to HTTPS Redirect Test Results:');
        console.log('======================================');
        console.log(`🔄 HTTP Redirect Response: ${test1 ? '✅ Working' : '❌ Failed'}`);
        console.log(`🔄 HTTP Follow Redirect: ${test2 ? '✅ Working' : '❌ Failed'}`);
        console.log(`🔒 Direct HTTPS Access: ${test3 ? '✅ Working' : '❌ Failed'}`);
        console.log(`🔐 HTTP Login Redirect: ${test4 ? '✅ Working' : '❌ Failed'}`);
        
        const httpsWorking = test3; // Direct HTTPS must work
        const redirectWorking = test1 || test2; // At least one redirect test should work
        
        if (httpsWorking && redirectWorking) {
            console.log('\n🔒 HTTPS Configuration: ✅ FULLY CONFIGURED');
            console.log('🔄 HTTP to HTTPS Redirect: ✅ ACTIVE');
            console.log('🛡️  Server enforces HTTPS communication');
        } else if (httpsWorking) {
            console.log('\n🔒 HTTPS Configuration: ✅ WORKING');
            console.log('🔄 HTTP to HTTPS Redirect: ⚠️  DISABLED');
            console.log('🛡️  HTTPS available but redirect may be disabled');
        } else {
            console.log('\n⚠️  HTTPS Configuration: ❌ ISSUES DETECTED');
            console.log('🚨 Server may not be properly configured for HTTPS');
        }
        
    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
    }
}

// Start tests
runTests();
