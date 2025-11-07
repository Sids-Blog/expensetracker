-- Simple Personalized Categories Using Arrays
-- This uses the existing tables with array columns to track which users opted in

-- Step 1: Drop all existing policies first (they depend on columns we're removing)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on categories
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'categories') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON categories';
    END LOOP;
    
    -- Drop all policies on payment_methods
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'payment_methods') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON payment_methods';
    END LOOP;
END $$;

-- Step 2: Remove the columns we added earlier (if they exist)
ALTER TABLE categories DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE categories DROP COLUMN IF EXISTS is_default CASCADE;
ALTER TABLE categories DROP COLUMN IF EXISTS is_custom CASCADE;
ALTER TABLE categories DROP COLUMN IF EXISTS created_by CASCADE;

ALTER TABLE payment_methods DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE payment_methods DROP COLUMN IF EXISTS is_default CASCADE;
ALTER TABLE payment_methods DROP COLUMN IF EXISTS is_custom CASCADE;
ALTER TABLE payment_methods DROP COLUMN IF EXISTS created_by CASCADE;

-- Step 3: Add array columns to track opted-in users
ALTER TABLE categories ADD COLUMN IF NOT EXISTS opted_in_users UUID[] DEFAULT '{}';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS hidden_for_users UUID[] DEFAULT '{}';

ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS opted_in_users UUID[] DEFAULT '{}';
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS hidden_for_users UUID[] DEFAULT '{}';

-- Step 4: Add JSONB column for user-specific order preferences
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_orders JSONB DEFAULT '{}';
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS user_orders JSONB DEFAULT '{}';

-- Step 5: Create indexes for array operations
CREATE INDEX IF NOT EXISTS idx_categories_opted_in_users ON categories USING GIN (opted_in_users);
CREATE INDEX IF NOT EXISTS idx_categories_hidden_for_users ON categories USING GIN (hidden_for_users);
CREATE INDEX IF NOT EXISTS idx_payment_methods_opted_in_users ON payment_methods USING GIN (opted_in_users);
CREATE INDEX IF NOT EXISTS idx_payment_methods_hidden_for_users ON payment_methods USING GIN (hidden_for_users);

-- Step 5: Update RLS policies for categories
DROP POLICY IF EXISTS "Users can view default and own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
DROP POLICY IF EXISTS "Users can view all categories" ON categories;
DROP POLICY IF EXISTS "Users can create custom categories" ON categories;
DROP POLICY IF EXISTS "Users can update own custom categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own custom categories" ON categories;

-- Allow all authenticated users to view all categories
CREATE POLICY "Users can view all categories" 
ON categories 
FOR SELECT 
TO authenticated
USING (true);

-- Allow authenticated users to update categories (for opt-in/out)
CREATE POLICY "Users can update categories" 
ON categories 
FOR UPDATE 
TO authenticated
USING (true);

-- Allow authenticated users to insert categories
CREATE POLICY "Users can insert categories" 
ON categories 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow users to delete categories they created (if opted_in_users contains only them)
CREATE POLICY "Users can delete own categories" 
ON categories 
FOR DELETE 
TO authenticated
USING (
  opted_in_users = ARRAY[auth.uid()]
  OR cardinality(opted_in_users) = 0
);

-- Step 6: Update RLS policies for payment_methods
DROP POLICY IF EXISTS "Users can view default and own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can insert own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can update own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can delete own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can view all payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can create custom payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can update own custom payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can delete own custom payment methods" ON payment_methods;

-- Allow all authenticated users to view all payment methods
CREATE POLICY "Users can view all payment methods" 
ON payment_methods 
FOR SELECT 
TO authenticated
USING (true);

-- Allow authenticated users to update payment methods (for opt-in/out)
CREATE POLICY "Users can update payment methods" 
ON payment_methods 
FOR UPDATE 
TO authenticated
USING (true);

-- Allow authenticated users to insert payment methods
CREATE POLICY "Users can insert payment methods" 
ON payment_methods 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow users to delete payment methods they created
CREATE POLICY "Users can delete own payment methods" 
ON payment_methods 
FOR DELETE 
TO authenticated
USING (
  opted_in_users = ARRAY[auth.uid()]
  OR cardinality(opted_in_users) = 0
);

