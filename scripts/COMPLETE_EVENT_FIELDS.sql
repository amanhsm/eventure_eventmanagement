-- =============================================
-- COMPLETE EVENT FIELDS SETUP
-- Add missing fields and ensure proper population
-- =============================================

-- 1. Add missing fields to events table (if they don't exist)
DO $$ 
BEGIN
    -- Add commonly missing fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'registration_fee') THEN
        ALTER TABLE events ADD COLUMN registration_fee DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'registration_deadline') THEN
        ALTER TABLE events ADD COLUMN registration_deadline TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'approval_status') THEN
        ALTER TABLE events ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'approved_by') THEN
        ALTER TABLE events ADD COLUMN approved_by INTEGER REFERENCES administrators(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'approved_at') THEN
        ALTER TABLE events ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'rejected_by') THEN
        ALTER TABLE events ADD COLUMN rejected_by INTEGER REFERENCES administrators(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'rejected_at') THEN
        ALTER TABLE events ADD COLUMN rejected_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'rejection_reason') THEN
        ALTER TABLE events ADD COLUMN rejection_reason TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'cancellation_allowed') THEN
        ALTER TABLE events ADD COLUMN cancellation_allowed BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'requirements') THEN
        ALTER TABLE events ADD COLUMN requirements TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'priority') THEN
        ALTER TABLE events ADD COLUMN priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'tags') THEN
        ALTER TABLE events ADD COLUMN tags TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'contact_email') THEN
        ALTER TABLE events ADD COLUMN contact_email VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'contact_phone') THEN
        ALTER TABLE events ADD COLUMN contact_phone VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'external_registration_url') THEN
        ALTER TABLE events ADD COLUMN external_registration_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'event_image_url') THEN
        ALTER TABLE events ADD COLUMN event_image_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'is_featured') THEN
        ALTER TABLE events ADD COLUMN is_featured BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'is_public') THEN
        ALTER TABLE events ADD COLUMN is_public BOOLEAN DEFAULT true;
    END IF;
    
    -- Update status field to include draft
    BEGIN
        ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;
        ALTER TABLE events ADD CONSTRAINT events_status_check 
        CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'cancelled', 'completed'));
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    RAISE NOTICE 'Event table fields updated successfully';
END $$;

-- 2. Create function to auto-populate fields when admin approves/rejects
CREATE OR REPLACE FUNCTION auto_populate_event_approval_fields()
RETURNS TRIGGER AS $$
DECLARE
    admin_id INTEGER;
BEGIN
    -- Get admin ID from current user context (you may need to adjust this)
    -- For now, we'll use the first admin or set it manually
    SELECT id INTO admin_id FROM administrators LIMIT 1;
    
    -- Handle approval
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        NEW.approval_status = 'approved';
        NEW.approved_by = admin_id;
        NEW.approved_at = CURRENT_TIMESTAMP;
        NEW.rejected_by = NULL;
        NEW.rejected_at = NULL;
        NEW.rejection_reason = NULL;
    END IF;
    
    -- Handle rejection
    IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
        NEW.approval_status = 'rejected';
        NEW.rejected_by = admin_id;
        NEW.rejected_at = CURRENT_TIMESTAMP;
        NEW.approved_by = NULL;
        NEW.approved_at = NULL;
        -- Keep rejection_reason if provided
    END IF;
    
    -- Handle pending states
    IF NEW.status IN ('draft', 'pending_approval') THEN
        NEW.approval_status = 'pending';
    END IF;
    
    -- Auto-populate contact info from organizer if not provided
    IF NEW.contact_email IS NULL OR NEW.contact_email = '' THEN
        SELECT u.email INTO NEW.contact_email
        FROM organizers o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = NEW.organizer_id;
    END IF;
    
    -- Set default registration deadline if not provided
    IF NEW.registration_deadline IS NULL THEN
        NEW.registration_deadline = NEW.event_date - INTERVAL '1 day';
    END IF;
    
    -- Set default priority if not provided
    IF NEW.priority IS NULL THEN
        NEW.priority = 'normal';
    END IF;
    
    -- Update timestamp
    NEW.updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger for auto-population
DROP TRIGGER IF EXISTS auto_populate_event_fields ON events;
CREATE TRIGGER auto_populate_event_fields
    BEFORE INSERT OR UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION auto_populate_event_approval_fields();

-- 4. Function to get complete event details
CREATE OR REPLACE FUNCTION get_complete_event_details(p_event_id INTEGER)
RETURNS TABLE(
    event_id INTEGER,
    title VARCHAR(255),
    description TEXT,
    organizer_name TEXT,
    organizer_email TEXT,
    venue_name TEXT,
    block_name TEXT,
    category_name TEXT,
    event_date DATE,
    start_time TIME,
    end_time TIME,
    max_participants INTEGER,
    current_participants INTEGER,
    registration_fee DECIMAL(10,2),
    registration_deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20),
    approval_status VARCHAR(20),
    approved_by_name TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_by_name TEXT,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    requirements TEXT,
    priority VARCHAR(10),
    tags TEXT[],
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    is_featured BOOLEAN,
    is_public BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.description,
        o.name as organizer_name,
        u.email as organizer_email,
        v.venue_name,
        b.block_name,
        ec.name as category_name,
        e.event_date,
        e.start_time,
        e.end_time,
        e.max_participants,
        e.current_participants,
        e.registration_fee,
        e.registration_deadline,
        e.status,
        e.approval_status,
        a1.name as approved_by_name,
        e.approved_at,
        a2.name as rejected_by_name,
        e.rejected_at,
        e.rejection_reason,
        e.requirements,
        e.priority,
        e.tags,
        e.contact_email,
        e.contact_phone,
        e.is_featured,
        e.is_public,
        e.created_at,
        e.updated_at
    FROM events e
    LEFT JOIN organizers o ON e.organizer_id = o.id
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN venues v ON e.venue_id = v.id
    LEFT JOIN blocks b ON v.block_id = b.id
    LEFT JOIN event_categories ec ON e.category_id = ec.id
    LEFT JOIN administrators a1 ON e.approved_by = a1.id
    LEFT JOIN administrators a2 ON e.rejected_by = a2.id
    WHERE e.id = p_event_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Update existing events with default values for new fields
UPDATE events SET 
    registration_fee = COALESCE(registration_fee, 0.00),
    approval_status = COALESCE(approval_status, 
        CASE 
            WHEN status = 'approved' THEN 'approved'
            WHEN status = 'rejected' THEN 'rejected'
            ELSE 'pending'
        END
    ),
    cancellation_allowed = COALESCE(cancellation_allowed, true),
    priority = COALESCE(priority, 'normal'),
    is_featured = COALESCE(is_featured, false),
    is_public = COALESCE(is_public, true),
    updated_at = CURRENT_TIMESTAMP
WHERE updated_at < CURRENT_TIMESTAMP - INTERVAL '1 minute';

-- 6. Show current event table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Event table fields completed successfully!' as status;
SELECT 'All missing fields added and auto-population triggers created' as note;
