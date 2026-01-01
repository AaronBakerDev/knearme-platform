-- Add plan tier to contractors for pricing and publish limits

ALTER TABLE public.contractors
    ADD COLUMN IF NOT EXISTS plan_tier TEXT NOT NULL DEFAULT 'free';

COMMENT ON COLUMN public.contractors.plan_tier IS
    'Billing plan tier for project limits and features (free or pro).';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'contractors_plan_tier_check'
    ) THEN
        ALTER TABLE public.contractors
            ADD CONSTRAINT contractors_plan_tier_check
            CHECK (plan_tier IN ('free', 'pro'));
    END IF;
END $$;
