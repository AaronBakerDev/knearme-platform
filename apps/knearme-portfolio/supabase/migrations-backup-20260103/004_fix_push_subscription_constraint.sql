-- Adjust push_subscriptions uniqueness to be global by endpoint
-- Ensures a single endpoint cannot be registered to multiple contractors

ALTER TABLE public.push_subscriptions
    DROP CONSTRAINT IF EXISTS push_subscriptions_contractor_id_endpoint_key;

ALTER TABLE public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);
