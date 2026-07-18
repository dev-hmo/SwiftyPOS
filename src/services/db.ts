import { supabase } from '../lib/supabase';
import type { DBProduct, DBSaleTransaction } from '../types/pos';
import {
  requireTenantContext,
  requireManagerContext,
  requireOwnerContext,
} from '../lib/tenant-context';
import type { TenantContext } from '../lib/tenant-context';
import { getUserEmails } from '../lib/user-emails';

const SYSTEM_FIELDS = new Set(['id', 'created_at', 'updated_at', 'tenant_id']);

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
    const { tenantId } = requireTenantContext();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async create(product: Record<string, unknown>): Promise<ProductRow[]> {
    const { tenantId } = requireManagerContext();
    const clean = sanitizeFields(product);
    const { data, error } = await supabase
      .from('products')
      .insert([{ ...clean, tenant_id: tenantId }])
      .select();
    if (error) throw error;
    return data ?? [];
  },

  async update(id: string, updates: Record<string, unknown>): Promise<ProductRow[]> {
    if (!id) throw new Error('Product ID is required');
    const { tenantId } = requireManagerContext();
    const clean = sanitizeFields(updates);
    const { data, error } = await supabase
      .from('products')
      .update(clean)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select();
    if (error) throw error;
    return data ?? [];
  },

  async delete(id: string): Promise<void> {
    if (!id) throw new Error('Product ID is required');
    const { tenantId } = requireManagerContext();
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);
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

/**
 * Helper: creates a tenant-scoped delete query for a given table and row ID.
 * Prevents BOLA by always including tenant_id in the WHERE clause.
 */
function tenantScopedDelete(ctx: TenantContext, table: string, rowId: string) {
  return supabase
    .from(table)
    .delete()
    .eq('id', rowId)
    .eq('tenant_id', ctx.tenantId);
}

export const TransactionService = {
  /**
   * Processes a sale via two sequential inserts (header + line items).
   * On partial failure, cleans up the orphaned header using a
   * tenant-scoped delete to prevent BOLA.
   */
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

    const ctx = requireTenantContext();
    const cashierId = saleData.cashier_id ?? ctx.userId;

    const { data: transaction, error: txError } = await supabase
      .from('sales_transactions')
      .insert([{
        ...saleData,
        tenant_id: ctx.tenantId,
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
      tenant_id: ctx.tenantId,
    }));

    const { error: itemsError } = await supabase
      .from('sales_items')
      .insert(saleItems);

    if (itemsError) {
      // BOLA FIX: orphan cleanup MUST include tenant_id filter
      await tenantScopedDelete(ctx, 'sales_transactions', transaction.id);
      throw itemsError;
    }

    return transaction;
  },
};

/**
 * Staff management service — only callable by tenant_admin.
 * All mutations go through SECURITY DEFINER RPCs so the database
 * enforces the tenant boundary server-side.
 */
export const StaffService = {
  /** List all staff members in the current tenant. */
  async listStaff() {
    const { tenantId } = requireOwnerContext();

    const { data, error } = await supabase
      .from('user_tenants')
      .select('user_id, role, is_active, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const userIds = (data ?? []).map((m) => m.user_id);
    const emailResults = await getUserEmails(userIds);
    const emailMap = new Map(emailResults.map((e) => [e.userId, e.email]));

    const staffList = (data ?? []).map((membership) => ({
      userId: membership.user_id,
      email: emailMap.get(membership.user_id) ?? 'unknown',
      role: membership.role,
      isActive: membership.is_active,
      joinedAt: membership.created_at,
    }));

    return staffList;
  },

  /** Invite or add a staff member to the tenant. */
  async inviteStaff(email: string, role: 'manager' | 'cashier') {
    const { tenantId } = requireOwnerContext();

    const { data, error } = await supabase.rpc('invite_staff_to_tenant', {
      p_email: email,
      p_tenant_id: tenantId,
      p_role: role,
    });

    if (error) throw error;
    return data;
  },

  /** Deactivate a staff member (soft-delete). */
  async deactivateStaff(userId: string) {
    const { tenantId } = requireOwnerContext();

    const { error } = await supabase
      .from('user_tenants')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId);

    if (error) throw error;
  },

  /** Update a staff member's role. */
  async updateStaffRole(userId: string, newRole: 'manager' | 'cashier') {
    const { tenantId } = requireOwnerContext();

    const { error } = await supabase
      .from('user_tenants')
      .update({ role: newRole })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId);

    if (error) throw error;
  },
};

export type { DBSaleTransaction as SaleTransaction };
