# CompuCar Database Setup Script for postgres user
Write-Host "=== CompuCar Database Setup (postgres user) ===" -ForegroundColor Green

# Add PostgreSQL to PATH if not already there
$pgPath = "C:\Program Files\PostgreSQL\17\bin"
if ($env:PATH -notlike "*$pgPath*") {
    $env:PATH += ";$pgPath"
    Write-Host "Added PostgreSQL to PATH" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "This will create CompuCar database using postgres user." -ForegroundColor Cyan
Write-Host "You'll need to enter your postgres password when prompted." -ForegroundColor Yellow
Write-Host ""

# Run the SQL setup script
psql -U postgres -h localhost -f "database-setup-postgres.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Database setup completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Database Details:" -ForegroundColor Yellow
    Write-Host "  Host: localhost"
    Write-Host "  Port: 5432" 
    Write-Host "  Database: compucar"
    Write-Host "  User: postgres"
    Write-Host "  Password: postgres"
    Write-Host ""
    Write-Host "DATABASE_URL for .env file:" -ForegroundColor Cyan
    Write-Host 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/compucar?schema=public"' -ForegroundColor White
} else {
    Write-Host "✗ Setup failed. Check errors above." -ForegroundColor Red
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Create .env file in project root"
Write-Host "2. Add the DATABASE_URL shown above to your .env file"
Write-Host "3. Run: npx prisma migrate deploy"
Write-Host "4. Run: npx prisma db seed"
