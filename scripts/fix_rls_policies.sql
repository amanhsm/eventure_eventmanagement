-- Check and fix RLS policies for event_registrations table

-- 1. Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'event_registrations';

-- 2. Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'event_registrations';

-- 3. If RLS is enabled but no UPDATE policy exists for students, create one
-- This allows students to update their own registrations

-- First, let's see if there's a policy for students to update their registrations
-- If not, we need to create one

-- Example policy to allow students to update their own registrations:
-- CREATE POLICY "Students can update own registrations" ON event_registrations
-- FOR UPDATE USING (
--     student_id IN (
--         SELECT id FROM students WHERE user_id = auth.uid()
--     )
-- );

-- 4. Alternative: Temporarily disable RLS for testing (NOT recommended for production)
-- ALTER TABLE event_registrations DISABLE ROW LEVEL SECURITY;

-- 5. Check if the issue is with the student_id lookup
-- This query should return the student ID for the current user
-- SELECT s.id as student_id, s.user_id, u.email 
-- FROM students s 
-- JOIN auth.users u ON s.user_id = u.id 
-- WHERE u.id = auth.uid();

-- 6. Test update with a specific student (replace IDs with actual values)
-- UPDATE event_registrations 
-- SET status = 'cancelled', 
--     cancelled_at = NOW(), 
--     cancellation_reason = 'Test cancellation'
-- WHERE id = 1 AND student_id = 1; -- Replace with actual IDs
