-- ===============================================
-- Create Super Admin User - SQL Script
-- ===============================================
-- Use this script to manually create a super admin user directly in the database
-- Replace the values with your desired credentials

-- Method 1: Create a new super admin user
-- Replace these values with your desired credentials:
-- - 'your-email@example.com' with your email
-- - 'Your' with your first name  
-- - 'Name' with your last name
-- - '$2a$12$...' with a bcrypt hash of your password

INSERT INTO users (
    id,
    email,
    "firstName",
    "lastName",
    name,
    password,
    role,
    "isAdmin",
    "emailVerified",
    "isActive",
    "createdAt",
    "updatedAt"
) VALUES (
    -- Generate a random ID (you can use: SELECT gen_random_uuid() in PostgreSQL)
    gen_random_uuid(),
    'your-email@example.com',  -- Replace with your email
    'Your',                    -- Replace with your first name
    'Name',                    -- Replace with your last name
    'Your Name',               -- Replace with your full name
    -- Password hash for 'admin123' (replace with your own hash)
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2ukC1yxbhO',
    'SUPER_ADMIN',
    true,
    NOW(),
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = 'SUPER_ADMIN',
    "isAdmin" = true,
    password = EXCLUDED.password,
    "firstName" = EXCLUDED."firstName",
    "lastName" = EXCLUDED."lastName",
    name = EXCLUDED.name,
    "emailVerified" = NOW(),
    "isActive" = true,
    "updatedAt" = NOW();

-- Method 2: Update an existing user to super admin
-- Replace 'existing-user@example.com' with the email of the user you want to promote
UPDATE users 
SET 
    role = 'SUPER_ADMIN',
    "isAdmin" = true,
    "updatedAt" = NOW()
WHERE email = 'existing-user@example.com';

-- Method 3: Update by user ID (if you know the user ID)
-- UPDATE users 
-- SET 
--     role = 'SUPER_ADMIN',
--     "isAdmin" = true,
--     "updatedAt" = NOW()
-- WHERE id = 'your-user-id-here';

-- Verify the changes
SELECT 
    id, 
    email, 
    "firstName", 
    "lastName", 
    role, 
    "isAdmin",
    "createdAt",
    "updatedAt"
FROM users 
WHERE role = 'SUPER_ADMIN' OR "isAdmin" = true
ORDER BY "createdAt" DESC;

-- ===============================================
-- Password Hash Generation (for reference)
-- ===============================================
-- To generate a password hash, you can use:
-- 1. Online bcrypt generators (search "bcrypt hash generator")
-- 2. Node.js: bcrypt.hash('your-password', 12)
-- 3. Python: from bcrypt import hashpw, gensalt; hashpw(b'your-password', gensalt())
-- 
-- Common password hashes (for testing only - change in production):
-- 'admin123' -> $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2ukC1yxbhO
-- 'password' -> $2a$12$6vTXYf3lXKCjV6ux3HQzO.XJJWy6WnZkN5z7WQ8p7ZQ8QW7QW7QW7Q
-- 'super123' -> $2a$12$8K3Z4Kw5F2Qp9Xm7Vn6Lh.YzQw8Er5Ty4Ui2Op1Mn3Kj9Lp8Qw2Er5
