-- Personal Finance Tracker - Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- Updated schema without authentication and budget modules

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('expense', 'income')) NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, type)
);

-- Payment Methods Table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
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

-- Enable Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no authentication required)
-- Note: In production, you should implement proper authentication and user-specific policies
CREATE POLICY "Allow all operations on transactions" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations on categories" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all operations on payment_methods" ON payment_methods FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_transactions_currency ON transactions(currency);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_order ON categories("order");
CREATE INDEX IF NOT EXISTS idx_payment_methods_order ON payment_methods("order");

-- Create a view for transaction statistics (optional, for analytics)
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

-- Create a view for monthly summaries (optional, for dashboard)
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

-- Create a function to clean up old data (optional)
CREATE OR REPLACE FUNCTION cleanup_old_transactions(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM transactions 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT ALL ON transactions TO authenticated;
-- GRANT ALL ON categories TO authenticated;
-- GRANT ALL ON payment_methods TO authenticated;
-- GRANT SELECT ON transaction_stats TO authenticated;
-- GRANT SELECT ON monthly_summary TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_category_stats TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE transactions IS 'Stores all financial transactions (income and expenses)';
COMMENT ON TABLE categories IS 'Stores transaction categories for both income and expenses';
COMMENT ON TABLE payment_methods IS 'Stores available payment methods';
COMMENT ON VIEW transaction_stats IS 'Aggregated transaction statistics by month, type, and category';
COMMENT ON VIEW monthly_summary IS 'Monthly financial summary with income, expenses, and net amounts';
COMMENT ON FUNCTION get_category_stats IS 'Returns category statistics with optional date and type filtering';

COMMENT ON COLUMN transactions.fully_settled IS 'Indicates if the transaction is fully settled (true) or needs recovery (false)';
COMMENT ON COLUMN transactions.currency IS 'Currency code (USD, EUR, GBP, etc.)';
COMMENT ON COLUMN transactions.description IS 'Optional description or notes for the transaction';
COMMENT ON COLUMN transactions.payment_method IS 'Payment method used for the transaction';
COMMENT ON COLUMN categories."order" IS 'Display order for categories';
COMMENT ON COLUMN payment_methods."order" IS 'Display order for payment methods';