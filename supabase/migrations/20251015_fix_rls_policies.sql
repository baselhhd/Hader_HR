-- Fix RLS Policies - Remove infinite recursion
-- Drop existing problematic policies first

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Super admins see all" ON users;
DROP POLICY IF EXISTS "HR sees company data" ON users;
DROP POLICY IF EXISTS "Employees see own records" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new, safe policies for users table
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- For attendance_records, fix the policies
DROP POLICY IF EXISTS "Employees see own records" ON attendance_records;
DROP POLICY IF EXISTS "Location managers see location records" ON attendance_records;

CREATE POLICY "Employees can read own attendance"
  ON attendance_records FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "Employees can insert own attendance"
  ON attendance_records FOR INSERT
  WITH CHECK (employee_id = auth.uid());

-- For leave_requests
DROP POLICY IF EXISTS "Employees see own leave requests" ON leave_requests;

CREATE POLICY "Employees can read own leave requests"
  ON leave_requests FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "Employees can create leave requests"
  ON leave_requests FOR INSERT
  WITH CHECK (employee_id = auth.uid());

-- For employees table
DROP POLICY IF EXISTS "Employees can read own data" ON employees;

CREATE POLICY "Employees can read own employee data"
  ON employees FOR SELECT
  USING (user_id = auth.uid());

-- For verification_requests
CREATE POLICY "Employees can read own verification requests"
  ON verification_requests FOR SELECT
  USING (employee_id = auth.uid());

-- For custom_requests
CREATE POLICY "Employees can read own custom requests"
  ON custom_requests FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "Employees can create custom requests"
  ON custom_requests FOR INSERT
  WITH CHECK (employee_id = auth.uid());

-- Allow public read for QR codes, color codes, numeric codes (needed for attendance)
CREATE POLICY "Anyone can read active QR codes"
  ON qr_codes FOR SELECT
  USING (expires_at > NOW());

CREATE POLICY "Anyone can read active color codes"
  ON color_codes FOR SELECT
  USING (expires_at > NOW());

CREATE POLICY "Anyone can read active numeric codes"
  ON numeric_codes FOR SELECT
  USING (expires_at > NOW());

-- Allow authenticated users to read companies, branches, locations, shifts
CREATE POLICY "Authenticated users can read companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read branches"
  ON branches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read locations"
  ON locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read shifts"
  ON shifts FOR SELECT
  TO authenticated
  USING (true);
