import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CheckoutState, Address, ShippingMethod, PaymentMethod } from '@/types/checkout';

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      step: 'cart',
      customerInfo: null,
      billingAddress: null,
      shippingAddress: null,
      shippingMethod: null,
      paymentMethod: null,
      sameAsShipping: true,
      isLoading: false,
      error: null,

      setStep: (step) => set({ step }),

      setCustomerInfo: (info) => set({ customerInfo: info }),

      setBillingAddress: (address) => set({ billingAddress: address }),

      setShippingAddress: (address) => set({ shippingAddress: address }),

      setShippingMethod: (method) => set({ shippingMethod: method }),

      setPaymentMethod: (method) => set({ paymentMethod: method }),

      setSameAsShipping: (same) => set({ sameAsShipping: same }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      reset: () => set({
        step: 'cart',
        customerInfo: null,
        billingAddress: null,
        shippingAddress: null,
        shippingMethod: null,
        paymentMethod: null,
        sameAsShipping: true,
        isLoading: false,
        error: null,
      }),
    }),
    {
      name: 'compucar-checkout',
      partialize: (state) => ({
        customerInfo: state.customerInfo,
        billingAddress: state.billingAddress,
        shippingAddress: state.shippingAddress,
        shippingMethod: state.shippingMethod,
        paymentMethod: state.paymentMethod,
        sameAsShipping: state.sameAsShipping,
      }),
    }
  )
);








