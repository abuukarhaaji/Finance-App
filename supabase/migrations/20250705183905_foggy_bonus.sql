/*
  # Personal Finance Tracker Database Schema

  1. New Tables
    - `transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `item_name` (text, required)
      - `description` (text, optional)
      - `quantity` (integer, min: 1)
      - `unit_cost` (decimal, currency)
      - `total_cost` (decimal, computed)
      - `category` (text, from predefined list)
      - `type` (text, 'expense' or 'deposit')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `user_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `monthly_budget` (decimal, default 0)
      - `budget_notifications` (boolean, default true)
      - `dark_mode` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access only their own data
    - Create RPC functions for secure transaction validation

  3. Functions
    - `get_user_balance()` - Calculate current balance
    - `validate_transaction()` - Server-side validation
    - `get_spending_summary()` - Monthly spending analytics
*/

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_name text NOT NULL,
  description text DEFAULT '',
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_cost decimal(10,2) NOT NULL CHECK (unit_cost >= 0),
  total_cost decimal(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  category text NOT NULL DEFAULT 'other',
  type text NOT NULL DEFAULT 'expense' CHECK (type IN ('expense', 'deposit')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  monthly_budget decimal(10,2) DEFAULT 1000.00,
  budget_notifications boolean DEFAULT true,
  dark_mode boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for transactions
CREATE POLICY "Users can view own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for user_settings
CREATE POLICY "Users can view own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to get user balance
CREATE OR REPLACE FUNCTION get_user_balance(user_uuid uuid)
RETURNS decimal(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  balance decimal(10,2);
BEGIN
  SELECT COALESCE(
    SUM(CASE WHEN type = 'deposit' THEN total_cost ELSE -total_cost END),
    0
  ) INTO balance
  FROM transactions
  WHERE user_id = user_uuid;
  
  RETURN balance;
END;
$$;

-- Create function to validate transactions
CREATE OR REPLACE FUNCTION validate_transaction(
  user_uuid uuid,
  transaction_cost decimal(10,2)
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance decimal(10,2);
BEGIN
  SELECT get_user_balance(user_uuid) INTO current_balance;
  
  RETURN current_balance >= transaction_cost;
END;
$$;

-- Create function to get spending summary
CREATE OR REPLACE FUNCTION get_spending_summary(
  user_uuid uuid,
  start_date timestamptz DEFAULT date_trunc('month', now()),
  end_date timestamptz DEFAULT now()
)
RETURNS TABLE(
  total_spent decimal(10,2),
  total_deposits decimal(10,2),
  transaction_count bigint,
  avg_transaction decimal(10,2),
  categories jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN type = 'expense' THEN total_cost ELSE 0 END), 0) as total_spent,
    COALESCE(SUM(CASE WHEN type = 'deposit' THEN total_cost ELSE 0 END), 0) as total_deposits,
    COUNT(*) as transaction_count,
    COALESCE(AVG(CASE WHEN type = 'expense' THEN total_cost ELSE NULL END), 0) as avg_transaction,
    jsonb_object_agg(
      category,
      jsonb_build_object(
        'count', COUNT(*),
        'total', SUM(total_cost)
      )
    ) FILTER (WHERE type = 'expense') as categories
  FROM transactions
  WHERE user_id = user_uuid
    AND created_at >= start_date
    AND created_at <= end_date;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);