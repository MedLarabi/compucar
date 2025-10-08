'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGES, Language } from '@/lib/constants/languages';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe, Loader2, Check } from 'lucide-react';

interface LanguageSwitcherProps {
  onLanguageChange?: () => void; // Callback to close mobile menu
}

export function LanguageSwitcher({ onLanguageChange }: LanguageSwitcherProps) {
  const { language, setLanguage, t, isLoading } = useLanguage();
  const [hasMounted, setHasMounted] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleLanguageChange = async (newLanguage: Language) => {
    if (newLanguage === language || isChanging) return;
    
    try {
      setIsChanging(true);
      
      // Close mobile menu immediately if callback provided
      if (onLanguageChange) {
        onLanguageChange();
      }
      
      // Small delay to ensure menu closes before language change
      setTimeout(async () => {
        await setLanguage(newLanguage);
        
        // Additional delay to ensure proper state updates
        setTimeout(() => {
          setIsChanging(false);
        }, 200);
      }, 100);
      
    } catch (error) {
      console.error('Failed to change language:', error);
      setIsChanging(false);
    }
  };

  const currentLanguage = LANGUAGES[language];

  if (!hasMounted) {
    return (
      <Button variant="ghost" size="sm" className="h-8 w-8 rounded-md p-0" disabled>
        <div className="h-4 w-4 bg-muted rounded animate-pulse" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 rounded-md p-0" 
          disabled={isLoading || isChanging}
        >
          {isLoading || isChanging ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Globe className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {Object.entries(LANGUAGES).map(([code, langInfo]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleLanguageChange(code as Language)}
            className="flex items-center justify-between cursor-pointer"
            disabled={isChanging}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{langInfo.flag}</span>
              <span className={code === 'ar' ? 'font-arabic' : ''}>
                {langInfo.name}
              </span>
            </div>
            {code === language && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}