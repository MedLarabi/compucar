'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugSessionPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>No session found</div>;
  }

  // Check admin access logic
  const userRole = session.user?.role;
  const isAdminFlag = session.user?.isAdmin;
  const hasAdminAccess = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || isAdminFlag === true;

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Session Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">User Information:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>ID: {session.user?.id}</li>
              <li>Email: {session.user?.email}</li>
              <li>Name: {session.user?.name}</li>
              <li>Role: {session.user?.role}</li>
              <li>isAdmin: {String(session.user?.isAdmin)}</li>
              <li>First Name: {session.user?.firstName}</li>
              <li>Last Name: {session.user?.lastName}</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Admin Access Check:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>userRole === "ADMIN": {String(userRole === "ADMIN")}</li>
              <li>userRole === "SUPER_ADMIN": {String(userRole === "SUPER_ADMIN")}</li>
              <li>isAdminFlag === true: {String(isAdminFlag === true)}</li>
              <li>hasAdminAccess: {String(hasAdminAccess)}</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Raw Session Data:</h3>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
