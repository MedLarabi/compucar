'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LanguageWrapperProps {
  children: React.ReactNode;
}

export function LanguageWrapper({ children }: LanguageWrapperProps) {
  const { language, isLoading } = useLanguage();

  useEffect(() => {
    // Only set language attributes when not loading and language is available
    if (!isLoading && language) {
      // Set the HTML lang attribute
      document.documentElement.lang = language;
      
      // Remove RTL changes - keep layout as LTR for all languages
      document.documentElement.dir = 'ltr';
      document.body.classList.remove('rtl');
    }
  }, [language, isLoading]);

  return <>{children}</>;
}
