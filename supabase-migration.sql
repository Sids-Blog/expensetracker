-- Migration Script: Remove Authentication and Budget Modules
-- Run this AFTER backing up your data if you have an existing database
-- This script will remove authentication and budget-related tables and update the schema

-- WARNING: This will delete authentication and budget data permanently
-- Make sure to backup your data before running this migration

-- Step 1: Drop authentication-related tables
DROP TABLE IF EXISTS auth_sessions CASCADE;

-- Step 2: Drop budget-related tables
DROP TABLE IF EXISTS categoriesbudget CASCADE;
DROP TABLE IF EXISTS transactionsbudget CASCADE;

-- Step 3: Drop old tags table if it exists
DROP TABLE IF EXISTS tags CASCADE;

-- Step 4: Update transactions table structure
-- First, check if the transactions table exists and has the old structure
DO $$
BEGIN
  -- Check if transactions table exists with old structure
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'month'
  ) THEN
    -- Old structure exists, need to migrate
    
    -- Create backup of existing transactions
    CREATE TABLE transactions_backup AS SELECT * FROM transactions;
    
    -- Drop the old transactions table
    DROP TABLE transactions CASCADE;
    
    -- Create new transactions table with correct structure
    CREATE TABLE transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE NOT NULL,
      type TEXT CHECK (type IN ('expense', 'income')) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      category TEXT NOT NULL,
      description TEXT,
      payment_method TEXT,
      fully_settled BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Note: Manual data migration may be needed from transactions_backup
    -- The old structure was different, so automatic migration is not possible
    RAISE NOTICE 'Old transactions table backed up as transactions_backup. Manual data migration may be required.';
    
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'transactions'
  ) THEN
    -- No transactions table exists, create new one
    CREATE TABLE transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE NOT NULL,
      type TEXT CHECK (type IN ('expense', 'income')) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      category TEXT NOT NULL,
      description TEXT,
      payment_method TEXT,
      fully_settled BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
  ELSE
    -- Transactions table exists with correct structure, check for missing columns
    
    -- Add currency column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'transactions' AND column_name = 'currency'
    ) THEN
      ALTER TABLE transactions ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';
    END IF;
    
    -- Add description column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'transactions' AND column_name = 'description'
    ) THEN
      ALTER TABLE transactions ADD COLUMN description TEXT;
    END IF;
    
    -- Add payment_method column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'transactions' AND column_name = 'payment_method'
    ) THEN
      ALTER TABLE transactions ADD COLUMN payment_method TEXT;
    END IF;
    
    -- Add fully_settled column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'transactions' AND column_name = 'fully_settled'
    ) THEN
      ALTER TABLE transactions ADD COLUMN fully_settled BOOLEAN DEFAULT true;
    END IF;
    
    -- Update type constraint if needed
    ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
    ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
      CHECK (type IN ('expense', 'income'));
      
  END IF;
END $$;

-- Step 5: Update categories table structure
DO $$
BEGIN
  -- Check if categories table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'categories'
  ) THEN
    -- Add order column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'order'
    ) THEN
      ALTER TABLE categories ADD COLUMN "order" INTEGER DEFAULT 0;
    END IF;
    
    -- Remove tag_id column if it exists (from old structure)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'tag_id'
    ) THEN
      ALTER TABLE categories DROP COLUMN tag_id CASCADE;
    END IF;
    
    -- Remove default_value column if it exists (from old structure)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'default_value'
    ) THEN
      ALTER TABLE categories DROP COLUMN default_value CASCADE;
    END IF;
    
    -- Add unique constraint if it doesn't exist
    ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_type_key;
    ALTER TABLE categories ADD CONSTRAINT categories_name_type_key UNIQUE (name, type);
    
  ELSE
    -- Create categories table
    CREATE TABLE categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      type TEXT CHECK (type IN ('expense', 'income')) NOT NULL,
      "order" INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(name, type)
    );
  END IF;
END $$;

