import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { HERO_BANNERS, PROMO_TILES } from '../data/banners';
import { CATEGORIES } from '../data/categories';
import { PRODUCTS } from '../data/products';
import { Product } from '../types';
import { ProductStrip } from '../components/product/ProductStrip';
import { SEO } from '../components/common/SEO';
import { generateOrganizationSchema, generateWebSiteSchema } from '../lib/jsonLd';
import { findProductBySlug } from '../lib/slugs';
import { useBannersStore } from '../store/useBannersStore';
import { useCategoriesStore } from '../store/useCategoriesStore';

interface HomePageProps {
  onSelectProduct: (product: Product) => void;
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectProduct, onNavigate }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const { liveBanners, fetchLiveBanners } = useBannersStore();
  const { categories, fetchCategories } = useCategoriesStore();

  useEffect(() => {
    fetchLiveBanners();
    fetchCategories();
  }, [fetchLiveBanners, fetchCategories]);

  // Active banners: dynamic live banners from admin or fallback default hero banners
  const displayBanners = liveBanners && liveBanners.length > 0 ? liveBanners : null;
  const bannersCount = displayBanners ? displayBanners.length : HERO_BANNERS.length;

  // Auto-play hero slider
  useEffect(() => {
    if (bannersCount <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannersCount);
    }, 5500);
    return () => clearInterval(timer);
  }, [bannersCount]);

  const activeCategories = categories && categories.length > 0 ? categories : CATEGORIES;

  const dealsOfTheDay = PRODUCTS.filter((p: Product) => p.tag === 'Deal of the Day' || p.discountPercent >= 20);
  const topPicks = PRODUCTS.filter((p: Product) => p.category === 'mobiles' || p.tag === 'Top Pick');
  const trendingElectronics = PRODUCTS.filter((p: Product) => p.category === 'electronics');
  const fashionAndLifestyle = PRODUCTS.filter((p: Product) => p.category === 'fashion' || p.category === 'home');

  const homeStructuredData = [
    generateOrganizationSchema(),
    generateWebSiteSchema(),
  ];

  const handleBannerClick = (linkUrl: string) => {
    if (!linkUrl) return;
    if (linkUrl.startsWith('/category/')) {
      const catSlug = linkUrl.replace('/category/', '');
      onNavigate('plp', { category: catSlug });
    } else if (linkUrl.startsWith('/product/')) {
      const prodSlug = linkUrl.replace('/product/', '');
      const prod = PRODUCTS.find((p) => p.id === prodSlug) || findProductBySlug(prodSlug);
      if (prod) {
        onSelectProduct(prod);
      } else {
        window.location.pathname = linkUrl;
      }
    } else if (linkUrl.startsWith('http')) {
      window.open(linkUrl, '_blank');
    } else {
      onNavigate('plp');
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <SEO
        title="HodaHub | India's Online Shopping Destination for Electronics, Mobiles & Fashion"
        description="Shop verified electronics, flagship smartphones, appliances, and fashion on HodaHub. Enjoy fast delivery, 100% genuine products, and HodaAssured quality warranty."
        canonicalUrl="https://hodahub.in"
        ogType="website"
        structuredData={homeStructuredData}
      />

      {/* Primary Semantic H1 for SEO (visually hidden for accessible hierarchy) */}
      <h1 className="sr-only">
        HodaHub — India's Online Shopping Destination for Electronics, Mobiles, Fashion & Appliances
      </h1>

      {/* 1. DENSE CIRCULAR CATEGORY STRIP (HodaHub iconic category row) */}
      <section aria-label="Product Categories" className="w-full max-w-full min-w-0 bg-white rounded-xl border border-slate-200/90 p-3 sm:p-4 shadow-sm overflow-x-auto no-scrollbar">
        <div className="flex items-center justify-between min-w-[680px] sm:min-w-[720px] gap-4 sm:gap-6 px-1 sm:px-2">
          {activeCategories.map((category) => {
            const imgUrl = (category as any).imageUrl || (category as any).featuredImage;
            return (
              <button
                key={category.id}
                onClick={() => onNavigate('plp', { category: category.id })}
                className="flex flex-col items-center group cursor-pointer text-center focus:outline-none flex-1 min-w-[80px] sm:min-w-[90px]"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-1 bg-slate-100 group-hover:bg-primary-100/60 border border-slate-200 group-hover:border-primary-400 transition-all duration-200 shadow-sm flex items-center justify-center overflow-hidden mb-1.5 sm:mb-2 group-hover:scale-105">
                  <img
                    src={imgUrl}
                    alt={`${category.name} - Shop on HodaHub`}
                    className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-primary-600 transition-colors line-clamp-1">
                  {category.name}
                </span>
                {category.badge && (
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 rounded mt-0.5 border border-amber-200/60">
                    {category.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. HERO BANNER CAROUSEL */}
      <section className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-900/10 w-full max-w-full">
        <div className="relative h-64 sm:h-80 md:h-96 w-full bg-slate-950">
          <AnimatePresence mode="wait">
            {displayBanners ? (
              // Live Admin-Managed Hero Banners
              displayBanners.map((banner, index: number) => {
                if (index !== currentSlide) return null;
                return (
                  <motion.div
                    key={banner.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    onClick={() => handleBannerClick(banner.linkUrl)}
                    className="absolute inset-0 cursor-pointer overflow-hidden group select-none"
                  >
                    <img
                      src={banner.imageUrl}
                      alt={`${banner.title} - HodaHub Promo`}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                    />

                    {/* Gradient Overlay & Branding Text */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />

                    <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-10 z-10 pointer-events-none max-w-xl">
                      <div className="inline-flex items-center gap-1.5 bg-primary-600 text-white px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-mono font-bold tracking-wider mb-2 shadow-lg">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>HODAHUB SPECIAL</span>
                      </div>

                      <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-white drop-shadow-md leading-tight mb-2">
                        {banner.title}
                      </h2>

                      <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-white bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/30">
                        <span>Explore Offer</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              // Fallback default Hero Banners
              HERO_BANNERS.map((banner, index: number) => {
                if (index !== currentSlide) return null;
                return (
                  <motion.div
                    key={banner.id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`absolute inset-0 bg-gradient-to-r ${banner.bgGradient} flex items-center justify-between p-4 sm:p-12 text-white`}
                  >
                    <div className="max-w-xl z-10">
                      <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-mono font-bold tracking-wider mb-3 sm:mb-4 border border-white/20">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>{banner.tag}</span>
                      </div>

                      <h2 className="text-xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-none">
                        {banner.title}
                      </h2>

                      <p className="text-xs sm:text-base text-slate-300 font-medium mb-4 sm:mb-6 line-clamp-2">
                        {banner.subtitle}
                      </p>

                      <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                        <button
                          onClick={() => onNavigate('plp', { category: banner.categoryLink })}
                          className="px-4 py-2 sm:px-6 sm:py-3 bg-white text-slate-950 hover:bg-slate-100 font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-black/20 flex items-center gap-2 group cursor-pointer"
                        >
                          <span>{banner.ctaText}</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <span className="bg-amber-400 text-slate-950 text-[11px] sm:text-xs font-black px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg tracking-tight">
                          {banner.badge}
                        </span>
                      </div>
                    </div>

                    {/* Hero Right Image Graphic */}
                    <div className="hidden md:block w-80 h-80 relative flex-shrink-0">
                      <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-3xl" />
                      <img
                        src={banner.image}
                        alt={`${banner.title} - HodaHub Offer`}
                        className="w-full h-full object-contain relative z-10 drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Carousel Prev/Next Buttons */}
        {bannersCount > 1 && (
          <>
            <button
              onClick={() =>
                setCurrentSlide((prev) => (prev - 1 + bannersCount) % bannersCount)
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs flex items-center justify-center transition-all z-20 focus:outline-none cursor-pointer"
              title="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % bannersCount)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs flex items-center justify-center transition-all z-20 focus:outline-none cursor-pointer"
              title="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Indicator Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
              {Array.from({ length: bannersCount }).map((_, i: number) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* 3. PROMO VALUE TILES (Bank Discounts, Assured Guarantee, Speed) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PROMO_TILES.map((tile) => (
          <div
            key={tile.id}
            onClick={() => onNavigate('plp')}
            className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm hover:border-primary-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
          >
            <div>
              <span className="text-[10px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded uppercase font-mono">
                {tile.tag}
              </span>
              <h3 className="font-extrabold text-sm text-slate-900 mt-1 group-hover:text-primary-600 transition-colors">
                {tile.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{tile.desc}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
          </div>
        ))}
      </div>

      {/* 4. DEALS OF THE DAY RAIL (With live countdown timer) */}
      <ProductStrip
        title="Deals of the Day"
        subtitle="Refreshes every 24 hours. Handpicked lowest price drops."
        hasTimer
        products={dealsOfTheDay}
        onSelectProduct={onSelectProduct}
        onViewAll={() => onNavigate('plp', { tag: 'Deal of the Day' })}
        bannerAd={{
          tag: 'MEGA DEAL FEST',
          title: 'Unmatched 24H Price Crash',
          sub: 'Extra 10% instant discount on prepaid orders.',
          bg: 'bg-gradient-to-br from-primary-900 via-primary-700 to-indigo-800',
        }}
      />

      {/* 5. DUAL FEATURED BANNERS (Bank and brand promos) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
        <div
          onClick={() => onNavigate('plp', { category: 'mobiles' })}
          className="bg-gradient-to-r from-slate-950 to-indigo-950 rounded-2xl p-4 sm:p-6 text-white cursor-pointer shadow-md hover:shadow-xl transition-shadow flex items-center justify-between overflow-hidden relative group min-w-0"
        >
          <div className="z-10 min-w-0 pr-2">
            <span className="text-[11px] sm:text-xs font-mono font-bold text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded">
              FLAGSHIP SPOTLIGHT
            </span>
            <h3 className="text-lg sm:text-2xl font-black mt-2 leading-tight">Next-Gen Titanium Flagships</h3>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2">Starting ₹6,499/month with No Cost EMI</p>
            <button className="mt-3 sm:mt-4 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-white text-slate-950 font-bold text-xs rounded-lg group-hover:bg-primary-50 transition-colors">
              Explore Now →
            </button>
          </div>
          <img
            src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80"
            alt="Mobiles"
            className="w-24 h-24 sm:w-36 sm:h-36 object-contain group-hover:scale-105 transition-transform duration-300 flex-shrink-0"
          />
        </div>

        <div
          onClick={() => onNavigate('plp', { category: 'appliances' })}
          className="bg-gradient-to-r from-slate-900 to-primary-950 rounded-2xl p-4 sm:p-6 text-white cursor-pointer shadow-md hover:shadow-xl transition-shadow flex items-center justify-between overflow-hidden relative group min-w-0"
        >
          <div className="z-10 min-w-0 pr-2">
            <span className="text-[11px] sm:text-xs font-mono font-bold text-emerald-400 bg-emerald-400/20 px-2 py-0.5 rounded">
              HOME APPLIANCE CARNIVAL
            </span>
            <h3 className="text-lg sm:text-2xl font-black mt-2 leading-tight">4K OLED & Smart Living</h3>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2">Up to 40% Off + ₹6,000 Exchange Bonus</p>
            <button className="mt-3 sm:mt-4 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-white text-slate-950 font-bold text-xs rounded-lg group-hover:bg-primary-50 transition-colors">
              Explore Deals →
            </button>
          </div>
          <img
            src="https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&q=80"
            alt="Appliances"
            className="w-24 h-24 sm:w-36 sm:h-36 object-contain group-hover:scale-105 transition-transform duration-300 flex-shrink-0"
          />
        </div>
      </div>

      {/* 6. TOP PICKS IN SMARTPHONES & TECH */}
      <ProductStrip
        title="Top Picks for You"
        subtitle="Curated based on trending demand and HodaAssured customer reviews."
        products={topPicks}
        onSelectProduct={onSelectProduct}
        onViewAll={() => onNavigate('plp', { category: 'mobiles' })}
      />

      {/* 7. HIGH-DENSITY CATEGORY 4-GRID SHOWCASE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {CATEGORIES.slice(0, 4).map((cat) => {
          const catProducts = PRODUCTS.filter((p: Product) => p.category === cat.id).slice(0, 4);
          return (
            <div
              key={cat.id}
              className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 line-clamp-1">{cat.name}</h3>
                  <button
                    onClick={() => onNavigate('plp', { category: cat.id })}
                    className="text-xs text-primary-600 font-bold hover:underline"
                  >
                    View All
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {catProducts.map((item: Product) => (
                    <div
                      key={item.id}
                      onClick={() => onSelectProduct(item)}
                      className="p-2 border border-slate-100 rounded-lg hover:border-primary-300 cursor-pointer transition-all group bg-slate-50/50"
                    >
                      <div className="w-full aspect-square flex items-center justify-center p-1 mb-1">
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <p className="text-[11px] font-semibold text-slate-800 line-clamp-1">{item.title}</p>
                      <p className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1 rounded inline-block mt-0.5">
                        {item.discountPercent}% Off
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onNavigate('plp', { category: cat.id })}
                className="w-full mt-4 py-2 bg-slate-50 hover:bg-primary-50 text-slate-700 hover:text-primary-700 rounded-lg font-bold text-xs transition-colors border border-slate-200 flex items-center justify-center gap-1"
              >
                <span>Browse {cat.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* 8. TRENDING AUDIO & GADGETS */}
      <ProductStrip
        title="Trending in Electronics & Audio"
        subtitle="Industry-leading noise cancellation, wireless gear, and high-performance PC components."
        products={trendingElectronics}
        onSelectProduct={onSelectProduct}
        onViewAll={() => onNavigate('plp', { category: 'electronics' })}
      />

      {/* 9. FASHION & HOME APPLIANCES RAIL */}
      <ProductStrip
        title="Fashion, Footwear & Modern Living"
        subtitle="100% Original sneakers, designer apparel, and top kitchen essentials."
        products={fashionAndLifestyle}
        onSelectProduct={onSelectProduct}
        onViewAll={() => onNavigate('plp', { category: 'fashion' })}
      />
    </div>
  );
};
