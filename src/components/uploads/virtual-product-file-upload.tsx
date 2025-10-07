"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Download,
  FileText,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface VirtualProductFile {
  id: string;
  name: string;
  size: number;
  url?: string;
  uploadProgress?: number;
  status: 'uploading' | 'uploaded' | 'error';
  error?: string;
}

interface VirtualProductFileUploadProps {
  value?: string; // downloadUrl
  onChange: (url: string, fileInfo?: { name: string; size: string }) => void;
  onFileInfoChange?: (fileInfo: { size: string; name: string }) => void;
  disabled?: boolean;
  accept?: string;
  maxSizeMB?: number;
}

export function VirtualProductFileUpload({
  value,
  onChange,
  onFileInfoChange,
  disabled = false,
  accept = "*",
  maxSizeMB = 100,
}: VirtualProductFileUploadProps) {
  const [file, setFile] = useState<VirtualProductFile | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSizeMB}MB`;
    }

    // Allow all file types - no restrictions
    return null;
  };

  const handleFileSelection = async (selectedFile: File) => {
    const error = validateFile(selectedFile);
    if (error) {
      toast.error(error);
      return;
    }

    const fileId = Math.random().toString(36).substring(7);
    const newFile: VirtualProductFile = {
      id: fileId,
      name: selectedFile.name,
      size: selectedFile.size,
      uploadProgress: 0,
      status: 'uploading',
    };

    setFile(newFile);

    try {
      // Simulate file upload (in a real app, you'd upload to your storage service)
      // For now, we'll create a fake URL and simulate progress
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setFile(prev => prev ? { ...prev, uploadProgress: progress } : null);
      }

      // Create a fake download URL (in real app, this would come from your upload service)
      const fakeUrl = `/api/downloads/virtual-products/${fileId}/${encodeURIComponent(selectedFile.name)}`;
      
      const uploadedFile: VirtualProductFile = {
        ...newFile,
        url: fakeUrl,
        uploadProgress: 100,
        status: 'uploaded',
      };

      setFile(uploadedFile);
      onChange(fakeUrl, {
        name: selectedFile.name,
        size: formatFileSize(selectedFile.size),
      });

      if (onFileInfoChange) {
        onFileInfoChange({
          size: formatFileSize(selectedFile.size),
          name: selectedFile.name,
        });
      }

      toast.success('File uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      setFile(prev => prev ? { 
        ...prev, 
        status: 'error', 
        error: 'Upload failed. Please try again.' 
      } : null);
      toast.error('Upload failed. Please try again.');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileSelection(droppedFiles[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFileSelection(selectedFiles[0]);
    }
    // Reset input to allow selecting the same file again
    e.target.value = '';
  };

  const removeFile = () => {
    setFile(null);
    onChange('');
    if (onFileInfoChange) {
      onFileInfoChange({ size: '', name: '' });
    }
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Virtual Product File
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {!file && (
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={openFileDialog}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Upload Virtual Product File</h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop your file here, or click to browse
            </p>
            <Badge variant="outline" className="mb-2">
              Max size: {maxSizeMB}MB
            </Badge>
            <p className="text-xs text-muted-foreground">
              Supported formats: {accept}
            </p>
          </div>
        )}

        {file && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {file.status === 'uploaded' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : file.status === 'error' ? (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <FileText className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                  {file.error && (
                    <p className="text-sm text-red-600">{file.error}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {file.status === 'uploaded' && (
                  <Badge className="bg-green-100 text-green-800">
                    Uploaded
                  </Badge>
                )}
                {file.status === 'error' && (
                  <Badge variant="destructive">
                    Failed
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {file.status === 'uploading' && file.uploadProgress !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{file.uploadProgress}%</span>
                </div>
                <Progress value={file.uploadProgress} className="h-2" />
              </div>
            )}

            {file.status === 'error' && (
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground">
                  Upload failed. Please try uploading the file again.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <Label className="text-xs">Recommended formats:</Label>
            <p>ZIP, EXE, DMG, MSI</p>
          </div>
          <div>
            <Label className="text-xs">File size limit:</Label>
            <p>Up to {maxSizeMB}MB</p>
          </div>
        </div>

        {!file && value && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Current file: <span className="font-medium">{value.split('/').pop()}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
