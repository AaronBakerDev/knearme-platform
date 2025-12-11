-- KnearMe Portfolio - Initial Database Schema
-- Run this in Supabase SQL Editor to set up the database
-- @see /docs/03-architecture/data-model.md

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Contractors table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.contractors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT UNIQUE NOT NULL,
    business_name TEXT,
    city TEXT,
    state TEXT,
    city_slug TEXT,
    services TEXT[] DEFAULT '{}',
    service_areas TEXT[] DEFAULT '{}',
    description TEXT,
    profile_photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contractor_id UUID REFERENCES public.contractors(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    description TEXT,
    project_type TEXT,
    project_type_slug TEXT,
    materials TEXT[] DEFAULT '{}',
    techniques TEXT[] DEFAULT '{}',
    city TEXT,
    city_slug TEXT,
    duration TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    slug TEXT UNIQUE,
    seo_title TEXT,
    seo_description TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- Project images table
CREATE TABLE IF NOT EXISTS public.project_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    storage_path TEXT NOT NULL,
    image_type TEXT CHECK (image_type IN ('before', 'after', 'progress', 'detail')),
    alt_text TEXT,
    display_order INT DEFAULT 0,
    width INT,
    height INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interview sessions table
CREATE TABLE IF NOT EXISTS public.interview_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    questions JSONB,
    image_analysis JSONB,
    raw_transcripts TEXT[] DEFAULT '{}',
    generated_content JSONB,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'approved')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Contractors indexes
CREATE INDEX IF NOT EXISTS idx_contractors_auth_user_id ON public.contractors(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_contractors_city_slug ON public.contractors(city_slug);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_contractor_id ON public.projects(contractor_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_city_slug ON public.projects(city_slug);
CREATE INDEX IF NOT EXISTS idx_projects_project_type_slug ON public.projects(project_type_slug);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_published_at ON public.projects(published_at DESC);

-- Project images indexes
CREATE INDEX IF NOT EXISTS idx_project_images_project_id ON public.project_images(project_id);
CREATE INDEX IF NOT EXISTS idx_project_images_display_order ON public.project_images(project_id, display_order);

-- Interview sessions indexes
CREATE INDEX IF NOT EXISTS idx_interview_sessions_project_id ON public.interview_sessions(project_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create contractor profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.contractors (auth_user_id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate slug from text
CREATE OR REPLACE FUNCTION public.slugify(text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                TRIM(text),
                '[^a-zA-Z0-9\s-]', '', 'g'
            ),
            '\s+', '-', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at on contractors
DROP TRIGGER IF EXISTS contractors_updated_at ON public.contractors;
CREATE TRIGGER contractors_updated_at
    BEFORE UPDATE ON public.contractors
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Update updated_at on projects
DROP TRIGGER IF EXISTS projects_updated_at ON public.projects;
CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create contractor profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

-- Contractors policies
CREATE POLICY "Contractors can view own profile"
    ON public.contractors FOR SELECT
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Contractors can update own profile"
    ON public.contractors FOR UPDATE
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Public can view contractors with published projects"
    ON public.contractors FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.contractor_id = contractors.id
            AND projects.status = 'published'
        )
    );

-- Projects policies
CREATE POLICY "Contractors can view own projects"
    ON public.projects FOR SELECT
    USING (
        contractor_id IN (
            SELECT id FROM public.contractors
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Contractors can insert own projects"
    ON public.projects FOR INSERT
    WITH CHECK (
        contractor_id IN (
            SELECT id FROM public.contractors
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Contractors can update own projects"
    ON public.projects FOR UPDATE
    USING (
        contractor_id IN (
            SELECT id FROM public.contractors
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Contractors can delete own projects"
    ON public.projects FOR DELETE
    USING (
        contractor_id IN (
            SELECT id FROM public.contractors
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Public can view published projects"
    ON public.projects FOR SELECT
    USING (status = 'published');

-- Project images policies
CREATE POLICY "Contractors can manage own project images"
    ON public.project_images FOR ALL
    USING (
        project_id IN (
            SELECT id FROM public.projects
            WHERE contractor_id IN (
                SELECT id FROM public.contractors
                WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Public can view images of published projects"
    ON public.project_images FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM public.projects
            WHERE status = 'published'
        )
    );

-- Interview sessions policies
CREATE POLICY "Contractors can manage own interview sessions"
    ON public.interview_sessions FOR ALL
    USING (
        project_id IN (
            SELECT id FROM public.projects
            WHERE contractor_id IN (
                SELECT id FROM public.contractors
                WHERE auth_user_id = auth.uid()
            )
        )
    );

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Note: Run these in Supabase Dashboard > Storage or via API

-- Create profile-images bucket (public)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true);

-- Create project-images bucket (public)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('project-images', 'project-images', true);

-- Storage policies for profile-images
-- CREATE POLICY "Users can upload own profile image"
--     ON storage.objects FOR INSERT
--     WITH CHECK (
--         bucket_id = 'profile-images' AND
--         auth.uid()::text = (storage.foldername(name))[1]
--     );

-- Storage policies for project-images
-- CREATE POLICY "Users can upload to own projects"
--     ON storage.objects FOR INSERT
--     WITH CHECK (
--         bucket_id = 'project-images' AND
--         (storage.foldername(name))[1] IN (
--             SELECT id::text FROM public.projects
--             WHERE contractor_id IN (
--                 SELECT id FROM public.contractors
--                 WHERE auth_user_id = auth.uid()
--             )
--         )
--     );
