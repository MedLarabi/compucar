# PowerShell script to fix translation function calls
# This converts t('key', 'fallback') to t('key') || 'fallback'

$filePath = "src\app\files\[id]\page.tsx"

if (Test-Path $filePath) {
    Write-Host "Fixing translation calls in $filePath..."
    
    # Read the file content
    $content = Get-Content $filePath -Raw
    
    # Replace the translation function calls
    # Pattern: t('key', 'fallback') -> t('key') || 'fallback'
    $content = $content -replace "t\('([^']*)',\s*'([^']*)'\)", "t('`$1') || '`$2'"
    
    # Handle cases with escaped quotes or more complex patterns
    $content = $content -replace 't\("([^"]*)",\s*"([^"]*)"\)', 't("$1") || "$2"'
    
    # Write back to file
    $content | Set-Content $filePath -NoNewline
    
    Write-Host "✅ Translation calls fixed successfully!"
    Write-Host "Now run 'npm run build' to test the build."
} else {
    Write-Host "❌ File not found: $filePath"
    Write-Host "Please make sure you're in the correct directory."
}
