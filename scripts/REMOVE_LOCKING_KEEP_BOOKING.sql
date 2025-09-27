-- =============================================
-- REMOVE LOCKING FUNCTIONS - KEEP EXISTING TABLES
-- Just clean up locking complexity, keep venue booking tables
-- =============================================

-- 1. Fix the is_active column issue first (if not already done)
ALTER TABLE venues ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
UPDATE venues SET is_active = true WHERE is_active IS NULL;

-- 2. Remove all locking-related functions (if they exist)
DROP FUNCTION IF EXISTS create_venue_lock(INTEGER, DATE, TIME, TIME, INTEGER, INTEGER, VARCHAR);
DROP FUNCTION IF EXISTS extend_venue_lock(INTEGER);
DROP FUNCTION IF EXISTS release_venue_lock(INTEGER);
DROP FUNCTION IF EXISTS cleanup_expired_venue_locks();
DROP FUNCTION IF EXISTS check_venue_conflict(INTEGER, DATE, TIME, TIME, INTEGER);

-- 3. Remove locking table (if it exists)
DROP TABLE IF EXISTS venue_locks CASCADE;

-- 4. Remove complex triggers
DROP TRIGGER IF EXISTS auto_venue_booking_for_event ON events;
DROP TRIGGER IF EXISTS simple_auto_venue_booking_for_event ON events;
DROP TRIGGER IF EXISTS venue_conflict_check ON events;
DROP TRIGGER IF EXISTS prevent_venue_conflicts ON events;

-- 5. Create simple trigger for venue booking when event is approved
CREATE OR REPLACE FUNCTION create_booking_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Only when event status changes to approved
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') AND
       NEW.venue_id IS NOT NULL AND NEW.event_date IS NOT NULL AND 
       NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
        
        -- Create or update venue booking
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
            
    END IF;
    
    -- Cancel booking if event is cancelled/rejected
    IF NEW.status IN ('cancelled', 'rejected') AND 
       (OLD.status IS NULL OR OLD.status NOT IN ('cancelled', 'rejected')) THEN
        UPDATE venue_bookings 
        SET booking_status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE event_id = NEW.id;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- If anything fails, just continue
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create the simple trigger
CREATE TRIGGER simple_booking_on_approval
    AFTER UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION create_booking_on_approval();

-- 7. Verify existing tables are intact
SELECT 
    table_name,
    CASE 
        WHEN table_name = 'venue_bookings' THEN 'Main booking records'
        WHEN table_name = 'booking_history' THEN 'Audit trail'
        WHEN table_name = 'venue_availability' THEN 'Venue operating hours'
        WHEN table_name = 'venue_maintenance' THEN 'Maintenance schedule'
        ELSE 'Other table'
    END as purpose
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('venue_bookings', 'booking_history', 'venue_availability', 'venue_maintenance')
ORDER BY table_name;

SELECT 'Locking functions removed - keeping simple booking system!' as status;
SELECT 'Venue bookings will be created when events are approved' as workflow;
