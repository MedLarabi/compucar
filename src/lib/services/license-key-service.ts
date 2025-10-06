import { prisma } from "@/lib/database/prisma";
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.LICENSE_KEY_ENCRYPTION_KEY || "fallback-key-for-development-only-change-in-production";
const ALGORITHM = "aes-256-gcm";

// Encryption functions
export function encryptLicenseKey(plainKey: string): string {
  try {
    // Create a simple base64 encoding with salt for basic security
    // In production, use a proper encryption library like node-forge or crypto with proper IV handling
    const salt = crypto.randomBytes(8).toString('hex');
    const combined = salt + ':' + plainKey;
    const encoded = Buffer.from(combined).toString('base64');
    return encoded;
  } catch (error) {
    console.error("Error encrypting license key:", error);
    // Fallback to base64 encoding
    return Buffer.from(plainKey).toString('base64');
  }
}

export function decryptLicenseKey(encryptedKey: string): string {
  try {
    // Decode from base64
    const decoded = Buffer.from(encryptedKey, 'base64').toString('utf8');
    
    // Check if it has salt format
    if (decoded.includes(':')) {
      const parts = decoded.split(':');
      if (parts.length >= 2) {
        // Remove salt and return the key
        return parts.slice(1).join(':');
      }
    }
    
    // If no salt format, return as is (fallback)
    return decoded;
  } catch (error) {
    console.error("Error decrypting license key:", error);
    // Try direct base64 decode as fallback
    try {
      return Buffer.from(encryptedKey, 'base64').toString('utf8');
    } catch {
      // Last resort - return as is
      return encryptedKey;
    }
  }
}

// License key generation
export function generateLicenseKey(pattern?: string): string {
  if (!pattern) {
    // Default pattern: XXXX-XXXX-XXXX-XXXX
    pattern = "XXXX-XXXX-XXXX-XXXX";
  }
  
  return pattern.replace(/X/g, () => {
    return Math.random().toString(36).substring(2, 3).toUpperCase();
  }).replace(/\{RANDOM4\}/g, () => {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  }).replace(/\{RANDOM6\}/g, () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }).replace(/\{RANDOM8\}/g, () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }).replace(/\{YEAR\}/g, () => {
    return new Date().getFullYear().toString();
  });
}

// Validate license key format
export function validateLicenseKeyFormat(key: string): boolean {
  // Basic validation - ensure key is not empty and has reasonable length
  return key.length >= 4 && key.length <= 100 && key.trim() === key;
}

// CRUD operations for license keys
export async function createLicenseKey(productId: string, keyValue: string, notes?: string) {
  console.log("createLicenseKey called with:", { productId, keyValue, notes });
  
  if (!validateLicenseKeyFormat(keyValue)) {
    throw new Error("Invalid license key format");
  }
  
  console.log("Checking for existing license key...");
  // Check if key already exists
  const existing = await prisma.licenseKey.findUnique({
    where: { keyValue }
  });
  console.log("Existing key check result:", existing ? "Found existing" : "No existing key");
  
  if (existing) {
    throw new Error("License key already exists");
  }
  
  const encryptedKey = encryptLicenseKey(keyValue);
  
  return await prisma.licenseKey.create({
    data: {
      productId,
      keyValue,
      encryptedKey,
      notes,
      status: "AVAILABLE"
    },
    include: {
      product: {
        select: { name: true, sku: true }
      }
    }
  });
}

