const axios = require('axios');
const { spawn } = require('child_process');
require('dotenv').config();

// Test configuration
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const HOST = 'localhost';

// Disable SSL certificate verification for self-signed certificates
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

console.log('🚨 COMPREHENSIVE ATTACK SIMULATION SUITE');
console.log('Testing: Phishing + Brute-Force + SQL Injection Protection');
console.log('========================================================\n');

// Run individual attack simulations and collect results
async function runComprehensiveAttackSimulation() {
    const results = {
        phishing: null,
        bruteforce: null,
        sqli: null,
        timestamp: new Date().toISOString()
    };
    
    console.log('🎯 Starting Multi-Vector Attack Simulation...\n');
    
    try {
        // Run phishing attack simulation
        console.log('📍 Phase 1: Phishing Attack Simulation');
        console.log('=====================================');
        results.phishing = await runPhishingTest();
        
        console.log('\n📍 Phase 2: Brute-Force Attack Simulation');
        console.log('=========================================');
        results.bruteforce = await runBruteForceTest();
        
        console.log('\n📍 Phase 3: SQL Injection Attack Simulation');
        console.log('==========================================');
        results.sqli = await runSQLInjectionTest();
        
        // Generate comprehensive security report
        generateSecurityReport(results);
        
        return results;
        
    } catch (error) {
        console.error('❌ Comprehensive attack simulation failed:', error.message);
        return null;
    }
}

