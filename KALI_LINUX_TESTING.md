# Kali Linux Penetration Testing Guide
## School Management System Security Assessment

### Overview
Comprehensive penetration testing methodology for validating HTTPS-only configuration and CORS origin validation using Kali Linux tools.

---

## 🛠️ Tool Installation & Setup

### Essential Tools Installation
```bash
# Update Kali Linux
sudo apt update && sudo apt upgrade -y

# Install additional security tools
sudo apt install -y curl wget nmap nikto sqlmap gobuster dirb \
                    sslyze testssl.sh nuclei subfinder httpx \
                    burpsuite zaproxy wfuzz ffuf

# Install Node.js for custom scripts
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python security libraries
pip3 install requests urllib3 ssl-checker cors-scanner
```

### Environment Setup
```bash
# Create testing directory
mkdir ~/school-mgmt-pentest
cd ~/school-mgmt-pentest

# Set target variables
export TARGET_HOST="localhost"
export TARGET_HTTPS_PORT="3443"
export TARGET_HTTP_PORT="3000"
export TARGET_URL="https://$TARGET_HOST:$TARGET_HTTPS_PORT"
```

---

## 🔍 Reconnaissance Phase

### 1. Port Scanning
```bash
# Basic port scan
nmap -sS -sV -p 3000,3443 $TARGET_HOST

# Comprehensive scan with scripts
nmap -sS -sV -sC -p 3000,3443 --script ssl-enum-ciphers,ssl-cert $TARGET_HOST

# SSL/TLS specific scan
nmap --script ssl-cert,ssl-enum-ciphers -p 3443 $TARGET_HOST
```

### 2. SSL/TLS Assessment
```bash
# Comprehensive SSL/TLS testing
testssl.sh https://$TARGET_HOST:$TARGET_HTTPS_PORT

# Quick SSL check
sslyze --regular $TARGET_HOST:$TARGET_HTTPS_PORT

# Certificate analysis
openssl s_client -connect $TARGET_HOST:$TARGET_HTTPS_PORT -servername $TARGET_HOST
```

### 3. Web Application Fingerprinting
```bash
# Technology detection
whatweb $TARGET_URL

# HTTP headers analysis
curl -I -k $TARGET_URL

# Security headers check
curl -I -k -H "Origin: https://evil.com" $TARGET_URL
```

---

## 🧪 HTTPS Enforcement Testing

### 1. HTTP to HTTPS Redirect Validation
```bash
#!/bin/bash
# File: test_https_redirect.sh

echo "Testing HTTP to HTTPS redirect..."

# Test HTTP endpoint
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}|%{redirect_url}" \
  http://$TARGET_HOST:$TARGET_HTTP_PORT/api/login)

HTTP_CODE=$(echo $HTTP_RESPONSE | cut -d'|' -f1)
REDIRECT_URL=$(echo $HTTP_RESPONSE | cut -d'|' -f2)

if [[ $HTTP_CODE == "301" || $HTTP_CODE == "302" ]]; then
    echo "✅ HTTP redirects to HTTPS (Code: $HTTP_CODE)"
    echo "📍 Redirect URL: $REDIRECT_URL"
else
    echo "❌ HTTP does not redirect (Code: $HTTP_CODE)"
fi
```

### 2. HTTPS-Only Validation
```bash
#!/bin/bash
# File: test_https_only.sh

echo "Testing HTTPS-only enforcement..."

# Test HTTPS endpoint
HTTPS_RESPONSE=$(curl -k -s -o /dev/null -w "%{http_code}" \
  -H "X-App-Signature: SchoolMgmt-Auth-Token" \
  -H "X-App-Version: 1.0.0" \
  -H "X-App-Build: prod-2025-001" \
  $TARGET_URL/test-db)

if [[ $HTTPS_RESPONSE == "200" || $HTTPS_RESPONSE == "429" ]]; then
    echo "✅ HTTPS endpoint accessible (Code: $HTTPS_RESPONSE)"
else
    echo "❌ HTTPS endpoint not accessible (Code: $HTTPS_RESPONSE)"
fi
```

---

