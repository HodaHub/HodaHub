export interface BankOffer {
  id: string;
  bank: string;
  title: string;
  description: string;
  code?: string;
  discountAmount?: number;
  minOrder?: number;
}

export interface ProductVariant {
  name: string;
  value: string;
  inStock: boolean;
  priceOffset?: number;
}

export interface ProductColor {
  name: string;
  hex: string;
  inStock: boolean;
}

export interface ProductReview {
  id: string;
  author: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  verifiedBuyer: boolean;
  likes: number;
  location: string;
}

export interface BoxOption {
  id: string;
  name: string;
  image: string;
  price: number;
  description?: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  sku: string;
  title: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  ratingCount: number;
  reviewCount: number;
  isAssured: boolean; // HodaAssured
  inStock: boolean;
  stockCount: number;
  images: string[];
  highlights: string[];
  specs: Record<string, Record<string, string>>;
  bankOffers: BankOffer[];
  warranty: string;
  deliveryDays: number;
  colors?: ProductColor[];
  sizes?: string[];
  variants?: ProductVariant[];
  description?: string;
  tag?: 'Deal of the Day' | 'Top Pick' | 'Trending' | 'Best Seller' | 'Mega Deal';
  reviews?: ProductReview[];
  availableBoxOptionIds?: string[];
  availableBoxOptions?: BoxOption[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedVariant?: string;
  selectedBox?: BoxOption | null;
  addedAt: number;
}

export type SortOption =
  | 'popularity'
  | 'price-asc'
  | 'price-desc'
  | 'rating'
  | 'discount'
  | 'newest';

export interface FilterState {
  category: string;
  priceRange: [number, number];
  selectedBrands: string[];
  minRating: number;
  discountRange: number;
  inStockOnly: boolean;
  assuredOnly: boolean;
  sortBy: SortOption;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  pincode: string;
  locality: string;
  addressLine: string;
  city: string;
  state: string;
  type: 'HOME' | 'WORK';
  isDefault: boolean;
}

export interface Order {
  orderId: string;
  createdAt: string;
  items: CartItem[];
  shippingAddress: Address;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  couponDiscount: number;
  deliveryFee: number;
  finalAmount: number;
  estimatedDelivery: string;
  trackingStatus: 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
}
