import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  variantId?: string;
  variantInfo?: any;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      addItem: (item) => {
        const items = get().items;
        const existingItem = items.find(
          (i) =>
            i.productId === item.productId &&
            i.variantId === item.variantId
        );

        if (existingItem) {
          const updatedItems = items.map((i) =>
            i.productId === item.productId && i.variantId === item.variantId
              ? {
                  ...i,
                  quantity: i.quantity + item.quantity,
                  totalPrice: (i.quantity + item.quantity) * i.unitPrice,
                }
              : i
          );
          set({
            items: updatedItems,
            subtotal: updatedItems.reduce((sum, i) => sum + i.totalPrice, 0),
          });
        } else {
          const newItem: CartItem = {
            ...item,
            id: `${item.productId}-${item.variantId || 'default'}-${Date.now()}`,
          };
          const newItems = [...items, newItem];
          set({
            items: newItems,
            subtotal: newItems.reduce((sum, i) => sum + i.totalPrice, 0),
          });
        }
      },
      removeItem: (id) => {
        const items = get().items.filter((i) => i.id !== id);
        set({
          items,
          subtotal: items.reduce((sum, i) => sum + i.totalPrice, 0),
        });
      },
      updateQuantity: (id, quantity) => {
        const items = get().items.map((i) =>
          i.id === id
            ? { ...i, quantity, totalPrice: quantity * i.unitPrice }
            : i
        );
        set({
          items,
          subtotal: items.reduce((sum, i) => sum + i.totalPrice, 0),
        });
      },
      clearCart: () => set({ items: [], subtotal: 0 }),
    }),
    {
      name: 'cart-storage',
    }
  )
);
