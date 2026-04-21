-- Run this in Supabase SQL Editor to check your user profile

-- First, check your auth user
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Then check the users table
SELECT id, email, full_name, role, account_status, created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are any admin users
SELECT id, email, full_name, role, account_status
FROM public.users
WHERE role = 'admin';

-- Find your specific user (replace with your email)
-- SELECT id, email, full_name, role, account_status
-- FROM public.users
-- WHERE email = 'your-email@example.com';
