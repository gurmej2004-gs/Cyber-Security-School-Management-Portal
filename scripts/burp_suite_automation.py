#!/usr/bin/env python3
"""
Burp Suite Automation Script for School Management System
Automated security testing with Burp Suite Professional API
"""

import requests
import json
import time
import sys
import argparse
from urllib.parse import urljoin

class BurpSuiteAutomation:
    def __init__(self, burp_host='127.0.0.1', burp_port=1337, api_key=None):
        self.burp_host = burp_host
        self.burp_port = burp_port
        self.api_key = api_key
        self.base_url = f"http://{burp_host}:{burp_port}"
        self.session = requests.Session()
        
        if api_key:
            self.session.headers.update({'X-API-Key': api_key})
    
    def start_scan(self, target_url, scan_type='crawl_and_audit'):
        """Start a new scan in Burp Suite"""
        scan_config = {
            "scan_configurations": [
                {
                    "name": "School Management System Security Scan",
                    "type": scan_type
                }
            ],
            "application_logins": [
                {
                    "password": "1234",
                    "username": "admin",
                    "type": "form",
                    "label": "Admin Login"
                }
            ],
            "urls": [target_url]
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/v0.1/scan",
                json=scan_config,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 201:
                scan_id = response.headers.get('Location', '').split('/')[-1]
                print(f"✅ Scan started successfully. Scan ID: {scan_id}")
                return scan_id
            else:
                print(f"❌ Failed to start scan: {response.status_code} - {response.text}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Error connecting to Burp Suite: {e}")
            return None
    
    def get_scan_status(self, scan_id):
        """Get the status of a running scan"""
        try:
            response = self.session.get(f"{self.base_url}/v0.1/scan/{scan_id}")
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ Failed to get scan status: {response.status_code}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Error getting scan status: {e}")
            return None
    
    def wait_for_scan_completion(self, scan_id, max_wait_time=3600):
        """Wait for scan to complete with timeout"""
        start_time = time.time()
        
        while time.time() - start_time < max_wait_time:
            status = self.get_scan_status(scan_id)
            
            if status:
                scan_status = status.get('scan_status', 'unknown')
                print(f"📊 Scan Status: {scan_status}")
                
                if scan_status in ['succeeded', 'failed', 'cancelled']:
                    return scan_status
            
            time.sleep(30)  # Check every 30 seconds
        
        print("⏰ Scan timeout reached")
        return 'timeout'
    
    def get_scan_issues(self, scan_id):
        """Retrieve scan issues/vulnerabilities"""
        try:
            response = self.session.get(f"{self.base_url}/v0.1/scan/{scan_id}/issues")
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ Failed to get scan issues: {response.status_code}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Error getting scan issues: {e}")
            return None
    
    def generate_report(self, scan_id, report_type='HTML'):
        """Generate scan report"""
        report_config = {
            "report_type": report_type,
            "include_false_positives": False,
            "issue_severity": ["high", "medium", "low", "info"]
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/v0.1/scan/{scan_id}/report",
                json=report_config,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                return response.content
            else:
                print(f"❌ Failed to generate report: {response.status_code}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Error generating report: {e}")
            return None
    
    def test_cors_with_burp(self, target_url):
        """Specific CORS testing using Burp Suite"""
        print("🛡️ Starting CORS-specific testing with Burp Suite...")
        
        # Custom CORS test requests
        cors_test_origins = [
            "https://evil-attacker.com",
            "http://phishing-site.net",
            "https://malicious-school.org",
            "null",
            "*"
        ]
        
        results = []
        
        for origin in cors_test_origins:
            # Send request through Burp proxy
            headers = {
                'Origin': origin,
                'Content-Type': 'application/json',
                'X-App-Signature': 'SchoolMgmt-Auth-Token',
                'X-App-Version': '1.0.0',
                'X-App-Build': 'prod-2025-001'
            }
            
            data = {"username": "admin", "password": "1234", "role": "admin"}
            
            try:
                # Route through Burp proxy
                proxies = {
                    'http': f'http://{self.burp_host}:8080',
                    'https': f'http://{self.burp_host}:8080'
                }
                
                response = requests.post(
                    f"{target_url}/api/login",
                    headers=headers,
                    json=data,
                    proxies=proxies,
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
                
                status = "✅ BLOCKED" if result['blocked'] else "❌ ALLOWED"
                print(f"   Origin {origin}: {status} (Code: {result['status_code']})")
                
            except Exception as e:
                print(f"   ❌ Error testing origin {origin}: {e}")
        
        return results

def create_burp_project_config():
    """Create Burp Suite project configuration for school management system"""
    config = {
        "project_options": {
            "connections": {
                "platform_authentication": {
                    "do_platform_authentication": True,
                    "credentials": [
                        {
                            "username": "admin",
                            "password": "1234",
                            "domain": "",
                            "type": "basic"
                        }
                    ]
                }
            },
            "http": {
                "redirections": {
                    "understand_any_status_code_as_redirection": True,
                    "process_cookies_in_redirections": True
                }
            },
            "ssl": {
                "negotiate_ssl_connections": True,
                "automatically_suggest_certificate_when_host_requests_client_certificate": True
            }
        },
        "target": {
            "scope": {
                "advanced_mode": True,
                "include": [
                    {
                        "enabled": True,
                        "file": "^/api/.*",
                        "host": "^localhost$",
                        "port": "^3443$",
                        "protocol": "https"
                    },
                    {
                        "enabled": True,
                        "file": "^/test-db$",
                        "host": "^localhost$", 
                        "port": "^3443$",
                        "protocol": "https"
                    }
                ]
            }
        },
        "scanner": {
            "live_scanning": {
                "live_audit": {
                    "audit_items": [
                        "cross_site_scripting_reflected",
                        "cross_site_scripting_stored", 
                        "sql_injection",
                        "cors_misconfiguration",
                        "ssl_cookie_without_secure_flag",
                        "password_submitted_using_get_method"
                    ]
                }
            }
        }
    }
    
    return config

def main():
    parser = argparse.ArgumentParser(description='Burp Suite Automation for School Management System')
    parser.add_argument('target', help='Target URL (e.g., https://localhost:3443)')
    parser.add_argument('--burp-host', default='127.0.0.1', help='Burp Suite host')
    parser.add_argument('--burp-port', type=int, default=1337, help='Burp Suite API port')
    parser.add_argument('--api-key', help='Burp Suite API key')
    parser.add_argument('--scan-type', default='crawl_and_audit', 
                       choices=['crawl_and_audit', 'crawl_only', 'audit_only'],
                       help='Type of scan to perform')
    parser.add_argument('--output', help='Output file for report')
    parser.add_argument('--cors-only', action='store_true', help='Run CORS-specific tests only')
    
    args = parser.parse_args()
    
    # Initialize Burp automation
    burp = BurpSuiteAutomation(args.burp_host, args.burp_port, args.api_key)
    
    if args.cors_only:
        # Run CORS-specific testing
        print("🛡️ Running CORS-specific security tests...")
        results = burp.test_cors_with_burp(args.target)
        
        blocked_count = sum(1 for r in results if r['blocked'])
        total_count = len(results)
        
        print(f"\n📊 CORS Test Results: {blocked_count}/{total_count} origins blocked")
        
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(results, f, indent=2)
            print(f"📄 Results saved to: {args.output}")
        
        return
    
    # Full Burp Suite scan
    print(f"🚀 Starting Burp Suite scan for {args.target}")
    
    # Start scan
    scan_id = burp.start_scan(args.target, args.scan_type)
    
    if not scan_id:
        print("❌ Failed to start scan")
        return
    
    # Wait for completion
    print("⏳ Waiting for scan to complete...")
    final_status = burp.wait_for_scan_completion(scan_id)
    
    if final_status == 'succeeded':
        print("✅ Scan completed successfully")
        
        # Get issues
        issues = burp.get_scan_issues(scan_id)
        
        if issues:
            print(f"📋 Found {len(issues)} security issues")
            
            # Categorize issues by severity
            severity_counts = {}
            for issue in issues:
                severity = issue.get('severity', 'unknown')
                severity_counts[severity] = severity_counts.get(severity, 0) + 1
            
            print("📊 Issues by severity:")
            for severity, count in severity_counts.items():
                print(f"   {severity.upper()}: {count}")
        
        # Generate report
        if args.output:
            print("📄 Generating report...")
            report = burp.generate_report(scan_id, 'HTML')
            
            if report:
                with open(args.output, 'wb') as f:
                    f.write(report)
                print(f"✅ Report saved to: {args.output}")
    
    else:
        print(f"❌ Scan failed with status: {final_status}")

if __name__ == "__main__":
    if len(sys.argv) == 1:
        # Default execution for testing
        target_url = "https://localhost:3443"
        burp = BurpSuiteAutomation()
        
        print("🛡️ Running CORS-specific tests with Burp Suite...")
        results = burp.test_cors_with_burp(target_url)
        
        blocked_count = sum(1 for r in results if r['blocked'])
        total_count = len(results)
        
        print(f"\n📊 CORS Test Results: {blocked_count}/{total_count} origins blocked")
    else:
        main()
