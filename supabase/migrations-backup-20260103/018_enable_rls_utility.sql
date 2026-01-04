-- Migration: Enable RLS on Utility Tables
-- Description: Internal/utility tables restricted to service role only
-- Tables: n8n_chat_histories, documents, prompt_cap_templates, prompt_cap_executions,
--         prompt_cap_feedback, prompt_cap_variables
-- Note: spatial_ref_sys is a PostGIS system table and should NOT have RLS enabled

DO $do$
BEGIN
  IF to_regclass('public.n8n_chat_histories') IS NULL THEN
    RAISE NOTICE 'Skipping utility RLS migration: tables do not exist.';
    RETURN;
  END IF;

-- ============================================
-- Enable RLS on utility tables
-- ============================================
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_cap_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_cap_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_cap_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_cap_variables ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Service role only access (no public access)
-- These are internal tools not meant for client access
-- ============================================

-- n8n_chat_histories: N8N automation logs
CREATE POLICY "Service role manage n8n_chat_histories"
ON public.n8n_chat_histories FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- documents: Vector embeddings storage
CREATE POLICY "Service role manage documents"
ON public.documents FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- prompt_cap_templates: Prompt management templates
CREATE POLICY "Service role manage prompt_cap_templates"
ON public.prompt_cap_templates FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- prompt_cap_executions: Prompt execution logs
CREATE POLICY "Service role manage prompt_cap_executions"
ON public.prompt_cap_executions FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- prompt_cap_feedback: Feedback on prompt executions
CREATE POLICY "Service role manage prompt_cap_feedback"
ON public.prompt_cap_feedback FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- prompt_cap_variables: Variable storage for prompts
CREATE POLICY "Service role manage prompt_cap_variables"
ON public.prompt_cap_variables FOR ALL TO service_role
USING (true) WITH CHECK (true);

END $do$;
