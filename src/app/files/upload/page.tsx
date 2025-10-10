"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  X,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TuningLayout } from '@/components/tuning/tuning-layout';
import { useLanguage } from '@/contexts/LanguageContext';

interface Modification {
  id: number;
  code: string;
  label: string;
  description?: string;
}

interface UploadState {
  file: File | null;
  selectedModifications: number[];
  customerComment: string;
  dtcCodes: string; // New field for DTC codes
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  success: boolean;
}

export default function FileUploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  
  const [modifications, setModifications] = useState<Modification[]>([]);
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    selectedModifications: [],
    customerComment: '',
    dtcCodes: '', // Initialize DTC codes field
    isUploading: false,
    uploadProgress: 0,
    error: null,
    success: false
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Fetch modifications
  useEffect(() => {
    fetchModifications();
  }, []);

  const fetchModifications = async () => {
    try {
      const response = await fetch('/api/modifications');
      const data = await response.json();
      
      if (data.success) {
        setModifications(data.data);
      } else {
        toast.error(t('upload.errors.loadModifications'));
      }
    } catch (error) {
      console.error('Error fetching modifications:', error);
      toast.error(t('upload.errors.loadModifications'));
    }
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (get from env or default to 200MB)
    const maxSizeMB = 200;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
      toast.error(t('upload.errors.fileSize'));
      return;
    }

    // Allow all file types - no restrictions

    setUploadState(prev => ({
      ...prev,
      file,
      error: null
    }));
  }, []);

  const handleModificationChange = (modificationId: number, checked: boolean) => {
    setUploadState(prev => ({
      ...prev,
      selectedModifications: checked
        ? [...prev.selectedModifications, modificationId]
        : prev.selectedModifications.filter(id => id !== modificationId)
    }));
  };

  const handleUpload = async () => {
    if (!uploadState.file || uploadState.selectedModifications.length === 0) {
      toast.error(t('upload.errors.selectFileAndModification'));
      return;
    }

    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      uploadProgress: 0,
      error: null
    }));

    try {
      // Step 1: Request upload URL
      setUploadState(prev => ({ ...prev, uploadProgress: 10 }));
      
      const requestResponse = await fetch('/api/files/request-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalFilename: uploadState.file.name,
          fileSize: uploadState.file.size,
          fileType: uploadState.file.type || 'application/octet-stream',
          modificationIds: uploadState.selectedModifications,
          customerComment: uploadState.customerComment || undefined,
          dtcCodes: uploadState.dtcCodes || undefined
        })
      });

      if (!requestResponse.ok) {
        const errorData = await requestResponse.json();
        throw new Error(errorData.error || 'Failed to request upload URL');
      }

      const { data: uploadData } = await requestResponse.json();
      setUploadState(prev => ({ ...prev, uploadProgress: 30 }));

      // Step 2: Upload file to R2
      const uploadResponse = await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        body: uploadState.file,
        headers: {
          'Content-Type': uploadState.file.type || 'application/octet-stream'
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage');
      }

      setUploadState(prev => ({ ...prev, uploadProgress: 80 }));

      // Step 3: Confirm upload
      const confirmResponse = await fetch('/api/files/confirm-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: uploadData.fileId
        })
      });

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json();
        throw new Error(errorData.error || 'Failed to confirm upload');
      }

      setUploadState(prev => ({ 
        ...prev, 
        uploadProgress: 100,
        success: true,
        isUploading: false
      }));

      toast.success(t('upload.success.toast'));
      
      // Redirect to files list after a short delay
      setTimeout(() => {
        router.push('/files');
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        uploadProgress: 0,
        error: errorMessage
      }));
      
      toast.error(errorMessage);
    }
  };

  const resetUpload = () => {
    setUploadState({
      file: null,
      selectedModifications: [],
      customerComment: '',
      dtcCodes: '', // Reset DTC codes
      isUploading: false,
      uploadProgress: 0,
      error: null,
      success: false
    });
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <TuningLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('upload.title')}</h1>
        <p className="text-muted-foreground">
          {t('upload.description')}
        </p>
      </div>

      {uploadState.success ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">{t('upload.success.title')}</h2>
              <p className="text-muted-foreground mb-4">
                {t('upload.success.description')}
              </p>
              <div className="space-x-4">
                <Button onClick={() => router.push('/files')}>
                  {t('upload.success.viewFiles')}
                </Button>
                <Button variant="outline" onClick={resetUpload}>
                  {t('upload.success.uploadAnother')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                {t('upload.selectFile.title')}
              </CardTitle>
              <CardDescription>
                {t('upload.selectFile.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="relative">
                    <Input
                      type="file"
                      onChange={handleFileSelect}
                      accept="*"
                      disabled={uploadState.isUploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('upload.browse.text')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('upload.browse.maxSize')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {uploadState.file && (
                  <div className="flex items-center p-3 bg-muted rounded-lg">
                    <FileText className="h-5 w-5 mr-3 text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium">{uploadState.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadState.file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    {!uploadState.isUploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUploadState(prev => ({ ...prev, file: null }))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {t('upload.supportedTypes')}
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* Modifications */}
          <Card>
            <CardHeader>
              <CardTitle>{t('upload.modifications.title')}</CardTitle>
              <CardDescription>
                {t('upload.modifications.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modifications.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground">{t('upload.modifications.loading')}</p>
                  </div>
                ) : (
                  modifications.map((modification) => (
                    <div key={modification.id} className="border rounded-lg">
                      <div className="flex items-start space-x-3 p-3">
                        <Checkbox
                          id={`mod-${modification.id}`}
                          checked={uploadState.selectedModifications.includes(modification.id)}
                          onCheckedChange={(checked) => 
                            handleModificationChange(modification.id, checked as boolean)
                          }
                          disabled={uploadState.isUploading}
                        />
                        <div className="flex-1">
                          <Label 
                            htmlFor={`mod-${modification.id}`}
                            className="font-medium cursor-pointer"
                          >
                            {modification.label}
                          </Label>
                          {modification.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {modification.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* DTC Codes Text Area - Show right below DTC_DELETE checkbox when selected */}
                      {modification.code === 'DTC_DELETE' && uploadState.selectedModifications.includes(modification.id) && (
                        <div className="px-3 pb-3 pt-0">
                          <div className="ml-6 space-y-2">
                            <Label htmlFor="dtc-codes" className="text-sm font-medium text-muted-foreground">
                              {t('upload.dtcCodes.title')}
                            </Label>
                            <Textarea
                              id="dtc-codes"
                              placeholder="Enter DTC codes"
                              value={uploadState.dtcCodes}
                              onChange={(e) => setUploadState(prev => ({ ...prev, dtcCodes: e.target.value }))}
                              disabled={uploadState.isUploading}
                              rows={3}
                              className="resize-none text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                              {t('upload.dtcCodes.example')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {uploadState.selectedModifications.length === 0 && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t('upload.modifications.selectAtLeastOne')}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle>{t('upload.comments.title')}</CardTitle>
              <CardDescription>
                {t('upload.comments.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder={t('upload.comments.placeholder')}
                value={uploadState.customerComment}
                onChange={(e) => setUploadState(prev => ({ ...prev, customerComment: e.target.value }))}
                disabled={uploadState.isUploading}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Error Display */}
          {uploadState.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {uploadState.error}
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Progress */}
          {uploadState.isUploading && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('upload.progress.uploading')}</span>
                    <span className="text-sm text-muted-foreground">{uploadState.uploadProgress}%</span>
                  </div>
                  <Progress value={uploadState.uploadProgress} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleUpload}
              disabled={
                !uploadState.file || 
                uploadState.selectedModifications.length === 0 || 
                uploadState.isUploading
              }
              size="lg"
              className="min-w-32"
            >
              {uploadState.isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('upload.button.uploading')}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {t('upload.button.upload')}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
    </TuningLayout>
  );
}
