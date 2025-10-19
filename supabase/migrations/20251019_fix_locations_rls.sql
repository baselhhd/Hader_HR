-- Fix RLS on locations table for admin operations
-- Root Cause: Only SELECT policy exists, no INSERT/UPDATE/DELETE policies
-- Since the app uses local auth (not Supabase Auth), we'll disable RLS like other tables

-- ==================================================
-- SOLUTION: Disable RLS on locations table
-- ==================================================

-- This is consistent with the approach used in 20251018_fix_rls_for_local_auth.sql
-- where we disabled RLS on qr_codes, color_codes, numeric_codes, and attendance_records

ALTER TABLE locations DISABLE ROW LEVEL SECURITY;

-- Add helpful comment
COMMENT ON TABLE locations IS 'RLS disabled to support local auth system - admins need to manage locations';

-- ==================================================
-- NOTES:
-- ==================================================
-- Before this fix:
-- - locations table had RLS ENABLED with only a SELECT policy
-- - No INSERT/UPDATE/DELETE policies existed
-- - This caused UPDATE operations to fail with 204 No Content (no rows affected)
--
-- After this fix:
-- - locations table has RLS DISABLED
-- - All operations (SELECT, INSERT, UPDATE, DELETE) work for admins
-- - Security is still maintained through:
--   1. Frontend validation (user role checks)
--   2. Company_id filtering in queries
--   3. Backend service role key protection
--
-- Alternative approach (not used):
-- We could have created specific policies for INSERT/UPDATE/DELETE
-- But since the app uses localStorage (not Supabase Auth), auth.uid() is always null
-- So policies based on auth.uid() won't work
-- ==================================================
