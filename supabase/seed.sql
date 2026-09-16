-- ============================================================================
-- HodaHub Initial Seed Data
-- ============================================================================

-- 1. SEED CATEGORIES
INSERT INTO public.categories (id, name, slug, image_url, sort_order)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Electronics & Gadgets', 'electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', 1),
  ('c1000000-0000-0000-0000-000000000002', 'Audio & Wearables', 'audio', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80', 2),
  ('c1000000-0000-0000-0000-000000000003', 'Smartphones & Tablets', 'mobiles', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80', 3),
  ('c1000000-0000-0000-0000-000000000004', 'Fashion & Apparel', 'fashion', 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80', 4),
  ('c1000000-0000-0000-0000-000000000005', 'Home & Living', 'home', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80', 5)
ON CONFLICT (id) DO UPDATE SET sort_order = EXCLUDED.sort_order;

-- 2. SEED BOX OPTIONS (HodaHub Signature Unboxing Collections)
INSERT INTO public.box_options (id, name, image_url, price, is_active)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Standard Eco Box', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80', 0.00, true),
  ('b1000000-0000-0000-0000-000000000002', 'HodaHub Premium Gift Box', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80', 149.00, true),
  ('b1000000-0000-0000-0000-000000000003', 'Festive Celebration Hamper', 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&q=80', 299.00, true)
ON CONFLICT (id) DO NOTHING;

-- 3. SEED PRODUCTS
INSERT INTO public.products (id, title, slug, description, price, mrp, category_id, brand, stock, sku, rating_avg, rating_count, is_active)
VALUES
  (
    'a1000000-0000-0000-0000-000000000001',
    'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    'sony-wh-1000xm5-wireless-headphones',
    'Industry-leading noise cancellation with two processors and 8 microphones. Up to 30 hours of battery life with quick charging.',
    28990.00,
    34990.00,
    'c1000000-0000-0000-0000-000000000002',
    'Sony',
    45,
    'HODA-SNY-XM5-BLK',
    4.8,
    342,
    true
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'Apple Watch Series 9 GPS 45mm Midnight',
    'apple-watch-series-9-gps-45mm',
    'S9 SiP enables a super-bright display and magic double-tap gesture. Advanced health, safety, and activity features.',
    41900.00,
    44900.00,
    'c1000000-0000-0000-0000-000000000001',
    'Apple',
    30,
    'HODA-APL-W9-45M',
    4.9,
    188,
    true
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'Logitech MX Master 3S Ergonomic Wireless Mouse',
    'logitech-mx-master-3s',
    '8K DPI any-surface tracking, quiet clicks, and MagSpeed electromagnetic scrolling for ultimate precision.',
    8995.00,
    10995.00,
    'c1000000-0000-0000-0000-000000000001',
    'Logitech',
    60,
    'HODA-LOG-MX3S-GRY',
    4.7,
    512,
    true
  ),
  (
    'a1000000-0000-0000-0000-000000000004',
    'Samsung Galaxy S24 Ultra 5G (Titanium Gray, 256GB)',
    'samsung-galaxy-s24-ultra-5g',
    'Galaxy AI is here. 200MP camera with Quad Telephoto system, titanium exterior, and built-in S Pen.',
    129999.00,
    134999.00,
    'c1000000-0000-0000-0000-000000000003',
    'Samsung',
    18,
    'HODA-SAM-S24U-256G',
    4.8,
    215,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- 4. SEED PRODUCT IMAGES (Cloudinary URLs)
INSERT INTO public.product_images (product_id, url, sort_order)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', 0),
  ('a1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80', 1),
  ('a1000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', 0),
  ('a1000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80', 0),
  ('a1000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80', 0)
ON CONFLICT DO NOTHING;

-- 5. SEED COUPONS
INSERT INTO public.coupons (code, discount_type, value, min_order_value, expires_at, usage_limit)
VALUES
  ('HODA500', 'flat', 500.00, 1999.00, now() + interval '180 days', 5000),
  ('FESTIVE10', 'percentage', 10.00, 999.00, now() + interval '90 days', 10000),
  ('WELCOME100', 'flat', 100.00, 499.00, now() + interval '365 days', 20000)
ON CONFLICT (code) DO NOTHING;

-- 6. SEED HOMEPAGE HERO BANNERS
INSERT INTO public.banners (id, title, image_url, link_url, is_active, sort_order)
VALUES
  ('bb000000-0000-0000-0000-000000000001', 'The Great HodaFest Sale', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1200&q=80', '/category/mobiles', true, 1),
  ('bb000000-0000-0000-0000-000000000002', 'Ultra Hi-Fi & ANC Audio', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1200&q=80', '/category/electronics', true, 2),
  ('bb000000-0000-0000-0000-000000000003', 'Smart Home & OLED Cinema', 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=1200&q=80', '/category/appliances', true, 3)
ON CONFLICT (id) DO NOTHING;

