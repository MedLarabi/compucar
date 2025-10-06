import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CheckoutState, Address, ShippingMethod, PaymentMethod } from '@/types/checkout';

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      step: 'cart',
      customerInfo: null,
      paymentMethod: null,
      isLoading: false,
      error: null,

      setStep: (step) => set({ step }),

      setCustomerInfo: (info) => set({ customerInfo: info }),

      setPaymentMethod: (method) => set({ paymentMethod: method }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      reset: () => set({
        step: 'cart',
        customerInfo: null,
        paymentMethod: null,
        isLoading: false,
        error: null,
      }),
    }),
    {
      name: 'compucar-checkout',
      partialize: (state) => ({
        customerInfo: state.customerInfo,
        paymentMethod: state.paymentMethod,
      }),
    }
  )
);








