import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/database/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log('Dashboard API called');
    const session = await auth();
    console.log('Session:', session?.user ? { id: session.user.id, role: session.user.role } : 'No session');
    
    if (!session?.user) {
      console.log('Unauthorized: No session');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      console.log('Forbidden: Role is', session.user.role);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log('Authorization passed, fetching data...');

    // Get basic stats with error handling
    let totalOrders = 0;
    let totalUsers = 0;
    let totalProducts = 0;
    let totalRevenue = 0;
    let recentOrders: any[] = [];

    try {
      // Basic counts
      totalOrders = await prisma.order.count();
      console.log('Orders count:', totalOrders);

      totalUsers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
      console.log('Users count:', totalUsers);

      totalProducts = await prisma.product.count({ where: { status: 'ACTIVE' } });
      console.log('Products count:', totalProducts);

      // Total revenue from non-cancelled orders
      const revenueResult = await prisma.order.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { total: true },
      });
      totalRevenue = Number(revenueResult._sum.total) || 0;
      console.log('Revenue total:', totalRevenue);

      // Recent orders with basic info
      recentOrders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      });
      console.log('Recent orders count:', recentOrders.length);

    } catch (dbError) {
      console.error('Database query error:', dbError);
      // Continue with default values if database queries fail
    }

    // Simple sales data for the past 6 months
    const salesData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(now.getMonth() - i);
      
      salesData.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        sales: Math.random() * 1000, // Mock data for now
        orders: Math.floor(Math.random() * 50),
      });
    }

    // Simple category data
    const categoryData = [
      { name: 'Electronics', value: 45, color: 'hsl(210, 70%, 50%)' },
      { name: 'Software', value: 30, color: 'hsl(120, 70%, 50%)' },
      { name: 'Hardware', value: 25, color: 'hsl(60, 70%, 50%)' },
    ];

    // Format recent orders
    const formattedRecentOrders = recentOrders.map(order => ({
      id: order.id, // Use actual database ID for navigation
      orderNumber: order.orderNumber, // Keep order number for display
      customer: order.user 
        ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || order.user.email
        : 'Guest Customer',
      total: Number(order.total),
      status: order.status.toLowerCase(),
      date: order.createdAt.toISOString().split('T')[0],
    }));

    const dashboardData = {
      stats: {
        totalRevenue: `$${totalRevenue.toLocaleString()}`,
        totalOrders: totalOrders.toLocaleString(),
        totalUsers: totalUsers.toLocaleString(),
        totalProducts: totalProducts.toLocaleString(),
        revenueChange: '+5.2%',
        ordersChange: '+12.1%',
        usersChange: '+8.3%',
        productsChange: '+2.1%',
        revenueChangeType: 'positive' as const,
        ordersChangeType: 'positive' as const,
        usersChangeType: 'positive' as const,
        productsChangeType: 'positive' as const,
      },
      salesData,
      categoryData,
      recentOrders: formattedRecentOrders,
    };

    console.log('Dashboard data prepared successfully');
    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}