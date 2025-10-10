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
      
      // Set RTL for Arabic, LTR for others
      if (language === 'ar') {
        document.documentElement.dir = 'rtl';
        document.body.classList.add('rtl');
      } else {
        document.documentElement.dir = 'ltr';
        document.body.classList.remove('rtl');
      }
    }
  }, [language, isLoading]);

  return <>{children}</>;
}
