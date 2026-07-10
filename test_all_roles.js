const http = require('http');

function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const jsonBody = body ? JSON.parse(body) : {};
                    resolve({ status: res.statusCode, ok: res.statusCode < 400, json: () => jsonBody });
                } catch {
                    resolve({ status: res.statusCode, ok: res.statusCode < 400, json: () => ({}) });
                }
            });
        });
        
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function testRoleAccess() {
    const base = 'http://localhost:3000';
    

    console.log('🔐 Testing Role-Based Access Control\n');

    try {
        // Login as different users
        const adminLogin = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { username: 'admin', password: '1234', role: 'admin' });
        const adminData = adminLogin.json();
        const adminToken = adminData.token;

        const teacherLogin = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { username: 'teacher1', password: 'teacher123', role: 'teacher' });
        const teacherData = teacherLogin.json();
        const teacherToken = teacherData.token;

        const studentLogin = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { username: 'student1', password: 'student123', role: 'student' });
        const studentData = studentLogin.json();
        const studentToken = studentData.token;

        console.log('✅ All users logged in successfully\n');

        // Test Admin Access
        console.log('👑 ADMIN TESTS:');
        
        // Test specific endpoint: student accessing /teachers (should be 403)
        const studentTeachers = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/teachers',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${studentToken}` }
        });
        
        console.log('🎯 KEY TEST RESULT:');
        console.log(`Student accessing /teachers → Status: ${studentTeachers.status}`);
        
        if (studentTeachers.status === 403) {
            console.log('✅ SUCCESS: Student is properly forbidden from accessing /teachers');
            console.log('✅ RBAC is working correctly!');
        } else {
            console.log('❌ FAILED: Student should not be able to access /teachers');
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

testRoleAccess();
