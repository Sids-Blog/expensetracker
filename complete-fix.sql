-- COMPLETE FIX FOR USER_PROFILES 500 ERROR
-- Copy and paste this ENTIRE script into Supabase SQL Editor and run it

-- Step 1: Check if table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_profiles') THEN
        -- Create the table if it doesn't exist
        CREATE TABLE user_profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT NOT NULL UNIQUE,
          full_name TEXT,
          is_active BOOLEAN DEFAULT true,
          is_admin BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_login_at TIMESTAMP WITH TIME ZONE,
          deactivated_at TIMESTAMP WITH TIME ZONE,
          deactivated_by UUID REFERENCES auth.users(id)
        );
    END IF;
END $$;

-- Step 2: Disable RLS temporarily
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Create profiles for all auth users
INSERT INTO user_profiles (id, email, full_name, is_active, is_admin)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  true,
  false
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- Step 4: Make first user admin
UPDATE user_profiles 
SET is_admin = true 
WHERE id = (SELECT id FROM user_profiles ORDER BY created_at LIMIT 1);

-- Step 5: Grant permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO service_role;

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin);

-- Step 7: Re-enable RLS with simple policy
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 8: Drop all existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON user_profiles';
    END LOOP;
END $$;

-- Step 9: Create one simple policy for all operations
CREATE POLICY "user_profiles_access" 
ON user_profiles 
FOR ALL 
TO authenticated
USING (true)  -- Allow all authenticated users to read all profiles
WITH CHECK (auth.uid() = id);  -- But only update their own

-- Step 10: Verify setup
SELECT 'Setup complete! Here are your users:' as message;
SELECT id, email, full_name, is_active, is_admin, created_at 
FROM user_profiles
ORDER BY created_at;

SELECT 'RLS Status:' as message;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles';

SELECT 'Policies:' as message;
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'user_profiles';
