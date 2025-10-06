"use client";

import React, { useRef, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TinyMCEEditorProps {
  value?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  uploadImage?: (file: File) => Promise<string>;
  height?: number;
}

export function TinyMCEEditor({
  value = "",
  onChange,
  placeholder = "Write your product description here...",
  className,
  disabled = false,
  uploadImage,
  height = 400,
}: TinyMCEEditorProps) {
  const editorRef = useRef<any>(null);

  // Handle image upload
  const handleImageUpload = async (blobInfo: any, progress: (percent: number) => void): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const file = blobInfo.blob();
        
        // Show upload progress
        toast.info('Uploading image...', { duration: 1000 });
        
        if (uploadImage) {
          // Use custom upload function if provided
          const imageUrl = await uploadImage(file);
          toast.success('Image uploaded successfully!');
          resolve(imageUrl);
        } else {
          // Use the existing /api/upload/images endpoint
          const formData = new FormData();
          formData.append('file', file);

          const uploadResponse = await fetch('/api/upload/images', {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            const errorMessage = error.error || 'Unknown error';
            toast.error(`Upload failed: ${errorMessage}`);
            reject(`Upload failed: ${errorMessage}`);
            return;
          }

          const uploadResult = await uploadResponse.json();
          toast.success('Image uploaded successfully!');
          resolve(uploadResult.url);
        }
      } catch (error) {
        console.error('Image upload error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Image upload failed: ${errorMessage}`);
        reject('Image upload failed: ' + errorMessage);
      }
    });
  };

  return (
    <Card className={cn("w-full overflow-hidden", className)}>
      <div className="relative">
        <Editor
          ref={editorRef}
          tinymceScriptSrc="/tinymce/tinymce.min.js"
          value={value}
          onEditorChange={(content: string) => {
            onChange?.(content);
          }}
          init={{
            height,
            menubar: false,
            license_key: 'gpl',
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons',
              'codesample', 'pagebreak', 'nonbreaking', 'quickbars'
            ],
            toolbar1: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | align numlist bullist | link image media table | forecolor backcolor removeformat',
            toolbar2: 'outdent indent | superscript subscript | blockquote | fullscreen preview code | emoticons charmap | codesample',
            quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
            quickbars_insert_toolbar: 'quickimage quicktable',
            contextmenu: 'link image table',
            
            // Ensure editor is editable
            // readonly: disabled, // Removed - handled by disabled prop
            editable_root: true,
            
            // Content styling
            content_style: `
              body { 
                font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
                font-size: 14px; 
                line-height: 1.6;
                color: #374151;
                background-color: #ffffff;
                margin: 1rem;
              }
              h1, h2, h3, h4, h5, h6 { 
                color: #111827; 
                font-weight: 600;
                margin-top: 1.5em;
                margin-bottom: 0.5em;
              }
              h1 { font-size: 2em; }
              h2 { font-size: 1.5em; }
              h3 { font-size: 1.25em; }
              p { margin-bottom: 1em; }
              ul, ol { margin: 1em 0; padding-left: 2em; }
              li { margin-bottom: 0.5em; }
              blockquote { 
                border-left: 4px solid #e5e7eb; 
                margin: 1em 0; 
                padding-left: 1em; 
                color: #6b7280;
                font-style: italic;
              }
              code { 
                background-color: #f3f4f6; 
                padding: 0.2em 0.4em; 
                border-radius: 0.25em; 
                font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
                font-size: 0.9em;
              }
              pre { 
                background-color: #f3f4f6; 
                padding: 1em; 
                border-radius: 0.5em; 
                overflow-x: auto;
                border: 1px solid #e5e7eb;
              }
              table { 
                border-collapse: collapse; 
                width: 100%; 
                margin: 1em 0;
              }
              table td, table th { 
                border: 1px solid #e5e7eb; 
                padding: 0.5em; 
              }
              table th { 
                background-color: #f9fafb; 
                font-weight: 600;
              }
              img { 
                max-width: 100%; 
                height: auto; 
                border-radius: 0.5em;
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
                cursor: move;
                transition: all 0.2s ease;
              }
              img:hover {
                box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
              }
              img.image-left {
                float: left;
                margin: 0 1em 1em 0;
              }
              img.image-right {
                float: right;
                margin: 0 0 1em 1em;
              }
              img.image-center {
                display: block;
                margin: 1em auto;
                float: none;
              }
              img.img-responsive {
                width: 100%;
                height: auto;
              }
              img.image-float-left {
                float: left;
                margin: 0.5em 1.5em 1.5em 0;
                clear: left;
              }
              img.image-float-right {
                float: right;
                margin: 0.5em 0 1.5em 1.5em;
                clear: right;
              }
              img.image-absolute {
                position: relative;
                z-index: 1;
                margin: 1em;
                cursor: move;
              }
              img.image-inline {
                display: inline;
                vertical-align: middle;
                margin: 0 0.5em;
              }
              .mce-object-selected {
                outline: 2px solid #2563eb !important;
                outline-offset: 2px;
              }
              a { 
                color: #2563eb; 
                text-decoration: underline;
              }
              a:hover { 
                color: #1d4ed8; 
              }
              hr {
                border: none;
                border-top: 2px solid #e5e7eb;
                margin: 2em 0;
              }
            `,
            
            // Advanced features
            block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6; Preformatted=pre',
            font_family_formats: 'Inter=Inter, sans-serif; Arial=arial, helvetica, sans-serif; Georgia=georgia, serif; Times New Roman=times new roman, times, serif; Courier New=courier new, courier, monospace; Verdana=verdana, geneva, sans-serif',
            font_size_formats: '8pt 10pt 12pt 14pt 16pt 18pt 24pt 36pt 48pt',
            
            // Image handling
            images_upload_handler: handleImageUpload,
            // images_upload_url: false, // Removed - not needed with custom handler
            automatic_uploads: true,
            images_reuse_filename: true,
            paste_data_images: true,
            images_file_types: 'jpg,jpeg,png,gif,webp',
            file_picker_types: 'image',
            
            // Enhanced image dialog
            image_advtab: true,
            image_caption: true,
            image_description: false,
            image_dimensions: false,
            image_title: true,
            
            // Enable drag and drop for images
            draggable_modal: false,
            object_resizing: true,
            
            // Image alignment and positioning
            image_class_list: [
              { title: 'None', value: '' },
              { title: 'Left aligned', value: 'image-left' },
              { title: 'Center aligned', value: 'image-center' },
              { title: 'Right aligned', value: 'image-right' },
              { title: 'Responsive', value: 'img-responsive' },
              { title: 'Float left with margin', value: 'image-float-left' },
              { title: 'Float right with margin', value: 'image-float-right' },
              { title: 'Absolute positioned', value: 'image-absolute' },
              { title: 'Inline with text', value: 'image-inline' }
            ],
            
            // Table options
            table_default_attributes: {
              class: 'table-auto border-collapse border border-gray-300'
            },
            table_default_styles: {
              'border-collapse': 'collapse',
              'width': '100%'
            },
            
            // Link options
            link_default_target: '_blank',
            link_default_protocol: 'https',
            
            // Code sample
            codesample_languages: [
              { text: 'HTML/XML', value: 'markup' },
              { text: 'JavaScript', value: 'javascript' },
              { text: 'TypeScript', value: 'typescript' },
              { text: 'CSS', value: 'css' },
              { text: 'PHP', value: 'php' },
              { text: 'Python', value: 'python' },
              { text: 'Java', value: 'java' },
              { text: 'C#', value: 'csharp' },
              { text: 'C++', value: 'cpp' },
              { text: 'SQL', value: 'sql' },
              { text: 'JSON', value: 'json' }
            ],
            
            // Placeholder
            placeholder,
            
            // Disable branding
            branding: false,
            
            // Advanced options
            elementpath: false,
            resize: true,
            statusbar: true,
            
            // Accessibility
            a11y_advanced_options: true,
            
            // Performance
            convert_urls: false,
            
            // Setup function
            setup: (editor: any) => {
              // Ensure editor is not readonly unless explicitly disabled
              editor.on('init', () => {
                if (!disabled) {
                  // Force editable state
                  const body = editor.getBody();
                  if (body) {
                    body.setAttribute('contenteditable', 'true');
                    body.style.cursor = 'text';
                  }
                }
              });
              
              // Add custom button for clearing formatting
              editor.ui.registry.addButton('clearformat', {
                text: 'Clear Format',
                tooltip: 'Clear all formatting',
                onAction: () => {
                  editor.execCommand('RemoveFormat');
                }
              });

              // Additional check to ensure editor is editable
              editor.on('PostRender', () => {
                if (!disabled) {
                  const body = editor.getBody();
                  if (body) {
                    body.setAttribute('contenteditable', 'true');
                    body.style.cursor = 'text';
                  }
                }
              });
            }
          }}
          disabled={disabled}
        />
      </div>
    </Card>
  );
}
