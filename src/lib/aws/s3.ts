import { 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, S3_CONFIG } from "./config";

export interface UploadVideoParams {
  key: string;
  file: Buffer | Uint8Array | string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface VideoMetadata {
  key: string;
  size: number;
  lastModified: Date;
  contentType: string;
  metadata?: Record<string, string>;
}

/**
 * Upload a video file to S3
 */
export async function uploadVideo({
  key,
  file,
  contentType = 'video/mp4',
  metadata = {}
}: UploadVideoParams): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: {
        ...metadata,
        uploadedAt: new Date().toISOString(),
      },
      // Set appropriate cache control for videos
      CacheControl: 'max-age=31536000', // 1 year
      // Ensure videos are not publicly accessible
      ACL: 'private',
    });

    await s3Client.send(command);
    return key;
  } catch (error) {
    console.error('Error uploading video to S3:', error);
    throw new Error(`Failed to upload video: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get video metadata from S3
 */
export async function getVideoMetadata(key: string): Promise<VideoMetadata | null> {
  try {
    const command = new HeadObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    return {
      key,
      size: response.ContentLength || 0,
      lastModified: response.LastModified || new Date(),
      contentType: response.ContentType || 'video/mp4',
      metadata: response.Metadata,
    };
  } catch (error) {
    console.error('Error getting video metadata from S3:', error);
    return null;
  }
}

/**
 * Delete a video from S3
 */
export async function deleteVideo(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting video from S3:', error);
    return false;
  }
}

/**
 * Generate a presigned URL for video upload (for direct browser uploads)
 */
export async function generateUploadPresignedUrl(
  key: string,
  contentType: string = 'video/mp4',
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: key,
      ContentType: contentType,
      ACL: 'private',
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error('Error generating upload presigned URL:', error);
    throw new Error(`Failed to generate upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * List videos in a specific "folder" (prefix)
 */
export async function listVideos(prefix: string = ''): Promise<string[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: S3_CONFIG.bucket,
      Prefix: prefix,
      MaxKeys: 1000,
    });

    const response = await s3Client.send(command);
    return response.Contents?.map(obj => obj.Key || '') || [];
  } catch (error) {
    console.error('Error listing videos from S3:', error);
    return [];
  }
}

/**
 * Generate S3 key for a video based on course and module structure
 */
export function generateVideoKey(courseId: string, moduleId: string, videoId: string, filename: string): string {
  // Remove file extension and add timestamp to avoid conflicts
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  const timestamp = Date.now();
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_');
  
  return `courses/${courseId}/modules/${moduleId}/videos/${videoId}_${timestamp}_${sanitizedName}.mp4`;
}

/**
 * Generate S3 key for a video thumbnail
 */
export function generateThumbnailKey(courseId: string, moduleId: string, videoId: string): string {
  return `courses/${courseId}/modules/${moduleId}/thumbnails/${videoId}_thumbnail.jpg`;
}

/**
 * Check if a video exists in S3
 */
export async function videoExists(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}
