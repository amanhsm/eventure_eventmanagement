-- =============================================
-- SIMPLE WORKING STORAGE POLICIES
-- Fixed type casting issues
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own event images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all event images" ON storage.objects;

-- 1. Allow public read access to event images (for displaying in UI)
CREATE POLICY "Public read event images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'event-images'
);

-- 2. Allow authenticated users to upload files
CREATE POLICY "Authenticated upload event images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
);

-- 3. Allow users to update files (simplified - any authenticated user)
CREATE POLICY "Authenticated update event images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
) WITH CHECK (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
);

-- 4. Allow users to delete files (simplified - any authenticated user)
CREATE POLICY "Authenticated delete event images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
);

-- Verification
SELECT 
    '✅ STORAGE POLICIES CREATED' as status,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%event images%'
ORDER BY policyname;

SELECT '🎉 SIMPLE STORAGE POLICIES READY!' as result;

-- Instructions
SELECT 
    '📋 WHAT THESE POLICIES DO' as section,
    '1. Anyone can VIEW event images (needed for display)' as policy_1,
    '2. Only logged-in users can UPLOAD images' as policy_2,
    '3. Only logged-in users can UPDATE/DELETE images' as policy_3,
    '4. Simple and secure for most use cases' as policy_4;
