import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

// Protected routes that require authentication
const protectedRoutes = [
  "/account",
  "/dashboard",
  "/profile",
  "/orders",
  "/admin",
];

// Admin routes that require admin role
const adminRoutes = [
  "/admin",
];

// Public routes that should redirect to dashboard if logged in
const publicRoutes = [
  "/auth/login",
  "/auth/register",
];

export async function authMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const session = await auth();

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(route)
  );

  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Redirect to login if trying to access protected route without session
  if (isProtectedRoute && !session) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin access
  if (isAdminRoute && session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // Redirect to account if logged in user tries to access auth pages
  if (isPublicRoute && session) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  // Redirect /dashboard to /account for consistency
  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  return NextResponse.next();
}

// Helper function to check if user has required role
export function hasRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

// Helper function to check if user is admin
export function isAdmin(userRole: string): boolean {
  return userRole === "ADMIN" || userRole === "SUPER_ADMIN";
}
