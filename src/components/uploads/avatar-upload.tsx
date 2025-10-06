"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UploadDropzone } from "@/lib/uploadthing/client";
import { Camera, User } from "lucide-react";

interface AvatarUploadProps {
  currentAvatar?: string;
  onAvatarChange: (url: string) => void;
  fallbackText?: string;
}

export function AvatarUpload({
  currentAvatar,
  onAvatarChange,
  fallbackText = "U",
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const handleUploadComplete = (res: any) => {
    if (res && res[0]) {
      onAvatarChange(res[0].url);
      setShowUpload(false);
    }
    setIsUploading(false);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={currentAvatar} alt="Profile picture" />
          <AvatarFallback className="text-lg">
            <User className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>
        <Button
          size="sm"
          variant="outline"
          className="absolute bottom-0 right-0 h-8 w-8 rounded-full p-0"
          onClick={() => setShowUpload(!showUpload)}
          disabled={isUploading}
        >
          <Camera className="h-4 w-4" />
        </Button>
      </div>

      {showUpload && (
        <div className="w-full max-w-md">
          <UploadDropzone
            endpoint="avatarUploader"
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
              container: "border-2 border-dashed border-muted-foreground/25 rounded-lg p-4",
              uploadIcon: "text-muted-foreground h-8 w-8",
              label: "text-sm text-muted-foreground",
              allowedContent: "text-xs text-muted-foreground/70",
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUpload(false)}
            className="mt-2 w-full"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

























































