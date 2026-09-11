import { Product } from '../types';
import { getProductSlug } from './slugs';

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'HodaHub',
    url: 'https://hodahub.in',
    logo: 'https://hodahub.in/hodahub-logo.png',
    description: "India's next-generation e-commerce platform offering 100% genuine products, HodaAssured quality, and express delivery.",
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-1800-202-6000',
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: ['en', 'hi'],
    },
    sameAs: [
      'https://twitter.com/hodahub',
      'https://facebook.com/hodahub',
      'https://instagram.com/hodahub',
    ],
  };
}

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'HodaHub',
    url: 'https://hodahub.in',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://hodahub.in/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generateProductSchema(product: Product) {
  const slug = getProductSlug(product);
  const cleanDescription = (product.highlights?.join('. ') || product.title).slice(0, 160);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: product.images,
    description: cleanDescription,
    sku: product.sku || product.id,
    mpn: product.sku || product.id,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'HodaHub',
    },
    aggregateRating: product.ratingCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating.toFixed(1),
      reviewCount: product.reviewCount || 1,
      bestRating: '5',
      worstRating: '1',
    } : undefined,
    offers: {
      '@type': 'Offer',
      url: `https://hodahub.in/product/${slug}`,
      priceCurrency: 'INR',
      price: product.price,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'HodaHub Retail',
      },
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `https://hodahub.in${item.url}`,
    })),
  };
}
