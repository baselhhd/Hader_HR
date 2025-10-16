-- Fix RLS - Simple version (only existing tables)
-- نفّذ هذا في Supabase SQL Editor

-- ======================================================================
-- Part 1: تعطيل RLS على الجداول الموجودة
-- ======================================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;

-- ======================================================================
-- Part 2: حذف جميع policies من جدول users
-- ======================================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON users';
    END LOOP;
END $$;

-- ======================================================================
-- Part 3: إعادة تفعيل RLS
-- ======================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- ======================================================================
-- Part 4: إنشاء policies بسيطة جداً
-- ======================================================================

-- Users table policies
CREATE POLICY "anon_read_users"
  ON users FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "auth_read_own"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "auth_update_own"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Employees table policies
CREATE POLICY "employees_read"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "employees_update"
  ON employees FOR UPDATE
  TO authenticated
  USING (true);

-- Companies table policies
CREATE POLICY "companies_read"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

-- Branches table policies
CREATE POLICY "branches_read"
  ON branches FOR SELECT
  TO authenticated
  USING (true);

-- Locations table policies
CREATE POLICY "locations_read"
  ON locations FOR SELECT
  TO authenticated
  USING (true);

-- ======================================================================
-- تم! policies بسيطة بدون recursion
-- ======================================================================
