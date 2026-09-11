import { Product } from '../types';
import { PRODUCTS } from '../data/products';
import { CATEGORIES } from '../data/categories';

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
  // First match direct slug or ID
  const directMatch = PRODUCTS.find(
    (p) => p.id === slug || getProductSlug(p) === slug || slugify(p.title) === slug
  );
  if (directMatch) return directMatch;

  // Match by id suffix
  const foundBySuffix = PRODUCTS.find((p) => slug.endsWith(`-${p.id}`));
  if (foundBySuffix) return foundBySuffix;

  // Fuzzy match title
  return PRODUCTS.find((p) => slugify(p.title).includes(slug) || slug.includes(slugify(p.title)));
}

export function getCategorySlug(categoryId: string): string {
  return slugify(categoryId);
}

export function findCategoryBySlug(slug: string) {
  if (!slug) return undefined;
  return CATEGORIES.find(
    (c) => c.id === slug || slugify(c.name) === slug || slugify(c.id) === slug
  );
}
