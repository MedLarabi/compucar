# TinyMCE Self-Hosted Setup

## Overview

CompuCar now uses a self-hosted version of TinyMCE instead of the cloud-based API key approach. This provides several benefits:

- ✅ No API key required
- ✅ No internet dependency for the editor
- ✅ Better performance (local assets)
- ✅ Full control over updates
- ✅ No usage limitations
- ✅ Better privacy and security

## How It Works

The TinyMCE assets are:
1. **Installed via npm**: `npm install tinymce`
2. **Copied to public directory**: All TinyMCE files are in `/public/tinymce/`
3. **Loaded locally**: Editor uses `/tinymce/tinymce.min.js` script source

## File Structure

```
public/
├── tinymce/
│   ├── tinymce.min.js          # Main TinyMCE script
│   ├── plugins/                # All plugins (advlist, image, etc.)
│   ├── themes/                 # UI themes
│   ├── skins/                  # Visual skins
│   ├── icons/                  # Icon sets
│   └── models/                 # Content models
```

## Component Configuration

The TinyMCE editor component (`src/components/ui/tinymce-editor.tsx`) is configured to:
- Use `tinymceScriptSrc="/tinymce/tinymce.min.js"` instead of API key
- Use `license_key: 'gpl'` to enable GPL license mode (no commercial license required)
- Load all plugins and themes from local files
- Maintain all existing functionality (image upload, formatting, etc.)

## Updating TinyMCE

To update TinyMCE to a newer version:

```bash
# 1. Update the npm package
npm update tinymce

# 2. Re-copy assets to public directory
xcopy "node_modules\tinymce" "public\tinymce" /E /I /Y
```

## Benefits Over API Key Method

| Feature | Self-Hosted | API Key |
|---------|-------------|---------|
| Internet Required | ❌ No | ✅ Yes |
| Usage Limits | ❌ None | ✅ Has limits |
| Performance | ✅ Faster | ❌ Slower |
| Privacy | ✅ Better | ❌ Data sent to cloud |
| Control | ✅ Full | ❌ Limited |
| Cost | ✅ Free | ❌ May have costs |

## Troubleshooting

If the editor doesn't load:
1. **Check files exist**: Verify `/public/tinymce/tinymce.min.js` exists
2. **Check console**: Look for 404 errors in browser console
3. **Re-copy assets**: Run the copy command again if files are missing
4. **Clear cache**: Hard refresh the browser (Ctrl+F5)

**Common Issues:**

### "Editor is disabled because a TinyMCE license key has not been provided"
- **Solution**: The component includes `license_key: 'gpl'` configuration
- **Cause**: Self-hosted TinyMCE requires GPL license declaration
- **Status**: ✅ Fixed in component configuration

### Editor shows "This domain is not registered with TinyMCE Cloud"
- **Solution**: Use self-hosted version (not cloud CDN)
- **Check**: Ensure `tinymceScriptSrc="/tinymce/tinymce.min.js"` is set
- **Status**: ✅ Using local assets

## Migration Complete

No environment variables are needed for TinyMCE anymore. The `NEXT_PUBLIC_TINYMCE_API_KEY` variable has been removed from the configuration.
