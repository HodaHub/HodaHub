import React from 'react';
import { Star } from 'lucide-react';
import { cn, formatNumber } from '../../lib/utils';

interface RatingBadgeProps {
  rating: number;
  ratingCount?: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export const RatingBadge: React.FC<RatingBadgeProps> = ({
  rating,
  ratingCount,
  reviewCount,
  size = 'sm',
  showCount = false,
  className,
}) => {
  const isHighRating = rating >= 4.0;
  const isGoodRating = rating >= 3.0;

  const bgClasses = isHighRating
    ? 'bg-emerald-600 text-white'
    : isGoodRating
    ? 'bg-amber-500 text-white'
    : 'bg-rose-500 text-white';

  const iconSizes = {
    sm: 'w-2.5 h-2.5 fill-white',
    md: 'w-3 h-3 fill-white',
    lg: 'w-4 h-4 fill-white',
  };

  const textSizes = {
    sm: 'text-[11px] px-1.5 py-0.5 rounded',
    md: 'text-xs px-2 py-0.5 rounded-md font-semibold',
    lg: 'text-sm px-2.5 py-1 rounded-md font-bold',
  };

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <div
        className={cn(
          'inline-flex items-center gap-1 font-mono font-bold leading-none tracking-tight shadow-sm',
          bgClasses,
          textSizes[size]
        )}
      >
        <span>{rating.toFixed(1)}</span>
        <Star className={iconSizes[size]} strokeWidth={0} />
      </div>

      {showCount && (
        <span className="text-xs text-slate-500 font-medium">
          {ratingCount && `${formatNumber(ratingCount)} Ratings`}
          {ratingCount && reviewCount ? ' & ' : ''}
          {reviewCount && `${formatNumber(reviewCount)} Reviews`}
        </span>
      )}
    </div>
  );
};
