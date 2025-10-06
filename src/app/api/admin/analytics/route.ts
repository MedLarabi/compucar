import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/database/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30"; // days
    const daysBack = parseInt(range);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysBack);

    // Get total stats
    const [
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      previousRevenue,
      previousOrders,
      previousCustomers,
    ] = await Promise.all([
      // Current period revenue
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: { not: 'CANCELLED' },
        },
        _sum: { total: true },
      }),
      
      // Current period orders
      prisma.order.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      
      // Total customers
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
        },
      }),
      
      // Total products
      prisma.product.count({
        where: {
          status: 'ACTIVE',
        },
      }),
      
      // Previous period revenue for comparison
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: new Date(startDate.getTime() - daysBack * 24 * 60 * 60 * 1000),
            lt: startDate,
          },
          status: { not: 'CANCELLED' },
        },
        _sum: { total: true },
      }),
      
      // Previous period orders for comparison
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(startDate.getTime() - daysBack * 24 * 60 * 60 * 1000),
            lt: startDate,
          },
        },
      }),
      
      // Previous period customers
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: {
            lt: startDate,
          },
        },
      }),
    ]);

    // Calculate percentage changes
    const currentRevenue = Number(totalRevenue._sum.total) || 0;
    const prevRevenue = Number(previousRevenue._sum.total) || 0;
    const revenueChange = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    
    const ordersChange = previousOrders > 0 ? ((totalOrders - previousOrders) / previousOrders) * 100 : 0;
    const customersChange = previousCustomers > 0 ? ((totalCustomers - previousCustomers) / previousCustomers) * 100 : 0;

    // Get daily sales data for the chart
    const salesData = [];
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [dayRevenue, dayOrders] = await Promise.all([
        prisma.order.aggregate({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
            status: { not: 'CANCELLED' },
          },
          _sum: { total: true },
        }),
        prisma.order.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
        }),
      ]);

      salesData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Number(dayRevenue._sum.total) || 0,
        orders: dayOrders,
      });
    }

    // Get top products by revenue
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId', 'name'],
      where: {
        order: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: { not: 'CANCELLED' },
        },
      },
      _sum: {
        price: true,
        quantity: true,
      },
      orderBy: {
        _sum: {
          price: 'desc',
        },
      },
      take: 10,
    });

    const formattedTopProducts = topProducts.map(product => ({
      name: product.name,
      sales: product._sum.quantity || 0,
      revenue: Number(product._sum.price) || 0,
    }));

    // Get order status distribution
    const orderStatusCounts = await prisma.order.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        status: true,
      },
    });

    const totalOrdersForStatus = orderStatusCounts.reduce((sum, item) => sum + item._count.status, 0);
    const orderStatus = orderStatusCounts.map(item => ({
      status: item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase(),
      count: item._count.status,
      percentage: totalOrdersForStatus > 0 ? Math.round((item._count.status / totalOrdersForStatus) * 100) : 0,
    }));

    // Get customer growth data (monthly for the past 6 months)
    const customerGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      
      const nextMonth = new Date(date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const customerCount = await prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: {
            lt: nextMonth,
          },
        },
      });

      customerGrowth.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        customers: customerCount,
      });
    }

    const analyticsData = {
      stats: {
        totalRevenue: currentRevenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        revenueChange: Math.round(revenueChange * 100) / 100,
        ordersChange: Math.round(ordersChange * 100) / 100,
        customersChange: Math.round(customersChange * 100) / 100,
        productsChange: 0, // Products don't change much, set to 0 for now
      },
      salesData,
      topProducts: formattedTopProducts,
      orderStatus,
      customerGrowth,
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}