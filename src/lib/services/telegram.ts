import { NotificationType } from './notifications';

interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

interface TelegramMessage {
  text: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
  reply_markup?: {
    inline_keyboard: Array<Array<{
      text: string;
      callback_data: string;
    }>>;
  };
}

export class TelegramService {
  private static getConfig(): TelegramConfig {
    return {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      chatId: process.env.TELEGRAM_CHAT_ID || '',
      enabled: process.env.TELEGRAM_ENABLED === 'true'
    };
  }

  /**
   * Send a message to Telegram
   */
  static async sendMessage(message: string, options: Partial<TelegramMessage> = {}): Promise<boolean> {
    const config = this.getConfig();
    
    if (!config.enabled || !config.botToken || !config.chatId) {
      console.log('📱 Telegram notifications disabled or not configured');
      return false;
    }

    try {
      const payload: TelegramMessage = {
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...options
      };

      const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: config.chatId,
          ...payload
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('📱 Telegram API error:', errorData);
        return false;
      }

      console.log('📱 Telegram notification sent successfully');
      return true;
    } catch (error) {
      console.error('📱 Telegram notification failed:', error);
      return false;
    }
  }

  /**
   * Send admin notification for new order
   */
  static async notifyNewOrder(orderData: {
    orderId: string;
    customerName: string;
    totalAmount: number;
    itemsCount: number;
  }): Promise<boolean> {
    const message = `
🛒 <b>New Order Received!</b>

📋 <b>Order ID:</b> ${orderData.orderId}
👤 <b>Customer:</b> ${orderData.customerName}
💰 <b>Total:</b> $${orderData.totalAmount}
📦 <b>Items:</b> ${orderData.itemsCount}

🔗 <a href="${process.env.NEXTAUTH_URL}/admin/orders">View Order</a>
    `.trim();

    return this.sendMessage(message);
  }

  /**
   * Send admin notification for new file upload with inline buttons
   */
  static async notifyNewFileUpload(fileData: {
    fileId: string;
    filename: string;
    customerName: string;
    fileSize: number;
    modifications: string[];
  }): Promise<boolean> {
    const message = `
📁 <b>New File Upload!</b>

📄 <b>File:</b> ${fileData.filename}
👤 <b>Customer:</b> ${fileData.customerName}
📏 <b>Size:</b> ${this.formatFileSize(fileData.fileSize)}
🔧 <b>Modifications:</b> ${fileData.modifications.join(', ')}
📊 <b>Status:</b> RECEIVED

🔗 <a href="${process.env.NEXTAUTH_URL}/admin/files/${fileData.fileId}">View in Admin Panel</a>
    `.trim();

    // Create inline keyboard with action buttons
    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: '✅ Set to READY',
            callback_data: `file_status_${fileData.fileId}_READY`
          }
        ],
        [
          {
            text: '⏳ Set to PENDING',
            callback_data: `file_status_${fileData.fileId}_PENDING`
          }
        ],
        [
          {
            text: '⏰ Set Estimated Time',
            callback_data: `file_estimated_time_${fileData.fileId}`
          }
        ]
      ]
    };

    return this.sendMessage(message, {
      reply_markup: replyMarkup
    });
  }

  /**
   * Send admin notification for customer review
   */
  static async notifyCustomerReview(reviewData: {
    reviewId: string;
    customerName: string;
    rating: number;
    comment: string;
    productName: string;
  }): Promise<boolean> {
    const stars = '⭐'.repeat(reviewData.rating);
    const message = `
⭐ <b>New Customer Review!</b>

👤 <b>Customer:</b> ${reviewData.customerName}
🛍️ <b>Product:</b> ${reviewData.productName}
⭐ <b>Rating:</b> ${stars} (${reviewData.rating}/5)
💬 <b>Comment:</b> ${reviewData.comment.substring(0, 200)}${reviewData.comment.length > 200 ? '...' : ''}

🔗 <a href="${process.env.NEXTAUTH_URL}/admin/reviews">View Review</a>
    `.trim();

    return this.sendMessage(message);
  }

  /**
   * Send admin notification for new user registration
   */
  static async notifyNewUserRegistration(userData: {
    userId: string;
    userName: string;
    email: string;
    role: string;
  }): Promise<boolean> {
    const message = `
👤 <b>New User Registration!</b>

👤 <b>Name:</b> ${userData.userName}
📧 <b>Email:</b> ${userData.email}
🔑 <b>Role:</b> ${userData.role}

🔗 <a href="${process.env.NEXTAUTH_URL}/admin/users">View User</a>
    `.trim();

    return this.sendMessage(message);
  }

  /**
   * Send admin notification for payment received
   */
  static async notifyPaymentReceived(paymentData: {
    orderId: string;
    customerName: string;
    amount: number;
    paymentMethod: string;
  }): Promise<boolean> {
    const message = `
💳 <b>Payment Received!</b>

📋 <b>Order ID:</b> ${paymentData.orderId}
👤 <b>Customer:</b> ${paymentData.customerName}
💰 <b>Amount:</b> $${paymentData.amount}
💳 <b>Method:</b> ${paymentData.paymentMethod}

🔗 <a href="${process.env.NEXTAUTH_URL}/admin/orders">View Order</a>
    `.trim();

    return this.sendMessage(message);
  }

  /**
   * Send admin notification for file status update
   */
  static async notifyFileStatusUpdate(fileData: {
    fileId: string;
    filename: string;
    customerName: string;
    oldStatus: string;
    newStatus: string;
    estimatedTime?: number;
  }): Promise<boolean> {
    const statusEmoji = this.getStatusEmoji(fileData.newStatus);
    const timeInfo = fileData.estimatedTime ? `\n⏱️ <b>Estimated Time:</b> ${fileData.estimatedTime} minutes` : '';
    
    const message = `
${statusEmoji} <b>File Status Updated!</b>

📄 <b>File:</b> ${fileData.filename}
👤 <b>Customer:</b> ${fileData.customerName}
📊 <b>Status:</b> ${fileData.oldStatus} → ${fileData.newStatus}${timeInfo}

🔗 <a href="${process.env.NEXTAUTH_URL}/admin/files/${fileData.fileId}">View File</a>
    `.trim();

    return this.sendMessage(message);
  }

  /**
   * Send system alert
   */
  static async notifySystemAlert(alertData: {
    type: 'error' | 'warning' | 'info';
    title: string;
    message: string;
    details?: string;
  }): Promise<boolean> {
    const emoji = alertData.type === 'error' ? '🚨' : alertData.type === 'warning' ? '⚠️' : 'ℹ️';
    
    const message = `
${emoji} <b>System Alert: ${alertData.title}</b>

📝 <b>Message:</b> ${alertData.message}
${alertData.details ? `\n🔍 <b>Details:</b> ${alertData.details}` : ''}

🕐 <b>Time:</b> ${new Date().toLocaleString()}
    `.trim();

    return this.sendMessage(message);
  }

  /**
   * Send urgent file upload notification with call priority
   */
  static async notifyUrgentFileUpload(fileData: {
    fileId: string;
    filename: string;
    customerName: string;
    fileSize: number;
    modifications: string[];
  }): Promise<boolean> {
    const message = `
🚨🚨🚨 <b>URGENT FILE UPLOAD - IMMEDIATE ATTENTION REQUIRED!</b> 🚨🚨🚨

📄 <b>File:</b> ${fileData.filename}
👤 <b>Customer:</b> ${fileData.customerName}
📏 <b>Size:</b> ${this.formatFileSize(fileData.fileSize)}
🔧 <b>Modifications:</b> ${fileData.modifications.join(', ')}

🔗 <a href="${process.env.NEXTAUTH_URL}/admin/files/${fileData.fileId}">PROCESS FILE NOW</a>

📞 <b>URGENT: New tuning file uploaded and needs immediate processing!</b>
⏰ <b>Time:</b> ${new Date().toLocaleString()}
    `.trim();

    // Send multiple urgent messages with different approaches to maximize notification
    const results = await Promise.all([
      // Message 1: Full urgent notification
      this.sendMessage(message, {
        disable_notification: false,
        disable_web_page_preview: false
      }),
      
      // Message 2: Simple urgent alert
      this.sendMessage(`🚨 URGENT: New file "${fileData.filename}" uploaded by ${fileData.customerName} - Process immediately!`, {
        disable_notification: false
      }),
      
      // Message 3: Call-style notification with ping
      this.sendMessage(`📞 CALL ALERT: New tuning file ready for processing!\n\nCustomer: ${fileData.customerName}\nFile: ${fileData.filename}\n\nAction required NOW!`, {
        disable_notification: false
      }),
      
      // Message 4: Maximum urgency with multiple alerts
      this.sendMessage(`🚨🚨🚨 ALERT! ALERT! ALERT! 🚨🚨🚨\n\nNEW FILE UPLOADED!\n${fileData.customerName} - ${fileData.filename}\n\nPROCESS IMMEDIATELY!`, {
        disable_notification: false
      })
    ]);

    return results.some(result => result);
  }

  /**
   * Send urgent file upload notification with "ringing" effect (multiple rapid messages)
   */
  static async notifyUrgentFileUploadWithRinging(fileData: {
    fileId: string;
    filename: string;
    customerName: string;
    fileSize: number;
    modifications: string[];
  }): Promise<boolean> {
    const config = this.getConfig();
    
    if (!config.enabled || !config.botToken || !config.chatId) {
      console.log('📱 Telegram notifications disabled or not configured');
      return false;
    }

    try {
      // Send initial urgent message
      const mainMessage = `
🚨🚨🚨 <b>URGENT FILE UPLOAD - IMMEDIATE ATTENTION REQUIRED!</b> 🚨🚨🚨

📄 <b>File:</b> ${fileData.filename}
👤 <b>Customer:</b> ${fileData.customerName}
📏 <b>Size:</b> ${this.formatFileSize(fileData.fileSize)}
🔧 <b>Modifications:</b> ${fileData.modifications.join(', ')}

🔗 <a href="${process.env.NEXTAUTH_URL}/admin/files/${fileData.fileId}">PROCESS FILE NOW</a>

📞 <b>URGENT: New tuning file uploaded and needs immediate processing!</b>
⏰ <b>Time:</b> ${new Date().toLocaleString()}
      `.trim();

      // Send main message
      await this.sendMessage(mainMessage, {
        disable_notification: false,
        disable_web_page_preview: false
      });

      // Send rapid follow-up messages to create "ringing" effect
      const ringingMessages = [
        `📞 CALL ALERT: New tuning file ready!`,
        `🚨 URGENT: Process ${fileData.filename} NOW!`,
        `📱 Action required: ${fileData.customerName} uploaded file`,
        `🔔 New file uploaded - Check immediately!`,
        `⚡ URGENT: Tuning file needs processing!`
      ];

      // Send ringing messages with small delays
      for (let i = 0; i < ringingMessages.length; i++) {
        setTimeout(async () => {
          try {
            await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: config.chatId,
                text: ringingMessages[i],
                disable_notification: false,
                parse_mode: 'HTML'
              })
            });
          } catch (error) {
            console.error('Error sending ringing message:', error);
          }
        }, i * 2000); // Send every 2 seconds
      }

      console.log('📱 Telegram urgent notification with ringing effect sent successfully');
      return true;
    } catch (error) {
      console.error('📱 Telegram urgent notification with ringing failed:', error);
      return false;
    }
  }

  /**
   * Answer callback query from inline keyboard
   */
  static async answerCallbackQuery(callbackQueryId: string, text: string, showAlert: boolean = false): Promise<boolean> {
    const config = this.getConfig();
    
    if (!config.enabled || !config.botToken) {
      return false;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${config.botToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: text,
          show_alert: showAlert
        })
      });

      return response.ok;
    } catch (error) {
      console.error('📱 Error answering callback query:', error);
      return false;
    }
  }

  /**
   * Edit message with new inline keyboard
   */
  static async editMessageText(chatId: string, messageId: number, text: string, replyMarkup?: any): Promise<boolean> {
    const config = this.getConfig();
    
    if (!config.enabled || !config.botToken) {
      return false;
    }

    try {
      const payload: any = {
        chat_id: chatId,
        message_id: messageId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      };

      if (replyMarkup) {
        payload.reply_markup = replyMarkup;
      }

      const response = await fetch(`https://api.telegram.org/bot${config.botToken}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (error) {
      console.error('📱 Error editing message:', error);
      return false;
    }
  }

  /**
   * Send estimated time input request
   */
  static async requestEstimatedTime(chatId: string, fileId: string, filename: string): Promise<boolean> {
    const message = `
⏰ <b>Set Estimated Time</b>

📄 <b>File:</b> ${filename}

Please select the estimated processing time:
    `.trim();

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: '5 minutes', callback_data: `time_${fileId}_5` },
          { text: '10 minutes', callback_data: `time_${fileId}_10` },
          { text: '15 minutes', callback_data: `time_${fileId}_15` }
        ],
        [
          { text: '20 minutes', callback_data: `time_${fileId}_20` },
          { text: '30 minutes', callback_data: `time_${fileId}_30` },
          { text: '45 minutes', callback_data: `time_${fileId}_45` }
        ],
        [
          { text: '1 hour', callback_data: `time_${fileId}_60` },
          { text: '2 hours', callback_data: `time_${fileId}_120` },
          { text: '4 hours', callback_data: `time_${fileId}_240` }
        ],
        [
          { text: '1 day', callback_data: `time_${fileId}_1440` },
          { text: 'Custom time', callback_data: `time_${fileId}_custom` }
        ],
        [
          { text: '❌ Cancel', callback_data: `cancel_${fileId}` }
        ]
      ]
    };

    return this.sendMessage(message, { reply_markup: replyMarkup });
  }

  /**
   * Test Telegram connection
   */
  static async testConnection(): Promise<boolean> {
    const message = `
🤖 <b>Telegram Bot Test</b>

✅ Connection successful!
🕐 <b>Time:</b> ${new Date().toLocaleString()}
🌐 <b>Environment:</b> ${process.env.NODE_ENV}

Your CompuCar admin notifications are now active! 🚀
    `.trim();

    return this.sendMessage(message);
  }

  /**
   * Get status emoji
   */
  private static getStatusEmoji(status: string): string {
    switch (status.toUpperCase()) {
      case 'RECEIVED': return '📥';
      case 'PENDING': return '⏳';
      case 'READY': return '✅';
      case 'CANCELLED': return '❌';
      default: return '📄';
    }
  }

  /**
   * Format file size
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
