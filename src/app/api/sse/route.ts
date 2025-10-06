import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';

// Store active connections
const connections = new Map<string, ReadableStreamDefaultController>();

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
        connections.set(userId, controller);
        
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
        connections.delete(userId);
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

// Function to send updates to specific user
export function sendUpdateToUser(userId: string, data: any) {
  const controller = connections.get(userId);
  if (controller) {
    try {
      const message = JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      });
      
      controller.enqueue(`data: ${message}\n\n`);
      console.log(`📡 Sent update to user ${userId}:`, data);
      return true;
    } catch (error) {
      console.error('Error sending SSE update:', error);
      // Remove broken connection
      connections.delete(userId);
      return false;
    }
  }
  return false;
}

// Function to send updates to all connected users
export function sendUpdateToAll(data: any) {
  let sentCount = 0;
  connections.forEach((controller, userId) => {
    if (sendUpdateToUser(userId, data)) {
      sentCount++;
    }
  });
  console.log(`📡 Sent update to ${sentCount} connected users`);
  return sentCount;
}
