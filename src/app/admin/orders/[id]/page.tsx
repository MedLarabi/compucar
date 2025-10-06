import { Suspense } from "react";
import { notFound } from "next/navigation";
import { OrderDetailView } from "@/components/admin/order-detail-view";
import { OrderEditor } from "@/components/admin/order-editor";
import { AdminHeaderLayout } from "@/components/admin/admin-header-layout";
import { AdminGuard } from "@/components/admin/admin-guard";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/database/prisma";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getOrderData(id: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                isVirtual: true,
                images: {
                  select: {
                    url: true,
                  },
                  take: 1,
                },
              },
            },
          },
        },
        downloads: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                isVirtual: true,
              },
            },
          },
        },
        yalidine: true,
      },
    });

    if (!order) return null;

    // Serialize Decimal fields to plain numbers for client component
    const serializedOrder = {
      ...order,
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping),
      tax: Number(order.tax),
      discount: Number(order.discount),
      total: Number(order.total),
      totalCents: order.totalCents || undefined,
      subtotalCents: order.subtotalCents || undefined,
      shippingCents: order.shippingCents || undefined,
      customerFirst: order.customerFirst || undefined,
      customerLast: order.customerLast || undefined,
      customerPhone: order.customerPhone || undefined,
      customerNotes: order.customerNotes || undefined,
      adminNotes: order.adminNotes || undefined,
      trackingNumber: order.trackingNumber || undefined,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      shippedAt: order.shippedAt?.toISOString() || null,
      deliveredAt: order.deliveredAt?.toISOString() || null,
      estimatedDelivery: order.estimatedDelivery?.toISOString() || null,
      items: order.items.map((item: any) => ({
        ...item,
        price: Number(item.price),
        product: {
          ...item.product,
          price: Number(item.product.price),
        },
      })),
      downloads: order.downloads?.map((download: any) => ({
        ...download,
        createdAt: download.createdAt.toISOString(),
        updatedAt: download.updatedAt.toISOString(),
        lastDownloadAt: download.lastDownloadAt?.toISOString() || null,
        expiresAt: download.expiresAt?.toISOString() || null,
      })) || [],
      yalidine: order.yalidine ? {
        order_id: order.yalidine.order_id,
        firstname: order.yalidine.firstname,
        familyname: order.yalidine.familyname,
        contact_phone: order.yalidine.contact_phone,
        address: order.yalidine.address,
        to_wilaya_name: order.yalidine.to_wilaya_name,
        to_commune_name: order.yalidine.to_commune_name,
        product_list: order.yalidine.product_list,
        price: order.yalidine.price,
        height: order.yalidine.height || 0,
        width: order.yalidine.width || 0,
        length: order.yalidine.length || 0,
        weight: order.yalidine.weight || 0,
        is_stopdesk: order.yalidine.is_stopdesk,
        stopdesk_id: order.yalidine.stopdesk_id || undefined,
        freeshipping: order.yalidine.freeshipping,
        has_exchange: order.yalidine.has_exchange,
        from_wilaya_name: order.yalidine.from_wilaya_name || undefined,
        from_address: order.yalidine.from_address || undefined,
        tracking: order.yalidine.tracking || undefined,
        label_url: order.yalidine.label_url || undefined,
        status: order.yalidine.status || undefined,
      } : undefined,
    };

    return serializedOrder;
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const order = await getOrderData(id);

  if (!order) {
    notFound();
  }

  return (
    <AdminGuard>
      <AdminHeaderLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Order #{order.orderNumber}
              </h1>
              <p className="text-muted-foreground">
                Order details and management
              </p>
            </div>
          </div>
          
                    <Suspense fallback={<OrderDetailSkeleton />}>
            <OrderDetailView order={order as any} />
          </Suspense>

          <Suspense fallback={<OrderEditorSkeleton />}>
            <OrderEditor 
              order={order as any} 
              onSave={async (updatedOrder) => {
                'use server';
                // This will be handled by the client component
                console.log('Order update requested:', updatedOrder);
              }}
            />
          </Suspense>
        </div>
      </AdminHeaderLayout>
    </AdminGuard>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function OrderEditorSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
