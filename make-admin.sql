-- SQL script to make a user admin
-- Replace 'your-email@example.com' with your actual email

UPDATE users 
SET "isAdmin" = true 
WHERE email = 'your-email@example.com';

-- Alternative: Update by user ID if you know it
-- UPDATE users SET "isAdmin" = true WHERE id = 'your-user-id';

-- Verify the change
SELECT id, email, "firstName", "lastName", "isAdmin" 
FROM users 
WHERE email = 'your-email@example.com';
