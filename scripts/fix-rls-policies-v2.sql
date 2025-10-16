-- Fix RLS Policies - Remove infinite recursion (Version 2)
-- يجب تنفيذ هذا في Supabase SQL Editor

-- 1. تعطيل RLS مؤقتاً على جدول users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. حذف جميع policies الموجودة على users (بما فيها القديمة والجديدة)
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can update own email and phone" ON users;
DROP POLICY IF EXISTS "Super admins see all" ON users;
DROP POLICY IF EXISTS "HR sees company data" ON users;
DROP POLICY IF EXISTS "Employees see own records" ON users;
DROP POLICY IF EXISTS "Allow username lookup for login" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON users;

-- 3. إعادة تفعيل RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 4. إنشاء policies بسيطة وصحيحة (3 فقط)

-- Policy 1: السماح للمستخدمين المصادق عليهم بقراءة بياناتهم الخاصة فقط
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: السماح للمستخدمين المصادق عليهم بتحديث بياناتهم الخاصة فقط
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: السماح للمستخدمين غير المصادق عليهم بالبحث عن username (للتسجيل الدخول)
CREATE POLICY "Allow username lookup for login"
  ON users FOR SELECT
  TO anon
  USING (true);

-- تم! الآن لدينا 3 policies فقط بدون أي تداخل أو recursion
