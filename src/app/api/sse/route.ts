import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';
import { addConnection, removeConnection } from '@/lib/sse-utils';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        // Store connection for this user
        addConnection(userId, controller);
        
        // Send initial connection message
        const data = JSON.stringify({
          type: 'connection',
          message: 'Connected to real-time updates',
          timestamp: new Date().toISOString()
        });
        
        controller.enqueue(`data: ${data}\n\n`);
        
        console.log(`📡 SSE connection established for user: ${userId}`);
      },
      
      cancel() {
        // Clean up connection when client disconnects
        removeConnection(userId);
        console.log(`📡 SSE connection closed for user: ${userId}`);
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });

  } catch (error) {
    console.error('Error in SSE endpoint:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
