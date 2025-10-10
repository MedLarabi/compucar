-- Unlink Telegram account from specific email
UPDATE users 
SET 
  "telegramChatId" = NULL,
  "telegramUsername" = NULL,
  "telegramLinkedAt" = NULL
WHERE email = 'your-email@example.com';

-- Check if unlinking worked
SELECT email, "telegramChatId", "telegramUsername", "telegramLinkedAt" 
FROM users 
WHERE email = 'your-email@example.com';
