export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  subcategories: string[];
  featuredImage: string;
  badge?: string;
}

export const CATEGORIES: CategoryItem[] = [];
