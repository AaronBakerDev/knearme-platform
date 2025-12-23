-- Migration: Add Missing Policies for RLS-Enabled Tables
-- Description: Tables that already have RLS enabled but lack policies
-- Tables: rt_resource_related, rt_resource_seo_performance

-- ============================================
-- rt_resource_related
-- RLS is already enabled but no policies exist
-- ============================================
CREATE POLICY "Public read related resources"
ON public.rt_resource_related FOR SELECT
USING (true);

CREATE POLICY "Service role manage related resources"
ON public.rt_resource_related FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============================================
-- rt_resource_seo_performance
-- RLS is already enabled but no policies exist
-- ============================================
CREATE POLICY "Public read SEO performance"
ON public.rt_resource_seo_performance FOR SELECT
USING (true);

CREATE POLICY "Service role manage SEO performance"
ON public.rt_resource_seo_performance FOR ALL TO service_role
USING (true) WITH CHECK (true);
