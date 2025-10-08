"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VideoIcon, ExternalLink, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface VimeoVideo {
  id: string;
  url: string;
  vimeoId?: string;
  title?: string;
  thumbnail?: string;
  duration?: number;
  videoType: 'VIMEO' | 'DIRECT';
}

interface VimeoVideoManagerProps {
  videos: VimeoVideo[];
  onAddVideo: (videoData: { url: string; title?: string }) => Promise<void>;
  onRemoveVideo: (videoId: string) => Promise<void>;
  isLoading?: boolean;
}

// Helper function to extract Vimeo ID from URL
function getVimeoId(url: string): string | null {
  const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;
  const match = url.match(vimeoRegex);
  return match ? match[1] : null;
}

// Helper function to get Vimeo thumbnail
function getVimeoThumbnail(vimeoId: string): string {
  return `https://vumbnail.com/${vimeoId}.jpg`;
}

export function VimeoVideoManager({ 
  videos = [], 
  onAddVideo, 
  onRemoveVideo, 
  isLoading = false 
}: VimeoVideoManagerProps) {
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddVideo = async () => {
    if (!newVideoUrl.trim()) {
      toast.error("Please enter a video URL");
      return;
    }

    const vimeoId = getVimeoId(newVideoUrl);
    if (!vimeoId) {
      toast.error("Please enter a valid Vimeo URL (e.g., https://vimeo.com/123456789)");
      return;
    }

    setIsAdding(true);
    try {
      await onAddVideo({
        url: newVideoUrl.trim(),
        title: newVideoTitle.trim() || undefined
      });
      
      setNewVideoUrl("");
      setNewVideoTitle("");
      toast.success("Vimeo video added successfully!");
    } catch (error) {
      console.error("Error adding video:", error);
      toast.error("Failed to add video. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveVideo = async (videoId: string) => {
    if (!confirm("Are you sure you want to remove this video?")) return;
    
    try {
      await onRemoveVideo(videoId);
      toast.success("Video removed successfully!");
    } catch (error) {
      console.error("Error removing video:", error);
      toast.error("Failed to remove video. Please try again.");
    }
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Add New Video Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Vimeo Video
          </CardTitle>
          <CardDescription>
            Add a professional Vimeo video to your product. Vimeo provides better performance and user experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vimeo-url">Vimeo URL *</Label>
              <Input
                id="vimeo-url"
                type="url"
                placeholder="https://vimeo.com/123456789"
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                disabled={isAdding}
              />
              <p className="text-xs text-muted-foreground">
                Enter the full Vimeo URL (e.g., https://vimeo.com/123456789)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="video-title">Video Title (Optional)</Label>
              <Input
                id="video-title"
                type="text"
                placeholder="Product demonstration video"
                value={newVideoTitle}
                onChange={(e) => setNewVideoTitle(e.target.value)}
                disabled={isAdding}
              />
            </div>
          </div>
          <Button 
            onClick={handleAddVideo} 
            disabled={isAdding || !newVideoUrl.trim()}
            className="w-full md:w-auto"
          >
            {isAdding ? "Adding..." : "Add Vimeo Video"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Videos */}
      {videos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Product Videos ({videos.length})</CardTitle>
            <CardDescription>
              Manage your product videos. Vimeo videos provide the best performance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => {
                const vimeoId = getVimeoId(video.url);
                const isVimeo = video.videoType === 'VIMEO' || !!vimeoId;
                
                return (
                  <div
                    key={video.id}
                    className="relative border rounded-lg overflow-hidden group hover:shadow-md transition-shadow"
                  >
                    {/* Video Thumbnail */}
                    <div className="aspect-video bg-muted flex items-center justify-center relative">
                      {isVimeo && vimeoId ? (
                        <img
                          src={getVimeoThumbnail(vimeoId)}
                          alt={video.title || "Video thumbnail"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      
                      {/* Fallback icon */}
                      <div className={`flex items-center justify-center ${isVimeo && vimeoId ? 'hidden' : ''}`}>
                        <VideoIcon className="h-12 w-12 text-muted-foreground" />
                      </div>

                      {/* Duration Badge */}
                      {video.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(video.duration)}
                        </div>
                      )}

                      {/* Remove Button */}
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveVideo(video.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Video Info */}
                    <div className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm line-clamp-2">
                          {video.title || "Untitled Video"}
                        </h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(video.url, '_blank')}
                          className="flex-shrink-0 p-1 h-auto"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {isVimeo && vimeoId && (
                        <p className="text-xs text-muted-foreground">
                          Vimeo ID: {vimeoId}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {videos.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <VideoIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No videos added yet</p>
              <p className="text-sm">Add your first Vimeo video to get started with professional video hosting.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
