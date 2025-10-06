import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartState, CartItem } from '@/types/cart';

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      totalItems: 0,
      totalPrice: 0,

      addItem: (newItem) => {
        const items = get().items;
        const existingItem = items.find(item => 
          item.productId === newItem.productId && 
          item.variantId === newItem.variantId
        );

        if (existingItem) {
          // Update quantity if item already exists
          const newQuantity = Math.min(
            existingItem.quantity + newItem.quantity,
            existingItem.maxQuantity
          );
          
          set((state) => {
            const updatedItems = state.items.map(item =>
              item.id === existingItem.id
                ? { ...item, quantity: newQuantity }
                : item
            );
            
            return {
              items: updatedItems,
              totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
              totalPrice: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            };
          });
        } else {
          // Add new item
          const cartItem: CartItem = {
            id: `${newItem.productId}-${newItem.variantId || 'default'}-${Date.now()}`,
            ...newItem,
          };

          set((state) => {
            const updatedItems = [...state.items, cartItem];
            
            return {
              items: updatedItems,
              totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
              totalPrice: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            };
          });
        }
      },

      removeItem: (id) => {
        set((state) => {
          const updatedItems = state.items.filter(item => item.id !== id);
          
          return {
            items: updatedItems,
            totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
            totalPrice: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          };
        });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set((state) => {
          const updatedItems = state.items.map(item => {
            if (item.id === id) {
              const newQuantity = Math.min(quantity, item.maxQuantity);
              return { ...item, quantity: newQuantity };
            }
            return item;
          });
          
          return {
            items: updatedItems,
            totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
            totalPrice: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          };
        });
      },

      clearCart: () => {
        set({
          items: [],
          totalItems: 0,
          totalPrice: 0,
        });
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      // Check if cart contains only digital/virtual products
      isDigitalOnly: () => {
        const items = get().items;
        return items.length > 0 && items.every(item => 
          item.isVirtual === true || 
          item.isDigital === true || 
          item.requiresShipping === false
        );
      },

      // Check if cart needs shipping
      needsShipping: () => {
        const items = get().items;
        return items.some(item => 
          (item.requiresShipping !== false) && 
          (item.isVirtual !== true) && 
          (item.isDigital !== true)
        );
      },
    }),
    {
      name: 'compucar-cart',
      partialize: (state) => ({
        items: state.items,
        totalItems: state.totalItems,
        totalPrice: state.totalPrice,
      }),
    }
  )
);







