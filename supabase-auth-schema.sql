-- Authentication and User Management Schema
-- Run this AFTER the main schema (supabase-schema.sql)

-- User Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  is_active BOOLEAN DEFAULT true,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  deactivated_at TIMESTAMP WITH TIME ZONE,
  deactivated_by UUID REFERENCES auth.users(id)
);

-- Update transactions table to include user_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE transactions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update categories table to include user_id (for custom categories)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE categories ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'is_default'
    ) THEN
        ALTER TABLE categories ADD COLUMN is_default BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Update payment_methods table to include user_id (for custom payment methods)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_methods' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE payment_methods ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_methods' AND column_name = 'is_default'
    ) THEN
        ALTER TABLE payment_methods ADD COLUMN is_default BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Mark existing categories and payment methods as default (shared across all users)
UPDATE categories SET is_default = true WHERE user_id IS NULL AND (is_default IS NULL OR is_default = false);
UPDATE payment_methods SET is_default = true WHERE user_id IS NULL AND (is_default IS NULL OR is_default = false);

-- Create indexes for user-related queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on transactions
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'transactions') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON transactions';
    END LOOP;
    
    -- Drop all policies on categories
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'categories') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON categories';
    END LOOP;
    
    -- Drop all policies on payment_methods
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'payment_methods') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON payment_methods';
    END LOOP;
END $$;

-- Create user-specific RLS policies for transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Create user-specific RLS policies for categories
CREATE POLICY "Users can view default and own categories" ON categories
  FOR SELECT USING (is_default = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id AND is_default = false);

-- Create user-specific RLS policies for payment_methods
CREATE POLICY "Users can view default and own payment methods" ON payment_methods
  FOR SELECT USING (is_default = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert own payment methods" ON payment_methods
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can update own payment methods" ON payment_methods
  FOR UPDATE USING (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete own payment methods" ON payment_methods
  FOR DELETE USING (auth.uid() = user_id AND is_default = false);

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update all profiles" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user's last login time
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_profiles
  SET last_login_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last login on auth
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW 
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION public.update_last_login();

-- Function to check if user is active (for use in policies)
CREATE OR REPLACE FUNCTION public.is_user_active(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = user_id AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deactivate user (admin only)
CREATE OR REPLACE FUNCTION public.deactivate_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check if current user is admin
  SELECT user_profiles.is_admin INTO is_admin
  FROM user_profiles
  WHERE id = auth.uid();
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admins can deactivate users';
  END IF;
  
  -- Deactivate the user
  UPDATE user_profiles
  SET 
    is_active = false,
    deactivated_at = NOW(),
    deactivated_by = auth.uid()
  WHERE id = target_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to activate user (admin only)
CREATE OR REPLACE FUNCTION public.activate_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check if current user is admin
  SELECT user_profiles.is_admin INTO is_admin
  FROM user_profiles
  WHERE id = auth.uid();
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admins can activate users';
  END IF;
  
  -- Activate the user
  UPDATE user_profiles
  SET 
    is_active = true,
    deactivated_at = NULL,
    deactivated_by = NULL
  WHERE id = target_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update views to be user-specific
DROP VIEW IF EXISTS transaction_stats CASCADE;
CREATE OR REPLACE VIEW transaction_stats AS
SELECT 
  user_id,
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
GROUP BY user_id, DATE_TRUNC('month', date), type, currency, category
ORDER BY month DESC, type, category;

DROP VIEW IF EXISTS monthly_summary CASCADE;
CREATE OR REPLACE VIEW monthly_summary AS
SELECT 
  user_id,
  DATE_TRUNC('month', date) as month,
  currency,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net_amount,
  COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
  COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count,
  COUNT(*) as total_transactions
FROM transactions 
GROUP BY user_id, DATE_TRUNC('month', date), currency
ORDER BY month DESC, currency;

-- Create admin user view (only accessible by admins)
CREATE OR REPLACE VIEW admin_user_list AS
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.is_active,
  up.is_admin,
  up.created_at,
  up.last_login_at,
  up.deactivated_at,
  up.deactivated_by,
  deactivator.email as deactivated_by_email,
  COUNT(DISTINCT t.id) as transaction_count,
  COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expenses,
  COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income
FROM user_profiles up
LEFT JOIN transactions t ON t.user_id = up.id
LEFT JOIN user_profiles deactivator ON deactivator.id = up.deactivated_by
GROUP BY up.id, up.email, up.full_name, up.is_active, up.is_admin, 
         up.created_at, up.last_login_at, up.deactivated_at, 
         up.deactivated_by, deactivator.email;

-- Grant permissions
GRANT SELECT ON admin_user_list TO authenticated;

-- Comments
COMMENT ON TABLE user_profiles IS 'Extended user profile information';
COMMENT ON COLUMN user_profiles.is_active IS 'Whether the user account is active';
COMMENT ON COLUMN user_profiles.is_admin IS 'Whether the user has admin privileges';
COMMENT ON COLUMN transactions.user_id IS 'Owner of the transaction';
COMMENT ON COLUMN categories.user_id IS 'Owner of custom category (NULL for default categories)';
COMMENT ON COLUMN categories.is_default IS 'Whether this is a default category available to all users';
COMMENT ON FUNCTION deactivate_user IS 'Admin function to deactivate a user account';
COMMENT ON FUNCTION activate_user IS 'Admin function to activate a user account';