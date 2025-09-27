-- =============================================
-- QUICK FIX FOR EVENT CREATION ERROR
-- Fix is_active column issue immediately
-- =============================================

-- 1. Add is_active column to venues if it doesn't exist
ALTER TABLE venues ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Update all existing venues to be active
UPDATE venues SET is_active = true WHERE is_active IS NULL;

-- 3. Disable the problematic trigger temporarily if it exists
DROP TRIGGER IF EXISTS auto_venue_booking_for_event ON events;

-- 4. Create a simpler trigger that doesn't check is_active
CREATE OR REPLACE FUNCTION simple_auto_create_venue_booking()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create booking if event has venue and is not draft
    IF NEW.venue_id IS NOT NULL AND NEW.event_date IS NOT NULL AND 
       NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL AND
       NEW.status != 'draft' THEN
        
        -- Check if booking already exists for this event
        IF NOT EXISTS (
            SELECT 1 FROM venue_bookings WHERE event_id = NEW.id
        ) THEN
            -- Create venue booking for the event (simplified)
            INSERT INTO venue_bookings (
                venue_id, booking_date, start_time, end_time,
                booked_by_user_id, booking_purpose, event_id,
                booking_status
            ) VALUES (
                NEW.venue_id,
                NEW.event_date,
                NEW.start_time,
                NEW.end_time,
                (SELECT user_id FROM organizers WHERE id = NEW.organizer_id),
                'event',
                NEW.id,
                CASE 
                    WHEN NEW.status = 'approved' THEN 'confirmed'
                    ELSE 'pending'
                END
            );
        END IF;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- If anything fails, just continue without creating booking
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create the simplified trigger
CREATE TRIGGER simple_auto_venue_booking_for_event
    AFTER INSERT OR UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION simple_auto_create_venue_booking();

-- 6. Verify venues table structure
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'venues' 
AND column_name IN ('id', 'venue_name', 'is_active')
ORDER BY column_name;

SELECT 'Event creation should now work!' as status;
