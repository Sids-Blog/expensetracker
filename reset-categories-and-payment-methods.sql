-- Reset categories and payment methods with basic defaults

-- Step 1: Delete all existing records
DELETE FROM categories;
DELETE FROM payment_methods;

-- Step 2: Insert expense categories (Food, Travel)
INSERT INTO categories (name, type, "order", opted_in_users, hidden_for_users, user_orders)
VALUES 
  ('Food', 'expense', 1, ARRAY[]::UUID[], ARRAY[]::UUID[], '{}'::JSONB),
  ('Travel', 'expense', 2, ARRAY[]::UUID[], ARRAY[]::UUID[], '{}'::JSONB);

-- Step 3: Insert income categories (Salary, Cashback)
INSERT INTO categories (name, type, "order", opted_in_users, hidden_for_users, user_orders)
VALUES 
  ('Salary', 'income', 1, ARRAY[]::UUID[], ARRAY[]::UUID[], '{}'::JSONB),
  ('Cashback', 'income', 2, ARRAY[]::UUID[], ARRAY[]::UUID[], '{}'::JSONB);

-- Step 4: Insert payment methods (Card, Cash)
INSERT INTO payment_methods (name, "order", opted_in_users, hidden_for_users, user_orders)
VALUES 
  ('Card', 1, ARRAY[]::UUID[], ARRAY[]::UUID[], '{}'::JSONB),
  ('Cash', 2, ARRAY[]::UUID[], ARRAY[]::UUID[], '{}'::JSONB);

-- Verify the results
SELECT 'Categories:' as table_name, name, type, "order" FROM categories
UNION ALL
SELECT 'Payment Methods:', name, NULL, "order" FROM payment_methods
ORDER BY table_name, "order";
