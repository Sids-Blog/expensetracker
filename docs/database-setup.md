# Database Setup Guide

This guide will help you set up the Supabase database for the Personal Finance Tracker application.

## Prerequisites

- A Supabase account (free tier is sufficient)
- Access to the Supabase SQL Editor

## Setup Options

### Option 1: New Installation (Recommended)

If you're setting up the application for the first time:

1. **Create a new Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the project to be ready

2. **Run the schema**
   - Open the SQL Editor in your Supabase dashboard
   - Copy the contents of `supabase-schema.sql`
   - Paste and execute the SQL

3. **Verify the setup**
   - Check that the following tables were created:
     - `transactions`
     - `categories` 
     - `payment_methods`
   - Verify that default data was inserted

### Option 2: Migration from Existing Database

If you have an existing database with authentication/budget modules:

⚠️ **Important: Backup your data first!**

1. **Backup existing data**
   ```sql
   -- Export your existing transactions (if any)
   SELECT * FROM transactions;
   
   -- Export your existing categories (if any)
   SELECT * FROM categories;
   ```

2. **Run the migration**
   - Open the SQL Editor in your Supabase dashboard
   - Copy the contents of `supabase-migration.sql`
   - Paste and execute the SQL

3. **Verify the migration**
   - Check that old tables (`auth_sessions`, `categoriesbudget`, etc.) were removed
   - Verify that the new schema is in place
   - Check if any data migration is needed

## Database Schema Overview

### Tables

#### transactions
Stores all financial transactions (income and expenses).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| date | DATE | Transaction date |
| type | TEXT | 'expense' or 'income' |
| amount | DECIMAL(10,2) | Transaction amount |
| currency | TEXT | Currency code (USD, EUR, etc.) |
| category | TEXT | Transaction category |
| description | TEXT | Optional description |
| payment_method | TEXT | Payment method used |
| fully_settled | BOOLEAN | Settlement status |
| created_at | TIMESTAMP | Creation timestamp |

#### categories
Stores transaction categories for both income and expenses.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Category name |
| type | TEXT | 'expense' or 'income' |
| order | INTEGER | Display order |
| created_at | TIMESTAMP | Creation timestamp |

#### payment_methods
Stores available payment methods.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Payment method name |
| order | INTEGER | Display order |
| created_at | TIMESTAMP | Creation timestamp |

### Views

#### transaction_stats
Aggregated transaction statistics by month, type, and category.

#### monthly_summary
Monthly financial summary with income, expenses, and net amounts.

### Functions

#### get_category_stats()
Returns category statistics with optional filtering.

```sql
-- Get expense category stats for 2024
SELECT * FROM get_category_stats('2024-01-01', '2024-12-31', 'expense');
```

## Default Data

The schema includes default categories and payment methods:

### Default Expense Categories
- Food & Dining
- Transportation
- Shopping
- Entertainment
- Bills & Utilities
- Healthcare
- Education
- Travel
- Groceries
- Gas & Fuel
- Insurance
- Personal Care
- Home & Garden
- Gifts & Donations
- Other Expenses

### Default Income Categories
- Salary
- Freelance
- Business Income
- Investment Returns
- Rental Income
- Dividends
- Interest
- Bonus
- Commission
- Refunds
- Gifts Received
- Other Income

### Default Payment Methods
- Cash
- Credit Card
- Debit Card
- Bank Transfer
- UPI
- Digital Wallet
- PayPal
- Cheque
- Mobile Payment
- Cryptocurrency
- Other

## Security Configuration

The schema includes Row Level Security (RLS) policies that allow public access. **For production use, you should implement proper authentication and user-specific policies.**

### Current Policies (Development)
```sql
-- Allow all operations (not recommended for production)
CREATE POLICY "Allow all operations on transactions" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations on categories" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all operations on payment_methods" ON payment_methods FOR ALL USING (true);
```

### Production Security Recommendations

1. **Implement Authentication**
   - Use Supabase Auth or your preferred authentication system
   - Create user-specific policies

2. **Update RLS Policies**
   ```sql
   -- Example: User-specific transactions
   CREATE POLICY "Users can manage own transactions" ON transactions 
   FOR ALL USING (auth.uid() = user_id);
   ```

3. **Add User Columns**
   ```sql
   -- Add user_id to transactions table
   ALTER TABLE transactions ADD COLUMN user_id UUID REFERENCES auth.users(id);
   ```

## Performance Optimization

The schema includes several indexes for optimal performance:

- `idx_transactions_date` - For date-based queries
- `idx_transactions_type` - For filtering by transaction type
- `idx_transactions_category` - For category-based queries
- `idx_transactions_payment_method` - For payment method queries
- `idx_transactions_currency` - For currency-based queries
- `idx_categories_type` - For category type filtering
- `idx_categories_order` - For ordered category retrieval

## Maintenance

### Regular Cleanup (Optional)

The schema includes a cleanup function for old transactions:

```sql
-- Delete transactions older than 2 years
SELECT cleanup_old_transactions(730);
```

### Backup Recommendations

1. **Regular Backups**
   - Use Supabase's backup features
   - Export data regularly for local backups

2. **Before Major Changes**
   - Always backup before schema changes
   - Test migrations on a copy first

## Troubleshooting

### Common Issues

1. **Permission Errors**
   - Check RLS policies
   - Verify user authentication

2. **Missing Tables**
   - Re-run the schema script
   - Check for SQL execution errors

3. **Data Migration Issues**
   - Check the `transactions_backup` table (created during migration)
   - Manually migrate data if needed

4. **Performance Issues**
   - Check if indexes are created
   - Analyze query performance

### Getting Help

If you encounter issues:

1. Check the Supabase logs in your dashboard
2. Verify the schema matches the expected structure
3. Test with a simple query: `SELECT COUNT(*) FROM transactions;`
4. Check the application logs for database connection errors

## Environment Variables

Make sure your `.env` file has the correct Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings under "API".