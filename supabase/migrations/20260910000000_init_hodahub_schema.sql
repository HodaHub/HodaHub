-- ============================================================================
-- HodaHub E-Commerce Relational Schema & Row Level Security (RLS)
-- Target: Supabase (PostgreSQL 15+)
-- ============================================================================

-- 0. EXTENSIONS & PREREQUISITES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABLES & FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- 1.1 PROFILES (1:1 linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  phone text,
  email text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.2 CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  parent_category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.3 PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price numeric(12, 2) NOT NULL CHECK (price >= 0),
  mrp numeric(12, 2) NOT NULL CHECK (mrp >= 0),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  brand text NOT NULL DEFAULT 'HodaHub',
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku text UNIQUE,
  rating_avg numeric(3, 2) NOT NULL DEFAULT 0.0 CHECK (rating_avg >= 0 AND rating_avg <= 5.0),
  rating_count integer NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.4 PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size text,
  color text,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.5 PRODUCT IMAGES (Cloudinary URLs)
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.6 BOX OPTIONS
CREATE TABLE IF NOT EXISTS public.box_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text,
  price numeric(12, 2) NOT NULL DEFAULT 0.0 CHECK (price >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.7 PRODUCT BOX OPTIONS (Join table)
CREATE TABLE IF NOT EXISTS public.product_box_options (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  box_option_id uuid NOT NULL REFERENCES public.box_options(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, box_option_id)
);

-- 1.8 ADDRESSES (User or Guest)
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.9 ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name text,
  guest_phone text,
  guest_address jsonb,
  is_guest_order boolean NOT NULL DEFAULT false,
  payment_method text NOT NULL CHECK (payment_method IN ('razorpay_upi', 'cod')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  subtotal numeric(12, 2) NOT NULL DEFAULT 0.0 CHECK (subtotal >= 0),
  box_total numeric(12, 2) NOT NULL DEFAULT 0.0 CHECK (box_total >= 0),
  discount numeric(12, 2) NOT NULL DEFAULT 0.0 CHECK (discount >= 0),
  total numeric(12, 2) NOT NULL DEFAULT 0.0 CHECK (total >= 0),
  order_status text NOT NULL DEFAULT 'pending',
  awb_number text,
  courier_name text,
  shipment_status text,
  estimated_delivery_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.10 ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  box_option_id uuid REFERENCES public.box_options(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_at_purchase numeric(12, 2) NOT NULL CHECK (price_at_purchase >= 0)
);

-- 1.11 REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  verified_purchase boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.12 COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('flat', 'percentage')),
  value numeric(12, 2) NOT NULL CHECK (value > 0),
  min_order_value numeric(12, 2) NOT NULL DEFAULT 0.0 CHECK (min_order_value >= 0),
  expires_at timestamptz,
  usage_limit integer NOT NULL DEFAULT 1000 CHECK (usage_limit >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.13 WALLETS
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric(12, 2) NOT NULL DEFAULT 0.0 CHECK (balance >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.14 WALLET TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  reason text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.15 RETURN REQUESTS
CREATE TABLE IF NOT EXISTS public.return_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_product_images_prod ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_prod ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_guest_phone ON public.orders(guest_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

-- ============================================================================
-- 3. HELPER FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to check if the requesting user has the admin role safely without recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Trigger to auto-create matching profile row on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.phone, ''),
    COALESCE(NEW.email, ''),
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = EXCLUDED.phone,
    email = CASE WHEN profiles.email IS NULL OR profiles.email = '' THEN EXCLUDED.email ELSE profiles.email END;

  -- Also auto-provision a wallet for the new user
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0.00)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) ENFORCEMENT & POLICIES
-- ============================================================================

-- 4.1 PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are readable by owner or admin"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles can be updated by owner or admin"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- 4.2 CATEGORIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are readable by everyone"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Categories insertable by admin only"
  ON public.categories FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Categories updatable by admin only"
  ON public.categories FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Categories deletable by admin only"
  ON public.categories FOR DELETE
  USING (public.is_admin());

-- 4.3 PRODUCTS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active products readable by everyone; all by admin"
  ON public.products FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Products insertable by admin only"
  ON public.products FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Products updatable by admin only"
  ON public.products FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Products deletable by admin only"
  ON public.products FOR DELETE
  USING (public.is_admin());

-- 4.4 PRODUCT VARIANTS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variants readable by everyone"
  ON public.product_variants FOR SELECT
  USING (true);

CREATE POLICY "Variants insertable by admin only"
  ON public.product_variants FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Variants updatable by admin only"
  ON public.product_variants FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Variants deletable by admin only"
  ON public.product_variants FOR DELETE
  USING (public.is_admin());

-- 4.5 PRODUCT IMAGES
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product images readable by everyone"
  ON public.product_images FOR SELECT
  USING (true);

CREATE POLICY "Product images insertable by admin only"
  ON public.product_images FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Product images updatable by admin only"
  ON public.product_images FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Product images deletable by admin only"
  ON public.product_images FOR DELETE
  USING (public.is_admin());

-- 4.6 BOX OPTIONS
ALTER TABLE public.box_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active box options readable by everyone; all by admin"
  ON public.box_options FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Box options insertable by admin only"
  ON public.box_options FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Box options updatable by admin only"
  ON public.box_options FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Box options deletable by admin only"
  ON public.box_options FOR DELETE
  USING (public.is_admin());

-- 4.7 PRODUCT BOX OPTIONS
ALTER TABLE public.product_box_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product box options readable by everyone"
  ON public.product_box_options FOR SELECT
  USING (true);

CREATE POLICY "Product box options manageable by admin only"
  ON public.product_box_options FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.8 ADDRESSES
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Addresses readable by owner or admin"
  ON public.addresses FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Addresses insertable by owner or guest"
  ON public.addresses FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Addresses updatable by owner or admin"
  ON public.addresses FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Addresses deletable by owner or admin"
  ON public.addresses FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- 4.9 ORDERS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Read policy: a user can only SELECT their own orders OR an admin can see all
CREATE POLICY "Orders readable by owner or admin"
  ON public.orders FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

-- Insert policy: user creates their own order OR guest creates guest order
CREATE POLICY "Orders insertable by customer or guest"
  ON public.orders FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (is_guest_order = true AND user_id IS NULL)
  );

-- Update policy: Admin actions only (updating status, dates, AWB)
CREATE POLICY "Orders updatable by admin only"
  ON public.orders FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Delete policy: Admin only
CREATE POLICY "Orders deletable by admin only"
  ON public.orders FOR DELETE
  USING (public.is_admin());

-- 4.10 ORDER ITEMS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order items readable by order owner or admin"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Order items insertable on order creation"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND ((orders.user_id = auth.uid()) OR (orders.is_guest_order = true AND orders.user_id IS NULL))
    )
  );

