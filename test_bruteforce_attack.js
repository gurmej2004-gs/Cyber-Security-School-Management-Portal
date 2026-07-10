const axios = require('axios');
require('dotenv').config();

// Test configuration
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const HOST = 'localhost';

// Disable SSL certificate verification for self-signed certificates
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

console.log('💥 Simulating Brute-Force Attacks - Testing IPS Protection\n');

// Brute-force attack simulation
async function simulateBruteForceAttack() {
    console.log('🚨 Starting Brute-Force Attack Simulation...\n');
    
    const commonPasswords = [
        'password', '123456', 'admin', 'letmein', 'welcome',
        'qwerty', 'password123', 'admin123', '12345678',
        'iloveyou', 'princess', 'monkey', 'abc123'
    ];
    
    const targetUsers = ['admin', 'teacher', 'student', 'root', 'administrator'];
    
    let attemptCount = 0;
    let blockedAttempts = 0;
    let successfulAttempts = 0;
    let ipBlocked = false;
    let blockDetectedAt = 0;
    
    console.log('🎯 Target: Login endpoint');
    console.log('🔫 Attack type: Credential brute-force');
    console.log('📊 Testing IPS auto-blocking after failed attempts\n');
    
    // Rapid-fire brute force attempts
    for (const username of targetUsers) {
        if (ipBlocked) break;
        
        console.log(`👤 Targeting user: ${username}`);
        
        for (const password of commonPasswords) {
            if (ipBlocked) break;
            
            attemptCount++;
            console.log(`   🔓 Attempt ${attemptCount}: ${username}:${password}`);
            
            try {
                const response = await axios({
                    method: 'POST',
                    url: `https://${HOST}:${HTTPS_PORT}/api/login`,
                    headers: {
                        'Origin': 'https://localhost:3443',
                        'Content-Type': 'application/json',
                        'User-Agent': 'BruteForce-Bot/1.0',
                        'X-App-Signature': 'SchoolMgmt-Auth-Token',
                        'X-App-Version': '1.0.0',
                        'X-App-Build': 'prod-2025-001'
                    },
                    data: {
                        username: username,
                        password: password,
                        role: username === 'admin' ? 'admin' : 'student'
                    },
                    timeout: 5000
                });
                
                if (response.status === 200) {
                    console.log(`      ✅ SUCCESS: Credentials found! ${username}:${password}`);
                    successfulAttempts++;
                } else {
                    console.log(`      ❌ Failed (Status: ${response.status})`);
                }
                
            } catch (error) {
                if (error.response) {
                    const status = error.response.status;
                    
                    if (status === 429) {
                        console.log(`      🛡️ RATE LIMITED: Too many requests (Status: ${status})`);
                        blockedAttempts++;
                    } else if (status === 403) {
                        console.log(`      🚫 IP BLOCKED: IPS protection activated (Status: ${status})`);
                        ipBlocked = true;
                        blockDetectedAt = attemptCount;
                        blockedAttempts++;
                        break;
                    } else if (status === 401) {
                        console.log(`      ❌ Invalid credentials (Status: ${status})`);
                    } else {
                        console.log(`      ⚠️ Unexpected response (Status: ${status})`);
                        blockedAttempts++;
                    }
                } else {
                    console.log(`      🚫 BLOCKED: ${error.message}`);
                    blockedAttempts++;
                }
            }
            
            // Small delay between attempts (realistic brute-force timing)
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        console.log('');
    }
    
    return {
        totalAttempts: attemptCount,
        blockedAttempts: blockedAttempts,
        successfulAttempts: successfulAttempts,
        ipBlocked: ipBlocked,
        blockDetectedAt: blockDetectedAt
    };
}

// Distributed brute-force simulation (multiple IPs)
async function simulateDistributedBruteForce() {
    console.log('🌐 Simulating Distributed Brute-Force Attack...\n');
    
    const fakeIPs = [
        '192.168.1.100',
        '10.0.0.50',
        '172.16.0.25',
        '203.0.113.10',
        '198.51.100.5'
    ];
    
    let distributedAttempts = 0;
    let distributedBlocked = 0;
    
    for (const fakeIP of fakeIPs) {
        console.log(`🌍 Simulating attack from IP: ${fakeIP}`);
        
        for (let i = 0; i < 5; i++) {
            distributedAttempts++;
            
            try {
                const response = await axios({
                    method: 'POST',
                    url: `https://${HOST}:${HTTPS_PORT}/api/login`,
                    headers: {
                        'Origin': 'https://localhost:3443',
                        'Content-Type': 'application/json',
                        'X-Forwarded-For': fakeIP,
                        'X-Real-IP': fakeIP,
                        'User-Agent': `AttackBot-${fakeIP}`,
                        'X-App-Signature': 'SchoolMgmt-Auth-Token',
                        'X-App-Version': '1.0.0',
                        'X-App-Build': 'prod-2025-001'
                    },
                    data: {
                        username: 'admin',
                        password: `attack${i}`,
                        role: 'admin'
                    },
                    timeout: 5000
                });
                
                console.log(`   ⚠️ Request processed (Status: ${response.status})`);
                
            } catch (error) {
                if (error.response && error.response.status >= 400) {
                    console.log(`   ✅ Blocked (Status: ${error.response.status})`);
                    distributedBlocked++;
                } else {
                    console.log(`   ✅ Network blocked: ${error.message}`);
                    distributedBlocked++;
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        console.log('');
    }
    
    return {
        distributedAttempts: distributedAttempts,
        distributedBlocked: distributedBlocked
    };
}

// Password spraying attack simulation
async function simulatePasswordSprayAttack() {
    console.log('🌧️ Simulating Password Spraying Attack...\n');
    
    const commonPasswords = ['password', '123456', 'admin'];
    const userList = [
        'admin', 'teacher1', 'teacher2', 'student1', 'student2',
        'principal', 'secretary', 'librarian', 'janitor', 'nurse'
    ];
    
    let sprayAttempts = 0;
    let sprayBlocked = 0;
    
    console.log('🎯 Strategy: Try common passwords against multiple users');
    console.log('💡 This technique avoids account lockouts but may trigger IPS\n');
    
    for (const password of commonPasswords) {
        console.log(`🔑 Testing password: "${password}" against all users`);
        
        for (const username of userList) {
            sprayAttempts++;
            
            try {
                const response = await axios({
                    method: 'POST',
                    url: `https://${HOST}:${HTTPS_PORT}/api/login`,
                    headers: {
                        'Origin': 'https://localhost:3443',
                        'Content-Type': 'application/json',
                        'User-Agent': 'PasswordSpray-Tool/2.0',
                        'X-App-Signature': 'SchoolMgmt-Auth-Token',
                        'X-App-Version': '1.0.0',
                        'X-App-Build': 'prod-2025-001'
                    },
                    data: {
                        username: username,
                        password: password,
                        role: username === 'admin' ? 'admin' : 'student'
                    },
                    timeout: 5000
                });
                
                if (response.status === 200) {
                    console.log(`   🚨 BREACH: ${username}:${password} - Login successful!`);
                } else {
                    console.log(`   ❌ ${username}: Failed`);
                }
                
            } catch (error) {
                if (error.response && error.response.status >= 400) {
                    console.log(`   ✅ ${username}: Blocked (Status: ${error.response.status})`);
                    sprayBlocked++;
                } else {
                    console.log(`   ✅ ${username}: Protected`);
                    sprayBlocked++;
                }
            }
            
            // Slower timing to avoid immediate detection
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log('');
        // Longer delay between password attempts
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return {
        sprayAttempts: sprayAttempts,
        sprayBlocked: sprayBlocked
    };
}

// Credential stuffing simulation
async function simulateCredentialStuffing() {
    console.log('📋 Simulating Credential Stuffing Attack...\n');
    
    const stolenCredentials = [
        { username: 'admin', password: 'admin123' },
        { username: 'admin', password: 'password' },
        { username: 'teacher', password: 'teacher123' },
        { username: 'student', password: 'student123' },
        { username: 'admin', password: 'school2024' },
        { username: 'principal', password: 'principal123' }
    ];
    
    let stuffingAttempts = 0;
    let stuffingBlocked = 0;
    let credentialHits = 0;
    
    console.log('💾 Using "stolen" credential database');
    console.log('🎯 Testing known username:password combinations\n');
    
    for (const cred of stolenCredentials) {
        stuffingAttempts++;
        console.log(`🔐 Testing: ${cred.username}:${cred.password}`);
        
        try {
            const response = await axios({
                method: 'POST',
                url: `https://${HOST}:${HTTPS_PORT}/api/login`,
                headers: {
                    'Origin': 'https://localhost:3443',
                    'Content-Type': 'application/json',
                    'User-Agent': 'CredentialStuffer/3.0',
                    'X-App-Signature': 'SchoolMgmt-Auth-Token',
                    'X-App-Version': '1.0.0',
                    'X-App-Build': 'prod-2025-001'
                },
                data: {
                    username: cred.username,
                    password: cred.password,
                    role: cred.username === 'admin' ? 'admin' : 'student'
                },
                timeout: 5000
            });
            
            if (response.status === 200) {
                console.log(`   🎯 HIT: Valid credentials found!`);
                credentialHits++;
            } else {
                console.log(`   ❌ Invalid credentials`);
            }
            
        } catch (error) {
            if (error.response && error.response.status >= 400) {
                console.log(`   ✅ Blocked by security system (Status: ${error.response.status})`);
                stuffingBlocked++;
            } else {
                console.log(`   ✅ Network protection active`);
                stuffingBlocked++;
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return {
        stuffingAttempts: stuffingAttempts,
        stuffingBlocked: stuffingBlocked,
        credentialHits: credentialHits
    };
}

// Run comprehensive brute-force simulation
async function runBruteForceSimulation() {
    try {
        console.log('💥 COMPREHENSIVE BRUTE-FORCE ATTACK SIMULATION');
        console.log('==============================================\n');
        
        // Test 1: Standard brute-force attack
        const bruteForceResults = await simulateBruteForceAttack();
        
        // Test 2: Distributed brute-force
        const distributedResults = await simulateDistributedBruteForce();
        
        // Test 3: Password spraying
        const sprayResults = await simulatePasswordSprayAttack();
        
        // Test 4: Credential stuffing
        const stuffingResults = await simulateCredentialStuffing();
        
        // Generate comprehensive report
        console.log('📊 BRUTE-FORCE ATTACK SIMULATION RESULTS');
        console.log('=======================================');
        console.log(`🔫 Brute-Force Attempts: ${bruteForceResults.totalAttempts}`);
        console.log(`🛡️ Brute-Force Blocked: ${bruteForceResults.blockedAttempts}`);
        console.log(`🚫 IP Blocked After: ${bruteForceResults.blockDetectedAt} attempts`);
        console.log(`🌐 Distributed Attacks Blocked: ${distributedResults.distributedBlocked}/${distributedResults.distributedAttempts}`);
        console.log(`🌧️ Password Spray Blocked: ${sprayResults.sprayBlocked}/${sprayResults.sprayAttempts}`);
        console.log(`📋 Credential Stuffing Blocked: ${stuffingResults.stuffingBlocked}/${stuffingResults.stuffingAttempts}`);
        
        const totalAttempts = bruteForceResults.totalAttempts + distributedResults.distributedAttempts + 
                             sprayResults.sprayAttempts + stuffingResults.stuffingAttempts;
        const totalBlocked = bruteForceResults.blockedAttempts + distributedResults.distributedBlocked + 
                            sprayResults.sprayBlocked + stuffingResults.stuffingBlocked;
        const protectionRate = (totalBlocked / totalAttempts) * 100;
        
        console.log(`\n🛡️ Overall IPS Protection Rate: ${protectionRate.toFixed(1)}% (${totalBlocked}/${totalAttempts})`);
        
        if (bruteForceResults.ipBlocked) {
            console.log('✅ EXCELLENT: IPS auto-blocking is active and effective');
        } else {
            console.log('⚠️ WARNING: IPS auto-blocking may not be working properly');
        }
        
        if (protectionRate >= 80) {
            console.log('✅ SECURE: Brute-force protection is highly effective');
        } else if (protectionRate >= 60) {
            console.log('⚠️ MODERATE: Brute-force protection needs improvement');
        } else {
            console.log('❌ VULNERABLE: Brute-force protection is insufficient');
        }
        
        console.log('\n🔍 Security Analysis:');
        console.log(`- IPS triggered after ${bruteForceResults.blockDetectedAt} failed attempts`);
        console.log(`- Rate limiting effectiveness: ${((bruteForceResults.blockedAttempts / bruteForceResults.totalAttempts) * 100).toFixed(1)}%`);
        console.log(`- Distributed attack protection: ${((distributedResults.distributedBlocked / distributedResults.distributedAttempts) * 100).toFixed(1)}%`);
        
        return {
            bruteForce: bruteForceResults,
            distributed: distributedResults,
            passwordSpray: sprayResults,
            credentialStuffing: stuffingResults,
            overallProtectionRate: protectionRate,
            ipsActive: bruteForceResults.ipBlocked
        };
        
    } catch (error) {
        console.error('❌ Brute-force simulation failed:', error.message);
        return null;
    }
}

// Start brute-force simulation
runBruteForceSimulation();
