# CompuCar Database Setup Script for Windows
# This script will create the database and user for CompuCar e-commerce application

Write-Host "=== CompuCar Database Setup ===" -ForegroundColor Green
Write-Host ""

# Add PostgreSQL to PATH if not already there
$pgPath = "C:\Program Files\PostgreSQL\17\bin"
if ($env:PATH -notlike "*$pgPath*") {
    $env:PATH += ";$pgPath"
    Write-Host "Added PostgreSQL to PATH for this session" -ForegroundColor Yellow
}

# Test PostgreSQL connection
Write-Host "Testing PostgreSQL installation..." -ForegroundColor Cyan
try {
    $version = & psql --version
    Write-Host "✓ PostgreSQL found: $version" -ForegroundColor Green
} catch {
    Write-Host "✗ PostgreSQL not found. Please check installation." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "This script will create:" -ForegroundColor Cyan
Write-Host "  • Database: compucar"
Write-Host "  • User: compucar_user"
Write-Host "  • Password: compucar_password_123"
Write-Host ""

# Prompt for postgres password
Write-Host "Please enter the password for 'postgres' user (set during installation):" -ForegroundColor Yellow
$postgresPassword = Read-Host -AsSecureString
$postgresPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($postgresPassword))

Write-Host ""
Write-Host "Creating CompuCar database..." -ForegroundColor Cyan

# Set PGPASSWORD environment variable for non-interactive connection
$env:PGPASSWORD = $postgresPasswordPlain

try {
    # Run the SQL setup script
    & psql -U postgres -h localhost -f "database-setup.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Database setup completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "=== Next Steps ===" -ForegroundColor Cyan
        Write-Host "1. Create .env.local file with database connection details"
        Write-Host "2. Install Prisma ORM"
        Write-Host "3. Generate Prisma client"
        Write-Host ""
        Write-Host "Database Details:" -ForegroundColor Yellow
        Write-Host "  Host: localhost"
        Write-Host "  Port: 5432"
        Write-Host "  Database: compucar"
        Write-Host "  User: compucar_user"
        Write-Host "  Password: compucar_password_123"
    } else {
        Write-Host "✗ Database setup failed. Please check the error messages above." -ForegroundColor Red
    }
}
catch {
    Write-Host "✗ Error during database setup: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    # Clear the password from environment
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
