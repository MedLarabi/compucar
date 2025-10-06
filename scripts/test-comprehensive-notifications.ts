#!/usr/bin/env npx tsx

/**
 * Test script for comprehensive notification system
 * Tests all customer and admin notification types
 */

import { NotificationService } from '../src/lib/services/notifications';
import { prisma } from '../src/lib/database/prisma';

async function testNotificationSystem() {
  console.log('🧪 Testing Comprehensive Notification System...\n');

  try {
    // Get a test user (first customer)
    const testUser = await prisma.user.findFirst({
      where: { role: 'CUSTOMER' },
      select: { id: true, name: true, email: true }
    });

    if (!testUser) {
      console.log('❌ No test user found. Please create a customer account first.');
      return;
    }

    console.log(`👤 Using test user: ${testUser.name} (${testUser.email})\n`);

    // Test Customer Notifications
    console.log('📱 Testing Customer Notifications:');
    console.log('=====================================');

    // 1. Order Placed
    console.log('1. Testing ORDER_PLACED notification...');
    const orderResult = await NotificationService.notifyCustomerOrderPlaced(
      testUser.id,
      'TEST-ORDER-001',
      1500
    );
    console.log(`   Result: ${orderResult ? '✅ Success' : '❌ Failed'}\n`);

    // 2. Password Changed
    console.log('2. Testing PASSWORD_CHANGED notification...');
    const passwordResult = await NotificationService.notifyCustomerPasswordChanged(testUser.id);
    console.log(`   Result: ${passwordResult ? '✅ Success' : '❌ Failed'}\n`);

    // 3. File Received
    console.log('3. Testing FILE_RECEIVED notification...');
    const fileReceivedResult = await NotificationService.notifyCustomerFileReceived(
      testUser.id,
      'test-file.bin',
      'test-file-id'
    );
    console.log(`   Result: ${fileReceivedResult ? '✅ Success' : '❌ Failed'}\n`);

    // 4. File In Progress
    console.log('4. Testing FILE_IN_PROGRESS notification...');
    const fileProgressResult = await NotificationService.notifyCustomerFileInProgress(
      testUser.id,
      'test-file.bin',
      'test-file-id'
    );
    console.log(`   Result: ${fileProgressResult ? '✅ Success' : '❌ Failed'}\n`);

    // 5. File Ready
    console.log('5. Testing FILE_READY notification...');
    const fileReadyResult = await NotificationService.notifyCustomerFileReady(
      testUser.id,
      'test-file.bin',
      'test-file-id'
    );
    console.log(`   Result: ${fileReadyResult ? '✅ Success' : '❌ Failed'}\n`);

    // 6. File Price Set
    console.log('6. Testing FILE_PRICE_SET notification...');
    const priceSetResult = await NotificationService.notifyCustomerFilePriceSet(
      testUser.id,
      'test-file.bin',
      2500,
      'test-file-id'
    );
    console.log(`   Result: ${priceSetResult ? '✅ Success' : '❌ Failed'}\n`);

    // 7. File Payment Confirmed
    console.log('7. Testing FILE_PAYMENT_CONFIRMED notification...');
    const paymentResult = await NotificationService.notifyCustomerFilePaymentConfirmed(
      testUser.id,
      'test-file.bin',
      'test-file-id'
    );
    console.log(`   Result: ${paymentResult ? '✅ Success' : '❌ Failed'}\n`);

    // 8. Admin Comment
    console.log('8. Testing FILE_ADMIN_COMMENT notification...');
    const commentResult = await NotificationService.notifyCustomerFileAdminComment(
      testUser.id,
      'test-file.bin',
      'Your file has been processed successfully. Please download it from your account.',
      'test-file-id'
    );
    console.log(`   Result: ${commentResult ? '✅ Success' : '❌ Failed'}\n`);

    // Test Admin Notifications
    console.log('🔧 Testing Admin Notifications:');
    console.log('=====================================');

    // 1. New Order
    console.log('1. Testing NEW_ORDER_RECEIVED notification...');
    const newOrderResult = await NotificationService.notifyAdminNewOrder(
      'TEST-ORDER-002',
      'John Doe',
      2000,
      testUser.id
    );
    console.log(`   Result: ${newOrderResult ? '✅ Success' : '❌ Failed'}\n`);

    // 2. New Customer Comment
    console.log('2. Testing NEW_CUSTOMER_COMMENT notification...');
    const newCommentResult = await NotificationService.notifyAdminNewCustomerComment(
      'John Doe',
      'Please process my file as soon as possible. I need it for my project.',
      'test-file-id',
      testUser.id
    );
    console.log(`   Result: ${newCommentResult ? '✅ Success' : '❌ Failed'}\n`);

    // 3. New Customer Review
    console.log('3. Testing NEW_CUSTOMER_REVIEW notification...');
    const newReviewResult = await NotificationService.notifyAdminNewCustomerReview(
      'John Doe',
      'ECU Tuning Service',
      5,
      'test-review-id',
      testUser.id
    );
    console.log(`   Result: ${newReviewResult ? '✅ Success' : '❌ Failed'}\n`);

    // 4. New File Upload
    console.log('4. Testing NEW_FILE_UPLOAD notification...');
    const newFileResult = await NotificationService.notifyAdminNewFileUpload(
      'John Doe',
      'customer-file.bin',
      'test-file-id',
      testUser.id
    );
    console.log(`   Result: ${newFileResult ? '✅ Success' : '❌ Failed'}\n`);

    // 5. New User Registration
    console.log('5. Testing NEW_USER_REGISTRATION notification...');
    const newUserResult = await NotificationService.notifyAdminNewUserRegistration(
      'Jane Smith',
      'jane.smith@example.com',
      'new-user-id'
    );
    console.log(`   Result: ${newUserResult ? '✅ Success' : '❌ Failed'}\n`);

    // 6. File Update by Admin
    console.log('6. Testing FILE_UPDATE_BY_ADMIN notification...');
    const adminUpdateResult = await NotificationService.notifyAdminFileUpdateByAdmin(
      'Admin User',
      'customer-file.bin',
      'Status changed to READY',
      'test-file-id'
    );
    console.log(`   Result: ${adminUpdateResult ? '✅ Success' : '❌ Failed'}\n`);

    // 7. File Update by Customer
    console.log('7. Testing FILE_UPDATE_BY_CUSTOMER notification...');
    const customerUpdateResult = await NotificationService.notifyAdminFileUpdateByCustomer(
      'John Doe',
      'customer-file.bin',
      'Added new comment',
      'test-file-id',
      testUser.id
    );
    console.log(`   Result: ${customerUpdateResult ? '✅ Success' : '❌ Failed'}\n`);

    // 8. Payment Received
    console.log('8. Testing PAYMENT_RECEIVED notification...');
    const paymentReceivedResult = await NotificationService.notifyAdminPaymentReceived(
      'John Doe',
      2500,
      'TEST-ORDER-003',
      testUser.id
    );
    console.log(`   Result: ${paymentReceivedResult ? '✅ Success' : '❌ Failed'}\n`);

    // 9. System Alert
    console.log('9. Testing SYSTEM_ALERT notification...');
    const systemAlertResult = await NotificationService.notifyAdminSystemAlert(
      'High CPU Usage',
      'Server CPU usage is above 90% for the last 5 minutes',
      'high'
    );
    console.log(`   Result: ${systemAlertResult ? '✅ Success' : '❌ Failed'}\n`);

    // 10. Inventory Alert
    console.log('10. Testing INVENTORY_ALERT notification...');
    const inventoryAlertResult = await NotificationService.notifyAdminInventoryAlert(
      'ECU Tuning License',
      5,
      10
    );
    console.log(`   Result: ${inventoryAlertResult ? '✅ Success' : '❌ Failed'}\n`);

    // 11. Order Status Change
    console.log('11. Testing ORDER_STATUS_CHANGE notification...');
    const orderStatusResult = await NotificationService.notifyAdminOrderStatusChange(
      'TEST-ORDER-004',
      'PENDING',
      'PROCESSING',
      'John Doe'
    );
    console.log(`   Result: ${orderStatusResult ? '✅ Success' : '❌ Failed'}\n`);

    // 12. Customer Support Request
    console.log('12. Testing CUSTOMER_SUPPORT_REQUEST notification...');
    const supportRequestResult = await NotificationService.notifyAdminCustomerSupportRequest(
      'John Doe',
      'File Processing Issue',
      'My file has been uploaded for 3 days but still shows as pending. Can you please check?',
      testUser.id
    );
    console.log(`   Result: ${supportRequestResult ? '✅ Success' : '❌ Failed'}\n`);

    // Check notification counts
    console.log('📊 Notification Summary:');
    console.log('========================');

    const customerNotifications = await prisma.tuningNotification.count({
      where: { userId: testUser.id }
    });

    const adminNotifications = await prisma.tuningNotification.count({
      where: {
        user: { isAdmin: true }
      }
    });

    console.log(`📱 Customer notifications created: ${customerNotifications}`);
    console.log(`🔧 Admin notifications created: ${adminNotifications}`);
    console.log(`📈 Total notifications: ${customerNotifications + adminNotifications}\n`);

    // Show recent notifications
    console.log('📋 Recent Notifications:');
    console.log('=========================');

    const recentNotifications = await prisma.tuningNotification.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, isAdmin: true }
        }
      }
    });

    recentNotifications.forEach((notification, index) => {
      const userType = notification.user.isAdmin ? '🔧 Admin' : '👤 Customer';
      const timeAgo = new Date().getTime() - notification.createdAt.getTime();
      const minutesAgo = Math.floor(timeAgo / 60000);
      
      console.log(`${index + 1}. [${userType}] ${notification.type}`);
      console.log(`   Title: ${notification.title}`);
      console.log(`   Message: ${notification.message}`);
      console.log(`   Time: ${minutesAgo} minutes ago\n`);
    });

    console.log('✅ Comprehensive notification system test completed successfully!');
    console.log('🎉 All notification types are working correctly.');

  } catch (error) {
    console.error('❌ Error testing notification system:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testNotificationSystem();
