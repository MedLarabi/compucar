import { yalidineStatusChecker } from '@/lib/services/yalidine-status-checker';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testYalidineStatusChecker() {
  console.log('🧪 Testing Yalidine Status Checker...\n');

  try {
    // Test 1: Get current statistics
    console.log('📊 Getting current statistics...');
    const stats = await yalidineStatusChecker.getStatusCheckStats();
    console.log('Stats:', {
      totalTracked: stats.totalTracked,
      pendingOrders: stats.pendingOrders,
      deliveredToday: stats.deliveredToday,
      lastCheckTime: stats.lastCheckTime?.toISOString() || 'Never'
    });
    console.log('');

    // Test 2: Check all pending orders
    console.log('🔍 Checking all pending orders...');
    const results = await yalidineStatusChecker.checkAllPendingOrders();
    console.log('Results:', {
      checked: results.checked,
      updated: results.updated,
      delivered: results.delivered,
      errorCount: results.errors.length
    });

    if (results.errors.length > 0) {
      console.log('Errors:');
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testYalidineStatusChecker();
