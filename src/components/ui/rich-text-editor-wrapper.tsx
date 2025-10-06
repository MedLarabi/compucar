"use client";

import dynamic from "next/dynamic";
import { SimpleRichTextEditor } from "./simple-rich-text-editor";
import { Card, CardContent } from "@/components/ui/card";

// Dynamically import the enhanced rich text editor to avoid SSR issues
const EnhancedRichTextEditor = dynamic(() => import("./enhanced-rich-text-editor").then(mod => ({ default: mod.EnhancedRichTextEditor })), {
  ssr: false,
  loading: () => (
    <Card className="w-full">
      <div className="border-b border-border p-2">
        <div className="flex flex-wrap gap-1">
          {/* Toolbar skeleton */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-8 w-8 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
      <CardContent className="p-0">
        <div className="min-h-[200px] p-4 space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
        </div>
      </CardContent>
    </Card>
  ),
});

interface RichTextEditorWrapperProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minimal?: boolean;
  performanceMode?: boolean;
}

export function RichTextEditorWrapper(props: RichTextEditorWrapperProps) {
  // For maximum compatibility, you can switch between editors here
  const USE_SIMPLE_EDITOR = false; // Set to true if TipTap issues persist
  
  if (USE_SIMPLE_EDITOR) {
    return <SimpleRichTextEditor {...props} />;
  }
  
  return <EnhancedRichTextEditor {...props} performanceMode={props.performanceMode ?? true} />;
}
