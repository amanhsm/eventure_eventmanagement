-- Simple cancellation function that works with the existing auth system
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
