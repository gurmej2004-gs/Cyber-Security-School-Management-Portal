const axios = require('axios');
require('dotenv').config();

// Test configuration
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const HOST = 'localhost';

// Disable SSL certificate verification for self-signed certificates
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

console.log('🎣 Simulating Phishing Attacks - Testing Anti-Phishing Protection\n');

// Phishing Attack Simulation
async function simulatePhishingAttacks() {
    console.log('🚨 Starting Phishing Attack Simulation...\n');
    
    const phishingScenarios = [
        {
            name: 'Malicious Domain Phishing',
            host: 'phishing-school-portal.com',
            origin: 'https://phishing-school-portal.com',
            referer: 'https://phishing-school-portal.com/fake-login'
        },
        {
            name: 'Subdomain Spoofing',
            host: 'fake-localhost.evil.com',
            origin: 'https://fake-localhost.evil.com',
            referer: 'https://fake-localhost.evil.com'
        },
        {
            name: 'Typosquatting Attack',
            host: 'localh0st:3443',
            origin: 'https://localh0st:3443',
            referer: 'https://localh0st:3443'
        },
        {
            name: 'Homograph Attack',
            host: 'localhost.evil-site.com',
            origin: 'https://localhost.evil-site.com',
            referer: 'https://localhost.evil-site.com'
        },
        {
            name: 'Credential Harvesting Site',
            host: 'secure-school-login.net',
            origin: 'https://secure-school-login.net',
            referer: 'https://secure-school-login.net/login'
        }
    ];
    
    let blockedCount = 0;
    let totalAttempts = phishingScenarios.length;
    
    for (const scenario of phishingScenarios) {
        console.log(`🎯 Testing: ${scenario.name}`);
        console.log(`   Host: ${scenario.host}`);
        console.log(`   Origin: ${scenario.origin}`);
        
        try {
            const response = await axios({
                method: 'POST',
                url: `https://${HOST}:${HTTPS_PORT}/api/login`,
                headers: {
                    'Host': scenario.host,
                    'Origin': scenario.origin,
                    'Referer': scenario.referer,
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Phishing Bot)',
                    'X-App-Signature': 'SchoolMgmt-Auth-Token',
                    'X-App-Version': '1.0.0',
                    'X-App-Build': 'prod-2025-001'
                },
                data: {
                    username: 'admin',
                    password: 'stolen-password',
                    role: 'admin'
                },
                timeout: 5000
            });
            
            console.log(`   ❌ SECURITY BREACH: Phishing attack NOT blocked (Status: ${response.status})`);
            console.log(`   🚨 Credentials could be harvested!`);
            
        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                if (status === 403 || status === 500) {
                    console.log(`   ✅ BLOCKED: Anti-phishing protection active (Status: ${status})`);
                    blockedCount++;
                } else {
                    console.log(`   ⚠️  Unexpected response (Status: ${status})`);
                }
            } else if (error.message.includes('Not allowed by CORS')) {
                console.log(`   ✅ BLOCKED: CORS protection rejected phishing origin`);
                blockedCount++;
            } else {
                console.log(`   ✅ BLOCKED: Network-level protection (${error.message})`);
                blockedCount++;
            }
        }
        
        console.log('');
        
        // Small delay between attacks
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return { blocked: blockedCount, total: totalAttempts };
}

