-- Enforce a single onboarding conversation per business

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_onboarding_unique
  ON public.conversations (business_id)
  WHERE purpose = 'onboarding';
