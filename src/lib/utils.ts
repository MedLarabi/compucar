import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | any, currency: string = "DZD"): string {
  // Handle Prisma Decimal types
  const numericAmount = typeof amount === 'object' && amount !== null && 'toNumber' in amount 
    ? amount.toNumber() 
    : typeof amount === 'string' 
      ? parseFloat(amount) 
      : amount;
      
  try {
    // Try to use Intl.NumberFormat with the specified currency
    return new Intl.NumberFormat("ar-DZ", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericAmount);
  } catch (error) {
    // Fallback to simple formatting if currency is not supported
    console.warn(`Currency ${currency} not supported, falling back to simple format`);
    return `${numericAmount.toFixed(0)} ${currency}`;
  }
}

// Helper function for simple price formatting (returns DZD format)
export function formatPrice(price: number | string | any): string {
  // Handle null/undefined cases first
  if (price === null || price === undefined) {
    return "0 DZD";
  }

  let numericPrice: number;

  // Handle Prisma Decimal objects
  if (typeof price === 'object' && price !== null && 'toNumber' in price) {
    numericPrice = price.toNumber();
  }
  // Handle string values
  else if (typeof price === 'string') {
    numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) {
      return "0 DZD";
    }
  }
  // Handle number values
  else if (typeof price === 'number') {
    numericPrice = price;
  }
  // Handle any other type
  else {
    numericPrice = 0;
  }

  // Ensure it's a valid number before calling toFixed
  if (isNaN(numericPrice) || !isFinite(numericPrice)) {
    return "0 DZD";
  }
      
  return `${numericPrice.toFixed(0)} DZD`;
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(dateObj);
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}
