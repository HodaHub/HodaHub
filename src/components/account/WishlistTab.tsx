import React, { useState } from 'react';
import {
  Heart,
  ShoppingCart,
  Trash2,
  Check,
  ShieldCheck,
  Star,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useCartStore } from '../../store/useCartStore';
import { formatPrice } from '../../lib/utils';
import { Product } from '../../types';

interface WishlistTabProps {
  onNavigate?: (page: string, params?: Record<string, any>) => void;
  onSelectProduct?: (product: Product) => void;
}

export const WishlistTab: React.FC<WishlistTabProps> = ({ onNavigate, onSelectProduct }) => {
  const { items, removeFromWishlist } = useWishlistStore();
  const addItem = useCartStore((state) => state.addItem);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleMoveToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    addItem(product, 1, undefined, undefined, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    removeFromWishlist(product.id);
    showToast(`Moved "${product.title}" to your cart.`);
  };

  const handleRemove = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromWishlist(product.id);
    showToast(`Removed "${product.title}" from wishlist.`);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="pb-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">My Saved Wishlist</h2>
          <p className="text-xs text-slate-500">
            Products you bookmarked for later. Move them to your cart when ready to purchase.
          </p>
        </div>
        <div className="text-xs font-mono font-bold text-slate-600">
          Saved Items: <span className="text-slate-900">{items.length}</span>
        </div>
      </div>

      {/* Wishlist Items Grid */}
      {items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto my-6 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
            <Heart className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Your Wishlist is Empty</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Save your favorite gadgets, electronics, and fashion items to track price drops and availability.
            </p>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('plp')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <span>Explore HodaHub Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((product) => (
            <div
              key={product.id}
              onClick={() => onSelectProduct?.(product)}
              className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs hover:border-primary-300 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div className="p-4 space-y-3">
                {/* Product Thumbnail & HodaAssured */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.isAssured && (
                    <div className="absolute top-2 left-2 inline-flex items-center gap-1 bg-white/95 backdrop-blur-xs border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono shadow-xs">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>HodaAssured</span>
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={(e) => handleRemove(product, e)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-rose-600 transition-colors shadow-sm cursor-pointer"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Info */}
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">
                    {product.brand}
                  </div>
                  <h3 className="font-bold text-xs text-slate-900 line-clamp-2 mt-0.5 group-hover:text-primary-600 transition-colors">
                    {product.title}
                  </h3>

                  {/* Ratings */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="inline-flex items-center gap-0.5 bg-emerald-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">
                      <span>{product.rating}</span>
                      <Star className="w-2.5 h-2.5 fill-white" />
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({product.ratingCount || 140})
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mt-2 font-mono">
                    <span className="text-sm font-black text-slate-900">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice > product.price && (
                      <>
                        <span className="text-xs text-slate-400 line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                        <span className="text-xs font-bold text-emerald-600">
                          {product.discountPercent}% off
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Action: Move to Cart */}
              <div className="p-3 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={(e) => handleMoveToCart(product, e)}
                  className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Move to Cart</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