-- Step 9: Create function to get user's categories
CREATE OR REPLACE FUNCTION get_user_categories(
  p_user_id UUID,
  p_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  display_order INTEGER,
  is_visible BOOLEAN,
  is_custom BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.type,
    COALESCE(
      (c.user_orders->>p_user_id::text)::integer,
      c."order"
    ) as display_order,
    NOT (p_user_id = ANY(c.hidden_for_users)) as is_visible,
    (cardinality(c.opted_in_users) > 0 AND p_user_id = ANY(c.opted_in_users)) as is_custom
  FROM categories c
  WHERE 
    (p_type IS NULL OR c.type = p_type)
    AND (
      cardinality(c.opted_in_users) = 0  -- Shared/default categories
      OR p_user_id = ANY(c.opted_in_users)  -- User's custom categories
    )
    AND NOT (p_user_id = ANY(c.hidden_for_users))  -- Not hidden by user
  ORDER BY display_order, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create function to get user's payment methods
CREATE OR REPLACE FUNCTION get_user_payment_methods(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  display_order INTEGER,
  is_visible BOOLEAN,
  is_custom BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.id,
    pm.name,
    COALESCE(
      (pm.user_orders->>p_user_id::text)::integer,
      pm."order"
    ) as display_order,
    NOT (p_user_id = ANY(pm.hidden_for_users)) as is_visible,
    (cardinality(pm.opted_in_users) > 0 AND p_user_id = ANY(pm.opted_in_users)) as is_custom
  FROM payment_methods pm
  WHERE 
    (
      cardinality(pm.opted_in_users) = 0  -- Shared/default payment methods
      OR p_user_id = ANY(pm.opted_in_users)  -- User's custom payment methods
    )
    AND NOT (p_user_id = ANY(pm.hidden_for_users))  -- Not hidden by user
  ORDER BY display_order, pm.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create helper functions for opt-in/out operations

-- Add user to category's opted_in_users (for custom categories)
CREATE OR REPLACE FUNCTION opt_in_category(p_category_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE categories
  SET opted_in_users = array_append(opted_in_users, p_user_id)
  WHERE id = p_category_id
    AND NOT (p_user_id = ANY(opted_in_users));
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hide category for user
CREATE OR REPLACE FUNCTION hide_category(p_category_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE categories
  SET hidden_for_users = array_append(hidden_for_users, p_user_id)
  WHERE id = p_category_id
    AND NOT (p_user_id = ANY(hidden_for_users));
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Show category for user (remove from hidden)
CREATE OR REPLACE FUNCTION show_category(p_category_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE categories
  SET hidden_for_users = array_remove(hidden_for_users, p_user_id)
  WHERE id = p_category_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set custom order for user
CREATE OR REPLACE FUNCTION set_category_order(p_category_id UUID, p_user_id UUID, p_order INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE categories
  SET user_orders = jsonb_set(
    COALESCE(user_orders, '{}'::jsonb),
    ARRAY[p_user_id::text],
    to_jsonb(p_order)
  )
  WHERE id = p_category_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Similar functions for payment methods
CREATE OR REPLACE FUNCTION opt_in_payment_method(p_payment_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE payment_methods
  SET opted_in_users = array_append(opted_in_users, p_user_id)
  WHERE id = p_payment_id
    AND NOT (p_user_id = ANY(opted_in_users));
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION hide_payment_method(p_payment_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE payment_methods
  SET hidden_for_users = array_append(hidden_for_users, p_user_id)
  WHERE id = p_payment_id
    AND NOT (p_user_id = ANY(hidden_for_users));
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION show_payment_method(p_payment_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE payment_methods
  SET hidden_for_users = array_remove(hidden_for_users, p_user_id)
  WHERE id = p_payment_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_payment_method_order(p_payment_id UUID, p_user_id UUID, p_order INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE payment_methods
  SET user_orders = jsonb_set(
    COALESCE(user_orders, '{}'::jsonb),
    ARRAY[p_user_id::text],
    to_jsonb(p_order)
  )
  WHERE id = p_payment_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Grant permissions
GRANT EXECUTE ON FUNCTION get_user_categories TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_payment_methods TO authenticated;
GRANT EXECUTE ON FUNCTION opt_in_category TO authenticated;
GRANT EXECUTE ON FUNCTION hide_category TO authenticated;
GRANT EXECUTE ON FUNCTION show_category TO authenticated;
GRANT EXECUTE ON FUNCTION set_category_order TO authenticated;
GRANT EXECUTE ON FUNCTION opt_in_payment_method TO authenticated;
GRANT EXECUTE ON FUNCTION hide_payment_method TO authenticated;
GRANT EXECUTE ON FUNCTION show_payment_method TO authenticated;
GRANT EXECUTE ON FUNCTION set_payment_method_order TO authenticated;

-- Step 13: Initialize existing categories as shared (empty opted_in_users array)
UPDATE categories 
SET opted_in_users = '{}', hidden_for_users = '{}', user_orders = '{}'
WHERE opted_in_users IS NULL;

UPDATE payment_methods 
SET opted_in_users = '{}', hidden_for_users = '{}', user_orders = '{}'
WHERE opted_in_users IS NULL;

-- Verification
SELECT 'Setup complete!' as message;
SELECT 'Categories:' as info, COUNT(*) as count FROM categories;
SELECT 'Payment Methods:' as info, COUNT(*) as count FROM payment_methods;
