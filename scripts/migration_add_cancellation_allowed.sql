-- Migration script to add cancellation_allowed column to existing events table
-- Run this script on your existing database to add the new column

-- Add the cancellation_allowed column with default value of true
ALTER TABLE events 
ADD COLUMN cancellation_allowed BOOLEAN DEFAULT true;

-- Update the column to have a NOT NULL constraint
ALTER TABLE events 
ALTER COLUMN cancellation_allowed SET NOT NULL;

-- Optional: Update specific events to not allow cancellation
-- Uncomment and modify as needed for your specific events
-- UPDATE events SET cancellation_allowed = false WHERE category_id = 1; -- Example: Workshop events
-- UPDATE events SET cancellation_allowed = false WHERE registration_fee > 500; -- Example: High-fee events

-- Verify the migration
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'events' 
    AND column_name = 'cancellation_allowed';

-- Show sample data to verify
SELECT id, title, cancellation_allowed 
FROM events 
LIMIT 5;
