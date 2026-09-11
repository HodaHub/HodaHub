import { BoxOption } from '../types';

export const DEFAULT_BOX_OPTIONS: BoxOption[] = [
  {
    id: 'box-opt-simple',
    name: 'Simple Box',
    price: 99,
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80',
    description: 'Eco-friendly sustainable craft packaging with recyclable protective bubble wrap.',
    isActive: true,
  },
  {
    id: 'box-opt-premium',
    name: 'Premium Box',
    price: 299,
    image: '/images/premium-box-upgrade.jpg',
    description: 'Authentic rigid matte black magnetic box, official tags, warranty card & manual booklet.',
    isActive: true,
  },
  {
    id: 'box-opt-deluxe',
    name: 'Collector\'s Wooden Box',
    price: 599,
    image: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=800&q=80',
    description: 'Luxury handcrafted walnut wood finish box with plush velvet interior lining and brass latch.',
    isActive: true,
  },
];

const LOCAL_STORAGE_KEY = 'hodahub_box_options';

export const getStoredBoxOptions = (): BoxOption[] => {
  if (typeof window === 'undefined') return DEFAULT_BOX_OPTIONS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_BOX_OPTIONS));
      return DEFAULT_BOX_OPTIONS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_BOX_OPTIONS;
  }
};

export const saveStoredBoxOptions = (options: BoxOption[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(options));
  } catch (err) {
    console.error('Failed to save box options to localStorage', err);
  }
};
