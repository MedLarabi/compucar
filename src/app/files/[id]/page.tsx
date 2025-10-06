"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  FileText, 
  Download,
  Calendar,
  DollarSign,
  CreditCard,
  User,
  MessageSquare,
  Settings,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Wifi,
  WifiOff
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';
import { TuningLayout } from '@/components/tuning/tuning-layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { CountdownTimer } from '@/components/countdown-timer';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';

interface FileDetail {
  id: string;
  originalFilename: string;
  fileSize: number;
  fileType: string;
  status: 'RECEIVED' | 'PENDING' | 'READY';
  price: number;
  paymentStatus: 'NOT_PAID' | 'PAID';
  uploadDate: string;
  updatedDate: string | null;
  customerComment?: string;
  adminNotes?: string; // Admin comments for customer
  estimatedProcessingTime?: number; // Estimated processing time in minutes
  estimatedProcessingTimeSetAt?: string; // When the estimated time was set (ISO string)
  modifications: Array<{
    id: number;
    code: string;
    label: string;
    description?: string;
  }>;
  downloadUrl?: string;
  downloadUrlExpiresIn?: number;
  // Modified file fields
  modifiedFilename?: string;
  modifiedFileSize?: number;
  modifiedFileType?: string;
  modifiedUploadDate?: string;
  modifiedDownloadUrl?: string;
  modifiedDownloadUrlExpiresIn?: number;
  createdAt: string;
}

