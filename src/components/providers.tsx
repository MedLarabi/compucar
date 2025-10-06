"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TranslationLoader } from "@/components/ui/translation-loader";
import { Toaster } from "sonner";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
        storageKey="compucar-theme"
      >
        <LanguageProvider>
          <TranslationLoader>
            {children}
          </TranslationLoader>
        </LanguageProvider>
        <Toaster 
          position="top-right"
          expand={false}
          richColors
          closeButton
        />
      </ThemeProvider>
    </SessionProvider>
  );
}
