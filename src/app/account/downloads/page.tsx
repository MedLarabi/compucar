"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  FileText,
  Calendar,
  Key,
  HardDrive,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface DownloadItem {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  productVersion?: string;
  downloadUrl: string;
  licenseKey?: string;
  downloadCount: number;
  downloadLimit: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  lastDownloadAt?: string;
  orderNumber: string;
  fileSize?: string;
  systemRequirements?: string;
}

// Mock data - in a real app this would come from your API
const mockDownloads: DownloadItem[] = [
  {
    id: '1',
    productId: 'prod-1',
    productSlug: 'professional-photo-editor-pro',
    productName: 'Professional Photo Editor Pro',
    productVersion: 'v2.5.1',
    downloadUrl: '/api/downloads/photo-editor-pro.zip',
    licenseKey: 'PE-2024-XXXX-YYYY-ZZZZ',
    downloadCount: 1,
    downloadLimit: 3,
    expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    lastDownloadAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    orderNumber: 'ORD-001',
    fileSize: '245 MB',
    systemRequirements: 'Windows 10/11, macOS 10.15+',
  },
  {
    id: '2',
    productId: 'prod-2',
    productSlug: 'website-builder-suite',
    productName: 'Website Builder Suite',
    productVersion: 'v1.8.0',
    downloadUrl: '/api/downloads/website-builder.zip',
    licenseKey: 'WB-2024-AAAA-BBBB-CCCC',
    downloadCount: 0,
    downloadLimit: 5,
    expiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    orderNumber: 'ORD-002',
    fileSize: '156 MB',
    systemRequirements: 'Cross-platform',
  },
  {
    id: '3',
    productId: 'prod-3',
    productSlug: 'advanced-analytics-dashboard',
    productName: 'Advanced Analytics Dashboard',
    productVersion: 'v3.2.1',
    downloadUrl: '/api/downloads/analytics-dashboard.zip',
    licenseKey: 'AD-2024-DDDD-EEEE-FFFF',
    downloadCount: 2,
    downloadLimit: 3,
    expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: false,
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    lastDownloadAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    orderNumber: 'ORD-003',
    fileSize: '89 MB',
    systemRequirements: 'Node.js 16+, Docker',
  },
];

export default function DownloadsPage() {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/user/downloads');
        
        if (!response.ok) {
          throw new Error('Failed to fetch downloads');
        }
        
        const data = await response.json();
        setDownloads(data);
      } catch (error) {
        console.error('Error fetching downloads:', error);
        toast.error(t('downloads.failedToLoad'));
        // Fallback to mock data for demo
        setDownloads(mockDownloads);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDownloads();
  }, []);

  const handleDownload = async (download: DownloadItem) => {
    if (!download.isActive) {
      toast.error(t('downloads.notAvailable'));
      return;
    }

    try {
      const response = await fetch(`/api/user/downloads/${download.id}/download`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      const data = await response.json();
      toast.success(t('downloads.downloadStarted'));
      
      // Update download count locally
      setDownloads(prev => prev.map(d => 
        d.id === download.id 
          ? { 
              ...d, 
              downloadCount: data.downloadCount, 
              lastDownloadAt: new Date().toISOString() 
            }
          : d
      ));

      // Start download
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error instanceof Error ? error.message : t('downloads.downloadFailed'));
    }
  };

  const copyLicenseKey = (licenseKey: string) => {
    navigator.clipboard.writeText(licenseKey);
    toast.success(t('downloads.licenseKeyCopied'));
  };

  const getExpiryStatus = () => {
    // Always return active status for unlimited downloads
    return { status: 'active', text: t('downloads.unlimited'), color: 'text-green-600' };
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-2"></div>
            <div className="h-4 bg-muted rounded w-96"></div>
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-48"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Download className="h-8 w-8" />
            {t('downloads.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('downloads.description')}
          </p>
        </div>

        {/* Downloads Statistics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('downloads.totalDownloads')}</p>
                  <p className="text-3xl font-bold">{downloads.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('downloads.active')}</p>
                  <p className="text-3xl font-bold">{downloads.filter(d => d.isActive).length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('downloads.expired')}</p>
                  <p className="text-3xl font-bold">{downloads.filter(d => !d.isActive).length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('downloads.downloadsAvailable')}</p>
                  <p className="text-3xl font-bold">{t('downloads.unlimited')}</p>
                </div>
                <Download className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Downloads List */}
        {downloads.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Download className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('downloads.noDownloadsAvailable')}</h3>
              <p className="text-muted-foreground mb-6">
                {t('downloads.noDownloadsDescription')}
              </p>
              <Link href="/products">
                <Button>{t('downloads.browseSoftware')}</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {downloads.map((download) => {
              const expiryStatus = getExpiryStatus();

              return (
                <Card key={download.id} className={!download.isActive ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {download.productName}
                          {download.productVersion && (
                            <Badge variant="outline">{download.productVersion}</Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {t('downloads.orderNumber', { number: download.orderNumber })} • {t('downloads.purchased')} {formatDistanceToNow(new Date(download.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={download.isActive ? "default" : "secondary"}
                          className={expiryStatus.color}
                        >
                          {download.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {t('downloads.active')}
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {t('downloads.expired')}
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Product Info */}
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      {download.fileSize && (
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{t('downloads.fileSize')}:</span>
                          <span>{download.fileSize}</span>
                        </div>
                      )}
                      {download.systemRequirements && (
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{t('downloads.requirements')}:</span>
                          <span>{download.systemRequirements}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t('downloads.downloads')}:</span>
                        <span className={expiryStatus.color}>{expiryStatus.text}</span>
                      </div>
                      {download.lastDownloadAt && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{t('downloads.lastDownload')}:</span>
                          <span>{formatDistanceToNow(new Date(download.lastDownloadAt), { addSuffix: true })}</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* License Key */}
                    {download.licenseKey && (
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{t('downloads.licenseKey')}:</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyLicenseKey(download.licenseKey!)}
                          >
                            {t('downloads.copy')}
                          </Button>
                        </div>
                        <code className="text-sm font-mono bg-background px-2 py-1 rounded mt-2 block">
                          {download.licenseKey}
                        </code>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleDownload(download)}
                          disabled={!download.isActive}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          {t('downloads.download')}
                        </Button>
                        
                        {download.productSlug ? (
                          <Link href={`/products/${download.productSlug}`}>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              {t('downloads.viewProduct')}
                            </Button>
                          </Link>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {t('downloads.productUnavailable')}
                          </Button>
                        )}
                      </div>

                      {!download.isActive && (
                        <Link href="/products">
                          <Button variant="outline" size="sm">
                            {t('downloads.buyAgain')}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
