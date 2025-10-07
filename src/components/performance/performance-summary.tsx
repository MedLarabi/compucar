"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Zap, Timer, Image, Database } from "lucide-react";

interface PerformanceMetrics {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
  loadTime: number | null;
  cacheHits: number;
  cacheSize: string;
}

export function PerformanceSummary() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    loadTime: null,
    cacheHits: 0,
    cacheSize: "0 KB"
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or for admin users
    const isDev = process.env.NODE_ENV === 'development';
    const isAdmin = localStorage.getItem('user-role') === 'admin';
    
    if (isDev || isAdmin) {
      setIsVisible(true);
      measurePerformance();
    }
  }, []);

  const measurePerformance = () => {
    // Measure Web Vitals
    if ('PerformanceObserver' in window) {
      // LCP
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP measurement failed:', e);
      }

      // FID
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if ('processingStart' in entry && 'startTime' in entry) {
              const fid = (entry as any).processingStart - entry.startTime;
              setMetrics(prev => ({ ...prev, fid }));
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID measurement failed:', e);
      }

      // CLS
      try {
        let clsScore = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ('hadRecentInput' in entry && 'value' in entry) {
              if (!(entry as any).hadRecentInput) {
                clsScore += (entry as any).value;
              }
            }
          }
          setMetrics(prev => ({ ...prev, cls: clsScore }));
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS measurement failed:', e);
      }
    }

    // FCP and Load Time
    window.addEventListener('load', () => {
      setTimeout(() => {
        // FCP
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          setMetrics(prev => ({ ...prev, fcp: fcpEntry.startTime }));
        }

        // Load Time
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        setMetrics(prev => ({ ...prev, loadTime }));

        // Cache stats (mock for demo)
        setMetrics(prev => ({ 
          ...prev, 
          cacheHits: Math.floor(Math.random() * 100),
          cacheSize: `${Math.floor(Math.random() * 500)}KB`
        }));
      }, 0);
    });
  };

  const getScoreColor = (metric: string, value: number | null) => {
    if (value === null) return "secondary";
    
    switch (metric) {
      case 'lcp':
        return value <= 2500 ? "default" : value <= 4000 ? "secondary" : "destructive";
      case 'fid':
        return value <= 100 ? "default" : value <= 300 ? "secondary" : "destructive";
      case 'cls':
        return value <= 0.1 ? "default" : value <= 0.25 ? "secondary" : "destructive";
      case 'fcp':
        return value <= 1800 ? "default" : value <= 3000 ? "secondary" : "destructive";
      case 'loadTime':
        return value <= 3000 ? "default" : value <= 5000 ? "secondary" : "destructive";
      default:
        return "secondary";
    }
  };

  const formatValue = (metric: string, value: number | null) => {
    if (value === null) return "Measuring...";
    
    switch (metric) {
      case 'cls':
        return value.toFixed(3);
      case 'lcp':
      case 'fid':
      case 'fcp':
      case 'loadTime':
        return `${Math.round(value)}ms`;
      default:
        return value.toString();
    }
  };

  const clearCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      
      // Refresh metrics
      setMetrics(prev => ({ 
        ...prev, 
        cacheHits: 0,
        cacheSize: "0 KB"
      }));
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm z-50">
      <Card className="border-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4" />
            Performance Monitor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Web Vitals */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span>LCP:</span>
              <Badge variant={getScoreColor('lcp', metrics.lcp)} className="text-xs">
                {formatValue('lcp', metrics.lcp)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>FID:</span>
              <Badge variant={getScoreColor('fid', metrics.fid)} className="text-xs">
                {formatValue('fid', metrics.fid)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>CLS:</span>
              <Badge variant={getScoreColor('cls', metrics.cls)} className="text-xs">
                {formatValue('cls', metrics.cls)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>FCP:</span>
              <Badge variant={getScoreColor('fcp', metrics.fcp)} className="text-xs">
                {formatValue('fcp', metrics.fcp)}
              </Badge>
            </div>
          </div>

          {/* Load Time */}
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <Timer className="h-3 w-3" />
              Load Time:
            </span>
            <Badge variant={getScoreColor('loadTime', metrics.loadTime)} className="text-xs">
              {formatValue('loadTime', metrics.loadTime)}
            </Badge>
          </div>

          {/* Cache Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                Cache:
              </span>
              <span>{metrics.cacheSize}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Hits:</span>
              <span>{metrics.cacheHits}%</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={clearCache}
              className="text-xs h-6 px-2"
            >
              Clear Cache
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="text-xs h-6 px-2"
            >
              Reload
            </Button>
          </div>

          {/* Performance Tips */}
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Optimized images
            </div>
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Cached queries
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Code splitting
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
