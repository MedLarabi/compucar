/**
 * Cart validation utilities for COD checkout
 */

export interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  [key: string]: any;
}

/**
 * Validate cart items against the database
 * Returns valid items and removes invalid ones
 */
export async function validateCartItems(cartItems: CartItem[]): Promise<{
  validItems: CartItem[];
  invalidItems: CartItem[];
  errors: string[];
}> {
  if (!cartItems || cartItems.length === 0) {
    return { validItems: [], invalidItems: [], errors: [] };
  }

  try {
    // Get product IDs from cart
    const productIds = cartItems.map(item => item.productId);
    
    // Fetch existing products from the database
    const response = await fetch(`/api/products?ids=${productIds.join(',')}`);
    
    if (!response.ok) {
      throw new Error('Failed to validate cart items');
    }
    
    const data = await response.json();
    const existingProducts = data.data || [];
    const existingProductIds = existingProducts.map((p: any) => p.id);
    
    // Separate valid and invalid items
    const validItems: CartItem[] = [];
    const invalidItems: CartItem[] = [];
    const errors: string[] = [];
    
    cartItems.forEach(item => {
      if (existingProductIds.includes(item.productId)) {
        // Item is valid - find the current product data
        const currentProduct = existingProducts.find((p: any) => p.id === item.productId);
        if (currentProduct) {
          // Update item with current product information
          validItems.push({
            ...item,
            name: currentProduct.name,
            price: Number(currentProduct.price),
          });
        } else {
          validItems.push(item); // Keep original if we can't find current data
        }
      } else {
        invalidItems.push(item);
        errors.push(`Product "${item.name}" is no longer available`);
      }
    });
    
    return { validItems, invalidItems, errors };
    
  } catch (error) {
    console.error('Error validating cart items:', error);
    return { 
      validItems: cartItems, // Return original items if validation fails
      invalidItems: [], 
      errors: ['Failed to validate cart items'] 
    };
  }
}

/**
 * Clean up cart by removing invalid items
 */
export function cleanCartItems(cartItems: CartItem[]): CartItem[] {
  return cartItems.filter(item => {
    // Basic validation
    return (
      item.productId && 
      typeof item.productId === 'string' &&
      item.name && 
      typeof item.name === 'string' &&
      item.quantity && 
      item.quantity > 0 &&
      item.price !== undefined &&
      !isNaN(Number(item.price))
    );
  });
}

/**
 * Format cart items for COD checkout
 */
export function formatCartForCOD(cartItems: CartItem[]): Array<{
  productId: string;
  name: string;
  sku: string;
  unitPriceCents: number;
  quantity: number;
  weightGr: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}> {
  return cartItems.map(item => ({
    productId: item.productId,
    name: item.name,
    sku: item.category || 'AUTO',
    unitPriceCents: Math.round(item.price * 100),
    quantity: item.quantity,
    weightGr: 500, // Default weight - should be from product data
    lengthCm: 20,
    widthCm: 15,
    heightCm: 3
  }));
}
