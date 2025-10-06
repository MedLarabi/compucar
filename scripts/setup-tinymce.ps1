# TinyMCE Self-Hosted Setup Script
# This script copies TinyMCE assets from node_modules to public directory

Write-Host "Setting up TinyMCE self-hosted assets..." -ForegroundColor Green

# Check if node_modules/tinymce exists
if (-Not (Test-Path "node_modules\tinymce")) {
    Write-Host "TinyMCE package not found. Installing..." -ForegroundColor Yellow
    npm install tinymce
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install TinyMCE package!" -ForegroundColor Red
        exit 1
    }
}

# Create public/tinymce directory if it doesn't exist
if (-Not (Test-Path "public\tinymce")) {
    Write-Host "Creating public/tinymce directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "public\tinymce" -Force | Out-Null
}

# Copy TinyMCE assets
Write-Host "Copying TinyMCE assets to public directory..." -ForegroundColor Yellow
try {
    xcopy "node_modules\tinymce" "public\tinymce" /E /I /Y /Q
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ TinyMCE assets copied successfully!" -ForegroundColor Green
        Write-Host "📁 Assets location: public/tinymce/" -ForegroundColor Cyan
        Write-Host "🚀 TinyMCE is now ready to use without API key!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to copy TinyMCE assets!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error copying TinyMCE assets: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 Summary:" -ForegroundColor Cyan
Write-Host "  • TinyMCE package: Installed" -ForegroundColor White
Write-Host "  • Assets location: public/tinymce/" -ForegroundColor White
Write-Host "  • Script source: /tinymce/tinymce.min.js" -ForegroundColor White
Write-Host "  • API key: Not required" -ForegroundColor White

Write-Host "`n🔧 To update TinyMCE in the future:" -ForegroundColor Cyan
Write-Host "  1. npm update tinymce" -ForegroundColor White
Write-Host "  2. Run this script again" -ForegroundColor White
