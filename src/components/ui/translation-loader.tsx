"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { ReactNode } from 'react';

interface TranslationLoaderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function TranslationLoader({ children, fallback }: TranslationLoaderProps) {
  const { isLoading } = useLanguage();

  if (isLoading) {
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

  return <>{children}</>;
}
