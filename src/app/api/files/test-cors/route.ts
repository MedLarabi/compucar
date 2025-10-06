import { NextRequest, NextResponse } from 'next/server';
import { generateUploadUrl, generateR2Key } from '@/lib/storage/r2';

/**
 * Test CORS configuration with R2
 * GET /api/files/test-cors
 */
export async function GET(request: NextRequest) {
  try {
    // Generate a test presigned URL
    const testR2Key = generateR2Key('test-user', 'test-file-id', 'test-file.bin', 'test-client', new Date(), ['test-modification-1', 'test-modification-2']);
    
    const testUploadUrl = await generateUploadUrl({
      r2Key: testR2Key,
      contentType: 'application/octet-stream',
      contentLength: 1024
    });

    return NextResponse.json({
      success: true,
      message: 'R2 connection successful',
      testUploadUrl,
      corsInstructions: {
        step1: 'Go to Cloudflare R2 Dashboard',
        step2: 'Select your compucar-tuning-files bucket',
        step3: 'Go to Settings tab',
        step4: 'Add CORS policy with localhost:3003 origin',
        step5: 'Save and wait 1-2 minutes for propagation'
      },
      currentOrigin: request.headers.get('origin') || 'localhost:3003',
      requiredCorsPolicy: {
        AllowedOrigins: [
          'http://localhost:3000',
          'http://localhost:3003'
        ],
        AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        AllowedHeaders: ['*'],
        ExposeHeaders: ['ETag', 'Content-Length'],
        MaxAgeSeconds: 3600
      }
    });

  } catch (error) {
    console.error('CORS test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate test URL',
      details: error instanceof Error ? error.message : 'Unknown error',
      possibleCauses: [
        'R2 environment variables not configured',
        'R2 credentials invalid',
        'R2 bucket does not exist'
      ]
    }, { status: 500 });
  }
}
