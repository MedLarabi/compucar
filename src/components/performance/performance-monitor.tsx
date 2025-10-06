"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { analyzeWebVital, calculatePerformanceScore, type WebVitalsMetric } from "@/lib/seo/performance";

interface PerformanceData {
  LCP: number;
  FID: number; 
  CLS: number;
  FCP: number;
  TTFB: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading web vitals data
    // In a real implementation, this would come from your analytics
    const mockData: PerformanceData = {
      LCP: 2200, // Good
      FID: 85,   // Good  
      CLS: 0.08, // Good
      FCP: 1600, // Good
      TTFB: 600  // Good
    };

    setTimeout(() => {
      setMetrics(mockData);
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading || !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const performanceScore = calculatePerformanceScore(metrics);
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-yellow-600"; 
    return "text-red-600";
  };

  const getBadgeVariant = (rating: string) => {
    switch (rating) {
      case "good": return "default";
      case "needs-improvement": return "secondary";
      case "poor": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Performance Score
            <Badge variant={getBadgeVariant(performanceScore.grade === 'A' ? 'good' : performanceScore.grade === 'F' ? 'poor' : 'needs-improvement')}>
              Grade {performanceScore.grade}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(performanceScore.score)}`}>
                {performanceScore.score}
              </div>
              <div className="text-sm text-muted-foreground">Overall Performance Score</div>
            </div>
            <Progress value={performanceScore.score} className="w-full" />
            
            {performanceScore.recommendations.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Recommendations:</h4>
                <ul className="space-y-1 text-sm">
                  {performanceScore.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle>Core Web Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(metrics).map(([name, value]) => {
              const metric: WebVitalsMetric = {
                name: name as any,
                value,
                rating: 'good',
                delta: 0,
                navigationType: 'navigate'
              };
              
              const analysis = analyzeWebVital(metric);
              
              return (
                <div key={name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{name}</h4>
                    <Badge variant={getBadgeVariant(analysis.rating)}>
                      {analysis.rating.replace('-', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="text-2xl font-bold mb-1">
                    {name === 'CLS' ? value.toFixed(3) : `${Math.round(value)}${name === 'FID' || name === 'LCP' || name === 'FCP' || name === 'TTFB' ? 'ms' : ''}`}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-3">
                    {getMetricDescription(name)}
                  </div>
                  
                  <div className="text-xs">
                    <strong>Impact:</strong> {analysis.impact}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* SEO Impact */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Search Engine Ranking</span>
              <Badge variant={performanceScore.score >= 80 ? "default" : "secondary"}>
                {performanceScore.score >= 80 ? "Positive" : "Needs Improvement"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>User Experience Score</span>
              <Badge variant={metrics.CLS <= 0.1 && metrics.LCP <= 2500 ? "default" : "secondary"}>
                {metrics.CLS <= 0.1 && metrics.LCP <= 2500 ? "Good" : "Fair"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Page Experience Signal</span>
              <Badge variant={performanceScore.score >= 75 ? "default" : "destructive"}>
                {performanceScore.score >= 75 ? "Pass" : "Fail"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getMetricDescription(metric: string): string {
  const descriptions = {
    LCP: "Time to render largest content element",
    FID: "Time from first user interaction to response",
    CLS: "Visual stability during page load",
    FCP: "Time to first content paint",
    TTFB: "Time to first byte from server"
  };
  
  return descriptions[metric as keyof typeof descriptions] || "";
}
