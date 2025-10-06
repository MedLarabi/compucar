"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Package,
  Shield,
  Menu,
  X,
  Download,
  Key,
  FileText,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const navigationItems = [
    {
      name: t('dashboard.overview'),
      href: '/account',
      icon: User,
      description: t('dashboard.overviewDesc'),
    },
    {
      name: t('common.orders'),
      href: '/account/orders',
      icon: Package,
      description: t('dashboard.ordersDesc'),
    },
    {
      name: t('courses.title'),
      href: '/account/courses',
      icon: BookOpen,
      description: t('courses.description'),
    },
    {
      name: t('dashboard.downloads'),
      href: '/account/downloads',
      icon: Download,
      description: t('dashboard.downloadsDesc'),
    },
    {
      name: t('dashboard.licenseKeys'),
      href: '/account/license-keys',
      icon: Key,
      description: t('dashboard.licenseKeysDesc'),
    },
    {
      name: t('dashboard.invoices'),
      href: '/account/invoices',
      icon: FileText,
      description: t('dashboard.invoicesDesc'),
    },
    {
      name: t('dashboard.security'),
      href: '/account/security',
      icon: Shield,
      description: t('dashboard.securityDesc'),
    },
  ];

  if (!session) {
    return (
      <MainLayout>
        <div className="container py-12">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <User className="h-16 w-16 text-muted-foreground mx-auto" />
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('errors.pleaseSignIn')}</h1>
              <p className="text-muted-foreground">
                {t('errors.needSignIn')}
              </p>
            </div>
            <Link href="/auth/login">
              <Button size="lg">{t('errors.signIn')}</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Mobile Menu Button */}
            <div className="lg:hidden mb-4">
              <Button
                variant="outline"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-full justify-start"
              >
                {isMobileMenuOpen ? (
                  <X className="h-4 w-4 mr-2" />
                ) : (
                  <Menu className="h-4 w-4 mr-2" />
                )}
                {isMobileMenuOpen ? t('dashboard.closeMenu') : t('dashboard.accountMenu')}
              </Button>
            </div>

            {/* Sidebar Content */}
            <div
              className={cn(
                "space-y-6",
                "lg:block",
                isMobileMenuOpen ? "block" : "hidden"
              )}
            >
              {/* User Info */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={session.user?.image || ''}
                        alt={session.user?.name || 'User'}
                      />
                      <AvatarFallback>
                        {session.user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {session.user?.name || 'User'}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {session.user?.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {session.user?.role?.toLowerCase() || 'customer'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation */}
              <Card>
                <CardContent className="p-0">
                  <nav className="space-y-1">
                    {navigationItems.map((item, index) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;

                      return (
                        <div key={item.name}>
                          <Link
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center px-4 py-3 text-sm transition-colors hover:bg-muted",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <Icon className="h-4 w-4 mr-3" />
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p
                                className={cn(
                                  "text-xs",
                                  isActive
                                    ? "text-primary-foreground/80"
                                    : "text-muted-foreground"
                                )}
                              >
                                {item.description}
                              </p>
                            </div>
                          </Link>
                          {index < navigationItems.length - 1 && (
                            <Separator />
                          )}
                        </div>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}



