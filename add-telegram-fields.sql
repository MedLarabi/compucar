-- Add Telegram integration fields to User table
ALTER TABLE "public"."users" ADD COLUMN "telegramChatId" TEXT;
ALTER TABLE "public"."users" ADD COLUMN "telegramUsername" TEXT;
ALTER TABLE "public"."users" ADD COLUMN "telegramLinkedAt" TIMESTAMP(3);

-- Add unique constraint on telegramChatId
ALTER TABLE "public"."users" ADD CONSTRAINT "users_telegramChatId_key" UNIQUE ("telegramChatId");
