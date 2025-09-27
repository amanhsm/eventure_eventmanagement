-- =============================================
-- QUICK IMAGE UPLOAD SETUP
-- Run this after creating the storage bucket
-- =============================================

-- 1. Add image field to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT;
COMMENT ON COLUMN events.image_url IS 'URL path to event image stored in Supabase Storage';

-- 2. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_events_image_url ON events(image_url) WHERE image_url IS NOT NULL;

-- 3. Setup storage policies (WORKING VERSION - no type errors)
-- Copy and paste these into Supabase Dashboard → Storage → Policies:

/*
-- Policy 1: Public read access
CREATE POLICY "Public read event images" ON storage.objects
FOR SELECT USING (bucket_id = 'event-images');

-- Policy 2: Authenticated upload
CREATE POLICY "Authenticated upload event images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
);

-- Policy 3: Authenticated update
CREATE POLICY "Authenticated update event images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
) WITH CHECK (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
);

-- Policy 4: Authenticated delete
CREATE POLICY "Authenticated delete event images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
);
*/

-- 4. Verification
SELECT 
    '✅ IMAGE SETUP VERIFICATION' as section;

-- Check if image_url column exists
SELECT 
    'Events table has image_url column:' as check_item,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'image_url'
    ) THEN 'YES ✓' ELSE 'NO ✗' END as status;

-- Show events table structure
SELECT 
    '📋 EVENTS TABLE COLUMNS' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'events'
ORDER BY ordinal_position;

SELECT '🎉 DATABASE SETUP COMPLETE!' as result;
SELECT '📝 NEXT: Setup storage bucket and policies in Supabase Dashboard' as next_step;
