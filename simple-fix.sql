-- SIMPLE FIX - Run this in Supabase SQL Editor
-- This temporarily disables RLS to test, then re-enables with simple policies

-- Step 1: Temporarily disable RLS to test
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Test if this fixes the issue
-- Go back to your app and refresh - it should work now

-- Step 3: If it works, re-enable RLS with proper policies
-- (Don't run this yet - test first!)

/*
-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON user_profiles';
    END LOOP;
END $$;

-- Create one simple policy that allows authenticated users to see their own profile
CREATE POLICY "authenticated_users_own_profile" 
ON user_profiles 
FOR ALL 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create admin policy
CREATE POLICY "admins_all_access" 
ON user_profiles 
FOR ALL 
TO authenticated
USING (
  id IN (
    SELECT id FROM user_profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);
*/
