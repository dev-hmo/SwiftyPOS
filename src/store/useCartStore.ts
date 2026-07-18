import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateSubtotal } from '../utils/calculations';
import { createAppStorage } from '../utils/storage';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  category?: string;
  img?: string;
  discount?: number;
  variantOptionId?: string;
  variantOptionName?: string;
  priceModifier?: number;
}

export type CartItemInput = Omit<CartItem, 'quantity'> & { quantity?: number };

export interface Customer {
  id: string;
  name: string;
  email: string;
  points?: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: CartItemInput) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updatePrice: (productId: string, price: number) => void;
  updateDiscount: (productId: string, discount: number) => void;
  clearCart: () => void;
  customer: Customer | null;
  setCustomer: (customer: Customer | null) => void;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        if (!product?.id || !product.name) return;
        if (typeof product.price !== 'number' || !Number.isFinite(product.price)) return;
        const safePrice = Math.max(0, product.price);
        const addQty = Math.max(1, Math.floor(product.quantity ?? 1));
        const priceMod = product.priceModifier ?? 0;
        const effectivePrice = Math.max(0, safePrice + priceMod);
        const compositeId = product.variantOptionId ? `${product.id}__${product.variantOptionId}` : product.id;
        const items = get().items;
        const existing = items.find((i) => i.id === compositeId);
        if (existing) {
          set({
            items: items.map((i) =>
              i.id === compositeId ? { ...i, quantity: i.quantity + addQty } : i
            ),
          });
        } else {
          set({
            items: [...items, {
              ...product,
              id: compositeId,
              price: effectivePrice,
              quantity: addQty,
              priceModifier: priceMod,
            }],
          });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.id !== productId) });
      },
      updateQuantity: (productId, quantity) => {
        const q = Math.max(0, Math.floor(quantity));
        set({
          items: get().items
            .map((i) => (i.id === productId ? { ...i, quantity: q } : i))
            .filter((i) => i.quantity > 0),
        });
      },
      updatePrice: (productId, price) => {
        if (typeof price !== 'number' || !Number.isFinite(price)) return;
        const p = Math.max(0, price);
        set({
          items: get().items.map((i) =>
            i.id === productId ? { ...i, price: p, discount: Math.min(i.discount ?? 0, p) } : i
          ),
        });
      },
      updateDiscount: (productId, discount) => {
        if (typeof discount !== 'number' || !Number.isFinite(discount)) return;
        set({
          items: get().items.map((i) => {
            if (i.id !== productId) return i;
            const d = Math.max(0, discount);
            return { ...i, discount: Math.min(d, i.price) };
          }),
        });
      },
      clearCart: () => set({ items: [] }),
      customer: null,
      setCustomer: (customer) => set({ customer }),
      getSubtotal: () => calculateSubtotal(get().items),
    }),
    { name: 'cart', storage: createAppStorage('cart') }
  )
);
