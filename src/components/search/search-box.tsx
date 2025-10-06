"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLanguage } from '@/contexts/LanguageContext';
import { Portal } from "@/components/ui/portal";

// Types for search results
interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  price: string | number;
  compareAtPrice?: string | number;
  images: Array<{
    id: string;
    url: string;
    altText?: string;
  }>;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  status: string;
  isActive: boolean;
}

interface SearchBoxProps {
  className?: string;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

// Utility function for fuzzy search and highlighting
const fuzzyMatch = (text: string, query: string): { score: number; highlightedText: string } => {
  if (!query) return { score: 0, highlightedText: text };
  
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Exact match gets highest score
  if (textLower.includes(queryLower)) {
    const index = textLower.indexOf(queryLower);
    const highlighted = text.slice(0, index) + 
      '<mark class="bg-yellow-200 dark:bg-yellow-800 font-semibold">' + 
      text.slice(index, index + query.length) + 
      '</mark>' + 
      text.slice(index + query.length);
    
    // Higher score for matches at the beginning
    const score = queryLower.length / text.length + (index === 0 ? 0.5 : 0);
    return { score, highlightedText: highlighted };
  }
  
  // Fuzzy matching for partial matches
  let score = 0;
  let textIndex = 0;
  let highlighted = "";
  let lastMatchIndex = -1;
  
  for (let i = 0; i < query.length; i++) {
    const char = queryLower[i];
    const foundIndex = textLower.indexOf(char, textIndex);
    
    if (foundIndex === -1) {
      return { score: 0, highlightedText: text }; // No match
    }
    
    // Add unmatched characters
    highlighted += text.slice(textIndex, foundIndex);
    
    // Add matched character with highlight
    highlighted += '<mark class="bg-yellow-200 dark:bg-yellow-800 font-semibold">' + 
      text[foundIndex] + '</mark>';
    
    // Calculate score based on character proximity
    if (lastMatchIndex !== -1) {
      const distance = foundIndex - lastMatchIndex;
      score += 1 / distance;
    } else {
      score += 1;
    }
    
    lastMatchIndex = foundIndex;
    textIndex = foundIndex + 1;
  }
  
  // Add remaining characters
  highlighted += text.slice(textIndex);
  
  return { score: score / query.length, highlightedText: highlighted };
};

export function SearchBox({ 
  className,
  placeholder,
  size = "md",
  showIcon = true,
  onFocus,
  onBlur
}: SearchBoxProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Size variants for the input
  const sizeClasses = {
    sm: "h-8 text-sm",
    md: "h-10 text-base",
    lg: "h-12 text-lg"
  };

  // Update dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, []);

  // Debounced search function
  const searchProducts = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const apiUrl = `${baseUrl}/api/products?search=${encodeURIComponent(searchQuery)}&limit=50`;
      console.log('Search API URL:', apiUrl);
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.success && data.data) {
        // Apply fuzzy matching and ranking
        const scoredResults = data.data
          .map((product: SearchProduct) => {
            const nameMatch = fuzzyMatch(product.name, searchQuery);
            const categoryMatch = product.category ? fuzzyMatch(product.category.name, searchQuery) : { score: 0, highlightedText: "" };
            
            // Combine scores (name has higher weight)
            const totalScore = nameMatch.score * 0.8 + categoryMatch.score * 0.2;
            
            return {
              ...product,
              _searchScore: totalScore,
              _highlightedName: nameMatch.highlightedText,
              _highlightedCategory: categoryMatch.highlightedText
            };
          })
          .filter((product: any) => product._searchScore > 0)
          .sort((a: any, b: any) => b._searchScore - a._searchScore)
          .slice(0, 5); // Top 5 results
        
        setResults(scoredResults);
        if (scoredResults.length > 0) {
          setIsOpen(true);
          updateDropdownPosition();
        }
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [updateDropdownPosition]);

