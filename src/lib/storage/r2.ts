import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 configuration
const r2Client = new S3Client({
  region: process.env.R2_REGION || "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: false, // R2 is S3-compatible
});

const BUCKET_NAME = process.env.R2_BUCKET!;
const PRESIGNED_URL_EXPIRES = Number(process.env.PRESIGNED_URL_EXPIRES || 900); // 15 minutes
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // Public R2 URL for direct access

export interface UploadUrlConfig {
  r2Key: string;
  contentType: string;
  contentLength?: number;
}

export interface DownloadUrlConfig {
  r2Key: string;
  filename?: string;
}

/**
 * Generate a presigned URL for uploading files to R2
 */
export async function generateUploadUrl(config: UploadUrlConfig): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: config.r2Key,
      ContentType: config.contentType,
      ...(config.contentLength && { ContentLength: config.contentLength }),
    });

    const signedUrl = await getSignedUrl(r2Client, command, { 
      expiresIn: PRESIGNED_URL_EXPIRES 
    });

    return signedUrl;
  } catch (error) {
    console.error('Error generating upload URL:', error);
    throw new Error('Failed to generate upload URL');
  }
}

/**
 * Generate a download URL for files from R2
 * Uses public URL if available, otherwise falls back to presigned URL
 */
export async function generateDownloadUrl(config: DownloadUrlConfig): Promise<string> {
  try {
    // If public URL is available, use it directly (no expiration, faster)
    if (R2_PUBLIC_URL) {
      const publicUrl = `${R2_PUBLIC_URL}/${config.r2Key}`;
      console.log(`Using public URL: ${publicUrl}`);
      return publicUrl;
    }

    // Fallback to presigned URL
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: config.r2Key,
      ...(config.filename && {
        ResponseContentDisposition: `attachment; filename="${config.filename}"`
      }),
    });

    const signedUrl = await getSignedUrl(r2Client, command, { 
      expiresIn: PRESIGNED_URL_EXPIRES 
    });

    return signedUrl;
  } catch (error) {
    console.error('Error generating download URL:', error);
    throw new Error('Failed to generate download URL');
  }
}

/**
 * Check if an object exists in R2
 */
export async function headObject(r2Key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2Key,
    });

    await r2Client.send(command);
    return true;
  } catch (error) {
    if ((error as any).name === 'NotFound' || (error as any).$metadata?.httpStatusCode === 404) {
      return false;
    }
    console.error('Error checking object existence:', error);
    throw new Error('Failed to check object existence');
  }
}

/**
 * Get object metadata from R2
 */
export async function getObjectMetadata(r2Key: string) {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2Key,
    });

    const response = await r2Client.send(command);
    return {
      contentLength: response.ContentLength,
      contentType: response.ContentType,
      lastModified: response.LastModified,
      etag: response.ETag,
    };
  } catch (error) {
    console.error('Error getting object metadata:', error);
    throw new Error('Failed to get object metadata');
  }
}

/**
 * Generate a unique R2 key for a file
 */
export function generateR2Key(userId: string, fileId: string, originalFilename: string, clientName?: string, uploadDate?: Date, modifications?: string[]): string {
  // Create folder structure: orders/{clientName-filename-modifications-date-time-uuid}/original/{filename}
  // Format: 'client name'-'file name'-'Selected Modifications'-'date'-'time'-'uuid'
  if (clientName && uploadDate) {
    const dateStr = uploadDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    const timeStr = uploadDate.toISOString().split('T')[1].split('.')[0].replace(/:/g, '-'); // HH-MM-SS format
    const uuid = crypto.randomUUID().substring(0, 8); // First 8 characters of UUID for guaranteed uniqueness
    
    const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
    
    // Create modifications string
    let modificationsStr = 'no-modifications';
    if (modifications && modifications.length > 0) {
      modificationsStr = modifications
        .map(mod => mod.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase())
        .join('-');
    }
    
    const folderName = `${sanitizedClientName}-${sanitizedFilename}-${modificationsStr}-${dateStr}-${timeStr}-${uuid}`;
    return `orders/${folderName}/original/${originalFilename}`;
  }
  
  // Fallback to old format with UUID for guaranteed uniqueness
  const uuid = crypto.randomUUID();
  return `orders/${fileId}-${uuid}/original/${originalFilename}`;
}

/**
 * Generate a unique R2 key for a modified file
 */
export function generateModifiedR2Key(userId: string, fileId: string, originalFilename: string, clientName?: string, uploadDate?: Date, modifications?: string[]): string {
  // Create folder structure: orders/{clientName-filename-modifications-date-time-uuid}/modified/{filename}
  // Format: 'client name'-'file name'-'Selected Modifications'-'date'-'time'-'uuid'
  if (clientName && uploadDate) {
    const dateStr = uploadDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    const timeStr = uploadDate.toISOString().split('T')[1].split('.')[0].replace(/:/g, '-'); // HH-MM-SS format
    const uuid = crypto.randomUUID().substring(0, 8); // First 8 characters of UUID for guaranteed uniqueness
    
    const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
    
    // Create modifications string
    let modificationsStr = 'no-modifications';
    if (modifications && modifications.length > 0) {
      modificationsStr = modifications
        .map(mod => mod.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase())
        .join('-');
    }
    
    const folderName = `${sanitizedClientName}-${sanitizedFilename}-${modificationsStr}-${dateStr}-${timeStr}-${uuid}`;
    return `orders/${folderName}/modified/${originalFilename}`;
  }
  
  // Fallback to old format with UUID for guaranteed uniqueness
  const uuid = crypto.randomUUID();
  return `orders/${fileId}-${uuid}/modified/${originalFilename}`;
}

/**
 * Validate file type against allowed types
 * Updated to allow all file types
 */
export function validateFileType(filename: string, mimeType: string): boolean {
  // Allow all file types - no restrictions
  return true;
}

/**
 * Validate file size against maximum allowed size
 */
export function validateFileSize(fileSize: number): boolean {
  const maxSizeMB = Number(process.env.MAX_UPLOAD_MB || 200);
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  return fileSize <= maxSizeBytes;
}

export { r2Client, BUCKET_NAME, PRESIGNED_URL_EXPIRES };