export default function FileDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const fileId = params.id as string;
  const { t } = useLanguage();
  
  const [file, setFile] = useState<FileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadingModified, setDownloadingModified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time updates
  const { isConnected } = useRealTimeUpdates({
    onFileStatusUpdate: (data) => {
      // Only update if this is the current file
      if (data.fileId === fileId) {
        console.log('📡 File status update received for current file:', data);
        
        setFile(prevFile => 
          prevFile ? { 
            ...prevFile, 
            status: data.newStatus as 'RECEIVED' | 'PENDING' | 'READY'
          } : prevFile
        );
        
        // Show toast notification
        toast.success(`File status updated to ${data.newStatus}`, {
          description: 'Your file status has been updated by our team.',
          duration: 5000
        });
      }
    },
    
    onEstimatedTimeUpdate: (data) => {
      // Only update if this is the current file
      if (data.fileId === fileId) {
        console.log('📡 Estimated time update received for current file:', data);
        
        setFile(prevFile => 
          prevFile ? { 
            ...prevFile, 
            status: 'PENDING',
            estimatedProcessingTime: data.estimatedTime,
            estimatedProcessingTimeSetAt: new Date().toISOString()
          } : prevFile
        );
        
        // Show toast notification
        toast.info(`Estimated processing time set: ${data.timeText}`, {
          description: 'Processing time has been estimated by our team.',
          duration: 5000
        });
      }
    }
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Fetch file details
  useEffect(() => {
    if (session && fileId) {
      fetchFileDetails();
    }
  }, [session, fileId]);

  const fetchFileDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/files/${fileId}`);
      const data = await response.json();

      if (data.success) {
        console.log('📊 File data received:', data.data);
        console.log('📊 Original filename:', data.data.originalFilename);
        console.log('📊 Modified filename:', data.data.modifiedFilename);
        setFile(data.data);
      } else {
        setError(data.error || t('fileDetail.errors.notFound', 'File not found'));
      }
    } catch (error) {
      console.error('Error fetching file details:', error);
      setError(t('fileDetail.errors.loadFailed', 'Failed to load file details'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!file?.downloadUrl) {
      toast.error(t('fileDetail.download.urlNotAvailable', 'Download URL not available'));
      return;
    }

    setDownloading(true);

    try {
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = file.downloadUrl;
      link.download = file.originalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(t('fileDetail.download.started', 'Download started'));
    } catch (error) {
      console.error('Download error:', error);
      toast.error(t('fileDetail.download.failed', 'Failed to download file'));
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadModified = async () => {
    if (!file?.modifiedDownloadUrl) {
      // Fetch download URL for modified file
      try {
        const response = await fetch(`/api/files/${fileId}/download-modified`);
        const data = await response.json();

        if (data.success) {
          setFile(prev => prev ? {
            ...prev,
            modifiedDownloadUrl: data.downloadUrl,
            modifiedDownloadUrlExpiresIn: data.expiresIn
          } : null);

          // Trigger download
          const link = document.createElement('a');
          link.href = data.downloadUrl;
          link.download = data.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast.success(t('fileDetail.download.modifiedStarted', 'Modified file download started'));
        } else {
          toast.error(data.error || t('fileDetail.download.getUrlFailed', 'Failed to get download URL'));
        }
      } catch (error) {
        console.error('Error fetching modified file download URL:', error);
        toast.error(t('fileDetail.download.modifiedFailed', 'Failed to download modified file'));
      }
    } else {
      // Use existing download URL
      try {
        const link = document.createElement('a');
        link.href = file.modifiedDownloadUrl;
        link.download = file.modifiedFilename || 'modified_file';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(t('fileDetail.download.modifiedStarted', 'Modified file download started'));
      } catch (error) {
        console.error('Download error:', error);
        toast.error(t('fileDetail.download.modifiedFailed', 'Failed to download modified file'));
      }
    }

    setDownloadingModified(false);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return {
          color: 'bg-blue-500',
          icon: Clock,
          text: t('fileDetail.status.received', 'Received'),
          description: t('fileDetail.status.receivedDescription', 'Your file has been received and is waiting to be processed')
        };
      case 'PENDING':
        return {
          color: 'bg-yellow-500',
          icon: Settings,
          text: t('fileDetail.status.inProgress', 'In Progress'),
          description: file.estimatedProcessingTime 
            ? t('fileDetail.status.inProgressDescriptionWithTime', 'Your file is currently being processed. Estimated completion time: {time} minutes', { time: file.estimatedProcessingTime })
            : t('fileDetail.status.inProgressDescription', 'Your file is currently being processed')
        };
      case 'READY':
        return {
          color: 'bg-green-500',
          icon: CheckCircle,
          text: t('fileDetail.status.ready', 'Ready'),
          description: t('fileDetail.status.readyDescription', 'Your file is ready for download')
        };
      default:
        return {
          color: 'bg-gray-500',
          icon: AlertCircle,
          text: status,
          description: t('fileDetail.status.unknown', 'Unknown status')
        };
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/files">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('fileDetail.actions.backToFiles', 'Back to Files')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!file) {
    return null;
  }

  const statusInfo = getStatusInfo(file.status);
  const StatusIcon = statusInfo.icon;

  return (
    <TuningLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/files">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('fileDetail.actions.backToFiles', 'Back to Files')}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{file.originalFilename}</h1>
            <p className="text-muted-foreground mt-2">
              {t('fileDetail.header.description', 'File details and download information')}
            </p>
          </div>
        </div>
        
        {/* Real-time Connection Status */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isConnected 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4" />
                <span>Live Updates</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4" />
                <span>Connecting...</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <StatusIcon className="h-5 w-5 mr-2" />
                {t('fileDetail.status.title', 'Status')}: {statusInfo.text}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Badge className={`${statusInfo.color} text-white`}>
                  {statusInfo.text}
                </Badge>
                {file.paymentStatus === 'PAID' && (
                  <Badge className="bg-green-500 text-white">
                    <CreditCard className="h-3 w-3 mr-1" />
                    {t('fileDetail.payment.paid', 'Paid')}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">{statusInfo.description}</p>
              
              {/* Estimated Processing Time Indicator */}
              {file.status === 'PENDING' && file.estimatedProcessingTime && file.estimatedProcessingTimeSetAt && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <CountdownTimer
                    estimatedTimeMinutes={file.estimatedProcessingTime}
                    startTime={file.estimatedProcessingTimeSetAt}
                    className="text-yellow-800"
                  />
                </div>
              )}
              
              {file.status === 'READY' && (
                <div className="mt-4 space-y-3">
                  {/* Original File Download */}
                  {file.downloadUrl && (
                    <div>
                       <Button 
                         onClick={handleDownload} 
                         disabled={downloading} 
                         className="w-full bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 transition-colors duration-200"
                       >
                        {downloading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('fileDetail.download.downloading', 'Downloading...')}
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            {file.originalFilename}
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('fileDetail.download.submittedFile', 'Your submitted file')} ({formatFileSize(file.fileSize)})
                      </p>
                    </div>
                  )}

                  {/* Modified File Download */}
                  {file.modifiedFilename && (
                    <div>
                      <Button 
                        onClick={handleDownloadModified} 
                        disabled={downloadingModified}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        {downloadingModified ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('fileDetail.download.downloading', 'Downloading...')}
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            {file.modifiedFilename}
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('fileDetail.download.tunedFile', 'Tuned file')} ({file.modifiedFileSize ? formatFileSize(file.modifiedFileSize) : t('fileDetail.download.unknownSize', 'Unknown size')})
                      </p>
                    </div>
                  )}

                  {!file.downloadUrl && !file.modifiedFilename && (
                    <p className="text-sm text-muted-foreground">
                      {t('fileDetail.download.noFilesAvailable', 'No files available for download yet.')}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modifications */}
          <Card>
            <CardHeader>
              <CardTitle>{t('fileDetail.modifications.title', 'Requested Modifications')}</CardTitle>
              <CardDescription>
                {t('fileDetail.modifications.description', 'The modifications you selected for this file')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {file.modifications.map((modification) => (
                  <div key={modification.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{modification.label}</h4>
                        {modification.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {modification.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {modification.code}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Comment */}
          {file.customerComment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  {t('fileDetail.comments.title', 'Your Comments')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">{file.customerComment}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin Comments */}
          {file.adminNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  {t('fileDetail.adminComments.title', 'Admin Comments')}
                </CardTitle>
                <CardDescription>
                  {t('fileDetail.adminComments.description', 'Comments from the administrator about your file')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">{file.adminNotes}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* File Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                {t('fileDetail.fileInfo.title', 'File Information')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">{t('fileDetail.fileInfo.fileName', 'File Name')}</Label>
                <p className="text-sm break-all">{file.originalFilename}</p>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">{t('fileDetail.fileInfo.fileSize', 'File Size')}</Label>
                <p className="text-sm">{formatFileSize(file.fileSize)}</p>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">{t('fileDetail.fileInfo.fileType', 'File Type')}</Label>
                <p className="text-sm">{file.fileType}</p>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">{t('fileDetail.fileInfo.uploadDate', 'Upload Date')}</Label>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(file.uploadDate)}
                </div>
              </div>
              
              {file.updatedDate && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t('fileDetail.fileInfo.lastUpdated', 'Last Updated')}</Label>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(file.updatedDate)}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pricing Information */}
          {file.price > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  {t('fileDetail.pricing.title', 'Pricing')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('fileDetail.pricing.price', 'Price')}</Label>
                  <p className="text-2xl font-bold">{file.price.toFixed(0)} DA</p>
                </div>
                
                <Separator />
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('fileDetail.pricing.paymentStatus', 'Payment Status')}</Label>
                  <div className="flex items-center mt-1">
                    <Badge className={file.paymentStatus === 'PAID' ? 'bg-green-500' : 'bg-red-500'}>
                      {file.paymentStatus === 'PAID' ? t('fileDetail.payment.paid', 'Paid') : t('fileDetail.payment.notPaid', 'Not Paid')}
                    </Badge>
                  </div>
                </div>

                {file.paymentStatus === 'NOT_PAID' && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t('fileDetail.payment.manualPayment', 'Payment is handled manually. Please contact the administrator to arrange payment.')}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t('fileDetail.actions.title', 'Actions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {file.status === 'READY' && (
                <div className="space-y-2">
                  {/* Original File Download */}
                  {file.downloadUrl && (
                    <Button 
                      onClick={handleDownload} 
                      disabled={downloading}
                      className="w-full bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 transition-colors duration-200"
                    >
                      {downloading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t('fileDetail.download.downloading', 'Downloading...')}
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          {t('fileDetail.actions.downloadOriginal', 'Download Original')}
                        </>
                      )}
                    </Button>
                  )}

                  {/* Modified File Download */}
                  {file.modifiedFilename && (
                    <Button 
                      onClick={handleDownloadModified} 
                      disabled={downloadingModified}
                      variant="outline"
                      className="w-full"
                    >
                      {downloadingModified ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t('fileDetail.download.downloading', 'Downloading...')}
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          {t('fileDetail.actions.downloadModified', 'Download Modified')}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
              
              <Button 
                variant="outline" 
                onClick={fetchFileDetails}
                className="w-full"
              >
                {t('fileDetail.actions.refreshStatus', 'Refresh Status')}
              </Button>
              
              <Link href="/files" className="block">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('fileDetail.actions.backToFiles', 'Back to Files')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </TuningLayout>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
