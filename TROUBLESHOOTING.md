# Troubleshooting Guide

## Issue: Profile Section Shows "Loading..." and Users Tab Not Visible

### Step 1: Check if SQL Scripts Were Run

Run this in Supabase SQL Editor:

```sql
-- Check if user_profiles table exists
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name = 'user_profiles';
-- Should return 1
```

If it returns 0, you need to run `supabase-auth-schema.sql` first.

### Step 2: Check if Your User Has a Profile

```sql
-- Check all profiles
SELECT id, email, full_name, is_active, is_admin 
FROM user_profiles;
```

If you don't see your user, the trigger didn't fire. Manually create the profile:

```sql
-- Get your user ID from auth.users
SELECT id, email FROM auth.users;

-- Manually create profile (replace USER_ID and EMAIL)
INSERT INTO user_profiles (id, email, full_name, is_active, is_admin)
VALUES (
  'YOUR_USER_ID_HERE',
  'your-email@example.com',
  'Your Name',
  true,
  true  -- Set to true to make yourself admin
);
```

### Step 3: Make Yourself Admin

```sql
UPDATE user_profiles 
SET is_admin = true 
WHERE email = 'your-email@example.com';
```

### Step 4: Verify RLS Policies

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles';
-- rowsecurity should be true

-- Check policies
SELECT policyname, tablename, cmd 
FROM pg_policies 
WHERE tablename = 'user_profiles';
```

### Step 5: Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Look for these debug messages:
   - `ExpensePage - profile:` - Should show your profile object
   - `ExpensePage - isAdmin:` - Should show `true` if you're admin
   - `ProfileSettings - profile:` - Should show your profile object

### Step 6: Check Network Tab

1. Open Developer Tools (F12)
2. Go to Network tab
3. Filter by "user_profiles"
4. Look for any failed requests
5. Check the response - it should contain your profile data

### Common Issues and Solutions

#### Issue: Profile is null
**Solution**: Your user doesn't have a profile record. Run Step 2 above.

#### Issue: is_admin is false
**Solution**: Run Step 3 to make yourself admin.

#### Issue: "Row Level Security" error
**Solution**: RLS policies might be too restrictive. Check Step 4.

#### Issue: Trigger not working
**Solution**: The trigger might not have been created. Re-run the auth schema SQL:

```sql
-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Step 7: Force Refresh Profile

If everything looks correct in the database but the UI still shows loading:

1. Open browser console
2. Run: `localStorage.clear()`
3. Refresh the page
4. Log out and log back in

### Step 8: Check Supabase Connection

Verify your `.env` file has correct values:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Test the connection in browser console:

```javascript
// In browser console
const { createClient } = window.supabase;
const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_ANON_KEY'
);

// Test query
const { data, error } = await supabase.from('user_profiles').select('*');
console.log('Data:', data);
console.log('Error:', error);
```

### Still Having Issues?

1. Check the browser console for any error messages
2. Check the Network tab for failed API calls
3. Verify your Supabase project is active
4. Try creating a new user and see if the profile is created automatically
5. Check Supabase logs in the dashboard

### Quick Fix Script

Run this in Supabase SQL Editor to fix most common issues:

```sql
-- 1. Ensure user_profiles table exists (should already exist)
-- 2. Create profiles for any users without them
INSERT INTO user_profiles (id, email, full_name, is_active, is_admin)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  true,
  false
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO NOTHING;

-- 3. Make your user an admin (replace with your email)
UPDATE user_profiles 
SET is_admin = true 
WHERE email = 'your-email@example.com';

-- 4. Verify
SELECT id, email, full_name, is_active, is_admin 
FROM user_profiles;
```
