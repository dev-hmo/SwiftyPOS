import { supabase } from '../lib/supabase';

export const ProductService = {
  async getAll() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(product: any) {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

export const TransactionService = {
  async processSale(saleData: any, items: any[]) {
    // This should ideally call a Supabase Edge Function to ensure atomicity
    // But for MVP, we can do direct DB calls or simulated logic
    const { data: transaction, error: txError } = await supabase
      .from('sales_transactions')
      .insert([saleData])
      .select()
      .single();
    
    if (txError) throw txError;

    const saleItems = items.map(item => ({
      transaction_id: transaction.id,
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity
    }));

    const { error: itemsError } = await supabase
      .from('sales_items')
      .insert(saleItems);
    
    if (itemsError) throw itemsError;

    // Stock deduction is handled by DB triggers (see migration)
    return transaction;
  }
};
