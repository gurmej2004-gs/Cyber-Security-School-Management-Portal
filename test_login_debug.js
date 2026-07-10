const fetch = require('node-fetch');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// Test configuration
const BASE_URL = 'https://localhost:3443';
const TEST_USERS = [
    { username: 'admin', password: '1234', role: 'admin' },
    { username: 'teacher1', password: 'teacher1', role: 'teacher' },
    { username: 'student1', password: 'student1', role: 'student' }
];

class LoginTester {
    constructor() {
        this.results = [];
        this.db = new sqlite3.Database('./school.db');
    }

    async testDatabaseConnection() {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
                if (err) {
                    console.error('❌ Database connection failed:', err.message);
                    this.results.push({
                        test: 'Database Connection',
                        status: 'FAILED',
                        error: err.message
                    });
                    reject(err);
                } else {
                    console.log(`✅ Database connected. Users count: ${row.count}`);
                    this.results.push({
                        test: 'Database Connection',
                        status: 'PASSED',
                        details: `${row.count} users found`
                    });
                    resolve();
                }
            });
        });
    }

    async testUserExists(username, role) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM users WHERE username = ? AND role = ?',
                [username, role], (err, user) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(user);
                }
            });
        });
    }

    async testPasswordHash(username, role, plainPassword) {
        const user = await this.testUserExists(username, role);
        if (!user) return null;

        return bcrypt.compare(plainPassword, user.password);
    }

    async testLoginEndpoint(username, password, role) {
        const testData = {
            username,
            password,
            role
        };

        try {
            const response = await fetch(`${BASE_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'LoginTester/1.0'
                },
                body: JSON.stringify(testData)
            });

            const data = await response.json();

            return {
                status: response.status,
                success: response.ok,
                data: data,
                testData: testData
            };

        } catch (error) {
            return {
                status: 0,
                success: false,
                error: error.message,
                testData: testData
            };
        }
    }

    async runAllTests() {
        console.log('🔍 Starting comprehensive login system diagnostics...\n');

        // Test 1: Database Connection
        try {
            await this.testDatabaseConnection();
        } catch (err) {
            console.error('Database test failed:', err);
        }

        // Test 2: Check each user
        for (const user of TEST_USERS) {
            console.log(`\n🔍 Testing user: ${user.username} (${user.role})`);

            const userExists = await this.testUserExists(user.username, user.role);
            if (!userExists) {
                this.results.push({
                    test: `User Check - ${user.username}`,
                    status: 'FAILED',
                    error: 'User not found in database'
                });
                console.log(`❌ User ${user.username} not found in database`);
                continue;
            }

            console.log(`✅ User ${user.username} exists in database`);
            console.log(`   First login flag: ${userExists.first_login}`);

            // Test 3: Password verification
            const isPasswordValid = await this.testPasswordHash(user.username, user.role, user.password);
            this.results.push({
                test: `Password Check - ${user.username}`,
                status: isPasswordValid ? 'PASSED' : 'FAILED',
                details: `Expected password: ${user.password}`
            });

            if (isPasswordValid) {
                console.log(`✅ Password hash verification passed`);
            } else {
                console.log(`❌ Password hash verification failed`);
            }

            // Test 4: API endpoint
            console.log(`📡 Testing API endpoint...`);
            const apiResult = await this.testLoginEndpoint(user.username, user.password, user.role);

            this.results.push({
                test: `API Login - ${user.username}`,
                status: apiResult.success ? 'PASSED' : 'FAILED',
                details: `Status: ${apiResult.status}, Response: ${JSON.stringify(apiResult.data)}`,
                error: apiResult.error
            });

            if (apiResult.success) {
                console.log(`✅ API login successful`);
                console.log(`   Response status: ${apiResult.status}`);
                console.log(`   User role: ${apiResult.data.user?.role}`);
                console.log(`   Session created: ${!!apiResult.data.sessionId}`);
            } else {
                console.log(`❌ API login failed`);
                console.log(`   Status: ${apiResult.status}`);
                console.log(`   Error: ${apiResult.error || apiResult.data?.message}`);
            }
        }

        this.printSummary();
        this.db.close();
    }

    printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 LOGIN SYSTEM DIAGNOSTIC SUMMARY');
        console.log('='.repeat(50));

        const passed = this.results.filter(r => r.status === 'PASSED').length;
        const failed = this.results.filter(r => r.status === 'FAILED').length;
        const total = this.results.length;

        console.log(`✅ Tests Passed: ${passed}/${total}`);
        console.log(`❌ Tests Failed: ${failed}/${total}`);
        console.log(`📈 Success Rate: ${total > 0 ? Math.round((passed/total) * 100) : 0}%`);

        console.log('\n📋 DETAILED RESULTS:');
        console.log('-'.repeat(30));

        this.results.forEach((result, index) => {
            const status = result.status === 'PASSED' ? '✅' : '❌';
            console.log(`${status} ${result.test}`);
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
            if (result.details) {
                console.log(`   Details: ${result.details}`);
            }
        });

        if (failed > 0) {
            console.log('\n🔧 RECOMMENDED FIXES:');
            console.log('-'.repeat(30));

            const failedTests = this.results.filter(r => r.status === 'FAILED');
            failedTests.forEach(test => {
                if (test.test.includes('Database')) {
                    console.log('• Check database connection and table structure');
                } else if (test.test.includes('Password')) {
                    console.log('• Verify user passwords and hash compatibility');
                } else if (test.test.includes('API')) {
                    console.log('• Check server status and API endpoint configuration');
                }
            });
        }

        console.log('\n' + '='.repeat(50));
    }
}

// Install node-fetch if not available
try {
    require.resolve('node-fetch');
} catch (e) {
    console.log('Installing node-fetch...');
    require('child_process').execSync('npm install node-fetch', { stdio: 'inherit' });
}

// Run the tests
const tester = new LoginTester();
tester.runAllTests().catch(console.error);
