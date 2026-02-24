// hooks/useCart.ts
"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/lib/publicApiService';

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  price: number;
  discount: number;
}

interface CartStore {
  items: CartItem[];
  total: number;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,

      addItem: (product, quantity) => {
        const items = get().items;
        const existingItem = items.find(item => item.id === product._id);

        let newItems: CartItem[];

        if (existingItem) {
          newItems = items.map(item =>
            item.id === product._id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          const discount = getProductDiscount(product, quantity);
          newItems = [
            ...items,
            {
              id: product._id,
              product,
              quantity,
              price: product.productPrice,
              discount,
            },
          ];
        }

        set({
          items: newItems,
          total: calculateTotal(newItems),
        });
      },

      removeItem: (id) => {
        const newItems = get().items.filter(item => item.id !== id);
        set({
          items: newItems,
          total: calculateTotal(newItems),
        });
      },

      updateQuantity: (id, quantity) => {
        const newItems = get().items.map(item => {
          if (item.id === id) {
            const discount = getProductDiscount(item.product, quantity);
            return { ...item, quantity, discount };
          }
          return item;
        });

        set({
          items: newItems,
          total: calculateTotal(newItems),
        });
      },

      clearCart: () => {
        set({ items: [], total: 0 });
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);

// Helper function to calculate total
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    const discountAmount = (itemTotal * item.discount) / 100;
    const itemTotalAfterDiscount = itemTotal - discountAmount;

    return sum + itemTotalAfterDiscount;
  }, 0);
}

// Helper function to get product discount
function getProductDiscount(product: Product, quantity: number): number {
  if (!product.discountTiers || product.discountTiers.length === 0) {
    return product.productDiscount || 0;
  }

  const sortedTiers = [...product.discountTiers].sort(
    (a, b) => a.quantity - b.quantity
  );

  let discount = product.productDiscount || 0;

  for (const tier of sortedTiers) {
    if (quantity >= tier.quantity) {
      discount = tier.discount;
    } else {
      break;
    }
  }

  return discount;
}
