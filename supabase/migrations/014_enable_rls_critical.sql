-- Migration: Enable RLS on Critical Tables
-- Description: Secures API keys and OAuth authorization codes
-- Tables: rt_api_keys, oauth_authorization_codes
-- Risk Level: CRITICAL - API keys were previously exposed

-- ============================================
-- 1. rt_api_keys - CRITICAL: API keys must be protected
-- ============================================
ALTER TABLE public.rt_api_keys ENABLE ROW LEVEL SECURITY;

-- Users can only view their own API keys
CREATE POLICY "Users can view own API keys"
ON public.rt_api_keys FOR SELECT
USING (auth.uid() = user_id);

-- Users can only create API keys for themselves
CREATE POLICY "Users can create own API keys"
ON public.rt_api_keys FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own API keys
CREATE POLICY "Users can update own API keys"
ON public.rt_api_keys FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own API keys
CREATE POLICY "Users can delete own API keys"
ON public.rt_api_keys FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 2. oauth_authorization_codes - Service role only
-- RLS is already enabled but no policies exist
-- ============================================
CREATE POLICY "Service role full access to oauth codes"
ON public.oauth_authorization_codes FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
