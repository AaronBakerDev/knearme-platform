-- Migration: Enable RLS on Critical Tables
-- Description: Secures API keys and OAuth authorization codes
-- Tables: rt_api_keys, oauth_authorization_codes
-- Risk Level: CRITICAL - API keys were previously exposed

DO $do$
BEGIN
  -- ============================================
  -- 1. rt_api_keys - CRITICAL: API keys must be protected
  -- ============================================
  IF to_regclass('public.rt_api_keys') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.rt_api_keys ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own API keys" ON public.rt_api_keys';
    EXECUTE 'DROP POLICY IF EXISTS "Users can create own API keys" ON public.rt_api_keys';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own API keys" ON public.rt_api_keys';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete own API keys" ON public.rt_api_keys';

    EXECUTE $policy$
      CREATE POLICY "Users can view own API keys"
      ON public.rt_api_keys FOR SELECT
      USING (auth.uid() = user_id)
    $policy$;

    EXECUTE $policy$
      CREATE POLICY "Users can create own API keys"
      ON public.rt_api_keys FOR INSERT
      WITH CHECK (auth.uid() = user_id)
    $policy$;

    EXECUTE $policy$
      CREATE POLICY "Users can update own API keys"
      ON public.rt_api_keys FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id)
    $policy$;

    EXECUTE $policy$
      CREATE POLICY "Users can delete own API keys"
      ON public.rt_api_keys FOR DELETE
      USING (auth.uid() = user_id)
    $policy$;
  ELSE
    RAISE NOTICE 'Skipping rt_api_keys policies: table does not exist.';
  END IF;

  -- ============================================
  -- 2. oauth_authorization_codes - Service role only
  -- RLS is already enabled but no policies exist
  -- ============================================
  IF to_regclass('public.oauth_authorization_codes') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Service role full access to oauth codes" ON public.oauth_authorization_codes';
    EXECUTE $policy$
      CREATE POLICY "Service role full access to oauth codes"
      ON public.oauth_authorization_codes FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true)
    $policy$;
  ELSE
    RAISE NOTICE 'Skipping oauth_authorization_codes policy: table does not exist.';
  END IF;
END $do$;
