import { Product } from '../types';
import { PRODUCTS } from '../data/products';
import { CATEGORIES } from '../data/categories';
import { useProductsStore } from '../store/useProductsStore';
import { useCategoriesStore } from '../store/useCategoriesStore';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getProductSlug(product: Product): string {
  const baseSlug = slugify(product.title);
  // include product id suffix to ensure 100% uniqueness
  return `${baseSlug}-${product.id}`;
}

export function findProductBySlug(slug: string): Product | undefined {
  if (!slug) return undefined;
  const liveProds = useProductsStore.getState().products;
  const list = liveProds && liveProds.length > 0 ? liveProds : PRODUCTS;

  // Direct match id, sku, title slug
  const directMatch = list.find(
    (p) =>
      p.id === slug ||
      (p as any)._id === slug ||
      p.sku?.toLowerCase() === slug.toLowerCase() ||
      getProductSlug(p) === slug ||
      slugify(p.title) === slug ||
      (p as any).slug === slug
  );
  if (directMatch) return directMatch;

  // Match by id suffix
  const foundBySuffix = list.find((p) => slug.endsWith(`-${p.id}`) || (p as any)._id && slug.endsWith(`-${(p as any)._id}`));
  if (foundBySuffix) return foundBySuffix;

  // Suffix matching or fuzzy title
  return list.find((p) => slugify(p.title).includes(slug) || slug.includes(slugify(p.title)));
}

export function getCategorySlug(categoryId: string): string {
  return slugify(categoryId);
}

export function findCategoryBySlug(slug: string) {
  if (!slug) return undefined;
  const cleanSlug = slugify(slug);

  // Check live dynamic categories first
  const dynamicCats = useCategoriesStore.getState().categories;
  const liveMatch = dynamicCats.find(
    (c) =>
      c.id === slug ||
      c.slug === slug ||
      slugify(c.slug) === cleanSlug ||
      slugify(c.name) === cleanSlug
  );
  if (liveMatch) return liveMatch;

  // Check static categories fallback
  return CATEGORIES.find(
    (c) => c.id === slug || slugify(c.name) === cleanSlug || slugify(c.id) === cleanSlug
  );
}
