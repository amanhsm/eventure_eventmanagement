-- =============================================
-- COMPREHENSIVE VENUE BOOKING SYSTEM
-- Normalized tables with clear relationships
-- =============================================

-- Create sequence for booking reference FIRST
CREATE SEQUENCE IF NOT EXISTS venue_booking_seq START 1;

-- 1. VENUE BOOKINGS TABLE (Main booking records)
CREATE TABLE IF NOT EXISTS venue_bookings (
    id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    booked_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organizer_id INTEGER REFERENCES organizers(id) ON DELETE SET NULL,
    
    -- Booking Details
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    booking_duration_hours DECIMAL(4,2) GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time)) / 3600
    ) STORED,
    
    -- Booking Status
    booking_status VARCHAR(20) DEFAULT 'pending' CHECK (
        booking_status IN ('pending', 'confirmed', 'cancelled', 'completed', 'draft')
    ),
    
    -- Purpose and Details
    booking_purpose VARCHAR(100) NOT NULL, -- 'event', 'meeting', 'rehearsal', etc.
    expected_attendees INTEGER DEFAULT 0,
    special_requirements TEXT,
    setup_notes TEXT,
    
    -- Approval Workflow
    requires_approval BOOLEAN DEFAULT true,
    approved_by INTEGER REFERENCES administrators(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Booking Metadata
    booking_reference VARCHAR(50) UNIQUE DEFAULT 'VB-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(nextval('venue_booking_seq')::TEXT, 6, '0'),
    priority_level VARCHAR(10) DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT valid_attendees CHECK (expected_attendees >= 0),
    CONSTRAINT future_booking CHECK (booking_date >= CURRENT_DATE)
);


