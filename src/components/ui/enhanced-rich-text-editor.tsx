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
import Strike from "@tiptap/extension-strike";
import Code from "@tiptap/extension-code";
// CodeBlock removed for better performance
// Table extensions removed for better performance
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
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
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Highlighter,
  MoreHorizontal,
  FileCode,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedRichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minimal?: boolean;
  performanceMode?: boolean; // New option for better performance
}

const HEADING_LEVELS = [
  { level: 1, icon: Heading1, label: "Heading 1" },
  { level: 2, icon: Heading2, label: "Heading 2" },
  { level: 3, icon: Heading3, label: "Heading 3" },
  { level: 4, icon: Heading4, label: "Heading 4" },
  { level: 5, icon: Heading5, label: "Heading 5" },
  { level: 6, icon: Heading6, label: "Heading 6" },
];

const TEXT_COLORS = [
  "#000000", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB",
  "#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6",
  "#8B5CF6", "#EC4899", "#F43F5E", "#06B6D4", "#84CC16",
];

const HIGHLIGHT_COLORS = [
  "#FEF3C7", "#FECACA", "#FED7D7", "#D1FAE5", "#DBEAFE",
  "#E0E7FF", "#F3E8FF", "#FCE7F3", "#FEF7CD", "#D1F2EB",
];

