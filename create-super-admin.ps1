# ===============================================
# Create Super Admin User - PowerShell Script
# ===============================================
# This script creates a super admin user for CompuCar

Write-Host "🔧 CompuCar Super Admin User Creation" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Method 1: Use the TypeScript script (Recommended)
Write-Host "Method 1: Using TypeScript Script (Recommended)" -ForegroundColor Green
Write-Host "----------------------------------------------" -ForegroundColor Green
Write-Host "This will create a super admin with email: admin@compucar.com"
Write-Host "Password: admin123"
Write-Host ""

$useScript = Read-Host "Do you want to use the existing script? (Y/n)"

if ($useScript -eq "" -or $useScript -eq "Y" -or $useScript -eq "y") {
    Write-Host "🚀 Running admin creation script..." -ForegroundColor Yellow
    npx tsx scripts/create-admin-user.ts
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Super admin user created successfully!" -ForegroundColor Green
        Write-Host "📝 Login credentials:" -ForegroundColor Cyan
        Write-Host "   Email: admin@compucar.com" -ForegroundColor White
        Write-Host "   Password: admin123" -ForegroundColor White
        Write-Host ""
        Write-Host "🔗 Login URLs:" -ForegroundColor Cyan
        Write-Host "   Local: http://localhost:3000/auth/login" -ForegroundColor White
        Write-Host "   Production: https://compucar.pro/auth/login" -ForegroundColor White
        Write-Host "   Admin Panel: /admin" -ForegroundColor White
        Write-Host ""
        Write-Host "⚠️  SECURITY REMINDER:" -ForegroundColor Yellow
        Write-Host "   Change the password after first login!" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Failed to create admin user. Check the error above." -ForegroundColor Red
    }
    exit 0
}

# Method 2: Custom credentials
Write-Host ""
Write-Host "Method 2: Custom Credentials" -ForegroundColor Green
Write-Host "---------------------------" -ForegroundColor Green

$email = Read-Host "Enter admin email"
$password = Read-Host "Enter admin password" -AsSecureString
$firstName = Read-Host "Enter first name"
$lastName = Read-Host "Enter last name"

# Convert secure string to plain text (for the script)
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

if (-not $email -or -not $passwordPlain -or -not $firstName -or -not $lastName) {
    Write-Host "❌ All fields are required!" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Running custom admin creation script..." -ForegroundColor Yellow
npx tsx scripts/create-super-admin.ts

Write-Host ""
Write-Host "✅ Process completed!" -ForegroundColor Green
Write-Host "Check the output above for results." -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 Alternative Methods:" -ForegroundColor Cyan
Write-Host "1. Use SQL script: create-super-admin.sql" -ForegroundColor White
Write-Host "2. Use existing make-admin.sql script" -ForegroundColor White
Write-Host "3. Run: npx tsx scripts/create-super-admin.ts" -ForegroundColor White
