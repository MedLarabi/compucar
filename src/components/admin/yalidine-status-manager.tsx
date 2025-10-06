"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Clock, 
  Package, 
  CheckCircle, 
  AlertCircle,
  Play,
  BarChart3,
  Truck
} from 'lucide-react';
import { toast } from 'sonner';

interface StatusCheckStats {
  totalTracked: number;
  pendingOrders: number;
  deliveredToday: number;
  lastCheckTime?: string;
}

interface StatusCheckResult {
  checked: number;
  updated: number;
  delivered: number;
  errorCount: number;
  errors: string[];
}

export function YalidineStatusManager() {
  const [stats, setStats] = useState<StatusCheckStats | null>(null);
  const [lastResult, setLastResult] = useState<StatusCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Load initial stats
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetch('/api/admin/yalidine/status-check');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        toast.error('Failed to load statistics');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const checkAllOrders = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/admin/yalidine/status-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-all' })
      });

      const data = await response.json();
      
      if (data.success) {
        setLastResult(data.results);
        toast.success(data.message);
        
        // Refresh stats after checking
        await loadStats();
      } else {
        toast.error(data.error || 'Failed to check orders');
      }
    } catch (error) {
      console.error('Error checking orders:', error);
      toast.error('Failed to check orders');
    } finally {
      setIsChecking(false);
    }
  };

  const formatLastCheck = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Yalidine Status Monitoring</h2>
          <p className="text-muted-foreground">
            Automatically check delivery statuses and update orders
          </p>
        </div>
        <Button 
          onClick={loadStats} 
          variant="outline" 
          size="sm"
          disabled={isLoadingStats}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingStats ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tracked</p>
                <p className="text-2xl font-bold">{stats?.totalTracked || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold">{stats?.pendingOrders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivered Today</p>
                <p className="text-2xl font-bold">{stats?.deliveredToday || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <RefreshCw className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Check</p>
                <p className="text-sm font-medium">
                  {formatLastCheck(stats?.lastCheckTime)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Status Check Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={checkAllOrders}
              disabled={isChecking}
              className="flex-1"
            >
              {isChecking ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isChecking ? 'Checking...' : 'Check All Pending Orders'}
            </Button>

            <Button 
              variant="outline"
              onClick={loadStats}
              disabled={isLoadingStats}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Statistics
            </Button>
          </div>

          {/* Last Check Results */}
          {lastResult && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <h4 className="font-medium mb-3">Last Check Results</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Checked</p>
                  <p className="font-semibold">{lastResult.checked}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Updated</p>
                  <p className="font-semibold">{lastResult.updated}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Delivered</p>
                  <p className="font-semibold text-green-600">{lastResult.delivered}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Errors</p>
                  <p className="font-semibold text-red-600">{lastResult.errorCount}</p>
                </div>
              </div>

              {lastResult.errors.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-red-600 mb-2">Recent Errors:</p>
                  <div className="space-y-1">
                    {lastResult.errors.slice(0, 3).map((error, index) => (
                      <p key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            • <strong>Automatic Checking:</strong> The system periodically checks Yalidine's API for delivery status updates
          </p>
          <p>
            • <strong>Status Updates:</strong> When a package is delivered, the order status is automatically updated to "DELIVERED"
          </p>
          <p>
            • <strong>Manual Trigger:</strong> Use the "Check All Pending Orders" button to manually trigger a status check
          </p>
          <p>
            • <strong>Monitoring:</strong> View statistics and recent check results to monitor the system's performance
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
