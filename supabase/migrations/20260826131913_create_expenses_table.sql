/*
# Create expenses table (multi-user, owner-scoped)

1. New Tables
- `expenses`
  - `id` (uuid, primary key, defaults to gen_random_uuid())
  - `user_id` (uuid, not null, defaults to the authenticated user, references auth.users with cascade delete)
  - `title` (text, not null) — short description of the expense
  - `amount` (numeric, not null) — monetary value of the expense
  - `category` (text, not null) — one of: Food, Travel, Shopping, Bills, Health, Entertainment, Education, Other
  - `note` (text, nullable) — optional longer description
  - `date` (date, not null) — the date the expense occurred
  - `created_at` (timestamptz, defaults to now()) — record creation timestamp
2. Indexes
  - Index on `user_id` for fast per-user queries.
  - Index on `date` descending for recent-expense queries.
3. Constraints
  - CHECK constraint on `category` restricting to the allowed set.
  - CHECK constraint that `amount` is non-negative.
4. Security
  - Enable RLS on `expenses`.
  - Owner-scoped CRUD: each authenticated user can only SELECT/INSERT/UPDATE/DELETE their own rows (user_id = auth.uid()).
*/

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  category text NOT NULL CHECK (category IN ('Food','Travel','Shopping','Bills','Health','Entertainment','Education','Other')),
  note text,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON expenses(user_id);
CREATE INDEX IF NOT EXISTS expenses_user_date_idx ON expenses(user_id, date DESC);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_expenses" ON expenses;
CREATE POLICY "select_own_expenses" ON expenses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_expenses" ON expenses;
CREATE POLICY "insert_own_expenses" ON expenses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_expenses" ON expenses;
CREATE POLICY "update_own_expenses" ON expenses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_expenses" ON expenses;
CREATE POLICY "delete_own_expenses" ON expenses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
