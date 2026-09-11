export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  subcategories: string[];
  featuredImage: string;
  badge?: string;
}

export const CATEGORIES: CategoryItem[] = [
  {
    id: 'mobiles',
    name: 'Mobiles & Tablets',
    icon: 'Smartphone',
    badge: 'Extra ₹3000 Off',
    featuredImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&q=80',
    subcategories: ['Flagship Phones', '5G Smartphones', 'iPhones', 'Budget Phones', 'Tablets & iPads', 'Mobile Accessories'],
  },
  {
    id: 'electronics',
    name: 'Electronics & Laptops',
    icon: 'Laptop',
    badge: 'Up to 50% Off',
    featuredImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
    subcategories: ['Gaming Laptops', 'Thin & Light Laptops', 'Smartwatches', 'Audio & Headphones', 'PC Gaming', 'Cameras & Drones'],
  },
  {
    id: 'appliances',
    name: 'TVs & Appliances',
    icon: 'Tv',
    badge: 'Super Deals',
    featuredImage: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&q=80',
    subcategories: ['Smart 4K TVs', 'Air Conditioners', 'Refrigerators', 'Washing Machines', 'Kitchen Chimneys', 'Microwave Ovens'],
  },
  {
    id: 'fashion',
    name: 'Fashion & Footwear',
    icon: 'Shirt',
    badge: 'Min 60% Off',
    featuredImage: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&q=80',
    subcategories: ["Men's Clothing", "Women's Ethnic", "Sneakers & Casuals", "Watches & Bags", "Sports Apparel", "Winter Wear"],
  },
  {
    id: 'home',
    name: 'Home & Furniture',
    icon: 'Armchair',
    badge: 'Starting ₹499',
    featuredImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
    subcategories: ['Ergonomic Chairs', 'Sofas & Recliners', 'Study Desks', 'Cookware & Dining', 'Mattresses', 'Home Lighting'],
  },
  {
    id: 'beauty',
    name: 'Beauty & Grooming',
    icon: 'Sparkles',
    featuredImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80',
    subcategories: ['Skincare Routine', 'Fragrances & Colognes', 'Men Grooming Trimmers', 'Haircare Essentials', 'Makeup Kits'],
  },
  {
    id: 'sports',
    name: 'Sports & Fitness',
    icon: 'Dumbbell',
    featuredImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80',
    subcategories: ['Treadmills & Gym', 'Yoga Mats & Resistance', 'Cricket & Badminton', 'Cycling & Helmets', 'Smart Fitness Bands'],
  },
];
