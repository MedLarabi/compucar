Write-Host "Setting up CompuCar database..." -ForegroundColor Green
Write-Host "You will be prompted for postgres password (should be 'postgres')" -ForegroundColor Yellow

psql -U postgres -h localhost -f "database-setup-postgres.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database setup completed successfully!" -ForegroundColor Green
    Write-Host "DATABASE_URL: postgresql://postgres:postgres@localhost:5432/compucar?schema=public" -ForegroundColor Cyan
} else {
    Write-Host "Setup failed. Please check the errors above." -ForegroundColor Red
}
