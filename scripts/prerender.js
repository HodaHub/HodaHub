import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, '../dist');
const templatePath = path.join(distDir, 'index.html');

if (!fs.existsSync(templatePath)) {
  console.error('Error: dist/index.html not found. Run vite build first.');
  process.exit(1);
}

const template = fs.readFileSync(templatePath, 'utf-8');

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Load products from data
const productsFilePath = path.join(__dirname, '../src/data/products.ts');
const productsContent = fs.readFileSync(productsFilePath, 'utf-8');

// Parse only main products (id starts with hoda-prod-)
const productBlocks = productsContent.split(/\{\s*id:\s*'(hoda-prod-\d+)'/);
const products = [];
for (let i = 1; i < productBlocks.length; i += 2) {
  const id = productBlocks[i];
  const block = productBlocks[i + 1] || '';
  const title = block.match(/title:\s*'([^']+)'/)?.[1] || id;
  const brand = block.match(/brand:\s*'([^']+)'/)?.[1] || 'HodaHub';
  const category = block.match(/category:\s*'([^']+)'/)?.[1] || 'electronics';
  const price = Number(block.match(/price:\s*(\d+)/)?.[1] || 0);
  const rating = Number(block.match(/rating:\s*([\d.]+)/)?.[1] || 4.5);
  const image = block.match(/images:\s*\[\s*'([^']+)'/)?.[1] || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80';
  const highlightsMatch = block.match(/highlights:\s*\[([\s\S]*?)\]/);
  const desc = highlightsMatch
    ? highlightsMatch[1].replace(/['\n\r\t]/g, '').trim().slice(0, 150)
    : `${title} online on HodaHub with genuine warranty and express delivery.`;
  const slug = `${slugify(title)}-${id}`;
  products.push({ id, title, brand, category, price, rating, image, desc, slug });
}

const categories = [
  { id: 'mobiles', name: 'Mobiles & Smartphones', desc: 'Shop top flagship and budget smartphones with verified brand warranty on HodaHub.' },
  { id: 'electronics', name: 'Electronics & Laptops', desc: 'Explore high-performance laptops, tablets, and audio gear on HodaHub.' },
  { id: 'appliances', name: 'TV & Home Appliances', desc: 'Discover smart TVs, air conditioners, and kitchen appliances on HodaHub.' },
  { id: 'fashion', name: 'Fashion & Apparel', desc: 'Shop trending clothing, footwear, and accessories from leading fashion brands on HodaHub.' },
  { id: 'home', name: 'Home & Furniture', desc: 'Find modern furniture, ergonomic seating, and home decor items on HodaHub.' },
];

const contentPages = [
  { slug: 'about-us', title: 'About Us', desc: "Learn about HodaHub, India's next-generation e-commerce platform delivering 100% genuine products with HodaAssured trust." },
  { slug: 'contact-us', title: 'Contact Customer Support', desc: 'Contact HodaHub 24x7 customer support via email, toll-free phone, or headquarters desk.' },
  { slug: 'careers', title: 'Careers at HodaHub', desc: 'Join the team shaping modern Indian digital commerce. Explore job openings at HodaHub.' },
  { slug: 'hodahub-stories', title: 'HodaHub Stories', desc: 'Customer experiences, merchant milestones, and tech innovations behind HodaHub.' },
  { slug: 'press-media', title: 'Press & Media', desc: 'Official newsroom, press releases, and media announcements from HodaHub.' },
  { slug: 'corporate-information', title: 'Corporate Information', desc: 'Corporate governance, registered entities, and investor disclosures for HodaHub.' },
  { slug: 'payments-info', title: 'Payments & Security', desc: 'Information about UPI, credit cards, debit cards, EMI, and cash on delivery security at HodaHub.' },
  { slug: 'shipping-pincodes', title: 'Shipping Pincodes & Delivery', desc: 'Check shipping timelines, express logistics networks, and serviceable Indian postal pincodes.' },
  { slug: 'cancellation-returns', title: 'Cancellations & Returns Policy', desc: 'Easy 7-day doorstep replacement, return policies, and instant refund timelines at HodaHub.' },
  { slug: 'faq', title: 'Frequently Asked Questions', desc: 'Frequently asked questions regarding orders, payments, tracking, and warranty at HodaHub.' },
  { slug: 'report-infringement', title: 'Report Infringement', desc: 'HodaHub intellectual property rights protection and trademark infringement reporting.' },
  { slug: 'terms-of-use', title: 'Terms of Use', desc: 'Official user agreement and platform usage terms governing shopping on HodaHub.' },
  { slug: 'security', title: 'Security & Safety', desc: 'Learn how HodaHub protects customer data, payment encryption, and account credentials.' },
  { slug: 'privacy-policy', title: 'Privacy Policy', desc: 'HodaHub transparency disclosures regarding user data collection and protection standards.' },
  { slug: 'sitemap', title: 'Platform Sitemap', desc: 'Directory of all product categories, brand stores, and support pages on HodaHub.' },
  { slug: 'grievance-redressal', title: 'Grievance Redressal Mechanism', desc: 'Designated grievance officer contact information and dispute resolution process under Consumer Protection Act.' },
  { slug: 'track-order', title: 'Track Your Order', desc: 'Track your HodaHub shipment status in real-time with live courier updates.' },
];

function generateSnapshotHtml({ title, description, canonicalUrl, ogType = 'website', ogImage, jsonLd }) {
  let html = template;

  // Replace Title
  const titleTag = `<title>${title}</title>`;
  html = html.replace(/<title>.*?<\/title>/i, titleTag);

  // Injected Meta tags & JSON-LD
  const metaTags = `
    <meta name="description" content="${description}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:site_name" content="HodaHub" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${ogImage || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80'}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@hodahub" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${ogImage || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80'}" />
    ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
  `;

  html = html.replace('</head>', `${metaTags}\n  </head>`);
  return html;
}

function writeSnapshot(subPath, html) {
  const targetDir = path.join(distDir, subPath);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf-8');
}

let generatedCount = 0;

// 1. Snapshot Home Page
const homeJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'HodaHub',
    url: 'https://hodahub.in',
    logo: 'https://hodahub.in/hodahub-logo.png',
    description: "India's next-generation e-commerce platform offering 100% genuine products, HodaAssured quality, and express delivery.",
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'HodaHub',
    url: 'https://hodahub.in',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://hodahub.in/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  },
];

