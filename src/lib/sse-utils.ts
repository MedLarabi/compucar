// Store active SSE connections
const connections = new Map<string, ReadableStreamDefaultController>();

// Function to add a connection
export function addConnection(userId: string, controller: ReadableStreamDefaultController) {
  connections.set(userId, controller);
}

// Function to remove a connection
export function removeConnection(userId: string) {
  connections.delete(userId);
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

// Function to get connection count
export function getConnectionCount(): number {
  return connections.size;
}

// Function to check if user is connected
export function isUserConnected(userId: string): boolean {
  return connections.has(userId);
}
