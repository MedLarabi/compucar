"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";

interface AdminGuardProps {
  children: React.ReactNode;
  requiredRole?: "ADMIN" | "SUPER_ADMIN";
}

export function AdminGuard({ children, requiredRole = "ADMIN" }: AdminGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/admin");
    }
  }, [status, router]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated
  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              You need to sign in to access the admin dashboard.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => router.push("/auth/login?callbackUrl=/admin")}
                className="w-full"
              >
                Sign In
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/")}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user has required role
  const userRole = session?.user?.role;
  const isAdmin = session?.user?.isAdmin;
  const hasRequiredAccess = 
    userRole === "SUPER_ADMIN" || 
    isAdmin === true ||
    (requiredRole === "ADMIN" && (userRole === "ADMIN" || userRole === "SUPER_ADMIN"));

  if (!hasRequiredAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have the required permissions to access this area.
              {requiredRole === "SUPER_ADMIN" 
                ? " Super admin access is required." 
                : " Admin access is required."
              }
            </p>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                onClick={() => router.push("/account")}
                className="w-full"
              >
                Go to Account
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/")}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated and has required role
  return <>{children}</>;
}

// Helper hook for checking admin access
export function useAdminAccess() {
  const { data: session } = useSession();
  
  const userRole = session?.user?.role;
  const isAdminFlag = session?.user?.isAdmin;
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || isAdminFlag === true;
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  
  return {
    isAdmin,
    isSuperAdmin,
    userRole: session?.user?.role,
    canAccessAdmin: isAdmin,
    canAccessSuperAdmin: isSuperAdmin,
  };
}