-- 2. BOOKING EQUIPMENT TABLE (Equipment requested for bookings)
CREATE TABLE IF NOT EXISTS booking_equipment (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES venue_bookings(id) ON DELETE CASCADE,
    equipment_name VARCHAR(100) NOT NULL,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    equipment_type VARCHAR(50), -- 'audio', 'visual', 'furniture', 'technical'
    is_available BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. BOOKING SERVICES TABLE (Additional services requested)
CREATE TABLE IF NOT EXISTS booking_services (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES venue_bookings(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL,
    service_type VARCHAR(50), -- 'catering', 'cleaning', 'security', 'technical_support'
    service_cost DECIMAL(10,2) DEFAULT 0.00,
    service_provider VARCHAR(100),
    is_confirmed BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. BOOKING HISTORY TABLE (Track all changes to bookings)
CREATE TABLE IF NOT EXISTS booking_history (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES venue_bookings(id) ON DELETE CASCADE,
    changed_by INTEGER NOT NULL REFERENCES users(id),
    change_type VARCHAR(50) NOT NULL, -- 'created', 'updated', 'approved', 'cancelled', 'completed'
    old_values JSONB,
    new_values JSONB,
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. VENUE AVAILABILITY TABLE (Define when venues are available)
CREATE TABLE IF NOT EXISTS venue_availability (
    id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    available_from TIME NOT NULL,
    available_to TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_availability_time CHECK (available_to > available_from),
    UNIQUE(venue_id, day_of_week)
);

-- 6. VENUE MAINTENANCE TABLE (Track maintenance schedules)
CREATE TABLE IF NOT EXISTS venue_maintenance (
    id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(50) NOT NULL, -- 'cleaning', 'repair', 'upgrade', 'inspection'
    maintenance_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    maintenance_status VARCHAR(20) DEFAULT 'scheduled' CHECK (
        maintenance_status IN ('scheduled', 'in_progress', 'completed', 'cancelled')
    ),
    description TEXT,
    performed_by VARCHAR(100),
    cost DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Venue Bookings Indexes
CREATE INDEX idx_venue_bookings_venue_date ON venue_bookings(venue_id, booking_date);
CREATE INDEX idx_venue_bookings_status ON venue_bookings(booking_status);
CREATE INDEX idx_venue_bookings_user ON venue_bookings(booked_by_user_id);
CREATE INDEX idx_venue_bookings_organizer ON venue_bookings(organizer_id);
CREATE INDEX idx_venue_bookings_event ON venue_bookings(event_id);
CREATE INDEX idx_venue_bookings_time_range ON venue_bookings(booking_date, start_time, end_time);

-- Other Indexes
CREATE INDEX idx_booking_equipment_booking ON booking_equipment(booking_id);
CREATE INDEX idx_booking_services_booking ON booking_services(booking_id);
CREATE INDEX idx_booking_history_booking ON booking_history(booking_id);
CREATE INDEX idx_venue_availability_venue ON venue_availability(venue_id);
CREATE INDEX idx_venue_maintenance_venue_date ON venue_maintenance(venue_id, maintenance_date);

-- =============================================
-- FUNCTIONS FOR VENUE BOOKING MANAGEMENT
-- =============================================

-- Function to check venue availability for booking
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
    venue_available BOOLEAN;
    availability_window RECORD;
BEGIN
    -- Check if venue exists and is active
    SELECT COUNT(*) INTO venue_available 
    FROM venues 
    WHERE id = p_venue_id AND is_active = true;
    
    IF venue_available = 0 THEN
        RETURN json_build_object(
            'available', false,
            'reason', 'Venue not found or inactive'
        );
    END IF;
    
    -- Check venue availability hours for the day of week
    SELECT available_from, available_to, is_available 
    INTO availability_window
    FROM venue_availability 
    WHERE venue_id = p_venue_id 
    AND day_of_week = EXTRACT(DOW FROM p_booking_date);
    
    IF NOT FOUND OR NOT availability_window.is_available THEN
        RETURN json_build_object(
            'available', false,
            'reason', 'Venue not available on this day of week'
        );
    END IF;
    
    -- Check if requested time is within availability window
    IF p_start_time < availability_window.available_from OR 
       p_end_time > availability_window.available_to THEN
        RETURN json_build_object(
            'available', false,
            'reason', 'Requested time outside venue availability hours',
            'available_from', availability_window.available_from,
            'available_to', availability_window.available_to
        );
    END IF;
    
    -- Check for existing bookings
    SELECT COUNT(*) INTO existing_bookings
    FROM venue_bookings 
    WHERE venue_id = p_venue_id 
    AND booking_date = p_booking_date
    AND booking_status IN ('confirmed', 'pending')
    AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
    AND (start_time, end_time) OVERLAPS (p_start_time, p_end_time);
    
    -- Check for maintenance conflicts
    SELECT COUNT(*) INTO maintenance_conflicts
    FROM venue_maintenance 
    WHERE venue_id = p_venue_id 
    AND maintenance_date = p_booking_date
    AND maintenance_status IN ('scheduled', 'in_progress')
    AND (start_time, end_time) OVERLAPS (p_start_time, p_end_time);
    
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

-- Function to create a venue booking
CREATE OR REPLACE FUNCTION create_venue_booking(
    p_venue_id INTEGER,
    p_booking_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_booked_by_user_id INTEGER,
    p_booking_purpose VARCHAR(100),
    p_expected_attendees INTEGER DEFAULT 0,
    p_special_requirements TEXT DEFAULT NULL,
    p_event_id INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    booking_id INTEGER;
    availability_check JSON;
    organizer_id_val INTEGER;
BEGIN
    -- Check availability first
    availability_check := check_venue_booking_availability(
        p_venue_id, p_booking_date, p_start_time, p_end_time
    );
    
    IF NOT (availability_check->>'available')::BOOLEAN THEN
        RETURN availability_check;
    END IF;
    
    -- Get organizer ID if user is an organizer
    SELECT id INTO organizer_id_val 
    FROM organizers 
    WHERE user_id = p_booked_by_user_id;
    
    -- Create the booking
    INSERT INTO venue_bookings (
        venue_id, booking_date, start_time, end_time,
        booked_by_user_id, organizer_id, booking_purpose,
        expected_attendees, special_requirements, event_id
    ) VALUES (
        p_venue_id, p_booking_date, p_start_time, p_end_time,
        p_booked_by_user_id, organizer_id_val, p_booking_purpose,
        p_expected_attendees, p_special_requirements, p_event_id
    ) RETURNING id INTO booking_id;
    
    -- Log the creation
    INSERT INTO booking_history (booking_id, changed_by, change_type, new_values)
    VALUES (booking_id, p_booked_by_user_id, 'created', 
            json_build_object('booking_id', booking_id, 'status', 'pending'));
    
    RETURN json_build_object(
        'success', true,
        'booking_id', booking_id,
        'message', 'Venue booking created successfully'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get venue bookings with details
CREATE OR REPLACE FUNCTION get_venue_bookings(
    p_venue_id INTEGER DEFAULT NULL,
    p_user_id INTEGER DEFAULT NULL,
    p_date_from DATE DEFAULT CURRENT_DATE,
    p_date_to DATE DEFAULT CURRENT_DATE + INTERVAL '30 days',
    p_status VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE(
    booking_id INTEGER,
    venue_name TEXT,
    block_name TEXT,
    booking_date DATE,
    start_time TIME,
    end_time TIME,
    booking_status VARCHAR(20),
    booking_purpose VARCHAR(100),
    expected_attendees INTEGER,
    booked_by_name TEXT,
    organizer_name TEXT,
    event_title TEXT,
    booking_reference VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vb.id,
        v.venue_name,
        b.block_name,
        vb.booking_date,
        vb.start_time,
        vb.end_time,
        vb.booking_status,
        vb.booking_purpose,
        vb.expected_attendees,
        u.email as booked_by_name,
        o.name as organizer_name,
        e.title as event_title,
        vb.booking_reference
    FROM venue_bookings vb
    JOIN venues v ON vb.venue_id = v.id
    JOIN blocks b ON v.block_id = b.id
    JOIN users u ON vb.booked_by_user_id = u.id
    LEFT JOIN organizers o ON vb.organizer_id = o.id
    LEFT JOIN events e ON vb.event_id = e.id
    WHERE 
        (p_venue_id IS NULL OR vb.venue_id = p_venue_id)
        AND (p_user_id IS NULL OR vb.booked_by_user_id = p_user_id)
        AND vb.booking_date BETWEEN p_date_from AND p_date_to
        AND (p_status IS NULL OR vb.booking_status = p_status)
    ORDER BY vb.booking_date, vb.start_time;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS FOR AUTOMATION
-- =============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_venue_booking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER venue_bookings_update_timestamp
    BEFORE UPDATE ON venue_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_venue_booking_timestamp();

-- Auto-link event bookings trigger
CREATE OR REPLACE FUNCTION auto_create_venue_booking_for_event()
RETURNS TRIGGER AS $$
DECLARE
    booking_result JSON;
BEGIN
    -- Only create booking if event has venue and is not draft
    IF NEW.venue_id IS NOT NULL AND NEW.event_date IS NOT NULL AND 
       NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL AND
       NEW.status != 'draft' THEN
        
        -- Check if booking already exists for this event
        IF NOT EXISTS (
            SELECT 1 FROM venue_bookings WHERE event_id = NEW.id
        ) THEN
            -- Create venue booking for the event
            SELECT create_venue_booking(
                NEW.venue_id,
                NEW.event_date,
                NEW.start_time,
                NEW.end_time,
                (SELECT user_id FROM organizers WHERE id = NEW.organizer_id),
                'event',
                NEW.max_participants,
                NEW.requirements,
                NEW.id
            ) INTO booking_result;
            
            -- Update booking status to confirmed if event is approved
            IF NEW.status = 'approved' THEN
                UPDATE venue_bookings 
                SET booking_status = 'confirmed'
                WHERE event_id = NEW.id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_venue_booking_for_event
    AFTER INSERT OR UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_venue_booking_for_event();

-- =============================================
-- DEFAULT VENUE AVAILABILITY
-- =============================================

-- Insert default availability (6 AM to 6 PM, Monday to Friday)
INSERT INTO venue_availability (venue_id, day_of_week, available_from, available_to)
SELECT 
    v.id,
    dow,
    '06:00:00'::TIME,
    '18:00:00'::TIME
FROM venues v
CROSS JOIN generate_series(1, 5) as dow -- Monday to Friday
ON CONFLICT (venue_id, day_of_week) DO NOTHING;

SELECT 'Comprehensive venue booking system created successfully!' as status;
