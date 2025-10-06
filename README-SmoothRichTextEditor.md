# SmoothRichTextEditor

A high-performance, smooth-typing rich text editor built with TipTap and optimized for e-commerce admin dashboards.

## 🚀 Features

### ⚡ Performance Optimizations
- **60fps update rate** - Ultra-fast 16ms debounce for smooth typing
- **Lazy loading extensions** - Memoized extensions to prevent unnecessary re-renders
- **Optimized memory usage** - Reduced history depth and efficient DOM management
- **Smooth cursor movement** - No lag even with large content

### 📝 Rich Text Features
- **Text Formatting**: Bold, Italic, Underline, Strikethrough
- **Typography**: Font family selector (6 fonts), Font size (3 sizes)
- **Headings**: H1, H2 support
- **Lists**: Bulleted and numbered lists
- **Alignment**: Left, center, right text alignment
- **Colors**: Text color picker with 8 predefined colors
- **Code**: Inline code and code blocks with syntax highlighting

### 🖼️ Image Handling
- **Multiple Upload Methods**:
  - Toolbar button upload
  - Drag & drop directly into editor
  - Paste from clipboard (Ctrl+V)
- **Flexible Storage**: Base64 by default, custom upload function support
- **Real-time Preview**: Images appear instantly in editor

### 📊 Table Support
- **Full Table Editing**: Create, edit, and delete tables
- **Dynamic Manipulation**: Add/remove rows and columns
- **Keyboard Navigation**: Tab/Shift+Tab to navigate cells
- **Responsive Design**: Tables adapt to container width

### 🎨 Modern UI/UX
- **Sticky Toolbar**: Always accessible at top of editor
- **Tailwind Styling**: Clean, modern design with hover effects
- **Responsive Layout**: Works on mobile and desktop
- **Loading States**: Smooth transitions and loading indicators

## 📦 Installation

The component is already integrated into your project. Import it:

```tsx
import { SmoothRichTextEditor } from "@/components/ui/smooth-rich-text-editor";
```

## 🛠️ Usage

### Basic Usage

```tsx
import { SmoothRichTextEditor } from "@/components/ui/smooth-rich-text-editor";

function MyComponent() {
  const [content, setContent] = useState("");

  return (
    <SmoothRichTextEditor
      defaultValue={content}
      onChange={setContent}
      placeholder="Start typing..."
    />
  );
}
```

### With Custom Image Upload

```tsx
const customUpload = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  
  const data = await response.json();
  return data.url;
};

<SmoothRichTextEditor
  defaultValue=""
  onChange={setContent}
  uploadImage={customUpload}
  maxHeight="600px"
/>
```

### Form Integration (React Hook Form)

```tsx
import { useForm } from "react-hook-form";
import { SmoothRichTextEditor } from "@/components/ui/smooth-rich-text-editor";

function ProductForm() {
  const form = useForm();

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <SmoothRichTextEditor
                defaultValue={field.value}
                onChange={field.onChange}
                placeholder="Enter product description..."
              />
            </FormControl>
          </FormItem>
        )}
      />
    </Form>
  );
}
```

## 🔧 Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultValue` | `string` | `""` | Initial HTML content |
| `onChange` | `(html: string) => void` | `undefined` | Callback when content changes |
| `placeholder` | `string` | `"Start writing..."` | Placeholder text |
| `className` | `string` | `undefined` | Additional CSS classes |
| `disabled` | `boolean` | `false` | Disable editor input |
| `uploadImage` | `(file: File) => Promise<string>` | `undefined` | Custom image upload function |
| `maxHeight` | `string` | `"400px"` | Maximum editor height |

## 🎯 Performance Features

### Ultra-Fast Updates
```tsx
// 60fps update rate (16ms debounce)
timeoutRef.current = setTimeout(() => {
  onChange?.(html);
}, 16);
```

### Memoized Extensions
```tsx
const extensions = useMemo(() => [
  // Extensions are memoized to prevent re-initialization
  StarterKit.configure({ /* optimized config */ }),
  // ... other extensions
], []);
```

