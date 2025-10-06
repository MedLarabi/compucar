"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadDropzone } from "@/lib/uploadthing/client";
import { Trash2, ImageIcon } from "lucide-react";
import Image from "next/image";

interface ProductImageUploadProps {
  onImagesChange: (images: string[]) => void;
  existingImages?: string[];
  maxImages?: number;
}

export function ProductImageUpload({
  onImagesChange,
  existingImages = [],
  maxImages = 5,
}: ProductImageUploadProps) {
  const [images, setImages] = useState<string[]>(existingImages);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadComplete = (res: any) => {
    const newUrls = res.map((file: any) => file.url);
    const updatedImages = [...images, ...newUrls].slice(0, maxImages);
    setImages(updatedImages);
    onImagesChange(updatedImages);
    setIsUploading(false);
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const canUploadMore = images.length < maxImages;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Product Images ({images.length}/{maxImages})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Display existing images */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((url, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square relative rounded-lg overflow-hidden border">
                  <Image
                    src={url}
                    alt={`Product image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                  onClick={() => removeImage(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {index === 0 && (
                  <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                    Main
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload area */}
        {canUploadMore && (
          <div>
            <UploadDropzone
              endpoint="productImageUploader"
              onClientUploadComplete={handleUploadComplete}
              onUploadError={(error: Error) => {
                console.error("Upload error:", error);
                setIsUploading(false);
              }}
              onUploadBegin={() => setIsUploading(true)}
              config={{
                mode: "auto",
              }}
              appearance={{
                container: "border-2 border-dashed border-muted-foreground/25 rounded-lg p-8",
                uploadIcon: "text-muted-foreground",
                label: "text-muted-foreground",
                allowedContent: "text-muted-foreground/70",
              }}
            />
          </div>
        )}

        {!canUploadMore && (
          <div className="text-center text-muted-foreground">
            Maximum number of images reached
          </div>
        )}
      </CardContent>
    </Card>
  );
}























































