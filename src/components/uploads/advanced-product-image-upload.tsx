"use client";

import React, { useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadDropzone } from "@/lib/uploadthing/client";
import { 
  Trash2, 
  ImageIcon, 
  GripVertical, 
  Star, 
  Eye, 
  Plus,
  Upload,
  X
} from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  isMain?: boolean;
}

interface AdvancedProductImageUploadProps {
  onImagesChange: (images: ProductImage[]) => void;
  existingImages?: ProductImage[];
  maxImages?: number;
  disabled?: boolean;
}

export function AdvancedProductImageUpload({
  onImagesChange,
  existingImages = [],
  maxImages = 8,
  disabled = false,
}: AdvancedProductImageUploadProps) {
  const [images, setImages] = useState<ProductImage[]>(
    existingImages.map((img, index) => ({
      ...img,
      id: img.id || `image-${index}`,
      isMain: index === 0,
    }))
  );
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const updateImages = useCallback((newImages: ProductImage[]) => {
    setImages(newImages);
    onImagesChange(newImages);
  }, [onImagesChange]);

  const handleUploadComplete = (res: any) => {
    const newImages = res.map((file: any, index: number) => ({
      id: `uploaded-${Date.now()}-${index}`,
      url: file.url,
      alt: file.name || "Product image",
      isMain: images.length === 0 && index === 0,
    }));
    
    const updatedImages = [...images, ...newImages].slice(0, maxImages);
    updateImages(updatedImages);
    setIsUploading(false);
  };

  const handleUploadError = (error: Error) => {
    console.error("Upload error:", error);
    setIsUploading(false);
  };

  const removeImage = (imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    // If we removed the main image, make the first remaining image the main one
    if (updatedImages.length > 0) {
      const hasMain = updatedImages.some(img => img.isMain);
      if (!hasMain) {
        updatedImages[0].isMain = true;
      }
    }
    updateImages(updatedImages);
  };

  const setMainImage = (imageId: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      isMain: img.id === imageId,
    }));
    updateImages(updatedImages);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedImages = Array.from(images);
    const [removed] = reorderedImages.splice(result.source.index, 1);
    reorderedImages.splice(result.destination.index, 0, removed);

    // Ensure first image is marked as main
    const updatedImages = reorderedImages.map((img, index) => ({
      ...img,
      isMain: index === 0,
    }));

    updateImages(updatedImages);
  };

  const updateImageAlt = (imageId: string, alt: string) => {
    const updatedImages = images.map(img =>
      img.id === imageId ? { ...img, alt } : img
    );
    updateImages(updatedImages);
  };

  const canUploadMore = images.length < maxImages && !disabled;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Product Images ({images.length}/{maxImages})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Add high-quality images of your product. The first image will be the main product image.
            Drag and drop to reorder.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Grid */}
          {images.length > 0 && (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="images" direction="horizontal">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 rounded-lg border-2 border-dashed transition-colors",
                      snapshot.isDraggingOver ? "border-primary bg-primary/5" : "border-muted"
                    )}
                  >
                    {images.map((image, index) => (
                      <Draggable
                        key={image.id}
                        draggableId={image.id}
                        index={index}
                        isDragDisabled={disabled}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "relative group aspect-square rounded-lg overflow-hidden border-2 transition-all",
                              snapshot.isDragging ? "rotate-3 shadow-lg scale-105" : "shadow-sm",
                              image.isMain ? "border-primary ring-2 ring-primary/20" : "border-border"
                            )}
                          >
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                            >
                              <div className="bg-black/50 text-white p-1 rounded">
                                <GripVertical className="h-3 w-3" />
                              </div>
                            </div>

                            {/* Main Image Badge */}
                            {image.isMain && (
                              <Badge className="absolute top-2 right-2 z-10 bg-primary">
                                <Star className="h-3 w-3 mr-1" />
                                Main
                              </Badge>
                            )}

                            {/* Image */}
                            <Image
                              src={image.url}
                              alt={image.alt || "Product image"}
                              fill
                              className="object-cover"
                              onError={() => {
                                console.error(`Failed to load image: ${image.url}`);
                              }}
                            />

                            {/* Overlay Actions */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setPreviewImage(image.url)}
                                className="h-8 w-8 p-0"
                                type="button"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              {!image.isMain && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setMainImage(image.id)}
                                  className="h-8 w-8 p-0"
                                  type="button"
                                >
                                  <Star className="h-4 w-4" />
                                </Button>
                              )}
                              
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeImage(image.id)}
                                className="h-8 w-8 p-0"
                                disabled={disabled}
                                type="button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Order indicator */}
                            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                              {index + 1}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}

          {/* Upload Area */}
          {canUploadMore && (
            <div className="space-y-4">
              <UploadDropzone
                endpoint="productImageUploader"
                onClientUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                onUploadBegin={() => setIsUploading(true)}
                config={{ mode: "auto" }}
                appearance={{
                  container: cn(
                    "border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 transition-colors",
                    "hover:border-primary/50 focus:border-primary"
                  ),
                  uploadIcon: "text-muted-foreground",
                  label: "text-muted-foreground font-medium",
                  allowedContent: "text-muted-foreground/70 text-sm",
                  button: "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
                }}
                content={{
                  label: `Upload product images (${images.length}/${maxImages})`,
                  allowedContent: "Images up to 4MB each",
                  button: isUploading ? "Uploading..." : "Choose files",
                }}
              />
              
              <div className="text-center text-sm text-muted-foreground">
                <p>Drag files here or click to browse</p>
                <p className="mt-1">Supported formats: JPEG, PNG, WebP (max 4MB each)</p>
              </div>
            </div>
          )}

          {/* No Upload Available */}
          {!canUploadMore && (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Maximum images reached</p>
              <p className="text-sm">Remove some images to upload more</p>
            </div>
          )}

          {/* Upload Status */}
          {isUploading && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 text-primary">
                <Upload className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-medium">Uploading images...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-4 right-4 z-10"
              onClick={() => setPreviewImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            <Image
              src={previewImage}
              alt="Preview"
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
