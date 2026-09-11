import React from 'react';
import { motion } from 'framer-motion';
import { Check, RotateCcw, Star, ShieldCheck } from 'lucide-react';
import { useFilterStore } from '../../store/useFilterStore';
import { PRODUCTS } from '../../data/products';
import { formatPrice } from '../../lib/utils';

interface FilterSidebarProps {
  currentCategory?: string;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ currentCategory }) => {
  const {
    priceRange,
    selectedBrands,
    minRating,
    discountRange,
    inStockOnly,
    assuredOnly,
    setPriceRange,
    toggleBrand,
    setMinRating,
    setDiscountRange,
    setInStockOnly,
    setAssuredOnly,
    resetFilters,
  } = useFilterStore();

  // Extract unique brands for currently visible/relevant products
  const availableBrands = Array.from(
    new Set(
      PRODUCTS.filter((p) => !currentCategory || currentCategory === 'All' || p.category === currentCategory).map(
        (p) => p.brand
      )
    )
  );

  const discountOptions = [
    { label: '50% or more', value: 50 },
    { label: '30% or more', value: 30 },
    { label: '20% or more', value: 20 },
    { label: '10% or more', value: 10 },
  ];

  const ratingOptions = [4, 3, 2];

  const hasActiveFilters =
    priceRange[0] > 0 ||
    priceRange[1] < 200000 ||
    selectedBrands.length > 0 ||
    minRating > 0 ||
    discountRange > 0 ||
    inStockOnly ||
    assuredOnly;

  return (
    <aside className="w-full bg-white rounded-xl border border-slate-200/90 shadow-sm divide-y divide-slate-100 overflow-hidden text-xs">
      {/* Header with Clear All */}
      <div className="p-4 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">Filters</h3>
          <p className="text-[11px] text-slate-500 font-medium">Refine your selection</p>
        </div>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:text-primary-700 hover:underline transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        )}
      </div>

      {/* 1. HodaAssured & Stock Toggles */}
      <div className="p-4 space-y-3">
        <label className="flex items-center justify-between cursor-pointer select-none group">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary-600" />
            <span className="font-bold text-slate-800 group-hover:text-primary-600 transition-colors">
              Hoda<span className="text-primary-600">Assured</span> Only
            </span>
          </div>
          <div
            onClick={() => setAssuredOnly(!assuredOnly)}
            className={`w-9 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              assuredOnly ? 'bg-primary-600' : 'bg-slate-200'
            }`}
          >
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="bg-white w-3.5 h-3.5 rounded-full shadow-md"
            />
          </div>
        </label>

        <label className="flex items-center justify-between cursor-pointer select-none group">
          <span className="font-semibold text-slate-700 group-hover:text-primary-600 transition-colors">
            Exclude Out of Stock
          </span>
          <div
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`w-9 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              inStockOnly ? 'bg-primary-600' : 'bg-slate-200'
            }`}
          >
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="bg-white w-3.5 h-3.5 rounded-full shadow-md"
            />
          </div>
        </label>
      </div>

      {/* 2. Price Range Slider */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
            Price Range
          </span>
          <span className="font-mono text-slate-600 font-semibold tabular-nums">
            Up to {formatPrice(priceRange[1])}
          </span>
        </div>

        <input
          type="range"
          min="1000"
          max="200000"
          step="2500"
          value={priceRange[1]}
          onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
          className="w-full accent-primary-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
        />

        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-2">
          <span>₹1,000</span>
          <span>₹2,00,000+</span>
        </div>
      </div>

      {/* 3. Brand Selection with Spring Checkboxes */}
      <div className="p-4">
        <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block mb-3">
          Brand
        </span>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {availableBrands.map((brand) => {
            const isChecked = selectedBrands.includes(brand);
            return (
              <label
                key={brand}
                onClick={() => toggleBrand(brand)}
                className="flex items-center gap-2.5 cursor-pointer select-none group"
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                    isChecked
                      ? 'bg-primary-600 border-primary-600'
                      : 'border-slate-300 group-hover:border-primary-400 bg-white'
                  }`}
                >
                  {isChecked && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    >
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                    </motion.div>
                  )}
                </div>
                <span
                  className={`font-medium transition-colors ${
                    isChecked ? 'text-slate-950 font-bold' : 'text-slate-700 group-hover:text-slate-950'
                  }`}
                >
                  {brand}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 4. Customer Ratings */}
      <div className="p-4">
        <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block mb-3">
          Customer Ratings
        </span>
        <div className="space-y-2">
          {ratingOptions.map((rating) => {
            const isSelected = minRating === rating;
            return (
              <label
                key={rating}
                onClick={() => setMinRating(isSelected ? 0 : rating)}
                className="flex items-center gap-2.5 cursor-pointer select-none group"
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors ${
                    isSelected
                      ? 'bg-primary-600 border-primary-600'
                      : 'border-slate-300 group-hover:border-primary-400 bg-white'
                  }`}
                >
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-800">{rating}★ & above</span>
                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400" strokeWidth={0} />
                    ))}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* 5. Discount Filter */}
      <div className="p-4">
        <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block mb-3">
          Discount
        </span>
        <div className="space-y-2">
          {discountOptions.map((opt) => {
            const isSelected = discountRange === opt.value;
            return (
              <label
                key={opt.value}
                onClick={() => setDiscountRange(isSelected ? 0 : opt.value)}
                className="flex items-center gap-2.5 cursor-pointer select-none group"
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors ${
                    isSelected
                      ? 'bg-primary-600 border-primary-600'
                      : 'border-slate-300 group-hover:border-primary-400 bg-white'
                  }`}
                >
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <span
                  className={`font-medium ${
                    isSelected ? 'text-primary-700 font-bold' : 'text-slate-700 group-hover:text-slate-950'
                  }`}
                >
                  {opt.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
