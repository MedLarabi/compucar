import { ReactNode } from "react";
import { Footer } from "./footer";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { UserSessionManager } from "@/components/auth/user-session-manager";
import { Navigation } from "./navigation";
import { ClientOnly } from "@/components/ui/client-only";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <UserSessionManager />
      <ClientOnly>
        <Navigation />
      </ClientOnly>
      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 overflow-x-hidden relative">
        {children}
      </main>
      <Footer />
      <ClientOnly>
        <ScrollToTop />
      </ClientOnly>
    </div>
  );
}
