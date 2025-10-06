"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Key,
  Copy,
  Package,
  Calendar,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface LicenseKey {
  id: string;
  keyValue: string;
  decryptedKey: string;
  status: "AVAILABLE" | "ASSIGNED" | "USED" | "REVOKED";
  assignedAt: string;
  usedAt: string | null;
  product: {
    name: string;
    sku: string;
  };
  assignedToOrder: {
    orderNumber: string;
    createdAt: string;
  };
}

export default function LicenseKeysPage() {
  const { data: session } = useSession();
  const [licenseKeys, setLicenseKeys] = useState<LicenseKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchLicenseKeys = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/user/license-keys');
        
        if (!response.ok) {
          throw new Error('Failed to fetch license keys');
        }
        
        const data = await response.json();
        setLicenseKeys(data.licenseKeys);
      } catch (error) {
        console.error('Error fetching license keys:', error);
        toast.error('Failed to load license keys');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLicenseKeys();
  }, []);

  const copyLicenseKey = (key: string, productName: string) => {
    navigator.clipboard.writeText(key);
    toast.success(`License key for ${productName} copied to clipboard!`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return <Badge className="bg-blue-100 text-blue-800">{t('licenseKeys.active')}</Badge>;
      case "USED":
        return <Badge className="bg-green-100 text-green-800">{t('licenseKeys.activated')}</Badge>;
      case "REVOKED":
        return <Badge className="bg-red-100 text-red-800">{t('licenseKeys.revoked')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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
            <Key className="h-8 w-8" />
            {t('dashboard.licenseKeys')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('dashboard.licenseKeysDesc')}
          </p>
        </div>

        {/* License Keys Statistics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('licenseKeys.totalKeys')}</p>
                  <p className="text-3xl font-bold">{licenseKeys.length}</p>
                </div>
                <Key className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('licenseKeys.active')}</p>
                  <p className="text-3xl font-bold">{licenseKeys.filter(k => k.status === "ASSIGNED").length}</p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('licenseKeys.activated')}</p>
                  <p className="text-3xl font-bold">{licenseKeys.filter(k => k.status === "USED").length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* License Keys List */}
        {licenseKeys.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Key className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No license keys found</h3>
              <p className="text-muted-foreground mb-6">
                {t('licenseKeys.licenseKeysDescription')}
              </p>
              <Link href="/products">
                <Button>{t('licenseKeys.browseSoftware')}</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {licenseKeys.map((license) => (
              <Card key={license.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        {license.product.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Order #{license.assignedToOrder.orderNumber} • Purchased {formatDistanceToNow(new Date(license.assignedToOrder.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(license.status)}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Product Info */}
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">SKU:</span>
                      <span>{license.product.sku}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('licenseKeys.assigned')}:</span>
                      <span>{formatDistanceToNow(new Date(license.assignedAt), { addSuffix: true })}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* License Key */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        License Key
                      </h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyLicenseKey(license.decryptedKey, license.product.name)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <code className="text-sm font-mono break-all">
                        {license.decryptedKey}
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use this license key to activate your software. Keep it safe and don't share it with others.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4">
                    <Link href={`/account/orders/${license.assignedToOrder.orderNumber}`}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Order
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

