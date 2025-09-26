-- =============================================
-- SIMPLE VENUE LOCKING SOLUTION
-- Basic venue conflict prevention
-- =============================================

-- Add a simple venue booking check function
CREATE OR REPLACE FUNCTION check_venue_conflict(
    p_venue_id INTEGER,
    p_event_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_exclude_event_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    -- Check for overlapping events in the same venue
    SELECT COUNT(*) INTO conflict_count
    FROM events 
    WHERE venue_id = p_venue_id 
    AND event_date = p_event_date
    AND status IN ('approved', 'pending_approval', 'draft')
    AND (p_exclude_event_id IS NULL OR id != p_exclude_event_id)
    AND (
        -- Check for time overlap
        (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
    );
    
    -- Return true if no conflicts (venue is available)
    RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to prevent venue conflicts when inserting/updating events
CREATE OR REPLACE FUNCTION prevent_venue_conflicts()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip check if venue, date, or time is null
    IF NEW.venue_id IS NULL OR NEW.event_date IS NULL OR 
       NEW.start_time IS NULL OR NEW.end_time IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Check for venue conflicts
    IF NOT check_venue_conflict(
        NEW.venue_id, 
        NEW.event_date, 
        NEW.start_time, 
        NEW.end_time, 
        NEW.id
    ) THEN
        RAISE EXCEPTION 'Venue is already booked for this time slot. Please choose a different venue or time.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS venue_conflict_check ON events;
CREATE TRIGGER venue_conflict_check
    BEFORE INSERT OR UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION prevent_venue_conflicts();

-- Function to get available venues for a specific date/time
CREATE OR REPLACE FUNCTION get_available_venues(
    p_event_date DATE,
    p_start_time TIME,
    p_end_time TIME
)
RETURNS TABLE(
    venue_id INTEGER,
    venue_name TEXT,
    block_name TEXT,
    max_capacity INTEGER,
    facilities TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.venue_name,
        b.block_name,
        v.max_capacity,
        v.facilities
    FROM venues v
    JOIN blocks b ON v.block_id = b.id
    WHERE check_venue_conflict(v.id, p_event_date, p_start_time, p_end_time)
    ORDER BY v.venue_name;
END;
$$ LANGUAGE plpgsql;

SELECT 'Simple venue locking system created!' as status;
