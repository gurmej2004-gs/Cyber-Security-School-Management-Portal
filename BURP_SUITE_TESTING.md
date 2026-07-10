# Burp Suite Security Testing Guide
## School Management System HTTPS & CORS Validation

### Overview
This guide provides comprehensive instructions for testing the school management system's HTTPS-only configuration and CORS origin validation using Burp Suite Professional.

---

## 🔧 Setup Instructions

### 1. Burp Suite Configuration

#### SSL Certificate Setup
```bash
# Export Burp's CA certificate
1. Open Burp Suite → Proxy → Options → Import/Export CA Certificate
2. Export certificate in DER format as 'burp-ca-cert.der'
3. Convert to PEM format:
   openssl x509 -inform der -in burp-ca-cert.der -out burp-ca-cert.pem
```

#### Proxy Configuration
- **Proxy Listener**: `127.0.0.1:8080`
- **Intercept**: Initially OFF for baseline testing
- **SSL Pass Through**: Configure for `localhost:3443`

### 2. Browser Configuration
```
Firefox Proxy Settings:
- HTTP Proxy: 127.0.0.1:8080
- SSL Proxy: 127.0.0.1:8080
- Use proxy for all protocols: ✓
```

---

## 🧪 Test Scenarios

### Test 1: HTTPS-Only Enforcement
**Objective**: Verify server only accepts HTTPS connections

#### Manual Testing Steps:
1. **Direct HTTP Request**:
   ```
   GET http://localhost:3000/api/login HTTP/1.1
   Host: localhost:3000
   ```
   **Expected**: 301/302 redirect to HTTPS or connection refused

2. **HTTPS Request**:
   ```
   GET https://localhost:3443/api/login HTTP/1.1
   Host: localhost:3443
   Origin: https://localhost:3443
   ```
   **Expected**: 200/401 response (server accessible)

#### Burp Suite Automated Scan:
1. Navigate to Target → Site Map
2. Right-click on `https://localhost:3443`
3. Select "Actively scan this host"
4. Review SSL/TLS configuration issues

### Test 2: CORS Origin Validation
**Objective**: Verify API rejects unauthorized origins

#### Test Cases:

##### Valid Origin Test:
```http
POST https://localhost:3443/api/login HTTP/1.1
Host: localhost:3443
Origin: https://localhost:3443
Content-Type: application/json
X-App-Signature: SchoolMgmt-Auth-Token
X-App-Version: 1.0.0
X-App-Build: prod-2025-001

{"username":"admin","password":"1234","role":"admin"}
```
**Expected**: Request processed (200/401)

##### Invalid Origin Tests:
```http
POST https://localhost:3443/api/login HTTP/1.1
Host: localhost:3443
Origin: https://malicious-site.com
Content-Type: application/json
X-App-Signature: SchoolMgmt-Auth-Token
X-App-Version: 1.0.0
X-App-Build: prod-2025-001

{"username":"admin","password":"1234","role":"admin"}
```
**Expected**: CORS error or 500 status

#### Burp Suite Intruder Attack:
1. Send request to Intruder
2. Set payload position on Origin header value
3. Load payload list:
   ```
   https://evil-attacker.com
   http://phishing-site.net
   https://fake-school.org
   https://credential-stealer.com
   http://malicious-domain.com
   ```
4. Start attack and analyze responses

### Test 3: SSL/TLS Security Assessment

#### Certificate Analysis:
1. **Target** → **Site Map** → Right-click domain
2. Select **"Engagement tools"** → **"SSL Scanner"**
3. Review certificate chain and vulnerabilities

#### Expected Findings:
- Self-signed certificate warning (expected for dev)
- Strong cipher suites
- No SSL/TLS vulnerabilities

### Test 4: Authentication Bypass Attempts

#### Session Management:
```http
GET https://localhost:3443/api/students HTTP/1.1
Host: localhost:3443
Origin: https://localhost:3443
Authorization: Bearer invalid-token
```

