-- =============================================
-- SIMPLIFIED VENUE BOOKING SYSTEM
-- No locking - just track approved events and venue usage
-- =============================================

-- 1. Add is_active column to venues if missing
ALTER TABLE venues ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
UPDATE venues SET is_active = true WHERE is_active IS NULL;

-- 2. Create simplified venue bookings table
CREATE TABLE IF NOT EXISTS venue_bookings (
    id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    organizer_id INTEGER NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
    
    -- Booking Details
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Status (simple)
    booking_status VARCHAR(20) DEFAULT 'confirmed' CHECK (
        booking_status IN ('confirmed', 'cancelled', 'completed')
    ),
    
    -- Basic Info
    event_title VARCHAR(255) NOT NULL,
    expected_attendees INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT valid_attendees CHECK (expected_attendees >= 0),
    UNIQUE(event_id) -- One booking per event
);

-- 3. Create booking history for audit trail
CREATE TABLE IF NOT EXISTS booking_history (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES venue_bookings(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'created', 'cancelled', 'completed'
    performed_by INTEGER NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_venue_bookings_venue_date ON venue_bookings(venue_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_venue_bookings_event ON venue_bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_venue_bookings_status ON venue_bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_booking_history_booking ON booking_history(booking_id);

-- 5. Simple function to create venue booking when event is approved
CREATE OR REPLACE FUNCTION create_venue_booking_for_approved_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create booking when event is approved and has venue details
    IF NEW.status = 'approved' AND OLD.status != 'approved' AND
       NEW.venue_id IS NOT NULL AND NEW.event_date IS NOT NULL AND 
       NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
        
        -- Insert venue booking
        INSERT INTO venue_bookings (
            venue_id, event_id, organizer_id,
            booking_date, start_time, end_time,
            event_title, expected_attendees,
            booking_status
        ) VALUES (
            NEW.venue_id,
            NEW.id,
            NEW.organizer_id,
            NEW.event_date,
            NEW.start_time,
            NEW.end_time,
            NEW.title,
            NEW.max_participants,
            'confirmed'
        )
        ON CONFLICT (event_id) DO UPDATE SET
            venue_id = EXCLUDED.venue_id,
            booking_date = EXCLUDED.booking_date,
            start_time = EXCLUDED.start_time,
            end_time = EXCLUDED.end_time,
            event_title = EXCLUDED.event_title,
            expected_attendees = EXCLUDED.expected_attendees,
            updated_at = CURRENT_TIMESTAMP;
        
        -- Log the booking creation
        INSERT INTO booking_history (booking_id, action, performed_by, notes)
        SELECT 
            vb.id, 
            'created', 
            (SELECT user_id FROM organizers WHERE id = NEW.organizer_id),
            'Booking created when event was approved'
        FROM venue_bookings vb 
        WHERE vb.event_id = NEW.id;
        
    END IF;
    
    -- Cancel booking if event is cancelled/rejected
    IF NEW.status IN ('cancelled', 'rejected') AND OLD.status != NEW.status THEN
        UPDATE venue_bookings 
        SET booking_status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE event_id = NEW.id;
        
        -- Log the cancellation
        INSERT INTO booking_history (booking_id, action, performed_by, notes)
        SELECT 
            vb.id, 
            'cancelled', 
            (SELECT user_id FROM organizers WHERE id = NEW.organizer_id),
            'Booking cancelled because event was ' || NEW.status
        FROM venue_bookings vb 
        WHERE vb.event_id = NEW.id;
    END IF;
    
    -- Mark booking as completed when event is completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE venue_bookings 
        SET booking_status = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE event_id = NEW.id;
        
        -- Log the completion
        INSERT INTO booking_history (booking_id, action, performed_by, notes)
        SELECT 
            vb.id, 
            'completed', 
            (SELECT user_id FROM organizers WHERE id = NEW.organizer_id),
            'Booking completed when event finished'
        FROM venue_bookings vb 
        WHERE vb.event_id = NEW.id;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- If anything fails, just continue
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for automatic booking management
DROP TRIGGER IF EXISTS auto_venue_booking_for_event ON events;
DROP TRIGGER IF EXISTS simple_auto_venue_booking_for_event ON events;

CREATE TRIGGER manage_venue_booking_on_event_status_change
    AFTER UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION create_venue_booking_for_approved_event();

-- 7. Function to get venue bookings with conflict checking
CREATE OR REPLACE FUNCTION get_venue_bookings_with_conflicts(
    p_venue_id INTEGER DEFAULT NULL,
    p_date_from DATE DEFAULT CURRENT_DATE,
    p_date_to DATE DEFAULT CURRENT_DATE + INTERVAL '30 days'
)
RETURNS TABLE(
    booking_id INTEGER,
    event_id INTEGER,
    venue_name TEXT,
    event_title TEXT,
    booking_date DATE,
    start_time TIME,
    end_time TIME,
    booking_status TEXT,
    organizer_name TEXT,
    expected_attendees INTEGER,
    has_conflicts BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH booking_conflicts AS (
        SELECT 
            vb1.id as booking_id,
            CASE 
                WHEN COUNT(vb2.id) > 0 THEN true 
                ELSE false 
            END as has_conflicts
        FROM venue_bookings vb1
        LEFT JOIN venue_bookings vb2 ON (
            vb1.venue_id = vb2.venue_id 
            AND vb1.booking_date = vb2.booking_date
            AND vb1.id != vb2.id
            AND vb1.booking_status = 'confirmed'
            AND vb2.booking_status = 'confirmed'
            AND (vb1.start_time, vb1.end_time) OVERLAPS (vb2.start_time, vb2.end_time)
        )
        GROUP BY vb1.id
    )
    SELECT 
        vb.id,
        vb.event_id,
        v.venue_name,
        vb.event_title,
        vb.booking_date,
        vb.start_time,
        vb.end_time,
        vb.booking_status,
        o.name as organizer_name,
        vb.expected_attendees,
        COALESCE(bc.has_conflicts, false)
    FROM venue_bookings vb
    JOIN venues v ON vb.venue_id = v.id
    JOIN organizers o ON vb.organizer_id = o.id
    LEFT JOIN booking_conflicts bc ON vb.id = bc.booking_id
    WHERE 
        (p_venue_id IS NULL OR vb.venue_id = p_venue_id)
        AND vb.booking_date BETWEEN p_date_from AND p_date_to
        AND vb.booking_status IN ('confirmed', 'completed')
    ORDER BY vb.booking_date, vb.start_time;
END;
$$ LANGUAGE plpgsql;

-- 8. Function to check for venue conflicts (for admin reference)
CREATE OR REPLACE FUNCTION check_venue_conflicts_for_date(
    p_venue_id INTEGER,
    p_date DATE
)
RETURNS TABLE(
    conflict_count INTEGER,
    conflicting_events TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH overlapping_bookings AS (
        SELECT 
            vb1.event_title as event1,
            vb2.event_title as event2,
            vb1.start_time as start1,
            vb1.end_time as end1,
            vb2.start_time as start2,
            vb2.end_time as end2
        FROM venue_bookings vb1
        JOIN venue_bookings vb2 ON (
            vb1.venue_id = vb2.venue_id 
            AND vb1.booking_date = vb2.booking_date
            AND vb1.id < vb2.id  -- Avoid duplicates
            AND vb1.booking_status = 'confirmed'
            AND vb2.booking_status = 'confirmed'
            AND (vb1.start_time, vb1.end_time) OVERLAPS (vb2.start_time, vb2.end_time)
        )
        WHERE vb1.venue_id = p_venue_id 
        AND vb1.booking_date = p_date
    )
    SELECT 
        COUNT(*)::INTEGER as conflict_count,
        ARRAY_AGG(event1 || ' vs ' || event2) as conflicting_events
    FROM overlapping_bookings;
END;
$$ LANGUAGE plpgsql;

-- 9. Update timestamp trigger
CREATE OR REPLACE FUNCTION update_booking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER venue_bookings_update_timestamp
    BEFORE UPDATE ON venue_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_booking_timestamp();

-- 10. Sample queries for admins
-- View all current bookings
-- SELECT * FROM get_venue_bookings_with_conflicts();

-- Check conflicts for a specific venue and date
-- SELECT * FROM check_venue_conflicts_for_date(1, '2025-09-30');

-- View booking history
-- SELECT bh.*, u.email as performed_by_user 
-- FROM booking_history bh 
-- JOIN users u ON bh.performed_by = u.id 
-- ORDER BY bh.created_at DESC;

SELECT 'Simplified venue booking system created successfully!' as status;
SELECT 'No locking needed - admins approve based on their criteria' as note;
SELECT 'Venue bookings automatically created when events are approved' as workflow;