## 🛡️ CORS Origin Validation Testing

### 1. Automated CORS Testing Script
```bash
#!/bin/bash
# File: test_cors_validation.sh

echo "Testing CORS Origin Validation..."

# Array of malicious origins to test
MALICIOUS_ORIGINS=(
    "https://evil-attacker.com"
    "http://phishing-site.net"
    "https://malicious-school.org"
    "https://credential-stealer.com"
    "http://fake-education.com"
    "https://unauthorized-domain.net"
)

BLOCKED_COUNT=0
TOTAL_COUNT=${#MALICIOUS_ORIGINS[@]}

for origin in "${MALICIOUS_ORIGINS[@]}"; do
    echo "🧪 Testing origin: $origin"
    
    RESPONSE=$(curl -k -s -o /dev/null -w "%{http_code}" \
        -H "Origin: $origin" \
        -H "Content-Type: application/json" \
        -H "X-App-Signature: SchoolMgmt-Auth-Token" \
        -H "X-App-Version: 1.0.0" \
        -H "X-App-Build: prod-2025-001" \
        -X POST \
        -d '{"username":"admin","password":"1234","role":"admin"}' \
        $TARGET_URL/api/login)
    
    if [[ $RESPONSE == "500" || $RESPONSE == "403" ]]; then
        echo "   ✅ Origin blocked (Code: $RESPONSE)"
        ((BLOCKED_COUNT++))
    else
        echo "   ❌ Origin NOT blocked (Code: $RESPONSE)"
    fi
done

echo "📊 Results: $BLOCKED_COUNT/$TOTAL_COUNT origins blocked"

if [[ $BLOCKED_COUNT == $TOTAL_COUNT ]]; then
    echo "✅ CORS validation working correctly"
else
    echo "❌ CORS validation has issues"
fi
```

### 2. Advanced CORS Bypass Testing
```bash
#!/bin/bash
# File: test_cors_bypass.sh

echo "Testing CORS bypass techniques..."

# Test null origin
echo "🧪 Testing null origin..."
curl -k -s -o /dev/null -w "Null Origin: %{http_code}\n" \
    -H "Origin: null" \
    -H "X-App-Signature: SchoolMgmt-Auth-Token" \
    $TARGET_URL/api/login

# Test subdomain bypass
echo "🧪 Testing subdomain bypass..."
curl -k -s -o /dev/null -w "Subdomain Bypass: %{http_code}\n" \
    -H "Origin: https://localhost:3443.evil.com" \
    -H "X-App-Signature: SchoolMgmt-Auth-Token" \
    $TARGET_URL/api/login

# Test protocol bypass
echo "🧪 Testing protocol bypass..."
curl -k -s -o /dev/null -w "Protocol Bypass: %{http_code}\n" \
    -H "Origin: http://localhost:3443" \
    -H "X-App-Signature: SchoolMgmt-Auth-Token" \
    $TARGET_URL/api/login

# Test case sensitivity
echo "🧪 Testing case sensitivity..."
curl -k -s -o /dev/null -w "Case Sensitivity: %{http_code}\n" \
    -H "Origin: https://LOCALHOST:3443" \
    -H "X-App-Signature: SchoolMgmt-Auth-Token" \
    $TARGET_URL/api/login
```

---

## 🔐 Authentication & Authorization Testing

### 1. JWT Token Analysis
```bash
#!/bin/bash
# File: test_jwt_security.sh

echo "Testing JWT security..."

# Get valid token
TOKEN_RESPONSE=$(curl -k -s \
    -H "Origin: https://localhost:3443" \
    -H "Content-Type: application/json" \
    -H "X-App-Signature: SchoolMgmt-Auth-Token" \
    -H "X-App-Version: 1.0.0" \
    -H "X-App-Build: prod-2025-001" \
    -X POST \
    -d '{"username":"admin","password":"1234","role":"admin"}' \
    $TARGET_URL/api/login)

TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.token' 2>/dev/null)

if [[ $TOKEN != "null" && $TOKEN != "" ]]; then
    echo "✅ JWT token obtained"
    
    # Decode JWT header and payload
    echo "🔍 JWT Analysis:"
    echo $TOKEN | cut -d'.' -f1 | base64 -d 2>/dev/null | jq . || echo "Header decode failed"
    echo $TOKEN | cut -d'.' -f2 | base64 -d 2>/dev/null | jq . || echo "Payload decode failed"
    
    # Test token manipulation
    MODIFIED_TOKEN="${TOKEN%.*}.modified"
    curl -k -s -o /dev/null -w "Modified Token: %{http_code}\n" \
        -H "Authorization: Bearer $MODIFIED_TOKEN" \
        -H "Origin: https://localhost:3443" \
        $TARGET_URL/api/students
else
    echo "❌ Failed to obtain JWT token"
fi
```

