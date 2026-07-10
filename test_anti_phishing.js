const axios = require('axios');

// Anti-Phishing Test Suite
async function testAntiPhishing() {
    const baseURL = 'http://localhost:3000';
    
    console.log('🎣 Testing Anti-Phishing Protection...\n');
    
    // Test 1: Valid login request (should pass)
    console.log('1. Testing valid login request (should pass)...');
    try {
        const response = await axios.post(`${baseURL}/api/login`, {
            username: 'admin',
            password: '1234',
            role: 'admin'
        }, {
            headers: {
                'Host': 'localhost:3000',
                'Origin': 'http://localhost:3000',
                'Referer': 'http://localhost:3000/login.html'
            }
        });
        console.log('✅ Valid request passed through anti-phishing protection');
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Valid request passed anti-phishing (authentication failed as expected)');
        } else if (error.response?.status === 403) {
            console.log('❌ Valid request was blocked by anti-phishing protection');
            console.log(`   Response: ${error.response.data.message}`);
        } else {
            console.log(`ℹ️  Request result: ${error.response?.status || error.message}`);
        }
    }
    
    // Test 2: Invalid Host header
    console.log('\n2. Testing invalid Host header...');
    try {
        await axios.post(`${baseURL}/api/login`, {
            username: 'admin',
            password: '1234',
            role: 'admin'
        }, {
            headers: {
                'Host': 'malicious-phishing-site.com',
                'Origin': 'http://localhost:3000'
            }
        });
        console.log('❌ Invalid host was NOT blocked');
    } catch (error) {
        if (error.response?.status === 403 && error.response.data.code?.includes('PHISHING')) {
            console.log('✅ Invalid host BLOCKED by anti-phishing protection');
            console.log(`   Response: ${error.response.data.message}`);
        } else {
            console.log(`ℹ️  Unexpected response: ${error.response?.status || error.message}`);
        }
    }
    
    // Test 3: Invalid Origin header
    console.log('\n3. Testing invalid Origin header...');
    try {
        await axios.post(`${baseURL}/api/login`, {
            username: 'admin',
            password: '1234',
            role: 'admin'
        }, {
            headers: {
                'Host': 'localhost:3000',
                'Origin': 'http://fake-school-login.com'
            }
        });
        console.log('❌ Invalid origin was NOT blocked');
    } catch (error) {
        if (error.response?.status === 403 && error.response.data.code?.includes('PHISHING')) {
            console.log('✅ Invalid origin BLOCKED by anti-phishing protection');
            console.log(`   Response: ${error.response.data.message}`);
        } else {
            console.log(`ℹ️  Unexpected response: ${error.response?.status || error.message}`);
        }
    }
    
    // Test 4: Suspicious domain in referer
    console.log('\n4. Testing suspicious domain in referer...');
    try {
        await axios.post(`${baseURL}/api/login`, {
            username: 'admin',
            password: '1234',
            role: 'admin'
        }, {
            headers: {
                'Host': 'localhost:3000',
                'Origin': 'http://localhost:3000',
                'Referer': 'http://phishing-school-portal.com/fake-login.html'
            }
        });
        console.log('❌ Suspicious referer was NOT blocked');
    } catch (error) {
        if (error.response?.status === 403 && error.response.data.code?.includes('PHISHING')) {
            console.log('✅ Suspicious referer BLOCKED by anti-phishing protection');
            console.log(`   Response: ${error.response.data.message}`);
        } else {
            console.log(`ℹ️  Unexpected response: ${error.response?.status || error.message}`);
        }
    }
    
    // Test 5: Multiple suspicious indicators
    console.log('\n5. Testing multiple suspicious indicators...');
    try {
        await axios.post(`${baseURL}/api/login`, {
            username: 'admin',
            password: '1234',
            role: 'admin'
        }, {
            headers: {
                'Host': 'evil-school-hack.com',
                'Origin': 'http://credential-steal.com',
                'Referer': 'http://malicious-fake-login.com/steal.html',
                'User-Agent': 'PhishingBot/1.0'
            }
        });
        console.log('❌ Multiple suspicious indicators were NOT blocked');
    } catch (error) {
        if (error.response?.status === 403 && error.response.data.code?.includes('PHISHING')) {
            console.log('✅ Multiple suspicious indicators BLOCKED by anti-phishing protection');
            console.log(`   Response: ${error.response.data.message}`);
        } else {
            console.log(`ℹ️  Unexpected response: ${error.response?.status || error.message}`);
        }
    }
    
    // Test 6: Test non-login endpoint (should not be affected)
    console.log('\n6. Testing non-login endpoint with suspicious headers...');
    try {
        await axios.get(`${baseURL}/`, {
            headers: {
                'Host': 'suspicious-domain.com',
                'Referer': 'http://phishing-site.com'
            }
        });
        console.log('✅ Non-login endpoint passed (anti-phishing only applies to login)');
    } catch (error) {
        if (error.response?.status === 403) {
            console.log('ℹ️  Non-login endpoint was blocked (may be by other security measures)');
        } else {
            console.log(`ℹ️  Non-login endpoint result: ${error.response?.status || error.message}`);
        }
    }
    
    console.log('\n🎣 Anti-Phishing Test Complete!');
    console.log('Check ./logs/phishing_alerts.log for detailed phishing attempt logs');
}

// Run tests if server is running
testAntiPhishing().catch(error => {
    if (error.code === 'ECONNREFUSED') {
        console.log('❌ Server not running. Start with: node app.js');
    } else {
        console.error('Test error:', error.message);
    }
});
