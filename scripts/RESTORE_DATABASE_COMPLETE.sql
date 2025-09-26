-- =============================================
-- COMPLETE DATABASE RESTORATION SCRIPT
-- Run this script to restore all deleted tables and data
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- =============================================
-- 1. CORE USER MANAGEMENT TABLES
-- =============================================

-- Users table - Base authentication table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    usernumber VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('student', 'organizer', 'admin')),
    email VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
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

-- Organizers table
CREATE TABLE IF NOT EXISTS organizers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    phone VARCHAR(20),
    organization VARCHAR(255),
    events_created_count INTEGER DEFAULT 0,
    approval_rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Administrators table
CREATE TABLE IF NOT EXISTS administrators (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    phone VARCHAR(20),
    permissions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 2. VENUE MANAGEMENT TABLES
-- =============================================

-- Blocks table
CREATE TABLE IF NOT EXISTS blocks (
    id SERIAL PRIMARY KEY,
    block_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Venues table
CREATE TABLE IF NOT EXISTS venues (
    id SERIAL PRIMARY KEY,
    venue_name VARCHAR(255) NOT NULL,
    block_id INTEGER REFERENCES blocks(id),
    max_capacity INTEGER NOT NULL CHECK (max_capacity > 0),
    facilities TEXT[],
    hourly_rate DECIMAL(10,2) DEFAULT 0.00,
    availability BOOLEAN DEFAULT true,
    description TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 3. EVENT MANAGEMENT TABLES
-- =============================================

-- Event categories table
CREATE TABLE IF NOT EXISTS event_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    color_code VARCHAR(7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
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

-- Event registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
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

-- Event attendance table
CREATE TABLE IF NOT EXISTS event_attendance (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    check_out_time TIMESTAMP WITH TIME ZONE,
    attendance_status VARCHAR(20) DEFAULT 'present' CHECK (attendance_status IN ('present', 'late', 'left_early')),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique attendance record per student per event
    UNIQUE(event_id, student_id)
);

-- =============================================
-- 4. INSERT DEFAULT DATA
-- =============================================

-- Insert default event categories
INSERT INTO event_categories (name, description, color_code) VALUES
('technical', 'Technical workshops, coding competitions, tech talks', '#3B82F6'),
('cultural', 'Cultural events, performances, festivals', '#8B5CF6'),
('sports', 'Sports competitions, tournaments, fitness events', '#F59E0B'),
('academic', 'Academic conferences, seminars, research presentations', '#10B981'),
('other', 'Other events and activities', '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- Insert default blocks
INSERT INTO blocks (block_name, description) VALUES
('Block A', 'Main academic block'),
('Block B', 'Science and technology block'),
('Block C', 'Arts and humanities block'),
('Block D', 'Administrative block'),
('Block E', 'Sports and recreation block'),
('Block F', 'Library and study block'),
('Block G', 'Cafeteria and common areas'),
('Block H', 'Auditorium and conference halls'),
('Block I', 'Laboratory block'),
('Block J', 'Student activities block')
ON CONFLICT (block_name) DO NOTHING;

-- Insert sample venues
INSERT INTO venues (venue_name, block_id, max_capacity, facilities, description) VALUES
('Main Auditorium', (SELECT id FROM blocks WHERE block_name = 'Block H'), 500, ARRAY['Projector', 'Sound System', 'Stage', 'AC'], 'Large auditorium for major events'),
('Conference Hall A', (SELECT id FROM blocks WHERE block_name = 'Block H'), 100, ARRAY['Projector', 'AC', 'Whiteboard'], 'Medium conference hall'),
('Conference Hall B', (SELECT id FROM blocks WHERE block_name = 'Block H'), 80, ARRAY['Projector', 'AC', 'Whiteboard'], 'Medium conference hall'),
('Computer Lab 1', (SELECT id FROM blocks WHERE block_name = 'Block I'), 40, ARRAY['Computers', 'Projector', 'AC'], 'Computer laboratory'),
('Computer Lab 2', (SELECT id FROM blocks WHERE block_name = 'Block I'), 40, ARRAY['Computers', 'Projector', 'AC'], 'Computer laboratory'),
('Physics Lab', (SELECT id FROM blocks WHERE block_name = 'Block B'), 30, ARRAY['Lab Equipment', 'Projector'], 'Physics laboratory'),
('Chemistry Lab', (SELECT id FROM blocks WHERE block_name = 'Block B'), 30, ARRAY['Lab Equipment', 'Fume Hood'], 'Chemistry laboratory'),
('Sports Ground', (SELECT id FROM blocks WHERE block_name = 'Block E'), 200, ARRAY['Open Air', 'Sports Equipment'], 'Outdoor sports facility'),
('Basketball Court', (SELECT id FROM blocks WHERE block_name = 'Block E'), 50, ARRAY['Court', 'Scoreboard'], 'Indoor basketball court'),
('Seminar Room 101', (SELECT id FROM blocks WHERE block_name = 'Block A'), 25, ARRAY['Projector', 'AC'], 'Small seminar room'),
('Seminar Room 102', (SELECT id FROM blocks WHERE block_name = 'Block A'), 25, ARRAY['Projector', 'AC'], 'Small seminar room'),
('Library Hall', (SELECT id FROM blocks WHERE block_name = 'Block F'), 60, ARRAY['Quiet Zone', 'AC'], 'Library presentation hall'),
('Cafeteria Hall', (SELECT id FROM blocks WHERE block_name = 'Block G'), 150, ARRAY['Tables', 'Chairs'], 'Cafeteria event space'),
('Discussion Room 301', (SELECT id FROM blocks WHERE block_name = 'Block C'), 20, ARRAY['Whiteboard', 'AC'], 'Small discussion room'),
('Discussion Room 302', (SELECT id FROM blocks WHERE block_name = 'Block C'), 20, ARRAY['Whiteboard', 'AC'], 'Small discussion room')
ON CONFLICT DO NOTHING;

-- Insert sample users (you'll need to update passwords)
INSERT INTO users (usernumber, password_hash, user_type, email) VALUES
('ADMIN001', '$2b$10$example_hash_here', 'admin', 'admin@christuniversity.in'),
('ORG001', '$2b$10$example_hash_here', 'organizer', 'sarah.wilson@christuniversity.in'),
('ORG002', '$2b$10$example_hash_here', 'organizer', 'john.doe@christuniversity.in'),
('STU001', '$2b$10$example_hash_here', 'student', 'student1@christuniversity.in'),
('STU002', '$2b$10$example_hash_here', 'student', 'student2@christuniversity.in')
ON CONFLICT (usernumber) DO NOTHING;

-- Insert corresponding profile records
INSERT INTO administrators (user_id, name, department) VALUES
((SELECT id FROM users WHERE usernumber = 'ADMIN001'), 'System Administrator', 'IT Department')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO organizers (user_id, name, department, organization) VALUES
((SELECT id FROM users WHERE usernumber = 'ORG001'), 'Dr. Sarah Wilson', 'Computer Science', 'Tech Club'),
((SELECT id FROM users WHERE usernumber = 'ORG002'), 'John Doe', 'Mathematics', 'Academic Society')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO students (user_id, name, department, year, course) VALUES
((SELECT id FROM users WHERE usernumber = 'STU001'), 'Alice Johnson', 'Computer Science', 2, 'BCA'),
((SELECT id FROM users WHERE usernumber = 'STU002'), 'Bob Smith', 'Mathematics', 3, 'BSc Mathematics')
ON CONFLICT (user_id) DO NOTHING;

-- =============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_approval_status ON events(approval_status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_student_id ON event_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_venues_block_id ON venues(block_id);

-- =============================================
-- RESTORATION COMPLETE
-- =============================================

-- Verify the restoration
SELECT 'Database restoration completed successfully!' as status;
SELECT 'Users created: ' || COUNT(*) as users_count FROM users;
SELECT 'Organizers created: ' || COUNT(*) as organizers_count FROM organizers;
SELECT 'Students created: ' || COUNT(*) as students_count FROM students;
SELECT 'Venues created: ' || COUNT(*) as venues_count FROM venues;
SELECT 'Categories created: ' || COUNT(*) as categories_count FROM event_categories;
