#!/usr/bin/env tsx

import { config } from 'dotenv';
import { join } from 'path';
import { prisma } from '../src/lib/database/prisma';

// Load environment variables
config({ path: join(process.cwd(), '.env') });

async function unlinkTelegramAccount(email: string) {
  try {
    console.log(`🔗 Unlinking Telegram account for: ${email}`);
    
    // Find the user first
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        telegramChatId: true,
        telegramUsername: true,
        telegramLinkedAt: true
      }
    });
    
    if (!user) {
      console.log('❌ User not found with that email');
      return;
    }
    
    if (!user.telegramChatId) {
      console.log('ℹ️ User does not have a linked Telegram account');
      return;
    }
    
    console.log(`📱 Current Telegram info:`);
    console.log(`   Chat ID: ${user.telegramChatId}`);
    console.log(`   Username: ${user.telegramUsername || 'Not set'}`);
    console.log(`   Linked at: ${user.telegramLinkedAt?.toLocaleString() || 'Unknown'}`);
    
    // Unlink the account
    await prisma.user.update({
      where: { email },
      data: {
        telegramChatId: null,
        telegramUsername: null,
        telegramLinkedAt: null
      }
    });
    
    console.log(`✅ Successfully unlinked Telegram account for ${user.firstName} ${user.lastName}`);
    console.log(`📱 You can now re-link by sending your email to the Customer Bot`);
    
  } catch (error) {
    console.error('❌ Error unlinking Telegram account:', error);
  }
}

async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.log('❌ Please provide an email address');
    console.log('Usage: npx tsx scripts/unlink-telegram.ts your-email@example.com');
    return;
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.log('❌ Please provide a valid email address');
    return;
  }
  
  await unlinkTelegramAccount(email.toLowerCase());
}

if (require.main === module) {
  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
