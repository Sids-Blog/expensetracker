-- Fix and Implement Opt-In System
-- Run this in Supabase SQL Editor

-- Step 1: Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_user_categories(UUID, TEXT);
DROP FUNCTION IF EXISTS get_user_payment_methods(UUID);
DROP FUNCTION IF EXISTS create_or_opt_in_category(UUID, TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS create_or_opt_in_payment_method(UUID, TEXT, INTEGER);

-- Step 2: Recreate get_user_categories to only show opted-in items
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
    true as is_visible,
    true as is_custom
  FROM categories c
  WHERE 
    (p_type IS NULL OR c.type = p_type)
    AND (
      p_user_id = ANY(c.opted_in_users)  -- User opted in
      OR cardinality(c.opted_in_users) = 0  -- Or it's a default (empty array)
    )
    AND NOT (p_user_id = ANY(c.hidden_for_users))
  ORDER BY display_order, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate get_user_payment_methods
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
    true as is_visible,
    true as is_custom
  FROM payment_methods pm
  WHERE 
    (
      p_user_id = ANY(pm.opted_in_users)  -- User opted in
      OR cardinality(pm.opted_in_users) = 0  -- Or it's a default (empty array)
    )
    AND NOT (p_user_id = ANY(pm.hidden_for_users))
  ORDER BY display_order, pm.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create function to create or opt-in to category
CREATE OR REPLACE FUNCTION create_or_opt_in_category(
  p_user_id UUID,
  p_name TEXT,
  p_type TEXT,
  p_order INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  "order" INTEGER,
  is_new BOOLEAN
) AS $$
DECLARE
  v_category_id UUID;
  v_is_new BOOLEAN;
  v_existing_count INTEGER;
BEGIN
  -- Check if category with this name and type already exists
  SELECT c.id, 1 INTO v_category_id, v_existing_count
  FROM categories c
  WHERE LOWER(TRIM(c.name)) = LOWER(TRIM(p_name)) 
    AND c.type = p_type
  LIMIT 1;

  IF v_category_id IS NOT NULL THEN
    -- Category exists, opt-in the user if not already opted in
    UPDATE categories
    SET opted_in_users = CASE 
      WHEN p_user_id = ANY(opted_in_users) THEN opted_in_users
      ELSE array_append(opted_in_users, p_user_id)
    END
    WHERE id = v_category_id;
    
    v_is_new := FALSE;
    
    RAISE NOTICE 'User % opted into existing category %', p_user_id, v_category_id;
  ELSE
    -- Category doesn't exist, create it
    INSERT INTO categories (name, type, "order", opted_in_users, hidden_for_users, user_orders)
    VALUES (
      TRIM(p_name), 
      p_type, 
      p_order, 
      ARRAY[p_user_id], 
      ARRAY[]::UUID[], 
      '{}'::JSONB
    )
    RETURNING categories.id INTO v_category_id;
    
    v_is_new := TRUE;
    
    RAISE NOTICE 'Created new category % for user %', v_category_id, p_user_id;
  END IF;

  -- Return the category info
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.type,
    c."order",
    v_is_new
  FROM categories c
  WHERE c.id = v_category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create function to create or opt-in to payment method
CREATE OR REPLACE FUNCTION create_or_opt_in_payment_method(
  p_user_id UUID,
  p_name TEXT,
  p_order INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  "order" INTEGER,
  is_new BOOLEAN
) AS $$
DECLARE
  v_payment_id UUID;
  v_is_new BOOLEAN;
BEGIN
  -- Check if payment method with this name already exists
  SELECT pm.id INTO v_payment_id
  FROM payment_methods pm
  WHERE LOWER(TRIM(pm.name)) = LOWER(TRIM(p_name))
  LIMIT 1;

  IF v_payment_id IS NOT NULL THEN
    -- Payment method exists, opt-in the user if not already opted in
    UPDATE payment_methods
    SET opted_in_users = CASE 
      WHEN p_user_id = ANY(opted_in_users) THEN opted_in_users
      ELSE array_append(opted_in_users, p_user_id)
    END
    WHERE id = v_payment_id;
    
    v_is_new := FALSE;
    
    RAISE NOTICE 'User % opted into existing payment method %', p_user_id, v_payment_id;
  ELSE
    -- Payment method doesn't exist, create it
    INSERT INTO payment_methods (name, "order", opted_in_users, hidden_for_users, user_orders)
    VALUES (
      TRIM(p_name), 
      p_order, 
      ARRAY[p_user_id], 
      ARRAY[]::UUID[], 
      '{}'::JSONB
    )
    RETURNING payment_methods.id INTO v_payment_id;
    
    v_is_new := TRUE;
    
    RAISE NOTICE 'Created new payment method % for user %', v_payment_id, p_user_id;
  END IF;

  -- Return the payment method info
  RETURN QUERY
  SELECT 
    pm.id,
    pm.name,
    pm."order",
    v_is_new
  FROM payment_methods pm
  WHERE pm.id = v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION get_user_categories TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_payment_methods TO authenticated;
GRANT EXECUTE ON FUNCTION create_or_opt_in_category TO authenticated;
GRANT EXECUTE ON FUNCTION create_or_opt_in_payment_method TO authenticated;

-- Step 7: Test the functions
DO $$
DECLARE
  test_user_id UUID;
  test_result RECORD;
BEGIN
  -- Get a test user (first user in the system)
  SELECT id INTO test_user_id FROM user_profiles LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing with user: %', test_user_id;
    
    -- Test creating a category
    SELECT * INTO test_result FROM create_or_opt_in_category(
      test_user_id,
      'Test Category',
      'expense',
      0
    );
    
    RAISE NOTICE 'Test category created: % (is_new: %)', test_result.name, test_result.is_new;
    
    -- Test getting categories
    RAISE NOTICE 'User categories count: %', (
      SELECT COUNT(*) FROM get_user_categories(test_user_id, NULL)
    );
  ELSE
    RAISE NOTICE 'No users found for testing';
  END IF;
END $$;

-- Verification
SELECT 'Opt-in system fixed and ready!' as status;
SELECT 'Functions created:' as info;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN (
  'get_user_categories',
  'get_user_payment_methods', 
  'create_or_opt_in_category',
  'create_or_opt_in_payment_method'
)
AND routine_schema = 'public';
