-- Opt-In Categories and Payment Methods System
-- Users start with empty lists and opt-in to categories as they create them

-- Step 1: Update the get_user_categories function to only show opted-in items
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
    (cardinality(c.opted_in_users) > 0) as is_custom
  FROM categories c
  WHERE 
    (p_type IS NULL OR c.type = p_type)
    AND p_user_id = ANY(c.opted_in_users)  -- Only show if user opted in
    AND NOT (p_user_id = ANY(c.hidden_for_users))  -- Not hidden by user
  ORDER BY display_order, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Update the get_user_payment_methods function
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
    (cardinality(pm.opted_in_users) > 0) as is_custom
  FROM payment_methods pm
  WHERE 
    p_user_id = ANY(pm.opted_in_users)  -- Only show if user opted in
    AND NOT (p_user_id = ANY(pm.hidden_for_users))  -- Not hidden by user
  ORDER BY display_order, pm.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create function to opt-in or create category
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
BEGIN
  -- Check if category with this name and type already exists
  SELECT c.id INTO v_category_id
  FROM categories c
  WHERE LOWER(c.name) = LOWER(p_name) AND c.type = p_type
  LIMIT 1;

  IF v_category_id IS NOT NULL THEN
    -- Category exists, opt-in the user
    UPDATE categories
    SET opted_in_users = array_append(opted_in_users, p_user_id)
    WHERE id = v_category_id
      AND NOT (p_user_id = ANY(opted_in_users));
    
    v_is_new := FALSE;
  ELSE
    -- Category doesn't exist, create it
    INSERT INTO categories (name, type, "order", opted_in_users, hidden_for_users, user_orders)
    VALUES (p_name, p_type, p_order, ARRAY[p_user_id], ARRAY[]::UUID[], '{}'::JSONB)
    RETURNING categories.id INTO v_category_id;
    
    v_is_new := TRUE;
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

-- Step 4: Create function to opt-in or create payment method
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
  WHERE LOWER(pm.name) = LOWER(p_name)
  LIMIT 1;

  IF v_payment_id IS NOT NULL THEN
    -- Payment method exists, opt-in the user
    UPDATE payment_methods
    SET opted_in_users = array_append(opted_in_users, p_user_id)
    WHERE id = v_payment_id
      AND NOT (p_user_id = ANY(opted_in_users));
    
    v_is_new := FALSE;
  ELSE
    -- Payment method doesn't exist, create it
    INSERT INTO payment_methods (name, "order", opted_in_users, hidden_for_users, user_orders)
    VALUES (p_name, p_order, ARRAY[p_user_id], ARRAY[]::UUID[], '{}'::JSONB)
    RETURNING payment_methods.id INTO v_payment_id;
    
    v_is_new := TRUE;
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

-- Step 5: Clear all existing opted_in_users (fresh start)
-- WARNING: This will make all categories/payment methods invisible to all users
-- They will need to create/opt-in to see them again
UPDATE categories SET opted_in_users = ARRAY[]::UUID[];
UPDATE payment_methods SET opted_in_users = ARRAY[]::UUID[];

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION create_or_opt_in_category TO authenticated;
GRANT EXECUTE ON FUNCTION create_or_opt_in_payment_method TO authenticated;

-- Verification
SELECT 'Opt-in system ready!' as message;
SELECT 'All users now start with empty lists' as info;
SELECT 'Users will opt-in as they create categories/payment methods' as info;
