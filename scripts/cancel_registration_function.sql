-- Create a database function to handle registration cancellation
-- This bypasses RLS issues by running with elevated privileges

CREATE OR REPLACE FUNCTION cancel_registration(
    p_registration_id INTEGER,
    p_student_user_id INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_student_id INTEGER;
    v_event_id INTEGER;
    v_result JSON;
BEGIN
    -- Get student ID from user ID
    SELECT id INTO v_student_id 
    FROM students 
    WHERE user_id = p_student_user_id;
    
    IF v_student_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Student not found');
    END IF;
    
    -- Get event ID and verify the registration belongs to this student
    SELECT event_id INTO v_event_id
    FROM event_registrations 
    WHERE id = p_registration_id 
    AND student_id = v_student_id 
    AND status = 'registered';
    
    IF v_event_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Registration not found or already cancelled');
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
