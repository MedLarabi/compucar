"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';

export function CourseFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'title');
  const [showWatchable, setShowWatchable] = useState(searchParams.get('watchable') === 'true');
  const [showFilters, setShowFilters] = useState(false);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchTerm) params.set('search', searchTerm);
    if (sortBy !== 'title') params.set('sort', sortBy);
    if (showWatchable) params.set('watchable', 'true');
    
    const queryString = params.toString();
    const newUrl = queryString ? `/courses?${queryString}` : '/courses';
    
    router.push(newUrl, { scroll: false });
  }, [searchTerm, sortBy, showWatchable, router]);

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('title');
    setShowWatchable(false);
    router.push('/courses', { scroll: false });
  };

  const hasActiveFilters = searchTerm || sortBy !== 'title' || showWatchable;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Main Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('courses.public.searchCoursesPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="sm:w-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              {t('courses.public.filters')}
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 px-1 min-w-[20px] h-5">
                  {[searchTerm, sortBy !== 'title', showWatchable].filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4 pt-4 border-t">

              <div>
                <label className="text-sm font-medium mb-2 block">{t('courses.public.watchableFilter')}</label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="watchable"
                    checked={showWatchable}
                    onCheckedChange={(checked) => setShowWatchable(checked === true)}
                  />
                  <label
                    htmlFor="watchable"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {t('courses.public.watchableFilterDescription')}
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">{t('courses.public.sort')}</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('courses.public.sortBy')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">{t('courses.public.titleAZ')}</SelectItem>
                    <SelectItem value="title_desc">{t('courses.public.titleZA')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t('courses.public.clearFilters')}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <span className="text-sm font-medium text-muted-foreground">{t('courses.public.activeFilters')}</span>
              
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  {t('courses.public.search')}: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {showWatchable && (
                <Badge variant="secondary" className="gap-1">
                  {t('courses.public.watchableFilterActive')}
                  <button
                    onClick={() => setShowWatchable(false)}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {sortBy !== 'title' && (
                <Badge variant="secondary" className="gap-1">
                  {t('courses.public.sort')}: {t(`courses.public.${sortBy === 'title_desc' ? 'titleZA' : 'titleAZ'}`)}
                  <button
                    onClick={() => setSortBy('title')}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
