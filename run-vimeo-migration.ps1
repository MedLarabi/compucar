# PowerShell script to run Vimeo database migration
# Run this script from your project root directory

param(
    [string]$Host = "72.60.95.142",
    [string]$Port = "5432", 
    [string]$Database = "tuning",
    [string]$Username = "postgres"
)

Write-Host "🚀 CompuCar Vimeo Migration Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if migration file exists
if (-not (Test-Path "database-migration-vimeo.sql")) {
    Write-Host "❌ Error: database-migration-vimeo.sql not found!" -ForegroundColor Red
    Write-Host "Make sure you're running this from the project root directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Migration Details:" -ForegroundColor Green
Write-Host "  Host: $Host" -ForegroundColor White
Write-Host "  Port: $Port" -ForegroundColor White  
Write-Host "  Database: $Database" -ForegroundColor White
Write-Host "  Username: $Username" -ForegroundColor White
Write-Host ""

# Confirm before proceeding
$confirm = Read-Host "Do you want to proceed with the migration? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "❌ Migration cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🔄 Running migration..." -ForegroundColor Yellow

try {
    # Run the migration using psql
    $env:PGPASSWORD = Read-Host "Enter database password" -AsSecureString
    $password = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($env:PGPASSWORD))
    $env:PGPASSWORD = $password
    
    # Execute the migration
    psql -h $Host -p $Port -U $Username -d $Database -f "database-migration-vimeo.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎯 Next steps:" -ForegroundColor Cyan
        Write-Host "  1. Go to Admin → Products → Edit → Media tab" -ForegroundColor White
        Write-Host "  2. Look for 'Professional Video Hosting' section" -ForegroundColor White
        Write-Host "  3. Add your first Vimeo video!" -ForegroundColor White
        Write-Host ""
        Write-Host "📖 Need help? Check POSTGRESQL_MIGRATION_GUIDE.md" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "❌ Migration failed! Check the error messages above." -ForegroundColor Red
        Write-Host "📖 See POSTGRESQL_MIGRATION_GUIDE.md for troubleshooting." -ForegroundColor Yellow
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error running migration: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "📖 See POSTGRESQL_MIGRATION_GUIDE.md for troubleshooting." -ForegroundColor Yellow
} finally {
    # Clear password from environment
    $env:PGPASSWORD = $null
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
# Fix: Secure password handling and environment variable cleanup

# Properly clear the plain password variable from memory
if ($password) {
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR(
        [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($env:PGPASSWORD)
    )
    $password = $null
}

# Also clear the secure string variable if it exists
if ($env:PGPASSWORD) {
    $env:PGPASSWORD = $null
}

