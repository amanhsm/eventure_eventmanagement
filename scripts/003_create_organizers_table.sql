-- Create organizers table
CREATE TABLE organizers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    events_created_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_organizers_user_id ON organizers(user_id);
CREATE INDEX idx_organizers_department ON organizers(department);

-- Enable RLS
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Organizers can view their own data" ON organizers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = organizers.user_id 
            AND auth.uid()::text = users.id::text
        )
    );

CREATE POLICY "Organizers can update their own data" ON organizers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = organizers.user_id 
            AND auth.uid()::text = users.id::text
        )
    );
