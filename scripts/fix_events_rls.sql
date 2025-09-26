-- Fix RLS policies for events table to allow organizers to create events
-- This addresses the "new row violates row-level security policy for table events" error

-- First, check current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'events'
ORDER BY policyname;

-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "events_insert_policy" ON events;
DROP POLICY IF EXISTS "events_select_policy" ON events;
DROP POLICY IF EXISTS "events_update_policy" ON events;
DROP POLICY IF EXISTS "events_delete_policy" ON events;

-- Enable RLS on events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create new policies that work with the custom auth system

-- 1. Allow organizers to insert events (they own)
CREATE POLICY "organizers_can_create_events" ON events
FOR INSERT 
WITH CHECK (
    organizer_id IN (
        SELECT o.id 
        FROM organizers o 
        JOIN users u ON o.user_id = u.id 
        WHERE u.id = current_setting('app.current_user_id', true)::integer
    )
);

-- 2. Allow everyone to view approved events
CREATE POLICY "everyone_can_view_approved_events" ON events
FOR SELECT 
USING (status = 'approved');

-- 3. Allow organizers to view their own events (any status)
CREATE POLICY "organizers_can_view_own_events" ON events
FOR SELECT 
USING (
    organizer_id IN (
        SELECT o.id 
        FROM organizers o 
        JOIN users u ON o.user_id = u.id 
        WHERE u.id = current_setting('app.current_user_id', true)::integer
    )
);

-- 4. Allow admins to view all events
CREATE POLICY "admins_can_view_all_events" ON events
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = current_setting('app.current_user_id', true)::integer 
        AND user_type = 'admin'
    )
);

-- 5. Allow organizers to update their own events
CREATE POLICY "organizers_can_update_own_events" ON events
FOR UPDATE 
USING (
    organizer_id IN (
        SELECT o.id 
        FROM organizers o 
        JOIN users u ON o.user_id = u.id 
        WHERE u.id = current_setting('app.current_user_id', true)::integer
    )
)
WITH CHECK (
    organizer_id IN (
        SELECT o.id 
        FROM organizers o 
        JOIN users u ON o.user_id = u.id 
        WHERE u.id = current_setting('app.current_user_id', true)::integer
    )
);

-- 6. Allow admins to update any event
CREATE POLICY "admins_can_update_all_events" ON events
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = current_setting('app.current_user_id', true)::integer 
        AND user_type = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = current_setting('app.current_user_id', true)::integer 
        AND user_type = 'admin'
    )
);

-- TEMPORARY BYPASS: If the above policies don't work with your auth system,
-- you can temporarily disable RLS on events table for testing:
-- ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- Alternative: Create a function to handle event creation with proper permissions
CREATE OR REPLACE FUNCTION create_event_for_organizer(
    p_title VARCHAR(200),
    p_description TEXT,
    p_category VARCHAR(50),
    p_organizer_user_id INTEGER,
    p_venue_id INTEGER,
    p_event_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_max_participants INTEGER,
    p_registration_deadline DATE,
    p_registration_fee NUMERIC DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    v_organizer_id INTEGER;
    v_event_id INTEGER;
BEGIN
    -- Get organizer ID from user ID
    SELECT id INTO v_organizer_id 
    FROM organizers 
    WHERE user_id = p_organizer_user_id;
    
    IF v_organizer_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Organizer not found');
    END IF;
    
    -- Insert the event
    INSERT INTO events (
        title,
        description,
        organizer_id,
        venue_id,
        category,
        event_date,
        start_time,
        end_time,
        max_participants,
        registration_deadline,
        registration_fee,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_title,
        p_description,
        v_organizer_id,
        p_venue_id,
        p_category,
        p_event_date,
        p_start_time,
        p_end_time,
        p_max_participants,
        p_registration_deadline,
        p_registration_fee,
        'pending',
        NOW(),
        NOW()
    ) RETURNING id INTO v_event_id;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Event created successfully',
        'event_id', v_event_id
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
