"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Search,
  Filter,
  Eye,
  Download,
  Calendar,
  User,
  DollarSign,
  CreditCard,
  Loader2,
  RefreshCw,
  Settings,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';
import { AdminHeaderLayout } from '@/components/admin/admin-header-layout';
import { AdminGuard } from '@/components/admin/admin-guard';

interface AdminFile {
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
  createdAt: string;
}

interface AdminFilesResponse {
  success: boolean;
  data: AdminFile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: {
    RECEIVED: number;
    PENDING: number;
    READY: number;
  };
  summary: {
    totalPaid: number;
    totalUnpaid: number;
    totalAmount: number;
  };
}

export default function AdminFilesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [files, setFiles] = useState<AdminFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [stats, setStats] = useState({
    RECEIVED: 0,
    PENDING: 0,
    READY: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    paymentStatus: 'all',
    customerId: 'all',
    search: ''
  });
  const [customers, setCustomers] = useState<Array<{id: string, name: string, email: string}>>([]);
  const [summary, setSummary] = useState({
    totalPaid: 0,
    totalUnpaid: 0,
    totalAmount: 0
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Fetch files and customers
  useEffect(() => {
    if (session) {
      fetchFiles();
      fetchCustomers();
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
        ...(filters.paymentStatus !== 'all' && { paymentStatus: filters.paymentStatus }),
        ...(filters.customerId !== 'all' && { customerId: filters.customerId }),
        ...(filters.search && { search: filters.search })
      });

      console.log('Admin: Fetching files with params:', searchParams.toString());
      console.log('Admin: Session user:', session?.user);

      const response = await fetch(`/api/admin/files?${searchParams}&_t=${Date.now()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Admin: Response status:', response.status);
      console.log('Admin: Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Admin: API error response:', errorText);
        toast.error(`API Error: ${response.status} - ${errorText}`);
        return;
      }

      const data: AdminFilesResponse = await response.json();
      console.log('Admin: Raw API response:', data);

      if (data.success) {
        console.log('Admin: Files fetched successfully:', data.data.length, 'files');
        console.log('Admin: Most recent file:', data.data[0]?.originalFilename);
        console.log('Admin: Total files:', data.pagination.total);
        setFiles(data.data);
        setPagination(data.pagination);
        setStats(data.stats);
        setSummary(data.summary);
      } else {
        console.error('Admin: Failed to fetch files:', data);
        toast.error('Failed to fetch files');
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to fetch files');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers');
      const data = await response.json();
      
      if (data.success) {
        setCustomers(data.data.map((customer: any) => ({
          id: customer.id,
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email
        })));
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleRefresh = () => {
    fetchFiles(true);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleRowClick = (fileId: string) => {
    router.push(`/admin/files/${fileId}`);
  };

  const handleQuickStatusChange = async (fileId: string, newStatus: 'RECEIVED' | 'PENDING' | 'READY') => {
    try {
      const response = await fetch(`/api/admin/files/${fileId}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Status updated to ${newStatus}`);
        fetchFiles(true);
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED': return 'bg-blue-500 hover:bg-blue-600';
      case 'PENDING': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'READY': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RECEIVED': return Clock;
      case 'PENDING': return Settings;
      case 'READY': return CheckCircle;
      default: return AlertCircle;
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


  return (
    <AdminGuard>
      <AdminHeaderLayout>
        <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">File Management</h1>
            <p className="text-muted-foreground">
              Manage customer file uploads and processing
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pagination.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Received</CardTitle>
              <div className="h-2 w-2 bg-blue-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.RECEIVED}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <div className="h-2 w-2 bg-yellow-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.PENDING}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ready</CardTitle>
              <div className="h-2 w-2 bg-green-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.READY}</div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Box */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {summary.totalPaid.toFixed(0)} DA
              </div>
              <div className="text-sm text-muted-foreground">Total Paid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {summary.totalUnpaid.toFixed(0)} DA
              </div>
              <div className="text-sm text-muted-foreground">Total Unpaid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {summary.totalAmount.toFixed(0)} DA
              </div>
              <div className="text-sm text-muted-foreground">Total Amount</div>
            </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by filename or customer..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
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
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="RECEIVED">Received</SelectItem>
                    <SelectItem value="PENDING">In Progress</SelectItem>
                    <SelectItem value="READY">Ready</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={filters.paymentStatus}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, paymentStatus: value }))}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Payment Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="NOT_PAID">Not Paid</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={filters.customerId}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, customerId: value }))}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Files List */}
        <Card>
          <CardHeader>
            <CardTitle>Files Queue</CardTitle>
            <CardDescription>
              {loading ? 'Loading...' : `${pagination.total} total files`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg animate-pulse">
                    <div className="flex space-x-4">
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No files found</h3>
                <p className="text-muted-foreground">
                  {filters.search || filters.status !== 'all' 
                    ? 'No files match your current filters'
                    : 'No files have been uploaded yet'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {files.map((file) => {
                  const StatusIcon = getStatusIcon(file.status);
                  return (
                    <div 
                      key={file.id} 
                      className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleRowClick(file.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {/* File Info */}
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                            <h3 className="font-semibold text-lg truncate">{file.originalFilename}</h3>
                            <Badge className={`${getStatusColor(file.status)} text-white`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {file.status}
                            </Badge>
                            <Badge className={`${getPaymentStatusColor(file.paymentStatus)} text-white`}>
                              <CreditCard className="h-3 w-3 mr-1" />
                              {file.paymentStatus === 'PAID' ? 'Paid' : 'Not Paid'}
                            </Badge>
                          </div>

                          {/* Customer Info */}
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {file.user.firstName} {file.user.lastName}
                            </div>
                            <span>{file.user.email}</span>
                            <span>{formatFileSize(file.fileSize)}</span>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(file.uploadDate)}
                            </div>
                            {file.price > 0 && (
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-1" />
                                {file.price.toFixed(0)} DA
                              </div>
                            )}
                          </div>

                          {/* Modifications */}
                          {file.modifications && file.modifications.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {file.modifications.slice(0, 4).map((mod) => (
                                <Badge key={mod.id} variant="secondary" className="text-xs">
                                  {mod.label}
                                </Badge>
                              ))}
                              {file.modifications.length > 4 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{file.modifications.length - 4} more
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Customer Comment */}
                          {file.customerComment && (
                            <p className="text-sm text-muted-foreground italic mb-3">
                              Customer: "{file.customerComment}"
                            </p>
                          )}

                          {/* Admin Notes */}
                          {file.adminNotes && (
                            <p className="text-sm text-blue-600 mb-3">
                              Admin: "{file.adminNotes}"
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4" onClick={(e) => e.stopPropagation()}>
                          {/* Quick Status Actions */}
                          {file.status === 'RECEIVED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickStatusChange(file.id, 'PENDING')}
                            >
                              Start Processing
                            </Button>
                          )}
                          {file.status === 'PENDING' && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleQuickStatusChange(file.id, 'READY')}
                            >
                              Mark Ready
                            </Button>
                          )}
                          
                          <Link href={`/admin/files/${file.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              Manage
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} files
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </AdminHeaderLayout>
    </AdminGuard>
  );
}