CREATE POLICY "Order items manageable by admin only"
  ON public.order_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.11 REVIEWS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved reviews readable by everyone; user sees own; admin sees all"
  ON public.reviews FOR SELECT
  USING (status = 'approved' OR user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Authenticated users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Reviews updatable by review owner or admin"
  ON public.reviews FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Reviews deletable by review owner or admin"
  ON public.reviews FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- 4.12 COUPONS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coupons readable by authenticated and anonymous for cart validation"
  ON public.coupons FOR SELECT
  USING (true);

CREATE POLICY "Coupons insertable by admin only"
  ON public.coupons FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Coupons updatable by admin only"
  ON public.coupons FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Coupons deletable by admin only"
  ON public.coupons FOR DELETE
  USING (public.is_admin());

-- 4.13 WALLETS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wallets readable by owner or admin"
  ON public.wallets FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Wallets modifiable by admin only"
  ON public.wallets FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.14 WALLET TRANSACTIONS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wallet transactions readable by owner or admin"
  ON public.wallet_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wallets
      WHERE wallets.id = wallet_transactions.wallet_id
        AND (wallets.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Wallet transactions modifiable by admin only"
  ON public.wallet_transactions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.15 RETURN REQUESTS
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Return requests readable by order owner or admin"
  ON public.return_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = return_requests.order_id
        AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Return requests insertable by order owner"
  ON public.return_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = return_requests.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Return requests updatable by admin only"
  ON public.return_requests FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
