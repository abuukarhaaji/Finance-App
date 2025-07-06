import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Database = {
  public: {
    Tables: {
      transactions: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          item_name: string;
          description?: string | null;
          quantity: number;
          unit_cost: number;
          category: string;
          type: 'expense' | 'deposit';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_name?: string;
          description?: string | null;
          quantity?: number;
          unit_cost?: number;
          category?: string;
          type?: 'expense' | 'deposit';
          created_at?: string;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          monthly_budget: number;
          budget_notifications: boolean;
          dark_mode: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          monthly_budget?: number;
          budget_notifications?: boolean;
          dark_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          monthly_budget?: number;
          budget_notifications?: boolean;
          dark_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};