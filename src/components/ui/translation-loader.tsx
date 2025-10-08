"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { ReactNode, useState, useEffect } from 'react';

interface TranslationLoaderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function TranslationLoader({ children, fallback }: TranslationLoaderProps) {
  const { isLoading, isChangingLanguage, language } = useLanguage();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Only show full loading screen on initial load
    if (!isLoading && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [isLoading, isInitialLoad]);

  // Show full loading screen only on initial load
  if (isLoading && isInitialLoad) {
    return (
      <>
        {fallback || (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <div className="text-sm text-muted-foreground">Loading...</div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {children}
      {/* Subtle loading overlay for language changes */}
      {isChangingLanguage && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-background/80 backdrop-blur-sm">
          <div className="flex items-center justify-center p-2">
            <div className="flex items-center space-x-2 bg-background border rounded-full px-3 py-1 shadow-sm">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
              <span className="text-xs text-muted-foreground">Switching language...</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
