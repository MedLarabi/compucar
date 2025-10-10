// Store active SSE connections with metadata
interface ConnectionInfo {
  controller: ReadableStreamDefaultController;
  browser?: string;
  lastActivity: number;
}

const connections = new Map<string, ConnectionInfo>();

// Function to add a connection with deduplication
export function addConnection(userId: string, controller: ReadableStreamDefaultController, browser?: string) {
  // Check if user already has a connection
  const existingConnection = connections.get(userId);
  if (existingConnection) {
    console.log(`📡 User ${userId} already has a ${existingConnection.browser || 'unknown'} connection, replacing...`);
    
    // Try to close the existing connection gracefully
    try {
      existingConnection.controller.close();
    } catch (error) {
      console.log(`📡 Error closing existing connection for user ${userId}:`, error);
    }
  }
  
  connections.set(userId, {
    controller,
    browser,
    lastActivity: Date.now()
  });
  
  console.log(`📡 Added ${browser || 'unknown'} connection for user ${userId}. Total connections: ${connections.size}`);
}

// Function to remove a connection
export function removeConnection(userId: string) {
  const connection = connections.get(userId);
  if (connection) {
    console.log(`📡 Removing ${connection.browser || 'unknown'} connection for user ${userId}`);
  }
  connections.delete(userId);
}

// Function to send updates to specific user with Firefox-specific handling
export function sendUpdateToUser(userId: string, data: any) {
  const connectionInfo = connections.get(userId);
  if (connectionInfo) {
    try {
      const message = JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      });
      
      connectionInfo.controller.enqueue(`data: ${message}\n\n`);
      connectionInfo.lastActivity = Date.now();
      
      console.log(`📡 Sent update to user ${userId} (${connectionInfo.browser || 'unknown'}):`, data);
      return true;
    } catch (error) {
      console.error(`Error sending SSE update to user ${userId}:`, error);
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
  connections.forEach((connectionInfo, userId) => {
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

// Function to cleanup stale connections (for Firefox specifically)
export function cleanupStaleConnections(maxAgeMs: number = 300000) { // 5 minutes default
  const now = Date.now();
  const staleConnections: string[] = [];
  
  connections.forEach((connectionInfo, userId) => {
    if (now - connectionInfo.lastActivity > maxAgeMs) {
      staleConnections.push(userId);
    }
  });
  
  staleConnections.forEach(userId => {
    console.log(`📡 Cleaning up stale connection for user ${userId}`);
    removeConnection(userId);
  });
  
  return staleConnections.length;
}

// Function to get connection info for debugging
export function getConnectionInfo(): Array<{userId: string, browser?: string, lastActivity: number}> {
  const info: Array<{userId: string, browser?: string, lastActivity: number}> = [];
  connections.forEach((connectionInfo, userId) => {
    info.push({
      userId,
      browser: connectionInfo.browser,
      lastActivity: connectionInfo.lastActivity
    });
  });
  return info;
}
