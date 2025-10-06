// AWS Services exports
export * from './config';
export * from './s3';
export * from './cloudfront';

// Re-export commonly used functions
export { 
  uploadVideo, 
  deleteVideo, 
  getVideoMetadata, 
  generateVideoKey, 
  generateThumbnailKey,
  videoExists 
} from './s3';

export { 
  generateSignedVideoUrl, 
  generateSimpleSignedUrl, 
  generateBatchSignedUrls,
  getCloudFrontUrl,
  validateCloudFrontConfig 
} from './cloudfront';

export { 
  validateAWSConfig,
  s3Client,
  cloudFrontClient 
} from './config';
