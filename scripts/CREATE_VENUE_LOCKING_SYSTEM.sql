-- =============================================
-- VENUE LOCKING SYSTEM
-- Prevents simultaneous venue booking by multiple users
-- =============================================

-- Create venue_locks table
CREATE TABLE IF NOT EXISTS venue_locks (
    id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    locked_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    lock_type VARCHAR(20) DEFAULT 'temporary' CHECK (lock_type IN ('temporary', 'draft', 'confirmed')),
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    session_id VARCHAR(255), -- For tracking user sessions
    
    -- Prevent overlapping locks for same venue/time
    CONSTRAINT no_overlapping_locks EXCLUDE USING gist (
        venue_id WITH =,
        event_date WITH =,
        tsrange(start_time::text::time, end_time::text::time) WITH &&
    ) WHERE (expires_at > CURRENT_TIMESTAMP)
);

-- Create indexes for performance
CREATE INDEX idx_venue_locks_venue_date ON venue_locks(venue_id, event_date);
CREATE INDEX idx_venue_locks_expires_at ON venue_locks(expires_at);
CREATE INDEX idx_venue_locks_user_id ON venue_locks(locked_by_user_id);
CREATE INDEX idx_venue_locks_session_id ON venue_locks(session_id);

-- Function to clean up expired locks
CREATE OR REPLACE FUNCTION cleanup_expired_venue_locks()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM venue_locks 
    WHERE expires_at < CURRENT_TIMESTAMP 
    AND lock_type = 'temporary';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to create a venue lock
CREATE OR REPLACE FUNCTION create_venue_lock(
    p_venue_id INTEGER,
    p_event_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_user_id INTEGER,
    p_lock_duration_minutes INTEGER DEFAULT 15,
    p_lock_type VARCHAR(20) DEFAULT 'temporary',
    p_session_id VARCHAR(255) DEFAULT NULL,
    p_event_id INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    lock_id INTEGER;
    expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Clean up expired locks first
    PERFORM cleanup_expired_venue_locks();
    
    -- Calculate expiration time
    expires_at := CURRENT_TIMESTAMP + (p_lock_duration_minutes || ' minutes')::INTERVAL;
    
    -- Try to create the lock
    BEGIN
        INSERT INTO venue_locks (
            venue_id, event_date, start_time, end_time, 
            locked_by_user_id, expires_at, lock_type, session_id, event_id
        ) VALUES (
            p_venue_id, p_event_date, p_start_time, p_end_time,
            p_user_id, expires_at, p_lock_type, p_session_id, p_event_id
        ) RETURNING id INTO lock_id;
        
        RETURN json_build_object(
            'success', true,
            'lock_id', lock_id,
            'expires_at', expires_at,
            'message', 'Venue locked successfully'
        );
        
    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'message', 'Venue is already booked for this time slot'
        );
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to extend a venue lock
CREATE OR REPLACE FUNCTION extend_venue_lock(
    p_lock_id INTEGER,
    p_user_id INTEGER,
    p_additional_minutes INTEGER DEFAULT 15
)
RETURNS JSON AS $$
DECLARE
    lock_record RECORD;
BEGIN
    -- Get the lock record
    SELECT * INTO lock_record 
    FROM venue_locks 
    WHERE id = p_lock_id AND locked_by_user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Lock not found or not owned by user'
        );
    END IF;
    
    -- Extend the lock
    UPDATE venue_locks 
    SET expires_at = expires_at + (p_additional_minutes || ' minutes')::INTERVAL
    WHERE id = p_lock_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Lock extended successfully',
        'new_expires_at', (SELECT expires_at FROM venue_locks WHERE id = p_lock_id)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to release a venue lock
CREATE OR REPLACE FUNCTION release_venue_lock(
    p_lock_id INTEGER,
    p_user_id INTEGER
)
RETURNS JSON AS $$
BEGIN
    DELETE FROM venue_locks 
    WHERE id = p_lock_id 
    AND locked_by_user_id = p_user_id;
    
    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Lock released successfully'
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'message', 'Lock not found or not owned by user'
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check venue availability
CREATE OR REPLACE FUNCTION check_venue_availability(
    p_venue_id INTEGER,
    p_event_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_exclude_lock_id INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    conflict_count INTEGER;
    existing_events INTEGER;
    active_locks INTEGER;
BEGIN
    -- Clean up expired locks first
    PERFORM cleanup_expired_venue_locks();
    
    -- Check for existing confirmed events
    SELECT COUNT(*) INTO existing_events
    FROM events 
    WHERE venue_id = p_venue_id 
    AND event_date = p_event_date
    AND status IN ('approved', 'pending_approval')
    AND (
        (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
    );
    
    -- Check for active locks (excluding the specified lock)
    SELECT COUNT(*) INTO active_locks
    FROM venue_locks 
    WHERE venue_id = p_venue_id 
    AND event_date = p_event_date
    AND expires_at > CURRENT_TIMESTAMP
    AND (p_exclude_lock_id IS NULL OR id != p_exclude_lock_id)
    AND tsrange(start_time::text::time, end_time::text::time) && 
        tsrange(p_start_time::text::time, p_end_time::text::time);
    
    IF existing_events > 0 OR active_locks > 0 THEN
        RETURN json_build_object(
            'available', false,
            'reason', CASE 
                WHEN existing_events > 0 THEN 'Venue already booked by confirmed event'
                ELSE 'Venue temporarily locked by another user'
            END,
            'existing_events', existing_events,
            'active_locks', active_locks
        );
    ELSE
        RETURN json_build_object(
            'available', true,
            'message', 'Venue is available for booking'
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to convert temporary lock to confirmed (when event is created)
CREATE OR REPLACE FUNCTION confirm_venue_lock(
    p_lock_id INTEGER,
    p_event_id INTEGER,
    p_user_id INTEGER
)
RETURNS JSON AS $$
BEGIN
    UPDATE venue_locks 
    SET 
        lock_type = 'confirmed',
        event_id = p_event_id,
        expires_at = CURRENT_TIMESTAMP + INTERVAL '1 year' -- Long expiration for confirmed locks
    WHERE id = p_lock_id 
    AND locked_by_user_id = p_user_id;
    
    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Lock confirmed and linked to event'
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'message', 'Lock not found or not owned by user'
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled cleanup job (run this periodically)
-- This would typically be run by a cron job or scheduled task
CREATE OR REPLACE FUNCTION schedule_venue_lock_cleanup()
RETURNS TEXT AS $$
BEGIN
    PERFORM cleanup_expired_venue_locks();
    RETURN 'Venue lock cleanup completed at ' || CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

SELECT 'Venue locking system created successfully!' as status;
