-- Fix RLS Policies for Local Authentication System
-- Since the app uses local session storage instead of Supabase Auth,
-- we need to disable RLS or create policies that work without auth.uid()

-- ==================================================
-- OPTION 1: Disable RLS on tables that managers need to insert
-- ==================================================

-- For QR Codes table
ALTER TABLE qr_codes DISABLE ROW LEVEL SECURITY;

-- For Color Codes table
ALTER TABLE color_codes DISABLE ROW LEVEL SECURITY;

-- For Numeric Codes table
ALTER TABLE numeric_codes DISABLE ROW LEVEL SECURITY;

-- ==================================================
-- OPTION 2: Keep RLS but allow INSERT for authenticated role
-- (Comment out OPTION 1 above if using this approach)
-- ==================================================

/*
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Location managers manage color codes" ON color_codes;
DROP POLICY IF EXISTS "Employees view active color codes" ON color_codes;
DROP POLICY IF EXISTS "Anyone can read active color codes" ON color_codes;

DROP POLICY IF EXISTS "Location managers manage numeric codes" ON numeric_codes;
DROP POLICY IF EXISTS "Employees view active numeric codes" ON numeric_codes;
DROP POLICY IF EXISTS "Anyone can read active numeric codes" ON numeric_codes;

DROP POLICY IF EXISTS "Location managers manage QR codes" ON qr_codes;
DROP POLICY IF EXISTS "Employees view active QR codes" ON qr_codes;
DROP POLICY IF EXISTS "Anyone can read active QR codes" ON qr_codes;

-- Create permissive policies for authenticated users
CREATE POLICY "Allow all operations on qr_codes"
  ON qr_codes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on color_codes"
  ON color_codes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on numeric_codes"
  ON numeric_codes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
*/

-- ==================================================
-- Add helpful comment
-- ==================================================
COMMENT ON TABLE qr_codes IS 'RLS disabled to support local auth system';
COMMENT ON TABLE color_codes IS 'RLS disabled to support local auth system';
COMMENT ON TABLE numeric_codes IS 'RLS disabled to support local auth system';
