"use client";

import React, { useState, useCallback, useRef } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  Trash2, 
  ImageIcon, 
  VideoIcon,
  GripVertical, 
  Star, 
  Eye, 
  Play,
  Plus,
  Upload,
  X,
  FileVideo,
  Clock,
  HardDrive
} from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { generateVideoThumbnail, getVideoMetadata } from "@/lib/utils/video-utils";

interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  isMain?: boolean;
}

interface ProductVideo {
  id: string;
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  fileSize?: string;
  mimeType?: string;
  isMain?: boolean;
  uploadProgress?: number;
  status?: 'uploading' | 'uploaded' | 'error';
}

interface BasicProductMediaUploadProps {
  onImagesChange: (images: ProductImage[]) => void;
  onVideosChange: (videos: ProductVideo[]) => void;
  existingImages?: ProductImage[];
  existingVideos?: ProductVideo[];
  maxImages?: number;
  maxVideos?: number;
  disabled?: boolean;
}

export function BasicProductMediaUpload({
  onImagesChange,
  onVideosChange,
  existingImages = [],
  existingVideos = [],
  maxImages = 8,
  maxVideos = 3,
  disabled = false,
}: BasicProductMediaUploadProps) {
  const [images, setImages] = useState<ProductImage[]>(
    existingImages.map((img, index) => ({
      ...img,
      id: img.id || `image-${index}`,
      isMain: index === 0,
    }))
  );
  
  const [videos, setVideos] = useState<ProductVideo[]>(
    existingVideos.map((vid, index) => ({
      ...vid,
      id: vid.id || `video-${index}`,
      isMain: index === 0,
    }))
  );

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<string | null>(null);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const updateImages = useCallback((newImages: ProductImage[]) => {
    setImages(newImages);
    onImagesChange(newImages);
  }, [onImagesChange]);

  const updateVideos = useCallback((newVideos: ProductVideo[]) => {
    console.log("updateVideos called with:", newVideos);
    setVideos(newVideos);
    onVideosChange(newVideos);
  }, [onVideosChange]);

  // Utility functions
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Image handlers
  const handleImageUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    const validImages = fileArray.filter(file => file.type.startsWith('image/'));
    
    if (validImages.length === 0) {
      toast.error("Please select valid image files");
      return;
    }

    if (images.length + validImages.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    for (const file of validImages) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast.error(`Image ${file.name} is too large (max 4MB)`);
        continue;
      }

      try {
        // Upload file to server
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'image');

        const response = await fetch('/api/upload/basic', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const result = await response.json();
        
        // Debug logging
        console.log("Video upload result:", result);
        
        const newImage: ProductImage = {
          id: `image-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          url: result.file.url,
          alt: file.name.replace(/\.[^/.]+$/, ""),
          isMain: images.length === 0,
        };

        console.log("Created new image object:", newImage);

        const updatedImages = [...images, newImage];
        updateImages(updatedImages);
        
        toast.success(`Image ${file.name} uploaded successfully`);
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleVideoUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    const validVideos = fileArray.filter(file => file.type.startsWith('video/'));
    
    if (validVideos.length === 0) {
      toast.error("Please select valid video files");
      return;
    }

    if (videos.length + validVideos.length > maxVideos) {
      toast.error(`Maximum ${maxVideos} videos allowed`);
      return;
    }

    for (const file of validVideos) {
      if (file.size > 32 * 1024 * 1024) { // 32MB limit
        toast.error(`Video ${file.name} is too large (max 32MB)`);
        continue;
      }

      const videoId = `video-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      // Create temporary video for progress tracking
      const tempVideo: ProductVideo = {
        id: videoId,
        url: '',
        title: file.name.replace(/\.[^/.]+$/, ""),
        description: "",
        fileSize: formatFileSize(file.size),
        mimeType: file.type,
        isMain: videos.length === 0,
        status: 'uploading',
        uploadProgress: 0,
      };

      // Add to videos list immediately for progress display
      const updatedVideos = [...videos, tempVideo];
      updateVideos(updatedVideos);

      try {
        // Generate thumbnail first
        console.log("Generating thumbnail for video:", file.name);
        let thumbnail = "";
        let duration = 0;
        
        try {
          thumbnail = await generateVideoThumbnail(file);
          const metadata = await getVideoMetadata(file);
          duration = metadata.duration;
          console.log("Generated thumbnail and metadata:", { thumbnailLength: thumbnail.length, duration });
        } catch (error) {
          console.warn("Failed to generate thumbnail:", error);
          // Continue without thumbnail
        }

        // Upload file to server
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'video');

        const response = await fetch('/api/upload/basic', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const result = await response.json();
        
        // Debug logging
        console.log("Video upload result:", result);
        console.log("Video URL from server:", result.file.url);
        
        // Update video immediately with the URL and thumbnail
        const uploadedVideo: ProductVideo = {
          ...tempVideo,
          url: result.file.url,
          thumbnail: thumbnail, // Use generated thumbnail
          duration: duration, // Use extracted duration
          status: 'uploaded',
          uploadProgress: 100,
        };

        // Update videos array immediately
        const immediateVideos = updatedVideos.map(v => 
          v.id === videoId ? uploadedVideo : v
        );
        updateVideos(immediateVideos);
        console.log("Updated videos array with uploaded video:", immediateVideos);
        
        toast.success(`Video ${file.name} uploaded successfully`);

      } catch (error) {
        console.error('Error uploading video:', error);
        
        // Update video with error status
        const errorVideo: ProductVideo = {
          ...tempVideo,
          status: 'error',
          uploadProgress: 0,
        };
        
        const errorVideos = updatedVideos.map(v => 
          v.id === videoId ? errorVideo : v
        );
        updateVideos(errorVideos);
        
        toast.error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const removeImage = (imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    if (updatedImages.length > 0) {
      const hasMain = updatedImages.some(img => img.isMain);
      if (!hasMain) {
        updatedImages[0].isMain = true;
      }
    }
    updateImages(updatedImages);
  };

  const removeVideo = (videoId: string) => {
    const updatedVideos = videos.filter(vid => vid.id !== videoId);
    if (updatedVideos.length > 0) {
      const hasMain = updatedVideos.some(vid => vid.isMain);
      if (!hasMain) {
        updatedVideos[0].isMain = true;
      }
    }
    updateVideos(updatedVideos);
  };

  const setMainImage = (imageId: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      isMain: img.id === imageId,
    }));
    updateImages(updatedImages);
  };

  const setMainVideo = (videoId: string) => {
    const updatedVideos = videos.map(vid => ({
      ...vid,
      isMain: vid.id === videoId,
    }));
    updateVideos(updatedVideos);
  };

  const updateVideoInfo = (videoId: string, field: string, value: string) => {
    const updatedVideos = videos.map(vid =>
      vid.id === videoId ? { ...vid, [field]: value } : vid
    );
    updateVideos(updatedVideos);
  };

  // Drag and drop handlers
  const onImageDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedImages = Array.from(images);
    const [removed] = reorderedImages.splice(result.source.index, 1);
    reorderedImages.splice(result.destination.index, 0, removed);

    const updatedImages = reorderedImages.map((img, index) => ({
      ...img,
      isMain: index === 0,
    }));

    updateImages(updatedImages);
  };

  const onVideoDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedVideos = Array.from(videos);
    const [removed] = reorderedVideos.splice(result.source.index, 1);
    reorderedVideos.splice(result.destination.index, 0, removed);

    const updatedVideos = reorderedVideos.map((vid, index) => ({
      ...vid,
      isMain: index === 0,
    }));

    updateVideos(updatedVideos);
  };

  const canUploadMoreImages = images.length < maxImages && !disabled;
  const canUploadMoreVideos = videos.length < maxVideos && !disabled;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="images" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="images" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Images ({images.length}/{maxImages})
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <VideoIcon className="h-4 w-4" />
            Videos ({videos.length}/{maxVideos})
          </TabsTrigger>
        </TabsList>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-6">
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
                <DragDropContext onDragEnd={onImageDragEnd}>
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

              {/* Image Upload Area */}
              {canUploadMoreImages && (
                <div className="space-y-4">
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground font-medium mb-2">
                      Upload product images ({images.length}/{maxImages})
                    </p>
                    <p className="text-sm text-muted-foreground/70 mb-4">
                      Drag files here or click to browse
                    </p>
                    <Button type="button" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Images
                    </Button>
                  </div>
                  
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                  />
                  
                  <div className="text-center text-sm text-muted-foreground">
                    <p>Supported formats: JPEG, PNG, WebP (max 4MB each)</p>
                  </div>
                </div>
              )}

              {!canUploadMoreImages && (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Maximum images reached</p>
                  <p className="text-sm">Remove some images to upload more</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <VideoIcon className="h-5 w-5" />
                Product Videos ({videos.length}/{maxVideos})
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Add engaging videos like unboxing, demonstrations, or product showcases. 
                Videos help customers understand your product better.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Video List */}
              {videos.length > 0 && (
                <DragDropContext onDragEnd={onVideoDragEnd}>
                  <Droppable droppableId="videos">
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={cn(
                          "space-y-4 p-4 rounded-lg border-2 border-dashed transition-colors",
                          snapshot.isDraggingOver ? "border-primary bg-primary/5" : "border-muted"
                        )}
                      >
                        {videos.map((video, index) => (
                          <Draggable
                            key={video.id}
                            draggableId={video.id}
                            index={index}
                            isDragDisabled={disabled}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={cn(
                                  "relative group bg-card rounded-lg border-2 p-4 transition-all",
                                  snapshot.isDragging ? "shadow-lg scale-105" : "shadow-sm",
                                  video.isMain ? "border-primary ring-2 ring-primary/20" : "border-border"
                                )}
                              >
                                {/* Drag Handle - moved to top level */}
                                <div
                                  {...provided.dragHandleProps}
                                  className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                                >
                                  <div className="bg-black/50 text-white p-1 rounded">
                                    <GripVertical className="h-3 w-3" />
                                  </div>
                                </div>

                                <div className="flex gap-4">
                                  {/* Video Thumbnail/Preview */}
                                  <div className="relative w-32 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                    {video.thumbnail ? (
                                      <Image
                                        src={video.thumbnail}
                                        alt={video.title || "Video thumbnail"}
                                        fill
                                        className="object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-muted">
                                        <FileVideo className="h-8 w-8 text-muted-foreground" />
                                      </div>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => setPreviewVideo(video.url)}
                                      className="absolute inset-0 w-full h-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
                                      type="button"
                                    >
                                      <Play className="h-6 w-6 text-white" />
                                    </Button>
                                  </div>

                                  {/* Video Info */}
                                  <div className="flex-1 space-y-2">
                                    {editingVideo === video.id ? (
                                      <div className="space-y-2">
                                        <Input
                                          value={video.title || ""}
                                          onChange={(e) => updateVideoInfo(video.id, "title", e.target.value)}
                                          placeholder="Video title"
                                          className="text-sm"
                                        />
                                        <Textarea
                                          value={video.description || ""}
                                          onChange={(e) => updateVideoInfo(video.id, "description", e.target.value)}
                                          placeholder="Video description"
                                          className="text-sm resize-none"
                                          rows={2}
                                        />
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            onClick={() => setEditingVideo(null)}
                                            type="button"
                                          >
                                            Save
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setEditingVideo(null)}
                                            type="button"
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex items-start justify-between">
                                          <div>
                                            <h4 className="font-medium text-sm">{video.title || "Untitled Video"}</h4>
                                            {video.description && (
                                              <p className="text-xs text-muted-foreground mt-1">{video.description}</p>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1">
                                            {/* Drag Handle */}
                                            <div
                                              {...provided.dragHandleProps}
                                              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                                            >
                                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                          {video.fileSize && (
                                            <div className="flex items-center gap-1">
                                              <HardDrive className="h-3 w-3" />
                                              {video.fileSize}
                                            </div>
                                          )}
                                          {video.duration && (
                                            <div className="flex items-center gap-1">
                                              <Clock className="h-3 w-3" />
                                              {formatDuration(video.duration)}
                                            </div>
                                          )}
                                          {video.status === 'uploading' && video.uploadProgress !== undefined && (
                                            <div className="flex items-center gap-2 flex-1">
                                              <span>Uploading...</span>
                                              <Progress value={video.uploadProgress} className="w-20" />
                                            </div>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>

                                  {/* Video Actions */}
                                  <div className="flex flex-col gap-2">
                                    {video.isMain && (
                                      <Badge className="bg-primary text-xs">
                                        <Star className="h-3 w-3 mr-1" />
                                        Main
                                      </Badge>
                                    )}
                                    
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditingVideo(video.id)}
                                        className="h-8 w-8 p-0"
                                        type="button"
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                      
                                      {!video.isMain && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setMainVideo(video.id)}
                                          className="h-8 w-8 p-0"
                                          type="button"
                                        >
                                          <Star className="h-3 w-3" />
                                        </Button>
                                      )}
                                      
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => removeVideo(video.id)}
                                        className="h-8 w-8 p-0"
                                        disabled={disabled}
                                        type="button"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
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

              {/* Video Upload Area */}
              {canUploadMoreVideos && (
                <div className="space-y-4">
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <VideoIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground font-medium mb-2">
                      Upload product videos ({videos.length}/{maxVideos})
                    </p>
                    <p className="text-sm text-muted-foreground/70 mb-4">
                      Drag video files here or click to browse
                    </p>
                    <Button type="button" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Videos
                    </Button>
                  </div>
                  
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleVideoUpload(e.target.files)}
                  />
                  
                  <div className="text-center text-sm text-muted-foreground">
                    <p>Supported formats: MP4, WebM, MOV (max 32MB each)</p>
                    <p className="mt-1">Recommended: Short videos (30-60 seconds) showcasing your product</p>
                  </div>
                </div>
              )}

              {!canUploadMoreVideos && (
                <div className="text-center py-8 text-muted-foreground">
                  <VideoIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Maximum videos reached</p>
                  <p className="text-sm">Remove some videos to upload more</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

      {/* Video Preview Modal */}
      {previewVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewVideo(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-4 right-4 z-10"
              onClick={() => setPreviewVideo(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            <video
              src={previewVideo}
              controls
              className="max-w-full max-h-full rounded-lg"
              autoPlay
            />
          </div>
        </div>
      )}
    </div>
  );
}
