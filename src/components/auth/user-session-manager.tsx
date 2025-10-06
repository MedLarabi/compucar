"use client";

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useWishlistStore, useCartStore } from '@/stores';

/**
 * Component that manages user session changes and clears local storage
 * when switching between users to ensure data isolation
 */
export function UserSessionManager() {
  const { data: session } = useSession();
  const { initializeForUser } = useWishlistStore();
  const { clearCart } = useCartStore();
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentUserId = session?.user?.id || null;
    const previousUserId = previousUserIdRef.current;

    // If user has changed (including login/logout)
    if (currentUserId !== previousUserId) {
      // Clear wishlist and cart for the new user session
      initializeForUser(currentUserId || undefined);
      
      // Only clear cart if switching from one user to another
      // (not on initial load or logout)
      if (previousUserId !== null) {
        clearCart();
      }

      // Update the ref for next comparison
      previousUserIdRef.current = currentUserId;
    }
  }, [session?.user?.id, initializeForUser, clearCart]);

  // This component doesn't render anything
  return null;
}


















































