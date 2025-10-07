"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Typography from "@tiptap/extension-typography";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import ListItem from "@tiptap/extension-list-item";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Code from "@tiptap/extension-code";
import CodeBlock from "@tiptap/extension-code-block";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Type,
  Palette,
  Upload,
  Code as CodeIcon,
  FileCode,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table as TableIcon,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  uploadImage?: (file: File) => Promise<string>; // Custom upload function
}

// Font families available
const FONT_FAMILIES = [
  { value: "Inter", label: "Inter (Default)" },
  { value: "Georgia", label: "Georgia" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Arial", label: "Arial" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Courier New", label: "Courier New" },
];

// Font sizes
const FONT_SIZES = [
  { value: "12px", label: "Small" },
  { value: "16px", label: "Medium" },
  { value: "20px", label: "Large" },
  { value: "24px", label: "Extra Large" },
];

// Color palette
const COLORS = [
  "#000000", // Black
  "#374151", // Gray-700
  "#DC2626", // Red-600
  "#2563EB", // Blue-600
  "#059669", // Green-600
  "#7C3AED", // Purple-600
];

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Write your product description here...",
  className,
  disabled = false,
  uploadImage,
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Debouncing setup for better performance
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<string>(value);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Debounced onChange handler - reduced debounce for better responsiveness
  const debouncedOnChange = useCallback(
    (html: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (html !== lastUpdateRef.current) {
        lastUpdateRef.current = html;
        timeoutRef.current = setTimeout(() => {
          onChange?.(html);
        }, 50); // Reduced to 50ms for smoother experience
      }
    },
    [onChange]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const editor = useEditor({
    autofocus: false, // Prevent auto-focus conflicts
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        heading: {
          levels: [1, 2],
        },
        // Make sure delete key functionality is not disabled
        gapcursor: false,
      }),
      Typography,
      Underline,
      Code.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 px-1 py-0.5 rounded text-sm font-mono',
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 rounded-md p-4 font-mono text-sm border',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer hover:text-blue-800",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-md border",
        },
      }),
      TextStyle,
      Color,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      ListItem,
      BulletList.configure({
        HTMLAttributes: {
          class: "list-disc list-inside space-y-1",
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: "list-decimal list-inside space-y-1",
        },
      }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      debouncedOnChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose max-w-none focus:outline-none min-h-[300px] p-4",
          "prose-headings:text-gray-900 prose-p:text-gray-700",
          "prose-strong:text-gray-900 prose-em:text-gray-700",
          "prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
          "prose-pre:bg-gray-100 prose-pre:border prose-pre:rounded-md",
          className
        ),
        spellcheck: "false",
        tabindex: "0", // Ensure proper focus
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files || []);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length > 0) {
          event.preventDefault();
          imageFiles.forEach(file => handleImageUpload(file));
          return true;
        }
        return false;
      },
      handleKeyDown: (view, event) => {
        // Ensure delete and backspace work properly
        if (event.key === 'Delete' || event.key === 'Backspace') {
          // Let the editor handle these keys naturally
          return false;
        }
        return false;
      },
      handleClick: (view, pos, event) => {
        // Ensure the editor stays focused on clicks
        if (!view.hasFocus()) {
          view.focus();
        }
        return false;
      },
    },
  }, [value, disabled, debouncedOnChange]);

  // Show loading state during SSR and initial mount
  if (!isMounted || !editor) {
    return (
      <Card className="w-full">
        <div className="border-b border-gray-200 p-3">
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
        <CardContent className="p-0">
          <div className="min-h-[300px] p-4 space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper functions
  const getCurrentFontFamily = () => {
    const currentFontFamily = editor.getAttributes('textStyle')?.fontFamily;
    return currentFontFamily || 'Inter';
  };

  const getCurrentFontSize = () => {
    const currentFontSize = editor.getAttributes('textStyle')?.fontSize;
    return currentFontSize || '16px';
  };

  const setFontFamily = (fontFamily: string) => {
    editor.chain().focus().setFontFamily(fontFamily).run();
  };

  const setFontSize = (fontSize: string) => {
    editor.chain().focus().setMark('textStyle', { fontSize }).run();
  };

  const getCurrentHeading = () => {
    if (editor.isActive("heading", { level: 1 })) return "h1";
    if (editor.isActive("heading", { level: 2 })) return "h2";
    return "p";
  };

  const setHeading = (value: string) => {
    if (value === "p") {
      editor.chain().focus().setParagraph().run();
    } else if (value === "h1") {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    } else if (value === "h2") {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    }
  };

  // Focus handler to ensure editor is properly focused (removed unused callback)
  // Note: Focus is now handled directly in editorProps.handleClick

  // Image upload handler
  const handleImageUpload = async (file: File) => {
    try {
      let imageUrl: string;

      if (uploadImage) {
        // Use custom upload function
        imageUrl = await uploadImage(file);
      } else {
        // Convert to base64
        imageUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      // Insert image into editor
      editor.chain().focus().setImage({ src: imageUrl }).run();
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
    // Reset input
    event.target.value = '';
  };

  // Insert table (simple implementation)
  const insertTable = () => {
    const tableHTML = `
      <table class="border-collapse border border-gray-300 w-full my-4">
        <tr>
          <td class="border border-gray-300 p-2">Cell 1</td>
          <td class="border border-gray-300 p-2">Cell 2</td>
          <td class="border border-gray-300 p-2">Cell 3</td>
        </tr>
        <tr>
          <td class="border border-gray-300 p-2">Cell 4</td>
          <td class="border border-gray-300 p-2">Cell 5</td>
          <td class="border border-gray-300 p-2">Cell 6</td>
        </tr>
      </table>
    `;
    editor.chain().focus().insertContent(tableHTML).run();
  };

  return (
    <Card className="w-full">
      {/* Sticky Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-3 space-y-3">
        {/* First Row - Text Formatting & Typography */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Heading Selector */}
          <Select value={getCurrentHeading()} onValueChange={setHeading}>
            <SelectTrigger className="w-24 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="p">Normal</SelectItem>
              <SelectItem value="h1">H1</SelectItem>
              <SelectItem value="h2">H2</SelectItem>
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-8" />

          {/* Font Family */}
          <Select value={getCurrentFontFamily()} onValueChange={setFontFamily}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Font Size */}
          <Select value={getCurrentFontSize()} onValueChange={setFontSize}>
            <SelectTrigger className="w-24 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-8" />

          {/* Basic Formatting */}
          <Button
            variant={editor.isActive("bold") ? "default" : "outline"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={disabled}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("italic") ? "default" : "outline"}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={disabled}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("underline") ? "default" : "outline"}
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={disabled}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("code") ? "default" : "outline"}
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={disabled}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <CodeIcon className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-8" />

          {/* Text Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-2">
                <div className="text-sm font-medium">Text Color</div>
                <div className="grid grid-cols-3 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                      style={{ backgroundColor: color }}
                      onClick={() => editor.chain().focus().setColor(color).run()}
                      type="button"
                    />
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Second Row - Lists, Alignment, and Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Lists */}
          <Button
            variant={editor.isActive("bulletList") ? "default" : "outline"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={disabled}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("orderedList") ? "default" : "outline"}
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={disabled}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-8" />

          {/* Text Alignment */}
          <Button
            variant={editor.isActive({ textAlign: "left" }) ? "default" : "outline"}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            disabled={disabled}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive({ textAlign: "center" }) ? "default" : "outline"}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            disabled={disabled}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive({ textAlign: "right" }) ? "default" : "outline"}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            disabled={disabled}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <AlignRight className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-8" />

          {/* Code Block */}
          <Button
            variant={editor.isActive("codeBlock") ? "default" : "outline"}
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            disabled={disabled}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <FileCode className="h-4 w-4" />
          </Button>

          {/* Image Upload */}
          <Button
            variant="outline"
            size="sm"
            onClick={triggerImageUpload}
            disabled={disabled}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>

          {/* Table Insert */}
          <Button
            variant="outline"
            size="sm"
            onClick={insertTable}
            disabled={disabled}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <TableIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Editor Content */}
      <CardContent className="p-0 relative">
        <EditorContent
          editor={editor}
          className={cn(
            "min-h-[300px] w-full border-0 focus-within:outline-none cursor-text",
            disabled && "opacity-60 cursor-not-allowed"
          )}
        />
        {!value && (
          <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
            {placeholder}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
