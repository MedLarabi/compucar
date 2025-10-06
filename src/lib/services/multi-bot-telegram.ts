export enum BotType {
  SUPER_ADMIN = 'super_admin',
  FILE_ADMIN = 'file_admin',
  CUSTOMER = 'customer'
}

interface TelegramBotConfig {
  botToken: string;
  chatId?: string;
  enabled: boolean;
}

interface MultiBotConfig {
  superAdmin: TelegramBotConfig;
  fileAdmin: TelegramBotConfig;
  customer: TelegramBotConfig;
  legacy: TelegramBotConfig; // For backward compatibility
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

export class MultiBotTelegramService {
  private static getConfig(): MultiBotConfig {
    return {
      superAdmin: {
        botToken: process.env.TELEGRAM_SUPER_ADMIN_BOT_TOKEN || '',
        chatId: process.env.TELEGRAM_SUPER_ADMIN_CHAT_ID || '',
        enabled: process.env.TELEGRAM_SUPER_ADMIN_ENABLED === 'true'
      },
      fileAdmin: {
        botToken: process.env.TELEGRAM_FILE_ADMIN_BOT_TOKEN || '',
        chatId: process.env.TELEGRAM_FILE_ADMIN_CHAT_ID || '',
        enabled: process.env.TELEGRAM_FILE_ADMIN_ENABLED === 'true'
      },
      customer: {
        botToken: process.env.TELEGRAM_CUSTOMER_BOT_TOKEN || '',
        enabled: process.env.TELEGRAM_CUSTOMER_BOT_ENABLED === 'true'
      },
      legacy: {
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        chatId: process.env.TELEGRAM_CHAT_ID || '',
        enabled: process.env.TELEGRAM_ENABLED === 'true'
      }
    };
  }

  private static getBotConfig(botType: BotType): TelegramBotConfig {
    const config = this.getConfig();
    
    switch (botType) {
      case BotType.SUPER_ADMIN:
        return config.superAdmin;
      case BotType.FILE_ADMIN:
        return config.fileAdmin;
      case BotType.CUSTOMER:
        return config.customer;
      default:
        return config.legacy;
    }
  }

