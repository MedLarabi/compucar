# RichTextEditor Component

A comprehensive, modern rich text editor designed for e-commerce admin dashboards. Built with TipTap and optimized for product description editing.

## 🚀 Features

### ✨ Text Formatting
- **Bold, Italic, Underline** - Essential text formatting
- **Font Family Selector** - Inter, Georgia, Times New Roman, Arial, Helvetica, Courier New
- **Font Size Options** - Small (12px), Medium (16px), Large (20px), Extra Large (24px)
- **Text Color Picker** - Limited palette of 6 professional colors
- **Inline Code** - Monospace formatting with gray background

### 📝 Structure & Layout
- **Headings** - H1 and H2 support
- **Lists** - Bulleted and numbered lists
- **Text Alignment** - Left, center, and right alignment
- **Code Blocks** - Full-width code formatting with monospace font

### 🖼️ Media & Content
- **Image Upload** - Drag-and-drop or button upload
- **Base64 Storage** - Default image storage as base64 strings
- **Custom Upload** - Support for custom server upload functions
- **Table Insertion** - Simple 3x2 table with borders
- **Image Resizing** - Automatic responsive images

### 📱 User Experience
- **Sticky Toolbar** - Always accessible formatting controls
- **Responsive Design** - Works on desktop and mobile
- **Performance Optimized** - 300ms debounced updates
- **Clean UI** - Modern dashboard styling with Tailwind CSS
- **Hover Effects** - Subtle button hover states

## 📦 Installation

The component uses TipTap and requires these dependencies:

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-typography @tiptap/extension-link @tiptap/extension-image @tiptap/extension-list-item @tiptap/extension-bullet-list @tiptap/extension-ordered-list @tiptap/extension-text-align @tiptap/extension-underline @tiptap/extension-code @tiptap/extension-code-block @tiptap/extension-text-style @tiptap/extension-color @tiptap/extension-font-family
```

## 🔧 Usage

### Basic Usage

```tsx
import { RichTextEditor } from "@/components/ui/rich-text-editor-admin";

function ProductForm() {
  const [description, setDescription] = useState("");

  return (
    <RichTextEditor
      value={description}
      onChange={setDescription}
      placeholder="Write your product description here..."
    />
  );
}
```

### With Custom Image Upload

```tsx
import { RichTextEditor } from "@/components/ui/rich-text-editor-admin";

function ProductForm() {
  const [description, setDescription] = useState("");

  // Custom upload function
  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    return data.url; // Return the uploaded image URL
  };

  return (
    <RichTextEditor
      value={description}
      onChange={setDescription}
      uploadImage={handleImageUpload}
      placeholder="Write your product description here..."
    />
  );
}
```

### With React Hook Form

```tsx
import { useForm } from "react-hook-form";
import { RichTextEditor } from "@/components/ui/rich-text-editor-admin";

function ProductForm() {
  const form = useForm();

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product Description</FormLabel>
            <FormControl>
              <RichTextEditor
                value={field.value}
                onChange={field.onChange}
                placeholder="Write your product description here..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </form>
  );
}
```

## 📋 Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `""` | The HTML content of the editor |
| `onChange` | `(content: string) => void` | `undefined` | Callback fired when content changes |
| `placeholder` | `string` | `"Write your product description here..."` | Placeholder text when editor is empty |
| `className` | `string` | `undefined` | Additional CSS classes |
| `disabled` | `boolean` | `false` | Whether the editor is disabled |
| `uploadImage` | `(file: File) => Promise<string>` | `undefined` | Custom image upload function |

## 🎨 Styling

The component uses Tailwind CSS and includes:

- **Sticky toolbar** with light gray borders
- **Hover effects** on all buttons
- **Professional color palette** for text colors
- **Responsive grid** for toolbar organization
- **Clean typography** with proper spacing

### Customization

You can customize the appearance by:

1. **Overriding CSS classes** via the `className` prop
2. **Modifying color constants** in the component file
3. **Adjusting font families** in the `FONT_FAMILIES` array
4. **Changing toolbar layout** in the component structure

## 🔄 Output Format

The editor outputs clean HTML that includes:

```html
<h1>Product Title</h1>
<p>This is a <strong>bold</strong> and <em>italic</em> text example.</p>
<ul>
  <li>Feature 1</li>
  <li>Feature 2</li>
</ul>
<p style="color: #DC2626">Highlighted text in red</p>
<img src="data:image/jpeg;base64,..." alt="Product image" class="max-w-full h-auto rounded-md border" />
```

## 📱 Mobile Support

The editor is fully responsive and includes:

- **Collapsible toolbar** on smaller screens
- **Touch-friendly buttons** with proper sizing
- **Drag-and-drop image upload** on mobile devices
- **Optimized performance** for mobile browsers

## 🚀 Performance

- **Debounced updates** (300ms) prevent excessive re-renders
- **Optimized extensions** for better performance
- **Lazy loading** of complex features
- **Memory cleanup** on component unmount

## 🔧 Advanced Configuration

### Custom Font Families

```tsx
// Modify the FONT_FAMILIES array in the component
const FONT_FAMILIES = [
  { value: "YourCustomFont", label: "Custom Font" },
  // ... other fonts
];
```

### Custom Colors

```tsx
// Modify the COLORS array in the component
const COLORS = [
  "#000000", // Black
  "#FF0000", // Red
  // ... other colors
];
```

### Server Upload Integration

```tsx
const uploadImage = async (file: File): Promise<string> => {
  // Upload to your server
  const response = await uploadToServer(file);
  return response.url;
};
```

## 🐛 Troubleshooting

### Common Issues

1. **Styles not loading**: Ensure Tailwind CSS is properly configured
2. **Images not uploading**: Check your upload function implementation
3. **Performance issues**: Verify debouncing is working correctly
4. **Mobile issues**: Test touch interactions on actual devices

### Browser Compatibility

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## 📚 Examples

See the `/admin/editor-demo` page for a comprehensive example with:

- Live preview
- Form integration
- Custom upload handling
- Feature showcase

## 🤝 Contributing

To improve the component:

1. Add new TipTap extensions for additional features
2. Enhance mobile responsiveness
3. Optimize performance further
4. Add accessibility features
5. Improve documentation

## 📄 License

This component is part of the CompuCar e-commerce platform and follows the project's licensing terms.
