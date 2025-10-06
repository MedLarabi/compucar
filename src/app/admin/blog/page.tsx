"use client";

import { useState, useEffect } from "react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminHeaderLayout } from "@/components/admin/admin-header-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Plus,
  Search, 
  Filter,
  Calendar,
  User,
  Eye,
  Heart,
  Edit,
  Trash2,
  BookOpen,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";

interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isPublished: boolean;
  publishedAt?: string;
  readTime?: number;
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    name?: string;
    image?: string;
    email: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
    color: string;
  };
  tags: Array<{
    id: string;
    name: string;
    slug: string;
    color?: string;
  }>;
}

interface ArticlesResponse {
  success: boolean;
  data: BlogArticle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AdminBlogPage() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/admin/blog?${searchParams}`);
      const data: ArticlesResponse = await response.json();

      if (data.success) {
        setArticles(data.data);
        setPagination(data.pagination);
      } else {
        toast.error('Failed to fetch articles');
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [pagination.page, filters]);

  const handleDelete = async (articleId: string) => {
    setActionLoading(prev => ({ ...prev, [articleId]: true }));
    try {
      const response = await fetch(`/api/admin/blog/${articleId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Article deleted successfully');
        fetchArticles();
      } else {
        toast.error(data.error || 'Failed to delete article');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Failed to delete article');
    } finally {
      setActionLoading(prev => ({ ...prev, [articleId]: false }));
    }
  };

  const handleStatusChange = async (articleId: string, newStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => {
    setActionLoading(prev => ({ ...prev, [articleId]: true }));
    try {
      const response = await fetch(`/api/admin/blog/${articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          isPublished: newStatus === 'PUBLISHED'
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Article ${newStatus.toLowerCase()} successfully`);
        fetchArticles();
      } else {
        toast.error(data.error || 'Failed to update article');
      }
    } catch (error) {
      console.error('Error updating article:', error);
      toast.error('Failed to update article');
    } finally {
      setActionLoading(prev => ({ ...prev, [articleId]: false }));
    }
  };

  const getAuthorName = (author: BlogArticle['author']) => {
    return author.name || `${author.firstName} ${author.lastName}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-500';
      case 'DRAFT': return 'bg-yellow-500';
      case 'ARCHIVED': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const publishedCount = articles.filter(article => article.status === 'PUBLISHED').length;
  const draftCount = articles.filter(article => article.status === 'DRAFT').length;
  const archivedCount = articles.filter(article => article.status === 'ARCHIVED').length;

  return (
    <AdminGuard>
      <AdminHeaderLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Blog Management</h1>
              <p className="text-muted-foreground mt-2">
                Create and manage blog articles
              </p>
            </div>
            <Link href="/admin/blog/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Article
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pagination.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published</CardTitle>
                <div className="h-2 w-2 bg-green-500 rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{publishedCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                <div className="h-2 w-2 bg-yellow-500 rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{draftCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Archived</CardTitle>
                <div className="h-2 w-2 bg-gray-500 rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{archivedCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search articles..."
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
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Articles</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Drafts</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Articles List */}
          <Card>
            <CardHeader>
              <CardTitle>Articles</CardTitle>
              <CardDescription>
                {loading ? 'Loading...' : `${pagination.total} total articles`}
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
              ) : articles.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No articles found</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by creating your first blog article
                  </p>
                  <Link href="/admin/blog/create">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Article
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {articles.map((article) => (
                    <div key={article.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {/* Title and Status */}
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg truncate">{article.title}</h3>
                            <Badge 
                              variant="secondary"
                              className={`${getStatusColor(article.status)} text-white`}
                            >
                              {article.status}
                            </Badge>
                            {article.category && (
                              <Badge 
                                variant="outline"
                                style={{ 
                                  borderColor: article.category.color,
                                  color: article.category.color
                                }}
                              >
                                {article.category.name}
                              </Badge>
                            )}
                          </div>

                          {/* Excerpt */}
                          {article.excerpt && (
                            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                              {article.excerpt}
                            </p>
                          )}

                          {/* Meta Info */}
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {getAuthorName(article.author)}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {article.publishedAt 
                                ? format(new Date(article.publishedAt), 'MMM d, yyyy')
                                : format(new Date(article.createdAt), 'MMM d, yyyy') + ' (Draft)'
                              }
                            </div>
                            <div className="flex items-center">
                              <Eye className="h-4 w-4 mr-1" />
                              {article.views}
                            </div>
                            <div className="flex items-center">
                              <Heart className="h-4 w-4 mr-1" />
                              {article.likes}
                            </div>
                          </div>

                          {/* Tags */}
                          {article.tags && article.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {article.tags.slice(0, 3).map((tag) => (
                                <Badge 
                                  key={tag.id} 
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tag.name}
                                </Badge>
                              ))}
                              {article.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{article.tags.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 ml-4">
                          {article.status === 'DRAFT' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(article.id, 'PUBLISHED')}
                              disabled={actionLoading[article.id]}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Publish
                            </Button>
                          )}
                          
                          {article.status === 'PUBLISHED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(article.id, 'DRAFT')}
                              disabled={actionLoading[article.id]}
                            >
                              Unpublish
                            </Button>
                          )}

                          <Link href={`/admin/blog/${article.id}/edit`}>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Article</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{article.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(article.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} articles
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page >= pagination.pages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
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
