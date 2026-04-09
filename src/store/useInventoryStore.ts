import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useNotificationStore } from './useNotificationStore';

export interface Ingredient {
  id: string;
  sku: string;
  name: string;
  unit: string; // e.g., 'kg', 'L', 'g', 'oz'
  stock_quantity: number;
  cost_per_unit: number;
  low_stock_threshold: number;
}

export interface RecipeItem {
  ingredientId: string;
  quantity: number; // how much of the ingredient is needed
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
  
  // Ingredient Actions
  addIngredient: (ingredient: Ingredient) => void;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  deleteIngredient: (id: string) => void;
  
  // Product Actions
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Pos Action
  deductStockFromSale: (soldItems: { productId: string, quantity: number }[]) => void;
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
    recipe: [{ ingredientId: 'ing-2', quantity: 18 }] // 18g of beans
  },
  { 
    id: '2', sku: 'COF-002', name: 'Caramel Macchiato', price: 16.50, stock_quantity: 0, category: 'Coffee', img: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=300&auto=format&fit=crop',
    recipe: [{ ingredientId: 'ing-2', quantity: 18 }, { ingredientId: 'ing-1', quantity: 0.2 }, { ingredientId: 'ing-5', quantity: 30 }] // 18g beans, 200ml milk, 30ml caramel
  },
  { 
    id: '3', sku: 'TEA-001', name: 'Artisanal Green Tea', price: 12.00, stock_quantity: 0, category: 'Tea', img: 'https://images.unsplash.com/photo-1563911191333-66223404fb85?q=80&w=300&auto=format&fit=crop',
    recipe: [{ ingredientId: 'ing-4', quantity: 5 }] // 5g matcha powder
  },
  { 
    id: '6', sku: 'COF-003', name: 'Cold Brew Oat', price: 14.00, stock_quantity: 0, category: 'Coffee', img: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=300&auto=format&fit=crop',
    recipe: [{ ingredientId: 'ing-2', quantity: 22 }, { ingredientId: 'ing-3', quantity: 0.25 }] // 22g beans, 250ml oat milk
  },
  { 
    id: '4', sku: 'PAS-001', name: 'Classic Croissant', price: 4.50, stock_quantity: 45, category: 'Pastries', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=300&auto=format&fit=crop',
    recipe: [] // Purchased pre-made
  },
  { 
    id: '5', sku: 'EQU-001', name: 'Swifty Brew Kit', price: 35.00, stock_quantity: 12, category: 'Equipment', img: 'https://images.unsplash.com/photo-1544787210-2211d247317e?q=80&w=300&auto=format&fit=crop',
    recipe: [] 
  },
];

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set) => ({
      ingredients: DEFAULT_INGREDIENTS,
      products: DEFAULT_PRODUCTS,

      addIngredient: (ingredient) => set((state) => ({ ingredients: [...state.ingredients, ingredient] })),
      updateIngredient: (id, updates) => set((state) => ({
        ingredients: state.ingredients.map(i => i.id === id ? { ...i, ...updates } : i)
      })),
      deleteIngredient: (id) => set((state) => ({
        ingredients: state.ingredients.filter(i => i.id !== id)
      })),

      addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
      updateProduct: (id, updates) => set((state) => ({
        products: state.products.map(p => p.id === id ? { ...p, ...updates } : p)
      })),
      deleteProduct: (id) => set((state) => ({
        products: state.products.filter(p => p.id !== id)
      })),

      deductStockFromSale: (soldItems) => {
        set((state) => {
          const updatedIngredients = [...state.ingredients];
          const updatedProducts = [...state.products];
          
          soldItems.forEach(soldItem => {
            const productIndex = updatedProducts.findIndex(p => p.id === soldItem.productId);
            if (productIndex === -1) return;
            const product = updatedProducts[productIndex];

            if (product.recipe && product.recipe.length > 0) {
              // Deduct ingredients for recipe-based items
              product.recipe.forEach(recipeItem => {
                const ingIndex = updatedIngredients.findIndex(i => i.id === recipeItem.ingredientId);
                if (ingIndex !== -1) {
                  const deductionTotal = recipeItem.quantity * soldItem.quantity;
                  updatedIngredients[ingIndex].stock_quantity -= deductionTotal;
                  if (updatedIngredients[ingIndex].stock_quantity < 0) {
                    updatedIngredients[ingIndex].stock_quantity = 0;
                  }
                }
              });
            } else {
              // Deduct product stock directly for non-recipe items (retail/pastries)
              updatedProducts[productIndex].stock_quantity -= soldItem.quantity;
              if (updatedProducts[productIndex].stock_quantity < 0) {
                updatedProducts[productIndex].stock_quantity = 0;
              }
            }
          });

          // Check for low stock and notify
          updatedIngredients.forEach(ing => {
            if (ing.stock_quantity <= ing.low_stock_threshold) {
              const originalIng = state.ingredients.find(i => i.id === ing.id);
              // Only notify if it JUST fell below or is still below (avoid spamming if possible, 
              // but here we just notify on every deduction that results in low stock for simplicity)
              if (originalIng && (originalIng.stock_quantity > ing.low_stock_threshold || originalIng.stock_quantity !== ing.stock_quantity)) {
                useNotificationStore.getState().enqueue(
                  `Low Stock Alert: ${ing.name} is down to ${ing.stock_quantity} ${ing.unit}`,
                  'warning'
                );
              }
            }
          });

          return { ingredients: updatedIngredients, products: updatedProducts };
        });
      }
    }),
    {
      name: 'inventory-storage',
    }
  )
);
