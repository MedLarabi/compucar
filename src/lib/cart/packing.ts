export interface CartItem {
  name: string;
  sku?: string;
  quantity: number;
  weightGr: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}

export interface ParcelDimensions {
  length: number;  // cm
  width: number;   // cm
  height: number;  // cm
  weight: number;  // kg as integer
}

/**
 * Create a concise product list summary for Yalidine
 * Example: "T-Shirt (TS-1) x2, Cap (CP-3) x1"
 */
export function summarizeItems(items: Array<{name: string; sku?: string; quantity: number}>): string {
  const summary = items
    .map(item => {
      const name = item.name;
      const sku = item.sku ? ` (${item.sku})` : "";
      const quantity = item.quantity > 1 ? ` x${item.quantity}` : "";
      return `${name}${sku}${quantity}`;
    })
    .join(", ");
  
  // Limit to 240 characters for Yalidine API
  return summary.length > 240 ? summary.slice(0, 237) + "..." : summary;
}

/**
 * Compute parcel dimensions and weight from cart items
 * This is a naive implementation - you may want to customize based on your products
 */
export function computeParcel(items: CartItem[]): ParcelDimensions {
  if (items.length === 0) {
    return { length: 20, width: 15, height: 5, weight: 1 };
  }

  // Sum total weight in grams
  const totalWeightGr = items.reduce((sum, item) => {
    return sum + (item.weightGr * item.quantity);
  }, 0);

  // For dimensions, we take the maximum length and width,
  // and stack heights (assuming items are stackable)
  const maxLength = Math.max(...items.map(item => item.lengthCm || 20));
  const maxWidth = Math.max(...items.map(item => item.widthCm || 15));
  const totalHeight = items.reduce((sum, item) => {
    const itemHeight = item.heightCm || 3; // default 3cm per item
    return sum + (itemHeight * item.quantity);
  }, 0);

  // Convert weight to kg and round up (Yalidine expects integer kg)
  const weightKg = Math.max(1, Math.ceil(totalWeightGr / 1000));

  return {
    length: Math.round(maxLength),
    width: Math.round(maxWidth),
    height: Math.round(totalHeight),
    weight: weightKg
  };
}

/**
 * Estimate shipping cost based on weight and dimensions
 * This is a placeholder - implement your actual shipping logic
 */
export function estimateShippingCost(parcel: ParcelDimensions, wilayaName: string): number {
  // Base cost
  let cost = 250; // 250 DZD base cost

  // Weight-based pricing
  if (parcel.weight > 2) {
    cost += (parcel.weight - 2) * 50; // 50 DZD per extra kg
  }

  // Size-based pricing (volumetric weight)
  const volumetricWeight = (parcel.length * parcel.width * parcel.height) / 5000; // 5000 cm³ = 1kg
  if (volumetricWeight > parcel.weight) {
    cost += (volumetricWeight - parcel.weight) * 30; // 30 DZD per volumetric kg
  }

  // Distance-based pricing (simplified)
  const isRemoteWilaya = [
    'Adrar', 'Tamanrasset', 'Illizi', 'Tindouf', 'El Oued', 'Ouargla'
  ].includes(wilayaName);
  
  if (isRemoteWilaya) {
    cost += 200; // 200 DZD extra for remote areas
  }

  return Math.round(cost);
}

/**
 * Validate that all items have required physical properties
 */
export function validatePhysicalItems(items: CartItem[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  items.forEach((item, index) => {
    if (!item.weightGr || item.weightGr <= 0) {
      errors.push(`Item ${index + 1} (${item.name}) must have weight > 0`);
    }
    
    if (item.weightGr > 50000) { // 50kg limit per item
      errors.push(`Item ${index + 1} (${item.name}) exceeds 50kg weight limit`);
    }

    if (item.lengthCm && item.lengthCm > 200) {
      errors.push(`Item ${index + 1} (${item.name}) exceeds 200cm length limit`);
    }

    if (item.widthCm && item.widthCm > 200) {
      errors.push(`Item ${index + 1} (${item.name}) exceeds 200cm width limit`);
    }

    if (item.heightCm && item.heightCm > 200) {
      errors.push(`Item ${index + 1} (${item.name}) exceeds 200cm height limit`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Apply parcel dimension overrides from user input
 */
export function applyParcelOverrides(
  computed: ParcelDimensions,
  overrides?: Partial<ParcelDimensions>
): ParcelDimensions {
  if (!overrides) return computed;

  return {
    length: overrides.length ?? computed.length,
    width: overrides.width ?? computed.width,
    height: overrides.height ?? computed.height,
    weight: overrides.weight ?? computed.weight,
  };
}