  /**
   * Send message to specific bot type
   */
  static async sendMessage(
    botType: BotType, 
    message: string, 
    chatId?: string,
    options: Partial<TelegramMessage> = {}
  ): Promise<boolean> {
    const botConfig = this.getBotConfig(botType);
    
    if (!botConfig.enabled || !botConfig.botToken) {
      console.log(`📱 ${botType} bot disabled or not configured`);
      return false;
    }

    const targetChatId = chatId || botConfig.chatId;
    if (!targetChatId) {
      console.log(`📱 No chat ID provided for ${botType} bot`);
      return false;
    }

    try {
      const payload: TelegramMessage = {
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...options
      };

      const response = await fetch(`https://api.telegram.org/bot${botConfig.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: targetChatId,
          ...payload
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`📱 ${botType} bot API error:`, errorData);
        return false;
      }

      console.log(`📱 ${botType} bot notification sent successfully`);
      return true;
    } catch (error) {
      console.error(`📱 ${botType} bot notification failed:`, error);
      return false;
    }
  }

  /**
   * Answer callback query for specific bot
   */
  static async answerCallbackQuery(
    botType: BotType,
    callbackQueryId: string, 
    text: string, 
    showAlert: boolean = false
  ): Promise<boolean> {
    const botConfig = this.getBotConfig(botType);
    
    if (!botConfig.enabled || !botConfig.botToken) {
      return false;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${botConfig.botToken}/answerCallbackQuery`, {
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
      console.error(`📱 Error answering ${botType} callback query:`, error);
      return false;
    }
  }

  /**
   * Edit message text for specific bot
   */
  static async editMessageText(
    botType: BotType,
    chatId: string, 
    messageId: number, 
    text: string, 
    replyMarkup?: any
  ): Promise<boolean> {
    const botConfig = this.getBotConfig(botType);
    
    if (!botConfig.enabled || !botConfig.botToken) {
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

      const response = await fetch(`https://api.telegram.org/bot${botConfig.botToken}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (error) {
      console.error(`📱 Error editing ${botType} message:`, error);
      return false;
    }
  }

  // ===== SUPER ADMIN BOT METHODS =====

  /**
   * Send comprehensive system notification to Super Admin
   */
  static async notifySuperAdmin(data: {
    type: 'new_order' | 'new_user' | 'system_alert' | 'payment_received' | 'new_file_upload';
    title: string;
    message: string;
    details?: string;
    actionUrl?: string;
    fileId?: string; // Add fileId for file management
    filename?: string; // Add filename for file management
  }): Promise<boolean> {
    console.log('📱 MultiBotTelegramService.notifySuperAdmin called with:', data);

    const config = this.getConfig();
    console.log('🔧 Super Admin bot config:', {
      hasToken: !!config.superAdmin.botToken,
      hasChatId: !!config.superAdmin.chatId,
      enabled: config.superAdmin.enabled,
      tokenLength: config.superAdmin.botToken?.length || 0,
      chatIdLength: config.superAdmin.chatId?.length || 0
    });

    if (!config.superAdmin.enabled) {
      console.log('⚠️ Super Admin bot is disabled');
      return false;
    }

    if (!config.superAdmin.botToken || !config.superAdmin.chatId) {
      console.log('⚠️ Super Admin bot token or chat ID missing');
      return false;
    }

    const emoji = {
      new_order: '🛒',
      new_user: '👤',
      system_alert: '🚨',
      payment_received: '💳',
      new_file_upload: '📁'
    };

    const message = `
${emoji[data.type]} <b>${data.title}</b>

📝 ${data.message}
${data.details ? `\n🔍 <b>Details:</b> ${data.details}` : ''}
${data.actionUrl ? `\n🔗 <a href="${data.actionUrl}">Take Action</a>` : ''}

🕐 <b>Time:</b> ${new Date().toLocaleString()}
    `.trim();

    // Add interactive buttons for file uploads
    if (data.type === 'new_file_upload' && data.fileId) {
      const replyMarkup = {
        inline_keyboard: [
          [
            {
              text: '✅ Set to READY',
              callback_data: `sa_fs_${data.fileId.substring(0, 8)}_READY`
            }
          ],
          [
            {
              text: '⏳ Set to PENDING',
              callback_data: `sa_fs_${data.fileId.substring(0, 8)}_PENDING`
            }
          ],
          [
            {
              text: '⏰ Set Estimated Time',
              callback_data: `sa_et_${data.fileId.substring(0, 8)}`
            }
          ]
        ]
      };

      console.log('📤 Sending Super Admin message with buttons...');
      const result = await this.sendMessage(BotType.SUPER_ADMIN, message, undefined, {
        reply_markup: replyMarkup
      });
      console.log('📤 Super Admin message with buttons result:', result);
      return result;
    }

    console.log('📤 Sending Super Admin message...');
    const result = await this.sendMessage(BotType.SUPER_ADMIN, message);
    console.log('📤 Super Admin message result:', result);
    return result;
  }

  /**
   * Send estimated time selection to Super Admin
   */
  static async requestSuperAdminEstimatedTime(chatId: string, fileId: string, filename: string): Promise<boolean> {
    const message = `
⏰ <b>Set Estimated Time</b>

📄 <b>File:</b> ${filename}

Please select the estimated processing time:
    `.trim();

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: '5 minutes', callback_data: `sa_t_${fileId.substring(0, 8)}_5` },
          { text: '10 minutes', callback_data: `sa_t_${fileId.substring(0, 8)}_10` },
          { text: '15 minutes', callback_data: `sa_t_${fileId.substring(0, 8)}_15` }
        ],
        [
          { text: '20 minutes', callback_data: `sa_t_${fileId.substring(0, 8)}_20` },
          { text: '30 minutes', callback_data: `sa_t_${fileId.substring(0, 8)}_30` },
          { text: '45 minutes', callback_data: `sa_t_${fileId.substring(0, 8)}_45` }
        ],
        [
          { text: '1 hour', callback_data: `sa_t_${fileId.substring(0, 8)}_60` },
          { text: '2 hours', callback_data: `sa_t_${fileId.substring(0, 8)}_120` },
          { text: '4 hours', callback_data: `sa_t_${fileId.substring(0, 8)}_240` }
        ],
        [
          { text: '1 day', callback_data: `sa_t_${fileId.substring(0, 8)}_1440` },
          { text: 'Custom time', callback_data: `sa_t_${fileId.substring(0, 8)}_custom` }
        ],
        [
          { text: '❌ Cancel', callback_data: `sa_c_${fileId.substring(0, 8)}` }
        ]
      ]
    };

    return this.sendMessage(BotType.SUPER_ADMIN, message, chatId, { reply_markup: replyMarkup });
  }

  // ===== FILE ADMIN BOT METHODS =====

  /**
   * Send file upload notification to File Admin with management buttons
   */
  static async notifyFileAdminNewUpload(fileData: {
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

    // Create inline keyboard with file management buttons
    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: '✅ Set to READY',
            callback_data: `file_admin_status_${fileData.fileId}_READY`
          }
        ],
        [
          {
            text: '⏳ Set to PENDING',
            callback_data: `file_admin_status_${fileData.fileId}_PENDING`
          }
        ],
        [
          {
            text: '⏰ Set Estimated Time',
            callback_data: `file_admin_estimated_time_${fileData.fileId}`
          }
        ]
      ]
    };

    return this.sendMessage(BotType.FILE_ADMIN, message, undefined, {
      reply_markup: replyMarkup
    });
  }

  /**
   * Send estimated time selection to File Admin
   */
  static async requestFileAdminEstimatedTime(chatId: string, fileId: string, filename: string): Promise<boolean> {
    const message = `
⏰ <b>Set Estimated Time</b>

📄 <b>File:</b> ${filename}

Please select the estimated processing time:
    `.trim();

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: '5 minutes', callback_data: `file_admin_time_${fileId}_5` },
          { text: '10 minutes', callback_data: `file_admin_time_${fileId}_10` },
          { text: '15 minutes', callback_data: `file_admin_time_${fileId}_15` }
        ],
        [
          { text: '20 minutes', callback_data: `file_admin_time_${fileId}_20` },
          { text: '30 minutes', callback_data: `file_admin_time_${fileId}_30` },
          { text: '45 minutes', callback_data: `file_admin_time_${fileId}_45` }
        ],
        [
          { text: '1 hour', callback_data: `file_admin_time_${fileId}_60` },
          { text: '2 hours', callback_data: `file_admin_time_${fileId}_120` },
          { text: '4 hours', callback_data: `file_admin_time_${fileId}_240` }
        ],
        [
          { text: '1 day', callback_data: `file_admin_time_${fileId}_1440` },
          { text: 'Custom time', callback_data: `file_admin_time_${fileId}_custom` }
        ],
        [
          { text: '❌ Cancel', callback_data: `file_admin_cancel_${fileId}` }
        ]
      ]
    };

    return this.sendMessage(BotType.FILE_ADMIN, message, chatId, { reply_markup: replyMarkup });
  }

  // ===== CUSTOMER BOT METHODS =====

  /**
   * Send file status update notification to customer
   */
  static async notifyCustomerFileStatus(customerChatId: string, data: {
    filename: string;
    oldStatus: string;
    newStatus: string;
    estimatedTime?: string;
  }): Promise<boolean> {
    const statusEmoji = {
      RECEIVED: '📥',
      PENDING: '⏳',
      READY: '✅'
    };

    const message = `
${statusEmoji[data.newStatus as keyof typeof statusEmoji] || '📄'} <b>File Status Update</b>

📄 <b>File:</b> ${data.filename}
📊 <b>Status:</b> ${data.oldStatus} → ${data.newStatus}
${data.estimatedTime ? `⏰ <b>Estimated Time:</b> ${data.estimatedTime}` : ''}

${data.newStatus === 'READY' ? '🎉 Your file is ready for download!' : 
  data.newStatus === 'PENDING' ? '⏳ Your file is being processed...' : 
  '📥 Your file has been received.'}

🔗 <a href="${process.env.NEXTAUTH_URL}/files">View Your Files</a>
    `.trim();

    return this.sendMessage(BotType.CUSTOMER, message, customerChatId);
  }

  /**
   * Send order confirmation to customer
   */
  static async notifyCustomerOrderConfirmation(customerChatId: string, data: {
    orderId: string;
    totalAmount: number;
    itemsCount: number;
  }): Promise<boolean> {
    const message = `
🛒 <b>Order Confirmed!</b>

📋 <b>Order ID:</b> ${data.orderId}
💰 <b>Total:</b> $${data.totalAmount}
📦 <b>Items:</b> ${data.itemsCount}

Thank you for your order! We'll process it shortly.

🔗 <a href="${process.env.NEXTAUTH_URL}/orders">Track Your Order</a>
    `.trim();

    return this.sendMessage(BotType.CUSTOMER, message, customerChatId);
  }

  // ===== UTILITY METHODS =====

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

  /**
   * Test connection for all enabled bots
   */
  static async testAllBots(): Promise<{ [key in BotType]: boolean }> {
    const results = {} as { [key in BotType]: boolean };
    
    for (const botType of Object.values(BotType)) {
      const testMessage = `
🤖 <b>${botType.toUpperCase()} Bot Test</b>

✅ Connection successful!
🕐 <b>Time:</b> ${new Date().toLocaleString()}
🌐 <b>Environment:</b> ${process.env.NODE_ENV}

Your ${botType} bot is now active! 🚀
      `.trim();

      results[botType] = await this.sendMessage(botType, testMessage);
    }

    return results;
  }
}
