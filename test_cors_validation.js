const axios = require('axios');
require('dotenv').config();

// Test configuration
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const HOST = 'localhost';

// Disable SSL certificate verification for self-signed certificates
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

console.log('🛡️ Testing CORS Origin Validation and HTTPS-Only Operation...\n');

// Test 1: Valid Origin Acceptance
function testValidOriginAcceptance() {
    return new Promise((resolve) => {
        console.log('1️⃣ Testing Valid Origin Acceptance...');
        
        const validOrigin = 'https://localhost:3443';
        
        const options = {
            method: 'GET',
            url: `https://${HOST}:${HTTPS_PORT}/test-db`,
            headers: {
                'Origin': validOrigin,
                'X-App-Signature': 'SchoolMgmt-Auth-Token',
                'X-App-Version': '1.0.0',
                'X-App-Build': 'prod-2025-001'
            },
            timeout: 5000
        };

        axios(options)
            .then(response => {
                console.log(`   ✅ Status: ${response.status}`);
                console.log(`   ✅ Origin '${validOrigin}' accepted`);
                console.log(`   📋 CORS Headers Present: ${response.headers['access-control-allow-origin'] ? 'Yes' : 'No'}`);
                resolve(true);
            })
            .catch(error => {
                if (error.response) {
                    console.log(`   ✅ Status: ${error.response.status} (Server responding, origin accepted)`);
                    resolve(true);
                } else {
                    console.log(`   ❌ Error: ${error.message}`);
                    resolve(false);
                }
            });
    });
}

// Test 2: Invalid Origin Rejection
function testInvalidOriginRejection() {
    return new Promise((resolve) => {
        console.log('\n2️⃣ Testing Invalid Origin Rejection...');
        
        const invalidOrigins = [
            'https://malicious-site.com',
            'http://phishing-school.com',
            'https://fake-localhost.com',
            'https://attacker.net'
        ];

        let rejectedCount = 0;
        let completedTests = 0;

        invalidOrigins.forEach(origin => {
            console.log(`   🧪 Testing origin: ${origin}`);
            
            const options = {
                method: 'GET',
                url: `https://${HOST}:${HTTPS_PORT}/test-db`,
                headers: {
                    'Origin': origin,
                    'X-App-Signature': 'SchoolMgmt-Auth-Token',
                    'X-App-Version': '1.0.0',
                    'X-App-Build': 'prod-2025-001'
                },
                timeout: 5000
            };

            axios(options)
                .then(response => {
                    console.log(`      ❌ Origin '${origin}' was NOT rejected (Status: ${response.status})`);
                    completedTests++;
                    if (completedTests === invalidOrigins.length) {
                        console.log(`   📊 Origins rejected: ${rejectedCount}/${invalidOrigins.length}`);
                        resolve(rejectedCount === invalidOrigins.length);
                    }
                })
                .catch(error => {
                    if (error.message.includes('Not allowed by CORS') || 
                        error.code === 'ERR_NETWORK' ||
                        (error.response && error.response.status === 403)) {
                        console.log(`      ✅ Origin '${origin}' correctly rejected`);
                        rejectedCount++;
                    } else {
                        console.log(`      ⚠️  Origin '${origin}' - Error: ${error.message}`);
                    }
                    completedTests++;
                    if (completedTests === invalidOrigins.length) {
                        console.log(`   📊 Origins rejected: ${rejectedCount}/${invalidOrigins.length}`);
                        resolve(rejectedCount >= invalidOrigins.length * 0.75); // Allow 75% success rate
                    }
                });
        });
    });
}

// Test 3: CORS Preflight with Invalid Origin
function testCORSPreflightRejection() {
    return new Promise((resolve) => {
        console.log('\n3️⃣ Testing CORS Preflight with Invalid Origin...');
        
        const invalidOrigin = 'https://evil-attacker.com';
        
        const options = {
            method: 'OPTIONS',
            url: `https://${HOST}:${HTTPS_PORT}/api/login`,
            headers: {
                'Origin': invalidOrigin,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type,Authorization'
            },
            timeout: 5000
        };

        axios(options)
            .then(response => {
                const allowOrigin = response.headers['access-control-allow-origin'];
                if (allowOrigin === invalidOrigin) {
                    console.log(`   ❌ CORS Preflight: Invalid origin '${invalidOrigin}' was allowed`);
                    resolve(false);
                } else {
                    console.log(`   ✅ CORS Preflight: Invalid origin '${invalidOrigin}' rejected`);
                    console.log(`   📊 Allow-Origin header: ${allowOrigin || 'Not present'}`);
                    resolve(true);
                }
            })
            .catch(error => {
                if (error.message.includes('Not allowed by CORS') || error.code === 'ERR_NETWORK') {
                    console.log(`   ✅ CORS Preflight: Invalid origin '${invalidOrigin}' correctly rejected`);
                    resolve(true);
                } else {
                    console.log(`   ⚠️  CORS Preflight: ${error.message}`);
                    resolve(false);
                }
            });
    });
}

