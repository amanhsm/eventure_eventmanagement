-- Remove "Central campus" from blocks as it's not a valid block
-- This addresses the requirement that "Central campus is not a block"
-- Based on the actual schema: blocks table with block_name, venues table with block_id

-- 1. Check current blocks and their venues
SELECT 
    b.id,
    b.block_name,
    COUNT(v.id) as venue_count
FROM blocks b
LEFT JOIN venues v ON b.id = v.block_id
GROUP BY b.id, b.block_name
ORDER BY b.block_name;

-- 2. Check if "Central campus" exists in blocks (vs "Central Block")
SELECT * FROM blocks 
WHERE LOWER(block_name) LIKE '%central%' AND LOWER(block_name) LIKE '%campus%';

-- 3. Check if "Central Block" exists (which should be renamed/removed per requirement)
SELECT * FROM blocks 
WHERE LOWER(block_name) LIKE '%central%block%';

-- 4. Show venues currently assigned to Central Block
SELECT 
    v.id,
    v.venue_name,
    v.max_capacity,
    b.block_name
FROM venues v
JOIN blocks b ON v.block_id = b.id
WHERE LOWER(b.block_name) LIKE '%central%';

-- 5. OPTION A: Remove "Central Block" and reassign venues to other blocks
-- (Uncomment after reviewing the data above)

-- Reassign Central Block venues to Block I (or choose appropriate block)
-- UPDATE venues 
-- SET block_id = (SELECT id FROM blocks WHERE block_name = 'Block I')
-- WHERE block_id = (SELECT id FROM blocks WHERE block_name = 'Central Block');

-- Then delete the Central Block
-- DELETE FROM blocks WHERE block_name = 'Central Block';

-- 6. OPTION B: Just rename "Central Block" to a proper block name
-- UPDATE blocks 
-- SET block_name = 'Block III' 
-- WHERE block_name = 'Central Block';

-- 7. OPTION C: Remove Central Block entirely and set venues to NULL block_id
-- (This would require making block_id nullable first)
-- ALTER TABLE venues ALTER COLUMN block_id DROP NOT NULL;
-- UPDATE venues SET block_id = NULL WHERE block_id = (SELECT id FROM blocks WHERE block_name = 'Central Block');
-- DELETE FROM blocks WHERE block_name = 'Central Block';

-- 8. Verify the changes after running your chosen option
-- SELECT 
--     b.id,
--     b.block_name,
--     COUNT(v.id) as venue_count
-- FROM blocks b
-- LEFT JOIN venues v ON b.id = v.block_id
-- GROUP BY b.id, b.block_name
-- ORDER BY b.block_name;

-- Note: 
-- 1. Run queries 1-4 first to understand your current data
-- 2. Choose Option A, B, or C based on your requirements
-- 3. Uncomment and run your chosen approach
-- 4. Run the verification query (step 8)
