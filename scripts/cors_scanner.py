#!/usr/bin/env python3
"""
CORS Security Scanner for School Management System
Advanced CORS policy testing and bypass detection
"""

import requests
import sys
import json
import argparse
from urllib3.packages.urllib3.exceptions import InsecureRequestWarning
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

# Disable SSL warnings for self-signed certificates
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

class CORSScanner:
    def __init__(self, target_url, timeout=10):
        self.target_url = target_url.rstrip('/')
        self.timeout = timeout
        self.session = requests.Session()
        self.session.verify = False
        
        # Default headers for app authentication
        self.default_headers = {
            'X-App-Signature': 'SchoolMgmt-Auth-Token',
            'X-App-Version': '1.0.0',
            'X-App-Build': 'prod-2025-001',
            'Content-Type': 'application/json',
            'User-Agent': 'CORS-Security-Scanner/1.0'
        }
    
    def test_single_origin(self, origin, endpoint='/api/login', method='POST'):
        """Test a single origin against the CORS policy"""
        headers = self.default_headers.copy()
        headers['Origin'] = origin
        
        data = {"username": "admin", "password": "1234", "role": "admin"}
        
        try:
            if method.upper() == 'POST':
                response = self.session.post(
                    f"{self.target_url}{endpoint}",
                    headers=headers,
                    json=data,
                    timeout=self.timeout
                )
            else:
                response = self.session.get(
                    f"{self.target_url}{endpoint}",
                    headers=headers,
                    timeout=self.timeout
                )
            
            return {
                'origin': origin,
                'endpoint': endpoint,
                'method': method,
                'status_code': response.status_code,
                'blocked': response.status_code >= 400,
                'cors_header': response.headers.get('Access-Control-Allow-Origin', 'Not Set'),
                'response_time': response.elapsed.total_seconds(),
                'headers': dict(response.headers)
            }
            
        except requests.exceptions.RequestException as e:
            return {
                'origin': origin,
                'endpoint': endpoint,
                'method': method,
                'status_code': 'ERROR',
                'blocked': True,
                'error': str(e),
                'response_time': 0
            }
    
    def test_preflight_request(self, origin):
        """Test CORS preflight (OPTIONS) request"""
        headers = {
            'Origin': origin,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type,Authorization'
        }
        
        try:
            response = self.session.options(
                f"{self.target_url}/api/login",
                headers=headers,
                timeout=self.timeout
            )
            
            return {
                'origin': origin,
                'type': 'preflight',
                'status_code': response.status_code,
                'allowed_origins': response.headers.get('Access-Control-Allow-Origin', 'Not Set'),
                'allowed_methods': response.headers.get('Access-Control-Allow-Methods', 'Not Set'),
                'allowed_headers': response.headers.get('Access-Control-Allow-Headers', 'Not Set'),
                'blocked': response.status_code >= 400
            }
            
        except requests.exceptions.RequestException as e:
            return {
                'origin': origin,
                'type': 'preflight',
                'status_code': 'ERROR',
                'error': str(e),
                'blocked': True
            }
    
    def test_bypass_techniques(self):
        """Test various CORS bypass techniques"""
        bypass_tests = [
            {'name': 'Null Origin', 'origin': 'null'},
            {'name': 'Empty Origin', 'origin': ''},
            {'name': 'Subdomain Bypass', 'origin': 'https://localhost:3443.evil.com'},
            {'name': 'Protocol Bypass', 'origin': 'http://localhost:3443'},
            {'name': 'Case Sensitivity', 'origin': 'https://LOCALHOST:3443'},
            {'name': 'Port Bypass', 'origin': 'https://localhost:3444'},
            {'name': 'Wildcard Test', 'origin': '*'},
            {'name': 'Data URI', 'origin': 'data:'},
            {'name': 'File URI', 'origin': 'file://'},
            {'name': 'Chrome Extension', 'origin': 'chrome-extension://fake'},
        ]
        
        results = []
        for test in bypass_tests:
            result = self.test_single_origin(test['origin'])
            result['bypass_technique'] = test['name']
            results.append(result)
        
        return results
    
    def comprehensive_scan(self, malicious_origins, endpoints=None):
        """Perform comprehensive CORS security scan"""
        if endpoints is None:
            endpoints = ['/api/login', '/api/students', '/api/teachers', '/test-db']
        
        results = {
            'malicious_origins': [],
            'bypass_techniques': [],
            'preflight_tests': [],
            'endpoint_tests': []
        }
        
        print("🛡️ Starting Comprehensive CORS Security Scan...")
        print(f"Target: {self.target_url}")
        print(f"Testing {len(malicious_origins)} malicious origins")
        print(f"Testing {len(endpoints)} endpoints")
        print("")
        
        # Test malicious origins
        print("📍 Phase 1: Testing Malicious Origins")
        with ThreadPoolExecutor(max_workers=5) as executor:
            future_to_origin = {
                executor.submit(self.test_single_origin, origin): origin 
                for origin in malicious_origins
            }
            
            for future in as_completed(future_to_origin):
                result = future.result()
                results['malicious_origins'].append(result)
                
                status = "✅ BLOCKED" if result['blocked'] else "❌ ALLOWED"
                print(f"   {result['origin']}: {status} (Code: {result['status_code']})")
        
        # Test bypass techniques
        print("\n📍 Phase 2: Testing CORS Bypass Techniques")
        bypass_results = self.test_bypass_techniques()
        results['bypass_techniques'] = bypass_results
        
        for result in bypass_results:
            status = "✅ BLOCKED" if result['blocked'] else "❌ BYPASSED"
            print(f"   {result['bypass_technique']}: {status} (Code: {result['status_code']})")
        
        # Test preflight requests
        print("\n📍 Phase 3: Testing CORS Preflight Requests")
        for origin in malicious_origins[:3]:  # Test first 3 for preflight
            preflight_result = self.test_preflight_request(origin)
            results['preflight_tests'].append(preflight_result)
            
            status = "✅ BLOCKED" if preflight_result['blocked'] else "❌ ALLOWED"
            print(f"   Preflight {origin}: {status} (Code: {preflight_result['status_code']})")
        
        # Test multiple endpoints
        print("\n📍 Phase 4: Testing Multiple Endpoints")
        test_origin = malicious_origins[0] if malicious_origins else "https://evil.com"
        
        for endpoint in endpoints:
            endpoint_result = self.test_single_origin(test_origin, endpoint, 'GET')
            results['endpoint_tests'].append(endpoint_result)
            
            status = "✅ BLOCKED" if endpoint_result['blocked'] else "❌ ALLOWED"
            print(f"   {endpoint}: {status} (Code: {endpoint_result['status_code']})")
        
        return results
    
    def generate_report(self, results):
        """Generate detailed security report"""
        malicious_blocked = sum(1 for r in results['malicious_origins'] if r['blocked'])
        malicious_total = len(results['malicious_origins'])
        
        bypass_blocked = sum(1 for r in results['bypass_techniques'] if r['blocked'])
        bypass_total = len(results['bypass_techniques'])
        
        preflight_blocked = sum(1 for r in results['preflight_tests'] if r['blocked'])
        preflight_total = len(results['preflight_tests'])
        
        endpoint_blocked = sum(1 for r in results['endpoint_tests'] if r['blocked'])
        endpoint_total = len(results['endpoint_tests'])
        
        print("\n🎉 CORS Security Assessment Results")
        print("=" * 50)
        print(f"📊 Malicious Origins Blocked: {malicious_blocked}/{malicious_total}")
        print(f"🔒 Bypass Techniques Blocked: {bypass_blocked}/{bypass_total}")
        print(f"🛡️ Preflight Requests Blocked: {preflight_blocked}/{preflight_total}")
        print(f"🎯 Endpoints Protected: {endpoint_blocked}/{endpoint_total}")
        
        # Calculate security score
        total_tests = malicious_total + bypass_total + preflight_total + endpoint_total
        total_blocked = malicious_blocked + bypass_blocked + preflight_blocked + endpoint_blocked
        
        if total_tests > 0:
            security_score = (total_blocked / total_tests) * 100
            print(f"\n🔐 Overall Security Score: {security_score:.1f}%")
            
            if security_score >= 90:
                print("✅ Security Status: EXCELLENT")
            elif security_score >= 75:
                print("⚠️ Security Status: GOOD")
            elif security_score >= 50:
                print("⚠️ Security Status: MODERATE")
            else:
                print("❌ Security Status: VULNERABLE")
        
        # Detailed findings
        print("\n📋 Detailed Findings:")
        
        if malicious_blocked < malicious_total:
            print("❌ Some malicious origins are not being blocked!")
            for result in results['malicious_origins']:
                if not result['blocked']:
                    print(f"   - {result['origin']} (Code: {result['status_code']})")
        
        if bypass_blocked < bypass_total:
            print("⚠️ Some bypass techniques may be working:")
            for result in results['bypass_techniques']:
                if not result['blocked']:
                    print(f"   - {result['bypass_technique']} (Code: {result['status_code']})")
        
        return {
            'security_score': security_score if total_tests > 0 else 0,
            'malicious_blocked_ratio': f"{malicious_blocked}/{malicious_total}",
            'bypass_blocked_ratio': f"{bypass_blocked}/{bypass_total}",
            'overall_status': 'SECURE' if security_score >= 75 else 'VULNERABLE'
        }

