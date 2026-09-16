-- ============================================================================
-- HodaHub Migration: Real-Time Visitor Tracking, Category Management & Banners
-- Target: Supabase (PostgreSQL 15+)
-- ============================================================================

-- 1. PAGE VIEWS TABLE (Historical visit tracking & analytics)
CREATE TABLE IF NOT EXISTS public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  path text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON public.page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON public.page_views(path);

-- Enable RLS for page_views
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Allow public insert into page_views (unauthenticated visitors and authenticated shoppers)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'page_views' AND policyname = 'Allow public insert into page_views'
  ) THEN
    CREATE POLICY "Allow public insert into page_views"
      ON public.page_views FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Allow reading page_views for analytics
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'page_views' AND policyname = 'Allow read page_views'
  ) THEN
    CREATE POLICY "Allow read page_views"
      ON public.page_views FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;


-- 2. BANNERS TABLE (Homepage Hero Carousel & Promotional Banners)
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  link_url text NOT NULL DEFAULT '/',
  is_active boolean NOT NULL DEFAULT true,
  start_date timestamptz,
  end_date timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_banners_active_dates ON public.banners(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_banners_sort_order ON public.banners(sort_order);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'banners' AND policyname = 'Allow public read active banners'
  ) THEN
    CREATE POLICY "Allow public read active banners"
      ON public.banners FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'banners' AND policyname = 'Allow full access to banners for admin'
  ) THEN
    CREATE POLICY "Allow full access to banners for admin"
      ON public.banners FOR ALL
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;


-- 3. UPDATE CATEGORIES TABLE (Add sort_order, badge, and icon if missing)
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS badge text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon text DEFAULT 'Folder';

CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order);
