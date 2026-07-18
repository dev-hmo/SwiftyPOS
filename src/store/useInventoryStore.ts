import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useNotificationStore } from './useNotificationStore';
import { createAppStorage } from '../utils/storage';

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

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock_quantity: number;
  img?: string;
  recipe: RecipeItem[];
}

export interface InventoryState {
  ingredients: Ingredient[];
  products: Product[];

  addIngredient: (ingredient: Ingredient) => void;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  deleteIngredient: (id: string) => void;

  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  /** Returns true if all items can be fulfilled from current stock. */
  canFulfillSale: (soldItems: { productId: string; quantity: number }[]) => boolean;
  /** Deducts stock. Throws if insufficient stock. */
  deductStockFromSale: (soldItems: { productId: string; quantity: number }[]) => void;
}

function clampNonNegative(n: number): number {
  return Math.max(0, Math.floor(n));
}

const DEFAULT_INGREDIENTS: Ingredient[] = [
  { id: 'ing-1', sku: 'RAW-MILK', name: 'Whole Milk', unit: 'L', stock_quantity: 25, cost_per_unit: 1.50, low_stock_threshold: 5 },
  { id: 'ing-2', sku: 'RAW-COF-ARA', name: 'Arabica Beans', unit: 'g', stock_quantity: 5000, cost_per_unit: 0.02, low_stock_threshold: 1000 },
  { id: 'ing-3', sku: 'RAW-OAT', name: 'Oat Milk', unit: 'L', stock_quantity: 12, cost_per_unit: 2.20, low_stock_threshold: 4 },
  { id: 'ing-4', sku: 'RAW-TEA-GRN', name: 'Matcha Powder', unit: 'g', stock_quantity: 1500, cost_per_unit: 0.15, low_stock_threshold: 200 },
  { id: 'ing-5', sku: 'RAW-CARAMEL', name: 'Caramel Syrup', unit: 'ml', stock_quantity: 3000, cost_per_unit: 0.01, low_stock_threshold: 500 },
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: '1', sku: 'COF-001', name: 'Terracotta Espresso', price: 18.00, stock_quantity: 0, category: 'Coffee', img: 'https://images.unsplash.com/photo-1510972527921-ce03766a1cf1?q=80&w=300&auto=format&fit=crop',
    recipe: [{ ingredientId: 'ing-2', quantity: 18 }]
  },
  {
    id: '2', sku: 'COF-002', name: 'Caramel Macchiato', price: 16.50, stock_quantity: 0, category: 'Coffee', img: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=300&auto=format&fit=crop',
    recipe: [{ ingredientId: 'ing-2', quantity: 18 }, { ingredientId: 'ing-1', quantity: 0.2 }, { ingredientId: 'ing-5', quantity: 30 }]
  },
  {
    id: '3', sku: 'TEA-001', name: 'Artisanal Green Tea', price: 12.00, stock_quantity: 0, category: 'Tea', img: 'https://images.unsplash.com/photo-1563911191333-66223404fb85?q=80&w=300&auto=format&fit=crop',
    recipe: [{ ingredientId: 'ing-4', quantity: 5 }]
  },
  {
    id: '6', sku: 'COF-003', name: 'Cold Brew Oat', price: 14.00, stock_quantity: 0, category: 'Coffee', img: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=300&auto=format&fit=crop',
    recipe: [{ ingredientId: 'ing-2', quantity: 22 }, { ingredientId: 'ing-3', quantity: 0.25 }]
  },
  {
    id: '4', sku: 'PAS-001', name: 'Classic Croissant', price: 4.50, stock_quantity: 45, category: 'Pastries', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=300&auto=format&fit=crop',
    recipe: []
  },
  {
    id: '5', sku: 'EQU-001', name: 'Swifty Brew Kit', price: 35.00, stock_quantity: 12, category: 'Equipment', img: 'https://images.unsplash.com/photo-1544787210-2211d247317e?q=80&w=300&auto=format&fit=crop',
    recipe: []
  },
];

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      ingredients: DEFAULT_INGREDIENTS,
      products: DEFAULT_PRODUCTS,

      addIngredient: (ingredient) =>
        set((state) => ({
          ingredients: [...state.ingredients, { ...ingredient, stock_quantity: clampNonNegative(ingredient.stock_quantity) }],
        })),

      updateIngredient: (id, updates) =>
        set((state) => ({
          ingredients: state.ingredients.map((i) => {
            if (i.id !== id) return i;
            const safeUpdates = { ...updates };
            delete safeUpdates.id;
            const next = { ...i, ...safeUpdates };
            if (typeof next.stock_quantity === 'number') {
              next.stock_quantity = clampNonNegative(next.stock_quantity);
            }
            if (typeof next.cost_per_unit === 'number') {
              next.cost_per_unit = Math.max(0, next.cost_per_unit);
            }
            if (typeof next.low_stock_threshold === 'number') {
              next.low_stock_threshold = clampNonNegative(next.low_stock_threshold);
            }
            return next;
          }),
        })),

      deleteIngredient: (id) =>
        set((state) => ({
          ingredients: state.ingredients.filter((i) => i.id !== id),
        })),

      addProduct: (product) =>
        set((state) => ({
          products: [...state.products, { ...product, stock_quantity: clampNonNegative(product.stock_quantity) }],
        })),

      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((p) => {
            if (p.id !== id) return p;
            const safeUpdates = { ...updates };
            delete safeUpdates.id;
            const next = { ...p, ...safeUpdates };
            if (typeof next.stock_quantity === 'number') {
              next.stock_quantity = clampNonNegative(next.stock_quantity);
            }
            if (typeof next.price === 'number') {
              next.price = Math.max(0, next.price);
            }
            return next;
          }),
        })),

      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),

      canFulfillSale: (soldItems) => {
        const { products, ingredients } = get();
        for (const soldItem of soldItems) {
          const product = products.find((p) => p.id === soldItem.productId);
          if (!product) return false;

          if (product.recipe.length > 0) {
            for (const recipeItem of product.recipe) {
              const ing = ingredients.find((i) => i.id === recipeItem.ingredientId);
              const needed = recipeItem.quantity * soldItem.quantity;
              if (!ing || ing.stock_quantity < needed) return false;
            }
          } else {
            if (product.stock_quantity < soldItem.quantity) return false;
          }
        }
        return true;
      },

      deductStockFromSale: (soldItems) => {
        // Pre-validate: reject if any item would go negative
        if (!get().canFulfillSale(soldItems)) {
          throw new Error('Insufficient stock to fulfill this sale');
        }

        set((state) => {
          const updatedIngredients = state.ingredients.map((i) => ({ ...i }));
          const updatedProducts = state.products.map((p) => ({ ...p }));

          for (const soldItem of soldItems) {
            const productIdx = updatedProducts.findIndex((p) => p.id === soldItem.productId);
            if (productIdx === -1) continue;
            const product = updatedProducts[productIdx];

            if (product.recipe.length > 0) {
              for (const recipeItem of product.recipe) {
                const ingIdx = updatedIngredients.findIndex((i) => i.id === recipeItem.ingredientId);
                if (ingIdx === -1) continue;
                updatedIngredients[ingIdx].stock_quantity -= recipeItem.quantity * soldItem.quantity;
              }
            } else {
              updatedProducts[productIdx].stock_quantity -= soldItem.quantity;
            }
          }

          // Low-stock alerts
          for (const ing of updatedIngredients) {
            if (ing.stock_quantity <= ing.low_stock_threshold) {
              const original = state.ingredients.find((i) => i.id === ing.id);
              if (original && original.stock_quantity > ing.low_stock_threshold) {
                useNotificationStore.getState().enqueue(
                  `Low Stock Alert: ${ing.name} is down to ${ing.stock_quantity} ${ing.unit}`,
                  'warning'
                );
              }
            }
          }

          return { ingredients: updatedIngredients, products: updatedProducts };
        });
      },
    }),
    {
      name: 'inventory',
      storage: createAppStorage('inventory'),
    }
  )
);
