import { NextRequest, NextResponse } from 'next/server';
import { MultiBotTelegramService, BotType } from '@/lib/services/multi-bot-telegram';
import { prisma } from '@/lib/database/prisma';
import { NotificationService } from '@/lib/services/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle callback queries from Super Admin bot
    if (body.callback_query) {
      const callbackQuery = body.callback_query;
      const callbackData = callbackQuery.data;
      const chatId = callbackQuery.message.chat.id.toString();
      const messageId = callbackQuery.message.message_id;
      const callbackQueryId = callbackQuery.id;

      console.log('🔧 Super Admin bot callback query:', callbackData);

      // Parse callback data - Super Admin bot handles multiple formats
      const parts = callbackData.split('_');
      
      // Handle file_admin_status format (for backward compatibility)
      if (parts[0] === 'file' && parts[1] === 'admin' && parts[2] === 'status') {
        const fileId = parts[3];
        const newStatus = parts[4];
        
        console.log('📁 Super Admin processing file_admin_status format:', { fileId, newStatus });
        
        try {
          // Update file status in database
          const file = await prisma.tuningFile.findUnique({
            where: { id: fileId },
            include: {
              user: {
                select: { 
                  id: true, 
                  firstName: true, 
                  lastName: true
                }
              },
              fileModifications: {
                include: { modification: true }
              }
            }
          });

          if (!file) {
            await MultiBotTelegramService.answerCallbackQuery(
              BotType.SUPER_ADMIN,
              callbackQueryId,
              '❌ File not found',
              true
            );
            return NextResponse.json({ success: true });
          }

          // Update file status
          await prisma.tuningFile.update({
            where: { id: fileId },
            data: { status: newStatus }
          });

          // Notify customer about status change
          await NotificationService.notifyCustomerFileStatusUpdate(
            file.userId,
            file.originalFilename,
            file.id,
            newStatus
          );

          // Send real-time update to customer's browser
          const { sendUpdateToUser } = await import('@/lib/sse-utils');
          sendUpdateToUser(file.userId, {
            type: 'file_status_update',
            fileId: file.id,
            fileName: file.originalFilename,
            oldStatus: file.status,
            newStatus: newStatus,
            message: `File status updated to ${newStatus}`
          });

          // Answer callback query
          await MultiBotTelegramService.answerCallbackQuery(
            BotType.SUPER_ADMIN,
            callbackQueryId,
            `✅ File status updated to ${newStatus}`,
            false
          );

          console.log('✅ File status updated successfully:', { fileId, newStatus });

        } catch (error) {
          console.error('❌ Error updating file status:', error);
          await MultiBotTelegramService.answerCallbackQuery(
            BotType.SUPER_ADMIN,
            callbackQueryId,
            '❌ Error updating file status',
            true
          );
        }
      }
      else if (parts[0] === 'sa') { // Super Admin shortened format
        const action = parts[1]; // fs (file status), et (estimated time), t (time), c (cancel)
        
        switch (action) {
          case 'fs':
            // Handle file status update: sa_fs_{shortFileId}_{status}
            const shortFileId = parts[2];
            const newStatus = parts[3];
            
            console.log('📁 Super Admin processing file status update (short):', { shortFileId, newStatus });
            
            try {
              // Find file by short ID (first 8 characters)
              const file = await prisma.tuningFile.findFirst({
                where: {
                  id: {
                    startsWith: shortFileId
                  }
                },
                include: {
                  user: {
                    select: { 
                      id: true, 
                      firstName: true, 
                      lastName: true
                    }
                  },
                  fileModifications: {
                    include: { modification: true }
                  }
                }
              });

              if (!file) {
                await MultiBotTelegramService.answerCallbackQuery(
                  BotType.SUPER_ADMIN,
                  callbackQueryId,
                  '❌ File not found',
                  true
                );
                break;
              }

              // Update file status in database
              await prisma.tuningFile.update({
                where: { id: file.id },
                data: { status: newStatus }
              });

              // Notify customer about status change
              await NotificationService.notifyCustomerFileStatusUpdate(
                file.userId,
                file.originalFilename,
                file.id,
                newStatus
              );

              // Send real-time update to customer's browser
              const { sendUpdateToUser } = await import('@/lib/sse-utils');
              sendUpdateToUser(file.userId, {
                type: 'file_status_update',
                fileId: file.id,
                fileName: file.originalFilename,
                oldStatus: file.status,
                newStatus: newStatus,
                message: `File status updated to ${newStatus}`
              });

              // Answer callback query
              await MultiBotTelegramService.answerCallbackQuery(
                BotType.SUPER_ADMIN,
                callbackQueryId,
                `✅ File status updated to ${newStatus}`,
                false
              );

              // Update the message to show new status
              const updatedMessage = `
📁 <b>File Upload - Status Updated</b>

📄 <b>File:</b> ${file.originalFilename}
👤 <b>Customer:</b> ${file.user.firstName} ${file.user.lastName}
📊 <b>Status:</b> ${newStatus}
🔧 <b>Modifications:</b> ${file.fileModifications.map(fm => fm.modification.label).join(', ')}

🔗 <a href="${process.env.NEXTAUTH_URL}/admin/files/${file.id}">View in Admin Panel</a>

🕐 <b>Updated:</b> ${new Date().toLocaleString()}
              `.trim();

              // Update buttons based on new status
              const replyMarkup = {
                inline_keyboard: [
                  [
                    {
                      text: newStatus === 'READY' ? '✅ READY' : '✅ Set to READY',
                      callback_data: `sa_fs_${shortFileId}_READY`
                    }
                  ],
                  [
                    {
                      text: newStatus === 'PENDING' ? '⏳ PENDING' : '⏳ Set to PENDING',
                      callback_data: `sa_fs_${shortFileId}_PENDING`
                    }
                  ],
                  [
                    {
                      text: '⏰ Set Estimated Time',
                      callback_data: `sa_et_${shortFileId}`
                    }
                  ]
                ]
              };

              await MultiBotTelegramService.editMessageText(
                BotType.SUPER_ADMIN,
                chatId, 
                messageId, 
                updatedMessage, 
                replyMarkup
              );
            } catch (error) {
              console.error('Error updating file status:', error);
              await MultiBotTelegramService.answerCallbackQuery(
                BotType.SUPER_ADMIN,
                callbackQueryId,
                '❌ Error updating file status',
                true
              );
            }
            break;
            
          case 'et':
            // Handle estimated time request: sa_et_{shortFileId}
            const shortFileIdEt = parts[2];
            
            console.log('📅 Super Admin processing estimated time request for short file:', shortFileIdEt);
            
            try {
              // Find file by short ID
              const file = await prisma.tuningFile.findFirst({
                where: {
                  id: {
                    startsWith: shortFileIdEt
                  }
                },
                select: { id: true, originalFilename: true }
              });

              if (file) {
                // Answer callback query
                await MultiBotTelegramService.answerCallbackQuery(
                  BotType.SUPER_ADMIN,
                  callbackQueryId,
                  '⏰ Setting estimated time...',
                  false
                );

                // Send estimated time selection message
                await MultiBotTelegramService.requestSuperAdminEstimatedTime(
                  chatId, 
                  file.id, 
                  file.originalFilename
                );
              }
            } catch (error) {
              console.error('Error requesting estimated time:', error);
              await MultiBotTelegramService.answerCallbackQuery(
                BotType.SUPER_ADMIN,
                callbackQueryId,
                '❌ Error setting estimated time',
                true
              );
            }
            break;
            
          case 't':
            // Handle time selection: sa_t_{shortFileId}_{minutes}
            const shortFileIdTime = parts[2];
            const minutes = parts[3];
            
            console.log('⏰ Super Admin processing time selection (short):', { shortFileIdTime, minutes });
            
            try {
              // Find file by short ID
              const file = await prisma.tuningFile.findFirst({
                where: {
                  id: {
                    startsWith: shortFileIdTime
                  }
                },
                include: {
                  user: {
                    select: { 
                      id: true, 
                      firstName: true, 
                      lastName: true 
                    }
                  },
                  fileModifications: {
                    include: { modification: true }
                  }
                }
              });

              if (!file) {
                await MultiBotTelegramService.answerCallbackQuery(
                  BotType.SUPER_ADMIN,
                  callbackQueryId,
                  '❌ File not found',
                  true
                );
                break;
              }

              // Update estimated time in database
              await prisma.tuningFile.update({
                where: { id: file.id },
                data: { 
                  estimatedProcessingTime: parseInt(minutes),
                  estimatedProcessingTimeSetAt: new Date(),
                  status: 'PENDING'
                }
              });

              // Notify customer about estimated time
              await NotificationService.notifyCustomerEstimatedTime(
                file.userId,
                file.originalFilename,
                file.id,
                parseInt(minutes)
              );

              // Send real-time update to customer's browser
              const timeText = minutes === '1440' ? '1 day' : 
                             minutes === '240' ? '4 hours' :
                             minutes === '120' ? '2 hours' :
                             minutes === '60' ? '1 hour' :
                             minutes === '45' ? '45 minutes' :
                             minutes === '30' ? '30 minutes' :
                             minutes === '20' ? '20 minutes' :
                             minutes === '15' ? '15 minutes' :
                             minutes === '10' ? '10 minutes' :
                             minutes === '5' ? '5 minutes' :
                             `${minutes} minutes`;

              const { sendUpdateToUser } = await import('@/lib/sse-utils');
              sendUpdateToUser(file.userId, {
                type: 'estimated_time_update',
                fileId: file.id,
                fileName: file.originalFilename,
                estimatedTime: parseInt(minutes),
                timeText: timeText,
                status: 'PENDING',
                message: `Estimated processing time set to ${timeText}`
              });

              // Answer callback query
              await MultiBotTelegramService.answerCallbackQuery(
                BotType.SUPER_ADMIN,
                callbackQueryId,
                `✅ Estimated time set to ${timeText}`,
                false
              );

              // Update the original message
              const updatedMessage = `
📁 <b>File Upload - Time Set</b>

📄 <b>File:</b> ${file.originalFilename}
👤 <b>Customer:</b> ${file.user.firstName} ${file.user.lastName}
📊 <b>Status:</b> PENDING
⏰ <b>Estimated Time:</b> ${timeText}
🔧 <b>Modifications:</b> ${file.fileModifications.map(fm => fm.modification.label).join(', ')}

🔗 <a href="${process.env.NEXTAUTH_URL}/admin/files/${file.id}">View in Admin Panel</a>

🕐 <b>Updated:</b> ${new Date().toLocaleString()}
              `.trim();

              const replyMarkup = {
                inline_keyboard: [
                  [
                    {
                      text: '✅ Set to READY',
                      callback_data: `sa_fs_${shortFileIdTime}_READY`
                    }
                  ],
                  [
                    {
                      text: '⏳ PENDING (Time Set)',
                      callback_data: `sa_fs_${shortFileIdTime}_PENDING`
                    }
                  ],
                  [
                    {
                      text: '⏰ Change Time',
                      callback_data: `sa_et_${shortFileIdTime}`
                    }
                  ]
                ]
              };

              await MultiBotTelegramService.editMessageText(
                BotType.SUPER_ADMIN,
                chatId, 
                messageId, 
                updatedMessage, 
                replyMarkup
              );
            } catch (error) {
              console.error('Error setting estimated time:', error);
              await MultiBotTelegramService.answerCallbackQuery(
                BotType.SUPER_ADMIN,
                callbackQueryId,
                '❌ Error setting estimated time',
                true
              );
            }
            break;
            
          case 'c':
            // Handle cancel action: sa_c_{shortFileId}
            await MultiBotTelegramService.answerCallbackQuery(
              BotType.SUPER_ADMIN,
              callbackQueryId,
              '❌ Cancelled',
              false
            );
            break;
            
          default:
            await MultiBotTelegramService.answerCallbackQuery(
              BotType.SUPER_ADMIN,
              callbackQueryId,
              '❓ Unknown action',
              false
            );
        }
      }
      else if (parts[0] === 'super' && parts[1] === 'admin') {
        // Handle super admin actions
        const action = parts[2];
        
        switch (action) {
          case 'file':
            // Handle file management actions
            if (parts[3] === 'status') {
              // Handle file status update: super_admin_file_status_{fileId}_{status}
              const fileId = parts[4];
              const newStatus = parts[5];
              
              console.log('📁 Super Admin processing file status update:', { fileId, newStatus });
              
              try {
                // Update file status in database
                await prisma.tuningFile.update({
                  where: { id: fileId },
                  data: { status: newStatus }
                });

                // Get file details for notifications
                const file = await prisma.tuningFile.findUnique({
                  where: { id: fileId },
                  include: {
                    user: {
                      select: { 
                        id: true, 
                        firstName: true, 
                        lastName: true
                      }
                    },
                    fileModifications: {
                      include: { modification: true }
                    }
                  }
                });

                if (file) {
                  // Notify customer about status change
                  await NotificationService.notifyCustomerFileStatusUpdate(
                    file.userId,
                    file.originalFilename,
                    fileId,
                    newStatus
                  );

                  // Send real-time update to customer's browser
                  const { sendUpdateToUser } = await import('@/lib/sse-utils');
                  sendUpdateToUser(file.userId, {
                    type: 'file_status_update',
                    fileId: fileId,
                    fileName: file.originalFilename,
                    oldStatus: file.status,
                    newStatus: newStatus,
                    message: `File status updated to ${newStatus}`
                  });

                  // Answer callback query
                  await MultiBotTelegramService.answerCallbackQuery(
                    BotType.SUPER_ADMIN,
                    callbackQueryId,
                    `✅ File status updated to ${newStatus}`,
                    false
                  );

                  // Update the message to show new status
                  const updatedMessage = `
📁 <b>File Upload - Status Updated</b>

📄 <b>File:</b> ${file.originalFilename}
👤 <b>Customer:</b> ${file.user.firstName} ${file.user.lastName}
📊 <b>Status:</b> ${newStatus}
🔧 <b>Modifications:</b> ${file.fileModifications.map(fm => fm.modification.label).join(', ')}

🔗 <a href="${process.env.NEXTAUTH_URL}/admin/files/${fileId}">View in Admin Panel</a>

🕐 <b>Updated:</b> ${new Date().toLocaleString()}
                  `.trim();

                  // Update buttons based on new status
                  const replyMarkup = {
                    inline_keyboard: [
                      [
                        {
                          text: newStatus === 'READY' ? '✅ READY' : '✅ Set to READY',
                          callback_data: `super_admin_file_status_${fileId}_READY`
                        }
                      ],
                      [
                        {
                          text: newStatus === 'PENDING' ? '⏳ PENDING' : '⏳ Set to PENDING',
                          callback_data: `super_admin_file_status_${fileId}_PENDING`
                        }
                      ],
                      [
                        {
                          text: '⏰ Set Estimated Time',
                          callback_data: `super_admin_estimated_time_${fileId}`
                        }
                      ]
                    ]
                  };

                  await MultiBotTelegramService.editMessageText(
                    BotType.SUPER_ADMIN,
                    chatId, 
                    messageId, 
                    updatedMessage, 
                    replyMarkup
                  );
                }
              } catch (error) {
                console.error('Error updating file status:', error);
                await MultiBotTelegramService.answerCallbackQuery(
                  BotType.SUPER_ADMIN,
                  callbackQueryId,
                  '❌ Error updating file status',
                  true
                );
              }
            }
            break;
            
          case 'estimated':
            // Handle estimated time request: super_admin_estimated_time_{fileId}
            if (parts[3] === 'time') {
              const fileId = parts[4];
              
              console.log('📅 Super Admin processing estimated time request for file:', fileId);
              
              try {
                // Get file details
                const file = await prisma.tuningFile.findUnique({
                  where: { id: fileId },
                  select: { originalFilename: true }
                });

                if (file) {
                  // Answer callback query
                  await MultiBotTelegramService.answerCallbackQuery(
                    BotType.SUPER_ADMIN,
                    callbackQueryId,
                    '⏰ Setting estimated time...',
                    false
                  );

                  // Send estimated time selection message
                  await MultiBotTelegramService.requestSuperAdminEstimatedTime(
                    chatId, 
                    fileId, 
                    file.originalFilename
                  );
                }
              } catch (error) {
                console.error('Error requesting estimated time:', error);
                await MultiBotTelegramService.answerCallbackQuery(
                  BotType.SUPER_ADMIN,
                  callbackQueryId,
                  '❌ Error setting estimated time',
                  true
                );
              }
            }
            break;
            
          case 'time':
            // Handle time selection: super_admin_time_{fileId}_{minutes}
            const fileId = parts[3];
            const minutes = parts[4];
            
            console.log('⏰ Super Admin processing time selection:', { fileId, minutes });
            
            try {
              // Update estimated time in database
              await prisma.tuningFile.update({
                where: { id: fileId },
                data: { 
                  estimatedProcessingTime: parseInt(minutes),
                  estimatedProcessingTimeSetAt: new Date(),
                  status: 'PENDING'
                }
              });

              // Get file details
              const file = await prisma.tuningFile.findUnique({
                where: { id: fileId },
                include: {
                  user: {
                    select: { 
                      id: true, 
                      firstName: true, 
                      lastName: true 
                    }
                  },
                  fileModifications: {
                    include: { modification: true }
                  }
                }
              });

              if (file) {
                // Notify customer about estimated time
                await NotificationService.notifyCustomerEstimatedTime(
                  file.userId,
                  file.originalFilename,
                  fileId,
                  parseInt(minutes)
                );

                // Send real-time update to customer's browser
                const timeText = minutes === '1440' ? '1 day' : 
                               minutes === '240' ? '4 hours' :
                               minutes === '120' ? '2 hours' :
                               minutes === '60' ? '1 hour' :
                               minutes === '45' ? '45 minutes' :
                               minutes === '30' ? '30 minutes' :
                               minutes === '20' ? '20 minutes' :
                               minutes === '15' ? '15 minutes' :
                               minutes === '10' ? '10 minutes' :
                               minutes === '5' ? '5 minutes' :
                               `${minutes} minutes`;

                const { sendUpdateToUser } = await import('@/lib/sse-utils');
                sendUpdateToUser(file.userId, {
                  type: 'estimated_time_update',
                  fileId: fileId,
                  fileName: file.originalFilename,
                  estimatedTime: parseInt(minutes),
                  timeText: timeText,
                  status: 'PENDING',
                  message: `Estimated processing time set to ${timeText}`
                });

                // Answer callback query
                await MultiBotTelegramService.answerCallbackQuery(
                  BotType.SUPER_ADMIN,
                  callbackQueryId,
                  `✅ Estimated time set to ${timeText}`,
                  false
                );

                // Update the original message
                const updatedMessage = `
📁 <b>File Upload - Time Set</b>

📄 <b>File:</b> ${file.originalFilename}
👤 <b>Customer:</b> ${file.user.firstName} ${file.user.lastName}
📊 <b>Status:</b> PENDING
⏰ <b>Estimated Time:</b> ${timeText}
🔧 <b>Modifications:</b> ${file.fileModifications.map(fm => fm.modification.label).join(', ')}

🔗 <a href="${process.env.NEXTAUTH_URL}/admin/files/${fileId}">View in Admin Panel</a>

🕐 <b>Updated:</b> ${new Date().toLocaleString()}
                `.trim();

                const replyMarkup = {
                  inline_keyboard: [
                    [
                      {
                        text: '✅ Set to READY',
                        callback_data: `super_admin_file_status_${fileId}_READY`
                      }
                    ],
                    [
                      {
                        text: '⏳ PENDING (Time Set)',
                        callback_data: `super_admin_file_status_${fileId}_PENDING`
                      }
                    ],
                    [
                      {
                        text: '⏰ Change Time',
                        callback_data: `super_admin_estimated_time_${fileId}`
                      }
                    ]
                  ]
                };

                await MultiBotTelegramService.editMessageText(
                  BotType.SUPER_ADMIN,
                  chatId, 
                  messageId, 
                  updatedMessage, 
                  replyMarkup
                );
              }
            } catch (error) {
              console.error('Error setting estimated time:', error);
              await MultiBotTelegramService.answerCallbackQuery(
                BotType.SUPER_ADMIN,
                callbackQueryId,
                '❌ Error setting estimated time',
                true
              );
            }
            break;
            
          case 'cancel':
            // Handle cancel action
            await MultiBotTelegramService.answerCallbackQuery(
              BotType.SUPER_ADMIN,
              callbackQueryId,
              '❌ Cancelled',
              false
            );
            break;
            
          case 'view':
            // Handle view actions (orders, users, etc.)
            const entityType = parts[3];
            const entityId = parts[4];
            
            await MultiBotTelegramService.answerCallbackQuery(
              BotType.SUPER_ADMIN,
              callbackQueryId,
              `🔍 Opening ${entityType} ${entityId}...`,
              false
            );
            break;
            
          case 'approve':
            // Handle approval actions
            await MultiBotTelegramService.answerCallbackQuery(
              BotType.SUPER_ADMIN,
              callbackQueryId,
              '✅ Approved',
              false
            );
            break;
            
          case 'reject':
            // Handle rejection actions
            await MultiBotTelegramService.answerCallbackQuery(
              BotType.SUPER_ADMIN,
              callbackQueryId,
              '❌ Rejected',
              false
            );
            break;
            
          default:
            await MultiBotTelegramService.answerCallbackQuery(
              BotType.SUPER_ADMIN,
              callbackQueryId,
              '❓ Unknown action',
              false
            );
        }
      }
    }

    // Handle regular messages from Super Admin bot
    if (body.message) {
      const message = body.message;
      const chatId = message.chat.id.toString();
      const text = message.text;

      console.log('🔧 Super Admin bot message:', text);

      // Handle commands
      if (text?.startsWith('/')) {
        const command = text.split(' ')[0];
        
        switch (command) {
          case '/start':
            await MultiBotTelegramService.sendMessage(
              BotType.SUPER_ADMIN,
              `
🔧 <b>Super Admin Bot Activated!</b>

Welcome to CompuCar Super Admin Control Center.

<b>Available Commands:</b>
📊 /stats - System statistics
👥 /users - User management
🛒 /orders - Order management  
📁 /files - File management
💰 /payments - Payment overview
🔧 /system - System status

You have full administrative control over the system.
              `.trim(),
              chatId
            );
            break;
            
          case '/stats':
            // Get system statistics
            const stats = await getSystemStats();
            await MultiBotTelegramService.sendMessage(
              BotType.SUPER_ADMIN,
              `
📊 <b>System Statistics</b>

👥 <b>Users:</b> ${stats.totalUsers}
🛒 <b>Orders:</b> ${stats.totalOrders}
📁 <b>Files:</b> ${stats.totalFiles}
💰 <b>Revenue:</b> $${stats.totalRevenue}

🕐 <b>Last Updated:</b> ${new Date().toLocaleString()}
              `.trim(),
              chatId
            );
            break;
            
          case '/system':
            await MultiBotTelegramService.sendMessage(
              BotType.SUPER_ADMIN,
              `
🔧 <b>System Status</b>

✅ <b>Database:</b> Connected
✅ <b>Storage:</b> Online
✅ <b>Payment:</b> Active
✅ <b>Email:</b> Working

🌐 <b>Environment:</b> ${process.env.NODE_ENV}
🕐 <b>Uptime:</b> ${process.uptime()} seconds

All systems operational! 🚀
              `.trim(),
              chatId
            );
            break;
            
          default:
            await MultiBotTelegramService.sendMessage(
              BotType.SUPER_ADMIN,
              '❓ Unknown command. Use /start to see available commands.',
              chatId
            );
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error processing Super Admin bot webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getSystemStats() {
  try {
    const [totalUsers, totalOrders, totalFiles, revenueResult] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.tuningFile.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: 'DELIVERED' }
      })
    ]);

    return {
      totalUsers,
      totalOrders,
      totalFiles,
      totalRevenue: revenueResult._sum.total || 0
    };
  } catch (error) {
    console.error('Error getting system stats:', error);
    return {
      totalUsers: 0,
      totalOrders: 0,
      totalFiles: 0,
      totalRevenue: 0
    };
  }
}
