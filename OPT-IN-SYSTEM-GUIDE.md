# Opt-In Categories & Payment Methods System

## Overview

Users now start with **empty lists** and build their own categories and payment methods. When they create something that already exists, they automatically "opt in" to it.

## How It Works

### For New Users:
```
1. User signs up
2. Categories list: EMPTY ✅
3. Payment methods list: EMPTY ✅
4. User creates their first category → Added to their list
5. User creates their first payment method → Added to their list
```

### When Creating a Category:

```
User creates "Food & Dining"
  ↓
System checks: Does "Food & Dining" already exist?
  ↓
  ├─ YES → Add user to opted_in_users array (opt-in)
  │         Other users who have it: Still see it
  │         Other users who don't: Still don't see it
  │
  └─ NO  → Create new category with user in opted_in_users
            Only this user sees it (for now)
```

### Example Flow:

```
User A creates "Food"
  → New category created
  → opted_in_users: [User A]
  → Only User A sees "Food"

User B creates "Food" (same name!)
  → Category already exists
  → opted_in_users: [User A, User B]
  → Both User A and User B see "Food"
  → User C still doesn't see it

User C creates "Transport"
  → New category created
  → opted_in_users: [User C]
  → Only User C sees "Transport"
```

## Database Schema

### Categories Table:
```sql
id                UUID
name              TEXT
type              expense/income
order             INTEGER
opted_in_users    UUID[]  -- Users who can see this
hidden_for_users  UUID[]  -- Users who hid this
user_orders       JSONB   -- Custom order per user
```

### Example Data:

```json
{
  "id": "uuid-1",
  "name": "Food & Dining",
  "type": "expense",
  "opted_in_users": ["user-a-id", "user-b-id"],  // Only A and B see this
  "hidden_for_users": [],
  "user_orders": {}
}

{
  "id": "uuid-2",
  "name": "Transport",
  "type": "expense",
  "opted_in_users": ["user-c-id"],  // Only C sees this
  "hidden_for_users": [],
  "user_orders": {}
}
```

## API Behavior

### GET /api/categories
Returns only categories the user has opted into:

```typescript
// User A calls this
GET /api/categories
→ Returns: ["Food & Dining", "Shopping", ...]
// Only categories where User A is in opted_in_users

// User B calls this
GET /api/categories
→ Returns: ["Food & Dining", "Travel", ...]
// Only categories where User B is in opted_in_users
```

### POST /api/categories
Creates or opts into a category:

```typescript
// User creates "Food"
POST /api/categories
{
  "name": "Food",
  "type": "expense"
}

Response:
{
  "data": {
    "id": "uuid",
    "name": "Food",
    "type": "expense",
    "is_new": true  // or false if opted into existing
  },
  "message": "Category created"  // or "Opted into existing category"
}
```

## Benefits

### 1. Clean Start
- ✅ New users see empty lists
- ✅ No overwhelming default categories
- ✅ Users build their own system

### 2. Smart Sharing
- ✅ Common categories naturally emerge
- ✅ Users automatically share popular categories
- ✅ No duplicate "Food" categories

### 3. Privacy
- ✅ Users only see what they've created
- ✅ Can't see other users' custom categories
- ✅ Each user's list is personal

### 4. Efficiency
- ✅ No data duplication
- ✅ One "Food" category shared by many users
- ✅ Database stays clean

## User Experience

### First Time User:
```
1. Signs up
2. Goes to create transaction
3. Category dropdown: EMPTY
4. Clicks "Add Category"
5. Types "Food"
6. Creates it
7. Now "Food" appears in their dropdown
```

### Experienced User:
```
1. Has 10 categories already
2. Creates "Groceries"
3. System checks: "Groceries" exists (created by another user)
4. User automatically opts in
5. "Groceries" appears in their list
6. Both users now share this category
```

## Migration

### Run the SQL Script:

```bash
# In Supabase SQL Editor, run:
opt-in-categories-schema.sql
```

This will:
1. Update functions to only show opted-in items
2. Create opt-in functions
3. Clear all existing opted_in_users (fresh start)
4. All users start with empty lists

### After Migration:

- ✅ All users have empty categories/payment methods
- ✅ Users create their own as needed
- ✅ System automatically handles duplicates

## Testing

### Test Scenario 1: New User
```
1. Create new user account
2. Check categories → Should be EMPTY
3. Create category "Food"
4. Check categories → Should show "Food"
```

### Test Scenario 2: Duplicate Category
```
1. User A creates "Food"
2. User B creates "Food" (same name)
3. User A checks categories → Sees "Food"
4. User B checks categories → Sees "Food"
5. Both share the same category record
```

### Test Scenario 3: Different Categories
```
1. User A creates "Food"
2. User B creates "Transport"
3. User A checks → Only sees "Food"
4. User B checks → Only sees "Transport"
```

## Comparison

### Old System (Default Categories):
```
User A: Food, Transport, Shopping (shared defaults)
User B: Food, Transport, Shopping (shared defaults)
User C: Food, Transport, Shopping (shared defaults)
```
- ❌ Everyone sees same defaults
- ❌ Overwhelming for new users
- ❌ May not match user's needs

### New System (Opt-In):
```
User A: Food, Rent (only what they created)
User B: Food, Transport (only what they created)
User C: Salary, Freelance (only what they created)
```
- ✅ Each user builds their own
- ✅ Clean start
- ✅ Matches user's actual needs
- ✅ Common categories naturally shared

## Implementation Status

- ✅ SQL functions created
- ✅ Backend API updated
- ✅ Frontend already compatible
- ⚠️ Need to run migration SQL

## Next Steps

1. **Run Migration**: Execute `opt-in-categories-schema.sql` in Supabase
2. **Test**: Create new user and verify empty lists
3. **Test**: Create categories and verify opt-in behavior
4. **Deploy**: Backend already updated, just need to run SQL

## Rollback

If you want to go back to shared defaults:

```sql
-- Add all users to all categories
UPDATE categories 
SET opted_in_users = (SELECT array_agg(id) FROM user_profiles);

UPDATE payment_methods 
SET opted_in_users = (SELECT array_agg(id) FROM user_profiles);
```

## Summary

- ✅ Users start with empty lists
- ✅ Users create their own categories/payment methods
- ✅ Duplicate names automatically opt-in (smart sharing)
- ✅ No data duplication
- ✅ Clean, personalized experience
- ✅ Backend already updated
- ⚠️ Just run the SQL migration!
