"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to notifications page when accessing /admin
    router.replace('/admin/notifications');
  }, [router]);

  return null; // Page will redirect, so return nothing
}
