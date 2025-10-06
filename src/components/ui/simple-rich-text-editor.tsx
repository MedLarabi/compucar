"use client";

import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Link as LinkIcon,
  Type 
} from "lucide-react";

interface SimpleRichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SimpleRichTextEditor({
  content,
  onChange,
  placeholder = "Start typing...",
  className,
  disabled = false,
}: SimpleRichTextEditorProps) {
  const insertText = (beforeText: string, afterText: string = "") => {
    const textarea = document.querySelector('textarea[data-rich-text]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newText = content.substring(0, start) + beforeText + selectedText + afterText + content.substring(end);
    onChange(newText);
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      const newPosition = start + beforeText.length + selectedText.length;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  };

  const handleFormat = (format: string) => {
    switch (format) {
      case 'bold':
        insertText('**', '**');
        break;
      case 'italic':
        insertText('*', '*');
        break;
      case 'link':
        insertText('[', '](url)');
        break;
      case 'list':
        insertText('\n- ');
        break;
      case 'orderedList':
        insertText('\n1. ');
        break;
      case 'heading':
        insertText('\n## ');
        break;
    }
  };

  return (
    <Card className="w-full">
      {/* Simple Toolbar */}
      <div className="border-b border-border p-2">
        <div className="flex flex-wrap gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFormat('bold')}
            disabled={disabled}
            type="button"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFormat('italic')}
            disabled={disabled}
            type="button"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFormat('heading')}
            disabled={disabled}
            type="button"
            title="Heading"
          >
            <Type className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFormat('list')}
            disabled={disabled}
            type="button"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFormat('orderedList')}
            disabled={disabled}
            type="button"
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFormat('link')}
            disabled={disabled}
            type="button"
            title="Link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <CardContent className="p-0">
        <Textarea
          data-rich-text
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[200px] border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
        />
        
        <div className="p-2 border-t bg-muted/20 text-xs text-muted-foreground">
          <p>Markdown supported: **bold**, *italic*, ## heading, - list, 1. numbered list, [link](url)</p>
        </div>
      </CardContent>
    </Card>
  );
}
