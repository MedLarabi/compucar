import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get fresh user data from database
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        newsletter: true,
        role: true,
      },
    });

    return NextResponse.json({
      sessionUser: session.user,
      dbUser,
      comparison: {
        sessionHasNewsletter: 'newsletter' in session.user,
        sessionNewsletterValue: (session.user as any).newsletter,
        dbNewsletterValue: dbUser?.newsletter,
        match: (session.user as any).newsletter === dbUser?.newsletter,
      },
    });
  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

