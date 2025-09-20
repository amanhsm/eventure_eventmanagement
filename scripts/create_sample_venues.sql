-- Sample data insertion for testing venues functionality
-- Run this if you haven't run the full migration yet

-- Create blocks table if it doesn't exist
CREATE TABLE IF NOT EXISTS blocks (
    id SERIAL PRIMARY KEY,
    block_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert block data
INSERT INTO blocks (block_name) VALUES 
    ('Block I'),
    ('Block II'), 
    ('Block IV'),
    ('Central Block')
ON CONFLICT (block_name) DO NOTHING;

-- Create venues table if it doesn't exist
CREATE TABLE IF NOT EXISTS venues (
    id SERIAL PRIMARY KEY,
    block_id INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
    venue_name VARCHAR(200) NOT NULL,
    max_capacity INTEGER NOT NULL CHECK (max_capacity > 0),
    availability BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(block_id, venue_name)
);

-- Insert venue data
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
    ((SELECT id FROM blocks WHERE block_name = 'Central Block'), 'SKYVIEW', 300, true)
ON CONFLICT (block_id, venue_name) DO NOTHING;

-- Verify the data
SELECT 
    b.block_name,
    v.venue_name,
    v.max_capacity,
    v.availability
FROM venues v
JOIN blocks b ON v.block_id = b.id
ORDER BY b.block_name, v.venue_name;
