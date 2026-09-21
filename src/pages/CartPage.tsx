import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  Bookmark,
  Plus,
  Minus,
  MapPin,
  ShoppingBag,
  Zap,
  Package,
  X,
} from 'lucide-react';
import {
  useCartStore,
  calculateItemUnitPrice,
  calculateItemOriginalUnitPrice,
  calculateItemTotal,
} from '../store/useCartStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { PriceBreakupCard } from '../components/cart/PriceBreakupCard';
import { PriceDisplay } from '../components/common/PriceDisplay';
import { TrustBadge } from '../components/common/TrustBadge';
import { getDeliveryDateString } from '../lib/utils';
import { Product, CartItem } from '../types';
import { SEO } from '../components/common/SEO';

interface CartPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  onSelectProduct: (product: Product) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate, onSelectProduct }) => {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  const handleSaveForLater = (product: Product) => {
    toggleWishlist(product);
    removeItem(product.id);
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm max-w-2xl mx-auto my-8">
        <SEO
          title="Your Shopping Cart | HodaHub"
          description="Review items in your HodaHub shopping cart with secure checkout."
          canonicalUrl="https://hodahub.in/cart"
          noindex={true}
        />
        <div className="w-20 h-20 rounded-full bg-primary-50 text-primary-600 mx-auto flex items-center justify-center mb-4">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 font-sans">Your HodaHub Cart is Empty</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Explore today's handpicked deals, trending smartphones, electronics, and fashion collections.
        </p>
        <button
          onClick={() => onNavigate('home')}
          className="mt-6 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-primary-500/20 cursor-pointer"
        >
          Shop Today's Deals
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <SEO
        title="Your Shopping Cart | HodaHub"
        description="Review items in your HodaHub shopping cart with secure checkout."
        canonicalUrl="https://hodahub.in/cart"
        noindex={true}
      />
      {/* 1. Header Banner with Address Pincode */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-sm flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary-600" />
          <span className="text-slate-600">
            Deliver to: <strong className="text-slate-950 font-bold">Anand Rao, Bengaluru - 560001</strong> (Home)
          </span>
        </div>
        <button
          onClick={() => onNavigate('checkout')}
          className="text-primary-600 hover:underline font-bold text-xs"
        >
          Change Address
        </button>
      </div>

      {/* 2. Main Cart Layout: Left Items List + Right Sticky Price Breakup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Itemized Cart */}
        <div className="lg:col-span-8 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm divide-y divide-slate-100 overflow-hidden">
            <AnimatePresence>
              {items.map((item: CartItem) => {
                const { product, quantity, selectedColor, selectedVariant, selectedBox } = item;
                return (
                <motion.div
                  key={`${product.id}-${selectedColor}-${selectedVariant}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-6"
                >
                  {/* Thumbnail and Quantity Stepper */}
                  <div className="flex flex-col items-center gap-3 sm:w-32 flex-shrink-0">
                    <div
                      onClick={() => onSelectProduct(product)}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg bg-slate-50 border border-slate-100 p-2 flex items-center justify-center cursor-pointer hover:border-primary-300 transition-colors"
                    >
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
                        title="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-xs tabular-nums text-slate-900">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
                        title="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Item Description & Delivery Meta */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div
                          onClick={() => onSelectProduct(product)}
                          className="cursor-pointer group"
                        >
                          <h3 className="text-sm font-bold text-slate-950 group-hover:text-primary-600 transition-colors line-clamp-2">
                            {product.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            {selectedColor && (
                              <span>Color: <strong className="text-slate-700">{selectedColor}</strong></span>
                            )}
                            {selectedVariant && (
                              <span>• {selectedVariant}</span>
                            )}
                            <span>• Seller: HodaRetail Direct</span>
                          </div>
                        </div>

                        {product.isAssured && <TrustBadge size="sm" />}
                      </div>

                      {/* Box packaging badge if selected */}
                      {selectedBox && (
                        <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900 w-fit">
                          <Package className="w-3.5 h-3.5 text-amber-600" />
                          <span className="font-semibold">{selectedBox.name} (+₹{selectedBox.price})</span>
                          <button
                            type="button"
                            onClick={() => useCartStore.getState().updateItemBox(product.id, null)}
                            className="ml-1 text-amber-600 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove box packaging"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Price row */}
                      <div className="mt-3">
                        <PriceDisplay
                          price={calculateItemTotal(item)}
                          originalPrice={calculateItemOriginalUnitPrice(item) * quantity}
                          discountPercent={product.discountPercent}
                          size="lg"
                        />
                      </div>

                      {/* Delivery Date */}
                      <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                        <span>
                          Delivery by <strong className="text-slate-900">{getDeliveryDateString(product.deliveryDays)}</strong> | <span className="text-emerald-700 font-bold">FREE</span>
                        </span>
                      </div>
                    </div>

                    {/* Action Links: Save for Later & Remove */}
                    <div className="pt-4 border-t border-slate-100 mt-4 flex items-center gap-4 text-xs font-bold">
                      <button
                        onClick={() => handleSaveForLater(product)}
                        className="flex items-center gap-1 text-slate-600 hover:text-primary-600 transition-colors"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>SAVE FOR LATER</span>
                      </button>

                      <button
                        onClick={() => removeItem(product.id)}
                        className="flex items-center gap-1 text-slate-600 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>REMOVE</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Sticky Price Breakup Card with final Place Order CTA */}
        <div className="lg:col-span-4">
          <PriceBreakupCard
            onCheckout={() => onNavigate('checkout')}
            ctaText="PLACE ORDER"
          />
        </div>
      </div>
    </div>
  );
};