export function EnhancedRichTextEditor({
  content,
  onChange,
  placeholder = "Start typing...",
  className,
  disabled = false,
  minimal = false,
  performanceMode = true, // Default to performance mode
}: EnhancedRichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  
  // Debouncing setup
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<string>(content);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Debounced onChange handler - reduced debounce for better responsiveness
  const debouncedOnChange = useCallback(
    (html: string) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Only update if content actually changed
      if (html !== lastUpdateRef.current) {
        lastUpdateRef.current = html;
        
        // Set new timeout for debounced update - reduced to 50ms for smoother experience
        timeoutRef.current = setTimeout(() => {
          onChange(html);
        }, 50);
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
          levels: [1, 2, 3, 4, 5, 6],
        },
        codeBlock: false, // Disable for better performance
      }),
      Typography,
      Underline,
      Strike,
      Code.configure({
        HTMLAttributes: {
          class: 'bg-muted px-1 py-0.5 rounded text-sm font-mono',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer hover:text-primary/80",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-md border",
        },
      }),
      // Always include extensions to maintain hook order consistency
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      // Table extensions removed for better performance
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
    content,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      debouncedOnChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose max-w-none focus:outline-none min-h-[300px] p-6",
          "prose-headings:text-foreground prose-p:text-foreground",
          "prose-strong:text-foreground prose-em:text-foreground",
          "prose-blockquote:text-muted-foreground prose-blockquote:border-l-4 prose-blockquote:border-border prose-blockquote:pl-4",
          "prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
          className
        ),
        spellcheck: "false",
        tabindex: "0", // Ensure proper focus
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
  }, [content, disabled, debouncedOnChange]);

  // Show loading state during SSR and initial mount
  if (!isMounted || !editor) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="h-[300px] animate-pulse bg-muted rounded-md" />
        </CardContent>
      </Card>
    );
  }

  const getCurrentHeading = () => {
    for (let level = 1; level <= 6; level++) {
      if (editor.isActive("heading", { level })) {
        return `h${level}`;
      }
    }
    return editor.isActive("paragraph") ? "p" : "p";
  };

  const setHeading = (value: string) => {
    if (value === "p") {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = parseInt(value.replace("h", "")) as 1 | 2 | 3 | 4 | 5 | 6;
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  const addLink = () => {
    if (linkUrl) {
      if (linkText) {
        editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkText}</a>`).run();
      } else {
        editor.chain().focus().setLink({ href: linkUrl }).run();
      }
      setLinkUrl("");
      setLinkText("");
      setIsLinkDialogOpen(false);
    }
  };

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ 
        src: imageUrl, 
        alt: imageAlt || "Image" 
      }).run();
      setImageUrl("");
      setImageAlt("");
      setIsImageDialogOpen(false);
    }
  };

  // Focus handler to ensure editor is properly focused (removed unused callback)
  // Note: Focus is now handled directly in editorProps.handleClick

  // Table functionality removed for better performance

  if (minimal) {
    return (
      <Card className="w-full">
        {/* Minimal Toolbar */}
        <div className="border-b border-border p-2">
          <div className="flex flex-wrap gap-1">
            <Button
              variant={editor.isActive("bold") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={disabled}
              type="button"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive("italic") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={disabled}
              type="button"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive("bulletList") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              disabled={disabled}
              type="button"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardContent className="p-0 relative">
          <EditorContent
            editor={editor}
            className={cn(
              "min-h-[150px] w-full border-0 focus-within:outline-none cursor-text",
              disabled && "opacity-60 cursor-not-allowed"
            )}
          />
          {!content && (
            <div className="absolute top-4 left-6 text-muted-foreground pointer-events-none">
              {placeholder}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      {/* Enhanced Toolbar */}
      <div className="border-b border-border p-3 space-y-2">
        {/* First Row - Text Formatting */}
        <div className="flex flex-wrap items-center gap-1">
          {/* Text Style Selector */}
          <Select value={getCurrentHeading()} onValueChange={setHeading}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="p">Paragraph</SelectItem>
              <SelectItem value="h1">Heading 1</SelectItem>
              <SelectItem value="h2">Heading 2</SelectItem>
              <SelectItem value="h3">Heading 3</SelectItem>
              <SelectItem value="h4">Heading 4</SelectItem>
              <SelectItem value="h5">Heading 5</SelectItem>
              <SelectItem value="h6">Heading 6</SelectItem>
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-8 mx-2" />

          {/* Basic Formatting */}
          <Button
            variant={editor.isActive("bold") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={disabled}
            type="button"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("italic") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={disabled}
            type="button"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("underline") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={disabled}
            type="button"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("strike") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={disabled}
            type="button"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("code") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={disabled}
            type="button"
          >
            <CodeIcon className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-8 mx-2" />

          {/* Text Colors - Only show in non-performance mode */}
          {!performanceMode && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" type="button">
                    <Palette className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Text Color</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {TEXT_COLORS.map((color) => (
                        <button
                          key={color}
                          className="w-8 h-8 rounded border-2 border-muted hover:border-border"
                          style={{ backgroundColor: color }}
                          onClick={() => editor.chain().focus().setColor(color).run()}
                          type="button"
                        />
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" type="button">
                    <Highlighter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Highlight Color</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {HIGHLIGHT_COLORS.map((color) => (
                        <button
                          key={color}
                          className="w-8 h-8 rounded border-2 border-muted hover:border-border"
                          style={{ backgroundColor: color }}
                          onClick={() => editor.chain().focus().setHighlight({ color }).run()}
                          type="button"
                        />
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>

        {/* Second Row - Alignment and Lists */}
        <div className="flex flex-wrap items-center gap-1">
          {/* Text Alignment */}
          <Button
            variant={editor.isActive({ textAlign: "left" }) ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            disabled={disabled}
            type="button"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive({ textAlign: "center" }) ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            disabled={disabled}
            type="button"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive({ textAlign: "right" }) ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            disabled={disabled}
            type="button"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive({ textAlign: "justify" }) ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            disabled={disabled}
            type="button"
          >
            <AlignJustify className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-8 mx-2" />

          {/* Lists */}
          <Button
            variant={editor.isActive("bulletList") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={disabled}
            type="button"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("orderedList") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={disabled}
            type="button"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("blockquote") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            disabled={disabled}
            type="button"
          >
            <Quote className="h-4 w-4" />
          </Button>
          {/* CodeBlock removed for better performance */}

          <Separator orientation="vertical" className="h-8 mx-2" />

          {/* Insert Elements */}
          <Popover open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={editor.isActive("link") ? "default" : "ghost"}
                size="sm"
                type="button"
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Add Link</Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Link text (optional)"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                  />
                  <Input
                    placeholder="https://example.com"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                  />
                  <Button onClick={addLink} className="w-full" size="sm">
                    Add Link
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" type="button">
                <ImageIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Add Image</Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Image URL"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  <Input
                    placeholder="Alt text (optional)"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                  />
                  <Button onClick={addImage} className="w-full" size="sm">
                    Add Image
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-8 mx-2" />

          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo() || disabled}
            type="button"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo() || disabled}
            type="button"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <CardContent className="p-0 relative">
        <EditorContent
          editor={editor}
          className={cn(
            "min-h-[300px] w-full border-0 focus-within:outline-none cursor-text",
            disabled && "opacity-60 cursor-not-allowed"
          )}
        />
        {!content && (
          <div className="absolute top-6 left-6 text-muted-foreground pointer-events-none">
            {placeholder}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
