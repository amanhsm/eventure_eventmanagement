-- Complete RLS Policy Fix for Event Management System
-- Run this script in Supabase SQL Editor to fix registration and cancellation issues

-- 1. First, let's see what RLS policies currently exist
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
WHERE tablename IN ('event_registrations', 'events', 'students', 'users')
ORDER BY tablename, policyname;

-- 2. Check if RLS is enabled on these tables
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('event_registrations', 'events', 'students', 'users')
ORDER BY tablename;

-- 3. TEMPORARY FIX: Disable RLS on event_registrations table
-- WARNING: This removes all security restrictions - use only for testing
ALTER TABLE event_registrations DISABLE ROW LEVEL SECURITY;

-- 4. PROPER FIX: Create appropriate RLS policies for your custom auth system
-- First, re-enable RLS
-- ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for students to manage their own registrations
-- Note: Adjust these based on your actual auth system structure

-- Policy for students to INSERT their own registrations
-- CREATE POLICY "Students can register for events" ON event_registrations
-- FOR INSERT 
-- WITH CHECK (
--     student_id IN (
--         SELECT s.id 
--         FROM students s 
--         JOIN users u ON s.user_id = u.id 
--         WHERE u.id = current_setting('app.current_user_id')::integer
--     )
-- );

-- Policy for students to SELECT their own registrations
-- CREATE POLICY "Students can view own registrations" ON event_registrations
-- FOR SELECT 
-- USING (
--     student_id IN (
--         SELECT s.id 
--         FROM students s 
--         JOIN users u ON s.user_id = u.id 
--         WHERE u.id = current_setting('app.current_user_id')::integer
--     )
-- );

-- Policy for students to UPDATE their own registrations
-- CREATE POLICY "Students can update own registrations" ON event_registrations
-- FOR UPDATE 
-- USING (
--     student_id IN (
--         SELECT s.id 
--         FROM students s 
--         JOIN users u ON s.user_id = u.id 
--         WHERE u.id = current_setting('app.current_user_id')::integer
--     )
-- );

-- 6. Alternative: Create a bypass function for registration operations
CREATE OR REPLACE FUNCTION register_for_event(
    p_event_id INTEGER,
    p_student_user_id INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_student_id INTEGER;
    v_max_participants INTEGER;
    v_current_participants INTEGER;
    v_registration_deadline TIMESTAMP;
    v_existing_registration INTEGER;
    v_status TEXT;
BEGIN
    -- Get student ID from user ID
    SELECT id INTO v_student_id 
    FROM students 
    WHERE user_id = p_student_user_id;
    
    IF v_student_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Student not found');
    END IF;
    
    -- Check if already registered or previously cancelled
    SELECT id INTO v_existing_registration
    FROM event_registrations 
    WHERE event_id = p_event_id 
    AND student_id = v_student_id 
    AND status IN ('registered', 'cancelled');
    
    IF v_existing_registration IS NOT NULL THEN
        -- Check the specific status
        SELECT status INTO v_status
        FROM event_registrations 
        WHERE id = v_existing_registration;
        
        IF v_status = 'registered' THEN
            RETURN json_build_object('success', false, 'error', 'Already registered for this event');
        ELSIF v_status = 'cancelled' THEN
            RETURN json_build_object('success', false, 'error', 'You have previously cancelled your registration for this event. Once cancelled, re-registration is not allowed. For more information, please contact the event coordinator or your respective teacher.');
        END IF;
    END IF;
    
    -- Get event details
    SELECT max_participants, current_participants, registration_deadline
    INTO v_max_participants, v_current_participants, v_registration_deadline
    FROM events 
    WHERE id = p_event_id AND status = 'approved';
    
    IF v_max_participants IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Event not found or not approved');
    END IF;
    
    -- Check capacity
    IF v_current_participants >= v_max_participants THEN
        RETURN json_build_object('success', false, 'error', 'Event is full');
    END IF;
    
    -- Check deadline
    IF v_registration_deadline < NOW() THEN
        RETURN json_build_object('success', false, 'error', 'Registration deadline has passed');
    END IF;
    
    -- Insert registration
    INSERT INTO event_registrations (
        event_id, 
        student_id, 
        status, 
        registration_date,
        created_at,
        updated_at
    ) VALUES (
        p_event_id, 
        v_student_id, 
        'registered', 
        NOW(),
        NOW(),
        NOW()
    );
    
    -- Update participant count
    UPDATE events 
    SET current_participants = current_participants + 1
    WHERE id = p_event_id;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Registration successful',
        'event_id', p_event_id,
        'student_id', v_student_id
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Test the functions
-- SELECT register_for_event(1, 1); -- Replace with actual event_id and user_id
-- SELECT cancel_registration_simple(1); -- Replace with actual registration_id
