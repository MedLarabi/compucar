"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useLanguage } from '@/contexts/LanguageContext';
import { useCartStore, useWishlistStore } from "@/stores";
import { CartButton } from "@/components/cart";

import {
  ShoppingCart,
  User,
  Menu,
  Heart,
  Package,
  LogIn,
  LogOut,
  Settings,
  UserPlus,
  LayoutDashboard,
  Shield,
  ChevronDown,
  ChevronUp,
  Globe,
  Sun,
  Moon,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
export function Navigation() {
  const [mounted, setMounted] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { data: session } = useSession();
  const { totalItems } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { t } = useLanguage();

  // Only run on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const navigationItems = [
    { href: "/products", label: t('navigation.products') },
    { href: "/categories", label: t('navigation.categories') },
    { href: "/courses", label: t('navigation.courses') },
    { href: "/files", label: t('navigation.tuning') },
    { href: "/blog", label: t('navigation.blog') },
    { href: "/contact", label: t('navigation.contact') },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm overflow-x-hidden overflow-y-visible">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between min-w-0">
        {/* Logo - Desktop */}
        <div className="mr-4 lg:mr-6 hidden md:flex">
          <Link href="/" className="mr-2 lg:mr-4 flex items-center space-x-2 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <span className="hidden lg:inline-block font-bold text-lg bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              CompuCar
            </span>
          </Link>
        </div>

        {/* Logo - Mobile */}
        <div className="flex md:hidden">
          <Link href="/" className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            {/* Hide text on mobile to save space */}
          </Link>
        </div>

        {/* Mobile menu - moved to the right */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="px-2 py-2 text-base hover:bg-accent/50 focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden rounded-lg"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">{t('common.toggleMenu')}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="pl-0 w-80">
            <SheetHeader className="text-left">
              <SheetTitle className="flex items-center text-xl">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mr-3">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  CompuCar
                </span>
              </SheetTitle>
              <SheetDescription className="text-base">
                {t('messages.premiumAutoParts')}
              </SheetDescription>
            </SheetHeader>
            <div className="my-8 h-[calc(100vh-8rem)] pb-10">
              <div className="flex flex-col space-y-2">
                
                {/* Settings Section - Top */}
                <div className="border-b border-border pb-4">
                  <button
                    onClick={() => toggleSection('settings')}
                    className="flex items-center justify-between w-full px-4 py-3 text-base font-medium text-foreground hover:bg-accent/50 rounded-lg transition-all duration-200"
                  >
                    <div className="flex items-center">
                      <Settings className="mr-3 h-5 w-5" />
                      <span>{t('common.settings')}</span>
                    </div>
                    {expandedSection === 'settings' ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  
                  {expandedSection === 'settings' && (
                    <div className="ml-8 mt-2 space-y-1">
                      {/* Language Switcher */}
                      <div className="flex items-center justify-between px-4 py-2">
                        <div className="flex items-center">
                          <Globe className="mr-3 h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{t('common.language')}</span>
                        </div>
                        <LanguageSwitcher />
                      </div>
                      
                      {/* Theme Toggle */}
                      <div className="flex items-center justify-between px-4 py-2">
                        <div className="flex items-center">
                          <Sun className="mr-3 h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{t('common.theme')}</span>
                        </div>
                        <ThemeToggle />
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions Section */}
                <div className="border-b border-border pb-4">
                  <button
                    onClick={() => toggleSection('actions')}
                    className="flex items-center justify-between w-full px-4 py-3 text-base font-medium text-foreground hover:bg-accent/50 rounded-lg transition-all duration-200"
                  >
                    <div className="flex items-center">
                      <User className="mr-3 h-5 w-5" />
                      <span>{t('common.actions')}</span>
                    </div>
                    {expandedSection === 'actions' ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  
                  {expandedSection === 'actions' && (
                    <div className="ml-8 mt-2 space-y-1">
                      {/* Cart */}
                      <Link href="/cart" className="flex items-center justify-between px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded-lg transition-all duration-200">
                        <div className="flex items-center">
                          <ShoppingCart className="mr-3 h-4 w-4" />
                          <span>{t('navigation.cart')}</span>
                        </div>
                        {mounted && totalItems > 0 && (
                          <Badge className="h-4 w-4 rounded-full p-0 text-xs bg-primary/90">
                            {totalItems}
                          </Badge>
                        )}
                      </Link>
                      
                      {/* Wishlist */}
                      <Link href="/wishlist" className="flex items-center justify-between px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded-lg transition-all duration-200">
                        <div className="flex items-center">
                          <Heart className="mr-3 h-4 w-4" />
                          <span>{t('navigation.wishlist')}</span>
                        </div>
                        {mounted && wishlistItems.length > 0 && (
                          <Badge className="h-4 w-4 rounded-full p-0 text-xs bg-primary/90">
                            {wishlistItems.length}
                          </Badge>
                        )}
                      </Link>
                      
                      {/* Account Section */}
                      {session ? (
                        <>
                          <Link href="/account" className="flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded-lg transition-all duration-200">
                            <LayoutDashboard className="mr-3 h-4 w-4" />
                            <span>{t('navigation.account')}</span>
                          </Link>
                          
                          {/* File Tuning Links */}
                          <Link href="/files/upload" className="flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded-lg transition-all duration-200">
                            <FileText className="mr-3 h-4 w-4" />
                            <span>Upload File</span>
                          </Link>
                          
                          <Link href="/files" className="flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded-lg transition-all duration-200">
                            <Package className="mr-3 h-4 w-4" />
                            <span>My Files</span>
                          </Link>
                          
                          {/* Admin Dashboard */}
                          {(session.user?.role === "ADMIN" || session.user?.role === "SUPER_ADMIN" || session.user?.isAdmin) && (
                            <>
                              <Link href="/admin" className="flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded-lg transition-all duration-200">
                                <Shield className="mr-3 h-4 w-4" />
                                <span>{t('messages.adminDashboard')}</span>
                              </Link>
                              <Link href="/admin/files" className="flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded-lg transition-all duration-200">
                                <FileText className="mr-3 h-4 w-4" />
                                <span>File Management</span>
                              </Link>
                            </>
                          )}
                          
                          <Link href="/account/orders" className="flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded-lg transition-all duration-200">
                            <Package className="mr-3 h-4 w-4" />
                            <span>{t('common.orders')}</span>
                          </Link>
                          
                          <button 
                            onClick={() => signOut()}
                            className="flex items-center w-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded-lg transition-all duration-200"
                          >
                            <LogOut className="mr-3 h-4 w-4" />
                            <span>{t('navigation.logout')}</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <Link href="/auth/login" className="flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded-lg transition-all duration-200">
                            <LogIn className="mr-3 h-4 w-4" />
                            <span>{t('navigation.login')}</span>
                          </Link>
                          
                          <Link href="/auth/register" className="flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded-lg transition-all duration-200">
                            <UserPlus className="mr-3 h-4 w-4" />
                            <span>{t('navigation.register')}</span>
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Categories Section */}
                <div>
                  <button
                    onClick={() => toggleSection('categories')}
                    className="flex items-center justify-between w-full px-4 py-3 text-base font-medium text-foreground hover:bg-accent/50 rounded-lg transition-all duration-200"
                  >
                    <div className="flex items-center">
                      <Package className="mr-3 h-5 w-5" />
                      <span>{t('navigation.categories')}</span>
                    </div>
                    {expandedSection === 'categories' ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  
                  {expandedSection === 'categories' && (
                    <div className="ml-8 mt-2 space-y-1">
                      {navigationItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded-lg transition-all duration-200"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop Navigation */}
        <nav className="hidden gap-1 md:flex">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-accent/50 rounded-md group"
            >
              <span className="relative z-10">{item.label}</span>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </Link>
          ))}
        </nav>

        {/* Action Buttons - Hidden on mobile */}
        <div className="hidden md:flex items-center space-x-1">
            {/* Cart */}
            <CartButton />

            {/* Wishlist */}
            <Link href="/wishlist">
              <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-md hover:bg-accent/50 transition-colors">
                <Heart className="h-4 w-4" />
                {mounted && wishlistItems.length > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0 text-xs bg-primary/90 hover:bg-primary">
                    {wishlistItems.length}
                  </Badge>
                )}
                <span className="sr-only">{t('navigation.wishlist')}</span>
              </Button>
            </Link>

            {/* Language Switcher - Always visible */}
            <LanguageSwitcher />

            {/* Theme Toggle */}
            <ThemeToggle className="hidden sm:block" />

            {/* Notifications */}
            {session && <NotificationBell />}

          {/* User Menu */}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user?.name || t('common.user')}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {t('navigation.account')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/files/upload">
                    <FileText className="mr-2 h-4 w-4" />
                    Upload File
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/files">
                    <Package className="mr-2 h-4 w-4" />
                    My Files
                  </Link>
                </DropdownMenuItem>
                {/* Admin Dashboard Link - Only show for admin users */}
                {(session.user?.role === "ADMIN" || session.user?.role === "SUPER_ADMIN" || session.user?.isAdmin) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Shield className="mr-2 h-4 w-4" />
                        {t('messages.adminDashboard')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/files">
                        <FileText className="mr-2 h-4 w-4" />
                        File Management
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/account/orders">
                    <Package className="mr-2 h-4 w-4" />
                    {t('common.orders')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    {t('common.settings')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('navigation.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="sr-only">{t('navigation.account')} {t('common.menu')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48" align="end">
                <DropdownMenuItem asChild>
                  <Link href="/auth/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    {t('navigation.login')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/auth/register">
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t('navigation.register')}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
