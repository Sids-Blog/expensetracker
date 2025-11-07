-- Quick Fix for Profile Loading Issue
-- Run this in Supabase SQL Editor

-- Step 1: Check current state
SELECT 'Checking auth users...' as step;
SELECT id, email, created_at FROM auth.users;

SELECT 'Checking user profiles...' as step;
SELECT id, email, full_name, is_active, is_admin FROM user_profiles;

-- Step 2: Create missing profiles
SELECT 'Creating missing profiles...' as step;
INSERT INTO user_profiles (id, email, full_name, is_active, is_admin)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  true,
  false
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Make the first user an admin (or specify your email)
-- Option A: Make the first user admin
UPDATE user_profiles 
SET is_admin = true 
WHERE id = (SELECT id FROM user_profiles ORDER BY created_at LIMIT 1);

-- Option B: Make a specific user admin (uncomment and replace email)
-- UPDATE user_profiles 
-- SET is_admin = true 
-- WHERE email = 'your-email@example.com';

-- Step 4: Verify the fix
SELECT 'Final state:' as step;
SELECT 
  id, 
  email, 
  full_name, 
  is_active, 
  is_admin,
  created_at
FROM user_profiles
ORDER BY created_at;

-- Step 5: Check if you have any admin users
SELECT 'Admin users:' as step;
SELECT email, full_name, is_admin 
FROM user_profiles 
WHERE is_admin = true;
