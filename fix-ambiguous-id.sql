-- Fix ambiguous 'id' column reference in create_or_opt_in_category function

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
    WHERE categories.id = v_category_id;
    
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

  -- Return the category info with explicit table prefix
  RETURN QUERY
  SELECT 
    categories.id,
    categories.name,
    categories.type,
    categories."order",
    v_is_new
  FROM categories
  WHERE categories.id = v_category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix create_or_opt_in_payment_method if it has the same issue
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
  v_payment_method_id UUID;
  v_is_new BOOLEAN;
BEGIN
  -- Check if payment method with this name already exists
  SELECT pm.id INTO v_payment_method_id
  FROM payment_methods pm
  WHERE LOWER(TRIM(pm.name)) = LOWER(TRIM(p_name))
  LIMIT 1;

  IF v_payment_method_id IS NOT NULL THEN
    -- Payment method exists, opt-in the user if not already opted in
    UPDATE payment_methods
    SET opted_in_users = CASE 
      WHEN p_user_id = ANY(opted_in_users) THEN opted_in_users
      ELSE array_append(opted_in_users, p_user_id)
    END
    WHERE payment_methods.id = v_payment_method_id;
    
    v_is_new := FALSE;
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
    RETURNING payment_methods.id INTO v_payment_method_id;
    
    v_is_new := TRUE;
  END IF;

  -- Return the payment method info with explicit table prefix
  RETURN QUERY
  SELECT 
    payment_methods.id,
    payment_methods.name,
    payment_methods."order",
    v_is_new
  FROM payment_methods
  WHERE payment_methods.id = v_payment_method_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
