"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Menu,
  LogOut,
  User,
  Home,
  FileBarChart,
  Warehouse,
  ChevronLeft,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useLanguage } from '@/contexts/LanguageContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

function getNavigationItems(t: any) {
  return [
    {
      title: t('admin.dashboard'),
      href: "/admin",
      icon: LayoutDashboard,
      description: t('admin.dashboardDesc'),
    },
    {
      title: t('admin.products'),
      href: "/admin/products",
      icon: Package,
      description: t('admin.productsDesc'),
    },
    {
      title: t('admin.orders'),
      href: "/admin/orders",
      icon: ShoppingCart,
      description: t('admin.ordersDesc'),
    },
    {
      title: t('admin.users'),
      href: "/admin/users",
      icon: Users,
      description: t('admin.usersDesc'),
    },
    {
      title: t('admin.inventory'),
      href: "/admin/inventory",
      icon: Warehouse,
      description: t('admin.inventoryDesc'),
    },
    {
      title: t('admin.analytics'),
      href: "/admin/analytics",
      icon: BarChart3,
      description: t('admin.analyticsDesc'),
    },
    {
      title: t('admin.reports'),
      href: "/admin/reports",
      icon: FileBarChart,
      description: t('admin.reportsDesc'),
    },
    {
      title: t('admin.settings'),
      href: "/admin/settings",
      icon: Settings,
      description: t('admin.settingsDesc'),
    },
  ];
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useLanguage();
  
  const navigationItems = getNavigationItems(t);

  const handleNavigation = (href: string) => {
    router.push(href);
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t('admin.compucarAdmin')}</h2>
            <p className="text-sm text-muted-foreground">{t('admin.managementPortal')}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Button
              key={item.href}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start h-auto p-3",
                isActive && "bg-secondary text-secondary-foreground"
              )}
              onClick={() => handleNavigation(item.href)}
            >
              <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </div>
            </Button>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => handleNavigation("/")}
        >
          <Home className="h-4 w-4 mr-2" />
          {t('admin.viewStore')}
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => handleNavigation("/account")}
        >
          <User className="h-4 w-4 mr-2" />
          {t('admin.myAccount')}
        </Button>
      </div>

      {/* User Info */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session?.user?.image || ""} />
            <AvatarFallback>
              {session?.user?.firstName?.[0] || "A"}
              {session?.user?.lastName?.[0] || "D"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {session?.user?.name || `${session?.user?.firstName} ${session?.user?.lastName}`}
            </p>
            <div className="flex items-center space-x-1">
              <Badge variant={session?.user?.role === "SUPER_ADMIN" ? "destructive" : "secondary"} className="text-xs">
                {session?.user?.role?.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useLanguage();

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-80 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:bg-card">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SidebarContent onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 lg:ml-80">
        {/* Top Header */}
        <header className="bg-background border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <SidebarContent />
                </SheetContent>
              </Sheet>

              <div>
                <h1 className="text-2xl font-semibold">{t('admin.adminDashboard')}</h1>
                <p className="text-sm text-muted-foreground">
                  {t('admin.welcomeBack', { name: session?.user?.firstName || 'Admin' })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session?.user?.image || ""} />
                      <AvatarFallback>
                        {session?.user?.firstName?.[0] || "A"}
                        {session?.user?.lastName?.[0] || "D"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session?.user?.name || `${session?.user?.firstName} ${session?.user?.lastName}`}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session?.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/account")}>
                    <User className="mr-2 h-4 w-4" />
                    {t('admin.accountSettings')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/")}>
                    <Home className="mr-2 h-4 w-4" />
                    {t('admin.viewStore')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('admin.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
