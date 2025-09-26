-- =============================================
-- ROW LEVEL SECURITY POLICIES RESTORATION
-- Run this AFTER the main database restoration
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE administrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USERS TABLE POLICIES
-- =============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- =============================================
-- STUDENTS TABLE POLICIES
-- =============================================

-- Students can view their own data
CREATE POLICY "Students can view own data" ON students
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = students.user_id 
            AND auth.uid()::text = users.id::text
        )
    );

-- Students can update their own data
CREATE POLICY "Students can update own data" ON students
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = students.user_id 
            AND auth.uid()::text = users.id::text
        )
    );

-- =============================================
-- ORGANIZERS TABLE POLICIES
-- =============================================

-- Organizers can view their own data
CREATE POLICY "Organizers can view own data" ON organizers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = organizers.user_id 
            AND auth.uid()::text = users.id::text
        )
    );

-- Organizers can update their own data
CREATE POLICY "Organizers can update own data" ON organizers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = organizers.user_id 
            AND auth.uid()::text = users.id::text
        )
    );

-- =============================================
-- EVENTS TABLE POLICIES
-- =============================================

-- Everyone can view approved events
CREATE POLICY "Everyone can view approved events" ON events
    FOR SELECT USING (status = 'approved');

-- Organizers can view their own events (any status)
CREATE POLICY "Organizers can view own events" ON events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organizers o
            JOIN users u ON o.user_id = u.id
            WHERE o.id = events.organizer_id 
            AND auth.uid()::text = u.id::text
        )
    );

-- Organizers can create events
CREATE POLICY "Organizers can create events" ON events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM organizers o
            JOIN users u ON o.user_id = u.id
            WHERE o.id = events.organizer_id 
            AND auth.uid()::text = u.id::text
        )
    );

-- Organizers can update their own events (if not approved yet)
CREATE POLICY "Organizers can update own events" ON events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM organizers o
            JOIN users u ON o.user_id = u.id
            WHERE o.id = events.organizer_id 
            AND auth.uid()::text = u.id::text
        )
        AND status IN ('draft', 'pending_approval', 'changes_requested')
    );

-- Admins can view all events
CREATE POLICY "Admins can view all events" ON events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM administrators a
            JOIN users u ON a.user_id = u.id
            WHERE auth.uid()::text = u.id::text
        )
    );

-- Admins can update all events
CREATE POLICY "Admins can update all events" ON events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM administrators a
            JOIN users u ON a.user_id = u.id
            WHERE auth.uid()::text = u.id::text
        )
    );

-- =============================================
-- EVENT REGISTRATIONS POLICIES
-- =============================================

-- Students can view their own registrations
CREATE POLICY "Students can view own registrations" ON event_registrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students s
            JOIN users u ON s.user_id = u.id
            WHERE s.id = event_registrations.student_id 
            AND auth.uid()::text = u.id::text
        )
    );

-- Students can register for events
CREATE POLICY "Students can register for events" ON event_registrations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM students s
            JOIN users u ON s.user_id = u.id
            WHERE s.id = event_registrations.student_id 
            AND auth.uid()::text = u.id::text
        )
    );

-- Students can cancel their own registrations
CREATE POLICY "Students can cancel own registrations" ON event_registrations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM students s
            JOIN users u ON s.user_id = u.id
            WHERE s.id = event_registrations.student_id 
            AND auth.uid()::text = u.id::text
        )
    );

-- Organizers can view registrations for their events
CREATE POLICY "Organizers can view event registrations" ON event_registrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events e
            JOIN organizers o ON e.organizer_id = o.id
            JOIN users u ON o.user_id = u.id
            WHERE e.id = event_registrations.event_id 
            AND auth.uid()::text = u.id::text
        )
    );

-- =============================================
-- VENUES AND CATEGORIES (PUBLIC READ)
-- =============================================

-- Everyone can view venues
CREATE POLICY "Everyone can view venues" ON venues
    FOR SELECT USING (true);

-- Everyone can view blocks
CREATE POLICY "Everyone can view blocks" ON blocks
    FOR SELECT USING (true);

-- Everyone can view event categories
CREATE POLICY "Everyone can view categories" ON event_categories
    FOR SELECT USING (true);

-- =============================================
-- ADMIN POLICIES
-- =============================================

-- Admins can do everything on all tables
CREATE POLICY "Admins full access users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM administrators a
            JOIN users u ON a.user_id = u.id
            WHERE auth.uid()::text = u.id::text
        )
    );

CREATE POLICY "Admins full access venues" ON venues
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM administrators a
            JOIN users u ON a.user_id = u.id
            WHERE auth.uid()::text = u.id::text
        )
    );

CREATE POLICY "Admins full access blocks" ON blocks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM administrators a
            JOIN users u ON a.user_id = u.id
            WHERE auth.uid()::text = u.id::text
        )
    );

CREATE POLICY "Admins full access categories" ON event_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM administrators a
            JOIN users u ON a.user_id = u.id
            WHERE auth.uid()::text = u.id::text
        )
    );

-- =============================================
-- RLS SETUP COMPLETE
-- =============================================

SELECT 'RLS policies created successfully!' as status;
