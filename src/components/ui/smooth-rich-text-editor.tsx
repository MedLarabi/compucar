"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Typography from "@tiptap/extension-typography";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import ListItem from "@tiptap/extension-list-item";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import Code from "@tiptap/extension-code";
import CodeBlock from "@tiptap/extension-code-block";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { FontFamily } from "@tiptap/extension-font-family";
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
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Code as CodeIcon,
  Type,
  Heading1,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Table as TableIcon,
  FileCode,
  Upload,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SmoothRichTextEditorProps {
  defaultValue?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  uploadImage?: (file: File) => Promise<string>; // Custom upload function
  maxHeight?: string;
}

// Color palette for text colors
const TEXT_COLORS = [
  "#000000", "#374151", "#DC2626", "#EA580C", 
  "#CA8A04", "#16A34A", "#2563EB", "#7C3AED"
];

// Font families
const FONT_FAMILIES = [
  { value: "Inter", label: "Inter" },
  { value: "Georgia", label: "Georgia" },
  { value: "Times New Roman", label: "Times" },
  { value: "Arial", label: "Arial" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Courier New", label: "Courier" },
];

// Font sizes
const FONT_SIZES = [
  { value: "12px", label: "Small" },
  { value: "14px", label: "Medium" },
  { value: "16px", label: "Large" },
];

export function SmoothRichTextEditor({
  defaultValue = "",
  onChange,
  placeholder = "Start writing...",
  className,
  disabled = false,
  uploadImage,
  maxHeight = "400px",
}: SmoothRichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  // Performance optimization: debounced onChange
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<string>(defaultValue);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Optimized debounced onChange with minimal delay for smooth typing
  const debouncedOnChange = useCallback(
    (html: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (html !== lastUpdateRef.current) {
        lastUpdateRef.current = html;
        
        // Ultra-fast debounce for smooth typing
        timeoutRef.current = setTimeout(() => {
          onChange?.(html);
        }, 16); // ~60fps update rate
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

  // Memoized extensions for performance
  const extensions = useMemo(() => [
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
      // Optimize for performance
      history: {
        depth: 50, // Reduced history depth
      },
    }),
    Typography,
    Underline,
    Strike,
    Code.configure({
      HTMLAttributes: {
        class: 'bg-gray-100 px-1 py-0.5 rounded text-sm font-mono',
      },
    }),
    CodeBlock.configure({
      HTMLAttributes: {
        class: 'bg-gray-100 p-4 rounded-md border font-mono text-sm',
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
    // Table extensions
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
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
  ], []);

  const editor = useEditor({
    extensions,
    content: defaultValue,
    editable: !disabled,
    immediatelyRender: false,
    autofocus: false, // Disable auto-focus to prevent conflicts
    onUpdate: ({ editor }) => {
      debouncedOnChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none p-4",
          "prose-headings:text-gray-900 prose-p:text-gray-700",
          "prose-strong:text-gray-900 prose-em:text-gray-700",
          "prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
          "prose-pre:bg-gray-100 prose-pre:border prose-pre:rounded-md",
          "cursor-text", // Ensure text cursor shows
          className
        ),
        spellcheck: "false",
        tabindex: "0", // Make focusable
      },
      handleClick: (view, pos, event) => {
        // Simple focus on click - no interference
        setTimeout(() => {
          if (!view.hasFocus()) {
            view.focus();
          }
        }, 0);
        return false;
      },
      handleKeyDown: (view, event) => {
        // Don't interfere with any key events - let TipTap handle everything
        return false;
      },
      handlePaste: (view, event) => {
        // Handle image paste from clipboard
        const items = Array.from(event.clipboardData?.items || []);
        const imageItems = items.filter(item => item.type.startsWith('image/'));
        
        if (imageItems.length > 0) {
          event.preventDefault();
          imageItems.forEach(item => {
            const file = item.getAsFile();
            if (file) {
              handleImageUpload(file);
            }
          });
          return true;
        }
        return false;
      },
      handleDrop: (view, event) => {
        // Handle image drag and drop
        const files = Array.from(event.dataTransfer?.files || []);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length > 0) {
          event.preventDefault();
          imageFiles.forEach(file => handleImageUpload(file));
          return true;
        }
        return false;
      },
    },
  }, [defaultValue, disabled, debouncedOnChange, extensions]);

  // Image upload handler
  const handleImageUpload = async (file: File) => {
    if (!editor) return;

    setIsUploading(true);
    
    try {
      let imageUrl: string;
      
      if (uploadImage) {
        // Use custom upload function
        imageUrl = await uploadImage(file);
      } else {
        // Convert to base64
        imageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      // Insert image into editor
      editor.chain().focus().setImage({ src: imageUrl }).run();
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  // File input handler
  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
    // Reset input
    event.target.value = '';
  };

  // Link handler
  const addLink = () => {
    if (linkUrl) {
      if (linkText) {
        editor?.chain().focus().insertContent(`<a href="${linkUrl}">${linkText}</a>`).run();
      } else {
        editor?.chain().focus().setLink({ href: linkUrl }).run();
      }
      setLinkUrl("");
      setLinkText("");
      setIsLinkDialogOpen(false);
    }
  };

  // Table handlers
  const insertTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const addColumnBefore = () => editor?.chain().focus().addColumnBefore().run();
  const addColumnAfter = () => editor?.chain().focus().addColumnAfter().run();
  const deleteColumn = () => editor?.chain().focus().deleteColumn().run();
  const addRowBefore = () => editor?.chain().focus().addRowBefore().run();
  const addRowAfter = () => editor?.chain().focus().addRowAfter().run();
  const deleteRow = () => editor?.chain().focus().deleteRow().run();
  const deleteTable = () => editor?.chain().focus().deleteTable().run();

  // Minimal focus handling to avoid interference with typing
  useEffect(() => {
    if (editor && isMounted && !defaultValue) {
      // Only auto-focus empty editors after a delay
      const timer = setTimeout(() => {
        if (!editor.isFocused) {
          editor.commands.focus();
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [editor, isMounted, defaultValue]);

  // Show loading state during SSR
  if (!isMounted || !editor) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="h-64 animate-pulse bg-gray-200 rounded-md" />
        </CardContent>
      </Card>
    );
  }

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

  const setFontFamily = (fontFamily: string) => {
    editor.chain().focus().setFontFamily(fontFamily).run();
  };

  const setFontSize = (fontSize: string) => {
    editor.chain().focus().setFontFamily(`font-size: ${fontSize}`).run();
  };

  return (
    <div className="w-full">
      <Card className="border-gray-200 shadow-sm">
        {/* Sticky Toolbar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-3 space-y-2 rounded-t-lg">
          {/* First Row - Text Formatting */}
          <div className="flex flex-wrap items-center gap-1">
            {/* Text Style */}
            <Select value={getCurrentHeading()} onValueChange={setHeading}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="p">Text</SelectItem>
                <SelectItem value="h1">H1</SelectItem>
                <SelectItem value="h2">H2</SelectItem>
              </SelectContent>
            </Select>

            {/* Font Family */}
            <Select onValueChange={setFontFamily}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue placeholder="Font" />
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
            <Select onValueChange={setFontSize}>
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue placeholder="Size" />
              </SelectTrigger>
              <SelectContent>
                {FONT_SIZES.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Basic Formatting */}
            <Button
              variant={editor.isActive("bold") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive("italic") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive("underline") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Text Color */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Palette className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Text Color</Label>
                  <div className="grid grid-cols-4 gap-1">
                    {TEXT_COLORS.map((color) => (
                      <button
                        key={color}
                        className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => editor.chain().focus().setColor(color).run()}
                      />
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Second Row - Lists, Alignment, and Tools */}
          <div className="flex flex-wrap items-center gap-1">
            {/* Lists */}
            <Button
              variant={editor.isActive("bulletList") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive("orderedList") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Alignment */}
            <Button
              variant={editor.isActive({ textAlign: "left" }) ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive({ textAlign: "center" }) ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive({ textAlign: "right" }) ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <AlignRight className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Code */}
            <Button
              variant={editor.isActive("code") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleCode().run()}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <CodeIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive("codeBlock") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <FileCode className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Link */}
            <Popover open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={editor.isActive("link") ? "default" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Add Link</Label>
                  <Input
                    placeholder="Link text (optional)"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="https://example.com"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Button onClick={addLink} className="w-full h-8 text-xs">
                    Add Link
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Image Upload */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={isUploading || disabled}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading || disabled}
                />
                {isUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Table */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <TableIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Table</Label>
                  <div className="grid grid-cols-2 gap-1">
                    <Button onClick={insertTable} className="h-8 text-xs">
                      Insert
                    </Button>
                    <Button onClick={addColumnAfter} className="h-8 text-xs">
                      + Column
                    </Button>
                    <Button onClick={addRowAfter} className="h-8 text-xs">
                      + Row
                    </Button>
                    <Button onClick={deleteTable} variant="destructive" className="h-8 text-xs">
                      Delete
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Undo/Redo */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo() || disabled}
              className="h-8 w-8 p-0"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo() || disabled}
              className="h-8 w-8 p-0"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Editor Content */}
        <CardContent className="p-0 relative">
          <div
            className="overflow-y-auto"
            style={{ maxHeight }}
          >
            <div 
              className="relative"
              onClick={() => {
                // Ensure editor gets focus on container click
                if (editor && !editor.isFocused) {
                  editor.commands.focus();
                }
              }}
            >
              <EditorContent
                editor={editor}
                className={cn(
                  "min-h-32 w-full border-0 focus-within:outline-none cursor-text",
                  disabled && "opacity-60 cursor-not-allowed"
                )}
              />
            </div>
          </div>
          {!editor.getHTML() && (
            <div className="absolute top-4 left-4 text-gray-400 pointer-events-none text-sm">
              {placeholder}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
