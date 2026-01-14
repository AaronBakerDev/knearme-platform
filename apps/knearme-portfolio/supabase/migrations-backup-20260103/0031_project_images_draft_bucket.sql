-- KnearMe Portfolio - Draft Project Images Bucket
-- Creates a private bucket for draft project images (publish copies to public bucket).

-- ============================================
-- STORAGE BUCKET
-- ============================================

-- Create project-images-draft bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-images-draft',
  'project-images-draft',
  false, -- Private bucket for drafts
  5242880, -- 5MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- STORAGE POLICIES (Draft Bucket)
-- ============================================

-- Drop existing draft policies if they exist (for clean re-runs)
DROP POLICY IF EXISTS "Contractors can upload draft project images" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can read own draft project images" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can delete own draft project images" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can update own draft project images" ON storage.objects;

-- Upload policy: Contractors can upload to paths starting with their contractor ID
CREATE POLICY "Contractors can upload draft project images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-images-draft'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.contractors
    WHERE auth_user_id = auth.uid()
  )
);

-- Read policy: Contractors can read their own draft images
CREATE POLICY "Contractors can read own draft project images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-images-draft'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.contractors
    WHERE auth_user_id = auth.uid()
  )
);

-- Delete policy: Contractors can delete their own draft images
CREATE POLICY "Contractors can delete own draft project images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-images-draft'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.contractors
    WHERE auth_user_id = auth.uid()
  )
);

-- Update policy: Contractors can update their own draft images (metadata)
CREATE POLICY "Contractors can update own draft project images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-images-draft'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.contractors
    WHERE auth_user_id = auth.uid()
  )
);