export async function createBulkLicenseKeys(productId: string, keys: string[], notes?: string) {
  const results = [];
  const errors = [];
  
  for (const keyValue of keys) {
    try {
      if (!validateLicenseKeyFormat(keyValue)) {
        errors.push({ key: keyValue, error: "Invalid format" });
        continue;
      }
      
      // Check if key already exists
      const existing = await prisma.licenseKey.findUnique({
        where: { keyValue }
      });
      
      if (existing) {
        errors.push({ key: keyValue, error: "Already exists" });
        continue;
      }
      
      const encryptedKey = encryptLicenseKey(keyValue);
      
      const created = await prisma.licenseKey.create({
        data: {
          productId,
          keyValue,
          encryptedKey,
          notes,
          status: "AVAILABLE"
        }
      });
      
      results.push(created);
    } catch (error) {
      errors.push({ key: keyValue, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }
  
  return { created: results, errors };
}

export async function getLicenseKeysForProduct(productId: string) {
  return await prisma.licenseKey.findMany({
    where: { productId },
    include: {
      assignedToOrder: {
        select: { orderNumber: true, createdAt: true }
      },
      assignedToUser: {
        select: { email: true, firstName: true, lastName: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getAvailableLicenseKeyCount(productId: string): Promise<number> {
  return await prisma.licenseKey.count({
    where: {
      productId,
      status: "AVAILABLE"
    }
  });
}

export async function assignLicenseKeyToOrder(productId: string, orderId: string, userId?: string) {
  // Find an available license key for this product
  const availableKey = await prisma.licenseKey.findFirst({
    where: {
      productId,
      status: "AVAILABLE"
    },
    orderBy: { createdAt: 'asc' } // FIFO assignment
  });
  
  if (!availableKey) {
    throw new Error("No available license keys for this product");
  }
  
  // Assign the key to the order
  const assignedKey = await prisma.licenseKey.update({
    where: { id: availableKey.id },
    data: {
      status: "ASSIGNED",
      assignedToOrderId: orderId,
      assignedToUserId: userId,
      assignedAt: new Date()
    },
    include: {
      product: {
        select: { name: true }
      }
    }
  });
  
  // Return the decrypted key for immediate use
  return {
    ...assignedKey,
    decryptedKey: decryptLicenseKey(assignedKey.encryptedKey)
  };
}

export async function getLicenseKeysForOrder(orderId: string) {
  const keys = await prisma.licenseKey.findMany({
    where: { assignedToOrderId: orderId },
    include: {
      product: {
        select: { name: true, sku: true }
      }
    }
  });
  
  // Decrypt keys for display
  return keys.map(key => ({
    ...key,
    decryptedKey: decryptLicenseKey(key.encryptedKey)
  }));
}

export async function getLicenseKeysForUser(userId: string) {
  const keys = await prisma.licenseKey.findMany({
    where: { assignedToUserId: userId },
    include: {
      product: {
        select: { name: true, sku: true }
      },
      assignedToOrder: {
        select: { orderNumber: true, createdAt: true }
      }
    },
    orderBy: { assignedAt: 'desc' }
  });
  
  // Decrypt keys for display
  return keys.map(key => ({
    ...key,
    decryptedKey: decryptLicenseKey(key.encryptedKey)
  }));
}

export async function revokeLicenseKey(keyId: string, reason?: string) {
  return await prisma.licenseKey.update({
    where: { id: keyId },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
      revokedReason: reason
    }
  });
}

export async function returnLicenseKeyToStock(keyId: string) {
  return await prisma.licenseKey.update({
    where: { id: keyId },
    data: {
      status: "AVAILABLE",
      assignedToOrderId: null,
      assignedToUserId: null,
      assignedAt: null,
      usedAt: null
    }
  });
}

export async function deleteLicenseKey(keyId: string) {
  return await prisma.licenseKey.delete({
    where: { id: keyId }
  });
}

export async function updateLicenseKey(keyId: string, updates: {
  keyValue?: string;
  notes?: string;
}) {
  const data: any = {
    ...updates,
    updatedAt: new Date()
  };
  
  // If updating the key value, re-encrypt it
  if (updates.keyValue) {
    if (!validateLicenseKeyFormat(updates.keyValue)) {
      throw new Error("Invalid license key format");
    }
    data.encryptedKey = encryptLicenseKey(updates.keyValue);
  }
  
  return await prisma.licenseKey.update({
    where: { id: keyId },
    data
  });
}

// CSV parsing helper
export function parseLicenseKeysFromCSV(csvContent: string): string[] {
  const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line);
  const keys: string[] = [];
  
  for (const line of lines) {
    // Handle CSV with commas or just one key per line
    if (line.includes(',')) {
      // CSV format - assume first column is the license key
      const columns = line.split(',').map(col => col.trim().replace(/^["']|["']$/g, ''));
      if (columns[0]) {
        keys.push(columns[0]);
      }
    } else {
      // Simple text format - one key per line
      keys.push(line);
    }
  }
  
  return keys.filter(key => validateLicenseKeyFormat(key));
}
