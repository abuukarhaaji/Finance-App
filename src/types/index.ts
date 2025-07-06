export interface Transaction {
  id: string;
  user_id: string;
  item_name: string;
  description: string | null;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  category: string;
  type: 'expense' | 'deposit';
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  monthly_budget: number;
  budget_notifications: boolean;
  dark_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpendingSummary {
  total_spent: number;
  total_deposits: number;
  transaction_count: number;
  avg_transaction: number;
  categories: Record<string, { count: number; total: number }>;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export const CATEGORIES = [
  { name: 'Food & Dining', value: 'food', color: 'bg-red-500' },
  { name: 'Transportation', value: 'transport', color: 'bg-blue-500' },
  { name: 'Shopping', value: 'shopping', color: 'bg-purple-500' },
  { name: 'Entertainment', value: 'entertainment', color: 'bg-pink-500' },
  { name: 'Bills & Utilities', value: 'bills', color: 'bg-yellow-500' },
  { name: 'Healthcare', value: 'healthcare', color: 'bg-green-500' },
  { name: 'Education', value: 'education', color: 'bg-indigo-500' },
  { name: 'Travel', value: 'travel', color: 'bg-cyan-500' },
  { name: 'Other', value: 'other', color: 'bg-gray-500' },
] as const;

export type CategoryValue = typeof CATEGORIES[number]['value'];