"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout-simple";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Clock, 
  Eye, 
  Heart, 
  User,
  ArrowLeft,
  Share2,
  BookOpen
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useLanguage } from '@/contexts/LanguageContext';

interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  imageAlt?: string;
  publishedAt: string;
  readTime?: number;
  views: number;
  likes: number;
  metaTitle?: string;
  metaDescription?: string;
  author: {
    firstName: string;
    lastName: string;
    name?: string;
    image?: string;
    bio?: string;
  };
  category?: {
    name: string;
    slug: string;
    color: string;
    description?: string;
  };
  tags: Array<{
    name: string;
    slug: string;
    color?: string;
  }>;
  relatedArticles: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    featuredImage?: string;
    imageAlt?: string;
    publishedAt: string;
    readTime?: number;
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
  }>;
}

export default function BlogArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const fetchArticle = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/blog/${slug}`);
      const data = await response.json();

      if (data.success) {
        setArticle(data.data);
        // Update page title and meta description
        if (data.data.metaTitle) {
          document.title = data.data.metaTitle;
        } else {
          document.title = `${data.data.title} | CompuCar Blog`;
        }
      } else {
        setError(data.error || 'Article not found');
      }
    } catch (error) {
      console.error('Error fetching article:', error);
      setError('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt || article.title,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const getAuthorName = (author: BlogArticle['author']) => {
    return author.name || `${author.firstName} ${author.lastName}`;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="aspect-video bg-muted rounded" />
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-4 bg-muted rounded w-4/6" />
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !article) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Article Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {error || "The article you're looking for doesn't exist or has been moved."}
            </p>
            <Link href="/blog">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link href="/blog" className="inline-block mb-6">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>

          {/* Article Header */}
          <div className="mb-8">
            {/* Category Badge */}
            {article.category && (
              <Badge 
                className="mb-4"
                style={{ 
                  backgroundColor: article.category.color,
                  color: 'white'
                }}
              >
                {article.category.name}
              </Badge>
            )}

            {/* Title */}
            <h1 className="text-4xl font-bold leading-tight mb-4">
              {article.title}
            </h1>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-xl text-muted-foreground mb-6">
                {article.excerpt}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  {getAuthorName(article.author)}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {format(new Date(article.publishedAt), 'MMMM d, yyyy')}
                </div>
                {article.readTime && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {article.readTime} min read
                  </div>
                )}
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  {article.views} views
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Featured Image */}
          {article.featuredImage && (
            <div className="aspect-video relative overflow-hidden rounded-lg mb-8">
              <Image
                src={article.featuredImage}
                alt={article.imageAlt || article.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Article Content */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="pt-6">
                  <div 
                    className="prose prose-gray max-w-none"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                  />
                </CardContent>
              </Card>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <Badge 
                        key={tag.name} 
                        variant="secondary"
                        style={{ 
                          backgroundColor: tag.color + '20',
                          color: tag.color
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Author Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    {article.author.image ? (
                      <Image
                        src={article.author.image}
                        alt={getAuthorName(article.author)}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold">{getAuthorName(article.author)}</h4>
                      {article.author.bio && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {article.author.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Related Articles */}
              {article.relatedArticles && article.relatedArticles.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4">Related Articles</h3>
                    <div className="space-y-4">
                      {article.relatedArticles.map((related) => (
                        <Link key={related.id} href={`/blog/${related.slug}`}>
                          <div className="group cursor-pointer">
                            <div className="flex space-x-3">
                              <div className="w-16 h-16 relative rounded overflow-hidden flex-shrink-0">
                                {related.featuredImage ? (
                                  <Image
                                    src={related.featuredImage}
                                    alt={related.imageAlt || related.title}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                    <BookOpen className="h-6 w-6 text-primary" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                  {related.title}
                                </h4>
                                <div className="flex items-center text-xs text-muted-foreground mt-1">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {format(new Date(related.publishedAt), 'MMM d')}
                                  {related.readTime && (
                                    <>
                                      <span className="mx-1">•</span>
                                      <Clock className="h-3 w-3 mr-1" />
                                      {related.readTime}m
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Separator className="mt-4" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
