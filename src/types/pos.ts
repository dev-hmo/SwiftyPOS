export interface DBProduct {
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
  category_id: string | null;
  custom_attributes: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DBSaleTransaction {
  id: string;
  store_id: string | null;
  cashier_id: string | null;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  payment_method: string;
  receipt_number: string;
  created_at: string;
}

export interface DBSaleItem {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface DBCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  loyalty_points: number;
  created_at: string;
  updated_at: string;
}

export interface DBStore {
  id: string;
  name: string;
  location: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DBInventoryMovement {
  id: string;
  product_id: string;
  store_id: string | null;
  quantity: number;
  type: 'inbound' | 'outbound' | 'adjustment' | 'sale' | 'return';
  reason: string | null;
  user_id: string | null;
  created_at: string;
}

export interface DBBusinessSettings {
  id: string;
  business_name: string;
  business_type: 'retail' | 'fb' | 'service';
  currency_code: string;
  currency_symbol: string;
  tax_rate: number;
  receipt_header: string | null;
  receipt_footer: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBAuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface DBAccountTransaction {
  id: string;
  store_id: string | null;
  type: 'EXPENSE' | 'DEBIT' | 'CREDIT' | 'REVENUE';
  category: string;
  amount: number;
  description: string | null;
  reference_id: string | null;
  created_at: string;
  created_by: string | null;
}

export interface InventoryProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock_quantity: number;
  img?: string;
  recipe: RecipeItem[];
}

export interface Ingredient {
  id: string;
  sku: string;
  name: string;
  unit: string;
  stock_quantity: number;
  cost_per_unit: number;
  low_stock_threshold: number;
}

export interface RecipeItem {
  ingredientId: string;
  quantity: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  category?: string;
  img?: string;
  discount?: number;
}

export type CartItemInput = Omit<CartItem, 'quantity'> & { quantity?: number };

export interface Customer {
  id: string;
  name: string;
  email: string;
  points?: number;
}

export interface SaleRecord {
  id: string;
  receiptNumber: string;
  items: { name: string; sku: string; quantity: number; price: number; discount?: number }[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  cashier: string;
  customer: string | null;
  status: 'Completed' | 'Refunded' | 'Voided';
  createdAt: string;
}

export interface KDSItem {
  name: string;
  quantity: number;
  notes?: string;
}

export interface KDSOrder {
  id: string;
  receiptNumber: string;
  items: KDSItem[];
  status: 'NEW' | 'IN_PROGRESS' | 'READY';
  createdAt: number;
  cashier: string;
}

export interface HeldOrder {
  id: string;
  items: CartItem[];
  customer: Customer | null;
  note: string;
  timestamp: number;
}

export interface Category {
  id: string;
  name: string;
  productCount: number;
}

export interface Tax {
  id: string;
  name: string;
  rate: number;
}

export interface Account {
  id: string;
  code: string;
  name: string;
}

export type ActivityAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'SALE_COMPLETED'
  | 'REFUND'
  | 'PRODUCT_ADDED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_DELETED'
  | 'SETTINGS_CHANGED'
  | 'ORDER_HELD'
  | 'ORDER_RECALLED';

export interface ActivityEntry {
  id: string;
  action: ActivityAction;
  details: string;
  userId: string;
  timestamp: number;
}

export type BusinessType = 'retail' | 'fb' | 'service';

export type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  message: string;
  severity: NotificationSeverity;
  timestamp: number;
}

// ─── Inventory: Ingredients / Recipes / Stock ─────────────────

export interface DBIngredient {
  id: string;
  name: string;
  sku: string;
  unit: string;
  current_stock: number;
  cost_per_unit: number;
  min_stock_alert: number;
  created_at: string;
  updated_at: string;
}

export interface DBProductRecipe {
  id: string;
  product_id: string;
  ingredient_id: string;
  quantity: number;
  created_at: string;
}

export interface DBStockHistory {
  id: string;
  ingredient_id: string;
  change_type: 'purchase' | 'sale' | 'adjustment' | 'waste' | 'opening';
  quantity_delta: number;
  previous_stock: number;
  new_stock: number;
  note: string | null;
  user_id: string | null;
  transaction_id: string | null;
  created_at: string;
}

// ─── Variants ────────────────────────────────────────────────

export interface DBVariant {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DBVariantOption {
  id: string;
  variant_id: string;
  name: string;
  price_modifier: number;
  sort_order: number;
  created_at: string;
}

export interface DBProductVariant {
  id: string;
  product_id: string;
  variant_option_id: string;
  created_at: string;
}

/** Frontend-friendly flattened variant option with group name attached. */
export interface VariantOption {
  id: string;
  variantId: string;
  variantName: string;
  name: string;
  priceModifier: number;
  sortOrder: number;
}

/** Frontend-friendly variant group with its options nested. */
export interface VariantGroup {
  id: string;
  name: string;
  options: { id: string; name: string; priceModifier: number; sortOrder: number }[];
}
