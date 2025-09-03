-- Create students table
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 4),
    semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
    course VARCHAR(100) NOT NULL,
    events_registered_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_department ON students(department);

-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Students can view their own data" ON students
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = students.user_id 
            AND auth.uid()::text = users.id::text
        )
    );

CREATE POLICY "Students can update their own data" ON students
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = students.user_id 
            AND auth.uid()::text = users.id::text
        )
    );
