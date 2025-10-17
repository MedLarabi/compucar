"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Search,
  Bell,
  Plus,
  ChevronDown,
  Star,
  BookOpen,
  TrendingUp,
  Video,
  FileText,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useLanguage } from '@/contexts/LanguageContext';

interface AdminHeaderLayoutProps {
  children: React.ReactNode;
}

// Navigation items will be created inside the component to use translations

// Quick actions will be created inside the component to use translations

function MobileAdminMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  const navigationItems = [
    {
      title: t('admin.navigation.dashboard'),
      href: "/admin",
      icon: LayoutDashboard,
      description: "Overview and analytics",
    },
    {
      title: t('admin.navigation.products'),
      href: "/admin/products",
      icon: Package,
      description: "Manage product catalog",
      subItems: [
        { title: "All Products", href: "/admin/products", description: "View and manage all products" },
        { title: "Add Product", href: "/admin/products/create", description: "Create a new product" },
        { title: "Categories", href: "/admin/categories", description: "Manage product categories" },
        { title: "Inventory", href: "/admin/inventory", description: "Stock management" },
      ],
    },
    {
      title: t('admin.navigation.orders'),
      href: "/admin/orders",
      icon: ShoppingCart,
      description: "View and manage orders",
      subItems: [
        { title: "All Orders", href: "/admin/orders", description: "View and manage all orders" },
        { title: "Pending", href: "/admin/orders?status=pending", description: "Orders awaiting processing" },
        { title: "Shipping", href: "/admin/orders?status=shipping", description: "Orders in transit" },
        { title: "Completed", href: "/admin/orders?status=completed", description: "Completed orders" },
      ],
    },
    {
      title: t('admin.navigation.files'),
      href: "/admin/files",
      icon: FileText,
      description: t('admin.files.description'),
      subItems: [
        { title: t('admin.files.allFiles'), href: "/admin/files", description: "View and manage all tuning files" },
        { title: t('admin.files.received'), href: "/admin/files?status=RECEIVED", description: "Newly received files" },
        { title: t('admin.files.inProgress'), href: "/admin/files?status=PENDING", description: "Files being processed" },
        { title: t('admin.files.ready'), href: "/admin/files?status=READY", description: "Completed files ready for download" },
      ],
    },
    {
      title: t('admin.navigation.users'),
      href: "/admin/users",
      icon: Users,
      description: "Manage user accounts",
      subItems: [
        { title: "All Users", href: "/admin/users", description: "View and manage all users" },
        { title: "Customers", href: "/admin/users?role=customer", description: "Customer accounts" },
        { title: "Admins", href: "/admin/users?role=admin", description: "Admin accounts" },
      ],
    },
    {
      title: t('admin.navigation.courses'),
      href: "/admin/courses",
      icon: BookOpen,
      description: "Manage video courses and enrollments",
      subItems: [
        { title: "All Courses", href: "/admin/courses", description: "View and manage all courses" },
        { title: "Enrollments", href: "/admin/courses?tab=enrollments", description: "Manage user enrollments" },
      ],
    },
    {
      title: t('admin.navigation.reviews'),
      href: "/admin/reviews",
      icon: Star,
      description: "Manage product reviews",
    },
    {
      title: t('admin.navigation.notifications'),
      href: "/admin/notifications",
      icon: Bell,
      description: "View system notifications",
    },
    {
      title: t('admin.navigation.blog'),
      href: "/admin/blog",
      icon: BookOpen,
      description: "Manage blog articles",
    },
    {
      title: t('admin.navigation.seo'),
      href: "/admin/seo",
      icon: TrendingUp,
      description: "Monitor SEO performance",
    },
    {
      title: t('admin.navigation.analytics'),
      href: "/admin/analytics",
      icon: BarChart3,
      description: "Sales and performance data",
      subItems: [
        { title: "Overview", href: "/admin/analytics", description: "General analytics overview" },
        { title: "Sales", href: "/admin/analytics/sales", description: "Sales performance" },
        { title: "Products", href: "/admin/analytics/products", description: "Product performance" },
        { title: "Reports", href: "/admin/reports", description: "Generate business reports" },
      ],
    },
  ];

  const quickActions = [
    { title: t('admin.quickActions.addProduct'), href: "/admin/products/create", icon: Package },
    { title: t('admin.quickActions.addCourse'), href: "/admin/courses", icon: Video },
    { title: t('admin.quickActions.viewOrders'), href: "/admin/orders", icon: ShoppingCart },
    { title: t('admin.quickActions.manageFiles'), href: "/admin/files", icon: FileText },
    { title: t('admin.quickActions.analytics'), href: "/admin/analytics", icon: BarChart3 },
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3">
              <img 
                src="/logo.png" 
                alt="CompuCar Logo" 
                className="h-8 w-auto object-contain"
              />
              <div>
                <h2 className="text-lg font-semibold">Admin</h2>
                <p className="text-sm text-muted-foreground">Management Portal</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;

              return (
                <div key={item.href}>
                  <Button
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
                  
                  {/* Sub items for mobile */}
                  {item.subItems && isActive && (
                    <div className="ml-8 mt-2 space-y-1">
                      {item.subItems.map((subItem) => (
                        <Button
                          key={subItem.href}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs"
                          onClick={() => handleNavigation(subItem.href)}
                        >
                          {subItem.title}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-t">
            <p className="text-sm font-medium mb-2">Quick Actions</p>
            <div className="space-y-1">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.href}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleNavigation(action.href)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {action.title}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AdminHeaderLayout({ children }: AdminHeaderLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useLanguage();

  const navigationItems = [
    {
      title: t('admin.navigation.dashboard'),
      href: "/admin",
      icon: LayoutDashboard,
      description: "Overview and analytics",
    },
    {
      title: t('admin.navigation.products'),
      href: "/admin/products",
      icon: Package,
      description: "Manage product catalog",
      subItems: [
        { title: "All Products", href: "/admin/products", description: "View and manage all products" },
        { title: "Add Product", href: "/admin/products/create", description: "Create a new product" },
        { title: "Categories", href: "/admin/categories", description: "Manage product categories" },
        { title: "Inventory", href: "/admin/inventory", description: "Stock management" },
      ],
    },
    {
      title: t('admin.navigation.orders'),
      href: "/admin/orders",
      icon: ShoppingCart,
      description: "View and manage orders",
      subItems: [
        { title: "All Orders", href: "/admin/orders", description: "View and manage all orders" },
        { title: "Pending", href: "/admin/orders?status=pending", description: "Orders awaiting processing" },
        { title: "Shipping", href: "/admin/orders?status=shipping", description: "Orders in transit" },
        { title: "Completed", href: "/admin/orders?status=completed", description: "Completed orders" },
      ],
    },
    {
      title: t('admin.navigation.files'),
      href: "/admin/files",
      icon: FileText,
      description: t('admin.files.description'),
      subItems: [
        { title: t('admin.files.allFiles'), href: "/admin/files", description: "View and manage all tuning files" },
        { title: t('admin.files.received'), href: "/admin/files?status=RECEIVED", description: "Newly received files" },
        { title: t('admin.files.inProgress'), href: "/admin/files?status=PENDING", description: "Files being processed" },
        { title: t('admin.files.ready'), href: "/admin/files?status=READY", description: "Completed files ready for download" },
      ],
    },
    {
      title: t('admin.navigation.users'),
      href: "/admin/users",
      icon: Users,
      description: "Manage user accounts",
      subItems: [
        { title: "All Users", href: "/admin/users", description: "View and manage all users" },
        { title: "Customers", href: "/admin/users?role=customer", description: "Customer accounts" },
        { title: "Admins", href: "/admin/users?role=admin", description: "Admin accounts" },
      ],
    },
    {
      title: t('admin.navigation.courses'),
      href: "/admin/courses",
      icon: BookOpen,
      description: "Manage video courses and enrollments",
      subItems: [
        { title: "All Courses", href: "/admin/courses", description: "View and manage all courses" },
        { title: "Enrollments", href: "/admin/courses?tab=enrollments", description: "Manage user enrollments" },
      ],
    },
    {
      title: t('admin.navigation.reviews'),
      href: "/admin/reviews",
      icon: Star,
      description: "Manage product reviews",
    },
    {
      title: t('admin.navigation.notifications'),
      href: "/admin/notifications",
      icon: Bell,
      description: "View system notifications",
    },
    {
      title: t('admin.navigation.blog'),
      href: "/admin/blog",
      icon: BookOpen,
      description: "Manage blog articles",
    },
    {
      title: t('admin.navigation.seo'),
      href: "/admin/seo",
      icon: TrendingUp,
      description: "Monitor SEO performance",
    },
    {
      title: t('admin.navigation.analytics'),
      href: "/admin/analytics",
      icon: BarChart3,
      description: "Sales and performance data",
      subItems: [
        { title: "Overview", href: "/admin/analytics", description: "General analytics overview" },
        { title: "Sales", href: "/admin/analytics/sales", description: "Sales performance" },
        { title: "Products", href: "/admin/analytics/products", description: "Product performance" },
        { title: "Reports", href: "/admin/reports", description: "Generate business reports" },
      ],
    },
  ];

  const quickActions = [
    { title: t('admin.quickActions.addProduct'), href: "/admin/products/create", icon: Package },
    { title: t('admin.quickActions.addCourse'), href: "/admin/courses", icon: Video },
    { title: t('admin.quickActions.viewOrders'), href: "/admin/orders", icon: ShoppingCart },
    { title: t('admin.quickActions.manageFiles'), href: "/admin/files", icon: FileText },
    { title: t('admin.quickActions.analytics'), href: "/admin/analytics", icon: BarChart3 },
  ];

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const currentPage = navigationItems.find(item => 
    pathname === item.href || pathname.startsWith(item.href + "/")
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          {/* Mobile Menu */}
          <MobileAdminMenu />

          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => router.push("/admin")}
            >
              <img 
                src="/logo.png" 
                alt="CompuCar Logo" 
                className="h-7 w-auto object-contain hover:opacity-80 transition-opacity"
              />
              <div className="hidden sm:block">
                <span className="font-bold text-lg">Admin</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:flex-1 md:items-center md:justify-center">
            <div className="flex items-center space-x-2">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;

                return (
                  <div key={item.href}>
                    {item.subItems ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant={isActive ? "secondary" : "ghost"}
                            className={cn(
                              "h-10 px-4 py-2",
                              isActive && "bg-accent text-accent-foreground"
                            )}
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            {item.title}
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-72">
                          <DropdownMenuLabel className="flex items-center">
                            <Icon className="h-4 w-4 mr-2" />
                            {item.title}
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => router.push(item.href)}
                            className="cursor-pointer"
                          >
                            <div className="flex flex-col">
                              <div className="font-medium">View All {item.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {item.description}
                              </div>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {item.subItems.map((subItem) => (
                            <DropdownMenuItem
                              key={subItem.href}
                              onClick={() => router.push(subItem.href)}
                              className="cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <div className="font-medium">{subItem.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {subItem.description}
                                </div>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className="h-10 px-4 py-2"
                        onClick={() => router.push(item.href)}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {item.title}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden lg:block">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search admin..."
                  className="pl-8 w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Quick Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <DropdownMenuItem 
                      key={action.href}
                      onClick={() => router.push(action.href)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {action.title}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <NotificationBell />

            {/* User Menu */}
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
                    <Badge 
                      variant={session?.user?.role === "SUPER_ADMIN" ? "destructive" : "secondary"} 
                      className="text-xs w-fit mt-1"
                    >
                      {session?.user?.role?.replace("_", " ")}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/account")}>
                  <User className="mr-2 h-4 w-4" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/")}>
                  <Home className="mr-2 h-4 w-4" />
                  View Store
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/admin/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Admin Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Page Title Bar */}
      {currentPage && (
        <div className="border-b bg-muted/20">
          <div className="container py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {currentPage.icon && <currentPage.icon className="h-6 w-6 text-muted-foreground" />}
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{currentPage.title}</h1>
                  <p className="text-muted-foreground">{currentPage.description}</p>
                </div>
              </div>
              
              {/* Page-specific actions could go here */}
              <div className="hidden sm:flex space-x-2">
                {pathname.includes('/products') && !pathname.includes('/create') && (
                  <Button onClick={() => router.push('/admin/products/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                )}
                {pathname.includes('/orders') && (
                  <Button variant="outline">
                    <FileBarChart className="h-4 w-4 mr-2" />
                    Export Orders
                  </Button>
                )}
                {pathname.includes('/files') && (
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    {t('admin.files.fileStatistics')}
                  </Button>
                )}
                {pathname.includes('/users') && (
                  <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Invite User
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container py-6">
        {children}
      </main>
    </div>
  );
}
