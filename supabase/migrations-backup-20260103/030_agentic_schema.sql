-- Agentic schema foundation: businesses + portfolio_items
-- Adds new canonical tables while keeping legacy tables intact.
-- Backfills existing data from contractors/projects for a smooth cutover.

-- ============================================
-- 1. Businesses (new canonical profile table)
-- ============================================

CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email TEXT UNIQUE,
    name TEXT,
    slug TEXT UNIQUE,
    profile_photo_url TEXT,
    plan_tier TEXT NOT NULL DEFAULT 'free',
    location JSONB DEFAULT '{}'::jsonb,
    understanding JSONB DEFAULT '{}'::jsonb,
    context JSONB DEFAULT '{}'::jsonb,
    discovered_data JSONB,
    legacy_contractor_id UUID REFERENCES public.contractors(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.businesses IS
  'Canonical business profiles for the agentic portfolio system.';

COMMENT ON COLUMN public.businesses.location IS
  'Location and service area context (JSON). Example: { city, state, service_areas, service_radius }.';

COMMENT ON COLUMN public.businesses.understanding IS
  'Agent-discovered business understanding (JSON). Example: { type, vocabulary, voice, specialties, differentiators }.';

COMMENT ON COLUMN public.businesses.context IS
  'Agent memory and preferences (JSON). Example: { facts, preferences, conversation_summary }.';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'businesses_plan_tier_check'
    ) THEN
        ALTER TABLE public.businesses
            ADD CONSTRAINT businesses_plan_tier_check
            CHECK (plan_tier IN ('free', 'pro'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_businesses_auth_user_id ON public.businesses(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(slug);

-- ============================================
-- 2. Portfolio items (new canonical projects)
-- ============================================

CREATE TABLE IF NOT EXISTS public.portfolio_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    slug TEXT UNIQUE,
    content JSONB DEFAULT '{}'::jsonb,
    visuals JSONB DEFAULT '{}'::jsonb,
    layout JSONB,
    seo JSONB DEFAULT '{}'::jsonb,
    context JSONB DEFAULT '{}'::jsonb,
    legacy_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

COMMENT ON TABLE public.portfolio_items IS
  'Canonical portfolio items with emergent JSONB content structure.';

COMMENT ON COLUMN public.portfolio_items.content IS
  'Primary content payload (JSON). Example: { title, narrative, highlights, specs, metadata }.';

COMMENT ON COLUMN public.portfolio_items.visuals IS
  'Visual organization metadata (JSON). Example: { hero_image_id, organization, categories }.';

COMMENT ON COLUMN public.portfolio_items.layout IS
  'Semantic blocks + design tokens for rendering (JSON).';

COMMENT ON COLUMN public.portfolio_items.seo IS
  'Search metadata (JSON). Example: { title, description, focus }.';

COMMENT ON COLUMN public.portfolio_items.context IS
  'Agent context for this item (JSON). Example: { business_type, customer_focus, extracted_from }.';

CREATE INDEX IF NOT EXISTS idx_portfolio_items_business_id ON public.portfolio_items(business_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_status ON public.portfolio_items(status);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_slug ON public.portfolio_items(slug);

-- ============================================
-- 3. Portfolio images (agent-determined roles)
-- ============================================

CREATE TABLE IF NOT EXISTS public.portfolio_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_item_id UUID REFERENCES public.portfolio_items(id) ON DELETE CASCADE NOT NULL,
    storage_path TEXT NOT NULL,
    role TEXT,
    analysis JSONB,
    alt_text TEXT,
    display_order INT DEFAULT 0,
    width INT,
    height INT,
    legacy_project_image_id UUID REFERENCES public.project_images(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN public.portfolio_images.role IS
  'Agent-determined image role (e.g., hero, detail, process, context).';

CREATE INDEX IF NOT EXISTS idx_portfolio_images_item_id ON public.portfolio_images(portfolio_item_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_images_display_order ON public.portfolio_images(portfolio_item_id, display_order);

-- ============================================
-- 4. Conversations (agentic chat history)
-- ============================================

CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    portfolio_item_id UUID REFERENCES public.portfolio_items(id) ON DELETE SET NULL,
    purpose TEXT,
    messages JSONB DEFAULT '[]'::jsonb,
    summary TEXT,
    extracted JSONB DEFAULT '{}'::jsonb,
    active_agents TEXT[] DEFAULT '{}',
    handoffs JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. Agent memory (cross-session memory)
-- ============================================

CREATE TABLE IF NOT EXISTS public.agent_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL UNIQUE,
    facts JSONB DEFAULT '[]'::jsonb,
    preferences JSONB DEFAULT '{}'::jsonb,
    patterns JSONB DEFAULT '{}'::jsonb,
    relationship_summary TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. Updated_at triggers
-- ============================================

DROP TRIGGER IF EXISTS businesses_updated_at ON public.businesses;
CREATE TRIGGER businesses_updated_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS portfolio_items_updated_at ON public.portfolio_items;
CREATE TRIGGER portfolio_items_updated_at
    BEFORE UPDATE ON public.portfolio_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS portfolio_images_updated_at ON public.portfolio_images;
CREATE TRIGGER portfolio_images_updated_at
    BEFORE UPDATE ON public.portfolio_images
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS conversations_updated_at ON public.conversations;
CREATE TRIGGER conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS agent_memory_updated_at ON public.agent_memory;
CREATE TRIGGER agent_memory_updated_at
    BEFORE UPDATE ON public.agent_memory
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 7. Update auth.user trigger to seed businesses
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id
    FROM public.contractors
    WHERE auth_user_id = NEW.id;

    IF existing_id IS NULL THEN
        existing_id := uuid_generate_v4();
        INSERT INTO public.contractors (id, auth_user_id, email)
        VALUES (existing_id, NEW.id, NEW.email)
        ON CONFLICT (auth_user_id) DO NOTHING;
    END IF;

    INSERT INTO public.businesses (id, auth_user_id, email, name, slug, legacy_contractor_id)
    VALUES (existing_id, NEW.id, NEW.email, NULL, NULL, existing_id)
    ON CONFLICT (auth_user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. Backfill existing data
-- ============================================

INSERT INTO public.businesses (
    id,
    auth_user_id,
    email,
    name,
    slug,
    profile_photo_url,
    plan_tier,
    location,
    understanding,
    context,
    legacy_contractor_id,
    created_at,
    updated_at
)
SELECT
    c.id,
    c.auth_user_id,
    c.email,
    c.business_name,
    c.profile_slug,
    c.profile_photo_url,
    c.plan_tier,
    jsonb_strip_nulls(
        jsonb_build_object(
            'city', c.city,
            'state', c.state,
            'service_areas', c.service_areas
        )
    ),
    jsonb_strip_nulls(
        jsonb_build_object(
            'type', 'masonry',
            'specialties', c.services
        )
    ),
    '{}'::jsonb,
    c.id,
    c.created_at,
    c.updated_at
FROM public.contractors c
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.portfolio_items (
    id,
    business_id,
    status,
    slug,
    content,
    visuals,
    layout,
    seo,
    context,
    legacy_project_id,
    created_at,
    updated_at,
    published_at
)
SELECT
    p.id,
    p.contractor_id,
    p.status,
    p.slug,
    jsonb_strip_nulls(
        jsonb_build_object(
            'title', p.title,
            'description', p.description,
            'description_blocks', p.description_blocks,
            'summary', p.summary,
            'challenge', p.challenge,
            'solution', p.solution,
            'results', p.results,
            'outcome_highlights', p.outcome_highlights,
            'materials', p.materials,
            'techniques', p.techniques,
            'duration', p.duration,
            'tags', p.tags
        )
    ),
    jsonb_strip_nulls(
        jsonb_build_object(
            'hero_image_id', p.hero_image_id,
            'organization', 'gallery'
        )
    ),
    p.portfolio_layout,
    jsonb_strip_nulls(
        jsonb_build_object(
            'title', p.seo_title,
            'description', p.seo_description
        )
    ),
    jsonb_strip_nulls(
        jsonb_build_object(
            'business_type', 'masonry',
            'location', jsonb_strip_nulls(
                jsonb_build_object(
                    'city', p.city,
                    'state', p.state,
                    'neighborhood', p.neighborhood
                )
            ),
            'ai_context', p.ai_context,
            'extracted_from', 'legacy'
        )
    ),
    p.id,
    p.created_at,
    p.updated_at,
    p.published_at
FROM public.projects p
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.portfolio_images (
    id,
    portfolio_item_id,
    storage_path,
    role,
    alt_text,
    display_order,
    width,
    height,
    legacy_project_image_id,
    created_at,
    updated_at
)
SELECT
    i.id,
    i.project_id,
    i.storage_path,
    i.image_type,
    i.alt_text,
    i.display_order,
    i.width,
    i.height,
    i.id,
    i.created_at,
    i.created_at
FROM public.project_images i
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 9. RLS + Policies
-- ============================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;

-- Businesses policies
CREATE POLICY "Businesses can view own profile"
    ON public.businesses FOR SELECT
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Businesses can update own profile"
    ON public.businesses FOR UPDATE
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Public can view businesses with published items"
    ON public.businesses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.portfolio_items
            WHERE portfolio_items.business_id = businesses.id
            AND portfolio_items.status = 'published'
        )
    );

-- Portfolio items policies
CREATE POLICY "Businesses can view own portfolio items"
    ON public.portfolio_items FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM public.businesses
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Businesses can insert own portfolio items"
    ON public.portfolio_items FOR INSERT
    WITH CHECK (
        business_id IN (
            SELECT id FROM public.businesses
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Businesses can update own portfolio items"
    ON public.portfolio_items FOR UPDATE
    USING (
        business_id IN (
            SELECT id FROM public.businesses
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Public can view published portfolio items"
    ON public.portfolio_items FOR SELECT
    USING (status = 'published');

-- Portfolio images policies
CREATE POLICY "Businesses can view own portfolio images"
    ON public.portfolio_images FOR SELECT
    USING (
        portfolio_item_id IN (
            SELECT p.id
            FROM public.portfolio_items p
            JOIN public.businesses b ON b.id = p.business_id
            WHERE b.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Businesses can insert own portfolio images"
    ON public.portfolio_images FOR INSERT
    WITH CHECK (
        portfolio_item_id IN (
            SELECT p.id
            FROM public.portfolio_items p
            JOIN public.businesses b ON b.id = p.business_id
            WHERE b.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Businesses can update own portfolio images"
    ON public.portfolio_images FOR UPDATE
    USING (
        portfolio_item_id IN (
            SELECT p.id
            FROM public.portfolio_items p
            JOIN public.businesses b ON b.id = p.business_id
            WHERE b.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Public can view images for published items"
    ON public.portfolio_images FOR SELECT
    USING (
        portfolio_item_id IN (
            SELECT id FROM public.portfolio_items
            WHERE status = 'published'
        )
    );

-- Conversations policies (private)
CREATE POLICY "Businesses can view own conversations"
    ON public.conversations FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM public.businesses
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Businesses can insert own conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (
        business_id IN (
            SELECT id FROM public.businesses
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Businesses can update own conversations"
    ON public.conversations FOR UPDATE
    USING (
        business_id IN (
            SELECT id FROM public.businesses
            WHERE auth_user_id = auth.uid()
        )
    );

-- Agent memory policies (private)
CREATE POLICY "Businesses can view own memory"
    ON public.agent_memory FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM public.businesses
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Businesses can insert own memory"
    ON public.agent_memory FOR INSERT
    WITH CHECK (
        business_id IN (
            SELECT id FROM public.businesses
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Businesses can update own memory"
    ON public.agent_memory FOR UPDATE
    USING (
        business_id IN (
            SELECT id FROM public.businesses
            WHERE auth_user_id = auth.uid()
        )
    );
