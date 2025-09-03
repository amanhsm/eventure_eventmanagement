-- Create event registrations table
CREATE TABLE event_registrations (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled', 'attended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a student can only register once per event
    UNIQUE(student_id, event_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_registrations_student ON event_registrations(student_id);
CREATE INDEX idx_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_registrations_status ON event_registrations(status);

-- Enable RLS
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Students can view their own registrations
CREATE POLICY "Students can view their own registrations" ON event_registrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students s
            JOIN users u ON u.id = s.user_id
            WHERE s.id = event_registrations.student_id 
            AND auth.uid()::text = u.id::text
        )
    );

-- Students can register/cancel their own registrations
CREATE POLICY "Students can manage their own registrations" ON event_registrations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM students s
            JOIN users u ON u.id = s.user_id
            WHERE s.id = event_registrations.student_id 
            AND auth.uid()::text = u.id::text
        )
    );

-- Organizers can view registrations for their events
CREATE POLICY "Organizers can view their event registrations" ON event_registrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events e
            JOIN organizers o ON o.id = e.organizer_id
            JOIN users u ON u.id = o.user_id
            WHERE e.id = event_registrations.event_id 
            AND auth.uid()::text = u.id::text
        )
    );

-- Admins can view all registrations
CREATE POLICY "Admins can view all registrations" ON event_registrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.user_type = 'admin' 
            AND auth.uid()::text = users.id::text
        )
    );
