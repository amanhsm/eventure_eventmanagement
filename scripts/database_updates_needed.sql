-- Database Updates Needed for Calendar Sync and Cancellation Features
-- Run these in your Supabase SQL Editor

-- 1. CRITICAL: Create the cancellation function (if not already created)
CREATE OR REPLACE FUNCTION cancel_registration_simple(
    p_registration_id INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_event_id INTEGER;
    v_current_status TEXT;
BEGIN
    -- Check if registration exists and get event ID
    SELECT event_id, status INTO v_event_id, v_current_status
    FROM event_registrations 
    WHERE id = p_registration_id;
    
    IF v_event_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Registration not found');
    END IF;
    
    IF v_current_status = 'cancelled' THEN
        RETURN json_build_object('success', false, 'error', 'Registration already cancelled');
    END IF;
    
    -- Update the registration
    UPDATE event_registrations 
    SET 
        status = 'cancelled',
        cancelled_at = NOW(),
        cancellation_reason = 'Cancelled by student',
        updated_at = NOW()
    WHERE id = p_registration_id;
    
    -- Update event participant count
    UPDATE events 
    SET current_participants = GREATEST(current_participants - 1, 0)
    WHERE id = v_event_id;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Registration cancelled successfully',
        'registration_id', p_registration_id,
        'event_id', v_event_id
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. CRITICAL: Create the registration function (if not already created)
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

-- 3. OPTIONAL: Disable RLS temporarily if you're having permission issues
-- WARNING: This removes security restrictions - only use for testing
-- ALTER TABLE event_registrations DISABLE ROW LEVEL SECURITY;

-- 4. Check current RLS policies (run this to see what policies exist)
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
WHERE tablename = 'event_registrations'
ORDER BY policyname;

-- 5. Check if RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'event_registrations';

-- 6. OPTIONAL: Add indexes for better performance (if not already present)
CREATE INDEX IF NOT EXISTS idx_event_registrations_student_status 
ON event_registrations(student_id, status);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_status 
ON event_registrations(event_id, status);

CREATE INDEX IF NOT EXISTS idx_events_date_status 
ON events(event_date, status);

-- 7. Verify your table structure matches what the code expects
-- Run this to check the event_registrations table structure:
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'event_registrations'
ORDER BY ordinal_position;
