-- =============================================
-- TEMPORARY: DISABLE STORAGE RLS FOR TESTING
-- This will allow uploads to work while we debug the policy issue
-- =============================================

-- Check current RLS status
SELECT 
    '📋 CURRENT RLS STATUS' as section,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- Temporarily disable RLS on storage.objects table
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    '✅ RLS STATUS AFTER DISABLE' as section,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- Show existing policies (they still exist but won't be enforced)
SELECT 
    '📋 EXISTING POLICIES (NOT ENFORCED)' as section,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

SELECT '⚠️ RLS TEMPORARILY DISABLED - TRY UPLOAD NOW!' as result;
SELECT '🔧 REMEMBER TO RE-ENABLE RLS AFTER TESTING!' as warning;
