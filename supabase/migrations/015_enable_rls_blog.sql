-- Migration: Enable RLS on Blog Tables
-- Description: Secures blog system with public read access for published content
-- Tables: blog_posts, blog_comments, blog_authors, blog_tags, blog_post_tags,
--         blog_post_categories, blog_related_posts, blog_seo_metrics
-- Note: blog_posts and blog_comments already have policies but RLS was disabled

-- ============================================
-- Enable RLS on tables with existing policies
-- ============================================
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Enable RLS on remaining blog tables
-- ============================================
ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_related_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_seo_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Public read policies for blog content
-- ============================================

-- blog_posts: Public can read published posts, authors can read their own
-- Note: Existing policies may handle author access, this adds public read
CREATE POLICY "Public read published posts"
ON public.blog_posts FOR SELECT
USING (status = 'published');

-- blog_authors: Public directory of authors
CREATE POLICY "Public read authors"
ON public.blog_authors FOR SELECT
USING (true);

-- blog_tags: Public can browse tags
CREATE POLICY "Public read tags"
ON public.blog_tags FOR SELECT
USING (true);

-- blog_post_tags: Public can see post-tag relationships
CREATE POLICY "Public read post tags"
ON public.blog_post_tags FOR SELECT
USING (true);

-- blog_post_categories: Public can see post-category relationships
CREATE POLICY "Public read post categories"
ON public.blog_post_categories FOR SELECT
USING (true);

-- blog_related_posts: Public can see related post suggestions
CREATE POLICY "Public read related posts"
ON public.blog_related_posts FOR SELECT
USING (true);

-- blog_seo_metrics: Public can see SEO performance data
CREATE POLICY "Public read SEO metrics"
ON public.blog_seo_metrics FOR SELECT
USING (true);

-- ============================================
-- Service role write access for admin operations
-- ============================================
CREATE POLICY "Service role manage authors"
ON public.blog_authors FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Service role manage tags"
ON public.blog_tags FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Service role manage post_tags"
ON public.blog_post_tags FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Service role manage post_categories"
ON public.blog_post_categories FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Service role manage related_posts"
ON public.blog_related_posts FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Service role manage seo_metrics"
ON public.blog_seo_metrics FOR ALL TO service_role
USING (true) WITH CHECK (true);
