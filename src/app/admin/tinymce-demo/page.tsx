"use client";

import { useState } from "react";
import { TinyMCEEditor } from "@/components/ui/tinymce-editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function TinyMCEDemoPage() {
  const [content, setContent] = useState(`
    <h1>Welcome to TinyMCE Editor</h1>
    <p>This is a demonstration of the TinyMCE rich text editor integrated into your CompuCar e-commerce platform.</p>
    
    <h2>Key Features</h2>
    <ul>
      <li><strong>Rich Text Formatting:</strong> Bold, italic, underline, and more</li>
      <li><strong>Advanced Styling:</strong> Headers, lists, tables, and colors</li>
      <li><strong>Media Support:</strong> Images, videos, and file uploads</li>
      <li><strong>Code Support:</strong> Syntax highlighting for code blocks</li>
      <li><strong>Templates:</strong> Pre-built templates for product descriptions</li>
    </ul>
    
    <h3>Sample Product Description</h3>
    <blockquote>
      <p>Try editing this content to see how the TinyMCE editor works. You can format text, add images, create tables, and much more!</p>
    </blockquote>
    
    <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
      <thead>
        <tr style="background-color: #f8f9fa;">
          <th style="border: 1px solid #dee2e6; padding: 12px;">Feature</th>
          <th style="border: 1px solid #dee2e6; padding: 12px;">Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: 1px solid #dee2e6; padding: 12px;">Toolbar</td>
          <td style="border: 1px solid #dee2e6; padding: 12px;">Comprehensive formatting options</td>
        </tr>
        <tr>
          <td style="border: 1px solid #dee2e6; padding: 12px;">Templates</td>
          <td style="border: 1px solid #dee2e6; padding: 12px;">Pre-built product description templates</td>
        </tr>
      </tbody>
    </table>
  `);

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      // Use the same upload endpoint as the rest of the app
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload/images', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || 'Upload failed');
      }

      const uploadResult = await uploadResponse.json();
      return uploadResult.url;
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
      throw error;
    }
  };

  const handleSave = () => {
    console.log("Saved content:", content);
    toast.success("Content saved successfully!");
  };

  const handleReset = () => {
    setContent("");
    toast.info("Content cleared");
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">TinyMCE Editor Demo</h1>
          <p className="text-muted-foreground">
            Test the new TinyMCE rich text editor for product descriptions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Product Description Editor</CardTitle>
            <CardDescription>
              Use the TinyMCE editor below to create rich product descriptions with advanced formatting, images, tables, and more.
              <br />
              <strong>Image Upload:</strong> Click the image icon in the toolbar, drag & drop images, or paste images directly into the editor.
              <br />
              <strong>Image Movement:</strong> Click on any image to select it, then drag to move it around. Double-click to access advanced positioning options (left, center, right, float, absolute, inline).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TinyMCEEditor
              value={content}
              onChange={setContent}
              placeholder="Start writing your product description here..."
              uploadImage={handleImageUpload}
              height={500}
            />
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleReset}>
                Clear Content
              </Button>
              <Button onClick={handleSave}>
                Save Content
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Preview</CardTitle>
            <CardDescription>
              This is how your content will be rendered (HTML output)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: content }} 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features Included</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Text Formatting</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Bold, italic, underline</li>
                  <li>• Headers (H1-H6)</li>
                  <li>• Font family & size</li>
                  <li>• Text colors & highlighting</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Content Structure</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Bullet & numbered lists</li>
                  <li>• Tables with styling</li>
                  <li>• Blockquotes</li>
                  <li>• Horizontal rules</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Image Upload & Positioning</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Click image icon in toolbar to upload</li>
                  <li>• Drag & drop images directly into editor</li>
                  <li>• Paste images from clipboard (Ctrl+V)</li>
                  <li>• Click and drag images to move them</li>
                  <li>• Double-click image → Class dropdown for positioning:</li>
                  <li>&nbsp;&nbsp;- Left/Center/Right alignment</li>
                  <li>&nbsp;&nbsp;- Float options with enhanced margins</li>
                  <li>&nbsp;&nbsp;- Absolute positioning for flexibility</li>
                  <li>&nbsp;&nbsp;- Inline positioning for text flow</li>
                  <li>• Supports JPG, PNG, GIF, WebP (max 4MB)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
