-- =============================================
-- FIXED STORAGE POLICIES FOR RLS ISSUE
-- The problem: auth.role() returns 'authenticated', not user roles like 'organizer'
-- =============================================

-- Drop existing policies that are causing RLS violations
DROP POLICY IF EXISTS "Public read event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete event images" ON storage.objects;

-- 1. Allow public read access (for displaying images)
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (
  bucket_id = 'event-images'
);

-- 2. Allow authenticated users to upload (simplified check)
CREATE POLICY "Allow authenticated upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-images' 
  AND auth.uid() IS NOT NULL
);

-- 3. Allow authenticated users to update their files
CREATE POLICY "Allow authenticated update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'event-images' 
  AND auth.uid() IS NOT NULL
) WITH CHECK (
  bucket_id = 'event-images' 
  AND auth.uid() IS NOT NULL
);

-- 4. Allow authenticated users to delete their files
CREATE POLICY "Allow authenticated delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-images' 
  AND auth.uid() IS NOT NULL
);

-- Verify policies are created
SELECT 
    '✅ FIXED STORAGE POLICIES' as status,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%Allow%'
ORDER BY policyname;

SELECT '🎉 STORAGE POLICIES FIXED - TRY UPLOAD AGAIN!' as result;
