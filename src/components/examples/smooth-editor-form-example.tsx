"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SmoothRichTextEditor } from "@/components/ui/smooth-rich-text-editor";
import { toast } from "sonner";

// Form schema
const productFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  shortDescription: z.string().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface SmoothEditorFormExampleProps {
  onSubmit?: (data: ProductFormData) => void;
  defaultValues?: Partial<ProductFormData>;
}

export function SmoothEditorFormExample({
  onSubmit,
  defaultValues,
}: SmoothEditorFormExampleProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      shortDescription: "",
      ...defaultValues,
    },
  });

  const handleSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onSubmit) {
        onSubmit(data);
      } else {
        console.log("Form data:", data);
        toast.success("Product saved successfully!");
      }
      
      // Reset form
      form.reset();
    } catch (error) {
      toast.error("Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom upload function example
  const uploadProductImage = async (file: File): Promise<string> => {
    // Simulate upload to CDN/server
    console.log("Uploading image:", file.name);
    
    // In real implementation, upload to your storage service
    // const formData = new FormData();
    // formData.append('file', file);
    // const response = await fetch('/api/upload', { method: 'POST', body: formData });
    // const data = await response.json();
    // return data.url;
    
    // For demo, convert to base64
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Product Form with Smooth Rich Text Editor</CardTitle>
        <p className="text-sm text-muted-foreground">
          Example integration with React Hook Form and validation
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Title</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter product title"
                        onChange={(e) => {
                          field.onChange(e);
                          // Auto-generate slug
                          const slug = generateSlug(e.target.value);
                          form.setValue("slug", slug);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Slug</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="product-url-slug" />
                    </FormControl>
                    <FormDescription>
                      URL-friendly version of the title
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Short Description */}
            <FormField
              control={form.control}
              name="shortDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Brief product summary..."
                      maxLength={160}
                    />
                  </FormControl>
                  <FormDescription>
                    Brief summary for search results and cards (max 160 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rich Text Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Description</FormLabel>
                  <FormControl>
                    <SmoothRichTextEditor
                      defaultValue={field.value}
                      onChange={field.onChange}
                      placeholder="Write a detailed product description..."
                      uploadImage={uploadProductImage}
                      maxHeight="500px"
                    />
                  </FormControl>
                  <FormDescription>
                    Rich text description with images, tables, and formatting.
                    Try dragging images directly into the editor!
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex items-center space-x-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-32"
              >
                {isSubmitting ? "Saving..." : "Save Product"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isSubmitting}
              >
                Reset Form
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  const data = form.getValues();
                  console.log("Current form data:", data);
                  toast.info("Form data logged to console");
                }}
              >
                Debug Form
              </Button>
            </div>

            {/* Form State Display */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Form State</h4>
              <div className="text-xs space-y-1">
                <div>
                  <strong>Valid:</strong> {form.formState.isValid ? "✅" : "❌"}
                </div>
                <div>
                  <strong>Dirty:</strong> {form.formState.isDirty ? "✅" : "❌"}
                </div>
                <div>
                  <strong>Errors:</strong> {Object.keys(form.formState.errors).length}
                </div>
                {Object.keys(form.formState.errors).length > 0 && (
                  <div className="mt-2">
                    <strong>Error Details:</strong>
                    <pre className="text-red-600 mt-1">
                      {JSON.stringify(form.formState.errors, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