### 2. Session Management Testing
```bash
#!/bin/bash
# File: test_session_security.sh

echo "Testing session security..."

# Test session timeout
echo "🧪 Testing session behavior..."
curl -k -s -o /dev/null -w "No Auth Header: %{http_code}\n" \
    -H "Origin: https://localhost:3443" \
    $TARGET_URL/api/students

# Test invalid session
curl -k -s -o /dev/null -w "Invalid Token: %{http_code}\n" \
    -H "Authorization: Bearer invalid-token" \
    -H "Origin: https://localhost:3443" \
    $TARGET_URL/api/students
```

---

## 🚨 Vulnerability Scanning

### 1. Automated Web Vulnerability Scanning
```bash
# Nikto scan
nikto -h $TARGET_URL -ssl

# Nuclei scan with custom templates
nuclei -u $TARGET_URL -t cors,ssl,headers

# OWASP ZAP baseline scan
zap-baseline.py -t $TARGET_URL -J zap-report.json
```

### 2. Directory and File Discovery
```bash
# Gobuster directory enumeration
gobuster dir -u $TARGET_URL -w /usr/share/wordlists/dirb/common.txt -k

# FFuf fuzzing
ffuf -w /usr/share/wordlists/dirb/common.txt -u $TARGET_URL/FUZZ -k

# API endpoint discovery
gobuster dir -u $TARGET_URL -w /usr/share/wordlists/dirb/common.txt -k -x js,json,xml
```

### 3. SQL Injection Testing
```bash
# SQLMap testing on login endpoint
sqlmap -u "$TARGET_URL/api/login" \
    --data='{"username":"admin","password":"1234","role":"admin"}' \
    --headers="Content-Type: application/json" \
    --headers="Origin: https://localhost:3443" \
    --headers="X-App-Signature: SchoolMgmt-Auth-Token" \
    --batch --level=3 --risk=2
```

---

## 📊 Automated Testing Suite

### Master Test Script
```bash
#!/bin/bash
# File: run_security_tests.sh

echo "🔒 School Management System Security Assessment"
echo "=============================================="

# Create results directory
mkdir -p results
cd results

# Run all tests
echo "📍 Phase 1: Reconnaissance"
nmap -sS -sV -p 3000,3443 $TARGET_HOST > nmap_scan.txt

echo "📍 Phase 2: SSL/TLS Assessment"
testssl.sh $TARGET_URL > ssl_assessment.txt

echo "📍 Phase 3: HTTPS Enforcement"
../test_https_redirect.sh > https_redirect.txt
../test_https_only.sh > https_only.txt

echo "📍 Phase 4: CORS Validation"
../test_cors_validation.sh > cors_validation.txt
../test_cors_bypass.sh > cors_bypass.txt

echo "📍 Phase 5: Authentication Testing"
../test_jwt_security.sh > jwt_security.txt
../test_session_security.sh > session_security.txt

echo "📍 Phase 6: Vulnerability Scanning"
nikto -h $TARGET_URL -ssl > nikto_scan.txt
nuclei -u $TARGET_URL -t cors,ssl,headers -o nuclei_scan.txt

echo "✅ Security assessment complete. Results in ./results/"
```

---

## 🎯 Expected Security Posture

