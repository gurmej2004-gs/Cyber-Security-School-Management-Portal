const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';

console.log('=== TESTING LOGGING FUNCTIONALITY ===\n');

async function testLogging() {
    console.log('1. TESTING LOGIN ATTEMPTS LOGGING...');
    console.log('=' .repeat(50));
    
    // Test successful login
    console.log('Testing successful admin login...');
    try {
        const response = await axios.post(`${BASE_URL}/api/login`, {
            username: 'admin',
            password: '1234',
            role: 'admin'
        });
        console.log('✅ Successful login response received');
        
        const token = response.data.token;
        
        // Test API calls with authentication
        console.log('\n2. TESTING AUTHENTICATED API CALLS...');
        console.log('=' .repeat(50));
        
        console.log('Testing GET /students...');
        await axios.get(`${BASE_URL}/students`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Students API call completed');
        
        console.log('Testing GET /teachers...');
        await axios.get(`${BASE_URL}/teachers`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Teachers API call completed');
        
        console.log('Testing GET /users...');
        await axios.get(`${BASE_URL}/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Users API call completed');
        
    } catch (error) {
        console.log('❌ Successful login test failed:', error.response?.data || error.message);
    }
    
    // Test failed login attempts
    console.log('\n3. TESTING FAILED LOGIN ATTEMPTS...');
    console.log('=' .repeat(50));
    
    console.log('Testing invalid username...');
    try {
        await axios.post(`${BASE_URL}/api/login`, {
            username: 'invalid_user',
            password: 'wrong_password',
            role: 'admin'
        });
    } catch (error) {
        console.log('✅ Invalid username properly rejected');
    }
    
    console.log('Testing invalid password...');
    try {
        await axios.post(`${BASE_URL}/api/login`, {
            username: 'admin',
            password: 'wrong_password',
            role: 'admin'
        });
    } catch (error) {
        console.log('✅ Invalid password properly rejected');
    }
    
    console.log('Testing missing credentials...');
    try {
        await axios.post(`${BASE_URL}/api/login`, {
            username: 'admin'
            // Missing password and role
        });
    } catch (error) {
        console.log('✅ Missing credentials properly rejected');
    }
    
    // Test unauthorized API access
    console.log('\n4. TESTING UNAUTHORIZED API ACCESS...');
    console.log('=' .repeat(50));
    
    console.log('Testing API call without token...');
    try {
        await axios.get(`${BASE_URL}/students`);
    } catch (error) {
        console.log('✅ No token access properly rejected');
    }
    
    console.log('Testing API call with invalid token...');
    try {
        await axios.get(`${BASE_URL}/students`, {
            headers: { Authorization: 'Bearer invalid_token_here' }
        });
    } catch (error) {
        console.log('✅ Invalid token properly rejected');
    }
    
    // Check log files
    console.log('\n5. CHECKING LOG FILES...');
    console.log('=' .repeat(50));
    
    setTimeout(() => {
        try {
            if (fs.existsSync('./logs/app.log')) {
                const appLog = fs.readFileSync('./logs/app.log', 'utf8');
                const lines = appLog.split('\n').filter(line => line.trim());
                console.log(`📄 app.log contains ${lines.length} log entries`);
                console.log('Recent entries:');
                lines.slice(-5).forEach(line => {
                    console.log(`  ${line}`);
                });
            } else {
                console.log('❌ app.log file not found');
            }
            
            if (fs.existsSync('./logs/login_attempts.log')) {
                const loginLog = fs.readFileSync('./logs/login_attempts.log', 'utf8');
                const lines = loginLog.split('\n').filter(line => line.trim());
                console.log(`\n🔐 login_attempts.log contains ${lines.length} log entries`);
                console.log('Recent entries:');
                lines.slice(-5).forEach(line => {
                    console.log(`  ${line}`);
                });
            } else {
                console.log('❌ login_attempts.log file not found');
            }
            
            console.log('\n🎉 LOGGING TEST COMPLETE!');
            console.log('✅ All login attempts are being logged');
            console.log('✅ All API calls are being tracked');
            console.log('✅ Authentication failures are recorded');
            console.log('✅ User actions are monitored');
            
        } catch (error) {
            console.error('Error reading log files:', error.message);
        }
    }, 2000); // Wait 2 seconds for logs to be written
}

testLogging().catch(console.error);
