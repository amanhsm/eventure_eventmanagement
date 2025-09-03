-- Create events table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    organizer_id INTEGER REFERENCES organizers(id) ON DELETE CASCADE,
    venue_id INTEGER REFERENCES venues(id),
    category VARCHAR(50) NOT NULL CHECK (category IN ('technical', 'cultural', 'sports', 'academic', 'other')),
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    registration_deadline DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
    approval_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_venue ON events(venue_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_status ON events(status);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- All users can view approved events
CREATE POLICY "All users can view approved events" ON events
    FOR SELECT USING (status = 'approved' OR auth.role() = 'authenticated');

-- Organizers can manage their own events
CREATE POLICY "Organizers can manage their own events" ON events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organizers o
            JOIN users u ON u.id = o.user_id
            WHERE o.id = events.organizer_id 
            AND auth.uid()::text = u.id::text
        )
    );

-- Admins can manage all events
CREATE POLICY "Admins can manage all events" ON events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.user_type = 'admin' 
            AND auth.uid()::text = users.id::text
        )
    );
