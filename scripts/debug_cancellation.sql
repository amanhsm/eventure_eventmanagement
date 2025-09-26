-- Debug script for cancellation issues
-- Run these queries to debug the cancellation problem

-- 1. Check current registrations
SELECT 
    er.id,
    er.event_id,
    er.student_id,
    er.status,
    er.cancelled_at,
    er.cancellation_reason,
    e.title as event_title,
    s.name as student_name
FROM event_registrations er
JOIN events e ON er.event_id = e.id
JOIN students s ON er.student_id = s.id
WHERE er.status = 'registered'
ORDER BY er.created_at DESC
LIMIT 10;

-- 2. Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'event_registrations'
ORDER BY ordinal_position;

-- 3. Check for any constraints that might prevent updates
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'event_registrations';

-- 4. Check RLS policies (if any)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'event_registrations';

-- 5. Test manual update (uncomment and replace with actual ID to test)
-- UPDATE event_registrations 
-- SET 
--     status = 'cancelled',
--     cancelled_at = NOW(),
--     cancellation_reason = 'Manual test cancellation'
-- WHERE id = 1; -- Replace with actual registration ID

-- 6. Check if the update worked
-- SELECT * FROM event_registrations WHERE id = 1; -- Replace with actual registration ID
