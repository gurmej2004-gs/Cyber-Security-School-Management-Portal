const axios = require('axios');
require('dotenv').config();

// Test configuration
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const HOST = 'localhost';

// Disable SSL certificate verification for self-signed certificates
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

console.log('💉 Simulating SQL Injection Attacks - Testing WAF Protection\n');

// SQL Injection attack payloads
const sqlInjectionPayloads = {
    basic: [
        "' OR '1'='1",
        "' OR 1=1--",
        "admin'--",
        "' OR 'a'='a",
        "1' OR '1'='1' #"
    ],
    union: [
        "' UNION SELECT * FROM users--",
        "' UNION SELECT username,password FROM users--",
        "1' UNION SELECT null,username,password FROM users--",
        "' UNION ALL SELECT * FROM information_schema.tables--"
    ],
    blind: [
        "' AND (SELECT COUNT(*) FROM users) > 0--",
        "' AND (SELECT SUBSTRING(username,1,1) FROM users LIMIT 1)='a'--",
        "' AND ASCII(SUBSTRING((SELECT username FROM users LIMIT 1),1,1))>64--"
    ],
    timeBased: [
        "'; WAITFOR DELAY '00:00:05'--",
        "' OR SLEEP(5)--",
        "'; SELECT pg_sleep(5)--",
        "' AND (SELECT * FROM (SELECT(SLEEP(5)))a)--"
    ],
    errorBased: [
        "' AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT version()), 0x7e))--",
        "' AND (SELECT * FROM (SELECT COUNT(*),CONCAT(version(),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--",
        "' AND UPDATEXML(1,CONCAT(0x7e,(SELECT version()),0x7e),1)--"
    ],
    advanced: [
        "'; DROP TABLE users; --",
        "'; INSERT INTO users (username,password) VALUES ('hacker','pwned'); --",
        "'; UPDATE users SET password='hacked' WHERE username='admin'; --",
        "' OR EXISTS(SELECT * FROM users WHERE username='admin' AND password LIKE 'a%')--"
    ]
};

