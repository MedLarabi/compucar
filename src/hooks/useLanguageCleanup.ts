import { useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Hook to force re-render and cleanup when language changes
 * This helps prevent stale event handlers on mobile devices
 */
export function useLanguageCleanup() {
  const { language } = useLanguage();
  const previousLanguage = useRef(language);

  useEffect(() => {
    // If language actually changed (not just initial mount)
    if (previousLanguage.current !== language && previousLanguage.current !== 'en') {
      // Force close any open modals/sheets by dispatching escape key
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        which: 27,
        bubbles: true,
        cancelable: true
      });
      
      // Dispatch to document to close any open overlays
      setTimeout(() => {
        document.dispatchEvent(escapeEvent);
        
        // Also dispatch a custom event for components to listen to
        window.dispatchEvent(new CustomEvent('forceCloseOverlays', {
          detail: { language, previousLanguage: previousLanguage.current }
        }));
      }, 50);
    }
    
    previousLanguage.current = language;

    // Force a small delay to ensure all components have re-rendered
    const timeoutId = setTimeout(() => {
      // Dispatch a custom event to signal language change completion
      window.dispatchEvent(new CustomEvent('languageChangeComplete', {
        detail: { language }
      }));
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [language]);

  return language;
}
