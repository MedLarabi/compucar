import { S3Client } from "@aws-sdk/client-s3";
import { CloudFrontClient } from "@aws-sdk/client-cloudfront";

// AWS Configuration
export const AWS_CONFIG = {
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
};

// S3 Configuration
export const S3_CONFIG = {
  bucket: process.env.AWS_S3_BUCKET || 'compucar-courses',
  region: AWS_CONFIG.region,
};

// CloudFront Configuration
export const CLOUDFRONT_CONFIG = {
  distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID!,
  domain: process.env.CLOUDFRONT_DOMAIN!,
  keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID!,
  privateKey: process.env.CLOUDFRONT_PRIVATE_KEY!,
  signedUrlExpiration: parseInt(process.env.CLOUDFRONT_SIGNED_URL_EXPIRATION || '14400'), // 4 hours in seconds
};

// Initialize AWS clients
export const s3Client = new S3Client({
  region: AWS_CONFIG.region,
  credentials: {
    accessKeyId: AWS_CONFIG.accessKeyId,
    secretAccessKey: AWS_CONFIG.secretAccessKey,
  },
});

export const cloudFrontClient = new CloudFrontClient({
  region: AWS_CONFIG.region,
  credentials: {
    accessKeyId: AWS_CONFIG.accessKeyId,
    secretAccessKey: AWS_CONFIG.secretAccessKey,
  },
});

// Validate required environment variables
export function validateAWSConfig() {
  const requiredVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET',
    'CLOUDFRONT_DISTRIBUTION_ID',
    'CLOUDFRONT_DOMAIN',
    'CLOUDFRONT_KEY_PAIR_ID',
    'CLOUDFRONT_PRIVATE_KEY',
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required AWS environment variables: ${missing.join(', ')}`);
  }
}
