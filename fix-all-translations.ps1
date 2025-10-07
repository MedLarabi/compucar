# Complete translation fix script
# Run this from your project root (D:\github)

Write-Host "🔧 Fixing translation function calls..."

# Get all TypeScript and TSX files that might have translation calls
$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.tsx" | Where-Object { $_.Name -eq "page.tsx" }

foreach ($file in $files) {
    Write-Host "Processing: $($file.FullName)"
    
    try {
        # Read file content
        $content = Get-Content $file.FullName | Out-String
        
        # Track if we made changes
        $originalContent = $content
        
        # Replace translation calls
        $content = $content -replace "t\('([^']*)',\s*'([^']*)'\)", "t('`$1') || '`$2'"
        $content = $content -replace 't\("([^"]*)",\s*"([^"]*)"\)', 't("$1") || "$2"'
        
        # Only write if content changed
        if ($content -ne $originalContent) {
            $content | Set-Content $file.FullName
            Write-Host "✅ Fixed translations in: $($file.Name)"
        }
    }
    catch {
        Write-Host "❌ Error processing $($file.Name): $($_.Exception.Message)"
    }
}

Write-Host "🎉 Translation fix complete! Run 'npm run build' to test."
