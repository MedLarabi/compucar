import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WishlistState, WishlistItem } from '@/types/cart';

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const items = get().items;
        const existingItem = items.find(item => item.productId === newItem.productId);

        if (!existingItem) {
          const wishlistItem: WishlistItem = {
            id: `${newItem.productId}-${Date.now()}`,
            addedAt: new Date(),
            ...newItem,
          };

          set((state) => ({
            items: [...state.items, wishlistItem],
          }));
        }
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter(item => item.productId !== productId),
        }));
      },

      isInWishlist: (productId) => {
        return get().items.some(item => item.productId === productId);
      },

      clearWishlist: () => {
        set({ items: [] });
      },

      // New method to initialize user-specific wishlist
      initializeForUser: (userId?: string) => {
        // Clear current items when switching users
        set({ items: [] });
      },
    }),
    {
      name: 'compucar-wishlist',
    }
  )
);