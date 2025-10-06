"use client";

import { ReactNode } from 'react';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';

interface TuningLayoutProps {
  children: ReactNode;
}

export function TuningLayout({ children }: TuningLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}