import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ShopifyProduct } from "@/lib/shopify";

/**
 * STANDALONE CART â€” no Shopify cart API.
 * Items live in localStorage; checkout is a POST to our own Netlify function
 * (/api/create-checkout-session) which validates prices server-side from
 * netlify/functions/data/ndv-prices.json and creates a direct Stripe
 * Checkout Session (no Lovable gateway, no Shopify).
 */

export interface CartItem {
  lineId: string | null;
  product: ShopifyProduct;
  variantId: string;
  variantTitle: string;
  price: { amount: string; currencyCode: string };
  quantity: number;
  selectedOptions: Array<{ name: string; value: string }>;
}

interface NdisAttributes {
  participantName: string;
  ndisNumber: string;
  email: string;
}

interface CartStore {
  items: CartItem[];
  cartId: string | null;
  checkoutUrl: string | null;
  isLoading: boolean;
  isSyncing: boolean;
  ndis: NdisAttributes | null;
  addItem: (item: Omit<CartItem, "lineId">) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  getCheckoutUrl: () => string | null;
  setNdisAttributes: (attributes: Array<{ key: string; value: string }>) => Promise<void>;
  startCheckout: () => Promise<void>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [], cartId: null, checkoutUrl: null, isLoading: false, isSyncing: false, ndis: null,

      addItem: async (item) => {
        const { items } = get();
        const existing = items.find(i => i.variantId === item.variantId);
        if (existing) {
          set({ items: items.map(i => i.variantId === item.variantId ? { ...i, quantity: i.quantity + item.quantity } : i) });
        } else {
          set({ items: [...items, { ...item, lineId: null }] });
        }
      },

      updateQuantity: async (variantId, quantity) => {
        if (quantity <= 0) return get().removeItem(variantId);
        const { items } = get();
        set({ items: items.map(i => i.variantId === variantId ? { ...i, quantity } : i) });
      },

      removeItem: async (variantId) => {
        const newItems = get().items.filter(i => i.variantId !== variantId);
        newItems.length === 0 ? get().clearCart() : set({ items: newItems });
      },

      clearCart: () => set({ items: [], cartId: null, checkoutUrl: null }),
      getCheckoutUrl: () => null,

      setNdisAttributes: async (attributes) => {
        // NDIS details ride into the Stripe session as metadata via the checkout function.
        const byKey = Object.fromEntries(attributes.map(a => [a.key, a.value]));
        set({
          ndis: {
            participantName: byKey["NDIS participant"] ?? "",
            ndisNumber: byKey["NDIS number"] ?? "",
            email: byKey["NDIS contact email"] ?? "",
          },
        });
      },

      syncCart: async () => { /* no remote cart â€” kept for compatibility */ },

      startCheckout: async () => {
        const { items, ndis } = get();
        if (!items.length) return;
        set({ isLoading: true });
        try {
          const res = await fetch("/api/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lines: items.map(i => ({
                handle: i.product.node.handle,
                variantId: i.variantId,
                quantity: i.quantity,
              })),
              ndis: ndis ?? undefined,
            }),
          });
          const data = await res.json();
          if (!res.ok || !data.url) {
            console.error("Checkout error:", data);
            throw new Error(data.error || `Checkout failed (HTTP ${res.status})`);
          }
          window.location.href = data.url;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "ndv-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, ndis: s.ndis }),
    }
  )
);
