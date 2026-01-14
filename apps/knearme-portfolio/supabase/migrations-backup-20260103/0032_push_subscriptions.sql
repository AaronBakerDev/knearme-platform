-- KnearMe Portfolio - Push Notifications (Phase 2 Prep)
-- Creates push_subscriptions table for storing web push endpoints per contractor.
-- Run in Supabase SQL Editor or via supabase CLI migrations.

-- Ensure uuid extension exists (already created in 001 but safe to keep)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contractor_id UUID NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (contractor_id, endpoint)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_contractor ON public.push_subscriptions(contractor_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON public.push_subscriptions(endpoint);

-- ============================================
-- TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER push_subscriptions_updated_at
    BEFORE UPDATE ON public.push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow contractors to manage their own subscriptions
DROP POLICY IF EXISTS "Contractors manage own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Contractors manage own push subscriptions"
    ON public.push_subscriptions
    FOR ALL
    USING (
        contractor_id IN (
            SELECT id FROM public.contractors
            WHERE auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        contractor_id IN (
            SELECT id FROM public.contractors
            WHERE auth_user_id = auth.uid()
        )
    );
