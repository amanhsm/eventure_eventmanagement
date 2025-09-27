-- =============================================
-- FIX VENUE is_active COLUMN ERROR
-- Add missing is_active column to venues table
-- =============================================

-- Check if is_active column exists, if not add it
DO $$ 
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'venues' 
        AND column_name = 'is_active'
    ) THEN
        -- Add the missing column
        ALTER TABLE venues ADD COLUMN is_active BOOLEAN DEFAULT true;
        
        -- Update all existing venues to be active
        UPDATE venues SET is_active = true WHERE is_active IS NULL;
        
        RAISE NOTICE 'Added is_active column to venues table';
    ELSE
        RAISE NOTICE 'is_active column already exists in venues table';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'venues' 
AND column_name = 'is_active';

-- Show all venues with their active status
SELECT 
    id,
    venue_name,
    is_active,
    max_capacity
FROM venues 
ORDER BY venue_name;

SELECT 'Fixed is_active column issue!' as status;
