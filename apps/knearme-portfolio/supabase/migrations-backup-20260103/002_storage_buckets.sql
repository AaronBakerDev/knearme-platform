-- KnearMe Portfolio - Storage Bucket Setup
-- Sets up Supabase Storage buckets with RLS policies for secure file uploads.
--
-- @see /docs/03-architecture/c4-container.md for storage architecture
-- @see /docs/06-security/threat-model.md for security considerations

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create project-images bucket (public read, authenticated write)
-- Used for: Before/after photos, progress shots, detail images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-images',
  'project-images',
  true,  -- Public bucket for CDN delivery
  5242880,  -- 5MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create profile-images bucket (public read, authenticated write)
-- Used for: Contractor profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,  -- Public bucket for CDN delivery
  2097152,  -- 2MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create voice-recordings bucket (private, temporary storage)
-- Used for: Interview audio before transcription
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-recordings',
  'voice-recordings',
  false,  -- Private bucket
  10485760,  -- 10MB limit per file
  ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Drop existing policies if they exist (for clean re-runs)
DROP POLICY IF EXISTS "Contractors can upload project images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view project images" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can delete own project images" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can delete own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can upload voice recordings" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can read own voice recordings" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can delete own voice recordings" ON storage.objects;

-- ============================================
-- PROJECT-IMAGES POLICIES
-- ============================================

-- Upload policy: Contractors can upload to paths starting with their contractor ID
-- Path format: {contractor_id}/{project_id}/{filename}
CREATE POLICY "Contractors can upload project images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.contractors
    WHERE auth_user_id = auth.uid()
  )
);

-- Read policy: Anyone can view project images (public bucket)
CREATE POLICY "Public can view project images"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-images');

-- Delete policy: Contractors can only delete their own images
CREATE POLICY "Contractors can delete own project images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-images'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.contractors
    WHERE auth_user_id = auth.uid()
  )
);

-- Update policy: Contractors can update their own images (for metadata)
CREATE POLICY "Contractors can update own project images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-images'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.contractors
    WHERE auth_user_id = auth.uid()
  )
);

-- ============================================
-- PROFILE-IMAGES POLICIES
-- ============================================

-- Upload policy: Contractors can upload to their own folder
-- Path format: {contractor_id}/{filename}
CREATE POLICY "Contractors can upload profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.contractors
    WHERE auth_user_id = auth.uid()
  )
);

-- Read policy: Anyone can view profile images
CREATE POLICY "Public can view profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

-- Delete policy: Contractors can only delete their own profile images
CREATE POLICY "Contractors can delete own profile images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.contractors
    WHERE auth_user_id = auth.uid()
  )
);

-- ============================================
-- VOICE-RECORDINGS POLICIES (Private Bucket)
-- ============================================

-- Upload policy: Authenticated users can upload voice recordings
-- Path format: {contractor_id}/{session_id}/{filename}
CREATE POLICY "Contractors can upload voice recordings"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-recordings'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.contractors
    WHERE auth_user_id = auth.uid()
  )
);

-- Read policy: Contractors can only read their own recordings
CREATE POLICY "Contractors can read own voice recordings"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'voice-recordings'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.contractors
    WHERE auth_user_id = auth.uid()
  )
);

-- Delete policy: Contractors can delete their own recordings
CREATE POLICY "Contractors can delete own voice recordings"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'voice-recordings'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.contractors
    WHERE auth_user_id = auth.uid()
  )
);
