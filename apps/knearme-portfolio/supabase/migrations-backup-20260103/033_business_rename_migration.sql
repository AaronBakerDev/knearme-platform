-- Phase 11 Migration: Contractors → Businesses
-- This migration:
--   1. Renames the empty directory `businesses` table to avoid conflict
--   2. Creates the proper agentic `businesses` table
--   3. Migrates data from `contractors` to `businesses`
--   4. Sets up RLS policies
--   5. Updates related tables to use business_id
--
-- IMPORTANT: Run this in a transaction. Rollback instructions at bottom.
-- Created: 2026-01-02

BEGIN;

-- ============================================
-- Step 1: Rename existing directory businesses table
-- (It's empty but preserve in case directory platform needs it)
-- ============================================

-- First drop the foreign key constraints pointing to old businesses
ALTER TABLE IF EXISTS public.service_areas
    DROP CONSTRAINT IF EXISTS service_areas_business_id_fkey;
ALTER TABLE IF EXISTS public.business_certifications
    DROP CONSTRAINT IF EXISTS business_certifications_business_id_fkey;
ALTER TABLE IF EXISTS public.service_requests
    DROP CONSTRAINT IF EXISTS service_requests_business_id_fkey;
ALTER TABLE IF EXISTS public.listings
    DROP CONSTRAINT IF EXISTS listings_business_id_fkey;
ALTER TABLE IF EXISTS public.reviews
    DROP CONSTRAINT IF EXISTS reviews_business_id_fkey;
ALTER TABLE IF EXISTS public.business_features
    DROP CONSTRAINT IF EXISTS business_features_business_id_fkey;

-- Rename the old directory businesses table
ALTER TABLE IF EXISTS public.businesses
    RENAME TO _deprecated_directory_businesses;

-- ============================================
-- Step 2: Create the proper agentic businesses table
-- ============================================

CREATE TABLE public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email TEXT UNIQUE,
    name TEXT,
    slug TEXT UNIQUE,
    profile_photo_url TEXT,

    -- Location info (migrated from contractor city/state/service_areas)
    city TEXT,
    state TEXT,
    city_slug TEXT,
    address TEXT,
    postal_code TEXT,
    phone TEXT,
    website TEXT,

    -- Service info (migrated from contractor services/description)
    services TEXT[] DEFAULT '{}',
    service_areas TEXT[] DEFAULT '{}',
    description TEXT,

    -- Plan and status
    plan_tier TEXT NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro')),

    -- Agentic JSONB fields
    location JSONB DEFAULT '{}'::jsonb,
    understanding JSONB DEFAULT '{}'::jsonb,
    context JSONB DEFAULT '{}'::jsonb,
    discovered_data JSONB,

    -- Google integration (from contractor)
    google_place_id TEXT,
    google_cid TEXT,
    onboarding_method TEXT,

    -- Legacy link for migration
    legacy_contractor_id UUID,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.businesses IS
  'Canonical business profiles. Migrated from contractors table.';

COMMENT ON COLUMN public.businesses.location IS
  'Location and service area context (JSON). Example: { city, state, service_areas, service_radius }.';

COMMENT ON COLUMN public.businesses.understanding IS
  'Agent-discovered business understanding (JSON). Example: { type, vocabulary, voice, specialties, differentiators }.';

COMMENT ON COLUMN public.businesses.context IS
  'Agent memory and preferences (JSON). Example: { facts, preferences, conversation_summary }.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_businesses_auth_user_id ON public.businesses(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_city_slug ON public.businesses(city_slug);
CREATE INDEX IF NOT EXISTS idx_businesses_legacy_contractor_id ON public.businesses(legacy_contractor_id);

-- ============================================
-- Step 3: Migrate data from contractors → businesses
-- ============================================

INSERT INTO public.businesses (
    id,
    auth_user_id,
    email,
    name,
    slug,
    profile_photo_url,
    city,
    state,
    city_slug,
    phone,
    website,
    services,
    service_areas,
    description,
    plan_tier,
    location,
    understanding,
    google_place_id,
    google_cid,
    onboarding_method,
    legacy_contractor_id,
    created_at,
    updated_at
)
SELECT
    c.id,
    c.auth_user_id,
    c.email,
    c.business_name,
    c.profile_slug,
    c.profile_photo_url,
    c.city,
    c.state,
    c.city_slug,
    NULL, -- phone not in contractors
    NULL, -- website not in contractors
    COALESCE(c.services, '{}'),
    COALESCE(c.service_areas, '{}'),
    c.description,
    'free', -- default plan tier
    jsonb_strip_nulls(
        jsonb_build_object(
            'city', c.city,
            'state', c.state,
            'city_slug', c.city_slug,
            'service_areas', c.service_areas
        )
    ),
    jsonb_strip_nulls(
        jsonb_build_object(
            'type', 'masonry',
            'specialties', c.services
        )
    ),
    c.google_place_id,
    c.google_cid,
    c.onboarding_method,
    c.id,
    c.created_at,
    c.updated_at
FROM public.contractors c
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Step 4: Add business_id column to projects (alongside contractor_id)
-- ============================================

-- Add new column
ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

-- Populate from contractor_id
UPDATE public.projects p
SET business_id = p.contractor_id
WHERE business_id IS NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_projects_business_id ON public.projects(business_id);

-- ============================================
-- Step 5: Add business_id to other tables
-- ============================================

-- push_subscriptions
ALTER TABLE public.push_subscriptions
    ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

UPDATE public.push_subscriptions ps
SET business_id = ps.contractor_id
WHERE business_id IS NULL AND contractor_id IS NOT NULL;

-- voice_usage
ALTER TABLE public.voice_usage
    ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

UPDATE public.voice_usage vu
SET business_id = vu.contractor_id
WHERE business_id IS NULL AND contractor_id IS NOT NULL;

-- chat_sessions (check if contractor_id exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'chat_sessions' AND column_name = 'contractor_id'
    ) THEN
        ALTER TABLE public.chat_sessions
            ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

        UPDATE public.chat_sessions cs
        SET business_id = cs.contractor_id
        WHERE business_id IS NULL AND contractor_id IS NOT NULL;
    END IF;
END $$;

-- ============================================
-- Step 6: Updated_at trigger
-- ============================================

DROP TRIGGER IF EXISTS businesses_updated_at ON public.businesses;
CREATE TRIGGER businesses_updated_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- Step 7: Create helper function for RLS
-- ============================================

CREATE OR REPLACE FUNCTION public.get_auth_business_ids()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT id FROM public.businesses WHERE auth_user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.business_has_published_project(business_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.projects
        WHERE business_id = business_uuid
        AND status = 'published'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- Step 8: RLS Policies for businesses table
-- ============================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist (from partial migration attempts)
DROP POLICY IF EXISTS "Businesses can view own profile" ON public.businesses;
DROP POLICY IF EXISTS "Businesses can update own profile" ON public.businesses;
DROP POLICY IF EXISTS "Public can view businesses with published items" ON public.businesses;

-- Create new policies
CREATE POLICY "Businesses can view own profile"
    ON public.businesses FOR SELECT
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Businesses can update own profile"
    ON public.businesses FOR UPDATE
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Businesses can insert own profile"
    ON public.businesses FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Public can view businesses with published projects"
    ON public.businesses FOR SELECT
    USING (
        public.business_has_published_project(id)
    );

-- ============================================
-- Step 9: Update handle_new_user to create business
-- ============================================

CREATE OR REPLACE FUNCTION public.knearme_handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_id UUID;
BEGIN
    new_id := uuid_generate_v4();

    -- Create contractor record (legacy)
    INSERT INTO public.contractors (id, auth_user_id, email)
    VALUES (new_id, NEW.id, NEW.email)
    ON CONFLICT (auth_user_id) DO NOTHING;

    -- Create business record (new canonical)
    INSERT INTO public.businesses (id, auth_user_id, email, legacy_contractor_id)
    VALUES (new_id, NEW.id, NEW.email, new_id)
    ON CONFLICT (auth_user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ============================================
-- ROLLBACK INSTRUCTIONS
-- ============================================
-- To rollback this migration, run:
--
-- BEGIN;
--
-- -- Drop new businesses table
-- DROP TABLE IF EXISTS public.businesses CASCADE;
--
-- -- Rename deprecated table back
-- ALTER TABLE IF EXISTS public._deprecated_directory_businesses
--     RENAME TO businesses;
--
-- -- Restore FK constraints (if needed)
-- -- ALTER TABLE public.service_areas ADD CONSTRAINT service_areas_business_id_fkey
-- --     FOREIGN KEY (business_id) REFERENCES public.businesses(id);
-- -- (repeat for other tables)
--
-- -- Remove business_id columns
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS business_id;
-- ALTER TABLE public.push_subscriptions DROP COLUMN IF EXISTS business_id;
-- ALTER TABLE public.voice_usage DROP COLUMN IF EXISTS business_id;
--
-- -- Drop new functions
-- DROP FUNCTION IF EXISTS public.get_auth_business_ids();
-- DROP FUNCTION IF EXISTS public.business_has_published_project(UUID);
--
-- COMMIT;