-- Step 6: Update payment_methods table structure
DO $$
BEGIN
  -- Check if payment_methods table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'payment_methods'
  ) THEN
    -- Add order column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'payment_methods' AND column_name = 'order'
    ) THEN
      ALTER TABLE payment_methods ADD COLUMN "order" INTEGER DEFAULT 0;
    END IF;
    
  ELSE
    -- Create payment_methods table
    CREATE TABLE payment_methods (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL UNIQUE,
      "order" INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Step 7: Update RLS policies
-- Drop old policies
DROP POLICY IF EXISTS "Allow all operations" ON transactions;
DROP POLICY IF EXISTS "Allow all operations" ON categories;
DROP POLICY IF EXISTS "Allow all operations" ON payment_methods;

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Allow all operations on transactions" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations on categories" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all operations on payment_methods" ON payment_methods FOR ALL USING (true);

-- Step 8: Recreate indexes
DROP INDEX IF EXISTS idx_transactions_date;
DROP INDEX IF EXISTS idx_transactions_type;
DROP INDEX IF EXISTS idx_transactions_category;
DROP INDEX IF EXISTS idx_transactions_payment_method;
DROP INDEX IF EXISTS idx_transactions_currency;
DROP INDEX IF EXISTS idx_transactions_created_at;
DROP INDEX IF EXISTS idx_categories_type;
DROP INDEX IF EXISTS idx_categories_order;
DROP INDEX IF EXISTS idx_payment_methods_order;
DROP INDEX IF EXISTS idx_auth_sessions_token;
DROP INDEX IF EXISTS idx_auth_sessions_expires;

-- Create new indexes
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_payment_method ON transactions(payment_method);
CREATE INDEX idx_transactions_currency ON transactions(currency);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_order ON categories("order");
CREATE INDEX idx_payment_methods_order ON payment_methods("order");

-- Step 9: Insert default data if tables are empty
-- Insert default expense categories
INSERT INTO categories (name, type, "order") VALUES
  ('Food & Dining', 'expense', 0),
  ('Transportation', 'expense', 1),
  ('Shopping', 'expense', 2),
  ('Entertainment', 'expense', 3),
  ('Bills & Utilities', 'expense', 4),
  ('Healthcare', 'expense', 5),
  ('Education', 'expense', 6),
  ('Travel', 'expense', 7),
  ('Groceries', 'expense', 8),
  ('Gas & Fuel', 'expense', 9),
  ('Insurance', 'expense', 10),
  ('Personal Care', 'expense', 11),
  ('Home & Garden', 'expense', 12),
  ('Gifts & Donations', 'expense', 13),
  ('Other Expenses', 'expense', 14)
ON CONFLICT (name, type) DO NOTHING;

-- Insert default income categories
INSERT INTO categories (name, type, "order") VALUES
  ('Salary', 'income', 0),
  ('Freelance', 'income', 1),
  ('Business Income', 'income', 2),
  ('Investment Returns', 'income', 3),
  ('Rental Income', 'income', 4),
  ('Dividends', 'income', 5),
  ('Interest', 'income', 6),
  ('Bonus', 'income', 7),
  ('Commission', 'income', 8),
  ('Refunds', 'income', 9),
  ('Gifts Received', 'income', 10),
  ('Other Income', 'income', 11)
ON CONFLICT (name, type) DO NOTHING;

-- Insert default payment methods
INSERT INTO payment_methods (name, "order") VALUES
  ('Cash', 0),
  ('Credit Card', 1),
  ('Debit Card', 2),
  ('Bank Transfer', 3),
  ('UPI', 4),
  ('Digital Wallet', 5),
  ('PayPal', 6),
  ('Cheque', 7),
  ('Mobile Payment', 8),
  ('Cryptocurrency', 9),
  ('Other', 10)
ON CONFLICT (name) DO NOTHING;

-- Step 10: Update order values for existing data
-- Set order for existing categories
DO $$
DECLARE
  r RECORD;
  i INTEGER;
BEGIN
  -- Update expense categories order
  i := 0;
  FOR r IN SELECT id FROM categories WHERE type = 'expense' ORDER BY name LOOP
    UPDATE categories SET "order" = i WHERE id = r.id;
    i := i + 1;
  END LOOP;
  
  -- Update income categories order
  i := 0;
  FOR r IN SELECT id FROM categories WHERE type = 'income' ORDER BY name LOOP
    UPDATE categories SET "order" = i WHERE id = r.id;
    i := i + 1;
  END LOOP;
END $$;

-- Set order for existing payment methods
DO $$
DECLARE
  r RECORD;
  i INTEGER;
BEGIN
  i := 0;
  FOR r IN SELECT id FROM payment_methods ORDER BY name LOOP
    UPDATE payment_methods SET "order" = i WHERE id = r.id;
    i := i + 1;
  END LOOP;
END $$;

-- Step 11: Create views and functions (from the main schema)
-- Create a view for transaction statistics
CREATE OR REPLACE VIEW transaction_stats AS
SELECT 
  DATE_TRUNC('month', date) as month,
  type,
  currency,
  category,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount,
  MIN(amount) as min_amount,
  MAX(amount) as max_amount
FROM transactions 
GROUP BY DATE_TRUNC('month', date), type, currency, category
ORDER BY month DESC, type, category;

-- Create a view for monthly summaries
CREATE OR REPLACE VIEW monthly_summary AS
SELECT 
  DATE_TRUNC('month', date) as month,
  currency,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net_amount,
  COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
  COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count,
  COUNT(*) as total_transactions
FROM transactions 
GROUP BY DATE_TRUNC('month', date), currency
ORDER BY month DESC, currency;

-- Create a function to get category statistics
CREATE OR REPLACE FUNCTION get_category_stats(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  transaction_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  category TEXT,
  transaction_count BIGINT,
  total_amount NUMERIC,
  avg_amount NUMERIC,
  percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH filtered_transactions AS (
    SELECT t.category, t.amount
    FROM transactions t
    WHERE (start_date IS NULL OR t.date >= start_date)
      AND (end_date IS NULL OR t.date <= end_date)
      AND (transaction_type IS NULL OR t.type = transaction_type)
  ),
  category_totals AS (
    SELECT 
      ft.category,
      COUNT(*) as transaction_count,
      SUM(ft.amount) as total_amount,
      AVG(ft.amount) as avg_amount
    FROM filtered_transactions ft
    GROUP BY ft.category
  ),
  grand_total AS (
    SELECT SUM(amount) as total FROM filtered_transactions
  )
  SELECT 
    ct.category,
    ct.transaction_count,
    ct.total_amount,
    ct.avg_amount,
    CASE 
      WHEN gt.total > 0 THEN ROUND((ct.total_amount / gt.total * 100), 2)
      ELSE 0
    END as percentage
  FROM category_totals ct
  CROSS JOIN grand_total gt
  ORDER BY ct.total_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- Migration completed
SELECT 'Migration completed successfully! Authentication and budget modules have been removed.' as status;