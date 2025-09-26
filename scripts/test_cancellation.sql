-- Test script to check if cancellation updates work
-- Run this to test if the database allows cancellation updates

-- First, let's see the current registrations
SELECT id, event_id, student_id, status, cancelled_at, cancellation_reason 
FROM event_registrations 
WHERE status = 'registered' 
LIMIT 5;

-- Check if we can update a registration (replace ID with actual ID from above query)
-- UPDATE event_registrations 
-- SET status = 'cancelled', 
--     cancelled_at = NOW(), 
--     cancellation_reason = 'Test cancellation'
-- WHERE id = YOUR_REGISTRATION_ID_HERE;

-- Check table structure
\d event_registrations;

-- Check for any constraints or triggers
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'event_registrations'::regclass;

-- Check for RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'event_registrations';
