-- Add profile slug for public contractor URLs

ALTER TABLE public.contractors
  ADD COLUMN IF NOT EXISTS profile_slug TEXT;

-- Backfill profile_slug from business_name with uniqueness
DO $$
DECLARE
  rec record;
  base_slug text;
  candidate text;
  suffix integer;
BEGIN
  FOR rec IN
    SELECT id, business_name
    FROM public.contractors
    WHERE profile_slug IS NULL AND business_name IS NOT NULL
  LOOP
    base_slug := public.slugify(rec.business_name);
    IF base_slug IS NULL OR base_slug = '' THEN
      CONTINUE;
    END IF;

    candidate := base_slug;
    suffix := 1;
    WHILE EXISTS (
      SELECT 1 FROM public.contractors
      WHERE profile_slug = candidate AND id <> rec.id
    ) LOOP
      suffix := suffix + 1;
      candidate := base_slug || '-' || suffix;
    END LOOP;

    UPDATE public.contractors
    SET profile_slug = candidate
    WHERE id = rec.id;
  END LOOP;
END
$$;

-- Enforce uniqueness for non-null slugs
CREATE UNIQUE INDEX IF NOT EXISTS idx_contractors_profile_slug
  ON public.contractors(profile_slug);
