import { NextRequest, NextResponse } from 'next/server';

/**
 * Diagnostic endpoint to check R2 configuration
 * GET /api/files/diagnose
 */
export async function GET(request: NextRequest) {
  try {
    // Check if all required environment variables are present
    const requiredEnvVars = [
      'R2_ACCOUNT_ID',
      'R2_BUCKET',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
      'R2_ENDPOINT'
    ];

    const missingVars: string[] = [];
    const presentVars: string[] = [];

    requiredEnvVars.forEach(varName => {
      if (process.env[varName]) {
        presentVars.push(varName);
      } else {
        missingVars.push(varName);
      }
    });

    // Optional environment variables (ALLOWED_FILE_TYPES is deprecated - all types allowed)
    const optionalVars = [
      'R2_REGION',
      'PRESIGNED_URL_EXPIRES',
      'MAX_UPLOAD_MB',
      'ALLOWED_FILE_TYPES'
    ];

    const optionalStatus = optionalVars.map(varName => ({
      name: varName,
      present: !!process.env[varName],
      value: process.env[varName] ? 'Set' : 'Using default'
    }));

    const isConfigured = missingVars.length === 0;

    return NextResponse.json({
      success: true,
      r2Configured: isConfigured,
      status: isConfigured ? 'R2 is properly configured' : 'R2 configuration incomplete',
      requiredVariables: {
        present: presentVars,
        missing: missingVars
      },
      optionalVariables: optionalStatus,
      recommendations: missingVars.length > 0 ? [
        'Create a .env.local file in your project root',
        'Add the missing R2 environment variables',
        'Restart your development server after adding variables',
        'Check the R2_SETUP_GUIDE.md file for detailed instructions'
      ] : [
        'R2 configuration looks good!',
        'You can now test file uploads at /files/upload'
      ]
    });

  } catch (error) {
    console.error('R2 diagnostic error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to diagnose R2 configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
