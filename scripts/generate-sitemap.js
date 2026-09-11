import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import product and category data from source files
const productsFilePath = path.join(__dirname, '../src/data/products.ts');
const categoriesFilePath = path.join(__dirname, '../src/data/categories.ts');

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Read and parse products
const productsContent = fs.readFileSync(productsFilePath, 'utf-8');
const productBlocks = productsContent.split(/\{\s*id:\s*'(hoda-prod-\d+)'/);
const products = [];
for (let i = 1; i < productBlocks.length; i += 2) {
  const id = productBlocks[i];
  const block = productBlocks[i + 1] || '';
  const titleMatch = block.match(/title:\s*'([^']+)'/);
  const title = titleMatch ? titleMatch[1] : id;
  const slug = `${slugify(title)}-${id}`;
  products.push({ id, title, slug });
}

const categories = [
  'mobiles',
  'electronics',
  'appliances',
  'fashion',
  'home',
];

const staticPages = [
  { url: '', priority: '1.0', changefreq: 'daily' },
  { url: 'track-order', priority: '0.8', changefreq: 'daily' },
  { url: 'about-us', priority: '0.6', changefreq: 'monthly' },
  { url: 'contact-us', priority: '0.6', changefreq: 'monthly' },
  { url: 'careers', priority: '0.5', changefreq: 'monthly' },
  { url: 'hodahub-stories', priority: '0.6', changefreq: 'weekly' },
  { url: 'press-media', priority: '0.5', changefreq: 'monthly' },
  { url: 'corporate-information', priority: '0.4', changefreq: 'yearly' },
  { url: 'faq', priority: '0.6', changefreq: 'weekly' },
  { url: 'shipping-pincodes', priority: '0.6', changefreq: 'weekly' },
  { url: 'payments-info', priority: '0.5', changefreq: 'monthly' },
  { url: 'cancellation-returns', priority: '0.5', changefreq: 'monthly' },
  { url: 'report-infringement', priority: '0.4', changefreq: 'yearly' },
  { url: 'terms-of-use', priority: '0.4', changefreq: 'yearly' },
  { url: 'security', priority: '0.4', changefreq: 'yearly' },
  { url: 'privacy-policy', priority: '0.4', changefreq: 'yearly' },
  { url: 'sitemap', priority: '0.5', changefreq: 'weekly' },
  { url: 'grievance-redressal', priority: '0.4', changefreq: 'yearly' },
];

const today = new Date().toISOString().split('T')[0];

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

// Static Pages
staticPages.forEach((page) => {
  xml += `  <url>
    <loc>https://hodahub.in/${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
});

// Category Pages
categories.forEach((cat) => {
  xml += `  <url>
    <loc>https://hodahub.in/category/${cat}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;
});

// Product Pages
products.forEach((prod) => {
  xml += `  <url>
    <loc>https://hodahub.in/product/${prod.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`;
});

xml += `</urlset>
`;

const outputPath = path.join(__dirname, '../public/sitemap.xml');
fs.writeFileSync(outputPath, xml, 'utf-8');

const distOutputPath = path.join(__dirname, '../dist/sitemap.xml');
if (fs.existsSync(path.join(__dirname, '../dist'))) {
  fs.writeFileSync(distOutputPath, xml, 'utf-8');
}

console.log(`✓ HodaHub sitemap.xml generated with ${staticPages.length + categories.length + products.length} URLs at public/sitemap.xml and dist/sitemap.xml`);