#### JWT Token Analysis:
1. Capture valid JWT token from login
2. Use JWT Editor extension to analyze token structure
3. Test token manipulation attacks

---

## 🔍 Vulnerability Assessment Checklist

### HTTPS Configuration
- [ ] HTTP requests redirect to HTTPS
- [ ] HTTPS-only cookies set
- [ ] HSTS header present
- [ ] Strong SSL/TLS configuration
- [ ] No mixed content issues

### CORS Validation
- [ ] Invalid origins rejected (500/403 status)
- [ ] Valid origins accepted
- [ ] Preflight requests handled correctly
- [ ] No wildcard (*) origin acceptance
- [ ] Credentials properly restricted

### Security Headers
- [ ] `Strict-Transport-Security` present
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Content-Security-Policy` configured

---

## 📊 Expected Results

### Secure Configuration Indicators:
```
✅ HTTPS Status: 200 (SSL/TLS active)
✅ Invalid Origin: 500/403 (Blocked by CORS)
✅ Valid Origin: 200/401 (Processed normally)
✅ Security Headers: Present and configured
✅ Certificate: Valid chain (ignore self-signed warning)
```

### Vulnerability Indicators:
```
❌ HTTP Status: 200 (Should redirect to HTTPS)
❌ Invalid Origin: 200 (Should be blocked)
❌ Missing HSTS header
❌ Weak SSL/TLS configuration
❌ Missing security headers
```

---

## 🛠️ Advanced Testing Techniques

### 1. Origin Header Manipulation
```bash
# Test various origin bypass techniques
curl -k -H "Origin: null" https://localhost:3443/api/login
curl -k -H "Origin: https://localhost:3443.evil.com" https://localhost:3443/api/login
curl -k -H "Origin: https://evil.com" -H "Referer: https://localhost:3443" https://localhost:3443/api/login
```

### 2. SSL/TLS Downgrade Attacks
- Test for protocol downgrade vulnerabilities
- Verify cipher suite preferences
- Check for weak key exchange methods

### 3. Certificate Validation Bypass
- Test certificate pinning (if implemented)
- Verify hostname validation
- Check for certificate transparency logs

---

## 📝 Reporting Template

### Security Assessment Report

#### Executive Summary
- Overall security posture: [SECURE/VULNERABLE]
- Critical findings: [COUNT]
- HTTPS enforcement: [PASS/FAIL]
- CORS validation: [PASS/FAIL]

#### Detailed Findings

##### 1. HTTPS Configuration
- **Status**: [PASS/FAIL]
- **Details**: [Description]
- **Evidence**: [Screenshots/Logs]

##### 2. CORS Origin Validation
- **Status**: [PASS/FAIL]
- **Invalid Origins Tested**: [COUNT]
- **Blocked Successfully**: [COUNT]
- **Evidence**: [Request/Response examples]

##### 3. Security Headers
- **HSTS**: [PRESENT/MISSING]
- **CSP**: [PRESENT/MISSING]
- **X-Frame-Options**: [PRESENT/MISSING]

#### Recommendations
1. [Specific security improvements]
2. [Configuration adjustments]
3. [Monitoring recommendations]

---

## 🔗 Integration with CI/CD

### Automated Burp Suite Scanning
```bash
# Example Jenkins pipeline integration
java -jar burp-rest-api.jar --headless.mode=true \
  --target=https://localhost:3443 \
  --scan-type=active \
  --report-format=xml \
  --report-file=security-report.xml
```

### Continuous Security Monitoring
- Schedule regular HTTPS/CORS validation tests
- Monitor certificate expiration
- Track security header compliance
- Alert on configuration changes

---

## 📚 Additional Resources

- [OWASP CORS Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Origin_Resource_Sharing_Cheat_Sheet.html)
- [Burp Suite Professional Documentation](https://portswigger.net/burp/documentation)
- [SSL/TLS Best Practices](https://wiki.mozilla.org/Security/Server_Side_TLS)
- [HSTS Specification](https://tools.ietf.org/html/rfc6797)
