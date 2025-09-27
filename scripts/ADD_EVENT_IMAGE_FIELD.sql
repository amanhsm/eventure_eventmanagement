-- =============================================
-- ADD IMAGE FIELD TO EVENTS TABLE
-- For storing event images uploaded to Supabase Storage
-- =============================================

-- Add image_url column to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN events.image_url IS 'URL path to event image stored in Supabase Storage';

-- Create index for faster queries when filtering by events with images
CREATE INDEX IF NOT EXISTS idx_events_image_url ON events(image_url) WHERE image_url IS NOT NULL;

-- Show the updated table structure
SELECT 
    '📊 EVENTS TABLE STRUCTURE' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events'
ORDER BY ordinal_position;

-- Show sample of events table with new image_url column
SELECT 
    '📋 SAMPLE EVENTS WITH IMAGE FIELD' as section,
    id,
    title,
    image_url,
    status,
    created_at
FROM events 
ORDER BY created_at DESC 
LIMIT 5;

SELECT '✅ IMAGE FIELD ADDED TO EVENTS TABLE!' as result;
