# Simple Personalization Guide (Array-Based)

## Overview

This approach uses **arrays in existing tables** to track user personalization without creating additional tables.

## How It Works

### Existing Tables with New Columns

#### Categories Table
```sql
- id, name, type, order (existing)
- opted_in_users UUID[]      -- Users who created/opted into this category
- hidden_for_users UUID[]    -- Users who hid this category
- user_orders JSONB          -- Custom order per user: {"user_id": order}
```

#### Payment Methods Table
```sql
- id, name, order (existing)
- opted_in_users UUID[]      -- Users who created/opted into this method
- hidden_for_users UUID[]    -- Users who hid this method
- user_orders JSONB          -- Custom order per user: {"user_id": order}
```

## Category Types

### 1. Shared Categories (Default)
```sql
opted_in_users = []  -- Empty array = shared/default
```
- Visible to all users
- Created by admin or system
- Users can hide them but not delete them

### 2. Custom Categories (User-Created)
```sql
opted_in_users = [user_id]  -- Contains creator's ID
```
- Only visible to users in the array
- Can be deleted by creator
- Personal to specific users

## User Actions

### Hide a Category
```sql
SELECT hide_category(category_id, user_id);
-- Adds user to hidden_for_users array
```

### Show a Category
```sql
SELECT show_category(category_id, user_id);
-- Removes user from hidden_for_users array
```

### Set Custom Order
```sql
SELECT set_category_order(category_id, user_id, 5);
-- Sets user_orders = {"user_id": 5}
```

### Create Custom Category
```sql
INSERT INTO categories (name, type, order, opted_in_users)
VALUES ('My Category', 'expense', 100, ARRAY[user_id]);
-- Only visible to this user
```

## Benefits

### ✅ No Additional Tables
- Uses existing categories and payment_methods tables
- Just adds 3 columns per table
- Simpler schema

### ✅ Efficient Queries
- PostgreSQL arrays are indexed with GIN
- Fast lookups with `ANY(array)` operator
- JSONB for flexible user-specific data

### ✅ Easy to Understand
- Empty array = shared
- Has user ID = custom
- In hidden array = hidden for that user

## Example Data

### Shared Category (Everyone Sees It)
```json
{
  "id": "uuid-1",
  "name": "Food & Dining",
  "type": "expense",
  "order": 0,
  "opted_in_users": [],  // Empty = shared
  "hidden_for_users": ["user-2"],  // Hidden for user-2
  "user_orders": {
    "user-1": 5,  // User-1 wants it at position 5
    "user-3": 1   // User-3 wants it at position 1
  }
}
```

### Custom Category (Only Creator Sees It)
```json
{
  "id": "uuid-2",
  "name": "My Custom Category",
  "type": "expense",
  "order": 100,
  "opted_in_users": ["user-1"],  // Only user-1 sees this
  "hidden_for_users": [],
  "user_orders": {}
}
```

## API Usage

### Get User's Categories
```typescript
const { data } = await supabase.rpc('get_user_categories', {
  p_user_id: user.id,
  p_type: 'expense'  // or null for all
});
// Returns only visible categories in user's preferred order
```

### Create Custom Category
```typescript
const { data } = await supabase
  .from('categories')
  .insert({
    name: 'My Category',
    type: 'expense',
    order: 100,
    opted_in_users: [user.id],  // Makes it custom
    hidden_for_users: [],
    user_orders: {}
  });
```

### Hide Category
```typescript
const { data } = await supabase.rpc('hide_category', {
  p_category_id: categoryId,
  p_user_id: user.id
});
```

### Set Custom Order
```typescript
const { data } = await supabase.rpc('set_category_order', {
  p_category_id: categoryId,
  p_user_id: user.id,
  p_order: 5
});
```

## Migration from Old Approach

If you previously had `user_id` and `is_default` columns:

```sql
-- Run simple-personalized-categories.sql
-- It will:
-- 1. Drop old columns (user_id, is_default, is_custom, created_by)
-- 2. Add new array columns
-- 3. Initialize all existing categories as shared
```

## Performance

- **GIN indexes** on arrays for fast lookups
- **JSONB** for flexible user-specific data
- **Single query** to get user's personalized list
- **No joins** needed

## Comparison

### Old Approach (Separate Tables)
```
categories (shared)
user_category_preferences (joins required)
```

### New Approach (Arrays)
```
categories (with arrays, no joins)
```

Simpler, faster, fewer tables!
