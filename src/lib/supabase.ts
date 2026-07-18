import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

const hasCredentials = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasCredentials) {
  console.warn(
    '[SwiftyPOS] Supabase credentials are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.',
  );
}

const clientUrl = supabaseUrl || 'https://placeholder.supabase.co';
const clientKey = supabaseAnonKey || 'placeholder-key';

if (!hasCredentials) {
  console.warn(
    '[SwiftyPOS] Running with placeholder credentials. All database operations will fail.',
  );
}

export const supabase = createClient(clientUrl, clientKey);

export { hasCredentials };

export type { DBProduct as Product, DBSaleTransaction as SaleTransaction } from '../types/pos';
