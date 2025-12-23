-- Migration: Enable RLS on Search/Places Tables (Public Read-Only)
-- Description: Directory data is publicly readable, only service role can write
-- Tables: places, places_backup, search_entries, query_locations, queries, location_query_status

-- ============================================
-- Enable RLS on all search/places tables
-- ============================================
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_query_status ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Public read policies (anyone can read directory data)
-- ============================================
CREATE POLICY "Public read places"
ON public.places FOR SELECT
USING (true);

CREATE POLICY "Public read places_backup"
ON public.places_backup FOR SELECT
USING (true);

CREATE POLICY "Public read search_entries"
ON public.search_entries FOR SELECT
USING (true);

CREATE POLICY "Public read query_locations"
ON public.query_locations FOR SELECT
USING (true);

CREATE POLICY "Public read queries"
ON public.queries FOR SELECT
USING (true);

CREATE POLICY "Public read location_query_status"
ON public.location_query_status FOR SELECT
USING (true);

-- ============================================
-- Service role write access (only backend can modify)
-- ============================================
CREATE POLICY "Service role manage places"
ON public.places FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Service role manage places_backup"
ON public.places_backup FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Service role manage search_entries"
ON public.search_entries FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Service role manage query_locations"
ON public.query_locations FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Service role manage queries"
ON public.queries FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Service role manage location_query_status"
ON public.location_query_status FOR ALL TO service_role
USING (true) WITH CHECK (true);
