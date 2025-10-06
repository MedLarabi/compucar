import { Suspense } from "react";
import { MainLayout } from "@/components/layout/main-layout-simple";
import { SearchResults } from "@/components/search/search-results";

export default function SearchPage() {
  return (
    <MainLayout>
      <div className="py-8">
        <Suspense fallback={<SearchResultsSkeleton />}>
          <SearchResults />
        </Suspense>
      </div>
    </MainLayout>
  );
}

function SearchResultsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-muted animate-pulse rounded w-1/3"></div>
        <div className="h-4 bg-muted animate-pulse rounded w-1/4"></div>
      </div>
      
      {/* Results Grid Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-square bg-muted animate-pulse rounded-lg"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded"></div>
              <div className="h-4 bg-muted animate-pulse rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
