"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Tabs removed - not needed for this demo
import { SmoothRichTextEditor } from "@/components/ui/smooth-rich-text-editor";
import { AdminHeaderLayout } from "@/components/admin";
import { Save, Eye, Download, Upload } from "lucide-react";
import { toast } from "sonner";

export default function SmoothEditorDemoPage() {
  const [content, setContent] = useState(`
    <h1>Welcome to SmoothRichTextEditor</h1>
    <p>This is a high-performance rich text editor built with TipTap and optimized for smooth typing experience.</p>
    
    <h2>Key Features:</h2>
    <ul>
      <li><strong>Ultra-fast typing</strong> - 60fps update rate for smooth experience</li>
      <li><strong>Image support</strong> - Drag & drop, paste from clipboard, or upload</li>
      <li><strong>Table editing</strong> - Full table creation and editing capabilities</li>
      <li><strong>Code blocks</strong> - Syntax highlighting and formatting</li>
      <li><strong>Rich formatting</strong> - Bold, italic, underline, colors, fonts</li>
    </ul>

    <p>Try typing, pasting images, or creating tables to test the performance!</p>
  `);
  
  const [savedContent, setSavedContent] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Simulate custom upload function
  const customUploadFunction = async (file: File): Promise<string> => {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, you'd upload to your server/CDN
    // For demo, we'll still use base64 but show the process
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSave = () => {
    setSavedContent(content);
    toast.success("Content saved successfully!");
  };

  const handleExport = () => {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'editor-content.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Content exported as HTML!");
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/html') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const htmlContent = e.target?.result as string;
        setContent(htmlContent);
        toast.success("Content imported successfully!");
      };
      reader.readAsText(file);
    }
    // Reset input
    event.target.value = '';
  };

  return (
    <AdminHeaderLayout>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Performance</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">60fps updates</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {content.length} chars
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Content length</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  TipTap
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Editor engine</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Optimized
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Memory usage</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Editor */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Editor Demo</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Test all features including drag & drop images, tables, and smooth typing
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {isPreviewMode ? "Edit" : "Preview"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <div className="relative">
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                  <input
                    type="file"
                    accept=".html"
                    onChange={handleImport}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isPreviewMode ? (
              <div className="border rounded-lg p-4 min-h-96 bg-gray-50">
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            ) : (
              <SmoothRichTextEditor
                defaultValue={content}
                onChange={setContent}
                placeholder="Start typing to test the smooth editor experience..."
                uploadImage={customUploadFunction}
                maxHeight="600px"
              />
            )}
          </CardContent>
        </Card>

        {/* Features & Output */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Text Formatting</h4>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary">Bold</Badge>
                  <Badge variant="secondary">Italic</Badge>
                  <Badge variant="secondary">Underline</Badge>
                  <Badge variant="secondary">Colors</Badge>
                  <Badge variant="secondary">Fonts</Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Content Types</h4>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary">Headings</Badge>
                  <Badge variant="secondary">Lists</Badge>
                  <Badge variant="secondary">Tables</Badge>
                  <Badge variant="secondary">Code Blocks</Badge>
                  <Badge variant="secondary">Links</Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Media</h4>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary">Image Upload</Badge>
                  <Badge variant="secondary">Drag & Drop</Badge>
                  <Badge variant="secondary">Clipboard Paste</Badge>
                  <Badge variant="secondary">Base64/CDN</Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Performance</h4>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary">60fps Updates</Badge>
                  <Badge variant="secondary">Lazy Loading</Badge>
                  <Badge variant="secondary">Optimized Memory</Badge>
                  <Badge variant="secondary">Smooth Typing</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* HTML Output */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">HTML Output</CardTitle>
              <p className="text-sm text-muted-foreground">
                Live preview of the generated HTML
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                  {content}
                </pre>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                Character count: {content.length} | 
                Words: {content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How to Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Image Upload</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Click the image icon in toolbar</li>
                  <li>• Drag & drop images directly</li>
                  <li>• Copy/paste from clipboard</li>
                  <li>• Images convert to base64 or CDN</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Table Creation</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Click table icon to insert</li>
                  <li>• Add/remove rows and columns</li>
                  <li>• Navigate with tab/shift+tab</li>
                  <li>• Delete entire table</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Performance Test</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Type rapidly to test smoothness</li>
                  <li>• Paste large content blocks</li>
                  <li>• Create complex documents</li>
                  <li>• Monitor memory usage</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminHeaderLayout>
  );
}
