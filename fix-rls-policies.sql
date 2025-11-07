-- Fix RLS Policies for user_profiles
-- Run this in Supabase SQL Editor

-- Step 1: Drop all existing policies on user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

-- Step 2: Create simple, working policies
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" 
ON user_profiles FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON user_profiles FOR UPDATE 
USING (auth.uid() = id);

-- Allow admins to read all profiles
CREATE POLICY "Admins can read all profiles" 
ON user_profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND is_admin = true AND is_active = true
  )
);

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles" 
ON user_profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND is_admin = true AND is_active = true
  )
);

-- Step 3: Verify RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Step 5: Test query (should work now)
SELECT id, email, full_name, is_active, is_admin 
FROM user_profiles 
WHERE id = auth.uid();