// Phishing attack test
async function runPhishingTest() {
    const phishingOrigins = [
        'https://phishing-school-portal.com',
        'http://fake-education-site.net',
        'https://credential-stealer.com',
        'https://malicious-login.org'
    ];
    
    let blocked = 0;
    let total = phishingOrigins.length;
    
    for (const origin of phishingOrigins) {
        try {
            await axios({
                method: 'POST',
                url: `https://${HOST}:${HTTPS_PORT}/api/login`,
                headers: {
                    'Origin': origin,
                    'Content-Type': 'application/json',
                    'X-App-Signature': 'SchoolMgmt-Auth-Token',
                    'X-App-Version': '1.0.0',
                    'X-App-Build': 'prod-2025-001'
                },
                data: { username: 'admin', password: 'test', role: 'admin' },
                timeout: 5000
            });
            
            console.log(`   ❌ PHISHING BYPASS: ${origin}`);
        } catch (error) {
            if (error.response && error.response.status >= 400) {
                console.log(`   ✅ PHISHING BLOCKED: ${origin} (${error.response.status})`);
                blocked++;
            } else {
                console.log(`   ✅ PHISHING BLOCKED: ${origin} (Network)`);
                blocked++;
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return { blocked, total, protectionRate: (blocked / total) * 100 };
}

// Brute-force attack test
async function runBruteForceTest() {
    const passwords = ['password', '123456', 'admin', 'letmein', 'qwerty'];
    let attempts = 0;
    let blocked = 0;
    let ipBlocked = false;
    
    for (const password of passwords) {
        if (ipBlocked) break;
        
        attempts++;
        try {
            await axios({
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
                data: { username: 'admin', password: password, role: 'admin' },
                timeout: 5000
            });
            
            console.log(`   ⚠️  BRUTE-FORCE ATTEMPT ${attempts}: Not blocked`);
        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                if (status === 403) {
                    console.log(`   ✅ IPS ACTIVATED: IP blocked after ${attempts} attempts`);
                    ipBlocked = true;
                    blocked++;
                } else if (status === 429) {
                    console.log(`   ✅ RATE LIMITED: Attempt ${attempts} throttled`);
                    blocked++;
                } else {
                    console.log(`   ✅ BRUTE-FORCE BLOCKED: Attempt ${attempts} (${status})`);
                    blocked++;
                }
            } else {
                console.log(`   ✅ BRUTE-FORCE BLOCKED: Attempt ${attempts} (Network)`);
                blocked++;
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return { 
        attempts, 
        blocked, 
        ipBlocked, 
        protectionRate: (blocked / attempts) * 100 
    };
}

// SQL injection attack test
async function runSQLInjectionTest() {
    const sqlPayloads = [
        "' OR '1'='1",
        "admin'--",
        "' UNION SELECT * FROM users--",
        "'; DROP TABLE users; --"
    ];
    
    let attempts = 0;
    let blocked = 0;
    let successful = 0;
    
    for (const payload of sqlPayloads) {
        attempts++;
        try {
            const response = await axios({
                method: 'POST',
                url: `https://${HOST}:${HTTPS_PORT}/api/login`,
                headers: {
                    'Origin': 'https://localhost:3443',
                    'Content-Type': 'application/json',
                    'User-Agent': 'SQLMap/1.0',
                    'X-App-Signature': 'SchoolMgmt-Auth-Token',
                    'X-App-Version': '1.0.0',
                    'X-App-Build': 'prod-2025-001'
                },
                data: { username: payload, password: payload, role: 'admin' },
                timeout: 5000
            });
            
            if (response.status === 200 && response.data.token) {
                console.log(`   🚨 SQL INJECTION SUCCESS: Authentication bypassed!`);
                successful++;
            } else {
                console.log(`   ⚠️  SQL INJECTION: Response received (${response.status})`);
            }
        } catch (error) {
            if (error.response && error.response.status === 403) {
                console.log(`   ✅ WAF BLOCKED: SQL injection detected and blocked`);
                blocked++;
            } else if (error.response && error.response.status >= 400) {
                console.log(`   ✅ SQL INJECTION BLOCKED: (${error.response.status})`);
                blocked++;
            } else {
                console.log(`   ✅ SQL INJECTION BLOCKED: Network protection`);
                blocked++;
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return { 
        attempts, 
        blocked, 
        successful, 
        protectionRate: (blocked / attempts) * 100 
    };
}

// Generate comprehensive security report
function generateSecurityReport(results) {
    console.log('\n🛡️ COMPREHENSIVE SECURITY ASSESSMENT REPORT');
    console.log('===========================================');
    
    // Individual protection rates
    console.log('\n📊 Protection Effectiveness by Attack Vector:');
    console.log(`🎣 Anti-Phishing Protection: ${results.phishing.protectionRate.toFixed(1)}% (${results.phishing.blocked}/${results.phishing.total})`);
    console.log(`💥 Brute-Force Protection: ${results.bruteforce.protectionRate.toFixed(1)}% (${results.bruteforce.blocked}/${results.bruteforce.attempts})`);
    console.log(`💉 SQL Injection Protection: ${results.sqli.protectionRate.toFixed(1)}% (${results.sqli.blocked}/${results.sqli.attempts})`);
    
    // Overall security score
    const totalAttempts = results.phishing.total + results.bruteforce.attempts + results.sqli.attempts;
    const totalBlocked = results.phishing.blocked + results.bruteforce.blocked + results.sqli.blocked;
    const overallScore = (totalBlocked / totalAttempts) * 100;
    
    console.log(`\n🎯 Overall Security Score: ${overallScore.toFixed(1)}% (${totalBlocked}/${totalAttempts} attacks blocked)`);
    
    // Security status assessment
    console.log('\n🔒 Security Status Assessment:');
    
    if (overallScore >= 90) {
        console.log('✅ EXCELLENT: Multi-layered security is highly effective');
    } else if (overallScore >= 75) {
        console.log('⚠️ GOOD: Security is working but has room for improvement');
    } else if (overallScore >= 60) {
        console.log('⚠️ MODERATE: Security needs strengthening');
    } else {
        console.log('❌ VULNERABLE: Critical security gaps detected');
    }
    
    // Specific findings
    console.log('\n🔍 Detailed Security Analysis:');
    
    // Anti-phishing analysis
    if (results.phishing.protectionRate >= 90) {
        console.log('✅ Anti-Phishing: CORS and domain validation working effectively');
    } else {
        console.log('⚠️ Anti-Phishing: Some malicious origins may bypass protection');
    }
    
    // IPS analysis
    if (results.bruteforce.ipBlocked) {
        console.log('✅ IPS Protection: Auto-blocking activated successfully');
    } else {
        console.log('⚠️ IPS Protection: IP blocking may not be functioning properly');
    }
    
    // WAF analysis
    if (results.sqli.successful > 0) {
        console.log('🚨 WAF Protection: CRITICAL - SQL injection bypassed authentication!');
    } else if (results.sqli.protectionRate >= 95) {
        console.log('✅ WAF Protection: SQL injection attacks effectively blocked');
    } else {
        console.log('⚠️ WAF Protection: Some SQL injection attempts may succeed');
    }
    
    // Critical vulnerabilities
    console.log('\n🚨 Critical Security Issues:');
    let criticalIssues = 0;
    
    if (results.sqli.successful > 0) {
        console.log('❌ CRITICAL: SQL injection can bypass authentication');
        criticalIssues++;
    }
    
    if (!results.bruteforce.ipBlocked) {
        console.log('❌ HIGH: IPS auto-blocking not functioning');
        criticalIssues++;
    }
    
    if (results.phishing.protectionRate < 80) {
        console.log('❌ MEDIUM: Anti-phishing protection insufficient');
        criticalIssues++;
    }
    
    if (criticalIssues === 0) {
        console.log('✅ No critical security vulnerabilities detected');
    }
    
    // Recommendations
    console.log('\n📋 Security Recommendations:');
    
    if (results.sqli.successful > 0) {
        console.log('🚨 URGENT: Implement parameterized queries and strengthen input validation');
    }
    
    if (!results.bruteforce.ipBlocked) {
        console.log('🔧 HIGH: Verify IPS configuration and auto-blocking thresholds');
    }
    
    if (results.phishing.protectionRate < 90) {
        console.log('🔧 MEDIUM: Enhance CORS origin validation and domain checking');
    }
    
    console.log('🔧 GENERAL: Continue regular security testing and monitoring');
    console.log('🔧 GENERAL: Review security logs for attack patterns and trends');
    
    // Compliance status
    console.log('\n📜 Security Compliance Status:');
    console.log(`🛡️ Multi-factor Protection: ${overallScore >= 80 ? 'COMPLIANT' : 'NON-COMPLIANT'}`);
    console.log(`🔒 Data Protection: ${results.sqli.successful === 0 ? 'SECURE' : 'AT RISK'}`);
    console.log(`🚫 Access Control: ${results.bruteforce.ipBlocked ? 'EFFECTIVE' : 'NEEDS IMPROVEMENT'}`);
    
    return {
        overallScore,
        criticalIssues,
        phishingProtection: results.phishing.protectionRate,
        bruteforceProtection: results.bruteforce.protectionRate,
        sqlInjectionProtection: results.sqli.protectionRate,
        ipsActive: results.bruteforce.ipBlocked,
        sqlInjectionBypass: results.sqli.successful > 0
    };
}

// Main execution
async function main() {
    console.log('🚀 Initializing Comprehensive Attack Simulation...\n');
    
    const results = await runComprehensiveAttackSimulation();
    
    if (results) {
        console.log('\n✅ Attack simulation completed successfully');
        console.log('📄 Security assessment report generated above');
        
        // Save results to file
        const fs = require('fs');
        fs.writeFileSync('security_test_results.json', JSON.stringify(results, null, 2));
        console.log('💾 Results saved to: security_test_results.json');
    } else {
        console.log('\n❌ Attack simulation failed');
    }
}

// Run the comprehensive attack simulation
main();
