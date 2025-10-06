"use client";

import React, { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BlogTinyMCEEditorProps {
  value?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  uploadImage?: (file: File) => Promise<string>;
  height?: number;
}

export function BlogTinyMCEEditor({
  value = "",
  onChange,
  placeholder = "Write your blog article here...",
  className,
  disabled = false,
  uploadImage,
  height = 500,
}: BlogTinyMCEEditorProps) {
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
            
            // Blog-optimized plugins
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons',
              'codesample', 'pagebreak', 'nonbreaking', 'quickbars', 'autoresize'
            ],
            
            // Blog-focused toolbar
            toolbar1: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor | removeformat',
            toolbar2: 'align numlist bullist outdent indent | link image media table | blockquote hr pagebreak | codesample emoticons charmap',
            toolbar3: 'searchreplace visualblocks code fullscreen preview | help wordcount',
            
            // Quick toolbars for better UX
            quickbars_selection_toolbar: 'bold italic underline | quicklink h2 h3 blockquote',
            quickbars_insert_toolbar: 'quickimage quicktable hr',
            contextmenu: 'link image table configurepermanentpen',
            
            // Blog-specific content styling
            content_style: `
              body { 
                font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
                font-size: 16px; 
                line-height: 1.7;
                color: #374151;
                background-color: #ffffff;
                margin: 1.5rem;
                max-width: none;
              }
              
              /* Blog-specific heading styles */
              h1, h2, h3, h4, h5, h6 { 
                color: #111827; 
                font-weight: 700;
                margin-top: 2em;
                margin-bottom: 0.75em;
                line-height: 1.3;
              }
              h1 { font-size: 2.5em; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5em; }
              h2 { font-size: 2em; }
              h3 { font-size: 1.5em; }
              h4 { font-size: 1.25em; }
              h5 { font-size: 1.125em; }
              h6 { font-size: 1em; font-weight: 600; }
              
              /* Blog paragraph styling */
              p { 
                margin-bottom: 1.25em; 
                font-size: 16px;
                line-height: 1.7;
              }
              
              /* Enhanced lists */
              ul, ol { 
                margin: 1.25em 0; 
                padding-left: 2.5em; 
              }
              li { 
                margin-bottom: 0.75em; 
                line-height: 1.6;
              }
              
              /* Blog-style blockquotes */
              blockquote { 
                border-left: 4px solid #3b82f6; 
                margin: 2em 0; 
                padding: 1.5em 2em; 
                color: #4b5563;
                font-style: italic;
                background-color: #f8fafc;
                border-radius: 0 8px 8px 0;
                font-size: 1.1em;
              }
              blockquote p {
                margin-bottom: 0;
              }
              
              /* Code styling for blogs */
              code { 
                background-color: #f1f5f9; 
                padding: 0.25em 0.5em; 
                border-radius: 4px; 
                font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
                font-size: 0.875em;
                color: #dc2626;
                border: 1px solid #e2e8f0;
              }
              
              pre { 
                background-color: #1e293b; 
                color: #e2e8f0;
                padding: 1.5em; 
                border-radius: 8px; 
                overflow-x: auto;
                margin: 1.5em 0;
                border: 1px solid #334155;
              }
              pre code {
                background: none;
                border: none;
                padding: 0;
                color: inherit;
                font-size: 0.875em;
              }
              
              /* Blog table styling */
              table { 
                border-collapse: collapse; 
                width: 100%; 
                margin: 2em 0;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
              }
              table td, table th { 
                border: 1px solid #e5e7eb; 
                padding: 0.75em 1em; 
                text-align: left;
              }
              table th { 
                background-color: #f9fafb; 
                font-weight: 600;
                color: #374151;
              }
              table tr:nth-child(even) {
                background-color: #f9fafb;
              }
              
              /* Enhanced image styling for blogs */
              img { 
                max-width: 100%; 
                height: auto; 
                border-radius: 8px;
                box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.1);
                margin: 1.5em auto;
                display: block;
              }
              
              /* Image alignment classes */
              img.image-left {
                float: left;
                margin: 0 2em 1.5em 0;
                max-width: 300px;
              }
              img.image-right {
                float: right;
                margin: 0 0 1.5em 2em;
                max-width: 300px;
              }
              img.image-center {
                display: block;
                margin: 2em auto;
                float: none;
              }
              
              /* Links styling */
              a { 
                color: #3b82f6; 
                text-decoration: underline;
                text-decoration-color: #93c5fd;
                text-underline-offset: 2px;
              }
              a:hover { 
                color: #1d4ed8; 
                text-decoration-color: #3b82f6;
              }
              
              /* Horizontal rule */
              hr {
                border: none;
                border-top: 2px solid #e5e7eb;
                margin: 3em 0;
                width: 50%;
                margin-left: auto;
                margin-right: auto;
              }
              
              /* Highlight/mark styling */
              mark {
                background-color: #fef3c7;
                padding: 0.125em 0.25em;
                border-radius: 3px;
              }
            `,
            
            // Blog-optimized block formats
            block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6; Preformatted=pre; Blockquote=blockquote',
            
            // Enhanced font options for blogs
            font_family_formats: 'Inter=Inter, sans-serif; Georgia=georgia, serif; Times New Roman=times new roman, times, serif; Arial=arial, helvetica, sans-serif; Helvetica=helvetica, arial, sans-serif; Courier New=courier new, courier, monospace; Verdana=verdana, geneva, sans-serif',
            font_size_formats: '12px 14px 16px 18px 20px 24px 28px 32px 36px 48px',
            
            // Image handling
            images_upload_handler: handleImageUpload,
            automatic_uploads: true,
            images_reuse_filename: true,
            paste_data_images: true,
            images_file_types: 'jpg,jpeg,png,gif,webp,svg',
            file_picker_types: 'image',
            
            // Enhanced image dialog for blogs
            image_advtab: true,
            image_caption: true,
            image_description: true,
            image_dimensions: true,
            image_title: true,
            
            // Image alignment options
            image_class_list: [
              { title: 'None', value: '' },
              { title: 'Left aligned', value: 'image-left' },
              { title: 'Center aligned', value: 'image-center' },
              { title: 'Right aligned', value: 'image-right' },
              { title: 'Responsive', value: 'img-responsive' }
            ],
            
            // Table options optimized for blog content
            table_default_attributes: {
              class: 'blog-table'
            },
            table_default_styles: {
              'border-collapse': 'collapse',
              'width': '100%'
            },
            
            // Link options
            link_default_target: '_blank',
            link_default_protocol: 'https',
            link_title: true,
            
            // Code sample languages for blogs
            codesample_languages: [
              { text: 'HTML/XML', value: 'markup' },
              { text: 'JavaScript', value: 'javascript' },
              { text: 'TypeScript', value: 'typescript' },
              { text: 'CSS', value: 'css' },
              { text: 'SCSS', value: 'scss' },
              { text: 'PHP', value: 'php' },
              { text: 'Python', value: 'python' },
              { text: 'Java', value: 'java' },
              { text: 'C#', value: 'csharp' },
              { text: 'C++', value: 'cpp' },
              { text: 'SQL', value: 'sql' },
              { text: 'JSON', value: 'json' },
              { text: 'Bash', value: 'bash' },
              { text: 'Markdown', value: 'markdown' }
            ],
            
            // Placeholder
            placeholder,
            
            // Disable branding
            branding: false,
            
            // Blog-optimized options
            elementpath: false,
            resize: true,
            statusbar: true,
            autoresize_bottom_margin: 50,
            autoresize_max_height: 800,
            
            // Accessibility
            a11y_advanced_options: true,
            
            // Performance
            convert_urls: false,
            
            // Word count for blog writing
            wordcount_countregex: /[\w\u2019\'-]+/g,
            
            // Setup function
            setup: (editor: any) => {
              // Custom blog-specific buttons
              editor.ui.registry.addButton('readmore', {
                text: 'Read More',
                tooltip: 'Insert read more separator',
                onAction: () => {
                  editor.insertContent('<!--more-->');
                }
              });

              // Add custom blog formatting button
              editor.ui.registry.addButton('blogquote', {
                text: 'Quote',
                tooltip: 'Insert styled quote block',
                onAction: () => {
                  const selection = editor.selection.getContent();
                  const content = selection || 'Enter your quote here...';
                  editor.insertContent(`<blockquote><p>${content}</p></blockquote>`);
                }
              });

              // Ensure editor is editable
              editor.on('init', () => {
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
