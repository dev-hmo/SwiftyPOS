import { supabase } from '../lib/supabase';
import type { DBProduct, DBSaleTransaction, DBIngredient, DBProductRecipe, DBStockHistory, DBVariant, DBVariantOption, DBProductVariant } from '../types/pos';
import {
  requireAdminContext,
  requireStaffContext,
} from '../lib/auth-context';
import { getUserEmails } from '../lib/user-emails';

const SYSTEM_FIELDS = new Set(['id', 'created_at', 'updated_at']);

function sanitizeFields(data: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!SYSTEM_FIELDS.has(key)) {
      clean[key] = value;
    }
  }
  return clean;
}

type ProductRow = DBProduct;

export const ProductService = {
  async getAll(): Promise<ProductRow[]> {
    requireStaffContext();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async create(product: Record<string, unknown>): Promise<ProductRow[]> {
    requireAdminContext();
    const clean = sanitizeFields(product);
    const { data, error } = await supabase
      .from('products')
      .insert([clean])
      .select();
    if (error) throw error;
    return data ?? [];
  },

  async update(id: string, updates: Record<string, unknown>): Promise<ProductRow[]> {
    if (!id) throw new Error('Product ID is required');
    requireAdminContext();
    const clean = sanitizeFields(updates);
    const { data, error } = await supabase
      .from('products')
      .update(clean)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data ?? [];
  },

  async delete(id: string): Promise<void> {
    if (!id) throw new Error('Product ID is required');
    requireAdminContext();
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

export interface SaleData {
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  payment_method: string;
  receipt_number: string;
  store_id?: string;
  cashier_id?: string;
}

export interface SaleItemInput {
  id: string;
  quantity: number;
  price: number;
}

export const TransactionService = {
  async processSale(saleData: SaleData, items: SaleItemInput[]) {
    if (!items || items.length === 0) {
      throw new Error('Cannot process sale with zero items');
    }
    if (saleData.total_amount < 0 || saleData.tax_amount < 0) {
      throw new Error('Sale amounts cannot be negative');
    }
    for (const item of items) {
      if (!item.id) throw new Error('Each sale item must have a product ID');
      if (item.quantity <= 0) throw new Error(`Invalid quantity for item ${item.id}`);
      if (item.price < 0) throw new Error(`Price cannot be negative for item ${item.id}`);
    }

    const ctx = requireStaffContext();
    const cashierId = saleData.cashier_id ?? ctx.userId;

    const { data: transaction, error: txError } = await supabase
      .from('sales_transactions')
      .insert([{
        ...saleData,
        cashier_id: cashierId,
      }])
      .select()
      .single();

    if (txError) throw txError;

    const saleItems = items.map((item) => ({
      transaction_id: transaction.id,
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: Math.round(item.price * item.quantity * 100) / 100,
    }));

    const { error: itemsError } = await supabase
      .from('sales_items')
      .insert(saleItems);

    if (itemsError) {
      await supabase
        .from('sales_transactions')
        .delete()
        .eq('id', transaction.id);
      throw itemsError;
    }

    return transaction;
  },
};

/**
 * Staff management service — only callable by admin.
 */
export const StaffService = {
  async listStaff() {
    requireAdminContext();

    const { data, error } = await supabase
      .from('user_tenants')
      .select('id, user_id, role')
      .order('id', { ascending: false });

    if (error) throw error;

    const userIds = (data ?? []).map((m) => m.user_id);
    const emailResults = await getUserEmails(userIds);
    const emailMap = new Map(emailResults.map((e) => [e.userId, e.email]));

    const staffList = (data ?? []).map((membership) => ({
      userId: membership.user_id,
      email: emailMap.get(membership.user_id) ?? 'unknown',
      role: membership.role,
    }));

    return staffList;
  },

  async inviteStaff(email: string, role: 'admin' | 'cashier' | 'kitchen') {
    requireAdminContext();

    const { data, error } = await supabase.rpc('invite_staff_to_tenant', {
      p_email: email,
      p_role: role,
    });

    if (error) throw error;
    return data;
  },

  async deactivateStaff(userId: string) {
    requireAdminContext();

    const { error } = await supabase
      .from('user_tenants')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  },

  async updateStaffRole(userId: string, newRole: 'admin' | 'cashier' | 'kitchen') {
    requireAdminContext();

    const { error } = await supabase
      .from('user_tenants')
      .update({ role: newRole })
      .eq('user_id', userId);

    if (error) throw error;
  },
};

export type { DBSaleTransaction as SaleTransaction };

// ─── Ingredients ─────────────────────────────────────────────

type IngredientRow = DBIngredient;

export const IngredientService = {
  async getAll(): Promise<IngredientRow[]> {
    requireStaffContext();
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<IngredientRow | null> {
    requireStaffContext();
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(row: Record<string, unknown>): Promise<IngredientRow[]> {
    requireAdminContext();
    const clean = sanitizeFields(row);
    const { data, error } = await supabase
      .from('ingredients')
      .insert([clean])
      .select();
    if (error) throw error;
    return data ?? [];
  },

  async update(id: string, updates: Record<string, unknown>): Promise<IngredientRow[]> {
    if (!id) throw new Error('Ingredient ID is required');
    requireAdminContext();
    const clean = sanitizeFields(updates);
    const { data, error } = await supabase
      .from('ingredients')
      .update(clean)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data ?? [];
  },

  async delete(id: string): Promise<void> {
    if (!id) throw new Error('Ingredient ID is required');
    requireAdminContext();
    const { error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * Adjust stock for an ingredient and log the change.
   * Pass a negative delta for outbound, positive for inbound.
   */
  async adjustStock(
    ingredientId: string,
    delta: number,
    changeType: DBStockHistory['change_type'],
    note?: string,
    transactionId?: string,
  ): Promise<void> {
    if (!ingredientId) throw new Error('Ingredient ID is required');

    const { data: ing, error: fetchErr } = await supabase
      .from('ingredients')
      .select('current_stock')
      .eq('id', ingredientId)
      .single();
    if (fetchErr) throw fetchErr;

    const previous = ing.current_stock as number;
    const next = Math.round((previous + delta) * 1000) / 1000;
    if (next < 0) throw new Error('Insufficient stock');

    const { error: updateErr } = await supabase
      .from('ingredients')
      .update({ current_stock: next })
      .eq('id', ingredientId);
    if (updateErr) throw updateErr;

    const ctx = requireStaffContext();
    const { error: histErr } = await supabase
      .from('stock_history')
      .insert([{
        ingredient_id: ingredientId,
        change_type: changeType,
        quantity_delta: delta,
        previous_stock: previous,
        new_stock: next,
        note: note ?? null,
        user_id: ctx.userId,
        transaction_id: transactionId ?? null,
      }]);
    if (histErr) throw histErr;
  },
};

// ─── Product Recipes ─────────────────────────────────────────

type RecipeRow = DBProductRecipe;

export const RecipeService = {
  /** Get all recipe lines for a given product. */
  async getByProduct(productId: string): Promise<RecipeRow[]> {
    requireStaffContext();
    const { data, error } = await supabase
      .from('product_recipes')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  /** Replace the full recipe for a product (delete all + insert new). */
  async replaceForProduct(
    productId: string,
    lines: { ingredient_id: string; quantity: number }[],
  ): Promise<void> {
    requireAdminContext();

    const { error: delErr } = await supabase
      .from('product_recipes')
      .delete()
      .eq('product_id', productId);
    if (delErr) throw delErr;

    if (lines.length === 0) return;

    const rows = lines.map((l) => ({
      product_id: productId,
      ingredient_id: l.ingredient_id,
      quantity: l.quantity,
    }));

    const { error: insErr } = await supabase
      .from('product_recipes')
      .insert(rows);
    if (insErr) throw insErr;
  },

  /** Get all recipe lines (used to derive "which products use ingredient X"). */
  async getAll(): Promise<RecipeRow[]> {
    requireStaffContext();
    const { data, error } = await supabase
      .from('product_recipes')
      .select('*');
    if (error) throw error;
    return data ?? [];
  },
};

// ─── Stock History ───────────────────────────────────────────

export const StockHistoryService = {
  async getByIngredient(
    ingredientId: string,
    limit = 50,
  ): Promise<DBStockHistory[]> {
    requireStaffContext();
    const { data, error } = await supabase
      .from('stock_history')
      .select('*')
      .eq('ingredient_id', ingredientId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  async getAll(limit = 100): Promise<DBStockHistory[]> {
    requireStaffContext();
    const { data, error } = await supabase
      .from('stock_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },
};

// ─── Variants ────────────────────────────────────────────────

export const VariantService = {
  async getAllGroups(): Promise<DBVariant[]> {
    requireStaffContext();
    const { data, error } = await supabase
      .from('variants')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async getOptionsByVariant(variantId: string): Promise<DBVariantOption[]> {
    requireStaffContext();
    const { data, error } = await supabase
      .from('variant_options')
      .select('*')
      .eq('variant_id', variantId)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async getAllOptions(): Promise<DBVariantOption[]> {
    requireStaffContext();
    const { data, error } = await supabase
      .from('variant_options')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async createGroup(name: string): Promise<DBVariant[]> {
    requireAdminContext();
    const { data, error } = await supabase
      .from('variants')
      .insert([{ name }])
      .select();
    if (error) throw error;
    return data ?? [];
  },

  async renameGroup(id: string, name: string): Promise<void> {
    requireAdminContext();
    const { error } = await supabase
      .from('variants')
      .update({ name })
      .eq('id', id);
    if (error) throw error;
  },

  async deleteGroup(id: string): Promise<void> {
    requireAdminContext();
    const { error } = await supabase
      .from('variants')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async addOption(variantId: string, name: string, priceModifier: number, sortOrder: number): Promise<DBVariantOption[]> {
    requireAdminContext();
    const { data, error } = await supabase
      .from('variant_options')
      .insert([{ variant_id: variantId, name, price_modifier: priceModifier, sort_order: sortOrder }])
      .select();
    if (error) throw error;
    return data ?? [];
  },

  async updateOption(id: string, updates: Partial<Pick<DBVariantOption, 'name' | 'price_modifier' | 'sort_order'>>): Promise<void> {
    requireAdminContext();
    const { error } = await supabase
      .from('variant_options')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  async deleteOption(id: string): Promise<void> {
    requireAdminContext();
    const { error } = await supabase
      .from('variant_options')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  /** Get all product-variant links. */
  async getAllProductLinks(): Promise<DBProductVariant[]> {
    requireStaffContext();
    const { data, error } = await supabase
      .from('product_variants')
      .select('*');
    if (error) throw error;
    return data ?? [];
  },

  /** Get variant option IDs linked to a product. */
  async getOptionsForProduct(productId: string): Promise<string[]> {
    requireStaffContext();
    const { data, error } = await supabase
      .from('product_variants')
      .select('variant_option_id')
      .eq('product_id', productId);
    if (error) throw error;
    return (data ?? []).map((r) => r.variant_option_id);
  },

  /** Replace all variant option links for a product. */
  async replaceForProduct(productId: string, variantOptionIds: string[]): Promise<void> {
    requireAdminContext();

    const { error: delErr } = await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', productId);
    if (delErr) throw delErr;

    if (variantOptionIds.length === 0) return;

    const rows = variantOptionIds.map((oid) => ({
      product_id: productId,
      variant_option_id: oid,
    }));

    const { error: insErr } = await supabase
      .from('product_variants')
      .insert(rows);
    if (insErr) throw insErr;
  },
};
