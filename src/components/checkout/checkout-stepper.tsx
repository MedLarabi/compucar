"use client";

import { useCheckoutStore } from '@/stores';
import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  { id: 'cart', name: 'Cart Review', description: 'Review your items' },
  { id: 'shipping', name: 'Shipping', description: 'Delivery address' },
  { id: 'payment', name: 'Payment', description: 'Payment method' },
  { id: 'review', name: 'Review', description: 'Confirm order' },
] as const;

export function CheckoutStepper() {
  const { step } = useCheckoutStore();

  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="flex items-center justify-between">
      {steps.map((stepItem, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const isUpcoming = index > currentStepIndex;

        return (
          <div key={stepItem.id} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isCurrent && "border-primary text-primary",
                  isUpcoming && "border-muted-foreground text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>

              {/* Step Info */}
              <div className="ml-3 hidden sm:block">
                <p
                  className={cn(
                    "text-sm font-medium",
                    (isCompleted || isCurrent) && "text-foreground",
                    isUpcoming && "text-muted-foreground"
                  )}
                >
                  {stepItem.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stepItem.description}
                </p>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-px mx-4 transition-colors",
                  isCompleted ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}







