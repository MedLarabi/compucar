import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/database/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { newsletter } = await request.json();
    
    // Update user's newsletter subscription
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { newsletter: newsletter === true },
      select: {
        id: true,
        email: true,
        newsletter: true,
      },
    });

    return NextResponse.json({
      message: 'Newsletter subscription updated',
      user: updatedUser,
      status: newsletter ? 'Subscribed' : 'Unsubscribed',
    });
  } catch (error) {
    console.error('Update newsletter error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

