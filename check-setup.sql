-- Run this in Supabase SQL Editor to check your setup

-- 1. Check if user_profiles table exists
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 2. Check if there are any user profiles
SELECT 
  id,
  email,
  full_name,
  is_active,
  is_admin,
  created_at
FROM user_profiles;

-- 3. Check auth users
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users;

-- 4. Check if triggers exist
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name IN ('on_auth_user_created', 'on_auth_user_login');

-- 5. If you have auth users but no profiles, manually create them:
-- Uncomment and run this if needed:
/*
INSERT INTO user_profiles (id, email, full_name, is_active, is_admin)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email),
  true,
  false
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles);
*/

-- 6. Make yourself admin (replace with your email):
/*
UPDATE user_profiles 
SET is_admin = true 
WHERE email = 'your-email@example.com';
*/
