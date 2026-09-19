import { Product } from '../types';
import { useProductsStore } from '../store/useProductsStore';
import { supabase } from '../lib/supabase';

export interface SearchHit {
  id: string;
  title: string;
  slug?: string;
  brand: string;
  category: string;
  categoryName: string;
  subcategory?: string;
  price: number;
  mrp: number;
  discountPercent?: number;
  ratingAvg: number;
  ratingCount?: number;
  images: string[];
  inStock: boolean;
  isAssured?: boolean;
  _formatted?: {
    title?: string;
    brand?: string;
    categoryName?: string;
    description?: string;
  };
}

export interface SearchResponse {
  query: string;
  hits: SearchHit[];
  totalHits: number;
  processingTimeMs: number;
  source: string;
}

/**
 * Levenshtein distance for client-side offline typo tolerance fallback
 */
function clientLevenshtein(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix = Array.from({ length: bn + 1 }, (_, i) => [i]);
  for (let j = 0; j <= an; j++) matrix[0][j] = j;

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[bn][an];
}

/**
 * Offline client-side search fallback with typo tolerance ("moble" -> "mobile")
 */
function localFallbackSearch(query: string, limit: number): SearchResponse {
  const start = performance.now();
  const clean = query.trim().toLowerCase();
  const tokens = clean.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return {
      query,
      hits: [],
      totalHits: 0,
      processingTimeMs: Math.round(performance.now() - start),
      source: 'client-fallback',
    };
  }

  const pool = useProductsStore.getState().products || [];

  const scored = pool.map((prod) => {
    const fields = [
      { text: prod.title.toLowerCase(), weight: 10 },
      { text: prod.brand.toLowerCase(), weight: 8 },
      { text: prod.category.toLowerCase(), weight: 7 },
    ];

    let totalScore = 0;
    let matchedCount = 0;
    const matchedWords = new Set<string>();

    for (const token of tokens) {
      let tokenMatched = false;
      let bestWeight = 0;

      for (const { text, weight } of fields) {
        const words = text.split(/[^a-z0-9]+/).filter(Boolean);
        for (const word of words) {
          if (word === token) {
            bestWeight = Math.max(bestWeight, weight * 10);
            tokenMatched = true;
            matchedWords.add(word);
            break;
          } else if (word.startsWith(token)) {
            bestWeight = Math.max(bestWeight, weight * 7);
            tokenMatched = true;
            matchedWords.add(word);
          } else if (token.length >= 3 && word.includes(token)) {
            bestWeight = Math.max(bestWeight, weight * 5);
            tokenMatched = true;
            matchedWords.add(word);
          } else {
            const maxAllowed = token.length >= 8 ? 2 : token.length >= 4 ? 1 : 0;
            if (maxAllowed > 0 && Math.abs(word.length - token.length) <= maxAllowed) {
              const dist = clientLevenshtein(token, word);
              if (dist <= maxAllowed) {
                bestWeight = Math.max(bestWeight, weight * (6 - dist * 2));
                tokenMatched = true;
                matchedWords.add(word);
              }
            }
          }
        }
      }

      if (tokenMatched) {
        matchedCount++;
        totalScore += bestWeight;
      }
    }

    if (matchedCount >= Math.min(tokens.length, 1)) {
      totalScore += (prod.rating || 4) * 2;
      return { prod, score: totalScore, matchedWords: Array.from(matchedWords) };
    }
    return null;
  })
    .filter(Boolean)
    .sort((a, b) => (b?.score || 0) - (a?.score || 0)) as Array<{
    prod: Product;
    score: number;
    matchedWords: string[];
  }>;

  const hits: SearchHit[] = scored.slice(0, limit).map(({ prod, matchedWords }) => {
    const highlight = (text: string) => {
      let res = text;
      for (const w of matchedWords) {
        if (w.length >= 2) {
          const regex = new RegExp(`(${w})`, 'gi');
          res = res.replace(regex, '<mark class="hodahub-highlight">$1</mark>');
        }
      }
      return res;
    };

    return {
      id: prod.id,
      title: prod.title,
      slug: prod.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      brand: prod.brand,
      category: prod.category,
      categoryName: prod.category,
      price: prod.price,
      mrp: prod.originalPrice || prod.price,
      discountPercent: prod.discountPercent,
      ratingAvg: prod.rating,
      ratingCount: prod.reviewCount || prod.ratingCount,
      images: prod.images,
      inStock: prod.inStock,
      isAssured: prod.isAssured,
      _formatted: {
        title: highlight(prod.title),
        brand: highlight(prod.brand),
        categoryName: highlight(prod.category),
      },
    };
  });

  return {
    query,
    hits,
    totalHits: scored.length,
    processingTimeMs: Math.round(performance.now() - start),
    source: 'client-fallback',
  };
}

/**
 * Execute predictive search against HodaHub Supabase API / client catalog
 * with automatic abort cancellation and fallback resilience.
 */
export async function searchHodaHub(
  query: string,
  options: { limit?: number; category?: string; signal?: AbortSignal } = {}
): Promise<SearchResponse> {
  const { limit = 6, category, signal } = options;
  const clean = query.trim();

  if (!clean) {
    return {
      query: '',
      hits: [],
      totalHits: 0,
      processingTimeMs: 0,
      source: 'empty',
    };
  }

  try {
    const { data: supaHits, error: supaErr } = await supabase
      .from('products')
      .select('id, title, slug, price, mrp, brand, rating_avg, rating_count, stock, product_images(url), categories(name, slug)')
      .eq('is_active', true)
      .ilike('title', `%${clean}%`)
      .limit(limit);

    if (!supaErr && supaHits && supaHits.length > 0) {
      return {
        query: clean,
        hits: supaHits.map((p: any) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          brand: p.brand || 'HodaHub',
          category: p.categories?.slug || 'electronics',
          categoryName: p.categories?.name || 'Electronics',
          price: Number(p.price),
          mrp: Number(p.mrp),
          discountPercent: Math.round(((p.mrp - p.price) / p.mrp) * 100),
          ratingAvg: Number(p.rating_avg) || 4.8,
          ratingCount: p.rating_count || 10,
          images: p.product_images?.map((img: any) => img.url) || ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'],
          inStock: p.stock > 0,
          isAssured: true,
        })),
        totalHits: supaHits.length,
        processingTimeMs: 12,
        source: 'supabase',
      };
    }
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
  }

  // Graceful fallback to client index
  return localFallbackSearch(clean, limit);
}
