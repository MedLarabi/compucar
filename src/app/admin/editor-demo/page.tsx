"use client";

import { useState } from "react";
import { RichTextEditor } from "@/components/ui/rich-text-editor-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminHeaderLayout } from "@/components/admin";

export default function EditorDemoPage() {
  const [content, setContent] = useState(`
    <h1>Welcome to our E-commerce Store</h1>
    <p>This is a <strong>sample product description</strong> with various formatting options.</p>
    <ul>
      <li>High-quality materials</li>
      <li>Fast shipping</li>
      <li>30-day return policy</li>
    </ul>
    <p><em>Experience the difference with our premium products!</em></p>
  `);
  
  const [savedContent, setSavedContent] = useState("");

  const handleSave = () => {
    setSavedContent(content);
    alert("Content saved successfully!");
  };

  // Example custom upload function
  const handleImageUpload = async (file: File): Promise<string> => {
    // This would typically upload to your server
    // For demo purposes, we'll just return a data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  return (
    <AdminHeaderLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rich Text Editor Demo</h1>
            <p className="text-muted-foreground">
              A comprehensive rich text editor for e-commerce product descriptions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Product Description Editor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Write your product description here..."
                uploadImage={handleImageUpload}
              />
              <div className="flex gap-2">
                <Button onClick={handleSave}>
                  Save Content
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setContent("")}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Current Content:</h3>
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
                
                {savedContent && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2 text-green-800">Saved Content:</h3>
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: savedContent }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Editor Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Text Formatting</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Bold, Italic, Underline</li>
                  <li>• Font family selection</li>
                  <li>• Font size options</li>
                  <li>• Text color picker</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Structure</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Headings (H1, H2)</li>
                  <li>• Bulleted lists</li>
                  <li>• Numbered lists</li>
                  <li>• Text alignment</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Media & Code</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Image upload & drag-drop</li>
                  <li>• Code blocks</li>
                  <li>• Table insertion</li>
                  <li>• Inline code formatting</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Raw HTML Output */}
        <Card>
          <CardHeader>
            <CardTitle>HTML Output</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
              <code>{content}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </AdminHeaderLayout>
  );
}
