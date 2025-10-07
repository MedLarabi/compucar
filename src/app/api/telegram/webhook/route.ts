import { NextRequest, NextResponse } from 'next/server';
import { TelegramService } from '@/lib/services/telegram';
import { prisma } from '@/lib/database/prisma';
import { NotificationService } from '@/lib/services/notifications';
import { sendUpdateToUser } from '@/lib/sse-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle callback queries from inline keyboards
    if (body.callback_query) {
      const callbackQuery = body.callback_query;
      const callbackData = callbackQuery.data;
      const chatId = callbackQuery.message.chat.id.toString();
      const messageId = callbackQuery.message.message_id;
      const callbackQueryId = callbackQuery.id;

      console.log('📱 Received callback query:', callbackData);

      // Parse callback data
      const parts = callbackData.split('_');
      console.log('📋 Parsed parts:', parts);
      
      if (parts[0] === 'file' && parts[1] === 'status') {
        // Handle file status update: file_status_{fileId}_{status}
        const fileId = parts[2];
        const newStatus = parts[3];
        
        try {
          // Update file status in database
          await prisma.tuningFile.update({
            where: { id: fileId },
            data: { status: newStatus }
          });

          // Get file details for notification
          const file = await prisma.tuningFile.findUnique({
            where: { id: fileId },
            include: {
              user: {
                select: { firstName: true, lastName: true }
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

            // Send real-time update to customer
            sendUpdateToUser(file.userId, {
              type: 'file_status_update',
              fileId: fileId,
              fileName: file.originalFilename,
              oldStatus: file.status,
              newStatus: newStatus,
              message: `File status updated to ${newStatus}`
            });

            // Answer callback query
            await TelegramService.answerCallbackQuery(
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
                    text: newStatus === 'READY' ? '✅ READY' : '⏳ Set to READY',
                    callback_data: `file_status_${fileId}_READY`
                  }
                ],
                [
                  {
                    text: newStatus === 'PENDING' ? '⏳ PENDING' : '⏳ Set to PENDING',
                    callback_data: `file_status_${fileId}_PENDING`
                  }
                ],
                [
                  {
                    text: '⏰ Set Estimated Time',
                    callback_data: `file_estimated_time_${fileId}`
                  }
                ]
              ]
            };

            await TelegramService.editMessageText(chatId, messageId, updatedMessage, replyMarkup);
          }
        } catch (error) {
          console.error('Error updating file status:', error);
          await TelegramService.answerCallbackQuery(
            callbackQueryId,
            '❌ Error updating file status',
            true
          );
        }
      }
      else if (parts[0] === 'file' && parts[1] === 'estimated' && parts[2] === 'time') {
        // Handle estimated time request: file_estimated_time_{fileId}
        const fileId = parts[3];
        
        console.log('📅 Processing estimated time request for file:', fileId);
        
        try {
          // Get file details
          const file = await prisma.tuningFile.findUnique({
            where: { id: fileId },
            select: { originalFilename: true }
          });

          if (file) {
            console.log('📄 Found file:', file.originalFilename);
            
            // Answer callback query first
            const answerResult = await TelegramService.answerCallbackQuery(
              callbackQueryId,
              '⏰ Setting estimated time...',
              false
            );
            console.log('📱 Answer callback result:', answerResult);

            // Send estimated time selection message
            const timeRequestResult = await TelegramService.requestEstimatedTime(chatId, fileId, file.originalFilename);
            console.log('📱 Time request sent:', timeRequestResult);
            
            if (!timeRequestResult) {
              console.error('❌ Failed to send time request message');
              await TelegramService.answerCallbackQuery(
                callbackQueryId,
                '❌ Failed to show time options',
                true
              );
            }
          } else {
            console.log('❌ File not found with ID:', fileId);
            await TelegramService.answerCallbackQuery(
              callbackQueryId,
              '❌ File not found',
              true
            );
          }
        } catch (error) {
          console.error('❌ Error requesting estimated time:', error);
          console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
          console.error('❌ Error stack:', error instanceof Error ? error.stack : undefined);
          await TelegramService.answerCallbackQuery(
            callbackQueryId,
            '❌ Error setting estimated time',
            true
          );
        }
      }
      else if (parts[0] === 'time') {
        // Handle time selection: time_{fileId}_{minutes}
        const fileId = parts[1];
        const minutes = parts[2];
        
        console.log('⏰ Processing time selection:', { fileId, minutes });
        
        try {
          // Update estimated time in database
          console.log('📝 Updating database with estimated time...');
          const updateResult = await prisma.tuningFile.update({
            where: { id: fileId },
            data: { 
              estimatedProcessingTime: parseInt(minutes),
              estimatedProcessingTimeSetAt: new Date(),
              status: 'PENDING' // Automatically set to pending when time is set
            }
          });
          console.log('✅ Database updated successfully:', updateResult.id);

          // Get file details
          console.log('📄 Fetching file details...');
          const file = await prisma.tuningFile.findUnique({
            where: { id: fileId },
            include: {
              user: {
                select: { firstName: true, lastName: true }
              },
              fileModifications: {
                include: { modification: true }
              }
            }
          });

          if (file) {
            console.log('📄 File found:', file.originalFilename);
            
            // Notify customer about estimated time
            console.log('📱 Notifying customer about estimated time...');
            const notifyResult = await NotificationService.notifyCustomerEstimatedTime(
              file.userId,
              file.originalFilename,
              fileId,
              parseInt(minutes)
            );
            console.log('📱 Customer notification result:', notifyResult);

            // Send real-time update to customer
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
            console.log('📱 Answering callback query with time:', timeText);
            await TelegramService.answerCallbackQuery(
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
                    callback_data: `file_status_${fileId}_READY`
                  }
                ],
                [
                  {
                    text: '⏳ PENDING (Time Set)',
                    callback_data: `file_status_${fileId}_PENDING`
                  }
                ],
                [
                  {
                    text: '⏰ Change Time',
                    callback_data: `file_estimated_time_${fileId}`
                  }
                ]
              ]
            };

            await TelegramService.editMessageText(chatId, messageId, updatedMessage, replyMarkup);
          }
        } catch (error) {
          console.error('Error setting estimated time:', error);
          await TelegramService.answerCallbackQuery(
            callbackQueryId,
            '❌ Error setting estimated time',
            true
          );
        }
      }
      else if (parts[0] === 'cancel') {
        // Handle cancel action
        await TelegramService.answerCallbackQuery(
          callbackQueryId,
          '❌ Cancelled',
          false
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error processing Telegram webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
