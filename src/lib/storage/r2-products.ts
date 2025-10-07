import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
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

export interface ProductImageUploadConfig {
  file: File;
  type: 'image' | 'video';
  userId: string;
}

export interface ProductImageMetadata {
  name: string;
  size: number;
  type: string;
  url: string;
  r2Key: string;
}

/**
 * Generate a unique R2 key for product images/videos
 */
export function generateProductMediaR2Key(type: 'image' | 'video', originalFilename: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const extension = originalFilename.split('.').pop() || '';
  const filename = `${type}_${timestamp}_${randomString}.${extension}`;
  
  return `products/${filename}`;
}

/**
 * Upload product image/video directly to R2
 */
export async function uploadProductMediaToR2(config: ProductImageUploadConfig): Promise<ProductImageMetadata> {
  try {
    // Generate unique R2 key
    const r2Key = generateProductMediaR2Key(config.type, config.file.name);
    
    // Convert file to buffer
    const bytes = await config.file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2Key,
      Body: buffer,
      ContentType: config.file.type,
      ContentLength: config.file.size,
      Metadata: {
        originalName: config.file.name,
        uploadedBy: config.userId,
        uploadDate: new Date().toISOString(),
      },
    });

    await r2Client.send(command);

    // Generate public URL
    const publicUrl = R2_PUBLIC_URL 
      ? `${R2_PUBLIC_URL}/${r2Key}`
      : await generateProductMediaUrl(r2Key);

    return {
      name: config.file.name,
      size: config.file.size,
      type: config.file.type,
      url: publicUrl,
      r2Key,
    };
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw new Error('Failed to upload file to R2');
  }
}

/**
 * Delete product media from R2
 */
export async function deleteProductMediaFromR2(r2Key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2Key,
    });

    await r2Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting from R2:', error);
    return false;
  }
}

/**
 * Generate a download URL for product media from R2
 * Uses public URL if available, otherwise falls back to presigned URL
 */
export async function generateProductMediaUrl(r2Key: string): Promise<string> {
  try {
    // If public URL is available, use it directly (no expiration, faster)
    if (R2_PUBLIC_URL) {
      return `${R2_PUBLIC_URL}/${r2Key}`;
    }

    // Fallback to presigned URL
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2Key,
    });

    const signedUrl = await getSignedUrl(r2Client, command, { 
      expiresIn: PRESIGNED_URL_EXPIRES 
    });

    return signedUrl;
  } catch (error) {
    console.error('Error generating product media URL:', error);
    throw new Error('Failed to generate media URL');
  }
}
