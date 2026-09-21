export interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  badge: string;
  ctaText: string;
  categoryLink: string;
  bgGradient: string;
  image: string;
}

export const HERO_BANNERS: BannerSlide[] = [
  {
    id: 'hero-1',
    title: 'The Great HodaFest Sale',
    subtitle: 'Unreal deals on Flagship 5G Smartphones & Next-Gen Laptops',
    tag: 'LIMITED TIME DEAL',
    badge: 'Up to 60% Off',
    ctaText: 'Explore Flagship Deals',
    categoryLink: 'mobiles',
    bgGradient: 'from-slate-950 via-primary-950 to-primary-900',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=900&q=80',
  },
  {
    id: 'hero-2',
    title: 'Ultra Hi-Fi & ANC Audio',
    subtitle: 'Studio-grade sound from Sony, Apple, Bose & Sennheiser',
    tag: 'NEW LAUNCHES',
    badge: 'Extra ₹4,000 Off via Cards',
    ctaText: 'Upgrade Sound',
    categoryLink: 'electronics',
    bgGradient: 'from-slate-900 via-indigo-950 to-purple-950',
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=900&q=80',
  },
  {
    id: 'hero-3',
    title: 'Smart Home & OLED Cinema',
    subtitle: 'Experience true cinema at home with 4K OLED TVs & Dyson Tech',
    tag: 'SUPER VALUE DEALS',
    badge: 'No Cost EMI from ₹2,499/mo',
    ctaText: 'Shop Appliances',
    categoryLink: 'appliances',
    bgGradient: 'from-slate-950 via-slate-900 to-indigo-950',
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=900&q=80',
  },
];

export const PROMO_TILES = [
  {
    id: 'tile-2',
    title: 'HodaAssured Guarantee',
    desc: '100% Genuine Products, 7-Day Easy Replacement',
    code: 'ASSURED',
    tag: 'TRUSTED',
  },
  {
    id: 'tile-3',
    title: 'SuperFast 24H Delivery',
    desc: 'Available in 120+ Major Cities across India',
    code: 'EXPRESS',
    tag: 'SPEED',
  },
];
