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

    // Calculate date ranges
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysBack);
    
    const previousEndDate = new Date(startDate);
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - daysBack);

    // === CORE METRICS ===
    const [
      currentStats,
      previousStats,
      productStats,
      customerStats
    ] = await Promise.all([
      // Current period stats
      prisma.$transaction([
        prisma.order.aggregate({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            status: { not: 'CANCELLED' },
          },
          _sum: { total: true },
          _count: true,
          _avg: { total: true },
        }),
        prisma.payment.aggregate({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            status: 'SUCCEEDED',
          },
          _sum: { amount: true },
          _count: true,
        }),
      ]),
      
      // Previous period stats
      prisma.$transaction([
        prisma.order.aggregate({
          where: {
            createdAt: { gte: previousStartDate, lte: previousEndDate },
            status: { not: 'CANCELLED' },
          },
          _sum: { total: true },
          _count: true,
        }),
        prisma.payment.aggregate({
          where: {
            createdAt: { gte: previousStartDate, lte: previousEndDate },
            status: 'SUCCEEDED',
          },
          _sum: { amount: true },
          _count: true,
        }),
      ]),
      
      // Product stats
      prisma.$transaction([
        prisma.product.count({ where: { status: 'ACTIVE' } }),
        prisma.product.count({ where: { quantity: { lt: 10 } } }),
        prisma.product.count({ where: { quantity: { lte: 0 } } }),
        prisma.productReview.aggregate({
          _avg: { rating: true },
          _count: true,
        }),
      ]),
      
      // Customer stats
      prisma.$transaction([
        prisma.user.count({ where: { role: 'CUSTOMER' } }),
        prisma.user.count({
          where: {
            role: 'CUSTOMER',
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        prisma.order.groupBy({
          by: ['userId'],
          where: {
            createdAt: { gte: startDate, lte: endDate },
            userId: { not: null },
          },
          _count: true,
          orderBy: {
            _count: {
              userId: 'desc'
            }
          }
        }),
      ]),
    ]);

    // Calculate changes
    const currentRevenue = Number(currentStats[0]._sum.total) || 0;
    const previousRevenue = Number(previousStats[0]._sum.total) || 0;
    const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    
    const currentOrders = currentStats[0]._count;
    const previousOrders = previousStats[0]._count;
    const ordersChange = previousOrders > 0 ? ((currentOrders - previousOrders) / previousOrders) * 100 : 0;

    // === DAILY SALES DATA ===
    const salesData = [];
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayStats = await prisma.order.aggregate({
        where: {
          createdAt: { gte: date, lt: nextDate },
          status: { not: 'CANCELLED' },
        },
        _sum: { total: true },
        _count: true,
      });

      salesData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Number(dayStats._sum.total) || 0,
        orders: dayStats._count,
      });
    }

    // === TOP PRODUCTS ===
    const topProductsData = await prisma.orderItem.groupBy({
      by: ['productId', 'name'],
      where: {
        order: {
          createdAt: { gte: startDate, lte: endDate },
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

    const topProducts = topProductsData.map((product: any) => ({
      name: product.name,
      sales: Number(product._sum.quantity) || 0,
      revenue: Number(product._sum.price) || 0,
    }));

    // === ORDER STATUS DISTRIBUTION ===
    const orderStatusData = await prisma.order.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: { status: true },
    });

    const totalOrdersCount = orderStatusData.reduce((sum: number, item: any) => sum + item._count.status, 0);
    const orderStatus = orderStatusData.map((item: any) => ({
      status: item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase(),
      count: item._count.status,
      percentage: Math.round((item._count.status / totalOrdersCount) * 100)
    }));

    // === PAYMENT METHODS ===
    const paymentMethodsData = await prisma.payment.groupBy({
      by: ['method'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'SUCCEEDED',
      },
      _sum: { amount: true },
      _count: { method: true },
    });

    const paymentMethods = paymentMethodsData.map((payment: any) => ({
      method: payment.method,
      count: payment._count.method,
      revenue: Number(payment._sum.amount) || 0,
    }));

    // === CUSTOMER GROWTH (Monthly) ===
    const customerGrowth = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      
      const nextMonth = new Date(date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const customerCount = await prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: { lt: nextMonth },
        },
      });

      const newCustomers = await prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: { gte: date, lt: nextMonth },
        },
      });

      customerGrowth.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        totalCustomers: customerCount,
        newCustomers: newCustomers,
      });
    }

    // === CATEGORY PERFORMANCE ===
    const categoryPerformanceData = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
        price: true
      },
      where: {
        order: {
          createdAt: {
            gte: startDate
          }
        }
      }
    });

    // Get product details for categories
    const productIds = categoryPerformanceData.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, categoryId: true, category: { select: { name: true } } }
    });

    // Group by category
    const categoryStats = products.reduce((acc: any, product: any) => {
      const categoryName = product.category?.name || 'Uncategorized';
      const orderItem = categoryPerformanceData.find((item: any) => item.productId === product.id);
      
      if (!acc[categoryName]) {
        acc[categoryName] = { quantity: 0, revenue: 0 };
      }
      
      if (orderItem) {
        acc[categoryName].quantity += Number(orderItem._sum.quantity) || 0;
        acc[categoryName].revenue += Number(orderItem._sum.price) || 0;
      }
      
      return acc;
    }, {});

    const topCategories = Object.entries(categoryStats)
      .map(([name, stats]: [string, any]) => ({
        name,
        quantity: stats.quantity,
        revenue: stats.revenue
      }))
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);

    // === RECENT ACTIVITY ===
    const recentActivity = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: startDate } },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          createdAt: true,
          user: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.user.findMany({
        where: {
          role: 'CUSTOMER',
          createdAt: { gte: startDate },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.productReview.findMany({
        where: { createdAt: { gte: startDate } },
        select: {
          id: true,
          rating: true,
          title: true,
          name: true,
          createdAt: true,
          product: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // === INVENTORY ALERTS ===
    const inventoryAlerts = await prisma.product.findMany({
      where: {
        OR: [
          { quantity: { lte: 0 } },
          { quantity: { lt: 10 } },
        ],
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        quantity: true,
        sku: true,
      },
      orderBy: { quantity: 'asc' },
    });

    // === BUILD RESPONSE ===
    const analyticsData = {
      // Core metrics
      stats: {
        totalRevenue: currentRevenue,
        totalOrders: currentOrders,
        totalCustomers: customerStats[0],
        totalProducts: productStats[0],
        averageOrderValue: Number(currentStats[0]._avg.total) || 0,
        totalPayments: currentStats[1]._count,
        revenueChange: Math.round(revenueChange * 100) / 100,
        ordersChange: Math.round(ordersChange * 100) / 100,
        conversionRate: customerStats[0] > 0 ? Math.round((currentOrders / customerStats[0]) * 100 * 100) / 100 : 0,
      },
      
      // Product insights
      productInsights: {
        totalProducts: productStats[0],
        lowStockProducts: productStats[1],
        outOfStockProducts: productStats[2],
        averageRating: Math.round((Number(productStats[3]._avg.rating) || 0) * 100) / 100,
        totalReviews: productStats[3]._count,
      },
      
      // Customer insights
      customerInsights: {
        totalCustomers: customerStats[0],
        newCustomers: customerStats[1],
        repeatCustomers: customerStats[2].filter((group: any) => typeof group._count === 'number' && group._count > 1).length,
        customerRetentionRate: customerStats[0] > 0 ? Math.round(((customerStats[2].filter((group: any) => typeof group._count === 'number' && group._count > 1).length) / customerStats[0]) * 100 * 100) / 100 : 0,
      },
      
      // Charts data
      salesData,
      topProducts,
      orderStatus,
      paymentMethods,
      customerGrowth,
      categories: topCategories,
      
      // Activity feeds
      recentOrders: recentActivity[0].map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Guest',
        email: order.user?.email || 'N/A',
        total: Number(order.total),
        status: order.status,
        createdAt: order.createdAt,
      })),
      
      newCustomers: recentActivity[1].map(customer => ({
        id: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        createdAt: customer.createdAt,
      })),
      
      recentReviews: recentActivity[2].map(review => ({
        id: review.id,
        rating: review.rating,
        title: review.title || 'No title',
        customerName: review.name,
        productName: review.product.name,
        createdAt: review.createdAt,
      })),
      
      // Alerts
      inventoryAlerts: inventoryAlerts.map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        quantity: product.quantity,
        status: product.quantity <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
      })),
      
      // Summary
      summary: {
        period: `${daysBack} days`,
        dataGeneratedAt: new Date().toISOString(),
        totalDataPoints: salesData.length,
        criticalAlerts: inventoryAlerts.filter(p => p.quantity <= 0).length,
        lowStockAlerts: inventoryAlerts.filter(p => p.quantity > 0 && p.quantity < 10).length,
      },
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error("Error fetching comprehensive analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
