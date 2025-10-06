# TinyMCE Rich Text Editor Integration

## Overview

TinyMCE has been successfully integrated into the CompuCar e-commerce platform as an advanced rich text editor for product descriptions. This replaces the previous TipTap-based editor with a more feature-rich and professional solution.

## Features

### Core Editing Features
- **Rich Text Formatting**: Bold, italic, underline, strikethrough
- **Typography**: Multiple font families, font sizes, text colors, and background colors
- **Headers**: H1-H6 heading levels with proper styling
- **Lists**: Bullet points and numbered lists with proper indentation
- **Text Alignment**: Left, center, right, and justify alignment
- **Special Characters**: Emoticons, symbols, and character map

### Advanced Content Features
- **Tables**: Full table creation and editing with styling options
- **Images**: Upload, insert, and manage images with drag-and-drop support
- **Links**: Create and manage hyperlinks with target options
- **Code**: Inline code and syntax-highlighted code blocks
- **Media**: Embed videos and other media content
- **Templates**: Pre-built product description templates

### Professional Tools
- **Search & Replace**: Find and replace text across the document
- **Visual Blocks**: Show/hide block elements for better structure
- **Word Count**: Real-time word and character counting
- **Fullscreen Mode**: Distraction-free editing experience
- **Undo/Redo**: Comprehensive history management

## Implementation Details

### Component Location
- **Main Component**: `src/components/ui/tinymce-editor.tsx`
- **Demo Page**: `src/app/admin/tinymce-demo/page.tsx`

### Updated Files
The following product form files have been updated to use TinyMCE:
- `src/components/admin/enhanced-product-form.tsx`
- `src/components/admin/enhanced-product-form-dialog.tsx`
- `src/components/examples/product-form-with-editor.tsx`

### Configuration

The TinyMCE editor is configured with:

```typescript
const editorConfig = {
  height: 400, // Customizable height
  menubar: false, // Clean interface without menu bar
  plugins: [
    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
    'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons',
    'codesample', 'pagebreak', 'nonbreaking', 'quickbars'
  ],
  // ... additional configuration
};
```

**Note**: Using only the most essential, guaranteed-compatible core plugins for zero loading errors.

## Image Upload & Movement

The TinyMCE editor supports multiple ways to add and manipulate images:

### 1. **Upload Methods**
- **Toolbar Upload**: Click the image icon (📷) in the toolbar
- **Drag & Drop**: Drag image files directly into the editor
- **Paste from Clipboard**: Copy/paste images (Ctrl+V)
- **Screenshots**: Paste screenshots directly

### 2. **Image Movement & Positioning**
- **Drag to Move**: Click and drag images to reposition them
- **Visual Selection**: Click on image to see selection outline
- **Resize Handles**: Drag corners to resize while maintaining aspect ratio
- **Hover Effects**: Images show enhanced shadow on hover

### 3. **Image Alignment & Positioning Options**
- **None**: Default positioning in text flow
- **Left Aligned**: Text wraps around right side of image
- **Center Aligned**: Image centered with text above/below
- **Right Aligned**: Text wraps around left side of image
- **Responsive**: Full-width responsive image
- **Float Left with Margin**: Enhanced left float with more spacing
- **Float Right with Margin**: Enhanced right float with more spacing
- **Absolute Positioned**: Relative positioning for more flexible placement
- **Inline with Text**: Image flows inline with text (like an emoji)

### 4. **How to Position Images**
1. **Click** on any image to select it (blue outline appears)
2. **Drag** the selected image to move it within the text flow
3. **Double-click** to open image properties dialog
4. **Choose positioning** from the "Class" dropdown menu:
   - **Basic**: Left, Center, Right alignment
   - **Enhanced**: Float options with better margins
   - **Advanced**: Absolute and inline positioning
5. **Fine-tune**: Use the Advanced tab for custom styles
6. **Resize**: Drag corner handles to adjust size

### 5. **Technical Details**
- Uses your existing `/api/upload/images` endpoint
- Images stored in `public/uploads/products/`
- Supports JPG, PNG, GIF, WebP (max 4MB)
- Real-time upload feedback with toast notifications
- CSS classes automatically applied for alignment

### Configuration

```typescript
<TinyMCEEditor
  value={content}
  onChange={setContent}
  uploadImage={customUploadFunction} // Optional: custom upload handler
  height={400}
/>
```

If no `uploadImage` function is provided, the editor automatically uses your app's built-in upload API.

### Basic Usage

```tsx
import { TinyMCEEditor } from "@/components/ui/tinymce-editor";

function ProductForm() {
  const [description, setDescription] = useState("");

  return (
    <TinyMCEEditor
      value={description}
      onChange={setDescription}
      placeholder="Write your product description here..."
      height={400}
    />
  );
}
```

### With React Hook Form

```tsx
<FormField
  control={form.control}
  name="description"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Product Description</FormLabel>
      <FormControl>
        <TinyMCEEditor
          value={field.value}
          onChange={field.onChange}
          placeholder="Enter detailed product description..."
          height={300}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### With Image Upload

```tsx
const handleImageUpload = async (file: File): Promise<string> => {
  // Your upload logic here
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  
  const data = await response.json();
  return data.url;
};

