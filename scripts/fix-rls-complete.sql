-- Fix RLS Completely - Remove all policies and recreate from scratch
-- نفّذ هذا في Supabase SQL Editor

-- ======================================================================
-- Part 1: تعطيل RLS على جميع الجداول المرتبطة
-- ======================================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;

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
-- Part 3: إعادة تفعيل RLS على الجداول
-- ======================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- ======================================================================
-- Part 4: إنشاء policies بسيطة جداً على جدول users فقط
-- ======================================================================

-- Policy 1: للمستخدمين غير المسجلين - قراءة فقط لجدول users (للبحث عن username)
CREATE POLICY "anon_read_users"
  ON users FOR SELECT
  TO anon
  USING (true);

-- Policy 2: للمستخدمين المسجلين - قراءة بياناتهم فقط
CREATE POLICY "auth_read_own"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 3: للمستخدمين المسجلين - تحديث بياناتهم فقط
CREATE POLICY "auth_update_own"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ======================================================================
-- Part 5: policies بسيطة للجداول الأخرى (بدون تعقيد)
-- ======================================================================

-- Employees: قراءة وتحديث فقط للمستخدمين المسجلين
CREATE POLICY "employees_read"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "employees_update"
  ON employees FOR UPDATE
  TO authenticated
  USING (true);

-- Companies: قراءة للجميع
CREATE POLICY "companies_read"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

-- Branches: قراءة للجميع
CREATE POLICY "branches_read"
  ON branches FOR SELECT
  TO authenticated
  USING (true);

-- Locations: قراءة للجميع
CREATE POLICY "locations_read"
  ON locations FOR SELECT
  TO authenticated
  USING (true);

-- Attendance: المستخدمون يمكنهم قراءة وإنشاء سجلات الحضور
CREATE POLICY "attendance_read"
  ON attendance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "attendance_insert"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "attendance_update"
  ON attendance FOR UPDATE
  TO authenticated
  USING (true);

-- ======================================================================
-- تم! الآن جميع الـ policies بسيطة وواضحة بدون أي recursion
-- ======================================================================
