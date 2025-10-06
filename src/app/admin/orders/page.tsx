import { Suspense } from "react";
import { OrderManagementTable } from "@/components/admin/order-management";
import { AdminHeaderLayout } from "@/components/admin/admin-header-layout";
import { AdminGuard } from "@/components/admin/admin-guard";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminOrdersPage() {
  return (
    <AdminGuard>
      <AdminHeaderLayout>
        <div className="space-y-6">
          
          <Suspense fallback={<OrderTableSkeleton />}>
            <OrderManagementTable />
          </Suspense>
        </div>
      </AdminHeaderLayout>
    </AdminGuard>
  );
}

function OrderTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[150px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