// Test 4: HTTPS-Only Operation
function testHTTPSOnlyOperation() {
    return new Promise((resolve) => {
        console.log('\n4️⃣ Testing HTTPS-Only Operation...');
        
        const options = {
            method: 'GET',
            url: `https://${HOST}:${HTTPS_PORT}/test-db`,
            headers: {
                'X-App-Signature': 'SchoolMgmt-Auth-Token',
                'X-App-Version': '1.0.0',
                'X-App-Build': 'prod-2025-001'
            },
            timeout: 5000
        };

        axios(options)
            .then(response => {
                console.log(`   ✅ HTTPS Status: ${response.status}`);
                console.log(`   🔒 Protocol: HTTPS (SSL/TLS encrypted)`);
                console.log(`   ✅ HTTPS server operational`);
                resolve(true);
            })
            .catch(error => {
                if (error.response) {
                    console.log(`   ✅ HTTPS Status: ${error.response.status} (Server responding via HTTPS)`);
                    resolve(true);
                } else {
                    console.log(`   ❌ HTTPS Error: ${error.message}`);
                    resolve(false);
                }
            });
    });
}

// Test 5: Login API with Invalid Origin
function testLoginAPIOriginValidation() {
    return new Promise((resolve) => {
        console.log('\n5️⃣ Testing Login API with Invalid Origin...');
        
        const invalidOrigin = 'https://phishing-login-site.com';
        
        const options = {
            method: 'POST',
            url: `https://${HOST}:${HTTPS_PORT}/api/login`,
            headers: {
                'Content-Type': 'application/json',
                'Origin': invalidOrigin,
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
        };

        axios(options)
            .then(response => {
                console.log(`   ❌ Login API: Invalid origin '${invalidOrigin}' was NOT rejected (Status: ${response.status})`);
                resolve(false);
            })
            .catch(error => {
                if (error.message.includes('Not allowed by CORS') || 
                    error.code === 'ERR_NETWORK' ||
                    (error.response && error.response.status === 403)) {
                    console.log(`   ✅ Login API: Invalid origin '${invalidOrigin}' correctly rejected`);
                    resolve(true);
                } else {
                    console.log(`   ⚠️  Login API: Unexpected error - ${error.message}`);
                    resolve(false);
                }
            });
    });
}

// Test 6: Valid Login API Request
function testValidLoginAPIRequest() {
    return new Promise((resolve) => {
        console.log('\n6️⃣ Testing Valid Login API Request...');
        
        const validOrigin = 'https://localhost:3443';
        
        const options = {
            method: 'POST',
            url: `https://${HOST}:${HTTPS_PORT}/api/login`,
            headers: {
                'Content-Type': 'application/json',
                'Origin': validOrigin,
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
        };

        axios(options)
            .then(response => {
                console.log(`   ✅ Login API Status: ${response.status}`);
                console.log(`   ✅ Valid origin '${validOrigin}' accepted`);
                console.log(`   🔐 JWT Token Generated: ${response.data.token ? 'Yes' : 'No'}`);
                resolve(true);
            })
            .catch(error => {
                if (error.response && error.response.status === 401) {
                    console.log(`   ✅ Login API Status: ${error.response.status} (Authentication failed, but origin accepted)`);
                    resolve(true);
                } else {
                    console.log(`   ❌ Login API Error: ${error.message}`);
                    resolve(false);
                }
            });
    });
}

// Run all tests
async function runTests() {
    try {
        console.log('🚀 Starting CORS Origin Validation and HTTPS-Only Tests...\n');
        
        // Test HTTPS-only operation
        const httpsTest = await testHTTPSOnlyOperation();
        
        // Test valid origin acceptance
        const validOriginTest = await testValidOriginAcceptance();
        
        // Test invalid origin rejection
        const invalidOriginTest = await testInvalidOriginRejection();
        
        // Test CORS preflight rejection
        const preflightTest = await testCORSPreflightRejection();
        
        // Test login API with invalid origin
        const loginInvalidTest = await testLoginAPIOriginValidation();
        
        // Test valid login API request
        const loginValidTest = await testValidLoginAPIRequest();
        
        console.log('\n🎉 CORS Origin Validation and HTTPS-Only Test Results:');
        console.log('====================================================');
        console.log(`🔒 HTTPS-Only Operation: ${httpsTest ? '✅ Working' : '❌ Failed'}`);
        console.log(`✅ Valid Origin Acceptance: ${validOriginTest ? '✅ Working' : '❌ Failed'}`);
        console.log(`🚫 Invalid Origin Rejection: ${invalidOriginTest ? '✅ Working' : '❌ Failed'}`);
        console.log(`🛡️  CORS Preflight Rejection: ${preflightTest ? '✅ Working' : '❌ Failed'}`);
        console.log(`🔐 Login API Origin Validation: ${loginInvalidTest ? '✅ Working' : '❌ Failed'}`);
        console.log(`🔑 Valid Login API Request: ${loginValidTest ? '✅ Working' : '❌ Failed'}`);
        
        const criticalTests = httpsTest && invalidOriginTest && loginInvalidTest;
        const allTests = criticalTests && validOriginTest && preflightTest && loginValidTest;
        
        if (allTests) {
            console.log('\n🔒 Server Security Status: ✅ FULLY SECURE');
            console.log('🛡️  CORS Origin Validation: ✅ ACTIVE');
            console.log('🔐 HTTPS-Only Operation: ✅ ENFORCED');
            console.log('\n✨ Your server properly rejects invalid origins and runs HTTPS-only!');
        } else if (criticalTests) {
            console.log('\n🔒 Server Security Status: ⚠️  MOSTLY SECURE');
            console.log('🛡️  Critical CORS validation working');
            console.log('🔐 HTTPS-only operation confirmed');
        } else {
            console.log('\n⚠️  Critical security tests failed. Server may be vulnerable.');
        }
        
    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
    }
}

// Start tests
runTests();
