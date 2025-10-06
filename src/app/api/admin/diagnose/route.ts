import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/database/prisma';

/**
 * Admin diagnostic endpoint to check permissions and access
 * GET /api/admin/diagnose
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
        details: 'No session found'
      }, { status: 401 });
    }

    // Get user details from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
        role: true
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found in database',
        sessionUserId: session.user.id
      }, { status: 404 });
    }

    // Check admin access
    const hasAdminAccess = user.isAdmin === true;

    // Get file count for admin
    let fileCount = 0;
    if (hasAdminAccess) {
      fileCount = await prisma.tuningFile.count();
    }

    return NextResponse.json({
      success: true,
      authentication: {
        sessionExists: !!session,
        userId: session.user.id,
        userEmail: session.user.email
      },
      userDatabase: {
        userExists: !!user,
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
        role: user.role
      },
      adminAccess: {
        hasAccess: hasAdminAccess,
        fileCount: hasAdminAccess ? fileCount : 'No access'
      },
      recommendations: !hasAdminAccess ? [
        'User is not marked as admin in database',
        'Check user.isAdmin field in database',
        'Admin access is required for file management'
      ] : [
        'Admin access confirmed',
        'All permissions look good'
      ]
    });

  } catch (error) {
    console.error('Admin diagnostic error:', error);
    return NextResponse.json({
      success: false,
      error: 'Diagnostic failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
