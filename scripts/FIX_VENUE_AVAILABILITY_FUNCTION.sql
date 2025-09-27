-- =============================================
-- FIX VENUE AVAILABILITY FUNCTION
-- Remove dependency on is_active column
-- =============================================

-- Updated venue availability check function (without is_active dependency)
CREATE OR REPLACE FUNCTION check_venue_booking_availability(
    p_venue_id INTEGER,
    p_booking_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_exclude_booking_id INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    existing_bookings INTEGER;
    maintenance_conflicts INTEGER;
    venue_exists BOOLEAN;
    availability_window RECORD;
BEGIN
    -- Check if venue exists (simplified check)
    SELECT COUNT(*) > 0 INTO venue_exists 
    FROM venues 
    WHERE id = p_venue_id;
    
    IF NOT venue_exists THEN
        RETURN json_build_object(
            'available', false,
            'reason', 'Venue not found'
        );
    END IF;
    
    -- Check venue availability hours for the day of week (if table exists)
    BEGIN
        SELECT available_from, available_to, is_available 
        INTO availability_window
        FROM venue_availability 
        WHERE venue_id = p_venue_id 
        AND day_of_week = EXTRACT(DOW FROM p_booking_date);
        
        IF FOUND AND NOT availability_window.is_available THEN
            RETURN json_build_object(
                'available', false,
                'reason', 'Venue not available on this day of week'
            );
        END IF;
        
        -- Check if requested time is within availability window
        IF FOUND AND (p_start_time < availability_window.available_from OR 
           p_end_time > availability_window.available_to) THEN
            RETURN json_build_object(
                'available', false,
                'reason', 'Requested time outside venue availability hours',
                'available_from', availability_window.available_from,
                'available_to', availability_window.available_to
            );
        END IF;
    EXCEPTION
        WHEN undefined_table THEN
            -- venue_availability table doesn't exist, skip this check
            NULL;
    END;
    
    -- Check for existing bookings (if table exists)
    BEGIN
        SELECT COUNT(*) INTO existing_bookings
        FROM venue_bookings 
        WHERE venue_id = p_venue_id 
        AND booking_date = p_booking_date
        AND booking_status IN ('confirmed', 'pending')
        AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
        AND (start_time, end_time) OVERLAPS (p_start_time, p_end_time);
    EXCEPTION
        WHEN undefined_table THEN
            -- venue_bookings table doesn't exist, skip this check
            existing_bookings := 0;
    END;
    
    -- Check for maintenance conflicts (if table exists)
    BEGIN
        SELECT COUNT(*) INTO maintenance_conflicts
        FROM venue_maintenance 
        WHERE venue_id = p_venue_id 
        AND maintenance_date = p_booking_date
        AND maintenance_status IN ('scheduled', 'in_progress')
        AND (start_time, end_time) OVERLAPS (p_start_time, p_end_time);
    EXCEPTION
        WHEN undefined_table THEN
            -- venue_maintenance table doesn't exist, skip this check
            maintenance_conflicts := 0;
    END;
    
    IF existing_bookings > 0 THEN
        RETURN json_build_object(
            'available', false,
            'reason', 'Venue already booked for this time slot'
        );
    END IF;
    
    IF maintenance_conflicts > 0 THEN
        RETURN json_build_object(
            'available', false,
            'reason', 'Venue scheduled for maintenance during this time'
        );
    END IF;
    
    RETURN json_build_object(
        'available', true,
        'message', 'Venue is available for booking'
    );
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT check_venue_booking_availability(
    1, 
    CURRENT_DATE + INTERVAL '1 day', 
    '10:00:00'::TIME, 
    '12:00:00'::TIME
) as availability_test;

SELECT 'Fixed venue availability function!' as status;
