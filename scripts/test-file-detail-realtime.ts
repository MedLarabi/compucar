import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env') });
config({ path: join(process.cwd(), '.env.local') });

async function testFileDetailRealTimeUpdates() {
  console.log('🧪 Testing Real-Time Updates for File Detail Page...\n');
  
  const fileId = '68bc11f0-302d-4eb3-b5b7-896bbd8f9542'; // From your URL
  
  // Import the SSE function
  const { sendUpdateToUser } = await import('../src/lib/sse-utils');
  
  console.log('📤 Sending file status update...');
  
  // Test 1: File status update
  sendUpdateToUser('user-id-placeholder', {
    type: 'file_status_update',
    fileId: fileId,
    fileName: 'test-file.bin',
    oldStatus: 'RECEIVED',
    newStatus: 'PENDING',
    message: 'File status updated to PENDING'
  });
  
  console.log('✅ File status update sent');
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('📤 Sending estimated time update...');
  
  // Test 2: Estimated time update
  sendUpdateToUser('user-id-placeholder', {
    type: 'estimated_time_update',
    fileId: fileId,
    fileName: 'test-file.bin',
    estimatedTime: 30,
    timeText: '30 minutes',
    status: 'PENDING',
    message: 'Estimated processing time set to 30 minutes'
  });
  
  console.log('✅ Estimated time update sent');
  
  console.log('\n📋 Instructions:');
  console.log('1. Open your file detail page: https://51adef9bdf0b.ngrok-free.app/files/68bc11f0-302d-4eb3-b5b7-896bbd8f9542');
  console.log('2. Open browser developer tools (F12) and check the Console tab');
  console.log('3. Look for SSE connection messages and update messages');
  console.log('4. The page should show real-time updates without refreshing');
  
  console.log('\n🔍 What to look for in browser console:');
  console.log('- "📡 Connecting to SSE..."');
  console.log('- "📡 SSE connected"');
  console.log('- "📡 Received SSE message: {...}"');
  console.log('- "📡 File status update: {...}"');
  console.log('- "📡 Estimated time update: {...}"');
}

async function main() {
  console.log('🔧 Testing File Detail Page Real-Time Updates...\n');
  
  await testFileDetailRealTimeUpdates();
  
  console.log('\n💡 Troubleshooting Tips:');
  console.log('1. Make sure you are logged in on the website');
  console.log('2. Check if the WiFi/connection icon shows connected status');
  console.log('3. If no updates appear, try refreshing the page');
  console.log('4. Check browser console for any SSE connection errors');
  console.log('5. Make sure the file ID in the URL matches the test file ID');
}

main().catch(console.error);
