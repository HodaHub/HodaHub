import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'product' | 'article';
  structuredData?: Record<string, any> | Array<Record<string, any>>;
  noindex?: boolean;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonicalUrl,
  ogImage = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80',
  ogType = 'website',
  structuredData,
  noindex = false,
}) => {
  // Ensure formatted title includes HodaHub
  const fullTitle = title.includes('HodaHub')
    ? title
    : `${title} | Buy Online at Best Price - HodaHub`;

  // Truncate description to 160 chars max
  const cleanDescription = description.length > 160
    ? `${description.slice(0, 157)}...`
    : description;

  // Clean canonical without query params or trailing slash
  const cleanCanonical = canonicalUrl
    ? canonicalUrl.split('?')[0].replace(/\/$/, '')
    : undefined;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={cleanDescription} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* Canonical Link */}
      {cleanCanonical && <link rel="canonical" href={cleanCanonical} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="HodaHub" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={cleanDescription} />
      {cleanCanonical && <meta property="og:url" content={cleanCanonical} />}
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@hodahub" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={cleanDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};
