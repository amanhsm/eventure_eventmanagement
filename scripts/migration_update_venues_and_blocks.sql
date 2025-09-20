-- Migration script to normalize venues table and create blocks table
-- This script updates the venue structure for better organization and availability tracking

-- Step 1: Create blocks table
CREATE TABLE IF NOT EXISTS blocks (
    id SERIAL PRIMARY KEY,
    block_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Insert block data
INSERT INTO blocks (block_name) VALUES 
    ('Block I'),
    ('Block II'), 
    ('Block IV'),
    ('Central Block')
ON CONFLICT (block_name) DO NOTHING;

-- Step 3: Backup existing venues table (optional)
-- CREATE TABLE venues_backup AS SELECT * FROM venues;

-- Step 4: Drop existing venues table and recreate with new structure
DROP TABLE IF EXISTS venues CASCADE;

CREATE TABLE venues (
    id SERIAL PRIMARY KEY,
    block_id INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
    venue_name VARCHAR(200) NOT NULL,
    max_capacity INTEGER NOT NULL CHECK (max_capacity > 0),
    availability BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(block_id, venue_name)
);

-- Step 5: Insert venue data
INSERT INTO venues (block_id, venue_name, max_capacity, availability) VALUES
    -- Block II venues
    ((SELECT id FROM blocks WHERE block_name = 'Block II'), 'GD Rooms 604 A', 50, true),
    ((SELECT id FROM blocks WHERE block_name = 'Block II'), 'Meeting hall I 218', 30, true),
    
    -- Block I venues  
    ((SELECT id FROM blocks WHERE block_name = 'Block I'), 'Discussion Room 328', 16, true),
    ((SELECT id FROM blocks WHERE block_name = 'Block I'), 'Meeting Hall 2 214', 45, true),
    ((SELECT id FROM blocks WHERE block_name = 'Block I'), 'Meeting Hall III 329', 42, true),
    
    -- Block IV venues
    ((SELECT id FROM blocks WHERE block_name = 'Block IV'), 'Room no 110', 20, true),
    ((SELECT id FROM blocks WHERE block_name = 'Block IV'), 'Room No 119', 45, true),
    
    -- Central Block venues
    ((SELECT id FROM blocks WHERE block_name = 'Central Block'), '105 Central Block', 95, true),
    ((SELECT id FROM blocks WHERE block_name = 'Central Block'), '911', 200, true),
    ((SELECT id FROM blocks WHERE block_name = 'Central Block'), 'Conference Hall', 15, true),
    ((SELECT id FROM blocks WHERE block_name = 'Central Block'), 'SKYVIEW', 300, true);

-- Step 6: Create venue availability checking function
CREATE OR REPLACE FUNCTION check_venue_availability(
    p_venue_id INTEGER,
    p_event_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_exclude_event_id INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    -- Check for overlapping events at the same venue on the same date
    SELECT COUNT(*) INTO conflict_count
    FROM events 
    WHERE venue_id = p_venue_id 
        AND event_date = p_event_date
        AND (
            -- Check for time overlap
            (start_time <= p_end_time AND end_time >= p_start_time)
        )
        AND status IN ('approved', 'pending')
        AND (p_exclude_event_id IS NULL OR id != p_exclude_event_id);
    
    -- Return true if no conflicts found
    RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger to update venue availability
CREATE OR REPLACE FUNCTION update_venue_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- This function can be expanded to automatically update venue availability
    -- based on event bookings if needed
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 8: Update events table to ensure proper foreign key relationship
-- (This assumes events table already has venue_id column)
ALTER TABLE events 
DROP CONSTRAINT IF EXISTS events_venue_id_fkey;

ALTER TABLE events 
ADD CONSTRAINT events_venue_id_fkey 
FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE RESTRICT;

-- Step 9: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_venues_block_id ON venues(block_id);
CREATE INDEX IF NOT EXISTS idx_venues_availability ON venues(availability);
CREATE INDEX IF NOT EXISTS idx_events_venue_date ON events(venue_id, event_date);

-- Step 10: Verification queries
SELECT 
    b.block_name,
    v.venue_name,
    v.max_capacity,
    v.availability
FROM venues v
JOIN blocks b ON v.block_id = b.id
ORDER BY b.block_name, v.venue_name;

-- Check venue availability function
SELECT check_venue_availability(1, '2024-12-25', '10:00', '12:00') as is_available;