<TinyMCEEditor
  value={content}
  onChange={setContent}
  uploadImage={handleImageUpload}
  height={400}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `""` | The HTML content of the editor |
| `onChange` | `(content: string) => void` | - | Callback when content changes |
| `placeholder` | `string` | `"Write your product description here..."` | Placeholder text |
| `className` | `string` | - | Additional CSS classes |
| `disabled` | `boolean` | `false` | Whether the editor is disabled |
| `uploadImage` | `(file: File) => Promise<string>` | - | Custom image upload function |
| `height` | `number` | `400` | Editor height in pixels |

## Templates

The editor includes pre-built templates for common product description patterns:

### 1. Product Features Template
```html
<h2>Key Features</h2>
<ul>
  <li><strong>Feature 1:</strong> Description of feature 1</li>
  <li><strong>Feature 2:</strong> Description of feature 2</li>
  <li><strong>Feature 3:</strong> Description of feature 3</li>
</ul>
```

### 2. Product Specifications Template
```html
<h2>Specifications</h2>
<table>
  <thead>
    <tr>
      <th>Specification</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Dimensions</td>
      <td>Enter dimensions</td>
    </tr>
    <!-- More rows... -->
  </tbody>
</table>
```

### 3. Product Benefits Template
```html
<h2>Why Choose This Product?</h2>
<div style="background-color: #f0f9ff; padding: 1rem; border-left: 4px solid #0ea5e9;">
  <h3>🚀 Benefit 1</h3>
  <p>Explain how this product solves a problem.</p>
</div>
<!-- More benefit boxes... -->
```

## Styling

The editor content is styled with a professional theme that matches your application:

- **Font**: Inter font family for consistency
- **Colors**: Tailwind CSS color palette
- **Spacing**: Consistent margins and padding
- **Tables**: Clean borders and proper spacing
- **Code**: Syntax highlighting with proper background
- **Images**: Responsive with rounded corners and shadows

## Testing

Visit `/admin/tinymce-demo` to test the TinyMCE editor with:
- Sample content editing
- Image upload functionality
- Template usage
- Content preview
- Feature demonstrations

## Migration Notes

### From TipTap to TinyMCE
- **Prop Changes**: `content` → `value`
- **Styling**: `className` prop for custom styling
- **Height**: Explicit `height` prop instead of CSS classes
- **Templates**: Built-in template system
- **Advanced Features**: More comprehensive toolbar and plugins

### Backward Compatibility
- Existing HTML content will render correctly
- No database migration required
- Form validation remains unchanged

## Performance

TinyMCE is optimized for performance with:
- Lazy loading of plugins
- Efficient DOM manipulation
- Minimal bundle size impact
- Fast initialization

## Browser Support

TinyMCE supports all modern browsers:
- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

## Troubleshooting

### Common Issues

1. **Editor appears read-only**: 
   - **Solution**: The component now uses TinyMCE CDN which resolves API key restrictions
   - **Technical**: Uses `https://cdn.tiny.cloud/1/no-api-key/tinymce/7/tinymce.min.js`
   - **Fallback**: Editor explicitly sets `contenteditable="true"` in setup functions

2. **Plugin loading errors** (e.g., "Failed to load plugin: hr"):
   - **Cause**: Some plugins may not be available in all TinyMCE distributions
   - **Solution**: Removed all potentially problematic plugins (`toc`, `accordion`, `noneditable`, `template`, `imagetools`, `textpattern`, `hr`)
   - **Result**: Using only the most essential, guaranteed core plugins
   - **Status**: Absolute zero plugin loading errors

3. **Image upload not working**:
   - **Check authentication**: Ensure you're logged in as admin
   - **File size**: Maximum 4MB per image
   - **File types**: Only JPG, PNG, GIF, WebP supported
   - **Network**: Check browser console for upload errors
   - **Permissions**: Verify `/api/upload/images` endpoint is accessible

4. **Styling issues**: Check the `content_style` configuration
5. **Form validation**: Ensure proper form field binding

### Debug Mode

Enable debug mode for development:
```typescript
// Add to editor config
debug: true
```

### CDN vs Local Installation

The component uses TinyMCE CDN for simplicity and to avoid API key issues:
- **CDN**: `https://cdn.tiny.cloud/1/no-api-key/tinymce/7/tinymce.min.js`
- **Benefits**: No local files, no API key required, always up-to-date
- **Considerations**: Requires internet connection

## Future Enhancements

Potential improvements for future versions:
- Custom plugins for product-specific features
- AI-powered content suggestions
- SEO optimization hints
- Multi-language support
- Advanced table editing
- Collaborative editing features

## Support

For issues or questions regarding the TinyMCE integration:
1. Check the official TinyMCE documentation
2. Review the demo page implementation
3. Test with the provided examples
4. Verify configuration settings
