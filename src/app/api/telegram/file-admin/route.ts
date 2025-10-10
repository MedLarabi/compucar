import { NextRequest, NextResponse } from 'next/server';
import { MultiBotTelegramService, BotType } from '@/lib/services/multi-bot-telegram';
import { prisma } from '@/lib/database/prisma';
import { NotificationService } from '@/lib/services/notifications';
import { sendUpdateToUser } from '@/lib/sse-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📁 File Admin Bot webhook received:', JSON.stringify(body, null, 2));
    
    // Handle callback queries from File Admin bot
    if (body.callback_query) {
      const callbackQuery = body.callback_query;
      const callbackData = callbackQuery.data;
      const chatId = callbackQuery.message.chat.id.toString();
      const messageId = callbackQuery.message.message_id;
      const callbackQueryId = callbackQuery.id;

      console.log('📱 File Admin bot callback query:', callbackData);
      console.log('📱 Chat ID:', chatId);
      console.log('📱 Message ID:', messageId);

      // Parse callback data - File Admin bot uses prefixed callback data
      const parts = callbackData.split('_');
      
      if (parts[0] === 'file' && parts[1] === 'admin' && parts[2] === 'status') {
        // Handle file status update: file_admin_status_{fileId}_{status}
        const fileId = parts[3];
        const newStatus = parts[4];
        
        console.log('📁 File Admin processing status update:', { fileId, newStatus });
        
        try {
          // Validate status
          const validStatuses = ['RECEIVED', 'PENDING', 'READY'];
          if (!validStatuses.includes(newStatus)) {
            console.error('❌ Invalid status:', newStatus);
            await MultiBotTelegramService.answerCallbackQuery(
              BotType.FILE_ADMIN,
              callbackQueryId,
              `❌ Invalid status: ${newStatus}`,
              true
            );
            return NextResponse.json({ success: false, error: 'Invalid status' });
          }
          
          // Get file details first to store old status
          const file = await prisma.tuningFile.findUnique({
            where: { id: fileId },
            include: {
              user: {
                select: { 
                  id: true, 
                  firstName: true, 
                  lastName: true,
                  // Add customer's Telegram chat ID if they have one
                  // This would need to be added to the User model
                }
              },
              fileModifications: {
                include: { modification: true }
              }
            }
          });

          if (!file) {
            console.error('❌ File not found:', fileId);
            await MultiBotTelegramService.answerCallbackQuery(
              BotType.FILE_ADMIN,
              callbackQueryId,
              '❌ File not found',
              true
            );
            return NextResponse.json({ success: false, error: 'File not found' });
          }

          console.log('📁 Found file:', {
            id: file.id,
            filename: file.originalFilename,
            currentStatus: file.status,
            newStatus: newStatus
          });

          const oldStatus = file.status; // Store old status before update

          // Update file status in database
          console.log('💾 Updating file status in database...');
          const updatedFile = await prisma.tuningFile.update({
            where: { id: fileId },
            data: { 
              status: newStatus,
              updatedDate: new Date()
            }
          });
          console.log('✅ File status updated successfully:', updatedFile.status);

          // Create audit log
          try {
            await prisma.auditLog.create({
              data: {
                fileId,
                actorId: 'file-admin-bot', // Since we don't have user session in webhook
                action: 'STATUS_CHANGE',
                oldValue: oldStatus,
                newValue: newStatus
              }
            });
            console.log('📝 Audit log created');
          } catch (auditError) {
            console.error('⚠️ Failed to create audit log:', auditError);
            // Continue execution even if audit log fails
          }

          // Notify customer about status change
          try {
            console.log('📢 Sending customer notification...');
            await NotificationService.notifyCustomerFileStatusUpdate(
              file.userId,
              file.originalFilename,
              fileId,
              newStatus
            );
            console.log('✅ Customer notification sent');
          } catch (notificationError) {
            console.error('⚠️ Failed to send customer notification:', notificationError);
            // Continue execution even if notification fails
          }

          // Send real-time update to customer's browser
          try {
            console.log('⚡ Sending real-time update...');
            sendUpdateToUser(file.userId, {
              type: 'file_status_update',
              fileId: fileId,
              fileName: file.originalFilename,
              oldStatus: oldStatus, // Use stored old status
              newStatus: newStatus,
              message: `File status updated to ${newStatus}`
            });
            console.log('✅ Real-time update sent');
          } catch (realtimeError) {
            console.error('⚠️ Failed to send real-time update:', realtimeError);
            // Continue execution even if real-time update fails
          }

            // TODO: Send notification to customer's Telegram bot
            // This would require storing customer's Telegram chat ID
            // await MultiBotTelegramService.notifyCustomerFileStatus(
            //   customerChatId,
            //   {
            //     filename: file.originalFilename,
            //     oldStatus: file.status,
            //     newStatus: newStatus
            //   }
            // );

            // Answer callback query
            await MultiBotTelegramService.answerCallbackQuery(
              BotType.FILE_ADMIN,
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
            `.trim();

            // Update buttons based on new status
            const replyMarkup = {
              inline_keyboard: [
                [
                  {
                    text: newStatus === 'READY' ? '✅ READY' : '✅ Set to READY',
                    callback_data: `file_admin_status_${fileId}_READY`
                  }
                ],
                [
                  {
                    text: newStatus === 'PENDING' ? '⏳ PENDING' : '⏳ Set to PENDING',
                    callback_data: `file_admin_status_${fileId}_PENDING`
                  }
                ],
                [
                  {
                    text: '⏰ Set Estimated Time',
                    callback_data: `file_admin_estimated_time_${fileId}`
                  }
                ]
              ]
            };

            await MultiBotTelegramService.editMessageText(
              BotType.FILE_ADMIN,
              chatId, 
              messageId, 
              updatedMessage, 
              replyMarkup
            );
        } catch (error) {
          console.error('Error updating file status:', error);
          await MultiBotTelegramService.answerCallbackQuery(
            BotType.FILE_ADMIN,
            callbackQueryId,
            '❌ Error updating file status',
            true
          );
        }
      }
      else if (parts[0] === 'file' && parts[1] === 'admin' && parts[2] === 'estimated' && parts[3] === 'time') {
        // Handle estimated time request: file_admin_estimated_time_{fileId}
        const fileId = parts[4];
        
        console.log('📅 File Admin processing estimated time request for file:', fileId);
        
        try {
          // Get file details
          const file = await prisma.tuningFile.findUnique({
            where: { id: fileId },
            select: { originalFilename: true }
          });

          if (file) {
            // Answer callback query
            await MultiBotTelegramService.answerCallbackQuery(
              BotType.FILE_ADMIN,
              callbackQueryId,
              '⏰ Setting estimated time...',
              false
            );

            // Send estimated time selection message
            await MultiBotTelegramService.requestFileAdminEstimatedTime(
              chatId, 
              fileId, 
              file.originalFilename
            );
          }
        } catch (error) {
          console.error('Error requesting estimated time:', error);
          await MultiBotTelegramService.answerCallbackQuery(
            BotType.FILE_ADMIN,
            callbackQueryId,
            '❌ Error setting estimated time',
            true
          );
        }
      }
      else if (parts[0] === 'file' && parts[1] === 'admin' && parts[2] === 'time') {
        // Handle time selection: file_admin_time_{fileId}_{minutes}
        const fileId = parts[3];
        const minutes = parts[4];
        
        console.log('⏰ File Admin processing time selection:', { fileId, minutes });
        
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
              BotType.FILE_ADMIN,
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
            `.trim();

            const replyMarkup = {
              inline_keyboard: [
                [
                  {
                    text: '✅ Set to READY',
                    callback_data: `file_admin_status_${fileId}_READY`
                  }
                ],
                [
                  {
                    text: '⏳ PENDING (Time Set)',
                    callback_data: `file_admin_status_${fileId}_PENDING`
                  }
                ],
                [
                  {
                    text: '⏰ Change Time',
                    callback_data: `file_admin_estimated_time_${fileId}`
                  }
                ]
              ]
            };

            await MultiBotTelegramService.editMessageText(
              BotType.FILE_ADMIN,
              chatId, 
              messageId, 
              updatedMessage, 
              replyMarkup
            );
          }
        } catch (error) {
          console.error('Error setting estimated time:', error);
          await MultiBotTelegramService.answerCallbackQuery(
            BotType.FILE_ADMIN,
            callbackQueryId,
            '❌ Error setting estimated time',
            true
          );
        }
      }
      else if (parts[0] === 'file' && parts[1] === 'admin' && parts[2] === 'cancel') {
        // Handle cancel action
        await MultiBotTelegramService.answerCallbackQuery(
          BotType.FILE_ADMIN,
          callbackQueryId,
          '❌ Cancelled',
          false
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error processing File Admin bot webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
