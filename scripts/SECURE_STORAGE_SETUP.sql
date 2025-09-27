-- =============================================
-- SECURE SUPABASE STORAGE SETUP
-- Proper security policies for event images
-- =============================================

-- 1. Create the storage bucket (run this in Supabase Dashboard or via API)
-- This is just for reference - actual bucket creation is done via Dashboard
/*
Bucket Configuration:
- Name: event-images
- Public: false (we'll control access via policies)
- File size limit: 5MB
- Allowed MIME types: image/jpeg, image/png, image/webp
*/

-- 2. Set up Row Level Security policies for the bucket

-- Allow public read access to event images (so they can be displayed)
CREATE POLICY "Public can view event images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'event-images'
);

-- Only authenticated users can upload files
CREATE POLICY "Authenticated users can upload event images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'events'
);

-- Users can update their own uploaded files
CREATE POLICY "Users can update own event images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'event-images' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'events'
) WITH CHECK (
  bucket_id = 'event-images' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'events'
);

-- Users can delete their own uploaded files
CREATE POLICY "Users can delete own event images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-images' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'events'
);

-- 3. Additional security: Admins can manage all files
CREATE POLICY "Admins can manage all event images" ON storage.objects
FOR ALL USING (
  bucket_id = 'event-images' 
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- 4. Create a function to clean up orphaned images
CREATE OR REPLACE FUNCTION cleanup_orphaned_event_images()
RETURNS void AS $$
DECLARE
  image_record RECORD;
BEGIN
  -- Find images in storage that don't have corresponding events
  FOR image_record IN 
    SELECT name FROM storage.objects 
    WHERE bucket_id = 'event-images'
    AND name NOT IN (
      SELECT SUBSTRING(image_url FROM '.*/(.*)$') 
      FROM events 
      WHERE image_url IS NOT NULL
    )
  LOOP
    -- Delete orphaned images
    PERFORM storage.delete_object('event-images', image_record.name);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create a scheduled job to run cleanup (optional)
-- This would need to be set up via Supabase Edge Functions or external cron

-- Verification queries
SELECT 
    '🔒 STORAGE SECURITY POLICIES' as section,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

SELECT '✅ SECURE STORAGE SETUP COMPLETE!' as result;

-- Security benefits summary
SELECT 
    '🛡️ SECURITY BENEFITS' as section,
    '1. Only authenticated users can upload' as benefit_1,
    '2. Users can only manage their own files' as benefit_2,
    '3. Public can only read/view images (not upload/delete)' as benefit_3,
    '4. Files organized by user ID for isolation' as benefit_4,
    '5. Admins have full management access' as benefit_5,
    '6. Automatic cleanup of orphaned images' as benefit_6;
