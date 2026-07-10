@echo off
echo.
echo 🔐 Creating Trusted SSL Certificates for Localhost
echo =================================================
echo.

REM Check if OpenSSL is available
where openssl >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ OpenSSL not found. Please install OpenSSL first.
    echo.
    echo You can install OpenSSL using one of these methods:
    echo 1. Download from: https://slproweb.com/products/Win32OpenSSL.html
    echo 2. Install via Chocolatey: choco install openssl
    echo 3. Install via Scoop: scoop install openssl
    echo.
    pause
    exit /b 1
)

REM Create certificates directory
if not exist "certs" mkdir certs
echo ✅ Created certificates directory
cd certs

echo.
echo 📋 Step 1: Creating Certificate Authority (CA)
echo.

REM Generate CA private key
openssl genrsa -out ca-key.pem 2048
echo ✅ CA private key generated

REM Generate CA certificate
openssl req -new -x509 -days 365 -key ca-key.pem -out ca-cert.pem -subj "/C=US/ST=CA/L=San Francisco/O=School Management System/OU=Development CA/CN=Local Development CA"
echo ✅ CA certificate generated

echo.
echo 📋 Step 2: Creating Server Certificate
echo.

REM Generate server private key
openssl genrsa -out server-key.pem 2048
echo ✅ Server private key generated

REM Generate certificate signing request
openssl req -new -key server-key.pem -out server.csr -config ..\localhost.conf
echo ✅ Certificate signing request generated

REM Generate server certificate signed by CA
openssl x509 -req -in server.csr -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial -out server-cert.pem -days 365 -extensions v3_req -extfile ..\localhost.conf
echo ✅ Server certificate generated and signed by CA

echo.
echo 📋 Step 3: Copying certificates to project root
echo.

REM Copy certificates to project root with expected names
copy "server-cert.pem" "..\cert.pem" >nul
copy "server-key.pem" "..\key.pem" >nul
echo ✅ Certificates copied to project root

REM Clean up CSR file
del "server.csr" >nul

cd ..

echo.
echo 🎉 SUCCESS! Trusted certificates created!
echo =================================================
echo 📁 Certificate files created:
echo    • cert.pem (server certificate)
echo    • key.pem (server private key)
echo    • certs/ca-cert.pem (CA certificate)
echo    • certs/ca-key.pem (CA private key)
echo.
echo 🔄 Next steps:
echo    1. Install the CA certificate manually (see instructions below)
echo    2. Restart your Node.js server
echo    3. Visit https://localhost:3443
echo.
echo 📋 Manual CA Installation Instructions:
echo    1. Double-click on certs\ca-cert.pem
echo    2. Click "Install Certificate..."
echo    3. Select "Local Machine" and click "Next"
echo    4. Select "Place all certificates in the following store"
echo    5. Click "Browse..." and select "Trusted Root Certification Authorities"
echo    6. Click "Next" and then "Finish"
echo.
pause
