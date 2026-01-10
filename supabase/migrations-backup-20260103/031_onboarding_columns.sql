-- Onboarding columns for Discovery Agent flow
-- Adds tracking for Google data and onboarding method

-- ============================================
-- 1. Add columns to contractors (legacy)
-- ============================================

ALTER TABLE public.contractors
  ADD COLUMN IF NOT EXISTS google_place_id TEXT,
  ADD COLUMN IF NOT EXISTS google_cid TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_method TEXT CHECK (onboarding_method IN ('conversation', 'form', NULL));

COMMENT ON COLUMN public.contractors.google_place_id IS
  'Google Places API ID for verified business lookup';

COMMENT ON COLUMN public.contractors.google_cid IS
  'Google Customer ID (CID) for reviews and maps';

COMMENT ON COLUMN public.contractors.onboarding_method IS
  'How the contractor onboarded: conversation (agentic) or form (wizard)';

-- ============================================
-- 2. Add columns to businesses (new schema)
-- ============================================

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS google_place_id TEXT,
  ADD COLUMN IF NOT EXISTS google_cid TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_method TEXT CHECK (onboarding_method IN ('conversation', 'form', NULL)),
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.businesses.google_place_id IS
  'Google Places API ID for verified business lookup';

COMMENT ON COLUMN public.businesses.google_cid IS
  'Google Customer ID (CID) for reviews and maps';

COMMENT ON COLUMN public.businesses.onboarding_method IS
  'How the business onboarded: conversation (agentic) or form (wizard)';

COMMENT ON COLUMN public.businesses.onboarding_completed_at IS
  'When onboarding was completed (profile setup finished)';

-- ============================================
-- 3. Add conversation purpose type for onboarding
-- ============================================

-- Update conversations table to track onboarding specifically
-- The purpose column already exists, this just documents expected values

COMMENT ON COLUMN public.conversations.purpose IS
  'Conversation purpose: onboarding, project_creation, editing, general';

-- ============================================
-- 4. Index for onboarding analytics
-- ============================================

CREATE INDEX IF NOT EXISTS idx_businesses_onboarding_method
  ON public.businesses(onboarding_method)
  WHERE onboarding_method IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contractors_onboarding_method
  ON public.contractors(onboarding_method)
  WHERE onboarding_method IS NOT NULL;
