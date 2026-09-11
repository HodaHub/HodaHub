import React from 'react';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { useWishlistStore } from '../store/useWishlistStore';
import { useCartStore } from '../store/useCartStore';
import { PriceDisplay } from '../components/common/PriceDisplay';
import { RatingBadge } from '../components/common/RatingBadge';
import { TrustBadge } from '../components/common/TrustBadge';
import { Product } from '../types';

interface WishlistPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  onSelectProduct: (product: Product) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ onNavigate, onSelectProduct }) => {
  const items = useWishlistStore((state) => state.items);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);
  const addItem = useCartStore((state) => state.addItem);

  const handleMoveToCart = (product: Product) => {
    addItem(product, 1);
    removeFromWishlist(product.id);
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm max-w-2xl mx-auto my-8">
        <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-4">
          <Heart className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 font-sans">Your Wishlist is Empty</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Save your favorite products to keep track of deals and price drops on HodaHub.
        </p>
        <button
          onClick={() => onNavigate('home')}
          className="mt-6 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md"
        >
          Explore Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 font-sans">
            My Wishlist ({items.length} {items.length === 1 ? 'Item' : 'Items'})
          </h1>
          <p className="text-xs text-slate-500">Products saved for later purchase</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((product: Product) => (
          <div
            key={product.id}
            className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex gap-4 hover:border-primary-300 transition-all"
          >
            <div
              onClick={() => onSelectProduct(product)}
              className="w-28 h-28 rounded-lg bg-slate-50 border border-slate-100 p-2 flex items-center justify-center cursor-pointer flex-shrink-0"
            >
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">{product.brand}</span>
                  {product.isAssured && <TrustBadge size="sm" />}
                </div>

                <h3
                  onClick={() => onSelectProduct(product)}
                  className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 cursor-pointer hover:text-primary-600 transition-colors"
                >
                  {product.title}
                </h3>

                <div className="mt-1">
                  <RatingBadge rating={product.rating} size="sm" />
                </div>

                <div className="mt-2">
                  <PriceDisplay
                    price={product.price}
                    originalPrice={product.originalPrice}
                    discountPercent={product.discountPercent}
                    size="sm"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 mt-2 flex items-center gap-2">
                <button
                  onClick={() => handleMoveToCart(product)}
                  className="flex-1 py-1.5 px-3 bg-primary-50 hover:bg-primary-600 text-primary-700 hover:text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-primary-200"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Move to Cart</span>
                </button>

                <button
                  onClick={() => removeFromWishlist(product.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
