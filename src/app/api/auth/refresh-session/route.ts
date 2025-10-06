import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/database/prisma';

/**
 * Force refresh user session data
 * GET /api/auth/refresh-session
 */
export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'No active session found',
        action: 'Please log in first'
      }, { status: 401 });
    }

    // Get fresh user data from database
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
        error: 'User not found in database'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Session data refreshed',
      sessionData: {
        userId: session.user.id,
        email: session.user.email,
        sessionIsAdmin: session.user.isAdmin || false
      },
      databaseData: {
        userId: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        role: user.role
      },
      sessionMatch: session.user.isAdmin === user.isAdmin,
      recommendations: session.user.isAdmin !== user.isAdmin ? [
        'Session data is outdated',
        'Log out and log back in to refresh session',
        'Or clear browser cookies and login again'
      ] : [
        'Session data is up to date',
        'If still having issues, try clearing browser cache'
      ]
    });

  } catch (error) {
    console.error('Session refresh error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to refresh session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}









