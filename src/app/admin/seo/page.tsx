import { Metadata } from "next";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerformanceMonitor } from "@/components/performance/performance-monitor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  TrendingUp, 
  MapPin, 
  BarChart3,
  Globe,
  Zap,
  Target,
  Eye
} from "lucide-react";

export const metadata: Metadata = {
  title: "SEO Dashboard - CompuCar Admin",
  description: "Monitor and optimize SEO performance, rankings, and analytics.",
};

export default function SEODashboardPage() {
  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">SEO Dashboard</h1>
              <p className="text-muted-foreground">
                Monitor search performance and optimize for better rankings
              </p>
            </div>
            <Button>
              <BarChart3 className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Organic Traffic</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12,482</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+12.5%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Keyword Rankings</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">127</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+8</span> new top 10 rankings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Local Visibility</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">85%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+3%</span> local search visibility
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Page Speed Score</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">92</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">Good</span> performance rating
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="performance" className="space-y-6">
            <TabsList>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="keywords">Keywords</TabsTrigger>
              <TabsTrigger value="local">Local SEO</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
            </TabsList>

            {/* Performance Tab */}
            <TabsContent value="performance">
              <PerformanceMonitor />
            </TabsContent>

            {/* Keywords Tab */}
            <TabsContent value="keywords">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="mr-2 h-5 w-5" />
                      Top Performing Keywords
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { keyword: "car accessories", position: 3, traffic: 1240, trend: "up" },
                        { keyword: "LED headlights", position: 5, traffic: 890, trend: "up" },
                        { keyword: "car spoilers", position: 8, traffic: 567, trend: "stable" },
                        { keyword: "performance parts", position: 12, traffic: 445, trend: "down" },
                        { keyword: "car tuning", position: 15, traffic: 334, trend: "up" }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{item.keyword}</div>
                            <div className="text-sm text-muted-foreground">
                              Position #{item.position} • {item.traffic} visits
                            </div>
                          </div>
                          <Badge 
                            variant={item.trend === "up" ? "default" : item.trend === "down" ? "destructive" : "secondary"}
                          >
                            {item.trend === "up" ? "↗" : item.trend === "down" ? "↘" : "→"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Eye className="mr-2 h-5 w-5" />
                      Keyword Opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { keyword: "car modification kits", difficulty: "Medium", volume: "2.4K", position: 23 },
                        { keyword: "automotive lighting", difficulty: "Low", volume: "1.8K", position: 28 },
                        { keyword: "racing accessories", difficulty: "High", volume: "3.1K", position: 35 },
                        { keyword: "car interior parts", difficulty: "Medium", volume: "1.2K", position: 41 }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{item.keyword}</div>
                            <div className="text-sm text-muted-foreground">
                              Vol: {item.volume} • Pos: #{item.position}
                            </div>
                          </div>
                          <Badge 
                            variant={item.difficulty === "Low" ? "default" : item.difficulty === "High" ? "destructive" : "secondary"}
                          >
                            {item.difficulty}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Local SEO Tab */}
            <TabsContent value="local">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="mr-2 h-5 w-5" />
                      Google My Business Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Profile Views</span>
                        <div className="text-right">
                          <div className="font-bold">4,567</div>
                          <div className="text-sm text-green-600">+15.3%</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Website Clicks</span>
                        <div className="text-right">
                          <div className="font-bold">1,234</div>
                          <div className="text-sm text-green-600">+8.7%</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Direction Requests</span>
                        <div className="text-right">
                          <div className="font-bold">567</div>
                          <div className="text-sm text-green-600">+12.1%</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Phone Calls</span>
                        <div className="text-right">
                          <div className="font-bold">234</div>
                          <div className="text-sm text-yellow-600">-2.3%</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Local Keyword Rankings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { keyword: "car parts store near me", position: 2, city: "Your City" },
                        { keyword: "auto accessories shop", position: 4, city: "Your City" },
                        { keyword: "car tuning near me", position: 7, city: "Nearby City" },
                        { keyword: "automotive store", position: 9, city: "Your City" }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{item.keyword}</div>
                            <div className="text-sm text-muted-foreground">{item.city}</div>
                          </div>
                          <Badge variant="outline">#{item.position}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { title: "How to Install LED Headlights", views: 2345, ranking: 3 },
                        { title: "Best Car Spoilers for 2024", views: 1890, ranking: 5 },
                        { title: "Car Maintenance Checklist", views: 1567, ranking: 8 },
                        { title: "Performance Upgrades Guide", views: 1234, ranking: 12 }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.views} views • Ranking #{item.ranking}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Content Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Target "winter car accessories"</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          High search volume, low competition opportunity
                        </p>
                        <Badge variant="secondary">2.1K monthly searches</Badge>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Update "brake pad installation"</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Content is outdated, potential to rank higher
                        </p>
                        <Badge variant="outline">Currently #15</Badge>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Create "car cleaning products" guide</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Gap in content strategy, competitor ranking well
                        </p>
                        <Badge variant="secondary">1.8K monthly searches</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Technical SEO Tab */}
            <TabsContent value="technical">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Globe className="mr-2 h-5 w-5" />
                      Technical Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Crawlable Pages</span>
                        <Badge variant="default">✓ 234/234</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>XML Sitemap</span>
                        <Badge variant="default">✓ Updated</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Robots.txt</span>
                        <Badge variant="default">✓ Optimized</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>SSL Certificate</span>
                        <Badge variant="default">✓ Valid</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Mobile Friendly</span>
                        <Badge variant="default">✓ Optimized</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Page Speed (Mobile)</span>
                        <Badge variant="secondary">⚠ 78/100</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Schema Markup</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Organization Schema</span>
                        <Badge variant="default">✓ Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Product Schema</span>
                        <Badge variant="default">✓ 127 products</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Local Business Schema</span>
                        <Badge variant="default">✓ Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Article Schema</span>
                        <Badge variant="default">✓ 45 articles</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Breadcrumb Schema</span>
                        <Badge variant="secondary">⚠ Missing</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Review Schema</span>
                        <Badge variant="default">✓ 89 reviews</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
