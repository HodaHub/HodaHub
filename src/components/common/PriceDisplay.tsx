import React from 'react';
import { cn, formatPrice } from '../../lib/utils';

interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showDiscountBadge?: boolean;
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  originalPrice,
  discountPercent,
  size = 'md',
  showDiscountBadge = true,
  className,
}) => {
  const calculatedDiscount =
    discountPercent ??
    (originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0);

  const priceStyles = {
    sm: 'text-sm font-bold',
    md: 'text-base font-bold',
    lg: 'text-xl font-extrabold',
    xl: 'text-3xl font-extrabold tracking-tight',
  };

  const originalPriceStyles = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
  };

  const badgeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-1.5 py-0.5',
    lg: 'text-xs px-2 py-0.5',
    xl: 'text-sm px-2.5 py-1',
  };

  return (
    <div className={cn('flex items-baseline flex-wrap gap-2 tabular-nums font-mono', className)}>
      {/* Current Selling Price in bold JetBrains Mono */}
      <span className={cn('text-slate-950 font-bold', priceStyles[size])}>
        {formatPrice(price)}
      </span>

      {/* MRP strikethrough */}
      {originalPrice && originalPrice > price && (
        <span
          className={cn(
            'text-slate-400 line-through font-normal',
            originalPriceStyles[size]
          )}
        >
          {formatPrice(originalPrice)}
        </span>
      )}

      {/* Warm Amber Discount Badge */}
      {showDiscountBadge && calculatedDiscount > 0 && (
        <span
          className={cn(
            'font-sans font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded tracking-tight',
            badgeStyles[size]
          )}
        >
          {calculatedDiscount}% off
        </span>
      )}
    </div>
  );
};
