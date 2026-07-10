# PowerShell script to create trusted certificates for localhost
# Run this script as Administrator

Write-Host "🔐 Creating Trusted SSL Certificates for Localhost" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Check if OpenSSL is available
$opensslPath = Get-Command openssl -ErrorAction SilentlyContinue
if (-not $opensslPath) {
    Write-Host "❌ OpenSSL not found. Installing via Chocolatey..." -ForegroundColor Red
    
    # Check if Chocolatey is installed
    $chocoPath = Get-Command choco -ErrorAction SilentlyContinue
    if (-not $chocoPath) {
        Write-Host "Installing Chocolatey first..." -ForegroundColor Yellow
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        refreshenv
    }
    
    Write-Host "Installing OpenSSL..." -ForegroundColor Yellow
    choco install openssl -y
    refreshenv
}

# Create certificates directory
$certDir = ".\certs"
if (-not (Test-Path $certDir)) {
    New-Item -ItemType Directory -Path $certDir
    Write-Host "✅ Created certificates directory: $certDir" -ForegroundColor Green
}

Set-Location $certDir

Write-Host "📋 Step 1: Creating Certificate Authority (CA)" -ForegroundColor Cyan

# Generate CA private key
openssl genrsa -out ca-key.pem 2048
Write-Host "✅ CA private key generated" -ForegroundColor Green

# Generate CA certificate
openssl req -new -x509 -days 365 -key ca-key.pem -out ca-cert.pem -subj "/C=US/ST=CA/L=San Francisco/O=School Management System/OU=Development CA/CN=Local Development CA"
Write-Host "✅ CA certificate generated" -ForegroundColor Green

Write-Host "📋 Step 2: Creating Server Certificate" -ForegroundColor Cyan

# Generate server private key
openssl genrsa -out server-key.pem 2048
Write-Host "✅ Server private key generated" -ForegroundColor Green

# Generate certificate signing request
openssl req -new -key server-key.pem -out server.csr -config ..\localhost.conf
Write-Host "✅ Certificate signing request generated" -ForegroundColor Green

# Generate server certificate signed by CA
openssl x509 -req -in server.csr -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial -out server-cert.pem -days 365 -extensions v3_req -extfile ..\localhost.conf
Write-Host "✅ Server certificate generated and signed by CA" -ForegroundColor Green

Write-Host "📋 Step 3: Installing CA Certificate in Windows Trust Store" -ForegroundColor Cyan

# Install CA certificate in Windows Certificate Store
$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2
$cert.Import("ca-cert.pem")

$store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "LocalMachine")
$store.Open("ReadWrite")

# Check if certificate already exists
$existingCert = $store.Certificates | Where-Object { $_.Subject -eq $cert.Subject }
if ($existingCert) {
    Write-Host "⚠️  CA certificate already exists in trust store" -ForegroundColor Yellow
} else {
    $store.Add($cert)
    Write-Host "✅ CA certificate installed in Windows trust store" -ForegroundColor Green
}
$store.Close()

Write-Host "📋 Step 4: Copying certificates to project root" -ForegroundColor Cyan

# Copy certificates to project root with expected names
Copy-Item "server-cert.pem" "..\cert.pem" -Force
Copy-Item "server-key.pem" "..\key.pem" -Force
Write-Host "✅ Certificates copied to project root" -ForegroundColor Green

# Clean up CSR file
Remove-Item "server.csr" -Force

Set-Location ..

Write-Host ""
Write-Host "🎉 SUCCESS! Trusted certificates created and installed!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host "📁 Certificate files created:" -ForegroundColor White
Write-Host "   • cert.pem (server certificate)" -ForegroundColor Gray
Write-Host "   • key.pem (server private key)" -ForegroundColor Gray
Write-Host "   • certs/ca-cert.pem (CA certificate)" -ForegroundColor Gray
Write-Host "   • certs/ca-key.pem (CA private key)" -ForegroundColor Gray
Write-Host ""
Write-Host "🔄 Next steps:" -ForegroundColor White
Write-Host "   1. Restart your Node.js server" -ForegroundColor Gray
Write-Host "   2. Visit https://localhost:3443" -ForegroundColor Gray
Write-Host "   3. You should now see a secure connection!" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Note: You may need to restart your browser for changes to take effect." -ForegroundColor Yellow
