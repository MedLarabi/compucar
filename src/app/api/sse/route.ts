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
    
    // Detect Firefox from User-Agent
    const userAgent = request.headers.get('user-agent') || '';
    const isFirefox = userAgent.toLowerCase().includes('firefox');
    
    console.log(`📡 SSE connection request from ${isFirefox ? 'Firefox' : 'Other'} for user: ${userId}`);

    // Create SSE stream with Firefox-specific handling
    const stream = new ReadableStream({
      start(controller) {
        // Store connection for this user with browser info
        addConnection(userId, controller, isFirefox ? 'firefox' : 'other');
        
        // Send initial connection message
        const data = JSON.stringify({
          type: 'connection',
          message: 'Connected to real-time updates',
          timestamp: new Date().toISOString(),
          browser: isFirefox ? 'firefox' : 'other'
        });
        
        controller.enqueue(`data: ${data}\n\n`);
        
        // Firefox-specific: Send periodic heartbeat to keep connection alive
        if (isFirefox) {
          const heartbeatInterval = setInterval(() => {
            try {
              const heartbeat = JSON.stringify({
                type: 'heartbeat',
                timestamp: new Date().toISOString()
              });
              controller.enqueue(`data: ${heartbeat}\n\n`);
            } catch (error) {
              console.log(`📡 Heartbeat failed for user ${userId}, clearing interval`);
              clearInterval(heartbeatInterval);
            }
          }, 30000); // Every 30 seconds
          
          // Store interval for cleanup
          (controller as any)._heartbeatInterval = heartbeatInterval;
        }
        
        console.log(`📡 SSE connection established for user: ${userId}`);
      },
      
      cancel() {
        // Clean up Firefox heartbeat interval
        if ((this as any)._heartbeatInterval) {
          clearInterval((this as any)._heartbeatInterval);
        }
        
        // Clean up connection when client disconnects
        removeConnection(userId);
        console.log(`📡 SSE connection closed for user: ${userId}`);
      }
    });

    // Firefox-specific headers
    const headers: Record<string, string> = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    };
    
    if (isFirefox) {
      // Firefox-specific headers to prevent connection pooling issues
      headers['X-Accel-Buffering'] = 'no';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    }

    return new Response(stream, { headers });

  } catch (error) {
    console.error('Error in SSE endpoint:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
