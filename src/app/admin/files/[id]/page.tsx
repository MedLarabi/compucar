"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Save,
  History
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';
import { AdminHeaderLayout } from '@/components/admin/admin-header-layout';
import { AdminGuard } from '@/components/admin/admin-guard';

interface AdminFileDetail {
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
  adminNotes?: string;
  estimatedProcessingTime?: number;
  estimatedProcessingTimeSetAt?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  modifications: Array<{
    id: number;
    code: string;
    label: string;
    description?: string;
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    oldValue?: string;
    newValue?: string;
    date: string;
    actor?: {
      id: string;
      firstName: string;
      lastName: string;
    };
    createdAt: string;
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

export default function AdminFileDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const fileId = params.id as string;
  
  const [file, setFile] = useState<AdminFileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [newStatus, setNewStatus] = useState<'RECEIVED' | 'PENDING' | 'READY'>('RECEIVED');
  const [newPrice, setNewPrice] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState<'NOT_PAID' | 'PAID'>('NOT_PAID');
  const [newAdminNotes, setNewAdminNotes] = useState('');
  const [estimatedProcessingTime, setEstimatedProcessingTime] = useState<number | null>(null);

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

  // Update form states when file data changes
  useEffect(() => {
    if (file) {
      setNewStatus(file.status);
      setNewPrice(file.price.toString());
      setNewPaymentStatus(file.paymentStatus);
      setNewAdminNotes(file.adminNotes || '');
      setEstimatedProcessingTime(file.estimatedProcessingTime || null);
    }
  }, [file]);

  const fetchFileDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/files/${fileId}`);
      const data = await response.json();

      if (data.success) {
        console.log('📊 Admin file data received:', data.data);
        console.log('📊 Original filename:', data.data.originalFilename);
        console.log('📊 Modified filename:', data.data.modifiedFilename);
        setFile(data.data);
      } else {
        setError(data.error || 'File not found');
      }
    } catch (error) {
      console.error('Error fetching file details:', error);
      setError('Failed to load file details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!file || (newStatus === file.status && estimatedProcessingTime === file.estimatedProcessingTime)) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/files/${fileId}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          estimatedProcessingTime: estimatedProcessingTime || null
        })
      });

      const data = await response.json();
      if (data.success) {
        const statusChanged = newStatus !== file.status;
        const timeChanged = estimatedProcessingTime !== file.estimatedProcessingTime;
        
        if (statusChanged && timeChanged) {
          toast.success('Status and estimated time updated successfully');
        } else if (statusChanged) {
          toast.success('Status updated successfully');
        } else if (timeChanged) {
          toast.success('Estimated processing time updated successfully');
        }
        
        fetchFileDetails();
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePriceUpdate = async () => {
    if (!file || newPrice === file.price.toString()) return;

    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/files/${fileId}/set-price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Price updated successfully');
        fetchFileDetails();
      } else {
        toast.error(data.error || 'Failed to update price');
      }
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Failed to update price');
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentStatusUpdate = async () => {
    if (!file || newPaymentStatus === file.paymentStatus) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/files/${fileId}/set-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newPaymentStatus })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Payment status updated successfully');
        fetchFileDetails();
      } else {
        toast.error(data.error || 'Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    } finally {
      setUpdating(false);
    }
  };

  const handleNotesUpdate = async () => {
    if (!file || newAdminNotes === (file.adminNotes || '')) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/files/${fileId}/add-note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: newAdminNotes })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Notes updated successfully');
        fetchFileDetails();
      } else {
        toast.error(data.error || 'Failed to update notes');
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Failed to update notes');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownload = async () => {
    if (!file?.downloadUrl) {
      toast.error('Download URL not available');
      return;
    }

    setDownloading(true);

    try {
      const link = document.createElement('a');
      link.href = file.downloadUrl;
      link.download = file.originalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`/api/admin/files/${fileId}/upload-modified`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'Modified file uploaded successfully and status changed to READY');
        fetchFileDetails(); // Refresh file details
      } else {
        toast.error(data.error || 'Failed to upload modified file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload modified file');
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return { color: 'bg-blue-500', icon: Clock, text: 'Received' };
      case 'PENDING':
        return { color: 'bg-yellow-500', icon: Settings, text: 'In Progress' };
      case 'READY':
        return { color: 'bg-green-500', icon: CheckCircle, text: 'Ready' };
      default:
        return { color: 'bg-gray-500', icon: AlertCircle, text: status };
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

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }


  if (error) {
    return (
      <AdminHeaderLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Link href="/admin/files">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Files
              </Button>
            </Link>
          </div>
        </div>
      </AdminHeaderLayout>
    );
  }

  if (!file) {
    return null;
  }

  const statusInfo = getStatusInfo(file.status);
  const StatusIcon = statusInfo.icon;

  return (
    <AdminGuard>
      <AdminHeaderLayout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/files">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Files
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{file.originalFilename}</h1>
            <p className="text-muted-foreground mt-2">
              Admin file management and processing
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                  <p className="text-sm">{file.user.firstName} {file.user.lastName}</p>
                </div>
                <Separator />
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-sm">{file.user.email}</p>
                </div>
              </CardContent>
            </Card>

            {/* Modifications */}
            <Card>
              <CardHeader>
                <CardTitle>Requested Modifications</CardTitle>
                <CardDescription>
                  Services requested by the customer
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
                    Customer Comments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{file.customerComment}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audit Log */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  Activity Log
                </CardTitle>
                <CardDescription>
                  History of all changes made to this file
                </CardDescription>
              </CardHeader>
              <CardContent>
                {file.auditLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity yet</p>
                ) : (
                  <div className="space-y-3">
                    {file.auditLogs.map((log) => (
                      <div key={log.id} className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{log.action}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(log.createdAt)}
                            </p>
                          </div>
                          {log.oldValue && log.newValue && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Changed from "{log.oldValue}" to "{log.newValue}"
                            </p>
                          )}
                          {log.actor && (
                            <p className="text-xs text-muted-foreground mt-1">
                              by {log.actor.firstName} {log.actor.lastName}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* File Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  File Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="flex items-center mt-1">
                    <Badge className={`${statusInfo.color} text-white`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.text}
                    </Badge>
                  </div>
                </div>

                {/* Estimated Processing Time Display */}
                {file.estimatedProcessingTime && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Estimated Processing Time</Label>
                      <div className="flex items-center text-sm mt-1">
                        <Clock className="h-4 w-4 mr-1" />
                        {file.estimatedProcessingTime} minutes
                      </div>
                    </div>
                  </>
                )}
                
                <Separator />
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">File Size</Label>
                  <p className="text-sm">{formatFileSize(file.fileSize)}</p>
                </div>
                
                <Separator />
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Upload Date</Label>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(file.uploadDate)}
                  </div>
                </div>
                
                {file.updatedDate && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(file.updatedDate)}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {file.downloadUrl && (
                  <Button 
                    onClick={handleDownload} 
                    disabled={downloading}
                    variant="outline"
                    className="w-full"
                    title={file.originalFilename}
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        <span className="truncate max-w-[200px]" title={file.originalFilename}>
                          {file.originalFilename}
                        </span>
                      </>
                    )}
                  </Button>
                )}

                {file.modifiedFilename && (
                  <Button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = file.modifiedDownloadUrl || '#';
                      link.download = file.modifiedFilename || 'modified_file';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    title={file.modifiedFilename}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    <span className="truncate max-w-[200px]" title={file.modifiedFilename}>
                      {file.modifiedFilename}
                    </span>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Status Management */}
            <Card>
              <CardHeader>
                <CardTitle>Status Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">File Status</Label>
                  <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RECEIVED">Received</SelectItem>
                      <SelectItem value="PENDING">In Progress</SelectItem>
                      <SelectItem value="READY">Ready</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Estimated Processing Time - only show when status is PENDING */}
                {newStatus === 'PENDING' && (
                  <div className="space-y-2">
                    <Label htmlFor="estimatedTime">Estimated Processing Time</Label>
                    <Select 
                      value={estimatedProcessingTime?.toString() || ''} 
                      onValueChange={(value) => setEstimatedProcessingTime(value ? parseInt(value) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select estimated time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="10">10 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="20">20 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <Button 
                  onClick={handleStatusUpdate}
                  disabled={updating || (newStatus === file.status && estimatedProcessingTime === file.estimatedProcessingTime)}
                  className="w-full"
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Update Status
                </Button>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (DA)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                
                <Button 
                  onClick={handlePriceUpdate}
                  disabled={updating || newPrice === file.price.toString()}
                  className="w-full"
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Update Price
                </Button>
              </CardContent>
            </Card>

            {/* Payment Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment">Payment Status</Label>
                  <Select value={newPaymentStatus} onValueChange={(value: any) => setNewPaymentStatus(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOT_PAID">Not Paid</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handlePaymentStatusUpdate}
                  disabled={updating || newPaymentStatus === file.paymentStatus}
                  className="w-full"
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Update Payment
                </Button>
              </CardContent>
            </Card>

            {/* Admin Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Admin Notes</CardTitle>
                <CardDescription>
                  Internal notes for this file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={newAdminNotes}
                  onChange={(e) => setNewAdminNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  rows={4}
                />
                
                <Button 
                  onClick={handleNotesUpdate}
                  disabled={updating || newAdminNotes === (file.adminNotes || '')}
                  className="w-full"
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Update Notes
                </Button>
              </CardContent>
            </Card>

            {/* Modified File Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Modified File</CardTitle>
                <CardDescription>
                  Upload the tuned/modified file for the customer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {file.modifiedFilename ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800">
                        Modified file uploaded
                      </p>
                      <p className="text-xs text-green-600 truncate" title={file.modifiedFilename}>
                        {file.modifiedFilename} ({file.modifiedFileSize ? formatFileSize(file.modifiedFileSize) : 'Unknown size'})
                      </p>
                      {file.modifiedUploadDate && (
                        <p className="text-xs text-green-600">
                          Uploaded: {formatDate(file.modifiedUploadDate)}
                        </p>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.bin,.hex,.ecu,.map,.ori,.mod,.kess,.ktag,.pcm,.edc,.damos,.a2l';
                        input.onchange = (e) => handleFileUpload(e as unknown as React.ChangeEvent<HTMLInputElement>);
                        input.click();
                      }}
                      disabled={uploading}
                      className="w-full"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Replace Modified File
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800">
                        No modified file uploaded yet
                      </p>
                      <p className="text-xs text-yellow-600">
                        Upload the tuned file for the customer to download
                      </p>
                    </div>
                    <Button 
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.bin,.hex,.ecu,.map,.ori,.mod,.kess,.ktag,.pcm,.edc,.damos,.a2l';
                        input.onchange = (e) => handleFileUpload(e as unknown as React.ChangeEvent<HTMLInputElement>);
                        input.click();
                      }}
                      disabled={uploading}
                      className="w-full"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Upload Modified File
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </AdminHeaderLayout>
    </AdminGuard>
  );
}

