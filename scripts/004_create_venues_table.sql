-- Create venues table
CREATE TABLE venues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL,
    location VARCHAR(255) NOT NULL,
    facilities TEXT[],
    availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'maintenance', 'unavailable')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_venues_capacity ON venues(capacity);
CREATE INDEX idx_venues_status ON venues(availability_status);

-- Enable RLS
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- RLS Policies - All authenticated users can view venues
CREATE POLICY "All users can view venues" ON venues
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can modify venues
CREATE POLICY "Only admins can modify venues" ON venues
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.user_type = 'admin' 
            AND auth.uid()::text = users.id::text
        )
    );
