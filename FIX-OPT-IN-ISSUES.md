# Fix Opt-In System Issues

## Problem

The opt-in functionality is not working. This is likely because:
1. SQL functions haven't been created in Supabase
2. Functions exist but have errors
3. Backend can't call the functions

## Solution

### Step 1: Run the Fixed SQL Script

**In Supabase SQL Editor**, run `fix-opt-in-system.sql`:

This script will:
- ✅ Drop any existing functions
- ✅ Recreate all functions with better error handling
- ✅ Add logging (RAISE NOTICE)
- ✅ Test the functions automatically
- ✅ Show verification results

### Step 2: Check the Results

After running the script, you should see:

```
NOTICE:  Testing with user: <uuid>
NOTICE:  Test category created: Test Category (is_new: true)
NOTICE:  User categories count: 1

status: "Opt-in system fixed and ready!"
```

### Step 3: Verify Functions Exist

Run this query in Supabase:

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN (
  'get_user_categories',
  'get_user_payment_methods', 
  'create_or_opt_in_category',
  'create_or_opt_in_payment_method'
)
AND routine_schema = 'public';
```

Should return 4 functions.

### Step 4: Test Manually

Test creating a category:

```sql
-- Replace with your actual user ID
SELECT * FROM create_or_opt_in_category(
  'your-user-id-here'::UUID,
  'Food',
  'expense',
  0
);
```

Should return:
```
id | name | type | order | is_new
---|------|------|-------|-------
uuid | Food | expense | 0 | true
```

### Step 5: Test from Backend

Check backend logs when creating a category:

```bash
# Backend should show:
Creating/opting into category: { user_id: '...', name: 'Food', type: 'expense' }
Category result: [{ id: '...', name: 'Food', ... }]
```

## Common Issues

### Issue 1: "function does not exist"

**Cause**: SQL functions not created

**Fix**: Run `fix-opt-in-system.sql` in Supabase

### Issue 2: "permission denied for function"

**Cause**: Missing GRANT permissions

**Fix**: The script includes GRANT statements, re-run it

### Issue 3: Categories still showing for all users

**Cause**: Old data has empty `opted_in_users` arrays

**Fix**: Run this to clear old data:

```sql
-- Make all existing categories require opt-in
UPDATE categories 
SET opted_in_users = ARRAY[]::UUID[]
WHERE cardinality(opted_in_users) = 0;

UPDATE payment_methods 
SET opted_in_users = ARRAY[]::UUID[]
WHERE cardinality(opted_in_users) = 0;
```

### Issue 4: Backend returns 500 error

**Cause**: Service role key not set or incorrect

**Fix**: Check `backend/.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Get the correct key from Supabase Dashboard → Settings → API → service_role

### Issue 5: Function returns empty result

**Cause**: Function logic error

**Fix**: Check Supabase logs:
1. Go to Supabase Dashboard
2. Database → Logs
3. Look for NOTICE messages from the functions

## Testing Checklist

- [ ] Run `fix-opt-in-system.sql` in Supabase
- [ ] Verify 4 functions exist
- [ ] Test `create_or_opt_in_category` manually
- [ ] Check backend logs show category creation
- [ ] Create category from frontend
- [ ] Verify category appears in list
- [ ] Create same category with different user
- [ ] Verify both users see it

## Debug Mode

Enable detailed logging:

### In Supabase:

```sql
-- Check what categories a user has
SELECT * FROM get_user_categories('your-user-id'::UUID, NULL);

-- Check opted_in_users for a category
SELECT name, opted_in_users FROM categories WHERE name = 'Food';

-- Check all categories
SELECT id, name, type, opted_in_users FROM categories;
```

### In Backend:

Check the console output when creating categories. You should see:

```
Creating/opting into category: { ... }
Category result: [ { id: '...', name: 'Food', is_new: true } ]
```

## Quick Fix Commands

### Reset Everything:

```sql
-- Clear all opted_in_users
UPDATE categories SET opted_in_users = ARRAY[]::UUID[];
UPDATE payment_methods SET opted_in_users = ARRAY[]::UUID[];

-- Recreate functions
-- (Run fix-opt-in-system.sql)
```

### Add User to Existing Category:

```sql
UPDATE categories 
SET opted_in_users = array_append(opted_in_users, 'user-id'::UUID)
WHERE name = 'Food' AND type = 'expense';
```

### Check User's Categories:

```sql
SELECT c.name, c.type, c.opted_in_users
FROM categories c
WHERE 'user-id'::UUID = ANY(c.opted_in_users);
```

## Still Not Working?

1. **Check Supabase connection**:
   ```bash
   curl http://localhost:4000/api/health
   ```

2. **Check backend logs**:
   - Look at terminal where backend is running
   - Should show detailed logs

3. **Check browser console**:
   - Open DevTools → Console
   - Look for API errors

4. **Check Network tab**:
   - Open DevTools → Network
   - Filter by "categories"
   - Check request/response

5. **Verify authentication**:
   - Make sure you're logged in
   - Check JWT token is being sent

## Contact Points

If still having issues, check:
- Backend logs (terminal)
- Supabase logs (Dashboard → Database → Logs)
- Browser console (F12)
- Network requests (F12 → Network)

The logs will show exactly where the issue is!
