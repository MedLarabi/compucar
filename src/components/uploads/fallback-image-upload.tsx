"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Upload, Image as ImageIcon, Star, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface ImageData {
  id: string;
  url: string;
  alt: string;
  isMain: boolean;
}

interface FallbackImageUploadProps {
  onImagesChange: (images: ImageData[]) => void;
  existingImages?: ImageData[];
  maxImages?: number;
}

export function FallbackImageUpload({
  onImagesChange,
  existingImages = [],
  maxImages = 8,
}: FallbackImageUploadProps) {
  const [images, setImages] = useState<ImageData[]>(existingImages);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    const newImages: ImageData[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not a valid image file`);
          continue;
        }

        // Check file size (max 4MB)
        if (file.size > 4 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Maximum size is 4MB`);
          continue;
        }

        // Upload image to server
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch('/api/upload/images', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          toast.error(`Failed to upload ${file.name}: ${error.error}`);
          continue;
        }

        const uploadResult = await uploadResponse.json();

        const imageData: ImageData = {
          id: `uploaded-${Date.now()}-${i}`,
          url: uploadResult.url,
          alt: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
          isMain: images.length === 0 && i === 0, // First image is main by default
        };

        newImages.push(imageData);
      }

      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      
      // Debug logging for image upload
      console.log("Images updated:", {
        totalImages: updatedImages.length,
        newImagesCount: newImages.length,
        allImages: updatedImages
      });
      
      onImagesChange(updatedImages);
      
      if (newImages.length > 0) {
        toast.success(`${newImages.length} image(s) added successfully`);
      }
    } catch (error) {
      console.error('Error processing images:', error);
      toast.error('Failed to process images');
    } finally {
      setUploading(false);
    }
  }, [images, maxImages, onImagesChange]);

  const removeImage = (id: string) => {
    const updatedImages = images.filter(img => img.id !== id);
    // If we removed the main image, make the first remaining image main
    if (updatedImages.length > 0 && !updatedImages.some(img => img.isMain)) {
      updatedImages[0].isMain = true;
    }
    setImages(updatedImages);
    onImagesChange(updatedImages);
    toast.success('Image removed');
  };

  const setMainImage = (id: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      isMain: img.id === id,
    }));
    setImages(updatedImages);
    onImagesChange(updatedImages);
    toast.success('Main image updated');
  };

  const updateAltText = (id: string, alt: string) => {
    const updatedImages = images.map(img =>
      img.id === id ? { ...img, alt } : img
    );
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Product Images
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Section */}
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Upload product images</p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, JPEG up to 4MB each. Maximum {maxImages} images.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={uploading || images.length >= maxImages}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('file-upload')?.click();
                }}
              >
                {uploading ? 'Uploading...' : 'Choose Files'}
              </Button>
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  e.preventDefault();
                  if (e.target.files) {
                    handleFileUpload(e.target.files);
                    // Reset the input so the same file can be selected again
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Images List */}
        {images.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                Uploaded Images ({images.length}/{maxImages})
              </h4>
              {images.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  Drag to reorder • Click star to set as main image
                </p>
              )}
            </div>

            <div className="grid gap-4">
              {images.map((image, index) => (
                <Card key={image.id} className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Image Preview */}
                    <div className="relative w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        className="object-cover"
                      />
                      {image.isMain && (
                        <div className="absolute top-1 right-1">
                          <Badge className="text-xs px-1 py-0">Main</Badge>
                        </div>
                      )}
                    </div>

                    {/* Image Details */}
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Alt text (optional)"
                        value={image.alt}
                        onChange={(e) => updateAltText(image.id, e.target.value)}
                        className="text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            setMainImage(image.id);
                          }}
                          disabled={image.isMain}
                          className="gap-1"
                        >
                          <Star className={`h-3 w-3 ${image.isMain ? 'fill-current' : ''}`} />
                          {image.isMain ? 'Main' : 'Set as Main'}
                        </Button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1">
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            moveImage(index, index - 1);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                      )}
                      {index < images.length - 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            moveImage(index, index + 1);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          removeImage(image.id);
                        }}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• The first image will be used as the main product image</p>
          <p>• You can set any image as the main image by clicking the star button</p>
          <p>• Alt text helps with accessibility and SEO</p>
          <p>• Images are currently stored as data URLs (for demo purposes)</p>
        </div>
      </CardContent>
    </Card>
  );
}
