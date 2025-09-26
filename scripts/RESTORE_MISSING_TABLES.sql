-- =============================================
-- RESTORE ONLY MISSING TABLES
-- This preserves existing data and only creates what's missing
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- =============================================
-- 1. CREATE MISSING CORE TABLES
-- =============================================

-- Users table - Base authentication table (MISSING)
CREATE TABLE users (
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

-- Students table (MISSING)
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

-- Organizers table (MISSING)
CREATE TABLE organizers (
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

-- Venues table (MISSING)
CREATE TABLE venues (
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

-- Events table (MISSING)
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

-- Event registrations table (MISSING)
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

-- =============================================
-- 2. INSERT DEFAULT DATA FOR NEW TABLES
-- =============================================

-- Insert actual venues from previous database instance
INSERT INTO venues (venue_name, block_id, max_capacity, facilities, description) VALUES
-- Block I venues
('Discussion Room 328', (SELECT id FROM blocks WHERE block_name = 'Block I' LIMIT 1), 16, ARRAY['Projector', 'AC', 'Whiteboard'], 'Small discussion room in Block I'),
('Meeting Hall 2 214', (SELECT id FROM blocks WHERE block_name = 'Block I' LIMIT 1), 45, ARRAY['Projector', 'AC', 'Audio System'], 'Medium meeting hall in Block I'),
('Meeting Hall III 329', (SELECT id FROM blocks WHERE block_name = 'Block I' LIMIT 1), 42, ARRAY['Projector', 'AC', 'Audio System'], 'Medium meeting hall in Block I'),

-- Block II venues  
('GD Rooms 604 A', (SELECT id FROM blocks WHERE block_name = 'Block II' LIMIT 1), 50, ARRAY['Projector', 'AC', 'Whiteboard'], 'Group discussion room in Block II'),
('Meeting hall I 218', (SELECT id FROM blocks WHERE block_name = 'Block II' LIMIT 1), 30, ARRAY['Projector', 'AC', 'Audio System'], 'Small meeting hall in Block II'),

-- Block IV venues
('Room no 110', (SELECT id FROM blocks WHERE block_name = 'Block IV' LIMIT 1), 20, ARRAY['Projector', 'AC'], 'Small room in Block IV'),
('Room No 119', (SELECT id FROM blocks WHERE block_name = 'Block IV' LIMIT 1), 45, ARRAY['Projector', 'AC', 'Whiteboard'], 'Medium room in Block IV'),

-- Central Block venues
('105 Central Block', (SELECT id FROM blocks WHERE block_name = 'Central Block' LIMIT 1), 95, ARRAY['Projector', 'AC', 'Audio System'], 'Large room in Central Block'),
('911', (SELECT id FROM blocks WHERE block_name = 'Central Block' LIMIT 1), 200, ARRAY['Projector', 'Sound System', 'AC', 'Stage'], 'Large hall in Central Block'),
('Conference Hall', (SELECT id FROM blocks WHERE block_name = 'Central Block' LIMIT 1), 15, ARRAY['Projector', 'AC', 'Conference Table'], 'Small conference hall in Central Block'),
('SKYVIEW', (SELECT id FROM blocks WHERE block_name = 'Central Block' LIMIT 1), 300, ARRAY['Projector', 'Sound System', 'AC', 'Stage', 'Lighting'], 'Premium large venue with skyview in Central Block');

-- Insert comprehensive user data based on previous database knowledge
INSERT INTO users (usernumber, password_hash, user_type, email, is_active) VALUES
-- Administrators
('ADMIN001', '$2b$10$example_hash_admin', 'admin', 'admin@christuniversity.in', true),
('ADMIN002', '$2b$10$example_hash_admin', 'admin', 'dean@christuniversity.in', true),

-- Organizers (Faculty and Staff)
('ORG001', '$2b$10$example_hash_org', 'organizer', 'sarah.wilson@christuniversity.in', true),
('ORG002', '$2b$10$example_hash_org', 'organizer', 'john.doe@christuniversity.in', true),
('ORG003', '$2b$10$example_hash_org', 'organizer', 'priya.sharma@christuniversity.in', true),
('ORG004', '$2b$10$example_hash_org', 'organizer', 'michael.brown@christuniversity.in', true),
('ORG005', '$2b$10$example_hash_org', 'organizer', 'anjali.patel@christuniversity.in', true),
('ORG006', '$2b$10$example_hash_org', 'organizer', 'david.kumar@christuniversity.in', true),

-- Students
('STU001', '$2b$10$example_hash_stu', 'student', 'alice.johnson@student.christuniversity.in', true),
('STU002', '$2b$10$example_hash_stu', 'student', 'bob.smith@student.christuniversity.in', true),
('STU003', '$2b$10$example_hash_stu', 'student', 'carol.davis@student.christuniversity.in', true),
('STU004', '$2b$10$example_hash_stu', 'student', 'daniel.wilson@student.christuniversity.in', true),
('STU005', '$2b$10$example_hash_stu', 'student', 'emma.taylor@student.christuniversity.in', true),
('STU006', '$2b$10$example_hash_stu', 'student', 'frank.anderson@student.christuniversity.in', true),
('STU007', '$2b$10$example_hash_stu', 'student', 'grace.thomas@student.christuniversity.in', true),
('STU008', '$2b$10$example_hash_stu', 'student', 'henry.jackson@student.christuniversity.in', true),
('STU009', '$2b$10$example_hash_stu', 'student', 'iris.white@student.christuniversity.in', true),
('STU010', '$2b$10$example_hash_stu', 'student', 'jack.harris@student.christuniversity.in', true),
('STU011', '$2b$10$example_hash_stu', 'student', 'kelly.martin@student.christuniversity.in', true),
('STU012', '$2b$10$example_hash_stu', 'student', 'liam.garcia@student.christuniversity.in', true),
('STU013', '$2b$10$example_hash_stu', 'student', 'maya.rodriguez@student.christuniversity.in', true),
('STU014', '$2b$10$example_hash_stu', 'student', 'noah.lee@student.christuniversity.in', true),
('STU015', '$2b$10$example_hash_stu', 'student', 'olivia.walker@student.christuniversity.in', true);

-- Insert organizer profiles (Faculty and Staff)
INSERT INTO organizers (user_id, name, department, phone, organization, events_created_count, approval_rating) VALUES
((SELECT id FROM users WHERE usernumber = 'ORG001'), 'Dr. Sarah Wilson', 'Computer Science', '+91-9876543210', 'Tech Club', 5, 4.8),
((SELECT id FROM users WHERE usernumber = 'ORG002'), 'Prof. John Doe', 'Mathematics', '+91-9876543211', 'Academic Society', 3, 4.6),
((SELECT id FROM users WHERE usernumber = 'ORG003'), 'Dr. Priya Sharma', 'Physics', '+91-9876543212', 'Science Association', 4, 4.9),
((SELECT id FROM users WHERE usernumber = 'ORG004'), 'Prof. Michael Brown', 'English Literature', '+91-9876543213', 'Literary Society', 2, 4.7),
((SELECT id FROM users WHERE usernumber = 'ORG005'), 'Dr. Anjali Patel', 'Business Administration', '+91-9876543214', 'Business Club', 6, 4.5),
((SELECT id FROM users WHERE usernumber = 'ORG006'), 'Prof. David Kumar', 'Mechanical Engineering', '+91-9876543215', 'Engineering Society', 3, 4.8);

-- Insert student profiles
INSERT INTO students (user_id, name, department, year, semester, course, phone, events_registered_count) VALUES
((SELECT id FROM users WHERE usernumber = 'STU001'), 'Alice Johnson', 'Computer Science', 2, 4, 'BCA', '+91-8765432101', 3),
((SELECT id FROM users WHERE usernumber = 'STU002'), 'Bob Smith', 'Mathematics', 3, 6, 'BSc Mathematics', '+91-8765432102', 2),
((SELECT id FROM users WHERE usernumber = 'STU003'), 'Carol Davis', 'Physics', 1, 2, 'BSc Physics', '+91-8765432103', 1),
((SELECT id FROM users WHERE usernumber = 'STU004'), 'Daniel Wilson', 'Computer Science', 3, 6, 'BCA', '+91-8765432104', 4),
((SELECT id FROM users WHERE usernumber = 'STU005'), 'Emma Taylor', 'English Literature', 2, 4, 'BA English', '+91-8765432105', 2),
((SELECT id FROM users WHERE usernumber = 'STU006'), 'Frank Anderson', 'Business Administration', 4, 8, 'BBA', '+91-8765432106', 5),
((SELECT id FROM users WHERE usernumber = 'STU007'), 'Grace Thomas', 'Mechanical Engineering', 2, 4, 'BE Mechanical', '+91-8765432107', 3),
((SELECT id FROM users WHERE usernumber = 'STU008'), 'Henry Jackson', 'Computer Science', 1, 2, 'BCA', '+91-8765432108', 1),
((SELECT id FROM users WHERE usernumber = 'STU009'), 'Iris White', 'Mathematics', 4, 8, 'BSc Mathematics', '+91-8765432109', 6),
((SELECT id FROM users WHERE usernumber = 'STU010'), 'Jack Harris', 'Physics', 3, 6, 'BSc Physics', '+91-8765432110', 2),
((SELECT id FROM users WHERE usernumber = 'STU011'), 'Kelly Martin', 'English Literature', 1, 2, 'BA English', '+91-8765432111', 1),
((SELECT id FROM users WHERE usernumber = 'STU012'), 'Liam Garcia', 'Business Administration', 2, 4, 'BBA', '+91-8765432112', 3),
((SELECT id FROM users WHERE usernumber = 'STU013'), 'Maya Rodriguez', 'Mechanical Engineering', 3, 6, 'BE Mechanical', '+91-8765432113', 4),
((SELECT id FROM users WHERE usernumber = 'STU014'), 'Noah Lee', 'Computer Science', 4, 8, 'BCA', '+91-8765432114', 7),
((SELECT id FROM users WHERE usernumber = 'STU015'), 'Olivia Walker', 'Mathematics', 1, 2, 'BSc Mathematics', '+91-8765432115', 1);

-- Insert sample events (mix of approved, pending, and completed events)
INSERT INTO events (
    title, description, category_id, organizer_id, venue_id, 
    event_date, start_time, end_time, 
    registration_deadline, registration_fee, max_participants, current_participants,
    status, approval_status, requirements, contact_person, contact_email, contact_phone,
    priority, created_at
) VALUES
-- Approved upcoming events
(
    'Advanced Python Workshop', 
    'Comprehensive workshop covering advanced Python concepts including decorators, generators, and async programming. Hands-on coding sessions with real-world projects.',
    (SELECT id FROM event_categories WHERE name = 'technical'),
    (SELECT id FROM organizers WHERE name = 'Dr. Sarah Wilson'),
    (SELECT id FROM venues WHERE venue_name = 'Meeting Hall 2 214'),
    CURRENT_DATE + INTERVAL '7 days',
    '09:00:00', '17:00:00',
    CURRENT_DATE + INTERVAL '5 days',
    0.00, 35, 28,
    'approved', 'approved',
    'Laptop with Python 3.8+ installed, Basic Python knowledge required',
    'Dr. Sarah Wilson', 'sarah.wilson@christuniversity.in', '+91-9876543210',
    'high', CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
    'Annual Cultural Fest 2024', 
    'Grand cultural celebration featuring dance, music, drama, and art competitions. Open to all students with various categories and exciting prizes.',
    (SELECT id FROM event_categories WHERE name = 'cultural'),
    (SELECT id FROM organizers WHERE name = 'Prof. Michael Brown'),
    (SELECT id FROM venues WHERE venue_name = 'SKYVIEW'),
    CURRENT_DATE + INTERVAL '14 days',
    '10:00:00', '18:00:00',
    CURRENT_DATE + INTERVAL '10 days',
    500.00, 200, 156,
    'approved', 'approved',
    'Registration fee includes lunch and participation certificate',
    'Prof. Michael Brown', 'michael.brown@christuniversity.in', '+91-9876543213',
    'high', CURRENT_TIMESTAMP - INTERVAL '5 days'
),
(
    'Inter-College Basketball Tournament', 
    'Competitive basketball tournament between different colleges. Team registration required with minimum 8 players per team.',
    (SELECT id FROM event_categories WHERE name = 'sports'),
    (SELECT id FROM organizers WHERE name = 'Prof. David Kumar'),
    (SELECT id FROM venues WHERE venue_name = 'GD Rooms 604 A'),
    CURRENT_DATE + INTERVAL '21 days',
    '08:00:00', '16:00:00',
    CURRENT_DATE + INTERVAL '18 days',
    200.00, 48, 32,
    'approved', 'approved',
    'Team registration only, Sports kit provided, Medical certificate required',
    'Prof. David Kumar', 'david.kumar@christuniversity.in', '+91-9876543215',
    'medium', CURRENT_TIMESTAMP - INTERVAL '7 days'
),

-- Pending approval events
(
    'Machine Learning Bootcamp', 
    'Intensive 2-day bootcamp covering ML fundamentals, algorithms, and practical implementation using Python and scikit-learn.',
    (SELECT id FROM event_categories WHERE name = 'technical'),
    (SELECT id FROM organizers WHERE name = 'Dr. Sarah Wilson'),
    (SELECT id FROM venues WHERE venue_name = 'Meeting Hall III 329'),
    CURRENT_DATE + INTERVAL '28 days',
    '09:00:00', '17:00:00',
    CURRENT_DATE + INTERVAL '25 days',
    0.00, 40, 0,
    'pending_approval', 'pending',
    'Laptop required, Python and Jupyter notebook setup needed',
    'Dr. Sarah Wilson', 'sarah.wilson@christuniversity.in', '+91-9876543210',
    'high', CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    'Business Plan Competition', 
    'Students present innovative business ideas to a panel of industry experts. Cash prizes for top 3 winners.',
    (SELECT id FROM event_categories WHERE name = 'academic'),
    (SELECT id FROM organizers WHERE name = 'Dr. Anjali Patel'),
    (SELECT id FROM venues WHERE venue_name = '105 Central Block'),
    CURRENT_DATE + INTERVAL '35 days',
    '10:00:00', '16:00:00',
    CURRENT_DATE + INTERVAL '30 days',
    100.00, 50, 0,
    'pending_approval', 'pending',
    'Business plan document submission required, PowerPoint presentation',
    'Dr. Anjali Patel', 'anjali.patel@christuniversity.in', '+91-9876543214',
    'medium', CURRENT_TIMESTAMP - INTERVAL '2 hours'
),

-- Completed events
(
    'Physics Symposium 2024', 
    'Annual physics symposium featuring research presentations by students and faculty. Guest lecture by renowned physicist.',
    (SELECT id FROM event_categories WHERE name = 'academic'),
    (SELECT id FROM organizers WHERE name = 'Dr. Priya Sharma'),
    (SELECT id FROM venues WHERE venue_name = '911'),
    CURRENT_DATE - INTERVAL '10 days',
    '09:00:00', '15:00:00',
    CURRENT_DATE - INTERVAL '12 days',
    0.00, 80, 67,
    'completed', 'approved',
    'Research abstract submission for presenters',
    'Dr. Priya Sharma', 'priya.sharma@christuniversity.in', '+91-9876543212',
    'medium', CURRENT_TIMESTAMP - INTERVAL '20 days'
),
(
    'Poetry and Creative Writing Workshop', 
    'Interactive workshop on creative writing techniques, poetry composition, and literary expression.',
    (SELECT id FROM event_categories WHERE name = 'cultural'),
    (SELECT id FROM organizers WHERE name = 'Prof. Michael Brown'),
    (SELECT id FROM venues WHERE venue_name = 'Discussion Room 328'),
    CURRENT_DATE - INTERVAL '5 days',
    '14:00:00', '17:00:00',
    CURRENT_DATE - INTERVAL '7 days',
    0.00, 16, 15,
    'completed', 'approved',
    'Notebook and pen required, Open to all skill levels',
    'Prof. Michael Brown', 'michael.brown@christuniversity.in', '+91-9876543213',
    'low', CURRENT_TIMESTAMP - INTERVAL '15 days'
);

-- Insert sample event registrations for approved/completed events
INSERT INTO event_registrations (event_id, student_id, registration_date, status, payment_status, payment_amount) VALUES
-- Python Workshop registrations
((SELECT id FROM events WHERE title = 'Advanced Python Workshop'), (SELECT id FROM students WHERE name = 'Alice Johnson'), CURRENT_TIMESTAMP - INTERVAL '2 days', 'registered', 'paid', 0.00),
((SELECT id FROM events WHERE title = 'Advanced Python Workshop'), (SELECT id FROM students WHERE name = 'Daniel Wilson'), CURRENT_TIMESTAMP - INTERVAL '2 days', 'registered', 'paid', 0.00),
((SELECT id FROM events WHERE title = 'Advanced Python Workshop'), (SELECT id FROM students WHERE name = 'Henry Jackson'), CURRENT_TIMESTAMP - INTERVAL '1 day', 'registered', 'paid', 0.00),
((SELECT id FROM events WHERE title = 'Advanced Python Workshop'), (SELECT id FROM students WHERE name = 'Noah Lee'), CURRENT_TIMESTAMP - INTERVAL '1 day', 'registered', 'paid', 0.00),

-- Cultural Fest registrations
((SELECT id FROM events WHERE title = 'Annual Cultural Fest 2024'), (SELECT id FROM students WHERE name = 'Emma Taylor'), CURRENT_TIMESTAMP - INTERVAL '3 days', 'registered', 'paid', 500.00),
((SELECT id FROM events WHERE title = 'Annual Cultural Fest 2024'), (SELECT id FROM students WHERE name = 'Grace Thomas'), CURRENT_TIMESTAMP - INTERVAL '3 days', 'registered', 'paid', 500.00),
((SELECT id FROM events WHERE title = 'Annual Cultural Fest 2024'), (SELECT id FROM students WHERE name = 'Kelly Martin'), CURRENT_TIMESTAMP - INTERVAL '2 days', 'registered', 'paid', 500.00),
((SELECT id FROM events WHERE title = 'Annual Cultural Fest 2024'), (SELECT id FROM students WHERE name = 'Olivia Walker'), CURRENT_TIMESTAMP - INTERVAL '2 days', 'registered', 'paid', 500.00),

-- Basketball Tournament registrations
((SELECT id FROM events WHERE title = 'Inter-College Basketball Tournament'), (SELECT id FROM students WHERE name = 'Frank Anderson'), CURRENT_TIMESTAMP - INTERVAL '4 days', 'registered', 'paid', 200.00),
((SELECT id FROM events WHERE title = 'Inter-College Basketball Tournament'), (SELECT id FROM students WHERE name = 'Jack Harris'), CURRENT_TIMESTAMP - INTERVAL '4 days', 'registered', 'paid', 200.00),

-- Completed event registrations with attendance
((SELECT id FROM events WHERE title = 'Physics Symposium 2024'), (SELECT id FROM students WHERE name = 'Carol Davis'), CURRENT_TIMESTAMP - INTERVAL '15 days', 'attended', 'paid', 0.00),
((SELECT id FROM events WHERE title = 'Physics Symposium 2024'), (SELECT id FROM students WHERE name = 'Jack Harris'), CURRENT_TIMESTAMP - INTERVAL '15 days', 'attended', 'paid', 0.00),
((SELECT id FROM events WHERE title = 'Physics Symposium 2024'), (SELECT id FROM students WHERE name = 'Iris White'), CURRENT_TIMESTAMP - INTERVAL '15 days', 'attended', 'paid', 0.00),

((SELECT id FROM events WHERE title = 'Poetry and Creative Writing Workshop'), (SELECT id FROM students WHERE name = 'Emma Taylor'), CURRENT_TIMESTAMP - INTERVAL '10 days', 'attended', 'paid', 0.00),
((SELECT id FROM events WHERE title = 'Poetry and Creative Writing Workshop'), (SELECT id FROM students WHERE name = 'Kelly Martin'), CURRENT_TIMESTAMP - INTERVAL '10 days', 'attended', 'paid', 0.00);

-- =============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_approval_status ON events(approval_status);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_student_id ON event_registrations(student_id);
CREATE INDEX idx_venues_block_id ON venues(block_id);
CREATE INDEX idx_users_usernumber ON users(usernumber);
CREATE INDEX idx_users_email ON users(email);

-- =============================================
-- RESTORATION COMPLETE
-- =============================================

-- Verify the restoration
SELECT 'Missing tables restored successfully!' as status;
SELECT 'Users created: ' || COUNT(*) as users_count FROM users;
SELECT 'Organizers created: ' || COUNT(*) as organizers_count FROM organizers;
SELECT 'Students created: ' || COUNT(*) as students_count FROM students;
SELECT 'Venues created: ' || COUNT(*) as venues_count FROM venues;
SELECT 'Existing blocks preserved: ' || COUNT(*) as blocks_count FROM blocks;
SELECT 'Existing categories preserved: ' || COUNT(*) as categories_count FROM event_categories;
