-- Eventure Database Schema
-- Normalized database design based on codebase analysis
-- Created: 2025-09-17

-- Enable required extensions for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- =============================================
-- CORE USER MANAGEMENT TABLES
-- =============================================

-- Users table - Base authentication table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    usernumber VARCHAR(20) UNIQUE NOT NULL, -- Registration number, Employee ID, or Username
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('student', 'organizer', 'admin')),
    email VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Students table - Extended profile for students
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    year INTEGER CHECK (year BETWEEN 1 AND 4),
    semester INTEGER CHECK (semester BETWEEN 1 AND 8),
    course VARCHAR(100),
    phone VARCHAR(20),
    events_registered_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Organizers table - Extended profile for event organizers
CREATE TABLE organizers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    phone VARCHAR(20),
    organization VARCHAR(255), -- Club or organizing body
    events_created_count INTEGER DEFAULT 0,
    approval_rating DECIMAL(3,2) DEFAULT 0.00, -- Average approval rating
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Administrators table - Extended profile for admins
CREATE TABLE administrators (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    phone VARCHAR(20),
    permissions TEXT[], -- Array of permission strings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- VENUE MANAGEMENT TABLES
-- =============================================

-- Venues table - Physical locations for events
CREATE TABLE venues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    block VARCHAR(50),
    location VARCHAR(255),
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    facilities TEXT[], -- Array of available facilities
    hourly_rate DECIMAL(10,2) DEFAULT 0.00,
    is_available BOOLEAN DEFAULT true,
    description TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Venue bookings table - Track venue reservations
CREATE TABLE venue_bookings (
    id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    event_id INTEGER, -- Will be linked to events table
    organizer_id INTEGER NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    booking_purpose VARCHAR(255) NOT NULL,
    registration_fee DECIMAL(10, 2) DEFAULT 0.00,
    cancellation_allowed BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_by INTEGER REFERENCES administrators(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure no overlapping bookings for same venue
    CONSTRAINT no_venue_overlap EXCLUDE USING gist (
        venue_id WITH =,
        tstzrange(start_time, end_time) WITH &&
    ) WHERE (status = 'approved')
);

-- =============================================
-- EVENT MANAGEMENT TABLES
-- =============================================

-- Event categories table - Normalized categories
CREATE TABLE event_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    color_code VARCHAR(7), -- Hex color code
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Events-- Sample data for Eventure systemation
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES event_categories(id),
    organizer_id INTEGER NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
    venue_id INTEGER REFERENCES venues(id),
    
    -- Event timing
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Registration details
    registration_deadline TIMESTAMP WITH TIME ZONE,
    registration_fee DECIMAL(10,2) DEFAULT 0.00,
    cancellation_allowed BOOLEAN DEFAULT TRUE,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    
    -- Event status and approval
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'cancelled', 'completed')),
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'changes_requested')),
    
    -- Requirements and contact
    requirements TEXT,
    eligibility_criteria TEXT,
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    
    -- Admin feedback and approval
    admin_feedback TEXT,
    approved_by INTEGER REFERENCES administrators(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    feedback_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional metadata
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    additional_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Event registrations table - Track student registrations
CREATE TABLE event_registrations (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled', 'attended', 'no_show')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    payment_amount DECIMAL(10,2) DEFAULT 0.00,
    attendance_marked_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique registration per student per event
    UNIQUE(event_id, student_id)
);

-- Event attendance table - Track actual attendance
CREATE TABLE event_attendance (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    check_out_time TIMESTAMP WITH TIME ZONE,
    attendance_status VARCHAR(20) DEFAULT 'present' CHECK (attendance_status IN ('present', 'late', 'left_early')),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique attendance record per student per event
    UNIQUE(event_id, student_id)
);

-- =============================================
-- NOTIFICATION AND COMMUNICATION TABLES
-- =============================================

-- Notifications table - System notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'event_approval', 'registration_confirmation', 'event_reminder', etc.
    related_event_id INTEGER REFERENCES events(id),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- AUDIT AND LOGGING TABLES
-- =============================================

-- Activity logs table - Track important system activities
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'event', 'user', 'venue', etc.
    entity_id INTEGER,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User authentication indexes
CREATE INDEX idx_users_usernumber ON users(usernumber);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type_active ON users(user_type, is_active);

-- Event-related indexes
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_venue ON events(venue_id);
CREATE INDEX idx_events_category ON events(category_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_approval_status ON events(approval_status);

-- Registration indexes
CREATE INDEX idx_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_registrations_student ON event_registrations(student_id);
CREATE INDEX idx_registrations_status ON event_registrations(status);
CREATE INDEX idx_registrations_date ON event_registrations(registration_date);

-- Venue booking indexes
CREATE INDEX idx_venue_bookings_venue ON venue_bookings(venue_id);
CREATE INDEX idx_venue_bookings_organizer ON venue_bookings(organizer_id);
CREATE INDEX idx_venue_bookings_time ON venue_bookings(start_time, end_time);
CREATE INDEX idx_venue_bookings_status ON venue_bookings(status);

-- Notification indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(type);

-- Activity log indexes
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizers_updated_at BEFORE UPDATE ON organizers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_administrators_updated_at BEFORE UPDATE ON administrators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venue_bookings_updated_at BEFORE UPDATE ON venue_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_registrations_updated_at BEFORE UPDATE ON event_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- =============================================

-- Function to verify user credentials
CREATE OR REPLACE FUNCTION verify_user(
    p_usernumber VARCHAR(20),
    p_user_type VARCHAR(20),
    p_password VARCHAR(255)
)
RETURNS TABLE(
    id INTEGER,
    usernumber VARCHAR(20),
    user_type VARCHAR(20),
    email VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.usernumber, u.user_type, u.email
    FROM users u
    WHERE u.usernumber = p_usernumber 
      AND u.user_type = p_user_type
      AND u.password_hash = crypt(p_password, u.password_hash)
      AND u.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update participant count when registration changes
CREATE OR REPLACE FUNCTION update_event_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increase count on new registration
        UPDATE events 
        SET current_participants = current_participants + 1
        WHERE id = NEW.event_id;
        
        -- Update student's registration count
        UPDATE students 
        SET events_registered_count = events_registered_count + 1
        WHERE id = NEW.student_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrease count on registration deletion
        UPDATE events 
        SET current_participants = current_participants - 1
        WHERE id = OLD.event_id;
        
        -- Update student's registration count
        UPDATE students 
        SET events_registered_count = events_registered_count - 1
        WHERE id = OLD.student_id;
        
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle status changes (cancelled registrations)
        IF OLD.status = 'registered' AND NEW.status = 'cancelled' THEN
            UPDATE events 
            SET current_participants = current_participants - 1
            WHERE id = NEW.event_id;
            
            UPDATE students 
            SET events_registered_count = events_registered_count - 1
            WHERE id = NEW.student_id;
        ELSIF OLD.status = 'cancelled' AND NEW.status = 'registered' THEN
            UPDATE events 
            SET current_participants = current_participants + 1
            WHERE id = NEW.event_id;
            
            UPDATE students 
            SET events_registered_count = events_registered_count + 1
            WHERE id = NEW.student_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply participant count trigger
CREATE TRIGGER trigger_update_participant_count
    AFTER INSERT OR UPDATE OR DELETE ON event_registrations
    FOR EACH ROW EXECUTE FUNCTION update_event_participant_count();

-- Function to update organizer's event count
CREATE OR REPLACE FUNCTION update_organizer_event_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE organizers 
        SET events_created_count = events_created_count + 1
        WHERE id = NEW.organizer_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE organizers 
        SET events_created_count = events_created_count - 1
        WHERE id = OLD.organizer_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply organizer event count trigger
CREATE TRIGGER trigger_update_organizer_event_count
    AFTER INSERT OR DELETE ON events
    FOR EACH ROW EXECUTE FUNCTION update_organizer_event_count();

-- =============================================
-- INITIAL DATA SETUP
-- =============================================

-- Insert default event categories
INSERT INTO event_categories (name, description, color_code) VALUES
('technical', 'Technical workshops, coding competitions, tech talks', '#3B82F6'),
('cultural', 'Cultural events, performances, festivals', '#8B5CF6'),
('sports', 'Sports competitions, tournaments, fitness events', '#F59E0B'),
('academic', 'Academic conferences, seminars, research presentations', '#10B981'),
('other', 'Other miscellaneous events', '#6B7280');

-- Insert sample venues
INSERT INTO venues (name, block, location, capacity, facilities, hourly_rate, description) VALUES
('Main Auditorium', 'Block A', 'Ground Floor, Block A', 300, ARRAY['Stage', 'Sound System', 'Lighting', 'AC', 'Projector'], 5000.00, 'Large auditorium suitable for major events and presentations'),
('Computer Lab 1', 'Block B', 'First Floor, Block B', 50, ARRAY['Computers', 'Projector', 'WiFi', 'AC'], 2500.00, 'Fully equipped computer lab for technical workshops'),
('Conference Hall', 'Block C', 'Second Floor, Block C', 100, ARRAY['Projector', 'Sound System', 'WiFi', 'AC', 'Whiteboard'], 3000.00, 'Professional conference room for meetings and seminars'),
('Sports Complex', 'Block D', 'Ground Floor, Block D', 200, ARRAY['Sports Equipment', 'Changing Rooms', 'First Aid'], 2000.00, 'Indoor sports facility for various sporting events'),
('Art Studio', 'Block E', 'Third Floor, Block E', 30, ARRAY['Art Supplies', 'Easels', 'Natural Lighting', 'Storage'], 1500.00, 'Creative space for art workshops and cultural activities');

-- Create admin user (password: admin123)
INSERT INTO users (usernumber, password_hash, user_type, email) VALUES
('admin', crypt('admin123', gen_salt('bf')), 'admin', 'admin@eventnest.edu');

INSERT INTO administrators (user_id, name, department, permissions) VALUES
(1, 'System Administrator', 'IT Department', ARRAY['all']);

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for complete event information
CREATE VIEW event_details AS
SELECT 
    e.id,
    e.title,
    e.description,
    ec.name as category,
    ec.color_code as category_color,
    o.name as organizer_name,
    o.department as organizer_department,
    v.name as venue_name,
    v.block as venue_block,
    v.location as venue_location,
    e.event_date,
    e.start_time,
    e.end_time,
    e.registration_deadline,
    e.registration_fee,
    e.max_participants,
    e.current_participants,
    e.status,
    e.approval_status,
    e.contact_person,
    e.contact_email,
    e.created_at
FROM events e
JOIN event_categories ec ON e.category_id = ec.id
JOIN organizers o ON e.organizer_id = o.id
LEFT JOIN venues v ON e.venue_id = v.id;

-- View for student registration details
CREATE VIEW student_registrations AS
SELECT 
    er.id as registration_id,
    s.name as student_name,
    s.department as student_department,
    e.title as event_title,
    e.event_date,
    e.start_time,
    e.end_time,
    v.name as venue_name,
    er.registration_date,
    er.status as registration_status,
    er.payment_status
FROM event_registrations er
JOIN students s ON er.student_id = s.id
JOIN events e ON er.event_id = e.id
LEFT JOIN venues v ON e.venue_id = v.id;

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE users IS 'Base authentication table for all user types';
COMMENT ON TABLE students IS 'Extended profile information for student users';
COMMENT ON TABLE organizers IS 'Extended profile information for event organizer users';
COMMENT ON TABLE administrators IS 'Extended profile information for admin users';
COMMENT ON TABLE venues IS 'Physical locations where events can be held';
COMMENT ON TABLE venue_bookings IS 'Reservations and bookings for venues';
COMMENT ON TABLE event_categories IS 'Normalized categories for events';
COMMENT ON TABLE events IS 'Core events information and management';
COMMENT ON TABLE event_registrations IS 'Student registrations for events';
COMMENT ON TABLE event_attendance IS 'Actual attendance tracking for events';
COMMENT ON TABLE notifications IS 'System notifications for users';
COMMENT ON TABLE activity_logs IS 'Audit trail for system activities';

COMMENT ON FUNCTION verify_user IS 'Secure function to verify user credentials during login';
COMMENT ON FUNCTION update_event_participant_count IS 'Automatically maintains participant counts for events';
COMMENT ON FUNCTION update_organizer_event_count IS 'Automatically maintains event counts for organizers';
