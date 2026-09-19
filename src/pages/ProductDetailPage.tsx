import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  ShoppingCart,
  Zap,
  Check,
  Tag,
  MapPin,
  ChevronRight,
  Share2,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  MessageCircle,
  RotateCcw,
  Package,
  Loader2,
} from 'lucide-react';
import { ReplacementPolicyModal } from '../components/product/ReplacementPolicyModal';
import { BoxUpgradeModal } from '../components/product/BoxUpgradeModal';
import { Product, BoxOption } from '../types';
import { useCartStore } from '../store/useCartStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { RatingBadge } from '../components/common/RatingBadge';
import { PriceDisplay } from '../components/common/PriceDisplay';
import { TrustBadge } from '../components/common/TrustBadge';
import { ImageMagnifier } from '../components/product/ImageMagnifier';
import { ProductStrip } from '../components/product/ProductStrip';
import { useProductsStore } from '../store/useProductsStore';
import { getDeliveryDateString } from '../lib/utils';
import { checkServiceability, DeliveryServiceabilityResult } from '../services/deliveryService';
import { SEO } from '../components/common/SEO';
import { generateProductSchema, generateBreadcrumbSchema } from '../lib/jsonLd';
import { getProductSlug } from '../lib/slugs';

interface ProductDetailPageProps {
  product: Product;
  onNavigate: (page: string, params?: Record<string, any>) => void;
  onSelectProduct: (product: Product) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onNavigate,
  onSelectProduct,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0]?.name || '');
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]?.value || '');
  const [isAdded, setIsAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<'specs' | 'reviews' | 'faq'>('specs');
  const [isReplacementModalOpen, setIsReplacementModalOpen] = useState(false);
  const [isBoxUpgradeModalOpen, setIsBoxUpgradeModalOpen] = useState(false);
  const [selectedBoxOption, setSelectedBoxOption] = useState<BoxOption | null>(null);

  // Pincode state
  const [pincodeInput, setPincodeInput] = useState('560001');
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);
  const [pincodeResult, setPincodeResult] = useState<DeliveryServiceabilityResult | null>(null);

  // Dynamically resolve default pincode city & state on component mount (no hardcoded location strings)
  useEffect(() => {
    let isMounted = true;
    checkServiceability('560001').then((res) => {
      if (isMounted) {
        setPincodeResult(res);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const pendingBox = useCartStore((state) => state.pendingBoxes[product.id]);
  const existingCartItem = cartItems.find((item) => item.product.id === product.id);
  const activeBoxOption = pendingBox !== undefined ? pendingBox : (existingCartItem?.selectedBox || selectedBoxOption);
  const effectivePrice = product.price + (activeBoxOption ? activeBoxOption.price : 0);
  const effectiveOriginalPrice = (product.originalPrice || product.price) + (activeBoxOption ? activeBoxOption.price : 0);
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const isWishlisted = isInWishlist(product.id);

  const handleCheckPincode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCheckingPincode(true);
    try {
      const res = await checkServiceability(pincodeInput);
      setPincodeResult(res);
    } catch {
      setPincodeResult({
        serviceable: false,
        error: 'Please enter a valid 6-digit pincode',
      });
    } finally {
      setIsCheckingPincode(false);
    }
  };

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const origin = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    addItem(product, 1, selectedColor, selectedVariant, origin, activeBoxOption);

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  const handleBuyNow = (e: React.MouseEvent<HTMLButtonElement>) => {
    handleAddToCart(e);
    onNavigate('checkout');
  };

  // Similar items from live catalog
  const liveProds = useProductsStore((state) => state.products);
  const similarProducts = (liveProds || []).filter(
    (p: Product) => p.category === product.category && p.id !== product.id
  ).slice(0, 5);

  const productSlug = getProductSlug(product);
  const rawWhatsApp = (import.meta.env.VITE_WHATSAPP_NUMBER as string) || '918864088157';
  const cleanWhatsApp = rawWhatsApp.replace(/\D/g, '');
  const businessNumber = cleanWhatsApp.length === 10 ? `91${cleanWhatsApp}` : cleanWhatsApp;
  const productPageUrl = typeof window !== 'undefined' ? window.location.href : `https://hodahub.in/product/${productSlug}`;
  const whatsappMessage = `Hi HodaHub, I would like to inquire / order this product:\n\n*Product:* ${product.title}\n*Price:* ₹${product.price.toLocaleString('en-IN')}\n*SKU:* ${product.sku}\n*URL:* ${productPageUrl}`;
  const whatsappUrl = `https://wa.me/${businessNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  const productSchema = generateProductSchema(product);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: product.category, url: `/category/${product.category}` },
    { name: product.title, url: `/product/${productSlug}` },
  ]);

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* 0. SEO & JSON-LD STRUCTURED DATA */}
      <SEO
        title={`${product.title} - Best Price Online | HodaHub`}
        description={
          product.highlights && product.highlights.length > 0
            ? `${product.highlights.join('. ').slice(0, 140)}... Buy with HodaAssured express delivery.`
            : `Buy ${product.title} online at best price in India on HodaHub with genuine warranty and fast shipping.`
        }
        canonicalUrl={`https://hodahub.in/product/${productSlug}`}
        ogImage={product.images[0]}
        ogType="product"
        structuredData={[productSchema, breadcrumbSchema]}
      />

      {/* 1. BREADCRUMB TRAIL */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 font-medium overflow-x-auto no-scrollbar">
        <button onClick={() => onNavigate('home')} className="hover:text-primary-600 transition-colors py-1">
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <button
          onClick={() => onNavigate('plp', { category: product.category })}
          className="hover:text-primary-600 transition-colors capitalize py-1"
        >
          {product.category}
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span className="text-slate-900 font-semibold line-clamp-1 py-1">{product.title}</span>
      </nav>

      {/* 2. MAIN DETAIL GRID (Mobile 1-col, Tablet 2-col 50/50, Desktop 5/7 with sticky buy-box) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT COLUMN: THUMBNAILS + MAIN MAGNIFIER IMAGE + ACTIONS */}
        <div className="md:col-span-6 lg:col-span-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Vertical Thumbnail Rail (Hidden on mobile < sm, visible on tablet/desktop) */}
            <div className="hidden sm:flex sm:flex-col gap-2.5">
              {product.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  aria-label={`View ${product.title} image angle ${idx + 1}`}
                  className={`w-14 h-14 rounded-lg p-1 border-2 transition-all overflow-hidden bg-white min-h-[44px] min-w-[44px] ${selectedImageIndex === idx
                      ? 'border-primary-600 shadow-sm ring-1 ring-primary-400'
                      : 'border-slate-200 hover:border-slate-400'
                    }`}
                >
                  <img
                    src={img}
                    alt={`${product.title} thumbnail ${idx + 1} - HodaHub`}
                    loading="lazy"
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                </button>
              ))}
            </div>

            {/* Main Interactive Zoom Image with Framer Motion layoutId */}
            <div className="flex-1 relative">
              <ImageMagnifier
                src={product.images[selectedImageIndex] || product.images[0]}
                alt={`${product.title} - ${selectedColor || 'Front'} angle ${selectedImageIndex + 1} - HodaHub`}
                layoutId={`product-image-${product.id}`}
              />

              {/* Wishlist & Share floating triggers */}
              <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  className="p-2.5 min-w-[44px] min-h-[44px] rounded-full bg-white/95 hover:bg-white text-slate-400 hover:text-rose-500 shadow-md transition-all flex items-center justify-center"
                  aria-label={isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
                  title="Save to Wishlist"
                >
                  <Heart
                    className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                      }`}
                    strokeWidth={2}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    alert('Product link copied to clipboard!');
                  }}
                  className="p-2.5 min-w-[44px] min-h-[44px] rounded-full bg-white/95 hover:bg-white text-slate-400 hover:text-primary-600 shadow-md transition-all flex items-center justify-center"
                  aria-label="Share product link"
                  title="Share product link"
                >
                  <Share2 className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>

              {/* Mobile Thumbnail Carousel Rail (< sm) */}
              <div className="flex sm:hidden items-center gap-2 mt-3 overflow-x-auto no-scrollbar pb-1" aria-label="Image gallery thumbnails">
                {product.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    aria-label={`View ${product.title} angle ${idx + 1}`}
                    className={`w-12 h-12 rounded-lg p-0.5 border-2 transition-all flex-shrink-0 bg-white overflow-hidden ${
                      selectedImageIndex === idx
                        ? 'border-primary-600 shadow-sm ring-1 ring-primary-400'
                        : 'border-slate-200'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* DENSE ACTION BUTTONS (Add to Cart & Buy Now) */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <motion.button
              type="button"
              onClick={handleAddToCart}
              whileTap={{ scale: 0.98 }}
              className={`py-3.5 px-4 min-h-[48px] rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md focus:outline-none ${isAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20'
                }`}
            >
              <AnimatePresence mode="wait">
                {isAdded ? (
                  <motion.div
                    key="pdp-added"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Added to Cart!</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="pdp-default"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" strokeWidth={2} />
                    <span>ADD TO CART</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            <button
              type="button"
              onClick={handleBuyNow}
              className="py-3.5 px-4 min-h-[48px] rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
            >
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>BUY NOW</span>
            </button>
          </div>

          {/* 1. WHATSAPP ORDER / INQUIRY BUTTON (Must be strictly above both badges) */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 active:scale-[0.98]"
            aria-label="Order / Inquiry on WhatsApp"
          >
            <MessageCircle className="w-5 h-5 text-white" />
            <span>Order / Inquiry on WhatsApp</span>
          </a>

          {/* 2 & 3. BADGES DIRECTLY BELOW WHATSAPP: 10-Day Replacement FIRST, Premium Box SECOND */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
            <button
              type="button"
              onClick={() => setIsReplacementModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-primary-400 bg-slate-50 hover:bg-primary-50/50 text-xs font-bold text-slate-700 hover:text-primary-700 transition-all cursor-pointer shadow-2xs group"
              aria-label="View 10-Day Replacement Policy"
            >
              <RotateCcw className="w-4 h-4 text-primary-600 group-hover:-rotate-45 transition-transform" />
              <span>10-Day Replacement Policy</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBoxUpgradeModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-amber-200 hover:border-amber-400 bg-amber-50/70 hover:bg-amber-100/70 text-xs font-bold text-amber-900 transition-all cursor-pointer shadow-2xs group"
              aria-label="View Premium Box Upgrade"
            >
              <Package className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
              <span>{activeBoxOption ? activeBoxOption.name : 'Premium Box'}</span>
              <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-200/70 px-1.5 py-0.5 rounded">
                +{activeBoxOption ? `₹${activeBoxOption.price}` : '₹299'}
              </span>
              {activeBoxOption && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  Selected
                </span>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: STICKY BUY-BOX ON DESKTOP & INFO */}
        <div className="md:col-span-6 lg:col-span-7 lg:sticky lg:top-24 bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-5">
          {/* Title and Brand Header */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">
                {product.brand}
              </span>
              {product.isAssured && <TrustBadge size="md" />}
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-slate-950 font-sans leading-snug">
              {product.title}
            </h1>

            {/* SKU and Ratings */}
            <div className="mt-2.5 flex items-center gap-3 flex-wrap text-xs">
              <RatingBadge
                rating={product.rating}
                ratingCount={product.ratingCount}
                reviewCount={product.reviewCount}
                showCount
                size="md"
              />
              <span className="text-slate-300">|</span>
              <span className="text-slate-400 font-mono text-[11px]">
                SKU: <strong className="text-slate-600">{product.sku}</strong>
              </span>
            </div>
          </div>

          {/* PRICE BLOCK (JetBrains Mono tabular-nums + Warm Amber Pill) */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80">
            <div className="text-xs font-bold text-emerald-600 mb-1">
              Special Festive Offer Price
            </div>
            <PriceDisplay
              price={effectivePrice}
              originalPrice={effectiveOriginalPrice}
              discountPercent={product.discountPercent}
              size="xl"
            />
            {activeBoxOption && (
              <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900 w-fit">
                <Package className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-semibold">Includes {activeBoxOption.name} (+₹{activeBoxOption.price})</span>
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Inclusive of all taxes. Free shipping on this order.
            </p>
          </div>

          {/* BANK OFFERS ACCORDION / LIST */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-primary-600" />
              <span>Available Bank Offers & Discounts</span>
            </h3>

            <div className="space-y-2 text-xs">
              {product.bankOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="p-2.5 rounded-lg border border-primary-100 bg-primary-50/40 flex items-start gap-2"
                >
                  <span className="font-bold text-primary-700 bg-primary-100 px-1.5 py-0.5 rounded text-[10px] flex-shrink-0 mt-0.5">
                    {offer.bank}
                  </span>
                  <p className="text-slate-700 leading-snug">
                    <strong>{offer.title}:</strong> {offer.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* COLOR SWATCH SELECTOR */}
          {product.colors && product.colors.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-xs">
                <span className="text-slate-500 font-medium">Color:</span>
                <span className="font-bold text-slate-900">{selectedColor}</span>
              </div>
              <div className="flex items-center gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColor(color.name)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${selectedColor === color.name
                        ? 'border-primary-600 ring-2 ring-primary-200 scale-105'
                        : 'border-slate-300 hover:border-slate-400'
                      }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {selectedColor === color.name && (
                      <Check className="w-4 h-4 text-white drop-shadow stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STORAGE / SIZE VARIANT SELECTOR */}
          {product.variants && product.variants.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-xs">
                <span className="text-slate-500 font-medium">{product.variants[0].name}:</span>
                <span className="font-bold text-slate-900">{selectedVariant}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setSelectedVariant(v.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${selectedVariant === v.value
                        ? 'border-primary-600 bg-primary-50 text-primary-700 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                  >
                    {v.value}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* DELIVERY PINCODE CHECKER */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary-600" />
                <span>Delivery & Services</span>
              </span>
              <span className="text-[11px] text-slate-500">Check availability</span>
            </div>

            <form onSubmit={handleCheckPincode} className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="postal-code"
                maxLength={6}
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value)}
                placeholder="Enter 6-digit Indian Pincode"
                className="w-48 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-primary-500 bg-white"
              />
              <button
                type="submit"
                disabled={isCheckingPincode}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold rounded-lg transition-colors min-h-[44px] sm:min-h-0 flex items-center justify-center min-w-[62px]"
              >
                {isCheckingPincode ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  'Check'
                )}
              </button>
            </form>

            {pincodeResult?.serviceable && pincodeResult.city && pincodeResult.state ? (
              <div className="text-xs text-slate-700 space-y-1 pt-1">
                <p className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>
                    Delivery by <strong>{getDeliveryDateString(pincodeResult.estimatedDays || 2)}</strong> to {pincodeResult.city}, {pincodeResult.state}
                  </span>
                </p>
                <div className="flex items-center gap-4 text-slate-500 text-[11px] pt-0.5">
                  <span>Free Delivery | Standard Shipping</span>
                  <span>
                    {pincodeResult.codAvailable !== false
                      ? 'Cash on Delivery Available'
                      : 'Prepaid Orders Only'}
                  </span>
                </div>
              </div>
            ) : pincodeResult && !pincodeResult.serviceable ? (
              <p className="text-xs text-rose-600 flex items-center gap-1.5 pt-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{pincodeResult.error || 'Please enter a valid 6-digit pincode'}</span>
              </p>
            ) : null}
          </div>

          {/* HIGHLIGHTS BULLET LIST */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Key Highlights
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600">
              {product.highlights.map((highlight: string, idx: number) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-600 mt-1.5 flex-shrink-0" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 3. TABS: SPECIFICATIONS / REVIEWS / Q&A */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 bg-slate-50/60 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('specs')}
            className={`px-6 py-3.5 border-b-2 transition-all ${activeTab === 'specs'
                ? 'border-primary-600 text-primary-700 bg-white'
                : 'border-transparent hover:text-slate-950'
              }`}
          >
            Specifications
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-3.5 border-b-2 transition-all ${activeTab === 'reviews'
                ? 'border-primary-600 text-primary-700 bg-white'
                : 'border-transparent hover:text-slate-950'
              }`}
          >
            Ratings & Reviews ({product.reviews?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-6 py-3.5 border-b-2 transition-all ${activeTab === 'faq'
                ? 'border-primary-600 text-primary-700 bg-white'
                : 'border-transparent hover:text-slate-950'
              }`}
          >
            Questions & Answers
          </button>
        </div>

        {/* Tab 1: Specifications Table */}
        {activeTab === 'specs' && (
          <div className="p-6 space-y-6 text-xs">
            {Object.entries(product.specs || {}).map(([groupTitle, specsGroup]) => (
              <div key={groupTitle}>
                <h4 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2 mb-3">
                  {groupTitle}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                  {Object.entries((specsGroup as Record<string, string>) || {}).map(([key, val]) => (
                    <div key={key} className="flex py-1 border-b border-slate-50">
                      <span className="w-1/3 text-slate-400 font-medium">{key}</span>
                      <span className="w-2/3 text-slate-800 font-semibold">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Customer Ratings & Reviews */}
        {activeTab === 'reviews' && (
          <div className="p-6 space-y-6">
            {/* Rating Summary Breakdown */}
            <div className="flex flex-col md:flex-row items-center gap-8 pb-6 border-b border-slate-100">
              <div className="text-center md:text-left">
                <div className="text-4xl font-extrabold text-slate-950 font-mono">
                  {product.rating.toFixed(1)}
                  <span className="text-lg text-slate-400"> / 5</span>
                </div>
                <div className="mt-1">
                  <RatingBadge rating={product.rating} size="md" />
                </div>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  {product.ratingCount} verified ratings & {product.reviewCount} reviews
                </p>
              </div>

              {/* Distribution bars */}
              <div className="flex-1 w-full max-w-md space-y-1.5 text-xs">
                {[
                  { star: 5, pct: 72 },
                  { star: 4, pct: 18 },
                  { star: 3, pct: 6 },
                  { star: 2, pct: 2 },
                  { star: 1, pct: 2 },
                ].map((row) => (
                  <div key={row.star} className="flex items-center gap-2">
                    <span className="w-6 font-mono text-slate-500">{row.star}★</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                    <span className="w-8 font-mono text-slate-400 text-right">{row.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Reviews */}
            <div className="space-y-4">
              {product.reviews && product.reviews.length > 0 ? (
                product.reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-lg bg-slate-50/70 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <RatingBadge rating={rev.rating} size="sm" />
                        <span className="font-extrabold text-slate-900">{rev.title}</span>
                      </div>
                      <span className="text-slate-400 font-mono text-[11px]">{rev.date}</span>
                    </div>

                    <p className="text-slate-700 leading-relaxed my-2">{rev.comment}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{rev.author}</span>
                        {rev.verifiedBuyer && (
                          <span className="flex items-center gap-0.5 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Verified Buyer, {rev.location}</span>
                          </span>
                        )}
                      </div>

                      <button className="flex items-center gap-1 hover:text-primary-600 transition-colors">
                        <ThumbsUp className="w-3 h-3" />
                        <span>Helpful ({rev.likes})</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No written reviews yet for this SKU.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Q&A */}
        {activeTab === 'faq' && (
          <div className="p-6 space-y-4 text-xs">
            <div className="border-b border-slate-100 pb-3">
              <p className="font-bold text-slate-900">Q: Does this include official Indian manufacturer warranty?</p>
              <p className="text-slate-600 mt-1">
                A: Yes! All items sold with the HodaAssured badge come with official brand warranty valid across all authorized service centres in India.
              </p>
            </div>
            <div className="border-b border-slate-100 pb-3">
              <p className="font-bold text-slate-900">Q: Is open-box delivery available at my pincode?</p>
              <p className="text-slate-600 mt-1">
                A: Open box delivery is automatically provided for high-value electronics and smartphones across major cities. The delivery partner opens the package in front of you before sharing the OTP.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4. SIMILAR PRODUCTS STRIP */}
      {similarProducts.length > 0 && (
        <ProductStrip
          title="Similar Products You Might Like"
          subtitle="Alternative recommendations from the same category"
          products={similarProducts}
          onSelectProduct={onSelectProduct}
        />
      )}

      {/* 5. MOBILE STICKY BOTTOM BUY-BOX (< md) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3 safe-area-inset-bottom">
        <div className="flex flex-col justify-center min-w-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Price</span>
          <div className="text-base font-extrabold text-slate-950 font-mono tracking-tight">
            ₹{effectivePrice.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddToCart}
            className="px-3.5 py-2.5 min-h-[44px] min-w-[44px] bg-primary-50 active:bg-primary-100 text-primary-700 font-bold text-xs rounded-xl border border-primary-200 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
            aria-label="Add product to cart"
          >
            <ShoppingCart className="w-4 h-4" strokeWidth={2.2} />
            <span>Add</span>
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            className="px-5 py-2.5 min-h-[44px] bg-primary-600 active:bg-primary-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-primary-500/20 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
            aria-label="Buy product now"
          >
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>Buy Now</span>
          </button>
        </div>
      </div>

      {/* POLICY & BOX UPGRADE MODALS */}
      <ReplacementPolicyModal
        isOpen={isReplacementModalOpen}
        onClose={() => setIsReplacementModalOpen(false)}
        productTitle={product.title}
        sku={product.sku}
      />

      <BoxUpgradeModal
        product={product}
        isOpen={isBoxUpgradeModalOpen}
        onClose={() => setIsBoxUpgradeModalOpen(false)}
        currentSelectedBox={activeBoxOption}
        onSelectBox={(box) => setSelectedBoxOption(box)}
      />
    </div>
  );
};
