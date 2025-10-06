import { getSignedUrl } from "@aws-sdk/cloudfront-signer";
import { CLOUDFRONT_CONFIG } from "./config";

export interface SignedUrlOptions {
  key: string;
  expiresIn?: number; // seconds from now
  ipAddress?: string; // Optional IP restriction
  userAgent?: string; // Optional user agent restriction
}

/**
 * Generate a signed CloudFront URL for secure video access
 */
export function generateSignedVideoUrl({
  key,
  expiresIn = CLOUDFRONT_CONFIG.signedUrlExpiration,
  ipAddress,
  userAgent
}: SignedUrlOptions): string {
  try {
    // Construct the CloudFront URL
    const url = `https://${CLOUDFRONT_CONFIG.domain}/${key}`;
    
    // Calculate expiration time
    const expirationTime = new Date(Date.now() + expiresIn * 1000);
    
    // Prepare policy conditions
    const policy: any = {
      Statement: [
        {
          Resource: url,
          Condition: {
            DateLessThan: {
              "AWS:EpochTime": Math.floor(expirationTime.getTime() / 1000)
            }
          }
        }
      ]
    };

    // Add IP restriction if provided
    if (ipAddress) {
      policy.Statement[0].Condition.IpAddress = {
        "AWS:SourceIp": ipAddress
      };
    }

    // Add user agent restriction if provided
    if (userAgent) {
      policy.Statement[0].Condition.StringEquals = {
        "AWS:UserAgent": userAgent
      };
    }

    // Generate signed URL
    const signedUrl = getSignedUrl({
      url,
      keyPairId: CLOUDFRONT_CONFIG.keyPairId,
      privateKey: CLOUDFRONT_CONFIG.privateKey,
      policy: JSON.stringify(policy),
    });

    return signedUrl;
  } catch (error) {
    console.error('Error generating signed CloudFront URL:', error);
    throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a signed URL with simple expiration (no custom policy)
 */
export function generateSimpleSignedUrl(key: string, expiresIn?: number): string {
  try {
    const url = `https://${CLOUDFRONT_CONFIG.domain}/${key}`;
    const expirationTime = new Date(Date.now() + (expiresIn || CLOUDFRONT_CONFIG.signedUrlExpiration) * 1000);

    return getSignedUrl({
      url,
      keyPairId: CLOUDFRONT_CONFIG.keyPairId,
      privateKey: CLOUDFRONT_CONFIG.privateKey,
      dateLessThan: expirationTime.toISOString(),
    });
  } catch (error) {
    console.error('Error generating simple signed CloudFront URL:', error);
    throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate multiple signed URLs for a batch of video keys
 */
export function generateBatchSignedUrls(
  keys: string[], 
  expiresIn?: number
): Record<string, string> {
  const signedUrls: Record<string, string> = {};
  
  for (const key of keys) {
    try {
      signedUrls[key] = generateSimpleSignedUrl(key, expiresIn);
    } catch (error) {
      console.error(`Error generating signed URL for key ${key}:`, error);
      // Continue with other keys even if one fails
    }
  }
  
  return signedUrls;
}

/**
 * Validate CloudFront configuration
 */
export function validateCloudFrontConfig(): boolean {
  try {
    const required = [
      CLOUDFRONT_CONFIG.distributionId,
      CLOUDFRONT_CONFIG.domain,
      CLOUDFRONT_CONFIG.keyPairId,
      CLOUDFRONT_CONFIG.privateKey,
    ];

    return required.every(config => config && config.length > 0);
  } catch (error) {
    return false;
  }
}

/**
 * Get CloudFront URL for a video key (without signing)
 */
export function getCloudFrontUrl(key: string): string {
  return `https://${CLOUDFRONT_CONFIG.domain}/${key}`;
}

/**
 * Extract video key from CloudFront URL
 */
export function extractKeyFromUrl(url: string): string | null {
  try {
    const cloudFrontDomain = CLOUDFRONT_CONFIG.domain;
    const urlObj = new URL(url);
    
    if (urlObj.hostname === cloudFrontDomain) {
      // Remove leading slash
      return urlObj.pathname.substring(1);
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if a URL is a valid CloudFront URL for our distribution
 */
export function isValidCloudFrontUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === CLOUDFRONT_CONFIG.domain;
  } catch (error) {
    return false;
  }
}
