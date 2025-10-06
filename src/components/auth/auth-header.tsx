"use client";

import Link from "next/link";
import { Package, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface AuthHeaderProps {
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
}

export function AuthHeader({ 
  showBackButton = true, 
  backHref = "/", 
  backLabel = "Back to Home" 
}: AuthHeaderProps) {
  return (
    <header className="w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        {/* Left side - Back button or Logo */}
        <div className="flex items-center space-x-4">
          {showBackButton ? (
            <Link href={backHref}>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{backLabel}</span>
              </Button>
            </Link>
          ) : (
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <span className="hidden sm:inline-block font-bold text-lg bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                CompuCar
              </span>
            </Link>
          )}
        </div>

        {/* Center - Logo (when back button is shown) */}
        {showBackButton && (
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <span className="hidden sm:inline-block font-bold text-lg bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              CompuCar
            </span>
          </Link>
        )}

        {/* Right side - Theme toggle and navigation */}
        <div className="flex items-center space-x-2">
          <nav className="hidden md:flex items-center space-x-1">
            <Link href="/products">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Products
              </Button>
            </Link>
            <Link href="/categories">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Categories
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Contact
              </Button>
            </Link>
          </nav>
          
          <div className="border-l border-border/40 pl-2 ml-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
