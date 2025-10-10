#!/usr/bin/env tsx

import { config } from 'dotenv';
import { join } from 'path';
import { prisma } from '@/lib/database/prisma';

// Load environment variables
config({ path: join(process.cwd(), '.env.local') });

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

/**
 * Link a Telegram user to a website user account
 */
export async function linkTelegramAccount(
  chatId: string, 
  telegramUser: TelegramUser, 
  userEmail: string
): Promise<boolean> {
  try {
    console.log(`🔗 Linking Telegram account for ${userEmail}`);
    
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });
    
    if (!user) {
      console.error(`❌ User not found: ${userEmail}`);
      return false;
    }
    
    // Check if this Telegram account is already linked to another user
    const existingLink = await prisma.user.findUnique({
      where: { telegramChatId: chatId }
    });
    
    if (existingLink && existingLink.id !== user.id) {
      console.error(`❌ Telegram account already linked to another user`);
      return false;
    }
    
    // Update user with Telegram info
    await prisma.user.update({
      where: { id: user.id },
      data: {
        telegramChatId: chatId,
        telegramUsername: telegramUser.username,
        telegramLinkedAt: new Date()
      }
    });
    
    console.log(`✅ Successfully linked Telegram account for ${user.firstName} ${user.lastName}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error linking Telegram account:', error);
    return false;
  }
}

/**
 * Find user by Telegram chat ID
 */
export async function findUserByTelegramChatId(chatId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramChatId: chatId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        telegramUsername: true,
        telegramLinkedAt: true
      }
    });
    
    return user;
  } catch (error) {
    console.error('❌ Error finding user by Telegram chat ID:', error);
    return null;
  }
}

/**
 * Generate a unique linking code for a user
 */
export async function generateLinkingCode(userEmail: string): Promise<string | null> {
  try {
    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in a temporary table or cache (for now, we'll use a simple approach)
    // In production, you might want to use Redis or a temporary table
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // For now, we'll store in user's notes or create a simple cache
    // You can implement a proper temporary storage later
    
    console.log(`🔢 Generated linking code ${code} for ${userEmail}`);
    return code;
    
  } catch (error) {
    console.error('❌ Error generating linking code:', error);
    return null;
  }
}

/**
 * Get all users with Telegram notifications enabled
 */
export async function getUsersWithTelegram() {
  try {
    const users = await prisma.user.findMany({
      where: {
        telegramChatId: { not: null },
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        telegramChatId: true,
        telegramUsername: true
      }
    });
    
    return users;
  } catch (error) {
    console.error('❌ Error getting users with Telegram:', error);
    return [];
  }
}

/**
 * Send notification to specific customer via Telegram
 */
export async function notifyCustomerViaTelegram(
  userId: string,
  message: string,
  options?: {
    parse_mode?: 'HTML' | 'Markdown';
    disable_web_page_preview?: boolean;
    reply_markup?: any;
  }
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { telegramChatId: true, firstName: true, lastName: true }
    });
    
    if (!user?.telegramChatId) {
      console.log(`📱 User ${userId} doesn't have Telegram linked`);
      return false;
    }
    
    const botToken = process.env.TELEGRAM_CUSTOMER_BOT_TOKEN;
    if (!botToken) {
      console.error('❌ TELEGRAM_CUSTOMER_BOT_TOKEN not configured');
      return false;
    }
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: user.telegramChatId,
        text: message,
        parse_mode: options?.parse_mode || 'HTML',
        disable_web_page_preview: options?.disable_web_page_preview ?? true,
        reply_markup: options?.reply_markup
      })
    });
    
    const result = await response.json();
    
    if (result.ok) {
      console.log(`✅ Telegram notification sent to ${user.firstName} ${user.lastName}`);
      return true;
    } else {
      console.error(`❌ Failed to send Telegram notification:`, result.description);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error sending Telegram notification:', error);
    return false;
  }
}

// Export for use in other modules
export type { TelegramUser };