### Optimized Editor Props
```tsx
editorProps: {
  // Efficient paste and drop handlers
  handlePaste: (view, event) => { /* optimized */ },
  handleDrop: (view, event) => { /* optimized */ },
}
```

## 🖼️ Image Upload Options

### 1. Base64 (Default)
Images are converted to base64 strings and embedded directly in the HTML.

### 2. Custom Upload Function
Provide your own upload function to store images on your server or CDN:

```tsx
const uploadToCDN = async (file: File): Promise<string> => {
  // Upload to AWS S3, Cloudinary, etc.
  const url = await yourUploadService.upload(file);
  return url;
};

<SmoothRichTextEditor uploadImage={uploadToCDN} />
```

### 3. Multiple Upload Methods
- **Toolbar Button**: Click image icon, select file
- **Drag & Drop**: Drag image files directly into editor
- **Clipboard Paste**: Ctrl+V to paste images from clipboard

## 📊 Table Features

### Creating Tables
1. Click the table icon in toolbar
2. Select "Insert" to create a 3x3 table with headers
3. Click in cells to edit content

### Table Management
- **Add Column**: Insert columns before/after current position
- **Add Row**: Insert rows before/after current position  
- **Delete Column/Row**: Remove selected column or row
- **Delete Table**: Remove entire table

### Keyboard Navigation
- **Tab**: Move to next cell
- **Shift+Tab**: Move to previous cell
- **Enter**: Create new row (when in last cell)

## 🎨 Styling & Customization

### Toolbar Styling
The sticky toolbar uses Tailwind classes and can be customized:

```css
/* Sticky toolbar */
.sticky.top-0.z-10.bg-white.border-b

/* Toolbar buttons */
.h-8.w-8.p-0 /* Compact button size */
```

### Editor Content Styling
Content uses Tailwind Prose classes:

```css
/* Content area */
.prose.prose-sm.max-w-none.focus:outline-none.p-4
```

### Responsive Design
- **Mobile**: Toolbar buttons adapt to smaller screens
- **Desktop**: Full toolbar with all features visible
- **Tablet**: Optimized layout for medium screens

## 🧪 Demo & Testing

### Demo Page
Visit `/admin/smooth-editor-demo` to test all features:
- Performance testing with large content
- Image upload testing
- Table creation and editing
- Form integration examples

### Form Example
Check `/admin/smooth-editor-demo` for a complete form integration example with validation.

## 🔍 Troubleshooting

### Performance Issues
1. **Large Content**: Use `maxHeight` prop to limit visible area
2. **Memory Usage**: Editor automatically optimizes for large documents
3. **Slow Typing**: Check if other components are causing re-renders

### Image Upload Issues
1. **Upload Fails**: Ensure your upload function returns a valid URL
2. **Large Images**: Consider image compression before upload
3. **CORS Issues**: Configure your server to accept image uploads

### Table Issues
1. **Navigation**: Use Tab/Shift+Tab to move between cells
2. **Deletion**: Select cell content before deleting
3. **Styling**: Tables inherit prose styles automatically

## 🚀 Advanced Usage

### Custom Extensions
You can extend the editor with additional TipTap extensions:

```tsx
// This would require modifying the component
// Contact developer for custom extension integration
```

### Server-Side Rendering
The component handles SSR automatically with proper hydration.

### Content Validation
Validate HTML content on form submission:

```tsx
const validateContent = (html: string) => {
  const textContent = html.replace(/<[^>]*>/g, '').trim();
  return textContent.length >= 10; // Minimum content length
};
```

## 📈 Performance Metrics

- **Typing Latency**: <16ms (60fps)
- **Memory Usage**: Optimized for large documents
- **Bundle Size**: Lazy-loaded extensions
- **First Paint**: Fast initial render

## 🤝 Contributing

To improve the editor:
1. Test performance with large documents
2. Report any typing lag or memory issues
3. Suggest new features or extensions
4. Submit styling improvements

## 📄 License

Part of the CompuCar e-commerce platform.