def main():
    parser = argparse.ArgumentParser(description='CORS Security Scanner for School Management System')
    parser.add_argument('target', help='Target URL (e.g., https://localhost:3443)')
    parser.add_argument('--timeout', type=int, default=10, help='Request timeout in seconds')
    parser.add_argument('--output', help='Output file for JSON results')
    parser.add_argument('--origins-file', help='File containing custom malicious origins')
    
    args = parser.parse_args()
    
    # Default malicious origins
    malicious_origins = [
        "https://evil-attacker.com",
        "http://phishing-site.net",
        "https://malicious-school.org",
        "https://credential-stealer.com",
        "http://fake-education.com",
        "https://unauthorized-domain.net",
        "https://hacker-portal.com",
        "http://data-thief.org"
    ]
    
    # Load custom origins if provided
    if args.origins_file:
        try:
            with open(args.origins_file, 'r') as f:
                custom_origins = [line.strip() for line in f if line.strip()]
                malicious_origins.extend(custom_origins)
        except FileNotFoundError:
            print(f"Warning: Origins file {args.origins_file} not found")
    
    # Initialize scanner
    scanner = CORSScanner(args.target, args.timeout)
    
    # Run comprehensive scan
    results = scanner.comprehensive_scan(malicious_origins)
    
    # Generate report
    report_summary = scanner.generate_report(results)
    
    # Save results if output file specified
    if args.output:
        output_data = {
            'target': args.target,
            'timestamp': time.time(),
            'results': results,
            'summary': report_summary
        }
        
        with open(args.output, 'w') as f:
            json.dump(output_data, f, indent=2)
        
        print(f"\n📄 Results saved to: {args.output}")

if __name__ == "__main__":
    if len(sys.argv) == 1:
        # Default execution for quick testing
        target_url = "https://localhost:3443"
        scanner = CORSScanner(target_url)
        
        malicious_origins = [
            "https://evil-attacker.com",
            "http://phishing-site.net",
            "https://malicious-school.org",
            "https://credential-stealer.com"
        ]
        
        results = scanner.comprehensive_scan(malicious_origins)
        scanner.generate_report(results)
    else:
        main()