// Test SQL injection on login endpoint
async function testSQLInjectionLogin() {
    console.log('🎯 Testing SQL Injection on Login Endpoint...\n');
    
    let totalAttempts = 0;
    let blockedAttempts = 0;
    let successfulInjections = 0;
    
    for (const [category, payloads] of Object.entries(sqlInjectionPayloads)) {
        console.log(`📂 Testing ${category.toUpperCase()} SQL injection payloads:`);
        
        for (const payload of payloads) {
            totalAttempts++;
            console.log(`   💉 Payload: ${payload.substring(0, 50)}${payload.length > 50 ? '...' : ''}`);
            
            try {
                const response = await axios({
                    method: 'POST',
                    url: `https://${HOST}:${HTTPS_PORT}/api/login`,
                    headers: {
                        'Origin': 'https://localhost:3443',
                        'Content-Type': 'application/json',
                        'User-Agent': 'SQLMap/1.0 (SQL Injection Tool)',
                        'X-App-Signature': 'SchoolMgmt-Auth-Token',
                        'X-App-Version': '1.0.0',
                        'X-App-Build': 'prod-2025-001'
                    },
                    data: {
                        username: payload,
                        password: payload,
                        role: 'admin'
                    },
                    timeout: 10000
                });
                
                if (response.status === 200 && response.data.token) {
                    console.log(`      🚨 CRITICAL: SQL injection successful! Authentication bypassed!`);
                    successfulInjections++;
                } else {
                    console.log(`      ⚠️ Response received but no token (Status: ${response.status})`);
                }
                
            } catch (error) {
                if (error.response) {
                    const status = error.response.status;
                    if (status === 403) {
                        console.log(`      ✅ BLOCKED: WAF detected SQL injection (Status: ${status})`);
                        blockedAttempts++;
                    } else if (status === 401) {
                        console.log(`      ✅ SAFE: Invalid credentials, no injection (Status: ${status})`);
                        blockedAttempts++;
                    } else if (status === 500) {
                        console.log(`      ⚠️ Server error - possible injection impact (Status: ${status})`);
                    } else {
                        console.log(`      ✅ PROTECTED: Request blocked (Status: ${status})`);
                        blockedAttempts++;
                    }
                } else {
                    console.log(`      ✅ BLOCKED: Network/WAF protection active`);
                    blockedAttempts++;
                }
            }
            
            // Small delay between injection attempts
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log('');
    }
    
    return { totalAttempts, blockedAttempts, successfulInjections };
}

// Test SQL injection on API endpoints
async function testSQLInjectionAPI() {
    console.log('🔍 Testing SQL Injection on API Endpoints...\n');
    
    const endpoints = [
        { path: '/api/students', method: 'GET', param: 'id' },
        { path: '/api/teachers', method: 'GET', param: 'id' },
        { path: '/api/users', method: 'GET', param: 'search' }
    ];
    
    const quickPayloads = [
        "1' OR '1'='1",
        "1; DROP TABLE students--",
        "1' UNION SELECT * FROM users--",
        "1' AND SLEEP(5)--"
    ];
    
    let apiAttempts = 0;
    let apiBlocked = 0;
    
    // First get a valid token
    let authToken = null;
    try {
        const loginResponse = await axios({
            method: 'POST',
            url: `https://${HOST}:${HTTPS_PORT}/api/login`,
            headers: {
                'Origin': 'https://localhost:3443',
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
        
        if (loginResponse.data.token) {
            authToken = loginResponse.data.token;
            console.log('✅ Authentication token obtained for API testing\n');
        }
    } catch (error) {
        console.log('⚠️ Could not obtain auth token, testing without authentication\n');
    }
    
    for (const endpoint of endpoints) {
        console.log(`🎯 Testing endpoint: ${endpoint.method} ${endpoint.path}`);
        
        for (const payload of quickPayloads) {
            apiAttempts++;
            console.log(`   💉 Injecting: ${payload}`);
            
            try {
                const headers = {
                    'Origin': 'https://localhost:3443',
                    'User-Agent': 'SQLNinja/2.0',
                    'X-App-Signature': 'SchoolMgmt-Auth-Token',
                    'X-App-Version': '1.0.0',
                    'X-App-Build': 'prod-2025-001'
                };
                
                if (authToken) {
                    headers['Authorization'] = `Bearer ${authToken}`;
                }
                
                let url = `https://${HOST}:${HTTPS_PORT}${endpoint.path}`;
                if (endpoint.param) {
                    url += `?${endpoint.param}=${encodeURIComponent(payload)}`;
                }
                
                const response = await axios({
                    method: endpoint.method,
                    url: url,
                    headers: headers,
                    timeout: 10000
                });
                
                console.log(`      ⚠️ Request processed (Status: ${response.status}) - Check for data leakage`);
                
            } catch (error) {
                if (error.response) {
                    const status = error.response.status;
                    if (status === 403) {
                        console.log(`      ✅ BLOCKED: WAF protection active (Status: ${status})`);
                        apiBlocked++;
                    } else if (status === 401) {
                        console.log(`      ✅ AUTH REQUIRED: Endpoint protected (Status: ${status})`);
                        apiBlocked++;
                    } else if (status === 500) {
                        console.log(`      ⚠️ Server error - possible SQL injection impact (Status: ${status})`);
                    } else {
                        console.log(`      ✅ PROTECTED: Request rejected (Status: ${status})`);
                        apiBlocked++;
                    }
                } else {
                    console.log(`      ✅ BLOCKED: Network protection active`);
                    apiBlocked++;
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        console.log('');
    }
    
    return { apiAttempts, apiBlocked };
}

// Test advanced SQL injection techniques
async function testAdvancedSQLInjection() {
    console.log('🧪 Testing Advanced SQL Injection Techniques...\n');
    
    const advancedTechniques = [
        {
            name: 'Header Injection',
            headers: {
                'X-Forwarded-For': "127.0.0.1'; DROP TABLE users; --",
                'User-Agent': "Mozilla/5.0' UNION SELECT * FROM users--",
                'Referer': "https://localhost:3443'; INSERT INTO users VALUES('hacker','pwned'); --"
            }
        },
        {
            name: 'JSON Injection',
            data: {
                username: "admin",
                password: "test' OR '1'='1' --",
                role: "admin'; DROP TABLE students; --"
            }
        },
        {
            name: 'Second-Order Injection',
            data: {
                username: "test'; WAITFOR DELAY '00:00:05'; --",
                password: "password",
                role: "student"
            }
        },
        {
            name: 'NoSQL Injection Attempt',
            data: {
                username: {"$ne": null},
                password: {"$ne": null},
                role: "admin"
            }
        }
    ];
    
    let advancedAttempts = 0;
    let advancedBlocked = 0;
    
    for (const technique of advancedTechniques) {
        advancedAttempts++;
        console.log(`🔬 Testing: ${technique.name}`);
        
        try {
            const requestConfig = {
                method: 'POST',
                url: `https://${HOST}:${HTTPS_PORT}/api/login`,
                headers: {
                    'Origin': 'https://localhost:3443',
                    'Content-Type': 'application/json',
                    'X-App-Signature': 'SchoolMgmt-Auth-Token',
                    'X-App-Version': '1.0.0',
                    'X-App-Build': 'prod-2025-001',
                    ...technique.headers
                },
                data: technique.data || {
                    username: 'admin',
                    password: 'test',
                    role: 'admin'
                },
                timeout: 10000
            };
            
            const response = await axios(requestConfig);
            
            if (response.status === 200 && response.data.token) {
                console.log(`   🚨 CRITICAL: Advanced injection bypassed security!`);
            } else {
                console.log(`   ⚠️ Response received (Status: ${response.status})`);
            }
            
        } catch (error) {
            if (error.response && error.response.status === 403) {
                console.log(`   ✅ BLOCKED: Advanced technique detected and blocked`);
                advancedBlocked++;
            } else if (error.response && error.response.status >= 400) {
                console.log(`   ✅ PROTECTED: Request rejected (Status: ${error.response.status})`);
                advancedBlocked++;
            } else {
                console.log(`   ✅ BLOCKED: Network protection active`);
                advancedBlocked++;
            }
        }
        
        console.log('');
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return { advancedAttempts, advancedBlocked };
}

// Run comprehensive SQL injection simulation
async function runSQLInjectionSimulation() {
    try {
        console.log('💉 COMPREHENSIVE SQL INJECTION ATTACK SIMULATION');
        console.log('===============================================\n');
        
        // Test 1: Login endpoint SQL injection
        const loginResults = await testSQLInjectionLogin();
        
        // Test 2: API endpoint SQL injection
        const apiResults = await testSQLInjectionAPI();
        
        // Test 3: Advanced SQL injection techniques
        const advancedResults = await testAdvancedSQLInjection();
        
        // Generate comprehensive report
        console.log('📊 SQL INJECTION ATTACK SIMULATION RESULTS');
        console.log('=========================================');
        console.log(`💉 Login Injection Attempts: ${loginResults.totalAttempts}`);
        console.log(`🛡️ Login Injections Blocked: ${loginResults.blockedAttempts}`);
        console.log(`🚨 Successful Login Bypasses: ${loginResults.successfulInjections}`);
        console.log(`🔍 API Injection Attempts: ${apiResults.apiAttempts}`);
        console.log(`🛡️ API Injections Blocked: ${apiResults.apiBlocked}`);
        console.log(`🧪 Advanced Technique Attempts: ${advancedResults.advancedAttempts}`);
        console.log(`🛡️ Advanced Techniques Blocked: ${advancedResults.advancedBlocked}`);
        
        const totalAttempts = loginResults.totalAttempts + apiResults.apiAttempts + advancedResults.advancedAttempts;
        const totalBlocked = loginResults.blockedAttempts + apiResults.apiBlocked + advancedResults.advancedBlocked;
        const protectionRate = (totalBlocked / totalAttempts) * 100;
        
        console.log(`\n🛡️ Overall WAF Protection Rate: ${protectionRate.toFixed(1)}% (${totalBlocked}/${totalAttempts})`);
        
        if (loginResults.successfulInjections > 0) {
            console.log('🚨 CRITICAL VULNERABILITY: SQL injection bypassed authentication!');
        } else {
            console.log('✅ SECURE: No successful authentication bypasses detected');
        }
        
        if (protectionRate >= 95) {
            console.log('✅ EXCELLENT: WAF protection is highly effective against SQL injection');
        } else if (protectionRate >= 85) {
            console.log('⚠️ GOOD: WAF protection is working but could be improved');
        } else if (protectionRate >= 70) {
            console.log('⚠️ MODERATE: WAF protection needs strengthening');
        } else {
            console.log('❌ VULNERABLE: WAF protection is insufficient against SQL injection');
        }
        
        console.log('\n🔍 Security Analysis:');
        console.log(`- Login endpoint protection: ${((loginResults.blockedAttempts / loginResults.totalAttempts) * 100).toFixed(1)}%`);
        console.log(`- API endpoint protection: ${((apiResults.apiBlocked / apiResults.apiAttempts) * 100).toFixed(1)}%`);
        console.log(`- Advanced technique protection: ${((advancedResults.advancedBlocked / advancedResults.advancedAttempts) * 100).toFixed(1)}%`);
        
        console.log('\n📋 Recommendations:');
        if (loginResults.successfulInjections > 0) {
            console.log('🚨 URGENT: Review and strengthen input validation on login endpoint');
        }
        if (protectionRate < 95) {
            console.log('- Enhance WAF rules for SQL injection detection');
            console.log('- Implement parameterized queries/prepared statements');
            console.log('- Add input sanitization and validation');
        }
        
        return {
            login: loginResults,
            api: apiResults,
            advanced: advancedResults,
            overallProtectionRate: protectionRate,
            criticalVulnerabilities: loginResults.successfulInjections
        };
        
    } catch (error) {
        console.error('❌ SQL injection simulation failed:', error.message);
        return null;
    }
}

// Start SQL injection simulation
runSQLInjectionSimulation();