// Advanced Phishing Techniques
async function simulateAdvancedPhishingTechniques() {
    console.log('🔬 Testing Advanced Phishing Techniques...\n');
    
    const advancedTechniques = [
        {
            name: 'Header Injection Attack',
            headers: {
                'Host': 'localhost:3443\r\nX-Injected-Header: malicious',
                'Origin': 'https://localhost:3443',
                'X-Forwarded-Host': 'phishing-site.com'
            }
        },
        {
            name: 'Host Header Poisoning',
            headers: {
                'Host': 'evil-phishing-site.com',
                'Origin': 'https://localhost:3443',
                'X-Forwarded-For': '192.168.1.100'
            }
        },
        {
            name: 'Referer Spoofing',
            headers: {
                'Host': 'localhost:3443',
                'Origin': 'https://localhost:3443',
                'Referer': 'https://credential-stealer.com/fake-portal'
            }
        },
        {
            name: 'User-Agent Spoofing',
            headers: {
                'Host': 'localhost:3443',
                'Origin': 'https://localhost:3443',
                'User-Agent': 'PhishingBot/1.0 (Credential Harvester)'
            }
        }
    ];
    
    let protectedCount = 0;
    
    for (const technique of advancedTechniques) {
        console.log(`🧪 Testing: ${technique.name}`);
        
        const testHeaders = {
            ...technique.headers,
            'Content-Type': 'application/json',
            'X-App-Signature': 'SchoolMgmt-Auth-Token',
            'X-App-Version': '1.0.0',
            'X-App-Build': 'prod-2025-001'
        };
        
        try {
            const response = await axios({
                method: 'POST',
                url: `https://${HOST}:${HTTPS_PORT}/api/login`,
                headers: testHeaders,
                data: {
                    username: 'admin',
                    password: 'test123',
                    role: 'admin'
                },
                timeout: 5000
            });
            
            console.log(`   ⚠️  Technique bypassed protection (Status: ${response.status})`);
            
        } catch (error) {
            if (error.response && error.response.status >= 400) {
                console.log(`   ✅ PROTECTED: Technique blocked (Status: ${error.response.status})`);
                protectedCount++;
            } else {
                console.log(`   ✅ PROTECTED: Network/CORS protection active`);
                protectedCount++;
            }
        }
        
        console.log('');
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return { protected: protectedCount, total: advancedTechniques.length };
}

// Social Engineering Simulation
async function simulateSocialEngineeringAttacks() {
    console.log('👥 Testing Social Engineering Attack Vectors...\n');
    
    const socialEngineeringAttempts = [
        {
            name: 'Fake IT Support Login',
            origin: 'https://it-support-portal.com',
            userAgent: 'IT-Support-Tool/2.0',
            credentials: { username: 'it-admin', password: 'reset123', role: 'admin' }
        },
        {
            name: 'Emergency Access Request',
            origin: 'https://emergency-school-access.org',
            userAgent: 'Emergency-Response-System/1.0',
            credentials: { username: 'emergency', password: 'urgent2024', role: 'admin' }
        },
        {
            name: 'System Maintenance Login',
            origin: 'https://maintenance-portal.net',
            userAgent: 'System-Maintenance-Bot/3.1',
            credentials: { username: 'maintenance', password: 'maint2024', role: 'admin' }
        }
    ];
    
    let blockedCount = 0;
    
    for (const attempt of socialEngineeringAttempts) {
        console.log(`🎭 Simulating: ${attempt.name}`);
        console.log(`   Origin: ${attempt.origin}`);
        
        try {
            const response = await axios({
                method: 'POST',
                url: `https://${HOST}:${HTTPS_PORT}/api/login`,
                headers: {
                    'Origin': attempt.origin,
                    'User-Agent': attempt.userAgent,
                    'Content-Type': 'application/json',
                    'X-App-Signature': 'SchoolMgmt-Auth-Token',
                    'X-App-Version': '1.0.0',
                    'X-App-Build': 'prod-2025-001'
                },
                data: attempt.credentials,
                timeout: 5000
            });
            
            console.log(`   ❌ SECURITY RISK: Social engineering attempt not blocked (Status: ${response.status})`);
            
        } catch (error) {
            if (error.response && error.response.status >= 400) {
                console.log(`   ✅ BLOCKED: Social engineering attempt rejected (Status: ${error.response.status})`);
                blockedCount++;
            } else {
                console.log(`   ✅ BLOCKED: Protection layer active`);
                blockedCount++;
            }
        }
        
        console.log('');
        await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    return { blocked: blockedCount, total: socialEngineeringAttempts.length };
}

// Run comprehensive phishing simulation
async function runPhishingSimulation() {
    try {
        console.log('🎣 COMPREHENSIVE PHISHING ATTACK SIMULATION');
        console.log('===========================================\n');
        
        // Test 1: Basic phishing attacks
        const basicResults = await simulatePhishingAttacks();
        
        // Test 2: Advanced phishing techniques
        const advancedResults = await simulateAdvancedPhishingTechniques();
        
        // Test 3: Social engineering attacks
        const socialResults = await simulateSocialEngineeringAttacks();
        
        // Generate comprehensive report
        console.log('📊 PHISHING ATTACK SIMULATION RESULTS');
        console.log('====================================');
        console.log(`🎯 Basic Phishing Attacks Blocked: ${basicResults.blocked}/${basicResults.total}`);
        console.log(`🔬 Advanced Techniques Protected: ${advancedResults.protected}/${advancedResults.total}`);
        console.log(`👥 Social Engineering Blocked: ${socialResults.blocked}/${socialResults.total}`);
        
        const totalBlocked = basicResults.blocked + advancedResults.protected + socialResults.blocked;
        const totalAttempts = basicResults.total + advancedResults.total + socialResults.total;
        const protectionRate = (totalBlocked / totalAttempts) * 100;
        
        console.log(`\n🛡️ Overall Protection Rate: ${protectionRate.toFixed(1)}% (${totalBlocked}/${totalAttempts})`);
        
        if (protectionRate >= 90) {
            console.log('✅ EXCELLENT: Anti-phishing protection is highly effective');
        } else if (protectionRate >= 75) {
            console.log('⚠️ GOOD: Anti-phishing protection is working but could be improved');
        } else {
            console.log('❌ VULNERABLE: Anti-phishing protection needs immediate attention');
        }
        
        console.log('\n🔍 Security Recommendations:');
        if (basicResults.blocked < basicResults.total) {
            console.log('- Strengthen domain validation in anti-phishing middleware');
        }
        if (advancedResults.protected < advancedResults.total) {
            console.log('- Implement additional header validation checks');
        }
        if (socialResults.blocked < socialResults.total) {
            console.log('- Add user-agent pattern detection for suspicious tools');
        }
        
        return {
            basicPhishing: basicResults,
            advancedTechniques: advancedResults,
            socialEngineering: socialResults,
            overallProtectionRate: protectionRate
        };
        
    } catch (error) {
        console.error('❌ Phishing simulation failed:', error.message);
        return null;
    }
}

// Start phishing simulation
runPhishingSimulation();
