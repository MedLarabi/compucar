export function NavigationLoading() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm overflow-x-hidden overflow-y-visible">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between min-w-0">
        {/* Logo skeleton */}
        <div className="mr-4 lg:mr-6 hidden md:flex">
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        </div>

        {/* Mobile menu button skeleton */}
        <div className="md:hidden">
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
        </div>

        {/* Desktop navigation skeleton */}
        <div className="hidden md:flex items-center space-x-6 flex-1 justify-center">
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          <div className="h-4 w-12 bg-muted rounded animate-pulse" />
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
        </div>

        {/* Action buttons skeleton */}
        <div className="flex items-center space-x-1">
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </header>
  );
}
