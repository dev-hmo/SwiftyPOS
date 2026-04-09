import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Product = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  cost_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  image_url: string | null;
  created_at: string;
};

export type SaleTransaction = {
  id: string;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  payment_method: string;
  receipt_number: string;
  created_at: string;
};
