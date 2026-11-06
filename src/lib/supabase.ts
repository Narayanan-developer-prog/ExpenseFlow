import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Expense = {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: string;
  note: string | null;
  date: string;
  created_at: string;
};

export type ExpenseInsert = {
  title: string;
  amount: number;
  category: string;
  note?: string | null;
  date: string;
};

export const CATEGORIES = [
  'Food',
  'Travel',
  'Shopping',
  'Bills',
  'Health',
  'Entertainment',
  'Education',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#6c5ce7',
  Travel: '#00d4a0',
  Shopping: '#e17055',
  Bills: '#fdcb6e',
  Health: '#00b894',
  Entertainment: '#d63031',
  Education: '#0984e3',
  Other: '#636e72',
};
