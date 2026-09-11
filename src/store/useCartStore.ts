import { create } from 'zustand';
import { Product, CartItem, BoxOption } from '../types';

interface FlyingItemPayload {
  x: number;
  y: number;
  image: string;
}

// Single centralized calculation functions used across entire platform
export const calculateItemUnitPrice = (item: CartItem): number => {
  const basePrice = item.product?.price || 0;
  const boxPrice = item.selectedBox && typeof item.selectedBox.price === 'number' ? item.selectedBox.price : 0;
  return basePrice + boxPrice;
};

export const calculateItemOriginalUnitPrice = (item: CartItem): number => {
  const baseMrp = item.product?.originalPrice || item.product?.price || 0;
  const boxPrice = item.selectedBox && typeof item.selectedBox.price === 'number' ? item.selectedBox.price : 0;
  return baseMrp + boxPrice;
};

export const calculateItemTotal = (item: CartItem): number => {
  return calculateItemUnitPrice(item) * item.quantity;
};

interface CartStore {
  items: CartItem[];
  pendingBoxes: Record<string, BoxOption | null>;
  promoCode: string | null;
  promoDiscount: number;
  flyingItem: FlyingItemPayload | null;
  
  // Actions
  addItem: (
    product: Product,
    quantity?: number,
    selectedColor?: string,
    selectedVariant?: string,
    flyOrigin?: { x: number; y: number },
    selectedBox?: BoxOption | null
  ) => void;
  setSelectedBoxForProduct: (productId: string, selectedBox: BoxOption | null) => void;
  updateItemBox: (productId: string, selectedBox: BoxOption | null) => void;
  getProductBox: (productId: string) => BoxOption | null;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyPromo: (code: string) => { success: boolean; message: string };
  removePromo: () => void;
  clearFlyingItem: () => void;
  
  // Computed values
  getTotalCount: () => number;
  getTotalMRP: () => number;
  getSubtotal: () => number;
  getCartTotal: () => number;
  getSavings: () => number;
  getDeliveryFee: () => number;
  getFinalTotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  pendingBoxes: {},
  promoCode: null,
  promoDiscount: 0,
  flyingItem: null,

  setSelectedBoxForProduct: (productId, box) => {
    set((state) => {
      // 1. Update pendingBoxes dictionary
      const nextPending = {
        ...state.pendingBoxes,
        [productId]: box,
      };

      // 2. If item is already in cart, update it reactively
      const hasItem = state.items.some((item) => item.product.id === productId);
      const nextItems = hasItem
        ? state.items.map((item) =>
            item.product.id === productId ? { ...item, selectedBox: box } : item
          )
        : state.items;

      return {
        pendingBoxes: nextPending,
        items: nextItems,
      };
    });
  },

  updateItemBox: (productId, selectedBox) => {
    get().setSelectedBoxForProduct(productId, selectedBox);
  },

  getProductBox: (productId) => {
    const itemInCart = get().items.find((item) => item.product.id === productId);
    if (itemInCart && itemInCart.selectedBox !== undefined) {
      return itemInCart.selectedBox;
    }
    return get().pendingBoxes[productId] || null;
  },

  addItem: (product, quantity = 1, selectedColor, selectedVariant, flyOrigin, selectedBox) => {
    if (flyOrigin) {
      set({
        flyingItem: {
          x: flyOrigin.x,
          y: flyOrigin.y,
          image: product.images[0] || '',
        },
      });
    }

    const boxToUse = selectedBox !== undefined ? selectedBox : (get().pendingBoxes[product.id] || null);

    set((state) => {
      const existingIndex = state.items.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedColor === selectedColor &&
          item.selectedVariant === selectedVariant
      );

      if (existingIndex > -1) {
        const updated = [...state.items];
        updated[existingIndex].quantity += quantity;
        updated[existingIndex].selectedBox = boxToUse;
        return { items: updated };
      }

      return {
        items: [
          ...state.items,
          {
            product,
            quantity,
            selectedColor: selectedColor || product.colors?.[0]?.name,
            selectedVariant: selectedVariant || product.variants?.[0]?.value,
            selectedBox: boxToUse,
            addedAt: Date.now(),
          },
        ],
      };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.product.id !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    }));
  },

  clearCart: () => {
    set({ items: [], promoCode: null, promoDiscount: 0, pendingBoxes: {} });
  },

  applyPromo: (code) => {
    const formatted = code.trim().toUpperCase();
    const subtotal = get().getSubtotal();

    if (formatted === 'HODA500' || formatted === 'HODA500') {
      if (subtotal >= 2999) {
        const discount = 500;
        set({ promoCode: formatted, promoDiscount: discount });
        return { success: true, message: '₹500 Instant Discount applied successfully!' };
      }
      return { success: false, message: 'Minimum cart value of ₹2,999 required for HODA500.' };
    }

    if (formatted === 'FESTIVE10') {
      if (subtotal >= 999) {
        const discount = Math.min(Math.round(subtotal * 0.1), 1500);
        set({ promoCode: formatted, promoDiscount: discount });
        return { success: true, message: `10% Discount (₹${discount}) applied successfully!` };
      }
      return { success: false, message: 'Minimum cart value of ₹999 required for FESTIVE10.' };
    }

    if (formatted === 'WELCOME100') {
      const discount = Math.min(100, subtotal);
      set({ promoCode: formatted, promoDiscount: discount });
      return { success: true, message: 'Welcome voucher ₹100 applied!' };
    }

    return { success: false, message: 'Invalid coupon code. Try HODA500 or FESTIVE10.' };
  },

  removePromo: () => {
    set({ promoCode: null, promoDiscount: 0 });
  },

  clearFlyingItem: () => {
    set({ flyingItem: null });
  },

  getTotalCount: () => {
    return get().items.reduce((acc, item) => acc + item.quantity, 0);
  },

  getTotalMRP: () => {
    return get().items.reduce(
      (acc, item) => acc + calculateItemOriginalUnitPrice(item) * item.quantity,
      0
    );
  },

  getSubtotal: () => {
    return get().items.reduce((acc, item) => acc + calculateItemTotal(item), 0);
  },

  getCartTotal: () => {
    return get().getSubtotal();
  },

  getSavings: () => {
    const totalMRP = get().getTotalMRP();
    const subtotal = get().getSubtotal();
    const promoDiscount = get().promoDiscount;
    return Math.max(0, totalMRP - subtotal + promoDiscount);
  },

  getDeliveryFee: () => {
    const subtotal = get().getSubtotal();
    if (subtotal === 0) return 0;
    return subtotal >= 499 ? 0 : 40;
  },

  getFinalTotal: () => {
    const subtotal = get().getSubtotal();
    if (subtotal === 0) return 0;
    const delivery = get().getDeliveryFee();
    const promoDiscount = get().promoDiscount;
    return Math.max(0, subtotal - promoDiscount + delivery);
  },
}));