### Secure Configuration Indicators
```bash
✅ HTTPS Status: 200 (SSL/TLS active)
✅ HTTP Redirect: 301/302 → HTTPS
✅ Invalid Origins: 500/403 (Blocked)
✅ Valid Origins: 200/401 (Processed)
✅ JWT Validation: 401 for invalid tokens
✅ Security Headers: Present
✅ SSL/TLS: Strong configuration
```

### Vulnerability Indicators
```bash
❌ HTTP Direct Access: 200 (Should redirect)
❌ CORS Bypass: 200 (Should block invalid origins)
❌ Weak SSL/TLS: Outdated protocols/ciphers
❌ Missing Headers: HSTS, CSP, etc.
❌ JWT Issues: Weak secrets, no expiration
```

---

## 📝 Reporting & Documentation

### Generate Security Report
```bash
#!/bin/bash
# File: generate_report.sh

echo "# Security Assessment Report" > security_report.md
echo "Generated: $(date)" >> security_report.md
echo "" >> security_report.md

echo "## Executive Summary" >> security_report.md
echo "- Target: $TARGET_URL" >> security_report.md
echo "- Assessment Date: $(date)" >> security_report.md
echo "" >> security_report.md

echo "## Test Results" >> security_report.md
echo "### HTTPS Enforcement" >> security_report.md
cat results/https_*.txt >> security_report.md

echo "### CORS Validation" >> security_report.md
cat results/cors_*.txt >> security_report.md

echo "### SSL/TLS Security" >> security_report.md
grep -E "(VULNERABLE|OK|INFO)" results/ssl_assessment.txt >> security_report.md

echo "Report generated: security_report.md"
```

---

## 🔗 Integration with CI/CD

### Jenkins Pipeline Integration
```groovy
pipeline {
    agent any
    stages {
        stage('Security Testing') {
            steps {
                sh 'chmod +x run_security_tests.sh'
                sh './run_security_tests.sh'
                archiveArtifacts artifacts: 'results/*', fingerprint: true
            }
        }
    }
    post {
        always {
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'results',
                reportFiles: 'security_report.md',
                reportName: 'Security Assessment Report'
            ])
        }
    }
}
```

---

## 🛠️ Custom Tools & Scripts

### CORS Scanner Tool
```python
#!/usr/bin/env python3
# File: cors_scanner.py

import requests
import sys
from urllib3.packages.urllib3.exceptions import InsecureRequestWarning

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

def test_cors_policy(target_url, origins):
    """Test CORS policy against multiple origins"""
    results = []
    
    headers = {
        'X-App-Signature': 'SchoolMgmt-Auth-Token',
        'X-App-Version': '1.0.0',
        'X-App-Build': 'prod-2025-001',
        'Content-Type': 'application/json'
    }
    
    for origin in origins:
        test_headers = headers.copy()
        test_headers['Origin'] = origin
        
        try:
            response = requests.post(
                f"{target_url}/api/login",
                headers=test_headers,
                json={"username": "admin", "password": "1234", "role": "admin"},
                verify=False,
                timeout=10
            )
            
            result = {
                'origin': origin,
                'status_code': response.status_code,
                'blocked': response.status_code >= 400,
                'cors_header': response.headers.get('Access-Control-Allow-Origin', 'Not Set')
            }
            results.append(result)
            
        except Exception as e:
            results.append({
                'origin': origin,
                'status_code': 'ERROR',
                'blocked': True,
                'error': str(e)
            })
    
    return results

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "https://localhost:3443"
    
    malicious_origins = [
        "https://evil-attacker.com",
        "http://phishing-site.net",
        "https://malicious-school.org",
        "https://credential-stealer.com"
    ]
    
    print(f"🛡️ Testing CORS policy for {target}")
    results = test_cors_policy(target, malicious_origins)
    
    blocked_count = sum(1 for r in results if r['blocked'])
    total_count = len(results)
    
    print(f"\n📊 Results: {blocked_count}/{total_count} origins blocked")
    
    for result in results:
        status = "✅ BLOCKED" if result['blocked'] else "❌ ALLOWED"
        print(f"   {result['origin']}: {status} (Code: {result['status_code']})")
```

Make all scripts executable:
```bash
chmod +x *.sh
chmod +x cors_scanner.py
```