const homeHtml = generateSnapshotHtml({
  title: "HodaHub | India's Online Shopping Destination for Electronics, Mobiles & Fashion",
  description: 'Shop verified electronics, flagship smartphones, appliances, and fashion on HodaHub. Enjoy fast delivery, 100% genuine products, and HodaAssured quality warranty.',
  canonicalUrl: 'https://hodahub.in',
  jsonLd: homeJsonLd,
});
fs.writeFileSync(path.join(distDir, 'index.html'), homeHtml, 'utf-8');
generatedCount++;

// 2. Snapshot Categories
categories.forEach((cat) => {
  const catJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://hodahub.in/' },
      { '@type': 'ListItem', position: 2, name: cat.name, item: `https://hodahub.in/category/${cat.id}` },
    ],
  };

  const html = generateSnapshotHtml({
    title: `${cat.name} | Buy Online at Best Price - HodaHub`,
    description: cat.desc,
    canonicalUrl: `https://hodahub.in/category/${cat.id}`,
    jsonLd: catJsonLd,
  });

  writeSnapshot(`category/${cat.id}`, html);
  generatedCount++;
});

// 3. Snapshot Products
products.forEach((prod) => {
  const prodJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: prod.title,
    brand: { '@type': 'Brand', name: prod.brand || 'HodaHub' },
    sku: prod.id,
    offers: {
      '@type': 'Offer',
      url: `https://hodahub.in/product/${prod.slug}`,
      priceCurrency: 'INR',
      price: prod.price,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'HodaHub Retail' },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: prod.rating.toFixed(1),
      reviewCount: 45,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://hodahub.in/' },
      { '@type': 'ListItem', position: 2, name: prod.category, item: `https://hodahub.in/category/${prod.category}` },
      { '@type': 'ListItem', position: 3, name: prod.title, item: `https://hodahub.in/product/${prod.slug}` },
    ],
  };

  const html = generateSnapshotHtml({
    title: `${prod.title} - Best Price Online | HodaHub`,
    description: `Buy ${prod.title} online at best price in India on HodaHub. 100% Genuine, HodaAssured warranty and fast shipping.`,
    canonicalUrl: `https://hodahub.in/product/${prod.slug}`,
    ogType: 'product',
    jsonLd: [prodJsonLd, breadcrumbJsonLd],
  });

  writeSnapshot(`product/${prod.slug}`, html);
  // Also support direct ID routing snapshot: /product/:id
  writeSnapshot(`product/${prod.id}`, html);
  generatedCount += 2;
});

// 4. Snapshot Content Pages
contentPages.forEach((page) => {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://hodahub.in/' },
      { '@type': 'ListItem', position: 2, name: page.title, item: `https://hodahub.in/${page.slug}` },
    ],
  };

  const html = generateSnapshotHtml({
    title: `${page.title} | HodaHub`,
    description: page.desc,
    canonicalUrl: `https://hodahub.in/${page.slug}`,
    jsonLd: breadcrumbJsonLd,
  });

  writeSnapshot(page.slug, html);
  generatedCount++;
});

console.log(`✓ HodaHub prerendering completed: generated ${generatedCount} static HTML shells with meta tags & JSON-LD schema in dist/`);
