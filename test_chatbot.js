/**
 * Comprehensive Chatbot Testing Suite
 * Tests all chatbot functionality including NLP, RBAC, and security features
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
    BASE_URL: 'https://localhost:3443',
    API_ENDPOINT: '/api/chatbot',
    LOGIN_ENDPOINT: '/api/login',
    TIMEOUT: 10000,
    SSL_OPTIONS: {
        rejectUnauthorized: false // For self-signed certificates
    }
};

// Test users for different roles
const TEST_USERS = {
    admin: { username: 'admin', password: '1234', role: 'admin' },
    teacher: { username: 'teacher1', password: 'teacher123', role: 'teacher' },
    student: { username: 'student1', password: 'student123', role: 'student' }
};

// Test cases for different intents and roles
const TEST_CASES = [
    // Student queries
    {
        role: 'student',
        queries: [
            { message: 'show my grades', expectedIntent: 'grades' },
            { message: 'check attendance', expectedIntent: 'attendance' },
            { message: 'fee status', expectedIntent: 'fees' },
            { message: 'my schedule today', expectedIntent: 'schedule' },
            { message: 'help me', expectedIntent: 'help' },
            { message: 'security tips', expectedIntent: 'security_tips' },
            { message: 'about system', expectedIntent: 'about' }
        ]
    },
    // Teacher queries
    {
        role: 'teacher',
        queries: [
            { message: 'show my students', expectedIntent: 'students' },
            { message: 'class schedule', expectedIntent: 'schedule' },
            { message: 'pending assignments', expectedIntent: 'assignments' },
            { message: 'student attendance', expectedIntent: 'attendance' },
            { message: 'help', expectedIntent: 'help' }
        ]
    },
    // Admin queries
    {
        role: 'admin',
        queries: [
            { message: 'system status', expectedIntent: 'system_status' },
            { message: 'security alerts today', expectedIntent: 'security_alerts' },
            { message: 'show blocked IPs', expectedIntent: 'blocked_ips' },
            { message: 'user statistics', expectedIntent: 'user_stats' },
            { message: 'help', expectedIntent: 'help' }
        ]
    }
];

// Security test cases
const SECURITY_TEST_CASES = [
    {
        message: 'SELECT * FROM users',
        expectedType: 'warning',
        description: 'SQL injection attempt'
    },
    {
        message: '<script>alert("xss")</script>',
        expectedType: 'warning',
        description: 'XSS attempt'
    },
    {
        message: 'sudo rm -rf /',
        expectedType: 'warning',
        description: 'Command injection attempt'
    },
    {
        message: 'what is the admin password',
        expectedType: 'warning',
        description: 'Sensitive information request'
    }
];

class ChatbotTester {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            details: []
        };
        this.tokens = {};
    }

    async runAllTests() {
        console.log('🤖 Starting Chatbot Testing Suite...\n');
        
        try {
            // Login all test users
            await this.loginTestUsers();
            
            // Test role-based queries
            await this.testRoleBasedQueries();
            
            // Test security features
            await this.testSecurityFeatures();
            
            // Test unauthorized access
            await this.testUnauthorizedAccess();
            
            // Test edge cases
            await this.testEdgeCases();
            
            // Generate report
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
        }
    }

    async loginTestUsers() {
        console.log('🔐 Logging in test users...');
        
        for (const [role, credentials] of Object.entries(TEST_USERS)) {
            try {
                const token = await this.login(credentials);
                this.tokens[role] = token;
                console.log(`✅ ${role} login successful`);
            } catch (error) {
                console.log(`❌ ${role} login failed: ${error.message}`);
                throw new Error(`Failed to login ${role}`);
            }
        }
        console.log('');
    }

    async testRoleBasedQueries() {
        console.log('🎯 Testing role-based queries...');
        
        for (const testCase of TEST_CASES) {
            const { role, queries } = testCase;
            const token = this.tokens[role];
            
            console.log(`\n📋 Testing ${role} queries:`);
            
            for (const query of queries) {
                await this.testQuery(role, token, query);
            }
        }
    }

    async testSecurityFeatures() {
        console.log('\n🛡️ Testing security features...');
        
        const token = this.tokens.student; // Use student token for security tests
        
        for (const testCase of SECURITY_TEST_CASES) {
            await this.testSecurityQuery(token, testCase);
        }
    }

    async testUnauthorizedAccess() {
        console.log('\n🚫 Testing unauthorized access...');
        
        // Test without token
        await this.testWithoutToken();
        
        // Test with invalid token
        await this.testWithInvalidToken();
        
        // Test role restrictions
        await this.testRoleRestrictions();
    }

    async testEdgeCases() {
        console.log('\n🔍 Testing edge cases...');
        
        const token = this.tokens.student;
        
        const edgeCases = [
            { message: '', description: 'Empty message' },
            { message: 'a'.repeat(1000), description: 'Very long message' },
            { message: '   ', description: 'Whitespace only' },
            { message: '🤖🎓📚', description: 'Emoji only' },
            { message: 'unknown query xyz', description: 'Unknown intent' }
        ];
        
        for (const testCase of edgeCases) {
            await this.testEdgeCase(token, testCase);
        }
    }

    async testQuery(role, token, query) {
        try {
            const response = await this.sendChatbotRequest(token, query.message);
            
            this.results.total++;
            
            if (response.status === 'success' && response.intent === query.expectedIntent) {
                this.results.passed++;
                console.log(`  ✅ "${query.message}" → ${response.intent}`);
                this.results.details.push({
                    test: `${role}: ${query.message}`,
                    status: 'PASS',
                    expected: query.expectedIntent,
                    actual: response.intent
                });
            } else {
                this.results.failed++;
                console.log(`  ❌ "${query.message}" → Expected: ${query.expectedIntent}, Got: ${response.intent || 'error'}`);
                this.results.details.push({
                    test: `${role}: ${query.message}`,
                    status: 'FAIL',
                    expected: query.expectedIntent,
                    actual: response.intent || 'error',
                    error: response.message
                });
            }
        } catch (error) {
            this.results.total++;
            this.results.failed++;
            console.log(`  ❌ "${query.message}" → Error: ${error.message}`);
            this.results.details.push({
                test: `${role}: ${query.message}`,
                status: 'ERROR',
                error: error.message
            });
        }
    }

    async testSecurityQuery(token, testCase) {
        try {
            const response = await this.sendChatbotRequest(token, testCase.message);
            
            this.results.total++;
            
            if (response.type === testCase.expectedType) {
                this.results.passed++;
                console.log(`  ✅ ${testCase.description} → Blocked correctly`);
                this.results.details.push({
                    test: `Security: ${testCase.description}`,
                    status: 'PASS',
                    expected: 'Security warning',
                    actual: 'Security warning triggered'
                });
            } else {
                this.results.failed++;
                console.log(`  ❌ ${testCase.description} → Not blocked (Type: ${response.type})`);
                this.results.details.push({
                    test: `Security: ${testCase.description}`,
                    status: 'FAIL',
                    expected: 'Security warning',
                    actual: `Type: ${response.type}`
                });
            }
        } catch (error) {
            this.results.total++;
            this.results.failed++;
            console.log(`  ❌ ${testCase.description} → Error: ${error.message}`);
        }
    }

    async testWithoutToken() {
        try {
            await this.sendChatbotRequest(null, 'test message');
            this.results.total++;
            this.results.failed++;
            console.log('  ❌ Request without token should fail');
        } catch (error) {
            this.results.total++;
            this.results.passed++;
            console.log('  ✅ Request without token correctly rejected');
        }
    }

    async testWithInvalidToken() {
        try {
            await this.sendChatbotRequest('invalid_token', 'test message');
            this.results.total++;
            this.results.failed++;
            console.log('  ❌ Request with invalid token should fail');
        } catch (error) {
            this.results.total++;
            this.results.passed++;
            console.log('  ✅ Request with invalid token correctly rejected');
        }
    }

    async testRoleRestrictions() {
        // Test student trying to access admin functions
        const studentToken = this.tokens.student;
        
        try {
            const response = await this.sendChatbotRequest(studentToken, 'show system status');
            
            this.results.total++;
            
            if (response.intent === 'unknown' || response.message.includes('permission')) {
                this.results.passed++;
                console.log('  ✅ Student correctly denied admin functions');
            } else {
                this.results.failed++;
                console.log('  ❌ Student should not access admin functions');
            }
        } catch (error) {
            this.results.total++;
            this.results.failed++;
            console.log(`  ❌ Role restriction test error: ${error.message}`);
        }
    }

    async testEdgeCase(token, testCase) {
        try {
            const response = await this.sendChatbotRequest(token, testCase.message);
            
            this.results.total++;
            
            if (response.status === 'success' || response.status === 'error') {
                this.results.passed++;
                console.log(`  ✅ ${testCase.description} → Handled gracefully`);
            } else {
                this.results.failed++;
                console.log(`  ❌ ${testCase.description} → Not handled properly`);
            }
        } catch (error) {
            this.results.total++;
            
            if (testCase.message === '') {
                this.results.passed++;
                console.log(`  ✅ ${testCase.description} → Correctly rejected`);
            } else {
                this.results.failed++;
                console.log(`  ❌ ${testCase.description} → Error: ${error.message}`);
            }
        }
    }

    async login(credentials) {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify(credentials);
            
            const options = {
                hostname: 'localhost',
                port: 3443,
                path: TEST_CONFIG.LOGIN_ENDPOINT,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                ...TEST_CONFIG.SSL_OPTIONS
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.token) {
                            resolve(response.token);
                        } else {
                            reject(new Error(response.message || 'Login failed'));
                        }
                    } catch (error) {
                        reject(new Error('Invalid response format'));
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(TEST_CONFIG.TIMEOUT, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.write(postData);
            req.end();
        });
    }

    async sendChatbotRequest(token, message) {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({ message });
            
            const headers = {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const options = {
                hostname: 'localhost',
                port: 3443,
                path: TEST_CONFIG.API_ENDPOINT,
                method: 'POST',
                headers,
                ...TEST_CONFIG.SSL_OPTIONS
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (res.statusCode === 200) {
                            resolve(response);
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: ${response.message || data}`));
                        }
                    } catch (error) {
                        reject(new Error('Invalid response format'));
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(TEST_CONFIG.TIMEOUT, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.write(postData);
            req.end();
        });
    }

    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('🤖 CHATBOT TEST RESULTS');
        console.log('='.repeat(60));
        
        const passRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
        
        console.log(`📊 Total Tests: ${this.results.total}`);
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`📈 Pass Rate: ${passRate}%`);
        
        if (this.results.failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.results.details
                .filter(detail => detail.status !== 'PASS')
                .forEach(detail => {
                    console.log(`  • ${detail.test}: ${detail.error || 'Expected: ' + detail.expected + ', Got: ' + detail.actual}`);
                });
        }
        
        console.log('\n' + '='.repeat(60));
        
        // Save detailed results
        this.saveResults();
        
        if (passRate >= 90) {
            console.log('🎉 CHATBOT TESTS PASSED! System is ready for production.');
        } else if (passRate >= 70) {
            console.log('⚠️  CHATBOT TESTS PARTIALLY PASSED. Some issues need attention.');
        } else {
            console.log('❌ CHATBOT TESTS FAILED. Critical issues need to be resolved.');
        }
    }

    saveResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `chatbot_test_results_${timestamp}.json`;
        const filepath = path.join(__dirname, 'logs', filename);
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.results.total,
                passed: this.results.passed,
                failed: this.results.failed,
                passRate: ((this.results.passed / this.results.total) * 100).toFixed(1) + '%'
            },
            details: this.results.details,
            testConfig: TEST_CONFIG
        };
        
        try {
            // Ensure logs directory exists
            const logsDir = path.join(__dirname, 'logs');
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir, { recursive: true });
            }
            
            fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
            console.log(`📄 Detailed results saved to: ${filename}`);
        } catch (error) {
            console.log(`⚠️  Could not save results: ${error.message}`);
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new ChatbotTester();
    
    console.log('🚀 Chatbot Testing Suite');
    console.log('Testing comprehensive chatbot functionality...\n');
    
    // Wait a moment for any server startup
    setTimeout(() => {
        tester.runAllTests().catch(console.error);
    }, 2000);
}

module.exports = ChatbotTester;
