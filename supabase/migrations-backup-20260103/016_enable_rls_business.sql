-- Migration: Enable RLS on Business/Directory Tables
-- Description: Secures business listings with owner-based access and public read
-- Tables: businesses, listings, reviews, categories, features, business_features

DO $do$
BEGIN
  IF to_regclass('public.businesses') IS NULL THEN
    RAISE NOTICE 'Skipping directory business RLS migration: tables do not exist.';
    RETURN;
  END IF;

-- ============================================
-- Enable RLS on all business tables
-- ============================================
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_features ENABLE ROW LEVEL SECURITY;

-- ============================================
-- businesses: Public read for active, owners manage own
-- ============================================
CREATE POLICY "Public read active businesses"
ON public.businesses FOR SELECT
USING (status = 'active');

CREATE POLICY "Owners manage own businesses"
ON public.businesses FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Service role for admin operations
CREATE POLICY "Service role manage businesses"
ON public.businesses FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============================================
-- listings: Public read for published
-- ============================================
CREATE POLICY "Public read published listings"
ON public.listings FOR SELECT
USING (status = 'published');

-- Service role for admin operations
CREATE POLICY "Service role manage listings"
ON public.listings FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============================================
-- reviews: Public read for approved, users manage own
-- ============================================
CREATE POLICY "Public read approved reviews"
ON public.reviews FOR SELECT
USING (status = 'approved');

CREATE POLICY "Users manage own reviews"
ON public.reviews FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service role for moderation
CREATE POLICY "Service role manage reviews"
ON public.reviews FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============================================
-- categories: Public read-only, admin write
-- ============================================
CREATE POLICY "Public read categories"
ON public.categories FOR SELECT
USING (true);

CREATE POLICY "Service role manage categories"
ON public.categories FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============================================
-- features: Public read-only, admin write
-- ============================================
CREATE POLICY "Public read features"
ON public.features FOR SELECT
USING (true);

CREATE POLICY "Service role manage features"
ON public.features FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============================================
-- business_features: Public read-only, admin write
-- ============================================
CREATE POLICY "Public read business features"
ON public.business_features FOR SELECT
USING (true);

CREATE POLICY "Service role manage business_features"
ON public.business_features FOR ALL TO service_role
USING (true) WITH CHECK (true);

END $do$;
