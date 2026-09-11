import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Timer, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { ProductCard } from './ProductCard';

interface ProductStripProps {
  title: string;
  subtitle?: string;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onViewAll?: () => void;
  hasTimer?: boolean;
  bannerAd?: {
    title: string;
    sub: string;
    tag: string;
    bg: string;
  };
}

export const ProductStrip: React.FC<ProductStripProps> = ({
  title,
  subtitle,
  products,
  onSelectProduct,
  onViewAll,
  hasTimer = false,
  bannerAd,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 28, seconds: 45 });

  // Countdown timer for Deals of the Day
  useEffect(() => {
    if (!hasTimer) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [hasTimer]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 my-6">
      {/* Strip Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <h2 className="text-lg md:text-xl font-extrabold text-slate-950 font-sans tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
            )}
          </div>

          {/* Deal of the Day Timer */}
          {hasTimer && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-full text-xs font-mono font-bold tabular-nums">
              <Timer className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>
                {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s Left
              </span>
            </div>
          )}
        </div>

        {/* View All button & Nav Arrows */}
        <div className="flex items-center gap-2">
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1 ml-2">
            <button
              onClick={() => scroll('left')}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors focus:outline-none"
              title="Scroll Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors focus:outline-none"
              title="Scroll Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Momentum-Scroll Container with Snap Points */}
      <div className="relative group/strip">
        {/* Floating Desktop Left Arrow */}
        <button
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          className="hidden lg:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 border border-slate-200 text-slate-800 shadow-md items-center justify-center opacity-0 group-hover/strip:opacity-100 transition-opacity duration-200 hover:bg-white hover:scale-105 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Floating Desktop Right Arrow */}
        <button
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 border border-slate-200 text-slate-800 shadow-md items-center justify-center opacity-0 group-hover/strip:opacity-100 transition-opacity duration-200 hover:bg-white hover:scale-105 cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="flex gap-4">
          {/* Optional Left Promo Card */}
          {bannerAd && (
            <div className={`hidden lg:flex flex-col justify-between p-6 rounded-xl text-white w-60 flex-shrink-0 ${bannerAd.bg}`}>
              <div>
                <span className="text-[10px] uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded font-bold">
                  {bannerAd.tag}
                </span>
                <h3 className="text-xl font-black mt-3 leading-tight">{bannerAd.title}</h3>
                <p className="text-xs text-white/80 mt-2">{bannerAd.sub}</p>
              </div>
              <button
                onClick={onViewAll}
                className="mt-6 py-2 px-3 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span>Shop Deals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Scrollable Track: 1.2 cards visible on mobile, 2.5 on tablet, 4 on lg, 5 on xl */}
          <div
            ref={scrollRef}
            className="flex-1 min-w-0 w-full flex gap-3 sm:gap-3.5 overflow-x-auto snap-x snap-mandatory pb-2 no-scrollbar scroll-smooth"
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="w-[72vw] sm:w-[48%] md:w-[calc(100%/2.5-12px)] lg:w-[calc(100%/4-12px)] xl:w-[calc(100%/5-12px)] max-w-[280px] flex-shrink-0 snap-start min-w-0"
              >
                <ProductCard
                  product={product}
                  onSelectProduct={onSelectProduct}
                  dense
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
