"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { 
  Upload, 
  FileText, 
  Search,
  Filter,
  Eye,
  Download,
  Calendar,
  DollarSign,
  CreditCard,
  Loader2,
  AlertCircle,
  RefreshCw,
  Plus,
  Wifi,
  WifiOff,
  Settings,
  RotateCcw,
  GripHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';

interface TuningFile {
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
  modifications: Array<{
    id: number;
    code: string;
    label: string;
  }>;
  createdAt: string;
}

interface FilesResponse {
  success: boolean;
  data: TuningFile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: {
    totalPaid: number;
    totalUnpaid: number;
    totalAmount: number;
  };
}

import { TuningLayout } from '@/components/tuning/tuning-layout';

export default function CustomerFilesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  
  const [files, setFiles] = useState<TuningFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });
  const [summary, setSummary] = useState({
    totalPaid: 0,
    totalUnpaid: 0,
    totalAmount: 0
  });

  // Column width management
  const defaultColumnWidths = {
    orderId: 120,
    date: 140,
    fileName: 300,
    price: 100,
    status: 120,
    actions: 100
  };

  const [columnWidths, setColumnWidths] = useState(defaultColumnWidths);
  const [showColumnControls, setShowColumnControls] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // Load saved column widths from localStorage
  useEffect(() => {
    const savedWidths = localStorage.getItem('files-table-column-widths');
    if (savedWidths) {
      try {
        const parsedWidths = JSON.parse(savedWidths);
        setColumnWidths({ ...defaultColumnWidths, ...parsedWidths });
      } catch (error) {
        console.error('Failed to parse saved column widths:', error);
      }
    }
  }, []);

  // Save column widths to localStorage
  const saveColumnWidths = (widths: typeof columnWidths) => {
    localStorage.setItem('files-table-column-widths', JSON.stringify(widths));
  };

  // Handle column resize start
  const handleResizeStart = (columnKey: string, e: React.MouseEvent) => {
    setIsResizing(columnKey);
    setStartX(e.clientX);
    setStartWidth(columnWidths[columnKey as keyof typeof columnWidths]);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    e.preventDefault();
  };

  // Handle mouse move during resize
  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startX;
    const newWidth = Math.max(80, startWidth + deltaX); // Minimum width of 80px
    
    setColumnWidths(prev => ({
      ...prev,
      [isResizing]: newWidth
    }));
  };

  // Handle mouse up to end resize
  const handleMouseUp = () => {
    if (isResizing) {
      saveColumnWidths(columnWidths);
      setIsResizing(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  };

  // Reset column widths
  const resetColumnWidths = () => {
    setColumnWidths(defaultColumnWidths);
    saveColumnWidths(defaultColumnWidths);
  };

  // Cleanup event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Real-time updates
  const { isConnected, lastMessage } = useRealTimeUpdates({
    onFileStatusUpdate: (data) => {
      console.log('📡 File status update received:', data);
      
      // Update the file in the list
      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.id === data.fileId 
            ? { ...file, status: data.newStatus as 'RECEIVED' | 'PENDING' | 'READY' }
            : file
        )
      );
      
      // Show toast notification
      toast.success(`File "${data.fileName}" status updated to ${data.newStatus}`, {
        description: 'Your file status has been updated by our team.',
        duration: 5000
      });
    },
    
    onEstimatedTimeUpdate: (data) => {
      console.log('📡 Estimated time update received:', data);
      
      // Update the file in the list
      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.id === data.fileId 
            ? { 
                ...file, 
                status: 'PENDING',
                // Note: We don't have estimatedProcessingTime in the list interface,
                // but the individual file page will show the updated time
              }
            : file
        )
      );
      
      // Show toast notification
      toast.info(`Estimated processing time set: ${data.timeText}`, {
        description: `File "${data.fileName}" processing time has been estimated.`,
        duration: 5000
      });
    },
    
    onConnection: () => {
      console.log('📡 Real-time updates connected');
    },
    
    onError: (error) => {
      console.error('📡 Real-time updates error:', error);
    }
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Fetch files
  useEffect(() => {
    if (session) {
      fetchFiles();
    }
  }, [session, pagination.page, filters]);

  const fetchFiles = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const searchParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/files?${searchParams}&_t=${Date.now()}`);
      const data: FilesResponse = await response.json();

      if (data.success) {
        console.log('Files fetched successfully:', data.data.length, 'files');
        console.log('Most recent file:', data.data[0]?.originalFilename);
        setFiles(data.data);
        setPagination(data.pagination);
        setSummary(data.summary);
      } else {
        console.error('Failed to fetch files:', data);
        toast.error(t('files.errors.fetchFailed'));
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error(t('files.errors.fetchFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchFiles(true);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED': return 'bg-blue-500 hover:bg-blue-600';
      case 'PENDING': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'READY': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-500 hover:bg-green-600';
      case 'NOT_PAID': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
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
      <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        {/* Title and Description */}
        <div className="text-center sm:text-left mb-6">
          <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
            <h1 className="text-3xl font-bold">{t('files.title')}</h1>
            {/* Real-time connection status */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Wifi className="h-4 w-4" />
                  <span className="text-xs">Live</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-400">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-xs">Offline</span>
                </div>
              )}
            </div>
          </div>
          <p className="text-muted-foreground">
            {t('files.description')}
          </p>
        </div>
        
        {/* Upload Button - Centered on mobile, right-aligned on desktop */}
        <div className="flex justify-center sm:justify-end">
          <Link href="/files/upload">
            <Button size="lg" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              {t('files.uploadNewFile')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('files.stats.totalOrders')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('files.stats.ready')}</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {files.filter(f => f.status === 'READY').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('files.stats.inProgress')}</CardTitle>
            <div className="h-2 w-2 bg-yellow-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {files.filter(f => f.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('files.stats.received')}</CardTitle>
            <div className="h-2 w-2 bg-blue-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {files.filter(f => f.status === 'RECEIVED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            {t('files.filters.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('files.filters.searchPlaceholder')}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t('files.filters.statusPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('files.filters.allFiles')}</SelectItem>
                <SelectItem value="RECEIVED">{t('files.filters.received')}</SelectItem>
                <SelectItem value="PENDING">{t('files.filters.inProgress')}</SelectItem>
                <SelectItem value="READY">{t('files.filters.ready')}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setShowColumnControls(!showColumnControls)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Columns
            </Button>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Column Width Controls */}
          {showColumnControls && (
            <div className="mt-4 p-4 bg-muted/20 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium">Column Widths</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetColumnWidths}
                  className="text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Order ID: {columnWidths.orderId}px</label>
                  <Slider
                    value={[columnWidths.orderId]}
                    onValueChange={(value) => {
                      const newWidths = { ...columnWidths, orderId: value[0] };
                      setColumnWidths(newWidths);
                      saveColumnWidths(newWidths);
                    }}
                    max={200}
                    min={80}
                    step={10}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Date: {columnWidths.date}px</label>
                  <Slider
                    value={[columnWidths.date]}
                    onValueChange={(value) => {
                      const newWidths = { ...columnWidths, date: value[0] };
                      setColumnWidths(newWidths);
                      saveColumnWidths(newWidths);
                    }}
                    max={200}
                    min={80}
                    step={10}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">File Name: {columnWidths.fileName}px</label>
                  <Slider
                    value={[columnWidths.fileName]}
                    onValueChange={(value) => {
                      const newWidths = { ...columnWidths, fileName: value[0] };
                      setColumnWidths(newWidths);
                      saveColumnWidths(newWidths);
                    }}
                    max={600}
                    min={150}
                    step={10}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Price: {columnWidths.price}px</label>
                  <Slider
                    value={[columnWidths.price]}
                    onValueChange={(value) => {
                      const newWidths = { ...columnWidths, price: value[0] };
                      setColumnWidths(newWidths);
                      saveColumnWidths(newWidths);
                    }}
                    max={150}
                    min={80}
                    step={10}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Status: {columnWidths.status}px</label>
                  <Slider
                    value={[columnWidths.status]}
                    onValueChange={(value) => {
                      const newWidths = { ...columnWidths, status: value[0] };
                      setColumnWidths(newWidths);
                      saveColumnWidths(newWidths);
                    }}
                    max={150}
                    min={80}
                    step={10}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Actions: {columnWidths.actions}px</label>
                  <Slider
                    value={[columnWidths.actions]}
                    onValueChange={(value) => {
                      const newWidths = { ...columnWidths, actions: value[0] };
                      setColumnWidths(newWidths);
                      saveColumnWidths(newWidths);
                    }}
                    max={150}
                    min={80}
                    step={10}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                You can also drag the column borders to resize them manually
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('files.table.title')}</CardTitle>
          <CardDescription>
            {loading ? t('files.table.loading') : `${pagination.total} ${t('files.table.totalOrders')}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="grid grid-cols-6 gap-4 p-4 border rounded-lg animate-pulse">
                  <div className="h-4 bg-muted rounded w-16" />
                  <div className="h-4 bg-muted rounded w-20" />
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-4 bg-muted rounded w-16" />
                  <div className="h-4 bg-muted rounded w-20" />
                  <div className="h-4 bg-muted rounded w-16" />
                </div>
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('files.empty.title')}</h3>
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.status !== 'all' 
                  ? t('files.empty.noMatch')
                  : t('files.empty.getStarted')
                }
              </p>
              <Link href="/files/upload">
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  {t('files.empty.uploadFile')}
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full" style={{ tableLayout: 'fixed' }}>
                  {/* Table Header */}
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th 
                        className="text-left p-4 font-medium text-sm relative"
                        style={{ width: `${columnWidths.orderId}px` }}
                      >
                        {t('files.table.headers.orderId')}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-0.5 cursor-col-resize bg-gray-400 hover:bg-gray-600 hover:w-1 transition-all duration-200"
                          onMouseDown={(e) => handleResizeStart('orderId', e)}
                          title="Drag to resize column"
                        />
                      </th>
                      <th 
                        className="text-left p-4 font-medium text-sm relative"
                        style={{ width: `${columnWidths.date}px` }}
                      >
                        {t('files.table.headers.date')}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-0.5 cursor-col-resize bg-gray-400 hover:bg-gray-600 hover:w-1 transition-all duration-200"
                          onMouseDown={(e) => handleResizeStart('date', e)}
                          title="Drag to resize column"
                        />
                      </th>
                      <th 
                        className="text-left p-4 font-medium text-sm relative"
                        style={{ width: `${columnWidths.fileName}px` }}
                      >
                        {t('files.table.headers.fileName')}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-0.5 cursor-col-resize bg-gray-400 hover:bg-gray-600 hover:w-1 transition-all duration-200"
                          onMouseDown={(e) => handleResizeStart('fileName', e)}
                          title="Drag to resize column"
                        />
                      </th>
                      <th 
                        className="text-left p-4 font-medium text-sm relative"
                        style={{ width: `${columnWidths.price}px` }}
                      >
                        {t('files.table.headers.price')}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-0.5 cursor-col-resize bg-gray-400 hover:bg-gray-600 hover:w-1 transition-all duration-200"
                          onMouseDown={(e) => handleResizeStart('price', e)}
                          title="Drag to resize column"
                        />
                      </th>
                      <th 
                        className="text-left p-4 font-medium text-sm relative"
                        style={{ width: `${columnWidths.status}px` }}
                      >
                        {t('files.table.headers.status')}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-0.5 cursor-col-resize bg-gray-400 hover:bg-gray-600 hover:w-1 transition-all duration-200"
                          onMouseDown={(e) => handleResizeStart('status', e)}
                          title="Drag to resize column"
                        />
                      </th>
                      <th 
                        className="text-left p-4 font-medium text-sm"
                        style={{ width: `${columnWidths.actions}px` }}
                      >
                        {t('files.table.headers.actions')}
                      </th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody>
                    {files.map((file, index) => (
                      <tr 
                        key={file.id} 
                        className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => router.push(`/files/${file.id}`)}
                      >
                        {/* Order ID */}
                        <td className="p-4" style={{ width: `${columnWidths.orderId}px` }}>
                          <span className="font-mono text-sm text-muted-foreground">
                            #{file.id.slice(-8).toUpperCase()}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="p-4" style={{ width: `${columnWidths.date}px` }}>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            {formatDate(file.uploadDate)}
                          </div>
                        </td>

                        {/* File Name */}
                        <td className="p-4" style={{ width: `${columnWidths.fileName}px` }}>
                          <div className="flex items-center min-w-0">
                            <FileText className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
                            <span 
                              className="font-medium overflow-hidden text-ellipsis whitespace-nowrap" 
                              title={file.originalFilename}
                            >
                              {file.originalFilename}
                            </span>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="p-4" style={{ width: `${columnWidths.price}px` }}>
                          <div className="text-sm">
                            {file.price > 0 ? (
                              <div className={`flex items-center font-medium ${
                                file.paymentStatus === 'PAID' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {file.price.toFixed(0)} DA
                              </div>
                            ) : (
                              <span className="text-muted-foreground">{t('files.price.free')}</span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-4" style={{ width: `${columnWidths.status}px` }}>
                          <Badge className={`${getStatusColor(file.status)} text-white text-xs`}>
                            {file.status}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="p-4" style={{ width: `${columnWidths.actions}px` }}>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/files/${file.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {t('files.actions.view')}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => router.push(`/files/${file.id}`)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-sm text-muted-foreground">
                        #{file.id.slice(-8).toUpperCase()}
                      </span>
                      <Badge className={`${getStatusColor(file.status)} text-white text-xs`}>
                        {file.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center min-w-0 mb-3">
                      <FileText className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
                      <span className="font-medium break-all" title={file.originalFilename}>
                        {file.originalFilename}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(file.uploadDate)}
                      </div>
                      <div className="flex items-center">
                        {file.price > 0 ? (
                          <div className={`flex items-center font-medium ${
                            file.paymentStatus === 'PAID' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {file.price.toFixed(0)} DA
                          </div>
                        ) : (
                          <span className="text-muted-foreground">{t('files.price.free')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                {t('files.pagination.showing')} {((pagination.page - 1) * pagination.limit) + 1} {t('files.pagination.to')}{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} {t('files.pagination.of')}{' '}
                {pagination.total} {t('files.pagination.orders')}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  {t('files.pagination.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  {t('files.pagination.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            {t('files.summary.title')}
          </CardTitle>
          <CardDescription>
            {t('files.summary.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {summary.totalUnpaid.toFixed(0)} DA
            </div>
            <div className="text-sm text-muted-foreground">{t('files.summary.totalUnpaid')}</div>
          </div>
        </CardContent>
      </Card>
    </div>
    </TuningLayout>
  );
}
