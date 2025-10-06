"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout-simple";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Calendar, 
  Clock, 
  Eye, 
  Heart, 
  User,
  Filter,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLanguage } from '@/contexts/LanguageContext';

interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  imageAlt?: string;
  publishedAt: string;
  readTime?: number;
  views: number;
  likes: number;
  author: {
    firstName: string;
    lastName: string;
    name?: string;
    image?: string;
  };
  category?: {
    name: string;
    slug: string;
    color: string;
  };
  tags: Array<{
    name: string;
    slug: string;
    color?: string;
  }>;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  _count: {
    articles: number;
  };
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

export default function BlogPage() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { t } = useLanguage();
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    pages: 0
  });

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(selectedCategory && { category: selectedCategory })
      });

      const response = await fetch(`/api/blog?${params}`);
      const data: ArticlesResponse = await response.json();

      if (data.success) {
        setArticles(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/blog/categories');
      const data = await response.json();

      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [pagination.page, selectedCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchArticles();
  };

  const handleCategoryFilter = (categorySlug: string | null) => {
    setSelectedCategory(categorySlug);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getAuthorName = (author: BlogArticle['author']) => {
    return author.name || `${author.firstName} ${author.lastName}`;
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {t('blog.title')}
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('blog.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  {t('blog.searchArticles')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="space-y-3">
                  <Input
                    placeholder={t('blog.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button type="submit" className="w-full">
                    {t('common.search')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  {t('navigation.categories')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={selectedCategory === null ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleCategoryFilter(null)}
                >
                  {t('blog.allArticles')}
                  <Badge variant="secondary" className="ml-auto">
                    {pagination.total}
                  </Badge>
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.slug ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => handleCategoryFilter(category.slug)}
                  >
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                    <Badge variant="secondary" className="ml-auto">
                      {category._count.articles}
                    </Badge>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Articles Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-video bg-muted" />
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                        <div className="h-20 bg-muted rounded" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : articles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('blog.noArticlesFound')}</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || selectedCategory 
                      ? t('blog.adjustFilters')
                      : t('blog.checkBackSoon')
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Articles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {articles.map((article) => (
                    <Card key={article.id} className="group hover:shadow-lg transition-shadow">
                      <Link href={`/blog/${article.slug}`}>
                        {/* Featured Image */}
                        <div className="aspect-video relative overflow-hidden rounded-t-lg">
                          {article.featuredImage ? (
                            <Image
                              src={article.featuredImage}
                              alt={article.imageAlt || article.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                              <BookOpen className="h-12 w-12 text-primary/40" />
                            </div>
                          )}
                          
                          {/* Category Badge */}
                          {article.category && (
                            <Badge 
                              className="absolute top-3 left-3"
                              style={{ 
                                backgroundColor: article.category.color,
                                color: 'white'
                              }}
                            >
                              {article.category.name}
                            </Badge>
                          )}
                        </div>

                        <CardContent className="p-6">
                          {/* Title */}
                          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {article.title}
                          </h3>

                          {/* Excerpt */}
                          {article.excerpt && (
                            <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                              {article.excerpt}
                            </p>
                          )}

                          {/* Meta Info */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {format(new Date(article.publishedAt), 'MMM d, yyyy')}
                              </div>
                              {article.readTime && (
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {t('blog.minRead', { time: article.readTime })}
                                </div>
                              )}
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-xs text-muted-foreground">
                                <User className="h-3 w-3 mr-1" />
                                {getAuthorName(article.author)}
                              </div>
                              <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                                <div className="flex items-center">
                                  <Eye className="h-3 w-3 mr-1" />
                                  {article.views}
                                </div>
                                <div className="flex items-center">
                                  <Heart className="h-3 w-3 mr-1" />
                                  {article.likes}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {t('blog.showingResults', {
                        start: ((pagination.page - 1) * pagination.limit) + 1,
                        end: Math.min(pagination.page * pagination.limit, pagination.total),
                        total: pagination.total
                      })}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        {t('common.previous')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page >= pagination.pages}
                      >
                        {t('common.next')}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
