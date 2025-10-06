# Simple CompuCar Database Setup Script
Write-Host "=== CompuCar Database Setup ===" -ForegroundColor Green

# Add PostgreSQL to PATH if not already there
$pgPath = "C:\Program Files\PostgreSQL\17\bin"
if ($env:PATH -notlike "*$pgPath*") {
    $env:PATH += ";$pgPath"
    Write-Host "Added PostgreSQL to PATH" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "This will create CompuCar database and user." -ForegroundColor Cyan
Write-Host "You'll need to enter your postgres password when prompted." -ForegroundColor Yellow
Write-Host ""

# Run the SQL setup script
psql -U postgres -h localhost -f "database-setup.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Database setup completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Database Details:" -ForegroundColor Yellow
    Write-Host "  Host: localhost"
    Write-Host "  Port: 5432" 
    Write-Host "  Database: compucar"
    Write-Host "  User: compucar_user"
    Write-Host "  Password: compucar_password_123"
} else {
    Write-Host "✗ Setup failed. Check errors above." -ForegroundColor Red
}