  // Debounced search effect
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      searchProducts(query);
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [query, searchProducts]);

  // Update position when dropdown opens
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      
      // Update position on scroll and resize
      const handleResize = () => updateDropdownPosition();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleResize);
      };
    }
  }, [isOpen, updateDropdownPosition]);

  // Global keyboard shortcut (/) to focus search
  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleGlobalKeydown);
    return () => document.removeEventListener('keydown', handleGlobalKeydown);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        // Navigate to search page
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        setIsOpen(false);
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          router.push(`/products/${results[selectedIndex].slug}`);
          setIsOpen(false);
          inputRef.current?.blur();
        } else if (query.trim()) {
          router.push(`/search?q=${encodeURIComponent(query.trim())}`);
          setIsOpen(false);
          inputRef.current?.blur();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, results, selectedIndex, query, router]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    if (value.trim()) {
      setIsOpen(true);
      updateDropdownPosition();
    } else {
      setIsOpen(false);
      setResults([]);
    }
  };

  // Handle input focus
  const handleFocus = () => {
    if (query.trim() && results.length > 0) {
      setIsOpen(true);
    }
    updateDropdownPosition();
    onFocus?.();
  };

  // Handle input blur (with delay to allow clicking on results)
  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
      setSelectedIndex(-1);
    }, 200);
    onBlur?.();
  };

  // Clear search
  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Navigate to product
  const navigateToProduct = (product: SearchProduct) => {
    try {
      console.log('Navigating to product:', product.slug);
      router.push(`/products/${product.slug}`);
      setIsOpen(false);
      inputRef.current?.blur();
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  // Navigate to search page
  const navigateToSearch = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative w-full max-w-md min-w-0", className)} 
      role="combobox" 
      aria-expanded={isOpen}
    >
      {/* Search Input */}
      <div className="relative">
        {showIcon && (
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        )}
        <Input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder || t('search.placeholder')}
          className={cn(
            sizeClasses[size],
            showIcon && "pl-10",
            query && "pr-10",
            "w-full"
          )}
          aria-label="Search products"
          aria-autocomplete="list"
          aria-controls="search-results"
          role="searchbox"
        />
        
        {/* Clear Button */}
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
            onClick={clearSearch}
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <Portal>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[9998] bg-transparent"
            onClick={() => setIsOpen(false)}
          />
          <Card 
            className="fixed z-[9999] shadow-xl border bg-background/95 backdrop-blur-sm max-w-[calc(100vw-2rem)]"
            style={{
              top: `${dropdownPosition.top + 4}px`,
              left: `${dropdownPosition.left}px`,
              width: `${Math.max(dropdownPosition.width, 300)}px`,
            }}
          >
            <CardContent className="p-0">
            <div
              ref={resultsRef}
              id="search-results"
              role="listbox"
              aria-label="Search results"
            >
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>Searching...</span>
                  </div>
                </div>
              ) : results.length > 0 ? (
                <>
                  {results.map((product: any, index) => (
                    <div
                      key={product.id}
                      role="option"
                      aria-selected={selectedIndex === index}
                      className={cn(
                        "flex items-center space-x-3 p-3 cursor-pointer border-b last:border-b-0 transition-colors",
                        selectedIndex === index ? "bg-muted" : "hover:bg-muted/50"
                      )}
                      onClick={() => navigateToProduct(product)}
                    >
                      {/* Product Image */}
                      <div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted shrink-0">
                        {product.images && product.images.length > 0 ? (
                          <Image
                            src={product.images[0].url}
                            alt={product.images[0].altText || product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 
                          className="text-sm font-medium line-clamp-1"
                          dangerouslySetInnerHTML={{ __html: product._highlightedName }}
                        />
                        {product.category && (
                          <p className="text-xs text-muted-foreground capitalize">
                            {product.category.name}
                          </p>
                        )}
                      </div>

                      {/* Price */}
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold">
                          {Number(product.price).toFixed(2)} DA
                        </div>
                        {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                          <div className="text-xs text-muted-foreground line-through">
                            {Number(product.compareAtPrice).toFixed(2)} DA
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* View All Results */}
                  <div
                    className="p-3 text-center border-t bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={navigateToSearch}
                  >
                    <span className="text-sm text-primary font-medium">
                      View all results for "{query}"
                    </span>
                  </div>
                </>
              ) : query.trim() ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('messages.noProductsSearching', { query })}</p>
                  <p className="text-xs mt-1">{t('messages.tryDifferentKeywords')}</p>
                </div>
              ) : null}
            </div>
            </CardContent>
          </Card>
        </Portal>
      )}
    </div>
  );
}

