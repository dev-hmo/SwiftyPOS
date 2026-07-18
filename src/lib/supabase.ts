import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

const hasCredentials = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasCredentials) {
  console.warn(
    '[SwiftyPOS] Supabase credentials are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file. Running in offline/demo mode.',
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
);

export { hasCredentials };

export type { DBProduct as Product, DBSaleTransaction as SaleTransaction } from '../types/pos';
