import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingCart, Check, Zap } from 'lucide-react';
import { Product } from '../../types';
import { useCartStore } from '../../store/useCartStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { RatingBadge } from '../common/RatingBadge';
import { PriceDisplay } from '../common/PriceDisplay';
import { TrustBadge } from '../common/TrustBadge';
import { getDeliveryDateString } from '../../lib/utils';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  dense?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
  dense = false,
}) => {
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const origin = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    addItem(product, 1, undefined, undefined, origin);

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1800);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <article
      onClick={() => onSelectProduct(product)}
      className="group relative bg-white rounded-xl border border-slate-200/90 hover:border-primary-300 flex flex-col h-full cursor-pointer transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-card-hover overflow-hidden min-w-0"
    >
      {/* Top badges & Wishlist Button */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
        {product.tag ? (
          <span className="bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm tracking-wide">
            {product.tag}
          </span>
        ) : (
          <span />
        )}

        <button
          type="button"
          onClick={handleWishlistClick}
          aria-label={isWishlisted ? `Remove ${product.title} from Wishlist` : `Add ${product.title} to Wishlist`}
          className="pointer-events-auto w-8 h-8 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-white/95 hover:bg-white text-slate-400 hover:text-rose-500 shadow-sm transition-all duration-150 backdrop-blur-xs focus:outline-none cursor-pointer"
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-150 active:scale-75 ${
              isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
            }`}
            strokeWidth={2}
          />
        </button>
      </div>

      {/* Product Image with aspect ratio and descriptive SEO alt */}
      <div className="relative w-full aspect-square p-2.5 sm:p-4 bg-slate-50/50 flex items-center justify-center overflow-hidden border-b border-slate-100">
        <motion.img
          layoutId={`product-image-${product.id}`}
          src={product.images[0]}
          alt={`${product.title} - HodaHub`}
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300 ease-out"
          loading="lazy"
        />

        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-rose-600 text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full shadow">
              Currently Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Information Body */}
      <div className="p-2.5 sm:p-3.5 flex flex-col flex-1 min-w-0">
        {/* Brand & HodaAssured Trust Badge */}
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
            {product.brand}
          </span>
          {product.isAssured && <TrustBadge size="sm" />}
        </div>

        {/* 2-line title clamp */}
        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-primary-600 transition-colors mb-1.5 sm:mb-2 min-h-[2.25rem] sm:min-h-[2.5rem] break-words">
          {product.title}
        </h3>

        {/* Rating Pill + Review count */}
        <div className="mb-2 flex items-center">
          <RatingBadge
            rating={product.rating}
            ratingCount={product.ratingCount}
            showCount={!dense}
            size="sm"
          />
        </div>

        {/* Price Block: Current + MRP + Warm Amber Discount Badge */}
        <div className="mt-auto">
          <PriceDisplay
            price={product.price}
            originalPrice={product.originalPrice}
            discountPercent={product.discountPercent}
            size={dense ? 'sm' : 'md'}
          />

          {/* Delivery estimate */}
          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600 shrink-0" />
            <span className="truncate">Free delivery by <strong className="text-slate-700 font-semibold">{getDeliveryDateString(product.deliveryDays)}</strong></span>
          </div>
        </div>

        {/* Add-to-Cart Button with minimum 44px touch height */}
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-2">
          <motion.button
            type="button"
            onClick={handleAddToCart}
            disabled={!product.inStock}
            whileTap={{ scale: 0.96 }}
            aria-label={`Add ${product.title} to Cart`}
            className={`w-full min-h-[40px] sm:min-h-[44px] py-2 sm:py-2 px-2 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs focus:outline-none cursor-pointer ${
              !product.inStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : isAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-primary-50 hover:bg-primary-600 text-primary-700 hover:text-white border border-primary-200 hover:border-primary-600'
            }`}
          >
            <AnimatePresence mode="wait">
              {isAdded ? (
                <motion.div
                  key="added"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Added to Cart!</span>
                </motion.div>
              ) : (
                <motion.div
                  key="default"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="flex items-center gap-1.5"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Add to Cart</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </article>
  );
};
